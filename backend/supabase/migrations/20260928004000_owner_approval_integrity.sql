begin;

-- Signed approvals must update the action request and append its approval ledger
-- entry in the same database transaction. The API verifies the Android P-256
-- signature first; this function atomically records the already-verified result.
create or replace function public.approve_owner_action_request(
  p_user_id uuid,
  p_action_request_id uuid,
  p_device_key_id text,
  p_signature_b64 text,
  p_action_hash text
)
returns table (
  id uuid,
  kind text,
  title text,
  status text,
  risk text,
  reversible boolean
)
language sql
security definer
set search_path = ''
as $$
  with updated as (
    update public.owner_action_requests as ar
       set status = 'approved',
           decided_at = clock_timestamp(),
           approved_device_key_id = p_device_key_id,
           approval_signature_b64 = p_signature_b64
     where ar.id = p_action_request_id
       and ar.user_id = p_user_id
       and ar.status = 'pending'
       and ar.estimated_cost_usd = 0
       and ar.expires_at > clock_timestamp()
       and ar.payload->>'action_hash' = p_action_hash
    returning ar.id, ar.kind, ar.title, ar.status, ar.risk, ar.reversible
  ), logged as (
    insert into public.owner_action_ledger (
      user_id,
      action_request_id,
      action_type,
      summary,
      status,
      metadata
    )
    select
      p_user_id,
      u.id,
      u.kind,
      'Device-approved: ' || u.title,
      'approved',
      jsonb_build_object(
        'device_key_id', p_device_key_id,
        'action_hash', p_action_hash,
        'risk', u.risk,
        'reversible', u.reversible
      )
    from updated u
    returning action_request_id
  )
  select u.id, u.kind, u.title, u.status, u.risk, u.reversible
    from updated u
    join logged l on l.action_request_id = u.id;
$$;

revoke execute on function public.approve_owner_action_request(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.approve_owner_action_request(uuid, uuid, text, text, text)
  to service_role;

-- Device registration and its audit event are atomic. A revoked key cannot silently
-- reactivate itself; re-enabling a revoked device requires an explicit administrative
-- recovery path rather than another signed registration request from that key.
create or replace function public.register_owner_device(
  p_user_id uuid,
  p_device_key_id text,
  p_public_key_spki_b64 text,
  p_label text
)
returns table (
  device_key_id text,
  label text,
  status text,
  created_at timestamptz,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with upserted as (
    insert into public.owner_devices as d (
      user_id, device_key_id, public_key_spki_b64, label, status, last_seen_at
    )
    values (
      p_user_id, p_device_key_id, p_public_key_spki_b64, p_label, 'active', clock_timestamp()
    )
    on conflict (user_id, device_key_id) do update
      set public_key_spki_b64 = excluded.public_key_spki_b64,
          label = excluded.label,
          last_seen_at = clock_timestamp()
      where d.status = 'active'
    returning d.device_key_id, d.label, d.status, d.created_at, d.last_seen_at
  ), logged as (
    insert into public.owner_action_ledger (
      user_id, action_type, summary, status, metadata
    )
    select
      p_user_id,
      'register_owner_device',
      'Registered owner device: ' || u.label,
      'executed',
      jsonb_build_object('device_key_id', u.device_key_id)
    from upserted u
    returning id
  )
  select u.device_key_id, u.label, u.status, u.created_at, u.last_seen_at
    from upserted u
   where exists (select 1 from logged);
$$;

revoke execute on function public.register_owner_device(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_owner_device(uuid, text, text, text)
  to service_role;

-- Browser/control-console decisions also update the request and append its audit
-- event atomically. Device-signature policy is enforced by the API before this
-- function is called.
create or replace function public.decide_owner_action_request(
  p_user_id uuid,
  p_action_request_id uuid,
  p_decision text
)
returns table (
  id uuid,
  kind text,
  title text,
  status text,
  risk text,
  reversible boolean
)
language sql
security definer
set search_path = ''
as $$
  with updated as (
    update public.owner_action_requests as ar
       set status = p_decision,
           decided_at = clock_timestamp()
     where ar.id = p_action_request_id
       and ar.user_id = p_user_id
       and ar.status = 'pending'
       and p_decision in ('approved', 'rejected')
    returning ar.id, ar.kind, ar.title, ar.status, ar.risk, ar.reversible
  ), logged as (
    insert into public.owner_action_ledger (
      user_id, action_request_id, action_type, summary, status, metadata
    )
    select
      p_user_id,
      u.id,
      u.kind,
      case when p_decision = 'approved' then 'Approved: ' else 'Rejected: ' end || u.title,
      p_decision,
      jsonb_build_object('risk', u.risk, 'reversible', u.reversible)
    from updated u
    returning action_request_id
  )
  select u.id, u.kind, u.title, u.status, u.risk, u.reversible
    from updated u
    join logged l on l.action_request_id = u.id;
$$;

revoke execute on function public.decide_owner_action_request(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.decide_owner_action_request(uuid, uuid, text)
  to service_role;

-- These tables are append-only audit records. Application code may read and append,
-- but it must not rewrite or delete history through the service-role client.
revoke update, delete, truncate on table public.owner_action_ledger from service_role;
grant select, insert on table public.owner_action_ledger to service_role;

revoke update, delete, truncate on table public.quoaraai_action_ledger from service_role;
grant select, insert on table public.quoaraai_action_ledger to service_role;

commit;

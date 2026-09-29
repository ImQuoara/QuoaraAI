begin;

create table if not exists public.owner_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key_id text not null check (device_key_id ~ '^[0-9a-fA-F]{64}$'),
  public_key_spki_b64 text not null check (char_length(public_key_spki_b64) between 80 and 2048),
  label text not null default 'Android Owner Device' check (char_length(label) between 1 and 120),
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  unique (user_id, device_key_id)
);

alter table public.owner_action_requests
  add column if not exists approved_device_key_id text,
  add column if not exists approval_signature_b64 text;

create index if not exists owner_devices_user_status_idx
  on public.owner_devices(user_id, status, created_at desc);
create index if not exists owner_action_ledger_action_request_idx
  on public.owner_action_ledger(action_request_id);

alter table public.owner_devices enable row level security;
revoke all privileges on table public.owner_devices from public, anon, authenticated;
grant select, insert, update, delete on table public.owner_devices to service_role;

commit;

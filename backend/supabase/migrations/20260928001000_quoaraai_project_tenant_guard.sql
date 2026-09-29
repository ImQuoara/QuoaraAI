begin;

-- Defense-in-depth for privileged server writes. RLS does not protect writes
-- performed through the service role, so every QuoaraAi record that binds both a
-- user and project must prove that the project belongs to that same user.
create or replace function public.enforce_quoaraai_project_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.project_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.quoaraai_projects p
    where p.id = new.project_id
      and p.user_id = new.user_id
  ) then
    raise exception 'QuoaraAi project/user ownership mismatch'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_quoaraai_project_owner() from public, anon, authenticated;
grant execute on function public.enforce_quoaraai_project_owner() to service_role;

do $$
declare
  t text;
  trigger_name text;
begin
  foreach t in array array[
    'quoaraai_goals',
    'quoaraai_memories',
    'quoaraai_learning_candidates',
    'quoaraai_action_requests',
    'quoaraai_action_ledger',
    'quoaraai_watchers',
    'quoaraai_cost_events',
    'quoaraai_assets',
    'quoaraai_evaluations',
    'quoaraai_snapshots'
  ] loop
    trigger_name := t || '_project_owner_guard';
    execute format('drop trigger if exists %I on public.%I', trigger_name, t);
    execute format(
      'create trigger %I before insert or update of user_id, project_id on public.%I for each row execute function public.enforce_quoaraai_project_owner()',
      trigger_name,
      t
    );
  end loop;
end $$;

commit;

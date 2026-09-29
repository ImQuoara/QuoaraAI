begin;

-- Browser users may read owned messages through RLS, but all message writes now
-- go through the trusted Next.js server using a Supabase secret key.
drop policy if exists "messages_insert_via_owned_conversation" on public.messages;
revoke all privileges on table public.messages from public, anon, authenticated;
grant select on table public.messages to authenticated;
grant select, insert, update, delete on table public.messages to service_role;

-- Milestone 1 has no trusted database-stored system-message feature.
-- Remove any pre-release rows before tightening the role constraint.
delete from public.messages where role = 'system';
alter table public.messages drop constraint if exists messages_role_check;
alter table public.messages
  add constraint messages_role_check check (role in ('user', 'assistant'));

-- Profiles are read-only from the application in Milestone 1.
drop policy if exists "profiles_update_own" on public.profiles;
revoke all privileges on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

-- Conversations remain user-managed, with RLS providing tenant isolation.
revoke all privileges on table public.conversations from public, anon, authenticated;
grant select, insert, update, delete on table public.conversations to authenticated;
grant select, insert, update, delete on table public.conversations to service_role;

-- Atomic, server-only fixed-window limiter: 20 accepted chat attempts / 60 seconds.
create table if not exists public.rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  request_count integer not null default 0 check (request_count between 0 and 21),
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
revoke all privileges on table public.rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.rate_limits to service_role;

create or replace function public.consume_chat_rate_limit(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
begin
  insert into public.rate_limits as rl (user_id, request_count, window_start)
  values (p_user_id, 1, v_now)
  on conflict (user_id) do update
    set request_count = case
          when rl.window_start <= v_now - interval '60 seconds' then 1
          else least(rl.request_count + 1, 21)
        end,
        window_start = case
          when rl.window_start <= v_now - interval '60 seconds' then v_now
          else rl.window_start
        end
  returning request_count into v_count;

  return v_count <= 20;
end;
$$;

revoke execute on function public.consume_chat_rate_limit(uuid) from public, anon, authenticated;
grant execute on function public.consume_chat_rate_limit(uuid) to service_role;

-- Trigger functions should not be callable as public RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_conversation_on_message() from public, anon, authenticated;

commit;

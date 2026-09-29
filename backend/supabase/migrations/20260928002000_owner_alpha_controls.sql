begin;

-- Minimal control-plane tables required by the phone-first owner alpha.
-- These are intentionally separate from the future Milestone 2 intelligence
-- schema so chat/research/image can ship without deploying unfinished features.

create table if not exists public.owner_action_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  risk text not null default 'low' check (risk in ('low','medium','high','critical')),
  reversible boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  estimated_cost_usd numeric(12,6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','executed','failed','cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  executed_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.owner_action_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_request_id uuid references public.owner_action_requests(id) on delete set null,
  action_type text not null,
  summary text not null check (char_length(summary) between 1 and 1000),
  status text not null check (status in ('proposed','approved','rejected','executed','failed','reverted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_cost_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text not null,
  operation text not null,
  input_units bigint check (input_units is null or input_units >= 0),
  output_units bigint check (output_units is null or output_units >= 0),
  estimated_cost_usd numeric(12,6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  actual_cost_usd numeric(12,6) check (actual_cost_usd is null or actual_cost_usd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists owner_action_requests_user_status_idx
  on public.owner_action_requests(user_id, status, created_at desc);
create index if not exists owner_action_ledger_user_created_idx
  on public.owner_action_ledger(user_id, created_at desc);
create index if not exists owner_cost_events_user_created_idx
  on public.owner_cost_events(user_id, created_at desc);

alter table public.owner_action_requests enable row level security;
alter table public.owner_action_ledger enable row level security;
alter table public.owner_cost_events enable row level security;

-- Browser clients get zero direct privileges. All control-plane writes and reads
-- are performed through authenticated server routes after owner verification.
revoke all privileges on table public.owner_action_requests from public, anon, authenticated;
revoke all privileges on table public.owner_action_ledger from public, anon, authenticated;
revoke all privileges on table public.owner_cost_events from public, anon, authenticated;

grant select, insert, update, delete on table public.owner_action_requests to service_role;
grant select, insert, update, delete on table public.owner_action_ledger to service_role;
grant select, insert, update, delete on table public.owner_cost_events to service_role;

commit;

begin;

create table if not exists public.quoaraai_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quoaraai_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  status text not null default 'active' check (status in ('active','blocked','completed','cancelled')),
  priority integer not null default 0 check (priority between -100 and 100),
  progress integer not null default 0 check (progress between 0 and 100),
  target_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quoaraai_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete cascade,
  kind text not null check (kind in ('fact','preference','decision','context','relationship')),
  content text not null check (char_length(content) between 1 and 5000),
  source_type text not null default 'user' check (source_type in ('user','chat','file','tool','derived')),
  source_ref text,
  confidence numeric(4,3) not null default 1 check (confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.quoaraai_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  version integer not null default 1 check (version >= 1),
  procedure jsonb not null default '{}'::jsonb,
  permissions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','disabled')),
  success_count integer not null default 0 check (success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, version)
);

create table if not exists public.quoaraai_learning_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete cascade,
  kind text not null check (kind in ('memory','skill','routing_rule','workflow_improvement')),
  payload jsonb not null,
  rationale text not null default '' check (char_length(rationale) <= 5000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.quoaraai_action_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete cascade,
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

create table if not exists public.quoaraai_action_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete set null,
  action_request_id uuid references public.quoaraai_action_requests(id) on delete set null,
  action_type text not null,
  summary text not null check (char_length(summary) between 1 and 1000),
  status text not null check (status in ('proposed','approved','rejected','executed','failed','reverted')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.quoaraai_watchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  condition jsonb not null,
  schedule text,
  enabled boolean not null default false,
  last_checked_at timestamptz,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.quoaraai_cost_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete set null,
  provider text not null,
  model text not null,
  operation text not null,
  input_units bigint check (input_units is null or input_units >= 0),
  output_units bigint check (output_units is null or output_units >= 0),
  estimated_cost_usd numeric(12,6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  actual_cost_usd numeric(12,6) check (actual_cost_usd is null or actual_cost_usd >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.quoaraai_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete cascade,
  kind text not null check (kind in ('image','video','audio','document','code','url','other')),
  name text not null check (char_length(name) between 1 and 300),
  uri text not null check (char_length(uri) between 1 and 4000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.quoaraai_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete set null,
  dimension text not null,
  score numeric(4,3) not null check (score between 0 and 1),
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.quoaraai_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.quoaraai_projects(id) on delete set null,
  scope_kind text not null,
  scope_ref text,
  label text not null check (char_length(label) between 1 and 200),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists quoaraai_projects_user_updated_idx on public.quoaraai_projects(user_id, updated_at desc);
create index if not exists quoaraai_goals_user_status_idx on public.quoaraai_goals(user_id, status, priority desc);
create index if not exists quoaraai_memories_user_status_idx on public.quoaraai_memories(user_id, status, created_at desc);
create index if not exists quoaraai_action_requests_user_status_idx on public.quoaraai_action_requests(user_id, status, created_at desc);
create index if not exists quoaraai_action_ledger_user_created_idx on public.quoaraai_action_ledger(user_id, created_at desc);

alter table public.quoaraai_projects enable row level security;
alter table public.quoaraai_goals enable row level security;
alter table public.quoaraai_memories enable row level security;
alter table public.quoaraai_skills enable row level security;
alter table public.quoaraai_learning_candidates enable row level security;
alter table public.quoaraai_action_requests enable row level security;
alter table public.quoaraai_action_ledger enable row level security;
alter table public.quoaraai_watchers enable row level security;
alter table public.quoaraai_cost_events enable row level security;
alter table public.quoaraai_assets enable row level security;
alter table public.quoaraai_evaluations enable row level security;
alter table public.quoaraai_snapshots enable row level security;

-- All QuoaraAi intelligence writes go through authenticated server routes using the
-- Supabase secret key. Browser clients receive no direct privileges on these
-- tables, which keeps approval and audit logic centralized.
do $$
declare
  t text;
begin
  foreach t in array array[
    'quoaraai_projects','quoaraai_goals','quoaraai_memories','quoaraai_skills','quoaraai_learning_candidates',
    'quoaraai_action_requests','quoaraai_action_ledger','quoaraai_watchers','quoaraai_cost_events',
    'quoaraai_assets','quoaraai_evaluations','quoaraai_snapshots'
  ] loop
    execute format('revoke all privileges on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

commit;

-- =============================================================================
-- Salary Coach AI — initial schema
-- PostgreSQL (Supabase). Money is stored as integer PAISE (bigint) to avoid
-- floating point errors. 1 rupee = 100 paise. Every domain table is scoped to a
-- user via user_id and protected by Row Level Security (RLS).
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type risk_profile as enum ('conservative', 'balanced', 'aggressive');
create type tax_regime as enum ('old', 'new');
create type subscription_tier as enum ('free', 'pro', 'premium', 'enterprise');
create type income_type as enum ('salary', 'bonus', 'variable', 'rental', 'other');
create type cadence as enum ('monthly', 'quarterly', 'annual', 'one_time');
create type expense_category as enum (
  'rent', 'emi', 'food', 'transport', 'utilities', 'subscriptions',
  'family_support', 'health', 'discretionary', 'other'
);
create type savings_bucket as enum ('liquid', 'emergency', 'goal_linked', 'fd', 'rd', 'other');
create type asset_class as enum (
  'mf', 'equity', 'epf', 'ppf', 'nps', 'fd', 'rd', 'gold',
  'esop', 'rsu', 'real_estate', 'crypto', 'other'
);
create type debt_type as enum (
  'home', 'car', 'personal', 'education', 'credit_card', 'bnpl', 'other'
);
create type goal_type as enum (
  'emergency', 'house', 'car', 'marriage', 'vacation', 'child_education',
  'retirement', 'business', 'debt_free', 'custom'
);
create type goal_status as enum ('on_track', 'at_risk', 'achieved', 'paused');
create type recommendation_category as enum (
  'debt', 'emergency', 'investment', 'tax', 'savings',
  'spending_limit', 'goal', 'insurance', 'behavior'
);
create type recommendation_status as enum ('suggested', 'accepted', 'dismissed', 'done', 'snoozed');
create type conversation_mode as enum ('chat', 'command_center');
create type message_role as enum ('user', 'assistant', 'system', 'tool');
create type notification_type as enum (
  'payday', 'bill_due', 'goal_milestone', 'risk_alert', 'tax_deadline', 'streak', 'coaching'
);

-- -----------------------------------------------------------------------------
-- users  (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  age smallint check (age between 16 and 100),
  marital_status text,
  dependents jsonb not null default '{}'::jsonb,
  risk_profile risk_profile not null default 'balanced',
  salary_dna_archetype text,
  tax_regime tax_regime not null default 'new',
  pay_day_of_month smallint check (pay_day_of_month between 1 and 31),
  city text,
  subscription_tier subscription_tier not null default 'free',
  onboarding_completed_at timestamptz,
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- financial_profiles  (aggregated snapshot for fast reads / AI context)
-- -----------------------------------------------------------------------------
create table public.financial_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  monthly_income_paise bigint not null default 0,
  expected_growth_pct numeric(5, 2) not null default 8.0,
  total_expenses_paise bigint not null default 0,
  total_savings_paise bigint not null default 0,
  total_investments_paise bigint not null default 0,
  total_debt_paise bigint not null default 0,
  emergency_months_target smallint not null default 6,
  emergency_fund_paise bigint not null default 0,
  monthly_surplus_paise bigint not null default 0,
  net_worth_paise bigint not null default 0,
  assumptions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- -----------------------------------------------------------------------------
-- income
-- -----------------------------------------------------------------------------
create table public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type income_type not null default 'salary',
  amount_paise bigint not null,
  is_in_hand boolean not null default true,
  frequency cadence not null default 'monthly',
  expected_growth_pct numeric(5, 2) not null default 8.0,
  source_label text,
  effective_from date not null default current_date,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- expenses
-- -----------------------------------------------------------------------------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category expense_category not null,
  label text,
  amount_paise bigint not null,
  is_essential boolean not null default true,
  is_recurring boolean not null default true,
  period cadence not null default 'monthly',
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- savings
-- -----------------------------------------------------------------------------
create table public.savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  bucket savings_bucket not null default 'liquid',
  label text,
  amount_paise bigint not null default 0,
  goal_id uuid,
  interest_rate numeric(5, 2),
  as_of date not null default current_date,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- investments
-- -----------------------------------------------------------------------------
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  asset_class asset_class not null,
  instrument_name text,
  current_value_paise bigint not null default 0,
  invested_value_paise bigint not null default 0,
  sip_amount_paise bigint,
  sip_day smallint check (sip_day between 1 and 31),
  expected_return_pct numeric(5, 2),
  as_of date not null default current_date,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- debts
-- -----------------------------------------------------------------------------
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type debt_type not null,
  label text,
  principal_outstanding_paise bigint not null default 0,
  emi_paise bigint not null default 0,
  interest_rate numeric(5, 2),
  tenure_months_remaining int,
  due_day smallint check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- goals
-- -----------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type goal_type not null default 'custom',
  name text not null,
  icon text,
  target_amount_paise bigint not null,
  current_amount_paise bigint not null default 0,
  target_date date,
  priority smallint not null default 1,
  monthly_contribution_paise bigint not null default 0,
  probability_of_success numeric(5, 2),
  status goal_status not null default 'on_track',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Link savings to goals once both exist.
alter table public.savings
  add constraint savings_goal_fk foreign key (goal_id)
  references public.goals (id) on delete set null;

-- -----------------------------------------------------------------------------
-- salary_blueprints  (one per pay cycle; allocation stored as jsonb lines)
-- -----------------------------------------------------------------------------
create table public.salary_blueprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  period_start date not null,
  period_end date,
  income_paise bigint not null,
  allocations jsonb not null default '[]'::jsonb,  -- [{ key, label, amount_paise, pct, rationale }]
  summary text,
  actions_total int not null default 0,
  actions_done int not null default 0,
  generated_by text not null default 'engine',  -- 'engine' | 'ai'
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- financial_scores  (append-only snapshots → trends)
-- -----------------------------------------------------------------------------
create table public.financial_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  health_score smallint not null check (health_score between 0 and 100),
  health_sub_scores jsonb not null default '{}'::jsonb,
  velocity_score smallint not null check (velocity_score between 0 and 100),
  velocity_factors jsonb not null default '{}'::jsonb,
  projected_fi_date date,
  inputs_snapshot jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- recommendations  (feeds the North Star: decisions executed)
-- -----------------------------------------------------------------------------
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  blueprint_id uuid references public.salary_blueprints (id) on delete set null,
  category recommendation_category not null,
  title text not null,
  body text,
  amount_paise bigint,
  rationale jsonb not null default '{}'::jsonb,
  impact_estimate jsonb not null default '{}'::jsonb,
  priority smallint not null default 1,
  status recommendation_status not null default 'suggested',
  acted_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- ai_conversations + ai_messages
-- -----------------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mode conversation_mode not null default 'chat',
  title text,
  summary text,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role message_role not null,
  content text not null,
  tool_name text,
  tool_payload jsonb,
  tokens int,
  model text,
  created_at timestamptz not null default now()
);

-- Long-term AI memory (durable facts/decisions/preferences) with embeddings.
create table public.ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  kind text not null,  -- 'decision' | 'preference' | 'fact' | 'summary'
  content text not null,
  embedding vector(1536),
  source_conversation_id uuid references public.ai_conversations (id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  deep_link text,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Indexes (read patterns are almost always per-user, time-ordered)
-- =============================================================================
create index idx_financial_profiles_user on public.financial_profiles (user_id);
create index idx_income_user on public.income (user_id, effective_from desc);
create index idx_expenses_user on public.expenses (user_id, occurred_on desc);
create index idx_savings_user on public.savings (user_id);
create index idx_investments_user on public.investments (user_id);
create index idx_debts_user on public.debts (user_id);
create index idx_goals_user on public.goals (user_id, priority);
create index idx_blueprints_user on public.salary_blueprints (user_id, period_start desc);
create index idx_scores_user on public.financial_scores (user_id, computed_at desc);
create index idx_recos_user on public.recommendations (user_id, status, priority);
create index idx_convos_user on public.ai_conversations (user_id, last_message_at desc);
create index idx_messages_convo on public.ai_messages (conversation_id, created_at);
create index idx_notifications_user on public.notifications (user_id, created_at desc);
create index idx_ai_memory_user on public.ai_memory (user_id);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.financial_profiles
  for each row execute function public.set_updated_at();
create trigger trg_goals_updated before update on public.goals
  for each row execute function public.set_updated_at();

-- =============================================================================
-- New auth user → create public.users + empty financial profile
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  insert into public.financial_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security — every table: a user can only touch their own rows.
-- =============================================================================
alter table public.users enable row level security;
alter table public.financial_profiles enable row level security;
alter table public.income enable row level security;
alter table public.expenses enable row level security;
alter table public.savings enable row level security;
alter table public.investments enable row level security;
alter table public.debts enable row level security;
alter table public.goals enable row level security;
alter table public.salary_blueprints enable row level security;
alter table public.financial_scores enable row level security;
alter table public.recommendations enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_memory enable row level security;
alter table public.notifications enable row level security;

-- users: id IS the auth uid.
create policy "users self access" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Helper macro pattern applied per table: owner can do everything on own rows.
create policy "own profiles" on public.financial_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own income" on public.income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own savings" on public.savings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own investments" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own debts" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own blueprints" on public.salary_blueprints
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own scores" on public.financial_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recommendations" on public.recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own conversations" on public.ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.ai_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own memory" on public.ai_memory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

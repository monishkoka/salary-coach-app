-- =============================================================================
-- Salary Coach AI — "Next Level" upgrade schema
-- Adds: historical salary blueprints comparison, future projections, wealth
-- velocity & financial health history, payday events, AI recommendation history,
-- analytics events, and subscription/entitlements. Money stays as integer PAISE.
-- All tables are user-scoped and protected by Row Level Security.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type scenario_id as enum (
  'current', 'save_more', 'invest_aggressive', 'reduce_lifestyle'
);
create type retirement_readiness as enum ('weak', 'moderate', 'strong');
create type insight_theme as enum (
  'spending', 'savings', 'salary', 'wealth', 'behavior', 'forecast'
);
create type payday_status as enum ('created', 'in_progress', 'completed', 'skipped');

-- -----------------------------------------------------------------------------
-- future_projections  (Money GPS + Future Self snapshots, append-only)
-- One row per computed simulation so we can show how a user's projected future
-- improved over time (a powerful retention/engagement signal).
-- -----------------------------------------------------------------------------
create table public.future_projections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  scenario scenario_id not null default 'current',
  -- Sampled trajectory: [{ month, net_worth_paise, savings_paise, investments_paise }]
  points jsonb not null default '[]'::jsonb,
  net_worth_1y_paise bigint not null default 0,
  net_worth_3y_paise bigint not null default 0,
  net_worth_5y_paise bigint not null default 0,
  net_worth_10y_paise bigint not null default 0,
  goals_achievable smallint not null default 0,
  retirement retirement_readiness not null default 'moderate',
  assumptions jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- money_gps_routes  (current vs recommended route snapshots)
-- -----------------------------------------------------------------------------
create table public.money_gps_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  emergency_months_current smallint,
  emergency_months_recommended smallint,
  goal_etas_current jsonb not null default '[]'::jsonb,   -- [{ goal_id, name, months }]
  goal_etas_recommended jsonb not null default '[]'::jsonb,
  retirement_current retirement_readiness not null default 'moderate',
  retirement_recommended retirement_readiness not null default 'moderate',
  velocity_current smallint not null default 0,
  velocity_recommended smallint not null default 0,
  correction text,
  computed_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- payday_events  (the special payday experience + completion tracking)
-- -----------------------------------------------------------------------------
create table public.payday_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  blueprint_id uuid references public.salary_blueprints (id) on delete set null,
  income_paise bigint not null,
  allocation jsonb not null default '[]'::jsonb,
  predicted_net_worth_paise bigint,
  predicted_for_year smallint,
  actions_total int not null default 0,
  actions_done int not null default 0,
  status payday_status not null default 'created',
  celebrated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- -----------------------------------------------------------------------------
-- insights  (deterministic insights feed, persisted for read/unread + analytics)
-- -----------------------------------------------------------------------------
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  theme insight_theme not null,
  headline text not null,
  body text,
  sentiment smallint not null default 0 check (sentiment between -1 and 1),
  series jsonb,
  relevance_score numeric(5, 2) not null default 0,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- analytics_events  (product analytics; mirrors the client EventName union)
-- Stored India-resident; no PII beyond user_id. Feeds retention/North Star.
-- -----------------------------------------------------------------------------
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- subscriptions  (entitlement source of truth; Apple IAP receipts plug in later)
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  tier subscription_tier not null default 'free',
  status text not null default 'active',          -- active | trialing | canceled | expired
  store text,                                      -- 'apple' | 'google' | 'promo'
  store_transaction_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- -----------------------------------------------------------------------------
-- Indexes (per-user, time-ordered reads)
-- -----------------------------------------------------------------------------
create index idx_projections_user on public.future_projections (user_id, computed_at desc);
create index idx_gps_user on public.money_gps_routes (user_id, computed_at desc);
create index idx_payday_user on public.payday_events (user_id, celebrated_at desc);
create index idx_insights_user on public.insights (user_id, created_at desc);
create index idx_analytics_user on public.analytics_events (user_id, occurred_at desc);
create index idx_analytics_event on public.analytics_events (event, occurred_at desc);
create index idx_subscriptions_user on public.subscriptions (user_id);

-- updated_at trigger reuse (function defined in 0001).
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Seed a free subscription row when a user is created (extends 0001 handler).
create or replace function public.handle_new_user_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, tier)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.handle_new_user_subscription();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.future_projections enable row level security;
alter table public.money_gps_routes enable row level security;
alter table public.payday_events enable row level security;
alter table public.insights enable row level security;
alter table public.analytics_events enable row level security;
alter table public.subscriptions enable row level security;

create policy "own projections" on public.future_projections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own gps routes" on public.money_gps_routes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own payday events" on public.payday_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own insights" on public.insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own analytics" on public.analytics_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subscription" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

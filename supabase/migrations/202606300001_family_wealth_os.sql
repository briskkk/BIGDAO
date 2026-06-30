create extension if not exists "pgcrypto";

create type public.family_role as enum ('owner', 'editor', 'viewer');
create type public.account_type as enum ('brokerage', 'bank', 'fund_platform', 'cash', 'property', 'private_equity', 'insurance', 'other');
create type public.liquidity_status as enum ('liquid', 'restricted', 'illiquid');
create type public.asset_type as enum ('stock', 'etf', 'mutual_fund', 'bond', 'gold', 'cash', 'property', 'private_equity', 'crypto', 'other');
create type public.market_type as enum ('CN', 'HK', 'US', 'FUND', 'OTC', 'OTHER');
create type public.transaction_type as enum ('buy', 'sell', 'subscribe', 'redeem', 'dividend', 'interest', 'transfer_in', 'transfer_out', 'fx_exchange', 'fee', 'adjustment', 'valuation_update');
create type public.transaction_source as enum ('manual', 'csv_import', 'seed', 'api_future');
create type public.quote_type as enum ('realtime', 'delayed', 'nav', 'estimated_nav', 'manual');
create type public.import_status as enum ('uploaded', 'validated', 'imported', 'partially_imported', 'failed', 'reverted');
create type public.audit_action as enum ('create', 'update', 'delete', 'import', 'restore');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text not null default 'CNY',
  timezone text not null default 'Asia/Shanghai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.family_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique(family_id, user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  institution text,
  account_type public.account_type not null default 'other',
  currency text not null default 'CNY',
  market public.market_type not null default 'OTHER',
  owner_name text,
  is_active boolean not null default true,
  is_included_in_net_worth boolean not null default true,
  is_included_in_investable_assets boolean not null default true,
  liquidity_status public.liquidity_status not null default 'liquid',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  symbol text not null,
  name text not null,
  asset_type public.asset_type not null,
  market public.market_type not null default 'OTHER',
  currency text not null default 'CNY',
  isin text,
  provider_codes jsonb not null default '{}'::jsonb,
  is_manual_valuation boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(family_id, symbol, market)
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  account_id uuid references public.accounts(id),
  filename text not null,
  source_type text not null default 'generic_csv',
  uploaded_at timestamptz not null default now(),
  imported_at timestamptz,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  status public.import_status not null default 'uploaded',
  created_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  instrument_id uuid references public.instruments(id),
  transaction_type public.transaction_type not null,
  trade_at timestamptz not null,
  settle_at timestamptz,
  quantity numeric(20,8) not null default 0,
  price numeric(20,8) not null default 0,
  gross_amount numeric(20,4) not null default 0,
  fee_amount numeric(20,4) not null default 0,
  tax_amount numeric(20,4) not null default 0,
  currency text not null default 'CNY',
  fx_rate_to_base numeric(20,8) not null default 1,
  cash_amount numeric(20,4) not null default 0,
  reference_no text,
  notes text,
  source public.transaction_source not null default 'manual',
  import_batch_id uuid references public.import_batches(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.manual_valuations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  instrument_id uuid not null references public.instruments(id),
  valuation_date date not null,
  value_amount numeric(20,4) not null,
  currency text not null default 'CNY',
  fx_rate_to_base numeric(20,8) not null default 1,
  source text not null default 'manual',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, instrument_id, valuation_date)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instruments(id) on delete cascade,
  quote_time timestamptz not null,
  price numeric(20,8) not null,
  currency text not null,
  source text not null default 'manual',
  quote_type public.quote_type not null default 'manual',
  created_at timestamptz not null default now()
);

create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  quote_currency text not null,
  rate numeric(20,8) not null,
  quote_time timestamptz not null,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  target_amount numeric(20,4) not null,
  currency text not null default 'CNY',
  current_age integer not null,
  target_age integer not null,
  target_date date,
  monthly_contribution numeric(20,4) not null default 0,
  expected_annual_return numeric(10,6) not null default 0.07,
  include_account_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid,
  action public.audit_action not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger families_set_updated_at before update on public.families for each row execute function public.set_updated_at();
create trigger accounts_set_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger instruments_set_updated_at before update on public.instruments for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger manual_valuations_set_updated_at before update on public.manual_valuations for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals for each row execute function public.set_updated_at();

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_id = target_family_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_family_role(target_family_id uuid, allowed_roles public.family_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_id = target_family_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.current_user_family_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id from public.family_members where user_id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.families (name)
  values (coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)) || ' 的家庭')
  returning id into new_family_id;

  insert into public.family_members (family_id, user_id, role)
  values (new_family_id, new.id, 'owner')
  on conflict (family_id, user_id) do nothing;

  insert into public.accounts (family_id, name, institution, account_type, currency, market, owner_name, liquidity_status, is_included_in_net_worth, is_included_in_investable_assets, notes)
  values
    (new_family_id, '家庭现金账户', 'Family', 'cash', 'CNY', 'OTHER', coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'liquid', true, true, '注册时创建的默认现金账户');

  insert into public.goals (family_id, name, target_amount, currency, current_age, target_age, monthly_contribution, expected_annual_return)
  values (new_family_id, '40 岁前可自由投资金融资产达到 1,500 万', 15000000, 'CNY', 31, 40, 30000, 0.07);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.accounts enable row level security;
alter table public.instruments enable row level security;
alter table public.transactions enable row level security;
alter table public.manual_valuations enable row level security;
alter table public.quotes enable row level security;
alter table public.fx_rates enable row level security;
alter table public.goals enable row level security;
alter table public.import_batches enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles: users read own profile" on public.profiles for select using (id = auth.uid());
create policy "profiles: users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "families: members can read their families" on public.families for select using (public.is_family_member(id));
create policy "families: owners can update family settings" on public.families for update using (public.has_family_role(id, array['owner']::public.family_role[])) with check (public.has_family_role(id, array['owner']::public.family_role[]));

create policy "family_members: members can read family roster" on public.family_members for select using (public.is_family_member(family_id));
create policy "family_members: owners manage members" on public.family_members for all using (public.has_family_role(family_id, array['owner']::public.family_role[])) with check (public.has_family_role(family_id, array['owner']::public.family_role[]));

create policy "accounts: members read active family accounts" on public.accounts for select using (public.is_family_member(family_id));
create policy "accounts: owners and editors create accounts only inside their families" on public.accounts for insert with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));
create policy "accounts: owners and editors update accounts in their families" on public.accounts for update using (public.has_family_role(family_id, array['owner','editor']::public.family_role[])) with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));

create policy "instruments: members read family instruments" on public.instruments for select using (public.is_family_member(family_id));
create policy "instruments: owners and editors create instruments only inside their families" on public.instruments for insert with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));
create policy "instruments: owners and editors update instruments in their families" on public.instruments for update using (public.has_family_role(family_id, array['owner','editor']::public.family_role[])) with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));

create policy "transactions: members read family transactions" on public.transactions for select using (public.is_family_member(family_id));
create policy "transactions: owners and editors create transactions only inside their families" on public.transactions for insert with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));
create policy "transactions: owners and editors update transactions in their families" on public.transactions for update using (public.has_family_role(family_id, array['owner','editor']::public.family_role[])) with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));

create policy "manual_valuations: members read family valuations" on public.manual_valuations for select using (public.is_family_member(family_id));
create policy "manual_valuations: owners and editors create valuations only inside their families" on public.manual_valuations for insert with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));
create policy "manual_valuations: owners and editors update valuations in their families" on public.manual_valuations for update using (public.has_family_role(family_id, array['owner','editor']::public.family_role[])) with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));

create policy "quotes: members read quotes for family instruments" on public.quotes for select using (
  exists (select 1 from public.instruments i where i.id = instrument_id and public.is_family_member(i.family_id))
);
create policy "quotes: owners and editors create quotes for family instruments" on public.quotes for insert with check (
  exists (select 1 from public.instruments i where i.id = instrument_id and public.has_family_role(i.family_id, array['owner','editor']::public.family_role[]))
);

create policy "fx_rates: authenticated users read fx rates" on public.fx_rates for select using (auth.uid() is not null);
create policy "fx_rates: authenticated users create manual fx rates" on public.fx_rates for insert with check (auth.uid() is not null);

create policy "goals: members read family goals" on public.goals for select using (public.is_family_member(family_id));
create policy "goals: owners and editors create goals only inside their families" on public.goals for insert with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));
create policy "goals: owners and editors update goals in their families" on public.goals for update using (public.has_family_role(family_id, array['owner','editor']::public.family_role[])) with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));

create policy "import_batches: members read family imports" on public.import_batches for select using (public.is_family_member(family_id));
create policy "import_batches: owners and editors create imports only inside their families" on public.import_batches for insert with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));
create policy "import_batches: owners and editors update imports in their families" on public.import_batches for update using (public.has_family_role(family_id, array['owner','editor']::public.family_role[])) with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));

create policy "audit_logs: members read family audit logs" on public.audit_logs for select using (public.is_family_member(family_id));
create policy "audit_logs: owners and editors append audit logs" on public.audit_logs for insert with check (public.has_family_role(family_id, array['owner','editor']::public.family_role[]));

create index accounts_family_deleted_idx on public.accounts(family_id, deleted_at);
create index accounts_family_type_idx on public.accounts(family_id, account_type);
create index instruments_family_deleted_idx on public.instruments(family_id, deleted_at);
create index instruments_family_symbol_idx on public.instruments(family_id, symbol, market);
create index transactions_family_trade_idx on public.transactions(family_id, trade_at desc);
create index transactions_account_trade_idx on public.transactions(account_id, trade_at desc);
create index transactions_instrument_idx on public.transactions(instrument_id);
create index transactions_deleted_idx on public.transactions(deleted_at);
create index manual_valuations_latest_idx on public.manual_valuations(family_id, account_id, instrument_id, valuation_date desc);
create index quotes_instrument_time_idx on public.quotes(instrument_id, quote_time desc);
create index goals_family_deleted_idx on public.goals(family_id, deleted_at);
create index import_batches_family_status_idx on public.import_batches(family_id, status, uploaded_at desc);
create index audit_logs_family_entity_idx on public.audit_logs(family_id, entity_type, entity_id, created_at desc);

-- ============================================================
-- NexControl — BILLING / SUBSCRIPTION SYSTEM
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar campos de trial e subscription no tenants
alter table tenants add column if not exists trial_start timestamptz default now();
alter table tenants add column if not exists trial_end timestamptz default (now() + interval '7 days');
alter table tenants add column if not exists subscription_status text default 'trial';
-- subscription_status: 'trial' | 'active' | 'expired' | 'cancelled'

-- 2. Tabela de subscriptions
create table if not exists subscriptions (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  status text not null default 'active',
  plan_base numeric not null default 39.90,
  price_per_operator numeric not null default 19.90,
  operator_count integer not null default 0,
  total_amount numeric not null default 39.90,
  payment_method text,
  external_id text,
  starts_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "subscriptions: tenant owner ve"
  on subscriptions for select using (
    tenant_id = public.get_my_tenant_id()
  );
create policy "subscriptions: tenant owner cria"
  on subscriptions for insert with check (
    tenant_id = public.get_my_tenant_id()
  );
create policy "subscriptions: tenant owner atualiza"
  on subscriptions for update using (
    tenant_id = public.get_my_tenant_id()
  );

create index if not exists idx_subscriptions_tenant on subscriptions(tenant_id);

-- 3. Tabela de payments (historico)
create table if not exists payments (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  subscription_id bigint references subscriptions(id),
  amount numeric not null,
  status text not null default 'pending',
  payment_method text,
  external_id text,
  description text,
  created_at timestamptz default now()
);

alter table payments enable row level security;

create policy "payments: tenant owner ve"
  on payments for select using (
    tenant_id = public.get_my_tenant_id()
  );
create policy "payments: tenant owner cria"
  on payments for insert with check (
    tenant_id = public.get_my_tenant_id()
  );

create index if not exists idx_payments_tenant on payments(tenant_id);

-- 4. Atualizar tenants existentes que nao tem trial_start
update tenants set
  trial_start = created_at,
  trial_end = created_at + interval '7 days',
  subscription_status = 'trial'
where trial_start is null;

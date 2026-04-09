-- ============================================================
-- NexControl — ASAAS PAYMENT INTEGRATION
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar asaas_customer_id no profiles
alter table profiles add column if not exists asaas_customer_id text;

-- 2. Tabela de pagamentos Asaas
create table if not exists asaas_payments (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  asaas_customer_id text,
  asaas_payment_id text unique,
  status text not null default 'PENDING',
  billing_type text default 'PIX',
  amount numeric not null,
  pix_payload text,
  pix_qr_code text,
  plan_id bigint references plans(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table asaas_payments enable row level security;

create policy "asaas_payments: tenant owner ve"
  on asaas_payments for select using (tenant_id = public.get_my_tenant_id());
create policy "asaas_payments: tenant owner cria"
  on asaas_payments for insert with check (tenant_id = public.get_my_tenant_id());

create index if not exists idx_asaas_payments_tenant on asaas_payments(tenant_id);
create index if not exists idx_asaas_payments_asaas_id on asaas_payments(asaas_payment_id);

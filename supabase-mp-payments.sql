-- ============================================================
-- NexControl — MERCADO PAGO PAYMENT INTEGRATION
-- Execute no Supabase SQL Editor
-- ============================================================

create table if not exists mp_payments (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  mp_payment_id text unique,
  status text not null default 'pending',
  amount numeric not null,
  pix_qr_code text,
  pix_qr_code_base64 text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table mp_payments enable row level security;

create policy "mp_payments: tenant owner ve"
  on mp_payments for select using (tenant_id = public.get_my_tenant_id());
create policy "mp_payments: tenant owner cria"
  on mp_payments for insert with check (tenant_id = public.get_my_tenant_id());

create index if not exists idx_mp_payments_tenant on mp_payments(tenant_id);
create index if not exists idx_mp_payments_mp_id on mp_payments(mp_payment_id);

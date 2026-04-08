-- ============================================================
-- NexControl — PLANOS POR PACOTES DE OPERADORES
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de planos
create table if not exists plans (
  id bigint generated always as identity primary key,
  name text not null,
  slug text unique not null,
  max_operators integer not null,
  discount_pct numeric not null default 0,
  base_price numeric not null default 39.90,
  operator_price numeric not null default 19.90,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table plans enable row level security;
create policy "plans: todos veem" on plans for select using (true);

-- 2. Inserir planos
insert into plans (name, slug, max_operators, discount_pct, sort_order) values
  ('Basico',        'basico',  1,  0,  1),
  ('Equipe 3',      'equipe3', 3,  15, 2),
  ('Equipe 5',      'equipe5', 5,  20, 3),
  ('Equipe 10',     'equipe10',10, 30, 4)
on conflict (slug) do nothing;

-- 3. Adicionar plan_id no tenants e subscriptions
alter table tenants add column if not exists plan_id bigint references plans(id);
alter table subscriptions add column if not exists plan_id bigint references plans(id);

-- 4. Vincular tenants existentes ao plano basico
update tenants set plan_id = (select id from plans where slug='basico' limit 1)
where plan_id is null;

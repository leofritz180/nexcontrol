-- ============================================================
-- NexControl — Ativacao do programa de afiliados
-- Comissao: 50% UNICA VEZ (so primeira mensalidade do indicado)
-- Liberacao: GERAL (todos admins ativos)
-- ============================================================

-- 1) Atualiza taxa default + ativa todos afiliados existentes
update affiliates set enabled = true, commission_rate = 0.50;

-- 2) Cria registro de afiliado pra TODO admin que ainda nao tem
insert into affiliates (tenant_id, code, enabled, commission_rate)
select
  p.tenant_id,
  substr(md5(p.tenant_id::text || random()::text), 1, 8),
  true,
  0.50
from profiles p
where p.role = 'admin'
  and p.tenant_id is not null
  and not exists (select 1 from affiliates a where a.tenant_id = p.tenant_id)
on conflict (tenant_id) do nothing;

-- 3) Adiciona coluna pix_key pra afiliado poder cadastrar e receber
alter table affiliates add column if not exists pix_key text;
alter table affiliates add column if not exists pix_type text; -- cpf|email|phone|random

-- 4) Adiciona coluna pix_paid_to + paid_by + paid_note nas comissoes pra rastreio
alter table affiliate_commissions add column if not exists pix_key text;
alter table affiliate_commissions add column if not exists paid_by text;
alter table affiliate_commissions add column if not exists paid_note text;

-- 5) Index pra perf da busca de comissoes pendentes
create index if not exists idx_ac_status_created on affiliate_commissions(status, created_at desc);

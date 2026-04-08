-- ============================================================
-- NexControl — FIX URGENTE: desbloquear criacao de meta e remessa
-- Execute no Supabase SQL Editor AGORA
-- ============================================================

-- 1. REMOVER policy restritiva de metas (que exige subscription ativa)
drop policy if exists "metas: cria no proprio tenant se ativo" on metas;
create policy "metas: cria no proprio tenant"
  on metas for insert with check (tenant_id = get_my_tenant_id());

-- 2. REMOVER policy restritiva de remessas (que bloqueia meta finalizada)
drop policy if exists "remessas: cria no proprio tenant se meta ativa" on remessas;
create policy "remessas: cria no proprio tenant"
  on remessas for insert with check (tenant_id = get_my_tenant_id());

-- 3. Garantir que update de metas funciona
drop policy if exists "metas: atualiza no proprio tenant" on metas;
create policy "metas: atualiza no proprio tenant"
  on metas for update using (tenant_id = get_my_tenant_id());

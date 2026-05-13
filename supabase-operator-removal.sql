-- ============================================================
-- NexControl — remoção de operador preservando histórico
-- Quando admin remove um operador, mantemos:
--   - profile do operador (com tenant_id=null pra perder acesso)
--   - histórico de metas/remessas/lucros atrelado ao profile_id
--   - 3 campos novos pra rastrear: quem removeu, quando, de qual tenant
--
-- Operador removido nao apaga nada do lucro do tenant — segue
-- visivel nos relatorios com badge "removido".
-- ============================================================

alter table profiles add column if not exists removed_from_tenant_id uuid references tenants(id) on delete set null;
alter table profiles add column if not exists removed_from_tenant_at timestamptz;
alter table profiles add column if not exists removed_by uuid references profiles(id) on delete set null;

-- Index pra admin consultar removidos do proprio tenant rapido
create index if not exists idx_profiles_removed_from_tenant
  on profiles(removed_from_tenant_id) where removed_from_tenant_id is not null;

-- Policy: admin do tenant pode LER profiles que foram removidos do seu tenant
-- (necessario pro relatorio historico do admin enxergar operadores removidos)
drop policy if exists "profiles: admin ve removidos do tenant" on profiles;
create policy "profiles: admin ve removidos do tenant"
  on profiles for select
  using (
    removed_from_tenant_id is not null
    and exists (
      select 1 from profiles p2
      where p2.id = auth.uid()
        and p2.role = 'admin'
        and p2.tenant_id = profiles.removed_from_tenant_id
    )
  );

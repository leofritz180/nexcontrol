-- ============================================================
-- NexControl — vincular contas migradas
-- Quando um cliente cria uma conta nova em vez de renovar a
-- antiga (caso Sheik Jones → Money), marcamos o tenant antigo
-- com migrated_to_tenant_id apontando pro novo. Assim:
--   - analises de churn nao contam como bloqueado
--   - dashboard owner pode mostrar 'migrou pra Money'
--   - historico financeiro permanece intacto
-- ============================================================

alter table tenants add column if not exists migrated_to_tenant_id uuid references tenants(id) on delete set null;
alter table tenants add column if not exists migrated_at timestamptz;

-- Index pra lookup rapido
create index if not exists idx_tenants_migrated_to on tenants(migrated_to_tenant_id) where migrated_to_tenant_id is not null;

-- Migracao manual: Sheik (trustoferta) → Money (enriquecendoonlineautomatico)
update tenants
set
  migrated_to_tenant_id = 'a69b4ff0-aaa5-47e4-ad14-749e24e51e1f',
  migrated_at = '2026-05-18T12:14:00+00:00'
where id = '498c9aa0-1e60-4d37-996d-980e002aeb17';

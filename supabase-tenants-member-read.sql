-- ============================================================
-- NexControl — membros do tenant podem ler o tenant
-- Necessario pro operador enxergar operation_model (modo BAU)
-- e demais configs globais quando acessa /meta/[id].
-- ============================================================

create policy "tenants: membros do tenant veem o proprio"
  on tenants for select
  using (
    exists (
      select 1 from profiles
      where profiles.tenant_id = tenants.id
        and profiles.id = auth.uid()
    )
  );

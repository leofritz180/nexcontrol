-- ============================================================
-- NexControl — periodos de plano (trimestral/semestral/anual)
-- Adiciona coluna plan_months pra rastrear o periodo escolhido
-- no momento da compra. Webhooks usam isso pra calcular o
-- expires_at correto (now + N meses).
--
-- 1 = mensal (default), 3 = trimestral, 6 = semestral, 12 = anual
-- ============================================================

alter table mp_payments add column if not exists plan_months int default 1;
alter table asaas_payments add column if not exists plan_months int default 1;
alter table subscriptions add column if not exists plan_months int default 1;

-- Index pra analytics
create index if not exists idx_subscriptions_plan_months on subscriptions(plan_months);

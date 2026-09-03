-- ─────────────────────────────────────────────────────────────────────────
-- REMOVER O TRIAL GRÁTIS — novo modelo "só entra se pagar" (20/08/2026).
-- Contexto: o trial vinha do DEFAULT das colunas em supabase-billing.sql
--   (trial_end default now()+7d, subscription_status default 'trial').
-- Em runtime, o signup já chama /api/tenant/start-unpaid que rebaixa a conta
-- nova de 'trial' -> 'expired'. Este SQL fecha a porta no nível do banco pra
-- não depender só da rota (belt-and-suspenders).
--
-- Aplicar no Supabase SQL editor (uma vez). NÃO afeta pagantes ('active').
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Novas contas nascem SEM trial (bloqueadas até pagar).
alter table tenants alter column trial_end set default null;
alter table tenants alter column subscription_status set default 'expired';

-- 2) (OPCIONAL — só rode se quiser cortar JÁ quem está em trial agora.)
--    Deixe comentado pra não bloquear retroativamente quem está testando.
-- update tenants
--   set subscription_status = 'expired', trial_end = null
--   where subscription_status = 'trial';

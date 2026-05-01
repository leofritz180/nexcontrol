-- ============================================================
-- NexControl — FIX: persistir operator_count no pagamento MP
-- Execute no Supabase SQL Editor (passos 1, 2 e 3 em ordem)
-- ============================================================
-- Problema: webhook estava contando operadores ATUAIS no momento
-- do pagamento e salvando como operator_count, ao inves do TOTAL
-- desejado. Cliente pagava por +1 operador mas ficava bloqueado.
-- ============================================================

-- ============================================================
-- PASSO 1 — Schema: persistir operator_count desejado nos pagamentos
-- ============================================================
alter table mp_payments add column if not exists operator_count int;


-- ============================================================
-- PASSO 2 — TRIAGE: ver quem pagou recentemente e o limite atual
-- (rode pra inspecionar antes do fix)
-- ============================================================
-- SELECT
--   t.id as tenant_id, t.nome, t.email,
--   mp.amount, mp.created_at as paid_at,
--   s.operator_count as current_limit,
--   s.id as sub_id,
--   (SELECT count(*) FROM profiles
--      WHERE tenant_id = t.id AND role = 'operator') as current_ops
-- FROM mp_payments mp
-- JOIN tenants t ON t.id = mp.tenant_id
-- LEFT JOIN subscriptions s ON s.external_id = mp.mp_payment_id
-- WHERE mp.status = 'approved'
--   AND mp.created_at > now() - interval '30 days'
-- ORDER BY mp.created_at DESC;


-- ============================================================
-- PASSO 3 — GRANDFATHER FIX: libera 1 vaga adicional em todas as
-- subs ativas onde operator_count <= current_ops (bloqueados).
-- Conservador: nunca rebaixa, soma +1 sobre o teto efetivo.
-- ============================================================
-- IMPORTANTE: revise o SELECT acima antes de rodar o UPDATE.
-- Se quiser fix seletivo, rode UPDATE com WHERE id IN ('sub_id_1', 'sub_id_2', ...)
-- ============================================================

WITH ops_per_tenant AS (
  SELECT tenant_id, count(*)::int AS n_ops
  FROM profiles
  WHERE role = 'operator'
  GROUP BY tenant_id
)
UPDATE subscriptions s
SET operator_count = GREATEST(
      coalesce(s.operator_count, 0),
      coalesce(o.n_ops, 0) + 1
    )
FROM ops_per_tenant o
WHERE s.tenant_id = o.tenant_id
  AND s.status = 'active'
  AND (s.expires_at IS NULL OR s.expires_at > now())
  AND coalesce(s.operator_count, 0) <= coalesce(o.n_ops, 0);

-- ============================================================
-- Verificacao apos o fix:
-- ============================================================
-- SELECT t.nome, t.email, s.operator_count, s.expires_at,
--   (SELECT count(*) FROM profiles WHERE tenant_id = t.id AND role = 'operator') as ops
-- FROM tenants t
-- JOIN subscriptions s ON s.tenant_id = t.id
-- WHERE s.status = 'active'
-- ORDER BY t.nome;

-- ═══════════════════════════════════════════════════════════════
-- Comprovante (foto dos saques) na remessa
-- Coluna nullable => não afeta nada existente. Rodar UMA vez no
-- projeto xtxusfvfrawjhmbhgbds → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════

alter table remessas add column if not exists comprovante_url text;

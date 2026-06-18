-- ═══════════════════════════════════════════════════════════════
-- Vários comprovantes (fotos dos saques) por remessa
-- Lista de URLs em jsonb. Nullable/default [] => não afeta nada.
-- A coluna antiga comprovante_url continua (guarda a 1ª foto p/ compat).
-- Rodar UMA vez no projeto xtxusfvfrawjhmbhgbds → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════

alter table remessas add column if not exists comprovantes jsonb default '[]'::jsonb;

-- ============================================================
-- NexControl — campo BAU por remessa
-- Usado em metas com operation_model = 'apenas_bau' onde o
-- operador registra o bonus de cada conta ja na remessa.
-- ============================================================

alter table remessas add column if not exists bau numeric default 0;

-- Index pra queries que somam bau por meta
create index if not exists idx_remessas_meta_bau on remessas(meta_id) where bau > 0;

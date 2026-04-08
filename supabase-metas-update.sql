-- ============================================================
-- NexControl — Adicionar colunas plataforma e rede na tabela metas
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

alter table metas add column if not exists plataforma text;
alter table metas add column if not exists rede text;

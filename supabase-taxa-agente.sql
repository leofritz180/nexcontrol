-- NexControl — Adicionar taxa agente/blogueira
alter table metas add column if not exists taxa_agente numeric default 0;

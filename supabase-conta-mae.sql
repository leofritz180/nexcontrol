-- ============================================================
-- NexControl — credenciais da conta mae por meta
-- Permite operador salvar link de acesso + login + senha da
-- conta mae naquela rede, pra acesso rapido nas remessas.
--
-- Acesso protegido por RLS (mesmas policies da tabela metas)
-- ============================================================

alter table metas add column if not exists conta_link text;
alter table metas add column if not exists conta_login text;
alter table metas add column if not exists conta_senha text;

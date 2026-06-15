-- ═══════════════════════════════════════════════════════════════
-- EQUIPES — custos por equipe (feature exclusiva DS MENTORIA 2.0)
-- Adiciona coluna `team` na tabela costs pra cada líder gerenciar os
-- custos da SUA equipe. Nullable => custos das outras contas ficam
-- team = null e nada muda pra elas.
-- Rodar UMA vez no projeto xtxusfvfrawjhmbhgbds → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════

alter table costs add column if not exists team text;
create index if not exists idx_costs_team on costs (tenant_id, team);

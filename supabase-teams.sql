-- ═══════════════════════════════════════════════════════════════
-- EQUIPES / OPERADOR LÍDER  (feature exclusiva DS MENTORIA 2.0)
-- 2 campos novos em profiles. Nullable / default false => não afeta
-- nenhuma outra conta (os demais ficam sem equipe).
-- Aplicar UMA vez no Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════

alter table profiles add column if not exists team text;
alter table profiles add column if not exists is_team_leader boolean not null default false;

-- índice pra filtrar operadores por equipe rápido
create index if not exists idx_profiles_team on profiles (tenant_id, team);

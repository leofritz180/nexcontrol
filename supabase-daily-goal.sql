-- Meta do Dia: alvo diário de depositantes por tenant (admin define no painel).
-- Progresso é calculado no client a partir das remessas do dia operacional.
alter table tenants add column if not exists daily_goal integer;

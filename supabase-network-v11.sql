-- Network v11: permissão por-usuário pra usar "@todos" (marca todos + push geral).
-- O owner liga/desliga isso no app (perfil da pessoa → "Liberar uso do @todos").
-- Sem isso, só a allowlist fixa (MENTION_ALL_EMAILS) consegue.
alter table network_profiles add column if not exists can_mention_all boolean not null default false;

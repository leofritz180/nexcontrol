-- Network v9: trava de remoção do selo Veterano (founder)
-- Quando o owner remove o Veterano de alguem, marca founder_revoked=true para
-- que o feed NAO reconceda o selo automaticamente no proximo carregamento.
alter table network_profiles add column if not exists founder_revoked boolean not null default false;

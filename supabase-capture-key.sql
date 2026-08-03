-- Chave de captura por operador (identifica quem envia os depositos pela
-- extensao, sem precisar de login por perfil/aba). Fica no config.js da
-- extensao — um valor por operador, gerado sob demanda no painel.
alter table profiles add column if not exists capture_key text;
create unique index if not exists idx_profiles_capture_key on profiles(capture_key) where capture_key is not null;

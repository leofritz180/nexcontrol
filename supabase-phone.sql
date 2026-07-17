-- Telefone (WhatsApp) do usuario — coletado no cadastro e exigido dos
-- usuarios existentes via modal "Confirme seus dados" (PhoneGate).
-- Formato armazenado: SO DIGITOS com codigo do pais, ex: 5532999999999
-- (pronto pra lista de disparo em massa).
alter table profiles add column if not exists phone text;
create index if not exists idx_profiles_phone on profiles(phone) where phone is not null;

-- NETWORK v7 — mensagem "semente" (owner simula um admin comentando). Rode 1x.
alter table network_messages add column if not exists fake_name text;

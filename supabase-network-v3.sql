-- NETWORK v3 — foto de perfil (avatar). Rode UMA VEZ. Idempotente.
alter table network_profiles add column if not exists avatar_url text;

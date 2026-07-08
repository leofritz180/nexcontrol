-- NETWORK v5 — moderacao: silenciar (mute/castigo de fala). Rode UMA VEZ. Idempotente.
alter table network_profiles add column if not exists muted_until timestamptz;
alter table network_profiles add column if not exists mute_reason text;

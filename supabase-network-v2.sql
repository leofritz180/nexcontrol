-- ═══════════════════════════════════════════════════════════════════════════
-- NETWORK v2 — foto nas mensagens, tag por usuario, e enxugar canais.
-- Rode UMA VEZ no SQL editor do Supabase (depois do supabase-network.sql).
-- Idempotente.
-- ═══════════════════════════════════════════════════════════════════════════

-- Foto anexada a mensagem (URL publica no bucket "network")
alter table network_messages add column if not exists image_url text;

-- Tag custom por usuario (definida pelo owner; aparece no chat)
alter table network_profiles add column if not exists tag text;

-- Remove os canais que sairam (cascade apaga as mensagens desses canais)
delete from network_channels where key in ('duvidas', 'oportunidades', 'offtopic');

-- ═══════════════════════════════════════════════════════════════════════════
-- NETWORK v12 — recibos de leitura ("visto por"). Cada usuário tem 1 marcador
-- por canal (last_read_at). "Quem viu a mensagem X" = quem tem last_read_at >=
-- created_at da mensagem. Eficiente (1 linha por usuário/canal, não por mensagem).
-- Só o OWNER consulta (via /api/network/seen). RLS deny-all como o resto.
-- Idempotente. Rode UMA VEZ no SQL editor do Supabase.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists network_channel_reads (
  user_id      uuid references profiles(id) on delete cascade,
  channel_id   uuid references network_channels(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);
create index if not exists idx_network_channel_reads_ch on network_channel_reads(channel_id, last_read_at desc);

alter table network_channel_reads enable row level security;

-- ═══════════════════════════════════════════════════════════════════════════
-- NETWORK — comunidade/chat entre ADMINs da NexControl (modulo social global).
--
-- SEGURANCA: RLS habilitada e SEM policies de leitura/escrita para anon/authenticated.
-- Isso NEGA todo acesso direto pelo client (anon key). TODO acesso passa pelas
-- API routes /api/network/* que usam a service_role (que ignora RLS) e validam:
--   token valido  ->  usuario e admin  ->  email na allowlist (lib/network-access).
-- Assim operador/nao-admin/nao-allowlist nao conseguem ler nem escrever nada,
-- nem direto no banco nem pela API. Dados sensiveis nunca ficam nessas tabelas.
--
-- Rode este arquivo UMA VEZ no SQL editor do Supabase (projeto xtxusfvfrawjhmbhgbds).
-- Idempotente: pode rodar de novo sem quebrar.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Canais ──
create table if not exists network_channels (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  name        text not null,
  description text,
  sort        int default 0,
  created_at  timestamptz default now()
);

-- ── Mensagens ──
create table if not exists network_messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  uuid references network_channels(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  text        text not null,
  pinned      boolean default false,
  edited_at   timestamptz,
  deleted_at  timestamptz,
  created_at  timestamptz default now()
);
create index if not exists idx_network_messages_channel on network_messages(channel_id, created_at desc);
create index if not exists idx_network_messages_author  on network_messages(author_id);

-- ── Reacoes (1 por usuario/emoji/mensagem) ──
create table if not exists network_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid references network_messages(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz default now(),
  unique (message_id, user_id, emoji)
);
create index if not exists idx_network_reactions_msg on network_reactions(message_id);

-- ── Perfil publico do Network (bits editaveis; stats sao computadas no servidor) ──
create table if not exists network_profiles (
  user_id     uuid primary key references profiles(id) on delete cascade,
  bio         text,
  instagram   text,
  verified    boolean default false,
  founder     boolean default false,
  rank        text,               -- override opcional de rank (APEX/Elite/...)
  last_active timestamptz,         -- atualizado a cada poll do feed (presenca online)
  created_at  timestamptz default now()
);
create index if not exists idx_network_profiles_active on network_profiles(last_active desc);

-- ── RLS: habilita e NEGA acesso direto (sem policies). So service_role passa. ──
alter table network_channels  enable row level security;
alter table network_messages  enable row level security;
alter table network_reactions enable row level security;
alter table network_profiles  enable row level security;

-- Remove policies antigas (caso re-rodando) — mantem deny-all por padrao.
drop policy if exists network_channels_no_access  on network_channels;
drop policy if exists network_messages_no_access  on network_messages;
drop policy if exists network_reactions_no_access on network_reactions;
drop policy if exists network_profiles_no_access  on network_profiles;
-- (nao criamos policies permissivas de proposito: acesso somente via API service_role)

-- ── Seed dos canais ──
insert into network_channels (key, name, description, sort) values
  ('geral',         'Network Geral',        'Conversa geral da comunidade',        0),
  ('avisos',        'Avisos da Comunidade', 'Comunicados oficiais',                1),
  ('duvidas',       'Dúvidas Operacionais', 'Tire dúvidas com outros admins',      2),
  ('resultados',    'Resultados',           'Compartilhe resultados',              3),
  ('oportunidades', 'Oportunidades',        'Redes, parcerias, oportunidades',     4),
  ('offtopic',      'Off-topic',            'Papo livre',                          5)
on conflict (key) do nothing;

-- ── Mensagem fixada de boas-vindas no Geral ──
insert into network_messages (channel_id, author_id, text, pinned)
select c.id, null,
  'Bem-vindo ao Network da NexControl. Use este espaço para trocar experiências, dúvidas e oportunidades com outros admins.',
  true
from network_channels c
where c.key = 'geral'
  and not exists (select 1 from network_messages m where m.channel_id = c.id and m.pinned = true);

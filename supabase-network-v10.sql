-- ═══════════════════════════════════════════════════════════════════════════
-- NETWORK v10 — camada SOCIAL (comentários + likes de comentário).
--
-- Usado pelo canal Resultados no modo "rede social" (feed estilo Instagram).
-- Curtidas do POST reutilizam a tabela existente `network_reactions` (emoji ❤️),
-- então NÃO criamos tabela nova pra isso. Aqui só entram os COMENTÁRIOS e as
-- curtidas DE COMENTÁRIO.
--
-- SEGURANCA: RLS habilitada e SEM policies (deny-all). Todo acesso passa pelas
-- API routes /api/network/* com service_role — igual às outras tabelas do módulo.
--
-- Idempotente. Rode UMA VEZ no SQL editor do Supabase.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Comentários de uma publicação (mensagem) ──
create table if not exists network_comments (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid references network_messages(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  parent_id   uuid references network_comments(id) on delete cascade,  -- resposta a outro comentário
  text        text not null,
  deleted_at  timestamptz,
  created_at  timestamptz default now()
);
create index if not exists idx_network_comments_msg    on network_comments(message_id, created_at asc);
create index if not exists idx_network_comments_parent on network_comments(parent_id);

-- ── Curtidas de comentário (1 por usuário/comentário) ──
create table if not exists network_comment_likes (
  id          uuid primary key default gen_random_uuid(),
  comment_id  uuid references network_comments(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (comment_id, user_id)
);
create index if not exists idx_network_comment_likes_c on network_comment_likes(comment_id);

-- ── RLS: habilita e NEGA acesso direto (só service_role passa) ──
alter table network_comments      enable row level security;
alter table network_comment_likes enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- CAPTURA AUTOMATICA DE DEPOSITOS (extensao le o QR/valor das abas do bot).
-- Fluxo: operador abre a meta -> "Iniciar depositos" cria uma SESSAO -> a
-- extensao envia cada deposito (valor + numero do pedido) -> soma ao vivo no
-- pop-up -> "Finalizar" fecha a sessao e o total vai pra remessa.
--
-- RLS deny-all: acesso SO via /api/deposit-capture (service role), igual ao
-- padrao do Network. Isolado do nucleo (nao toca em metas/remessas ate o
-- operador finalizar de propria vontade).
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists deposit_capture_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  operator_id uuid not null,          -- quem esta capturando (admin ou operador)
  meta_id uuid,                       -- meta aberta na hora do "Iniciar"
  status text not null default 'active', -- active | ended
  total numeric not null default 0,   -- soma corrente (cache; fonte = deposit_captures)
  count int not null default 0,       -- qtd de depositos capturados
  started_at timestamptz default now(),
  ended_at timestamptz
);
create index if not exists idx_dcs_operator_active on deposit_capture_sessions(operator_id, status);

create table if not exists deposit_captures (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references deposit_capture_sessions(id) on delete cascade,
  tenant_id uuid not null,
  operator_id uuid not null,
  order_id text not null,             -- "Numero do Pedido" da casa -> chave anti-duplicacao
  valor numeric not null,
  casa text,                          -- opcional (dominio/nome da casa)
  created_at timestamptz default now(),
  unique (session_id, order_id)       -- mesmo pedido nunca conta 2x na sessao
);
create index if not exists idx_dc_session on deposit_captures(session_id);

alter table deposit_capture_sessions enable row level security;
alter table deposit_captures enable row level security;
-- (sem policies = deny-all; tudo passa pela API com service role)

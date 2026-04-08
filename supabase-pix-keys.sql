-- ============================================================
-- NexControl — Tabela pix_keys + RLS
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Criar tabela
create table if not exists pix_keys (
  id bigint generated always as identity primary key,
  operator_id uuid not null references profiles(id) on delete cascade,
  chave text not null,
  tipo text not null default 'evp',
  banco text,
  status text not null default 'valida',
  created_at timestamptz default now(),
  unique(operator_id, chave)
);

-- 2. Habilitar RLS
alter table pix_keys enable row level security;

-- 3. Policies — isolamento total por operador

-- Select: apenas as próprias chaves
create policy "pix_keys: usuario ve as proprias"
  on pix_keys for select
  using (auth.uid() = operator_id);

-- Insert: apenas com operator_id = auth.uid()
create policy "pix_keys: usuario insere as proprias"
  on pix_keys for insert
  with check (auth.uid() = operator_id);

-- Update: apenas as próprias chaves
create policy "pix_keys: usuario atualiza as proprias"
  on pix_keys for update
  using (auth.uid() = operator_id);

-- Delete: apenas as próprias chaves
create policy "pix_keys: usuario deleta as proprias"
  on pix_keys for delete
  using (auth.uid() = operator_id);

-- Admin vê todas (opcional)
create policy "pix_keys: admin ve todas"
  on pix_keys for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 4. Índice para performance
create index if not exists idx_pix_keys_operator on pix_keys(operator_id);
create index if not exists idx_pix_keys_tipo on pix_keys(tipo);

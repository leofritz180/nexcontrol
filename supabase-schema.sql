-- ============================================================
-- NexControl V4 — Schema completo com RLS correto
-- Execute TODO este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Limpar tabelas existentes (ordem reversa por dependência)
drop table if exists remessas cascade;
drop table if exists metas cascade;
drop table if exists profiles cascade;

-- 2. Tabela de perfis (criada automaticamente no signup via trigger)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  nome text,
  role text default 'operator',
  created_at timestamptz default now()
);

-- 3. Tabela de metas
create table metas (
  id bigint generated always as identity primary key,
  operator_id uuid not null references profiles(id) on delete cascade,
  titulo text not null,
  observacoes text,
  quantidade_contas integer default 10,
  status text default 'ativa',
  created_at timestamptz default now()
);

-- 4. Tabela de remessas
create table remessas (
  id bigint generated always as identity primary key,
  meta_id bigint not null references metas(id) on delete cascade,
  titulo text,
  tipo text default 'remessa',
  saldo_inicial numeric default 0,
  deposito numeric default 0,
  saque numeric default 0,
  lucro numeric default 0,
  prejuizo numeric default 0,
  resultado numeric default 0,
  resultado_por_conta numeric default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. TRIGGER: cria profile automaticamente no signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'operator')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 6. Habilitar RLS em todas as tabelas
-- ============================================================
alter table profiles enable row level security;
alter table metas enable row level security;
alter table remessas enable row level security;

-- ============================================================
-- 7. POLICIES — profiles
-- ============================================================

-- Usuário vê apenas seu próprio perfil
create policy "profiles: usuario ve o proprio"
  on profiles for select
  using (auth.uid() = id);

-- Usuário pode criar o proprio perfil (usado pelo trigger)
create policy "profiles: usuario cria o proprio"
  on profiles for insert
  with check (auth.uid() = id);

-- Usuário pode atualizar o proprio perfil
create policy "profiles: usuario atualiza o proprio"
  on profiles for update
  using (auth.uid() = id);

-- Admin vê todos os perfis
create policy "profiles: admin ve todos"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 8. POLICIES — metas
-- ============================================================

-- Operador vê apenas suas metas
create policy "metas: operador ve as proprias"
  on metas for select
  using (auth.uid() = operator_id);

-- Operador cria meta vinculada a si mesmo
create policy "metas: operador cria a propria"
  on metas for insert
  with check (auth.uid() = operator_id);

-- Operador atualiza apenas suas metas
create policy "metas: operador atualiza a propria"
  on metas for update
  using (auth.uid() = operator_id);

-- Operador deleta apenas suas metas
create policy "metas: operador deleta a propria"
  on metas for delete
  using (auth.uid() = operator_id);

-- Admin vê todas as metas
create policy "metas: admin ve todas"
  on metas for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 9. POLICIES — remessas
-- ============================================================

-- Operador vê remessas das suas metas
create policy "remessas: operador ve as proprias"
  on remessas for select
  using (
    exists (
      select 1 from metas m
      where m.id = remessas.meta_id and m.operator_id = auth.uid()
    )
  );

-- Operador insere remessa em suas metas
create policy "remessas: operador insere nas proprias metas"
  on remessas for insert
  with check (
    exists (
      select 1 from metas m
      where m.id = remessas.meta_id and m.operator_id = auth.uid()
    )
  );

-- Operador atualiza remessas das suas metas
create policy "remessas: operador atualiza nas proprias metas"
  on remessas for update
  using (
    exists (
      select 1 from metas m
      where m.id = remessas.meta_id and m.operator_id = auth.uid()
    )
  );

-- Operador deleta remessas das suas metas
create policy "remessas: operador deleta nas proprias metas"
  on remessas for delete
  using (
    exists (
      select 1 from metas m
      where m.id = remessas.meta_id and m.operator_id = auth.uid()
    )
  );

-- Admin vê todas as remessas
create policy "remessas: admin ve todas"
  on remessas for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 10. Criar usuário admin manualmente (opcional)
-- Substitua o UUID pelo ID real do usuário admin no Auth
-- ============================================================
-- insert into profiles (id, email, nome, role)
-- values ('SEU-UUID-AQUI', 'admin@nexcontrol.com', 'Admin', 'admin')
-- on conflict (id) do update set role = 'admin';

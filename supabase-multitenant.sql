-- ============================================================
-- NexControl — MULTI-TENANT MIGRATION
-- Execute TODO este SQL no Supabase SQL Editor
-- ============================================================

-- ══════════════════════════════
-- 1. CRIAR TABELA TENANTS
-- ══════════════════════════════
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Operacao',
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table tenants enable row level security;

create policy "tenants: owner ve o proprio"
  on tenants for select using (owner_id = auth.uid());
create policy "tenants: owner atualiza"
  on tenants for update using (owner_id = auth.uid());
create policy "tenants: qualquer autenticado cria"
  on tenants for insert with check (auth.uid() is not null);

-- ══════════════════════════════
-- 2. CRIAR TABELA INVITES
-- ══════════════════════════════
create table if not exists invites (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text,
  role text default 'operator',
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  status text default 'pending',
  created_at timestamptz default now()
);

alter table invites enable row level security;

create policy "invites: admin do tenant ve"
  on invites for select using (
    exists (select 1 from tenants t where t.id = invites.tenant_id and t.owner_id = auth.uid())
  );
create policy "invites: admin do tenant cria"
  on invites for insert with check (
    exists (select 1 from tenants t where t.id = invites.tenant_id and t.owner_id = auth.uid())
  );
create policy "invites: admin do tenant deleta"
  on invites for delete using (
    exists (select 1 from tenants t where t.id = invites.tenant_id and t.owner_id = auth.uid())
  );
-- Permitir leitura publica por token (para aceitar convite)
create policy "invites: leitura por token"
  on invites for select using (true);

-- ══════════════════════════════
-- 3. ADICIONAR tenant_id NAS TABELAS
-- ══════════════════════════════
alter table profiles add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table metas add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table remessas add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table pix_keys add column if not exists tenant_id uuid references tenants(id) on delete cascade;

-- Indices para performance
create index if not exists idx_profiles_tenant on profiles(tenant_id);
create index if not exists idx_metas_tenant on metas(tenant_id);
create index if not exists idx_remessas_tenant on remessas(tenant_id);
create index if not exists idx_pix_keys_tenant on pix_keys(tenant_id);
create index if not exists idx_invites_token on invites(token);

-- ══════════════════════════════
-- 4. FUNCAO HELPER: get_my_tenant_id()
-- ══════════════════════════════
create or replace function public.get_my_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from profiles where id = auth.uid() limit 1;
$$;

-- ══════════════════════════════
-- 5. REMOVER POLICIES ANTIGAS
-- ══════════════════════════════

-- profiles
drop policy if exists "profiles: usuario ve o proprio" on profiles;
drop policy if exists "profiles: usuario cria o proprio" on profiles;
drop policy if exists "profiles: usuario atualiza o proprio" on profiles;
drop policy if exists "profiles: admin ve todos" on profiles;

-- metas
drop policy if exists "metas: operador ve as proprias" on metas;
drop policy if exists "metas: operador cria a propria" on metas;
drop policy if exists "metas: operador atualiza a propria" on metas;
drop policy if exists "metas: operador deleta a propria" on metas;
drop policy if exists "metas: admin ve todas" on metas;

-- remessas
drop policy if exists "remessas: operador ve as proprias" on remessas;
drop policy if exists "remessas: operador insere nas proprias metas" on remessas;
drop policy if exists "remessas: operador atualiza nas proprias metas" on remessas;
drop policy if exists "remessas: operador deleta nas proprias metas" on remessas;
drop policy if exists "remessas: admin ve todas" on remessas;

-- pix_keys
drop policy if exists "pix_keys: usuario ve as proprias" on pix_keys;
drop policy if exists "pix_keys: usuario insere as proprias" on pix_keys;
drop policy if exists "pix_keys: usuario atualiza as proprias" on pix_keys;
drop policy if exists "pix_keys: usuario deleta as proprias" on pix_keys;
drop policy if exists "pix_keys: admin ve todas" on pix_keys;

-- ══════════════════════════════
-- 6. NOVAS POLICIES — TENANT-ISOLATED
-- ══════════════════════════════

-- ── PROFILES ──
create policy "profiles: ve do mesmo tenant"
  on profiles for select using (
    tenant_id = get_my_tenant_id() or id = auth.uid()
  );
create policy "profiles: cria o proprio"
  on profiles for insert with check (auth.uid() = id);
create policy "profiles: atualiza o proprio"
  on profiles for update using (auth.uid() = id);

-- ── METAS ──
create policy "metas: ve do mesmo tenant"
  on metas for select using (tenant_id = get_my_tenant_id());
create policy "metas: cria no proprio tenant"
  on metas for insert with check (tenant_id = get_my_tenant_id());
create policy "metas: atualiza no proprio tenant"
  on metas for update using (tenant_id = get_my_tenant_id());
create policy "metas: deleta no proprio tenant"
  on metas for delete using (tenant_id = get_my_tenant_id());

-- ── REMESSAS ──
create policy "remessas: ve do mesmo tenant"
  on remessas for select using (tenant_id = get_my_tenant_id());
create policy "remessas: cria no proprio tenant"
  on remessas for insert with check (tenant_id = get_my_tenant_id());
create policy "remessas: atualiza no proprio tenant"
  on remessas for update using (tenant_id = get_my_tenant_id());
create policy "remessas: deleta no proprio tenant"
  on remessas for delete using (tenant_id = get_my_tenant_id());

-- ── PIX_KEYS ──
create policy "pix_keys: ve do mesmo tenant"
  on pix_keys for select using (tenant_id = get_my_tenant_id());
create policy "pix_keys: cria no proprio tenant"
  on pix_keys for insert with check (tenant_id = get_my_tenant_id());
create policy "pix_keys: atualiza no proprio tenant"
  on pix_keys for update using (tenant_id = get_my_tenant_id());
create policy "pix_keys: deleta no proprio tenant"
  on pix_keys for delete using (tenant_id = get_my_tenant_id());

-- ══════════════════════════════
-- 7. ATUALIZAR TRIGGER DE SIGNUP
-- ══════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_role text;
  v_invite_token text;
begin
  -- Verificar se veio de convite
  v_invite_token := new.raw_user_meta_data->>'invite_token';

  if v_invite_token is not null then
    -- Aceitar convite: pegar tenant_id e role do convite
    select tenant_id, role into v_tenant_id, v_role
    from invites
    where token = v_invite_token and status = 'pending'
    limit 1;

    if v_tenant_id is not null then
      -- Marcar convite como aceito
      update invites set status = 'accepted' where token = v_invite_token;
    end if;
  end if;

  -- Se nao veio de convite, criar novo tenant (admin)
  if v_tenant_id is null then
    insert into tenants (owner_id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'tenant_name', 'Minha Operacao'))
    returning id into v_tenant_id;
    v_role := 'admin';
  end if;

  -- Criar profile
  insert into public.profiles (id, email, nome, role, tenant_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(v_role, 'operator'),
    v_tenant_id
  )
  on conflict (id) do update set
    tenant_id = coalesce(profiles.tenant_id, v_tenant_id),
    role = coalesce(v_role, profiles.role);

  return new;
end;
$$;

-- Recriar trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════
-- 8. MIGRAR DADOS EXISTENTES
-- (Cria tenant para admin atual e vincula tudo)
-- ══════════════════════════════
do $$
declare
  admin_rec record;
  new_tenant_id uuid;
begin
  for admin_rec in
    select id, email, nome from profiles where role = 'admin' and tenant_id is null
  loop
    -- Criar tenant para este admin
    insert into tenants (owner_id, name)
    values (admin_rec.id, coalesce(admin_rec.nome, 'Operacao') || ' - Tenant')
    returning id into new_tenant_id;

    -- Atualizar profile do admin
    update profiles set tenant_id = new_tenant_id where id = admin_rec.id;

    -- Vincular todos operadores sem tenant ao primeiro admin
    update profiles set tenant_id = new_tenant_id
    where role = 'operator' and tenant_id is null;

    -- Vincular metas
    update metas set tenant_id = new_tenant_id where tenant_id is null;

    -- Vincular remessas
    update remessas set tenant_id = new_tenant_id where tenant_id is null;

    -- Vincular pix_keys
    update pix_keys set tenant_id = new_tenant_id where tenant_id is null;
  end loop;
end $$;

-- ============================================================
-- NexControl — HOTFIX recursão RLS em profiles
-- A policy "profiles: admin ve removidos do tenant" fazia
-- SELECT em profiles dentro de uma policy de profiles, criando
-- recursão. Isso quebrava avaliação em cascata (ex: insert em
-- metas → checa tenants → checa profiles → recursão → falha).
--
-- Fix: extrair a checagem pra função security definer, que
-- bypassa RLS e elimina a recursão.
-- ============================================================

-- Função helper: verifica se auth.uid() é admin de um tenant específico
create or replace function public.is_admin_of_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'admin'
      and tenant_id = p_tenant_id
  );
$$;

-- Recria a policy SEM recursão
drop policy if exists "profiles: admin ve removidos do tenant" on profiles;
create policy "profiles: admin ve removidos do tenant"
  on profiles for select
  using (
    removed_from_tenant_id is not null
    and is_admin_of_tenant(removed_from_tenant_id)
  );

-- Garante que get_my_tenant_id ainda existe e está correto
create or replace function public.get_my_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from profiles where id = auth.uid() limit 1;
$$;

-- ============================================================
-- NexControl — PRODUCTION FIXES V2
-- Correcoes de concorrencia, atomicidade e seguranca
-- Execute no Supabase SQL Editor
-- ============================================================

-- ══════════════════════════════
-- 1. BLOQUEAR remessa em meta fechada (RLS)
-- ══════════════════════════════
drop policy if exists "remessas: cria no proprio tenant" on remessas;
create policy "remessas: cria no proprio tenant se meta ativa"
  on remessas for insert with check (
    tenant_id = get_my_tenant_id()
    and exists (
      select 1 from metas m
      where m.id = remessas.meta_id
      and m.tenant_id = get_my_tenant_id()
      and m.status != 'finalizada'
      and (m.status_fechamento is null or m.status_fechamento != 'fechada')
    )
  );

-- ══════════════════════════════
-- 2. BLOQUEAR criacao de meta se tenant sem assinatura
-- ══════════════════════════════
drop policy if exists "metas: cria no proprio tenant" on metas;
create policy "metas: cria no proprio tenant se ativo"
  on metas for insert with check (
    tenant_id = get_my_tenant_id()
    and exists (
      select 1 from tenants t
      where t.id = get_my_tenant_id()
      and (
        (t.subscription_status = 'trial' and t.trial_end > now())
        or t.subscription_status = 'active'
      )
    )
  );

-- ══════════════════════════════
-- 3. LOCK invite na aceitacao (previne double-accept)
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
  v_invite record;
begin
  v_invite_token := new.raw_user_meta_data->>'invite_token';

  if v_invite_token is not null then
    -- SELECT FOR UPDATE previne race condition
    select tenant_id, role into v_invite
    from invites
    where token = v_invite_token and status = 'pending'
    for update skip locked
    limit 1;

    if v_invite.tenant_id is not null then
      v_tenant_id := v_invite.tenant_id;
      v_role := v_invite.role;
      update invites set status = 'accepted' where token = v_invite_token and status = 'pending';
    end if;
  end if;

  if v_tenant_id is null then
    insert into tenants (owner_id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'tenant_name', 'Minha Operacao'))
    returning id into v_tenant_id;
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, nome, role, tenant_id)
  values (
    new.id, new.email,
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

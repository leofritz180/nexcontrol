-- ============================================================
-- FIX CRITICO · Convites compartilhaveis
--
-- Bug: quando admin manda o mesmo link de convite pra varios
-- operadores, so o primeiro vira operador. Os outros viram admin
-- de tenant novo (orfaos) porque o trigger so aceita status='pending'.
--
-- Fix: trigger ignora status do convite. Link de convite pode ser
-- usado por N operadores enquanto nao for revogado.
-- ============================================================

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
  v_invite_token := new.raw_user_meta_data->>'invite_token';

  if v_invite_token is not null then
    -- Aceita convite mesmo se ja foi 'accepted' (link compartilhavel).
    -- Soh bloqueia se status='revoked' ou 'expired'.
    select tenant_id, role into v_tenant_id, v_role
    from invites
    where token = v_invite_token
      and status in ('pending', 'accepted')
    limit 1;

    if v_tenant_id is not null then
      -- Marca como accepted (mas nao impede reuso futuro)
      update invites set status = 'accepted' where token = v_invite_token and status = 'pending';
    end if;
  end if;

  -- Se nao veio de convite valido, cria novo tenant (admin)
  if v_tenant_id is null then
    insert into tenants (owner_id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'tenant_name', 'Minha Operacao'))
    returning id into v_tenant_id;
    v_role := 'admin';
  end if;

  -- Cria profile
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

-- Garante trigger continua ativo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- NexControl — ACTIVITY LOGS + TRIGGERS (COMPLETO)
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Criar tabela
create table if not exists activity_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  operator_id uuid references profiles(id) on delete set null,
  meta_id bigint references metas(id) on delete set null,
  action text not null,
  description text,
  details jsonb,
  created_at timestamptz default now()
);

alter table activity_logs enable row level security;

drop policy if exists "activity_logs: tenant ve" on activity_logs;
create policy "activity_logs: tenant ve"
  on activity_logs for select using (tenant_id = public.get_my_tenant_id());

drop policy if exists "activity_logs: tenant cria" on activity_logs;
create policy "activity_logs: tenant cria"
  on activity_logs for insert with check (true);

create index if not exists idx_activity_logs_tenant on activity_logs(tenant_id);
create index if not exists idx_activity_logs_meta on activity_logs(meta_id);

-- 2. Trigger: log ao criar meta
create or replace function public.log_meta_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into activity_logs (tenant_id, operator_id, meta_id, action, description)
  values (new.tenant_id, new.operator_id, new.id, 'meta_created',
    'Meta criada: ' || new.titulo);
  return new;
end; $$;

drop trigger if exists on_meta_created on metas;
create trigger on_meta_created after insert on metas
  for each row execute procedure public.log_meta_created();

-- 3. Trigger: log ao alterar status da meta
create or replace function public.log_meta_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status or old.status_fechamento is distinct from new.status_fechamento then
    insert into activity_logs (tenant_id, operator_id, meta_id, action, description)
    values (new.tenant_id, new.operator_id, new.id,
      case when new.status_fechamento = 'fechada' then 'meta_closed'
           when new.status = 'finalizada' then 'meta_finalized'
           when new.status = 'ativa' and old.status = 'finalizada' then 'meta_reactivated'
           else 'meta_status_changed' end,
      case when new.status_fechamento = 'fechada' then 'Meta fechada: ' || new.titulo || ' — Lucro final: R$ ' || coalesce(new.lucro_final::text, '0')
           when new.status = 'finalizada' then 'Meta finalizada: ' || new.titulo
           when new.status = 'ativa' and old.status = 'finalizada' then 'Meta reativada: ' || new.titulo
           else 'Status alterado: ' || new.titulo end);
  end if;
  return new;
end; $$;

drop trigger if exists on_meta_status_change on metas;
create trigger on_meta_status_change after update on metas
  for each row execute procedure public.log_meta_status_change();

-- 4. Trigger: log ao criar remessa
create or replace function public.log_remessa_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta record;
begin
  select tenant_id, operator_id, titulo into v_meta from metas where id = new.meta_id;
  insert into activity_logs (tenant_id, operator_id, meta_id, action, description, details)
  values (v_meta.tenant_id, v_meta.operator_id, new.meta_id, 'remessa_created',
    'Remessa registrada: R$ ' || round(new.resultado::numeric, 2),
    jsonb_build_object('deposito', new.deposito, 'saque', new.saque, 'resultado', new.resultado));
  return new;
end; $$;

drop trigger if exists on_remessa_created on remessas;
create trigger on_remessa_created after insert on remessas
  for each row execute procedure public.log_remessa_created();

-- 5. Trigger: log ao editar remessa
create or replace function public.log_remessa_updated()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta record;
begin
  if old.deposito is distinct from new.deposito or old.saque is distinct from new.saque then
    select tenant_id, operator_id, titulo into v_meta from metas where id = new.meta_id;
    insert into activity_logs (tenant_id, operator_id, meta_id, action, description, details)
    values (v_meta.tenant_id, v_meta.operator_id, new.meta_id, 'remessa_edited',
      'Remessa editada: R$ ' || round(old.resultado::numeric, 2) || ' → R$ ' || round(new.resultado::numeric, 2),
      jsonb_build_object(
        'old_deposito', old.deposito, 'old_saque', old.saque, 'old_resultado', old.resultado,
        'new_deposito', new.deposito, 'new_saque', new.saque, 'new_resultado', new.resultado
      ));
  end if;
  return new;
end; $$;

drop trigger if exists on_remessa_updated on remessas;
create trigger on_remessa_updated after update on remessas
  for each row execute procedure public.log_remessa_updated();

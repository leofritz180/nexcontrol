-- ============================================================
-- NexControl — ACTIVITY LOGS
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

create table if not exists activity_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  operator_id uuid references profiles(id) on delete set null,
  meta_id bigint references metas(id) on delete set null,
  action text not null,
  description text,
  details jsonb,
  created_at timestamptz default now()
);

alter table activity_logs enable row level security;

create policy "activity_logs: tenant ve"
  on activity_logs for select using (tenant_id = public.get_my_tenant_id());
create policy "activity_logs: tenant cria"
  on activity_logs for insert with check (tenant_id = public.get_my_tenant_id());

create index if not exists idx_activity_logs_tenant on activity_logs(tenant_id);
create index if not exists idx_activity_logs_meta on activity_logs(meta_id);
create index if not exists idx_activity_logs_created on activity_logs(created_at desc);

-- ============================================================
-- TRIGGERS AUTOMATICOS PARA GERAR LOGS
-- ============================================================

-- Log ao criar meta
create or replace function public.log_meta_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into activity_logs (tenant_id, operator_id, meta_id, action, description, details)
  values (new.tenant_id, new.operator_id, new.id, 'meta_created',
    'Meta criada: ' || new.titulo,
    jsonb_build_object('titulo', new.titulo, 'rede', new.rede, 'plataforma', new.plataforma, 'contas', new.quantidade_contas));
  return new;
end; $$;

drop trigger if exists on_meta_created on metas;
create trigger on_meta_created after insert on metas
  for each row execute procedure public.log_meta_created();

-- Log ao alterar status da meta
create or replace function public.log_meta_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status or old.status_fechamento is distinct from new.status_fechamento then
    insert into activity_logs (tenant_id, operator_id, meta_id, action, description, details)
    values (new.tenant_id, new.operator_id, new.id,
      case when new.status_fechamento = 'fechada' then 'meta_closed'
           when new.status = 'finalizada' then 'meta_finalized'
           else 'meta_status_changed' end,
      case when new.status_fechamento = 'fechada' then 'Meta fechada: ' || new.titulo
           when new.status = 'finalizada' then 'Meta finalizada: ' || new.titulo
           else 'Status alterado: ' || new.titulo end,
      jsonb_build_object('status', new.status, 'fechamento', new.status_fechamento, 'lucro_final', new.lucro_final));
  end if;
  return new;
end; $$;

drop trigger if exists on_meta_status_change on metas;
create trigger on_meta_status_change after update on metas
  for each row execute procedure public.log_meta_status_change();

-- Log ao criar remessa
create or replace function public.log_remessa_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta record;
begin
  select tenant_id, operator_id, titulo into v_meta from metas where id = new.meta_id;
  insert into activity_logs (tenant_id, operator_id, meta_id, action, description, details)
  values (v_meta.tenant_id, v_meta.operator_id, new.meta_id, 'remessa_created',
    'Remessa registrada: R$ ' || round(new.resultado::numeric, 2),
    jsonb_build_object('titulo', new.titulo, 'tipo', new.tipo, 'deposito', new.deposito, 'saque', new.saque, 'resultado', new.resultado));
  return new;
end; $$;

drop trigger if exists on_remessa_created on remessas;
create trigger on_remessa_created after insert on remessas
  for each row execute procedure public.log_remessa_created();

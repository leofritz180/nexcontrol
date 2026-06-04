-- Tabela de registros de metodos alternativos (delay, rodadas gratis, bonus, etc).
-- Totalmente separada do fluxo CPA (metas/remessas/operadores). Nao se mistura
-- com metricas de redes ou ranking de operadores.

create table if not exists metodos_registros (
  id bigserial primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  modalidade text not null,
  tipo text not null check (tipo in ('lucro', 'prejuizo')),
  valor numeric(12, 2) not null check (valor >= 0),
  descricao text,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists idx_metodos_tenant on metodos_registros(tenant_id) where deleted_at is null;
create index if not exists idx_metodos_created on metodos_registros(tenant_id, created_at desc) where deleted_at is null;

-- RLS: cada tenant ve so o que e seu
alter table metodos_registros enable row level security;

drop policy if exists "metodos_tenant_isolation" on metodos_registros;
create policy "metodos_tenant_isolation" on metodos_registros
  for all
  using (tenant_id = (select tenant_id from profiles where id = auth.uid()))
  with check (tenant_id = (select tenant_id from profiles where id = auth.uid()));

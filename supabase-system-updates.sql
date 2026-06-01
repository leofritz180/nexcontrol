-- ============================================================
-- NexControl — Sistema de Atualizações
-- Sino de notificacao com changelog. Owner adiciona,
-- todos os admins/operators veem.
-- ============================================================

create table if not exists system_updates (
  id bigserial primary key,
  title text not null,
  body text,
  category text default 'feature', -- feature | fix | improvement | important
  icon text default null, -- emoji ou nome do icon
  published boolean default true,
  created_at timestamptz default now()
);

-- Quem leu o que (por user)
create table if not exists user_updates_read (
  user_id uuid not null references auth.users(id) on delete cascade,
  update_id bigint not null references system_updates(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (user_id, update_id)
);

create index if not exists idx_system_updates_published on system_updates(published, created_at desc);
create index if not exists idx_user_updates_read_user on user_updates_read(user_id);

-- RLS — todos podem LER updates publicados; so service role escreve
alter table system_updates enable row level security;
drop policy if exists su_read on system_updates;
create policy su_read on system_updates for select using (published = true);

alter table user_updates_read enable row level security;
drop policy if exists uur_own on user_updates_read;
create policy uur_own on user_updates_read for select using (user_id = auth.uid());
drop policy if exists uur_insert on user_updates_read;
create policy uur_insert on user_updates_read for insert with check (user_id = auth.uid());

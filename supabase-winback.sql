-- ============================================================
-- NexControl — WINBACK + ONBOARDING tracking
-- Execute no Supabase SQL Editor
-- ============================================================

-- Log de mensagens win-back enviadas (anti-spam: 1 por user x segment x channel)
create table if not exists winback_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  segment text not null,             -- '3d', '7d', '14d', 'trial_ending'
  channel text not null,             -- 'push', 'email'
  status text default 'sent',        -- 'sent', 'failed', 'opened', 'clicked'
  payload jsonb,
  sent_at timestamptz default now()
);

create index if not exists idx_winback_user on winback_log(user_id);
create index if not exists idx_winback_segment on winback_log(user_id, segment);
create index if not exists idx_winback_recent on winback_log(sent_at desc);

-- Flag pra esconder o checklist permanentemente (caso queira persistir server-side futuramente)
alter table profiles add column if not exists onboarding_dismissed boolean default false;
alter table profiles add column if not exists onboarding_completed_at timestamptz;
alter table profiles add column if not exists last_seen_at timestamptz;

-- Atualiza last_seen_at via trigger sempre que presence ping ocorre.
-- Como /api/presence ja faz update, vamos adicionar trigger pro caso.
create or replace function update_last_seen() returns trigger as $$
begin
  update profiles set last_seen_at = now() where id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_presence_last_seen on presence;
create trigger trg_presence_last_seen
  after insert or update on presence
  for each row execute function update_last_seen();

-- Backfill last_seen_at com base na tabela presence
update profiles p set last_seen_at = pr.last_ping
from presence pr where pr.user_id = p.id and p.last_seen_at is null;

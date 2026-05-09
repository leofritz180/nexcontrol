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

-- Flag pra onboarding + last_seen
alter table profiles add column if not exists onboarding_dismissed boolean default false;
alter table profiles add column if not exists onboarding_completed_at timestamptz;
alter table profiles add column if not exists last_seen_at timestamptz;

-- Trigger: atualiza profiles.last_seen_at sempre que presence ping ocorre.
-- Tabela presence usa: session_id (text) = string do user_id, last_seen (timestamptz)
create or replace function update_last_seen_from_presence() returns trigger as $$
declare
  uid uuid;
begin
  -- Tenta cast do session_id pra uuid (caso seja user_id valido)
  begin
    uid := NEW.session_id::uuid;
  exception when others then
    return NEW;  -- session_id nao eh uuid, ignora
  end;
  update profiles set last_seen_at = NEW.last_seen where id = uid;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_presence_last_seen on presence;
create trigger trg_presence_last_seen
  after insert or update on presence
  for each row execute function update_last_seen_from_presence();

-- Backfill last_seen_at com base na presence (cast session_id::uuid quando valido)
update profiles p
set last_seen_at = pr.last_seen
from presence pr
where pr.session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and pr.session_id::uuid = p.id
  and p.last_seen_at is null;

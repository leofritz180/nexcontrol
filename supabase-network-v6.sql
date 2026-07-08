-- NETWORK v6 — responder, banir, log de moderacao
alter table network_messages add column if not exists reply_to uuid;
alter table network_profiles add column if not exists banned boolean default false;
create table if not exists network_mod_log (
  id uuid primary key default gen_random_uuid(),
  action text, target_id uuid, target_name text,
  actor_id uuid, actor_name text, reason text,
  created_at timestamptz default now()
);
create index if not exists idx_network_mod_log_at on network_mod_log(created_at desc);
alter table network_mod_log enable row level security;

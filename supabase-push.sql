-- ============================================================
-- NexControl — PUSH NOTIFICATIONS
-- Execute no Supabase SQL Editor
-- ============================================================

create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

-- Users can read/write their own subscriptions
create policy "push_subs: user manages own"
  on push_subscriptions for all using (user_id = auth.uid());

-- Service role (API routes) can manage all — handled by service_role key bypassing RLS

create index if not exists idx_push_subs_user on push_subscriptions(user_id);
create index if not exists idx_push_subs_tenant on push_subscriptions(tenant_id);
create index if not exists idx_push_subs_endpoint on push_subscriptions(endpoint);

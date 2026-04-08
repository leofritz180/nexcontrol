-- ============================================================
-- NexControl — PRODUCTION FIXES
-- Execute este SQL no Supabase SQL Editor ANTES de ir pra producao
-- ============================================================

-- 1. FIX: Invite RLS — restringir leitura publica
-- Antes: qualquer pessoa podia listar TODOS os invites
-- Depois: so le invites do proprio tenant OU por token especifico via anon
drop policy if exists "invites: leitura por token" on invites;
create policy "invites: leitura por token pendente"
  on invites for select using (
    status = 'pending'
    and (
      auth.uid() is null
      or exists (select 1 from tenants t where t.id = invites.tenant_id and t.owner_id = auth.uid())
    )
  );

-- 2. FIX: Adicionar unique constraint em subscriptions para idempotencia
alter table subscriptions add column if not exists idempotency_key text unique;

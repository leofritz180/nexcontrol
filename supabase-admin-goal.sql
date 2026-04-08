-- ============================================================
-- NexControl — Adicionar meta global do admin na tabela profiles
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

alter table profiles add column if not exists meta_global numeric default 100000;

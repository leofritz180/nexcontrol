-- NexControl — Soft delete for metas
alter table metas add column if not exists deleted_at timestamptz default null;

-- NexControl — Admin meta closing: BAU + gastos operacionais
alter table metas add column if not exists salario_plataforma numeric default 0;
alter table metas add column if not exists bau numeric default 0;
alter table metas add column if not exists gastos_operacionais numeric default 0;

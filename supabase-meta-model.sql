-- Modelo de operacao POR META (nao por tenant)
-- Permite admin ter metas com salario+bau e metas apenas bau ao mesmo tempo

ALTER TABLE metas ADD COLUMN IF NOT EXISTS operation_model TEXT DEFAULT 'salario_bau';

-- Modelo de operacao do tenant
-- 'salario_bau' = opera com salario de plataforma + bau (padrao)
-- 'apenas_bau' = opera apenas com lucro do bau, sem contrato/salario

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS operation_model TEXT DEFAULT 'salario_bau';

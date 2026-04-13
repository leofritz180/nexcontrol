-- Sistema de pagamento de operadores
-- Admin configura modelo: 'fixo_dep' (R$ por depositante) ou 'percentual' (% do lucro)

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS operator_payment_model TEXT DEFAULT 'fixo_dep';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS operator_payment_value NUMERIC DEFAULT 2;

-- Registro de pagamento por meta (calculado automaticamente ao fechar)
ALTER TABLE metas ADD COLUMN IF NOT EXISTS pagamento_operador NUMERIC DEFAULT 0;

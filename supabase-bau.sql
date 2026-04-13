-- Adicionar campo BAU na tabela metas
-- Bau = bonus coletado nas contas da plataforma
-- Soma ao lucro final: lucro = resultado_remessas + salario + bau - custo_fixo - taxa_agente

ALTER TABLE metas ADD COLUMN IF NOT EXISTS bau NUMERIC DEFAULT 0;

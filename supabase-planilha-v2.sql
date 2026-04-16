-- v2: novas colunas para planilha operacional
ALTER TABLE admin_planilha ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
UPDATE admin_planilha SET status = 'concluido' WHERE concluido = true AND status = 'pendente';

ALTER TABLE admin_planilha ADD COLUMN IF NOT EXISTS lucro_parcial NUMERIC(10,2) DEFAULT 0;
ALTER TABLE admin_planilha ADD COLUMN IF NOT EXISTS tipo_resultado TEXT NOT NULL DEFAULT 'prejuizo';
ALTER TABLE admin_planilha ADD COLUMN IF NOT EXISTS tipo_parcial TEXT NOT NULL DEFAULT 'lucro';

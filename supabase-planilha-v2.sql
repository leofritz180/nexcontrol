-- v2: adicionar coluna status (pendente | em_andamento | concluido | problema)
-- Migra dados existentes: concluido=true vira 'concluido', resto vira 'pendente'
ALTER TABLE admin_planilha ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
UPDATE admin_planilha SET status = 'concluido' WHERE concluido = true AND status = 'pendente';

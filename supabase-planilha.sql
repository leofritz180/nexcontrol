-- Planilha operacional premium (exclusiva admin owner)
CREATE TABLE IF NOT EXISTS admin_planilha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rede TEXT NOT NULL DEFAULT '',
  quantidade INTEGER NOT NULL DEFAULT 0,
  agente TEXT DEFAULT '',
  apostas TEXT DEFAULT '',
  link TEXT DEFAULT '',
  operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  operator_name TEXT DEFAULT '',
  concluido BOOLEAN DEFAULT false,
  observacao TEXT DEFAULT '',
  prejuizo NUMERIC(10,2) DEFAULT 0,
  custos NUMERIC(10,2) DEFAULT 0,
  salario_bau NUMERIC(10,2) DEFAULT 0,
  lucro_final NUMERIC(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ap_tenant ON admin_planilha(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ap_sort ON admin_planilha(tenant_id, sort_order);

ALTER TABLE admin_planilha ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ap_own ON admin_planilha;
CREATE POLICY ap_own ON admin_planilha
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

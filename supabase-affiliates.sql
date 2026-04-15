-- Affiliates system: link unico por admin, comissao recorrente sobre pagamentos

-- 1) Afiliado (1:1 com tenant)
CREATE TABLE IF NOT EXISTS affiliates (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  commission_rate NUMERIC(5,4) DEFAULT 0.30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(code);

-- 2) Referrals (um referred_tenant so pode ter UM afiliado)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referred_tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_tenant_id);

-- 3) Comissoes (1 linha por pagamento aprovado gerado por indicado)
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referred_tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asaas_payment_id TEXT UNIQUE NOT NULL,
  payment_amount    NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  rate              NUMERIC(5,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ac_affiliate ON affiliate_commissions(affiliate_tenant_id);
CREATE INDEX IF NOT EXISTS idx_ac_referred  ON affiliate_commissions(referred_tenant_id);
CREATE INDEX IF NOT EXISTS idx_ac_status    ON affiliate_commissions(status);

-- 4) RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- service_role bypassa RLS; clientes com anon/authenticated so leem o proprio tenant.
DROP POLICY IF EXISTS affiliates_own  ON affiliates;
CREATE POLICY affiliates_own ON affiliates
  FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS referrals_own ON referrals;
CREATE POLICY referrals_own ON referrals
  FOR SELECT USING (affiliate_tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS ac_own ON affiliate_commissions;
CREATE POLICY ac_own ON affiliate_commissions
  FOR SELECT USING (affiliate_tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5) Seed: habilitar afiliado para dspods1@gmail.com
INSERT INTO affiliates (tenant_id, code, enabled, commission_rate)
SELECT DISTINCT p.tenant_id, SUBSTR(MD5(p.tenant_id::text),1,8), true, 0.30
FROM profiles p
WHERE p.email = 'dspods1@gmail.com'
  AND p.role = 'admin'
  AND p.tenant_id IS NOT NULL
ON CONFLICT (tenant_id) DO UPDATE SET enabled = true, commission_rate = EXCLUDED.commission_rate;

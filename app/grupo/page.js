'use client'
// /grupo — a porta PERMANENTE do Grupo Nex Network (R$ 79, lançamento,
// pagamento único). Antes o convite só aparecia na tela de "pagamento
// aprovado": em 2 dias, 5 pessoas passaram por lá e nenhuma comprou — os
// outros 80 pagantes nem sabiam que existia. Aqui qualquer um logado
// chega pelo menu ("Grupo VIP"), pela faixa do Network ou pelo convite
// pós-pagamento do painel. A compra em si é o mesmo UpsellNetwork.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '../../components/AppLayout'
import UpsellNetwork from '../../components/UpsellNetwork'
import { ModuleHeader, ModuloEsqueleto } from '../../components/ui/bento'
import { supabase } from '../../lib/supabase/client'

export default function GrupoPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (p) setProfile(p)
      if (p?.tenant_id) {
        const [{ data: t }, { data: s2 }] = await Promise.all([
          supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
          supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ])
        if (t) setTenant(t); if (s2) setSub(s2)
      }
      setLoading(false)
    })()
  }, [])

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'
  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role !== 'operator'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 28px' }}>
          {loading ? <ModuloEsqueleto cards={1} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ModuleHeader titulo="Grupo VIP Network" sub="O grupo fechado de quem opera CPA · preço de lançamento" />
              <div style={{ maxWidth: 520 }}>
                <UpsellNetwork nomeInicial={profile?.nome || ''} email={user?.email} tenantId={profile?.tenant_id} userId={user?.id} origem="pagina" semSair checarMembro />
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </main>
  )
}

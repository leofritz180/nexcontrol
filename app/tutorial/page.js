'use client'
// /tutorial — a Central de aulas (área de membros). A apresentação vive em
// components/modules/TutorialBento; aqui ficam os dados, a sessão e a
// persistência (localStorage): quais aulas foram concluídas e onde o vídeo
// parou. O ramo visual antigo saiu em 24/09/2026 — desde o rollout geral da
// 2.0 (lib/theme-v2) ele nunca mais era renderizado.
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '../../components/AppLayout'
import TutorialBento from '../../components/modules/TutorialBento'
import { ModuloEsqueleto } from '../../components/ui/bento'
import { supabase } from '../../lib/supabase/client'

// Marcações (etapas práticas + vídeo + guia) — a chave é antiga e continua a
// mesma pra quem já tinha progresso não perder nada.
const CHECKLIST_KEY = 'nexcontrol_tutorial_checklist'
// Onde o vídeo parou e quanto dura: { pos, seg }
const VIDEO_KEY = 'nexcontrol_tutorial_video'

// Cada etapa prática leva pra tela onde ela é feita de verdade.
const STEPS = [
  { id: 'criar_meta', label: 'Criar primeira meta', desc: 'Vá em "Minha operação" ou no painel do operador e crie sua primeira meta de operação.', href: '/operator', cta: 'Abrir Minha operação' },
  { id: 'registrar_remessa', label: 'Registrar remessa', desc: 'Dentro da meta, registre depósito, saque e resultado da remessa.', href: '/operator', cta: 'Ir para as metas' },
  { id: 'finalizar_meta', label: 'Finalizar meta', desc: 'Quando terminar, finalize a meta. O operador finaliza e o admin fecha com custos.', href: '/operator', cta: 'Ir para as metas' },
  { id: 'dashboard', label: 'Acompanhar dashboard', desc: 'Veja lucro do dia, resultado líquido e feed ao vivo no painel executivo.', href: '/admin', cta: 'Abrir o painel' },
  { id: 'convidar_operador', label: 'Convidar operador', desc: 'Na aba Operadores, gere um link de convite e envie para o seu operador.', href: '/operadores', cta: 'Abrir Operadores' },
  { id: 'fechamento', label: 'Fechar meta com custos', desc: 'Defina salário, custo fixo e taxa do agente no fechamento final.', href: '/admin', cta: 'Abrir o painel' },
]

export default function TutorialPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState({})
  const [video, setVideo] = useState({})

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p || p.role !== 'admin') { router.push('/operator'); return }
      setProfile(p)
      const [{ data: t }, { data: s2 }] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (t) setTenant(t)
      if (s2) setSub(s2)
      setLoading(false)
    }
    init()

    try {
      const saved = localStorage.getItem(CHECKLIST_KEY)
      if (saved) setChecked(JSON.parse(saved))
      const v = localStorage.getItem(VIDEO_KEY)
      if (v) setVideo(JSON.parse(v))
    } catch {}
  }, [])

  const gravar = next => { try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)) } catch {} }

  function toggle(id) {
    setChecked(prev => { const next = { ...prev, [id]: !prev[id] }; gravar(next); return next })
  }
  // Conclusão automática (vídeo chegou ao fim): só marca, nunca desmarca.
  function concluir(id) {
    setChecked(prev => { if (prev[id]) return prev; const next = { ...prev, [id]: true }; gravar(next); return next })
  }
  function posicao(pos, seg) {
    const next = { pos: Math.floor(pos), seg: Math.floor(seg) }
    setVideo(next)
    try { localStorage.setItem(VIDEO_KEY, JSON.stringify(next)) } catch {}
  }
  function resetChecklist() {
    setChecked({}); setVideo({})
    try { localStorage.removeItem(CHECKLIST_KEY); localStorage.removeItem(VIDEO_KEY) } catch {}
  }

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'

  const moldura = filho => (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout
        userName={getName(profile)}
        userEmail={user?.email}
        isAdmin={true}
        tenant={tenant}
        subscription={sub}
        userId={user?.id}
        tenantId={profile?.tenant_id}
      >
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 28px' }}>{filho}</div>
      </AppLayout>
    </main>
  )

  // O esqueleto tem a forma dos cards, então o layout não pula quando os
  // dados chegam.
  if (loading) return moldura(<ModuloEsqueleto cards={3} />)

  return moldura(
    <TutorialBento
      passos={STEPS}
      marcados={checked}
      video={video}
      onAlternar={toggle}
      onConcluir={concluir}
      onPosicao={posicao}
      onReiniciar={resetChecklist}
    />
  )
}

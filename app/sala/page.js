'use client'
// /sala — a SALA AO VIVO: o admin assiste a tela dos operadores que estão
// transmitindo. Uma grade de vídeos (1, 2 ou 3 colunas), cada um com quem
// é, há quanto tempo, e tela cheia. A parte de WebRTC/Realtime está em
// lib/transmissao; aqui é só a tela.
//
// Vale no Solo Pro e nos planos de equipe (é o que a landing promete). Sem
// TURN, uma rede muito fechada pode não conectar: o cartão diz isso e
// oferece tentar de novo — nunca fica girando.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { ModuleHeader, BCard, ModuloEsqueleto, Ico, MONO, RED, RED2, int, ON_RED, GLOW } from '../../components/ui/bento'
import { supabase } from '../../lib/supabase/client'
import { criarEspectador } from '../../lib/transmissao'

const I_TELA = <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>
const I_CHEIA = <><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></>
const I_PLAY = <polygon points="5 3 19 12 5 21 5 3" />
const I_X = <path d="M18 6L6 18M6 6l12 12" />
const I_TRAVA = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>

const fmtDesde = (desde, agora) => { const s = Math.max(0, Math.floor((agora - (desde || agora)) / 1000)); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}` }

function Tela({ t, estado, stream, onAssistir, onParar, agora }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current && stream) { ref.current.srcObject = stream; ref.current.play?.().catch(() => {}) } }, [stream])
  const aoVivo = estado === 'ao-vivo'
  return (
    <BCard pad={0}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0b0b0c', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
        <video ref={ref} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain', display: aoVivo || estado === 'instavel' ? 'block' : 'none' }} />
        {!aoVivo && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, textAlign: 'center' }}>
            {estado === 'conectando' && <><span style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: RED, animation: 'nx-spin 0.8s linear infinite' }} /><span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>Conectando com {t.nome}…</span></>}
            {estado === 'falhou' && <><span style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>Não deu pra conectar por essa rede</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', maxWidth: 300 }}>Sem servidor de retransmissão, redes muito fechadas bloqueiam. Tenta pelo 4G/hotspot, ou peça pro operador trocar de rede.</span><button type="button" onClick={onAssistir} style={{ minHeight: 40, padding: '0 16px', borderRadius: 30, border: 'none', background: RED, color: ON_RED, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>Tentar de novo</button></>}
            {estado === 'fim' && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{t.nome} encerrou a transmissão.</span>}
            {(!estado || estado === 'parado') && <button type="button" onClick={onAssistir} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 18px', borderRadius: 30, border: 'none', background: `linear-gradient(135deg, ${RED2}, ${RED})`, color: ON_RED, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: `0 10px 26px ${GLOW}` }}><Ico d={I_PLAY} s={14} c={ON_RED} /> Assistir</button>}
          </div>
        )}
        {(aoVivo || estado === 'conectando' || estado === 'instavel') && (
          <span style={{ position: 'absolute', top: 8, right: 8, display: 'inline-flex', gap: 6 }}>
            {aoVivo && <button type="button" aria-label="Tela cheia" onClick={() => ref.current?.requestFullscreen?.()} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={I_CHEIA} s={15} c={ON_RED} /></button>}
            <button type="button" aria-label="Parar de assistir" onClick={onParar} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ico d={I_X} s={14} c="#fff" /></button>
          </span>
        )}
        {(aoVivo || estado === 'instavel') && (
          <span style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 10.5, fontWeight: 900, letterSpacing: '0.12em' }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: estado === 'instavel' ? '#f0b429' : RED }} /> {estado === 'instavel' ? 'INSTÁVEL' : 'AO VIVO'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        <span style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--t1)' }}>{String(t.nome || '?')[0].toUpperCase()}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nome}</span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--t3)', fontFamily: MONO }}>{fmtDesde(t.desde, agora)} no ar · {t.espectadores} assistindo{t.metaId ? ` · meta #${t.metaId}` : ''}</span>
        </span>
        {t.metaId && <a href={`/meta/${t.metaId}`} style={{ fontSize: 12, fontWeight: 800, color: 'var(--t2)', textDecoration: 'none', minHeight: 40, display: 'inline-flex', alignItems: 'center', padding: '0 8px' }}>Ver meta</a>}
      </div>
    </BCard>
  )
}

function Sala({ userId, tenantId, nome, liberado, opInicial }) {
  const [lista, setLista] = useState([])
  const [estados, setEstados] = useState({})
  const [streams, setStreams] = useState({})
  const [agora, setAgora] = useState(Date.now())
  const esp = useRef(null)

  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    if (!liberado || !tenantId || !userId) return
    const e = criarEspectador({
      tenantId, userId, nome,
      onLista: l => setLista(l),
      onStream: (id, s) => setStreams(x => ({ ...x, [id]: s })),
      onEstado: (id, st) => setEstados(x => ({ ...x, [id]: st })),
    })
    esp.current = e
    e.conectar().catch(() => {})
    return () => { e.fecharTudo(); esp.current = null }
  }, [liberado, tenantId, userId, nome])
  // ?op=ID (veio do push "Assistir"): assiste sozinho quando a pessoa aparecer
  const jaAuto = useRef(false)
  useEffect(() => {
    if (jaAuto.current || !opInicial) return
    if (lista.some(t => t.userId === opInicial)) { jaAuto.current = true; esp.current?.assistir(opInicial) }
  }, [lista, opInicial])

  const cols = lista.length <= 1 ? 1 : lista.length === 2 ? 2 : 3

  if (!liberado) return (
    <BCard pad={26}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: RED }}><Ico d={I_TRAVA} s={20} /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>A Sala ao vivo é do Solo Pro e dos planos de equipe</span>
          <span style={{ display: 'block', fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Veja a tela dos seus operadores em tempo real, sem instalar nada.</span>
        </span>
        <a href="/billing-mp" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 18px', borderRadius: 30, background: `linear-gradient(135deg, ${RED2}, ${RED})`, color: ON_RED, fontWeight: 800, textDecoration: 'none' }}>Ver planos</a>
      </div>
    </BCard>
  )

  return (
    <>
      {lista.length === 0 ? (
        <BCard pad={28}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '18px 0' }}>
            <span style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)' }}><Ico d={I_TELA} s={24} /></span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>Ninguém transmitindo agora</span>
            <span style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 420, lineHeight: 1.55 }}>O operador inicia pelo botão <b>Transmitir minha tela</b>, dentro da meta ou em Minha operação, no computador. Quando alguém começar, aparece aqui sozinho — e você recebe um push.</span>
          </div>
        </BCard>
      ) : (
        <div className="sala-grade" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 14 }}>
          <AnimatePresence>
            {lista.map(t => (
              <motion.div key={t.userId} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Tela t={t} agora={agora} estado={estados[t.userId]} stream={streams[t.userId]}
                  onAssistir={() => esp.current?.assistir(t.userId)} onParar={() => esp.current?.parar(t.userId)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <style>{`@keyframes nx-spin { to { transform: rotate(360deg) } } @media (max-width: 900px) { .sala-grade { grid-template-columns: 1fr !important } }`}</style>
    </>
  )
}

export default function SalaPage() {
  const router = useRouter()
  // ?op=ID vem do push 'Assistir'. Lido da URL no cliente (useSearchParams
  // exigiria Suspense na pré-renderização).
  const [opInicial, setOpInicial] = useState(null)
  useEffect(() => { try { setOpInicial(new URLSearchParams(window.location.search).get('op')) } catch {} }, [])
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
      if (!p || p.role !== 'admin') { router.push('/operator'); return }
      setProfile(p)
      const [{ data: t }, { data: s2 }] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (t) setTenant(t)
      if (s2) setSub(s2)
      setLoading(false)
    })()
  }, [])

  // Solo Pro (is_pro) ou plano de equipe (vagas de operador pagas)
  const liberado = useMemo(() => {
    const ativa = sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())
    return !!(ativa && (Number(sub?.operator_count || 0) > 0 || profile?.is_pro || sub?.is_pro))
  }, [sub, profile])

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'
  const moldura = filho => (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 28px' }}>{filho}</div>
      </AppLayout>
    </main>
  )
  if (loading) return moldura(<ModuloEsqueleto cards={2} />)

  return moldura(
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader titulo="Sala ao vivo" sub="A tela dos seus operadores, em tempo real" />
      <Sala userId={user.id} tenantId={profile.tenant_id} nome={getName(profile)} liberado={liberado} opInicial={opInicial} />
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { PREMIACOES, artPath, previewPath, premiacoesEnabled } from '../../lib/premiacoes'

const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'
const fmt = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const ease = [0.33, 1, 0.68, 1]

export default function PremiacoesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [faturamento, setFaturamento] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p) { router.push('/login'); return }
    setProfile(p)
    const [{ data: t }, { data: s2 }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (t) setTenant(t); if (s2) setSub(s2)
    const { data: metas } = await supabase.from('metas').select('lucro_final,status_fechamento,deleted_at').eq('tenant_id', p.tenant_id)
    const total = (metas || []).filter(m => !m.deleted_at && m.status_fechamento === 'fechada').reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    setFaturamento(total)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading && !profile) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )

  const enabled = premiacoesEnabled(user?.email)
  const items = PREMIACOES.map(p => ({ ...p, unlocked: faturamento >= p.value }))
  const conquistados = items.filter(p => p.unlocked).length
  const nextIdx = items.findIndex(p => !p.unlocked)
  const next = nextIdx >= 0 ? items[nextIdx] : null

  // posição no roadmap (0..1): nós centrados em (i+0.5)/N
  const N = items.length
  let roadPos = 1
  if (nextIdx >= 0) {
    const lower = nextIdx > 0 ? items[nextIdx - 1].value : 0
    const upper = items[nextIdx].value
    const frac = Math.max(0, Math.min(1, (faturamento - lower) / (upper - lower)))
    const lowerPos = nextIdx > 0 ? (nextIdx - 1 + 0.5) / N : 0
    const upperPos = (nextIdx + 0.5) / N
    roadPos = lowerPos + frac * (upperPos - lowerPos)
  }

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(245,184,60,0.12)', border: '1px solid rgba(245,184,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#f5b83c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a4 4 0 004-4V5H8v6a4 4 0 004 4zm0 0v4m-4 0h8M8 5H5a2 2 0 000 4h.5M16 5h3a2 2 0 010 4h-.5" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Premiações</h1>
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '2px 0 0' }}>Quadros de faturamento que você conquista e imprime — 15×20 e 30×40 cm</p>
          </div>
        </div>

        {!enabled ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px' }}>Em breve</h2>
            <p style={{ fontSize: 13.5, maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>As premiações estão sendo preparadas. Logo você poderá resgatar os quadros de faturamento da sua operação.</p>
          </div>
        ) : (
          <>
            {/* ═══ HERO PREMIUM: faturamento + roadmap ═══ */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}
              style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '26px 30px 30px', marginBottom: 30, background: 'radial-gradient(120% 140% at 0% 0%, rgba(245,184,60,0.16), transparent 45%), radial-gradient(120% 140% at 100% 20%, rgba(245,120,60,0.12), transparent 50%), linear-gradient(160deg, #1a140a, #0a0a0e)', border: '1px solid rgba(245,184,60,0.28)', boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 60px rgba(245,184,60,0.08)' }}>
              {/* brilho topo */}
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(245,184,60,0.7), transparent)' }} />
              {/* blob */}
              <motion.div aria-hidden animate={{ x: [0, 30, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: -70, right: -20, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,184,60,0.35), transparent 70%)', filter: 'blur(46px)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.2em', color: '#f5b83c', textTransform: 'uppercase', marginBottom: 6 }}>Seu faturamento</div>
                  <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 2px 20px rgba(245,184,60,0.25)' }}>{fmt(faturamento)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: '#f5b83c', fontFamily: 'var(--mono)', lineHeight: 1 }}>{conquistados}<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>/{items.length}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, letterSpacing: '0.04em' }}>quadros conquistados</div>
                </div>
              </div>

              {/* ROADMAP */}
              <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 4 }}>
                <div style={{ position: 'relative', minWidth: 520 }}>
                  {/* trilho */}
                  <div style={{ position: 'absolute', left: `${50 / N}%`, right: `${50 / N}%`, top: 13, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `calc(${Math.max(0, roadPos * 100 - 50 / N)}% )` }} transition={{ duration: 1.3, ease }}
                    style={{ position: 'absolute', left: `${50 / N}%`, top: 13, height: 3, borderRadius: 3, background: 'linear-gradient(90deg, #f5b83c, #ffd98a)', boxShadow: '0 0 10px rgba(245,184,60,0.7)' }} />
                  {/* nós */}
                  <div style={{ position: 'relative', display: 'flex' }}>
                    {items.map((p, i) => {
                      const isNext = i === nextIdx
                      return (
                        <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 0 }}>
                          <div style={{ position: 'relative', width: 28, height: 28 }}>
                            {isNext && <motion.span aria-hidden animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: p.color }} />}
                            <div style={{ position: 'relative', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.unlocked ? 'linear-gradient(135deg, #f5b83c, #d99422)' : '#12141c', border: `2px solid ${p.unlocked ? '#ffd98a' : isNext ? p.color : 'rgba(255,255,255,0.18)'}`, boxShadow: p.unlocked ? '0 0 12px rgba(245,184,60,0.6)' : 'none' }}>
                              {p.unlocked
                                ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#3a2600" strokeWidth={3.2} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                : <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={isNext ? p.color : 'var(--t4)'} strokeWidth={2.4} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
                            </div>
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 800, fontFamily: 'var(--mono)', color: p.unlocked ? '#ffd98a' : isNext ? '#fff' : 'var(--t4)', whiteSpace: 'nowrap' }}>{p.id.toUpperCase()}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {next && (
                <p style={{ position: 'relative', fontSize: 12.5, color: 'var(--t2)', marginTop: 20, textAlign: 'center' }}>
                  Próximo: <strong style={{ color: next.color }}>{next.label}</strong> — faltam <strong style={{ color: '#fff', fontFamily: 'var(--mono)' }}>{fmt(next.value - faturamento)}</strong>
                </p>
              )}
              {!next && <p style={{ position: 'relative', fontSize: 13.5, fontWeight: 700, color: '#f5b83c', marginTop: 20, textAlign: 'center' }}>🎉 Lenda absoluta — você conquistou todos os quadros!</p>}
            </motion.div>

            {/* GRADE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {items.map((p, i) => <QuadroCard key={p.id} p={p} faturamento={faturamento} isNext={i === nextIdx} delay={i * 0.05} />)}
            </div>

            <p style={{ fontSize: 11.5, color: 'var(--t4)', textAlign: 'center', marginTop: 28, lineHeight: 1.6 }}>
              Todo quadro conquistado vem em <strong style={{ color: 'var(--t3)' }}>15×20 cm</strong> e <strong style={{ color: 'var(--t3)' }}>30×40 cm</strong> — baixe e leve pra imprimir na gráfica.
            </p>
          </>
        )}
      </div>
    </AppLayout>
  )
}

function QuadroCard({ p, faturamento, isNext, delay }) {
  const unlocked = p.unlocked
  const falta = Math.max(0, p.value - faturamento)
  const pctToThis = Math.min(100, (faturamento / p.value) * 100)
  const border = unlocked ? p.color + '77' : isNext ? p.color + '55' : 'rgba(255,255,255,0.08)'
  const shadow = unlocked ? `0 16px 44px rgba(0,0,0,0.45), 0 0 42px ${p.color}30` : isNext ? `0 10px 30px rgba(0,0,0,0.35), 0 0 26px ${p.color}1f` : '0 8px 24px rgba(0,0,0,0.28)'
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease }}
      whileHover={{ y: -5 }}
      style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(18,22,32,0.7), var(--surface))', border: `1px solid ${border}`, boxShadow: shadow }}>

      {/* PLACA — sempre em cor cheia */}
      <div style={{ position: 'relative', aspectRatio: '3 / 4', background: `radial-gradient(120% 100% at 50% 0%, ${p.color}22, #070a10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img src={previewPath(p)} alt={`Quadro ${p.label}`} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }} />

        {/* brilho passando (só conquistado) */}
        {unlocked && (
          <motion.span aria-hidden animate={{ x: ['-130%', '340%'] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'linear', repeatDelay: 2.2 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '28%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', transform: 'skewX(-18deg)', pointerEvents: 'none' }} />
        )}

        {/* tier (topo esq) */}
        <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 20, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.45)', border: `1px solid ${p.color}66`, color: p.color, backdropFilter: 'blur(4px)' }}>{p.tier}</div>

        {/* estado (topo dir) */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 800, backdropFilter: 'blur(4px)', background: unlocked ? 'rgba(245,184,60,0.9)' : 'rgba(0,0,0,0.5)', border: `1px solid ${unlocked ? '#ffd98a' : 'rgba(255,255,255,0.18)'}`, color: unlocked ? '#3a2600' : 'var(--t2)' }}>
          {unlocked
            ? <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Conquistado</>
            : <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> {isNext ? 'Próximo' : 'Bloqueado'}</>}
        </div>

        {/* rodapé de progresso quando bloqueado (translúcido — não esconde a placa) */}
        {!unlocked && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 12px 11px', background: 'linear-gradient(0deg, rgba(4,7,12,0.94) 30%, transparent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>faltam</span>
              <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 800, fontFamily: 'var(--mono)' }}>{fmt(falta)}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pctToThis}%` }} transition={{ duration: 1.1, ease }} style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${p.color}, #fff)` }} />
            </div>
          </div>
        )}
      </div>

      {/* rodapé */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: unlocked ? 10 : 2 }}>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--t1)' }}>{p.label}</span>
          <span style={{ fontSize: 12, fontWeight: 900, fontFamily: 'var(--mono)', color: p.color }}>{p.id.toUpperCase()}</span>
        </div>
        {unlocked ? (
          p.available ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={artPath(p, '15x20')} download style={dlBtn(p.color)}><DownloadIcon /> 15×20</a>
              <a href={artPath(p, '30x40')} download style={dlBtn(p.color)}><DownloadIcon /> 30×40</a>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '9px 0', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>🎉 Conquistado! Arte em breve.</div>
          )
        ) : (
          <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0 }}>Desbloqueie ao atingir <strong style={{ color: 'var(--t3)', fontFamily: 'var(--mono)' }}>{fmt(p.value)}</strong> de faturamento.</p>
        )}
      </div>
    </motion.div>
  )
}

function dlBtn(color) {
  return { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 800, color: '#fff', background: color, border: 'none', cursor: 'pointer' }
}
function DownloadIcon() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}

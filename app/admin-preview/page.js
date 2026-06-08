'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { C, USER, KPIS, FEED, RANKING, LEADERS, NETWORKS, ACCUM, fmtBRL } from './_components/mock'
import { Sparkline, MiniBars, AreaChart } from './_components/charts'
import PreviewSidebar from './_components/PreviewSidebar'

// ── Count-up dos numeros (motion) ──
function CountUp({ target, prefix = '', suffix = '', sep = false, dur = 900 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf, start
    const tick = ts => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  const r = Math.round(n)
  const s = sep ? String(r).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : String(r)
  return <>{prefix}{s}{suffix}</>
}

const KPI_NUM = {
  lucro: { target: 23348, prefix: 'R$ ', sep: true },
  metas: { target: 68 },
  taxa: { target: 82, suffix: '%' },
  online: { target: 22 },
}

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] },
})

function Card({ children, style, glow = true, ...rest }) {
  return (
    <motion.div
      whileHover={glow ? { scale: 1.02 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onMouseEnter={e => { if (glow) { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,49,49,0.10), 0 14px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,49,49,0.08)' } }}
      onMouseLeave={e => { if (glow) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)' } }}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)', transition: 'border-color 0.2s, box-shadow 0.2s',
        ...style,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ height: 64, background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[0, 1, 2, 3].map(i => <div key={i} style={{ height: 140, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }} />)}
      </div>
      <div style={{ height: 360, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }} />
      <style jsx>{`div > div { animation: sk 1.3s ease-in-out infinite; } @keyframes sk { 0%,100%{opacity:.5} 50%{opacity:.85} }`}</style>
    </div>
  )
}

const toneColor = t => (t === 'success' ? C.success : t === 'loss' ? C.loss : '#5B9BFF')
const toneDot = t => (t === 'success' ? '🟢' : t === 'loss' ? '🔴' : '🔵')

export default function AdminPreview() {
  const [ready, setReady] = useState(false)
  const [now, setNow] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 650)
    try {
      setNow(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }))
    } catch { setNow('') }
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bgGrad, color: C.text, position: 'relative', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Grid tecnologico quase invisivel */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '46px 46px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%)',
      }} />

      <PreviewSidebar />

      <main style={{ position: 'relative', zIndex: 1, marginLeft: 212, padding: '26px 30px 60px' }} className="ap-main">
        {/* ── HEADER ── */}
        <motion.header {...fade(0)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 26 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>Olá, {USER.name}</h1>
            <p style={{ fontSize: 13.5, color: C.sub, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              Central Operacional <span style={{ color: C.faint }}>•</span> Dados em tempo real
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: C.successDim, border: `1px solid rgba(34,197,94,0.25)` }}>
              <span style={{ position: 'relative', width: 7, height: 7 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.success }} />
                <motion.span animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.success }} />
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.success, letterSpacing: '0.04em' }}>SISTEMA ONLINE</span>
            </div>
            <span style={{ fontSize: 12.5, color: C.sub, textTransform: 'capitalize' }}>{now}</span>
            <button style={{ width: 38, height: 38, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span style={{ position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: '50%', background: C.primary, border: `2px solid ${C.card}` }} />
            </button>
          </div>
        </motion.header>

        {!ready ? <Skeleton /> : (
          <>
            {/* ── KPIs ── */}
            <div className="ap-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
              {KPIS.map((k, i) => {
                const up = k.delta >= 0
                const num = KPI_NUM[k.id]
                return (
                  <Card key={k.id} {...fade(i + 1)} style={{ padding: '18px 18px 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 500 }}>{k.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: up ? C.success : C.loss, background: up ? C.successDim : 'rgba(255,77,77,0.12)', padding: '2px 7px', borderRadius: 6 }}>
                        {up ? '▲' : '▼'} {Math.abs(k.delta)}%
                      </span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--mono, monospace)', marginBottom: 10 }}>
                      <CountUp target={num.target} prefix={num.prefix} suffix={num.suffix} sep={num.sep} />
                    </div>
                    <div style={{ height: 42, opacity: 0.95 }}>
                      {k.type === 'bars' ? <MiniBars data={k.data} color={k.color} /> : <Sparkline data={k.data} color={k.color} />}
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* ── CENTRO: feed + coluna direita ── */}
            <div className="ap-mid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 18 }}>
              {/* Feed operacional ao vivo */}
              <Card {...fade(5)} glow={false} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Feed Operacional</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.success, background: C.successDim, padding: '2px 7px', borderRadius: 5, letterSpacing: '0.04em' }}>AO VIVO</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.faint }}>últimas 24min</span>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }} className="ap-scroll">
                  {FEED.map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05, duration: 0.4 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                      <span style={{ fontSize: 13 }}>{toneDot(f.tone)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, margin: 0 }}><strong style={{ fontWeight: 600 }}>{f.op}</strong> <span style={{ color: C.sub }}>{f.action}</span></p>
                        <p style={{ fontSize: 10.5, color: C.faint, margin: '2px 0 0' }}>{f.t} atrás</p>
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--mono, monospace)', color: toneColor(f.tone) }}>{f.value}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Coluna direita */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[LEADERS.operador, LEADERS.rede].map((l, i) => (
                    <Card key={i} {...fade(6 + i)} style={{ padding: '16px' }}>
                      <span style={{ fontSize: 22 }}>{l.medal}</span>
                      <p style={{ fontSize: 10.5, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 2px' }}>{l.sub}</p>
                      <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{l.name}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: 'var(--mono, monospace)', margin: '2px 0 0' }}>{l.value}</p>
                    </Card>
                  ))}
                </div>
                <Card {...fade(8)} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 26 }}>{LEADERS.meta.medal}</span>
                  <div>
                    <p style={{ fontSize: 10.5, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>meta mais lucrativa</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: C.success, fontFamily: 'var(--mono, monospace)', margin: 0 }}>{LEADERS.meta.name}</p>
                  </div>
                </Card>

                {/* Ranking top 5 */}
                <Card {...fade(9)} glow={false} style={{ padding: '16px 18px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 14px' }}>Ranking Operadores</p>
                  {RANKING.map((r, i) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: i === RANKING.length - 1 ? 0 : 13 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#161f30,#0a0f18)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? C.primary : C.sub }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono, monospace)', color: C.text }}>R$ {fmtBRL(r.lucro)}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: r.pct + '%' }} transition={{ delay: 0.5 + i * 0.08, duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
                            style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${C.primary}, #ff6b6b)`, boxShadow: '0 0 8px rgba(255,49,49,0.5)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>

            {/* ── GRAFICO LUCRO ACUMULADO ── */}
            <Card {...fade(10)} glow={false} style={{ padding: '18px 20px 10px', marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Lucro Acumulado</p>
                  <p style={{ fontSize: 11, color: C.faint, margin: '3px 0 0' }}>últimos 30 dias</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono, monospace)', margin: 0 }}>R$ {fmtBRL(ACCUM[ACCUM.length - 1])}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.success, margin: '2px 0 0' }}>▲ 18,4% no período</p>
                </div>
              </div>
              <AreaChart data={ACCUM} color={C.primary} h={240} />
            </Card>

            {/* ── REDES (central operacional) ── */}
            <Card {...fade(11)} glow={false} style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Redes Conectadas</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.sub, background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: 5 }}>{NETWORKS.length} ativas</span>
              </div>
              <div className="ap-nets" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                {NETWORKS.map((n, i) => (
                  <motion.div key={n.name} {...fade(12 + i * 0.3)}
                    style={{ padding: '14px 16px', borderRadius: 12, background: C.cardHi, border: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.pct > 60 ? C.success : n.pct > 35 ? C.primary : C.faint, boxShadow: `0 0 8px ${n.pct > 60 ? 'rgba(34,197,94,0.6)' : 'rgba(255,49,49,0.5)'}` }} />
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{n.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: C.faint }}>{n.metas} metas</span>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono, monospace)', margin: '0 0 10px' }}>R$ {fmtBRL(n.lucro)}</p>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: n.pct + '%' }} transition={{ delay: 0.6 + i * 0.07, duration: 0.7 }}
                        style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${C.primary}, #ff6b6b)` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            <p style={{ textAlign: 'center', fontSize: 11, color: C.faint, marginTop: 28 }}>
              Versão visual experimental · dados fictícios · isolada da produção
            </p>
          </>
        )}
      </main>

      <style jsx global>{`
        .ap-scroll::-webkit-scrollbar { width: 6px; }
        .ap-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        @media (max-width: 1100px) {
          .ap-kpis { grid-template-columns: repeat(2,1fr) !important; }
          .ap-mid { grid-template-columns: 1fr !important; }
          .ap-nets { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 720px) {
          .ap-main { margin-left: 0 !important; padding: 18px 16px 50px !important; }
          .ap-kpis { grid-template-columns: 1fr 1fr !important; }
          .ap-nets { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { C, tone, USER, HERO, STATUS, FEED, PODIUM, PODIUM_REST, NETWORKS, NET_STATUS, ACCUM, fmtBRL } from './_components/mock'
import { AreaChart } from './_components/charts'
import PreviewSidebar from './_components/PreviewSidebar'

function CountUp({ target, prefix = '', sep = true, dur = 1100 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf, start
    const tick = ts => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / dur)
      setN(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, dur])
  const r = Math.round(n)
  return <>{prefix}{sep ? String(r).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : r}</>
}

const fade = (i = 0, y = 16) => ({
  initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay: i * 0.07, ease: [0.33, 1, 0.68, 1] },
})

const NUM = { fontFamily: "'Space Grotesk', ui-monospace, monospace", fontVariantNumeric: 'tabular-nums' }

function Panel({ children, style, ...rest }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, ...style }} {...rest}>{children}</div>
}

const Eyebrow = ({ children, c }) => (
  <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: c || C.faint }}>{children}</span>
)

export default function AdminPreview() {
  const [now, setNow] = useState('')
  useEffect(() => {
    try { setNow(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })) } catch {}
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, position: 'relative', fontFamily: 'Inter, system-ui, sans-serif', '--num': "'Space Grotesk', ui-monospace, monospace" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap" />

      {/* Fundo: gradiente vermelho discreto + grid + ruido */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(1100px 520px at 78% -12%, rgba(255,49,49,0.07), transparent 62%)' }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, #000 35%, transparent 100%)' }} />
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.022, pointerEvents: 'none', zIndex: 0 }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <PreviewSidebar />

      <main style={{ position: 'relative', zIndex: 1, marginLeft: 224, padding: '24px 28px 60px' }} className="cc-main">

        {/* ── 1 · HERO: lucro do dia protagonista ── */}
        <motion.div {...fade(0)}>
          <Panel style={{ padding: '26px 28px', position: 'relative', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`, opacity: 0.5 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ position: 'relative', width: 8, height: 8 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.green }} />
                    <motion.span animate={{ scale: [1, 2.6], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.green }} />
                  </span>
                  <Eyebrow c={C.sub}>Lucro operacional de hoje</Eyebrow>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ ...NUM, fontSize: 68, fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(255,49,49,0.25)' }}>
                    <CountUp target={HERO.lucro} prefix="R$ " />
                  </span>
                  <span style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: C.green, background: C.greenSoft, padding: '4px 10px', borderRadius: 8 }}>▲ {HERO.delta}%</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Eyebrow>{now}</Eyebrow>
                <p style={{ fontSize: 12, color: C.faint, margin: '8px 0 0' }}>Central de Comando · {USER.first}</p>
              </div>
            </div>

            {/* mini indicadores */}
            <div className="cc-ind" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, marginTop: 24, background: C.line, border: `1px solid ${C.line}`, borderRadius: 12, overflow: 'hidden' }}>
              {HERO.indicadores.map((ind, i) => {
                const t = ind.tone ? tone[ind.tone] : null
                return (
                  <div key={i} style={{ background: C.panel, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: C.faint, margin: '0 0 6px' }}>{ind.label}</p>
                    <p style={{ ...NUM, fontSize: 22, fontWeight: 600, margin: 0, color: t ? t.c : C.text }}>{ind.value}</p>
                  </div>
                )
              })}
            </div>
          </Panel>
        </motion.div>

        {/* ── 2 · STATUS DA OPERAÇÃO (radar) ── */}
        <motion.div {...fade(1)}>
          <Panel style={{ padding: '14px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 20, borderRight: `1px solid ${C.line}` }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tone[STATUS.tone].c} strokeWidth={2} strokeLinecap="round"><path d="M12 2a10 10 0 1010 10" /><path d="M12 12l6-3" /><circle cx="12" cy="12" r="1.6" fill={tone[STATUS.tone].c} stroke="none" /></svg>
              <div>
                <Eyebrow>Status da operação</Eyebrow>
                <p style={{ fontSize: 15, fontWeight: 700, margin: '2px 0 0', color: tone[STATUS.tone].c, letterSpacing: '0.02em' }}>{STATUS.estado}</p>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 26, flexWrap: 'wrap' }}>
              {STATUS.itens.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone[it.tone].c, boxShadow: `0 0 7px ${tone[it.tone].c}` }} />
                  <span style={{ fontSize: 11.5, color: C.faint }}>{it.k}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{it.v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* ── 3 + 4 · FEED (centro) + PODIUM ── */}
        <div className="cc-mid" style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* FEED terminal */}
          <motion.div {...fade(2)}>
            <Panel style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '15px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Eyebrow c={C.sub}>Feed operacional</Eyebrow>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: C.green, background: C.greenSoft, padding: '2px 7px', borderRadius: 5, letterSpacing: '0.08em' }}>● AO VIVO</span>
                </div>
                <span style={{ fontSize: 11, color: C.faint, ...NUM }}>{FEED.length} eventos</span>
              </div>
              <div className="cc-scroll" style={{ maxHeight: 420, overflowY: 'auto', padding: '4px 0' }}>
                {FEED.map((f, i) => {
                  const t = tone[f.tone]
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.045, duration: 0.4 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', borderBottom: `1px solid rgba(255,255,255,0.025)` }}>
                      <span style={{ ...NUM, fontSize: 12, color: C.faint, width: 38, flexShrink: 0 }}>{f.time}</span>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.c, flexShrink: 0, boxShadow: `0 0 6px ${t.c}` }} />
                      <span style={{ flex: 1, fontSize: 13, minWidth: 0 }}>
                        <strong style={{ fontWeight: 600 }}>{f.op}</strong> <span style={{ color: C.sub }}>{f.act}</span>
                      </span>
                      <span style={{ ...NUM, fontSize: 13.5, fontWeight: 600, color: t.c }}>{f.value}</span>
                    </motion.div>
                  )
                })}
              </div>
            </Panel>
          </motion.div>

          {/* PODIUM operadores */}
          <motion.div {...fade(3)}>
            <Panel style={{ padding: '18px 18px', height: '100%' }}>
              <Eyebrow c={C.sub}>Pódium operacional</Eyebrow>

              {/* 1º lugar destaque */}
              <div style={{ marginTop: 14, padding: '18px', borderRadius: 14, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(255,49,49,0.12), rgba(255,49,49,0.02))', border: `1px solid rgba(255,49,49,0.28)` }}>
                <div style={{ position: 'absolute', top: -30, right: -10, fontSize: 90, opacity: 0.12 }}>🥇</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{PODIUM[0].medal}</span>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{PODIUM[0].name}</p>
                    <p style={{ fontSize: 11, color: C.faint, margin: '1px 0 0' }}>{PODIUM[0].metas} metas</p>
                  </div>
                </div>
                <p style={{ ...NUM, fontSize: 26, fontWeight: 700, color: C.green, margin: '12px 0 0' }}>{PODIUM[0].lucro}</p>
              </div>

              {/* 2º e 3º */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                {PODIUM.slice(1).map((p, i) => (
                  <div key={i} style={{ padding: '13px', borderRadius: 12, background: C.panelHi, border: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 18 }}>{p.medal}</span>
                    <p style={{ fontSize: 13.5, fontWeight: 600, margin: '6px 0 0' }}>{p.name}</p>
                    <p style={{ fontSize: 10.5, color: C.faint, margin: '1px 0 5px' }}>{p.metas} metas</p>
                    <p style={{ ...NUM, fontSize: 14, fontWeight: 600, color: C.green, margin: 0 }}>{p.lucro}</p>
                  </div>
                ))}
              </div>

              {/* 4º e 5º compactos */}
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                {PODIUM_REST.map(p => (
                  <div key={p.pos} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 2px' }}>
                    <span style={{ ...NUM, fontSize: 12, color: C.faint, width: 16 }}>{p.pos}</span>
                    <span style={{ flex: 1, fontSize: 12.5 }}>{p.name}</span>
                    <span style={{ fontSize: 10.5, color: C.faint }}>{p.metas} metas</span>
                    <span style={{ ...NUM, fontSize: 12.5, fontWeight: 600, color: C.sub }}>{p.lucro}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>
        </div>

        {/* ── 5 · FORÇA DAS REDES ── */}
        <motion.div {...fade(4)}>
          <Panel style={{ padding: '18px 20px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Eyebrow c={C.sub}>Força das redes</Eyebrow>
              <div style={{ display: 'flex', gap: 14 }}>
                {Object.entries(NET_STATUS).map(([k, s]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: C.faint }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.c }} /> {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {NETWORKS.map((n, i) => {
                const s = NET_STATUS[n.status]
                return (
                  <div key={n.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 64, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.c, boxShadow: `0 0 7px ${s.c}` }} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{n.name}</span>
                    </div>
                    <span style={{ ...NUM, fontSize: 13.5, fontWeight: 600, width: 92, flexShrink: 0 }}>R$ {fmtBRL(n.lucro)}</span>
                    <span style={{ fontSize: 11.5, color: C.faint, width: 64, flexShrink: 0 }}>{n.metas} metas</span>
                    <div style={{ flex: 1, height: 9, borderRadius: 5, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: n.pct + '%' }} transition={{ delay: 0.4 + i * 0.07, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                        style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${s.c}aa, ${s.c})`, boxShadow: `0 0 10px ${s.c}55` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </motion.div>

        {/* ── 6 · GRÁFICO acumulado ── */}
        <motion.div {...fade(5)}>
          <Panel style={{ padding: '18px 20px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
              <div>
                <Eyebrow c={C.sub}>Lucro acumulado</Eyebrow>
                <p style={{ fontSize: 11, color: C.faint, margin: '5px 0 0' }}>últimos 30 dias</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ ...NUM, fontSize: 24, fontWeight: 700, margin: 0 }}>R$ {fmtBRL(ACCUM[ACCUM.length - 1])}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.green, margin: '2px 0 0' }}>▲ 18,4% no período</p>
              </div>
            </div>
            <AreaChart data={ACCUM} color={C.red} h={190} />
          </Panel>
        </motion.div>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.faint, marginTop: 26 }}>
          Versão visual experimental · dados fictícios · isolada da produção
        </p>
      </main>

      <style jsx global>{`
        .cc-scroll::-webkit-scrollbar { width: 6px; }
        .cc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .cc-scroll::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 1080px) {
          .cc-mid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .cc-main { margin-left: 0 !important; padding: 16px 14px 50px !important; }
          .cc-ind { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}

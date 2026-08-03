'use client'
// ─────────────────────────────────────────────────────────────────────────
// DepositCaptureStage — tela cheia "sistema rodando ao vivo" da captura de
// depositos. Premium, cinematografica, feita pra gravar: total gigante
// contando, depositos entrando com animacao, glow que pulsa a cada captura,
// tickers "+R$" subindo. Paleta enxuta (preto + mint + acento red).
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MINT = '#d1fae5'
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Total com count-up suave
function AnimatedTotal({ value }) {
  const [disp, setDisp] = useState(value || 0)
  const fromRef = useRef(value || 0)
  const rafRef = useRef(null)
  useEffect(() => {
    const from = fromRef.current, to = value || 0, dur = 600, t0 = performance.now()
    cancelAnimationFrame(rafRef.current)
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setDisp(from + (to - from) * e)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])
  const [intPart, decPart] = fmt(disp).split(',')
  return (
    <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', letterSpacing: '-0.03em', lineHeight: 1 }}>
      <span style={{ fontSize: 'clamp(48px, 9vw, 104px)', fontWeight: 800, color: '#fff', textShadow: `0 0 60px rgba(209,250,229,0.35)` }}>
        <span style={{ fontSize: '0.42em', fontWeight: 700, color: MINT, verticalAlign: '0.28em', marginRight: 6 }}>R$</span>
        {intPart}
      </span>
      <span style={{ fontSize: 'clamp(24px, 4vw, 44px)', fontWeight: 700, color: 'rgba(209,250,229,0.55)' }}>,{decPart}</span>
    </span>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: '14px 10px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 8, fontFamily: 'var(--mono, monospace)' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || '#fafafa', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  )
}

export default function DepositCaptureStage({ open, total, count, max, casas, last, busy, onFinish, onCancel }) {
  const [floaters, setFloaters] = useState([])
  const prevCount = useRef(count)
  const [flash, setFlash] = useState(0)

  // Novo deposito -> pulso + ticker "+R$X" subindo
  useEffect(() => {
    if (!open) { prevCount.current = count; return }
    if (count > prevCount.current) {
      const v = last && last[0] ? last[0].valor : null
      if (v != null) {
        const id = `${count}-${v}`
        setFloaters(f => [...f, { id, v }])
        setTimeout(() => setFloaters(f => f.filter(x => x.id !== id)), 1800)
      }
      setFlash(x => x + 1)
    }
    prevCount.current = count
  }, [count, open, last])

  const media = count > 0 ? total / count : 0

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10050, background: '#040504', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ── FUNDO cinematografico ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '46px 46px', maskImage: 'radial-gradient(ellipse at 50% 42%, #000 30%, transparent 78%)' }} />
      <motion.div
        key={flash}
        initial={{ opacity: 0.5 }} animate={{ opacity: 0.16 }} transition={{ duration: 1.2 }}
        style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 900, borderRadius: '50%', pointerEvents: 'none', background: `radial-gradient(circle, rgba(209,250,229,0.16), transparent 62%)`, filter: 'blur(40px)' }} />

      {/* ── TOPO ── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.3, repeat: Infinity }} style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff4d4d', boxShadow: '0 0 12px #ff4d4d' }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: '#fff', fontFamily: 'var(--mono, monospace)' }}>AO VIVO</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.14em', fontFamily: 'var(--mono, monospace)' }}>· CAPTURA DE DEPÓSITOS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono, monospace)', letterSpacing: '0.1em' }}>
          <span style={{ fontWeight: 900, color: MINT }}>Nex</span>Control
        </div>
      </div>

      {/* ── HERO total ── */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px', minHeight: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(209,250,229,0.6)', fontWeight: 700, marginBottom: 18, fontFamily: 'var(--mono, monospace)' }}>Total capturado</div>

        <motion.div animate={{ scale: [1, 1.035, 1] }} key={flash} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} style={{ position: 'relative' }}>
          <AnimatedTotal value={total} />
          {/* tickers +R$ subindo */}
          <AnimatePresence>
            {floaters.map(f => (
              <motion.div key={f.id}
                initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: [0, 1, 1, 0], y: -70, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 1.7, ease: 'easeOut' }}
                style={{ position: 'absolute', top: -6, right: -14, fontFamily: 'var(--mono, monospace)', fontWeight: 800, fontSize: 22, color: MINT, textShadow: '0 0 18px rgba(209,250,229,0.6)', pointerEvents: 'none' }}>
                +R$ {fmt(f.v)}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div style={{ marginTop: 20, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          <b style={{ color: '#fff', fontWeight: 800 }}>{count}</b> depósito{count !== 1 ? 's' : ''} capturado{count !== 1 ? 's' : ''} · somando sozinho
        </div>

        {/* stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, marginTop: 30, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', maxWidth: 640, width: '100%' }}>
          <Stat label="Depósitos" value={count} />
          <Stat label="Média" value={`R$ ${fmt(media)}`} />
          <Stat label="Maior" value={`R$ ${fmt(max)}`} accent={MINT} />
          <Stat label="Casas" value={casas || 0} />
        </div>
      </div>

      {/* ── FEED lateral (ultimas capturas) ── */}
      {last && last.length > 0 && (
        <div style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', width: 260, maxHeight: '62vh', overflow: 'hidden', display: 'none' }} className="nx-cap-feed">
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 10, fontFamily: 'var(--mono, monospace)' }}>Entrando agora</div>
          <AnimatePresence initial={false}>
            {last.slice(0, 8).map((c, i) => (
              <motion.div key={c.order_id}
                initial={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }} animate={{ opacity: 1 - i * 0.09, x: 0, height: 'auto', marginBottom: 7 }} exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: i === 0 ? 'rgba(209,250,229,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(209,250,229,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{c.casa || 'PIX'}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? MINT : '#fafafa', fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(c.valor)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── RODAPE acoes ── */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 12, padding: '20px 26px 30px' }}>
        <button type="button" onClick={onFinish} disabled={busy}
          style={{ padding: '15px 30px', borderRadius: 13, border: 'none', background: MINT, color: '#04140c', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: busy ? 'wait' : 'pointer', boxShadow: '0 10px 34px rgba(209,250,229,0.28)', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Finalizar e usar total
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding: '15px 22px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>

      <style>{`@media (min-width: 1024px){ .nx-cap-feed { display: block !important; } }`}</style>
    </div>
  )
}

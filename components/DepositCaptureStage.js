'use client'
// ─────────────────────────────────────────────────────────────────────────
// DepositCaptureStage — tela cheia "sistema rodando ao vivo".
// 2 cards: DEPÓSITOS (ativo, vermelho, radar girando, total subindo aos poucos)
// e SAQUES (em breve). Cinematografico, feito pra gravar.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const RED = '#ff3b3b'
const RED_DEEP = '#c1121f'
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Total com count-up GRADUAL (sobe os numeros aos poucos, sem pular)
function AnimatedTotal({ value, color = '#fff', accent = RED, big = true }) {
  const [disp, setDisp] = useState(value || 0)
  const fromRef = useRef(value || 0)
  const rafRef = useRef(null)
  useEffect(() => {
    const from = fromRef.current, to = value || 0
    const delta = Math.abs(to - from)
    if (delta < 0.005) { setDisp(to); fromRef.current = to; return }
    // duracao proporcional ao salto (min 900ms, max 2200ms) -> sensacao de "subindo"
    const dur = Math.min(2200, 900 + delta * 3)
    const t0 = performance.now()
    cancelAnimationFrame(rafRef.current)
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(from + (to - from) * e)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])
  const [intPart, decPart] = fmt(disp).split(',')
  return (
    <span style={{ fontFamily: 'var(--mono, "JetBrains Mono", monospace)', letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: big ? '0.44em' : '0.5em', fontWeight: 700, color: accent, verticalAlign: '0.3em', marginRight: 5 }}>R$</span>
      <span style={{ fontSize: big ? 'clamp(40px, 6vw, 76px)' : 32, fontWeight: 800, color, textShadow: big ? `0 0 46px ${accent}66` : 'none' }}>{intPart}</span>
      <span style={{ fontSize: big ? 'clamp(20px, 3vw, 34px)' : 20, fontWeight: 700, color: `${accent}cc` }}>,{decPart}</span>
    </span>
  )
}

// Radar girando (sweep conico + aneis + blips)
function Radar({ active = true, color = RED, size = 150 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, opacity: active ? 1 : 0.28 }}>
      {[1, 0.68, 0.36].map((s, i) => (
        <div key={i} style={{ position: 'absolute', inset: `${(1 - s) * 50}%`, borderRadius: '50%', border: `1px solid ${color}${i === 0 ? '55' : '2e'}` }} />
      ))}
      {/* cruz */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: `${color}22` }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: `${color}22` }} />
      {/* sweep */}
      {active && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 0deg, ${color}00 0deg, ${color}00 300deg, ${color}55 350deg, ${color}dd 360deg)`, animation: 'nx-radar 2.6s linear infinite', maskImage: 'radial-gradient(circle, #000 62%, transparent 63%)', WebkitMaskImage: 'radial-gradient(circle, #000 62%, transparent 63%)' }} />
      )}
      {/* centro */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 7, height: 7, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}` }} />
      {active && <div style={{ position: 'absolute', top: '32%', left: '58%', width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, animation: 'nx-blip 2.6s ease-in-out infinite' }} />}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 110, textAlign: 'center', padding: '13px 10px' }}>
      <div style={{ fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 7, fontFamily: 'var(--mono, monospace)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent || '#fafafa', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  )
}

export default function DepositCaptureStage({ open, total, count, max, casas, last, busy, onFinish, onCancel }) {
  const [floaters, setFloaters] = useState([])
  const prevCount = useRef(count)
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    if (!open) { prevCount.current = count; return }
    if (count > prevCount.current) {
      const v = last && last[0] ? last[0].valor : null
      if (v != null) {
        const id = `${count}-${v}`
        setFloaters(f => [...f, { id, v }])
        setTimeout(() => setFloaters(f => f.filter(x => x.id !== id)), 1900)
      }
      setFlash(x => x + 1)
    }
    prevCount.current = count
  }, [count, open, last])

  const media = count > 0 ? total / count : 0
  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10050, background: '#050303', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* fundo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,60,60,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,60,60,0.035) 1px, transparent 1px)', backgroundSize: '46px 46px', maskImage: 'radial-gradient(ellipse at 50% 42%, #000 28%, transparent 78%)' }} />
      <motion.div key={flash} initial={{ opacity: 0.4 }} animate={{ opacity: 0.14 }} transition={{ duration: 1 }}
        style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 880, height: 880, borderRadius: '50%', pointerEvents: 'none', background: `radial-gradient(circle, ${RED}33, transparent 60%)`, filter: 'blur(48px)' }} />

      {/* topo */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 9, height: 9, borderRadius: '50%', background: RED, boxShadow: `0 0 14px ${RED}` }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: '#fff', fontFamily: 'var(--mono, monospace)' }}>AO VIVO</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.34)', letterSpacing: '0.14em', fontFamily: 'var(--mono, monospace)' }}>· CAPTURA EM TEMPO REAL</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono, monospace)', letterSpacing: '0.1em' }}>
          <span style={{ fontWeight: 900, color: RED }}>Nex</span>Control
        </div>
      </div>

      {/* cards */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch', justifyContent: 'center', padding: '10px 20px', minHeight: 0 }}>

        {/* ── DEPÓSITOS (ativo) ── */}
        <motion.div key={flash} animate={{ boxShadow: [`0 0 0 1px ${RED}44, 0 0 60px ${RED}22`, `0 0 0 1px ${RED}88, 0 0 90px ${RED}55`, `0 0 0 1px ${RED}44, 0 0 60px ${RED}22`] }} transition={{ duration: 0.6 }}
          style={{ position: 'relative', overflow: 'hidden', flex: '1 1 380px', maxWidth: 500, minWidth: 300, borderRadius: 22, padding: '26px 26px 22px', background: `linear-gradient(180deg, #1a0808, #0a0403)`, border: `1px solid ${RED}44`, display: 'flex', flexDirection: 'column' }}>
          {/* radar de fundo */}
          <div style={{ position: 'absolute', right: -30, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}><Radar active size={260} /></div>
          <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: `linear-gradient(90deg, transparent, ${RED}, transparent)` }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.16em', color: RED, fontFamily: 'var(--mono, monospace)' }}>DEPÓSITOS</span>
            <motion.span animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: RED, boxShadow: `0 0 10px ${RED}` }} />
          </div>
          <div style={{ position: 'relative', fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 'auto' }}>somando sozinho a cada QR</div>

          <div style={{ position: 'relative', margin: '26px 0 6px' }}>
            <AnimatedTotal value={total} />
            <AnimatePresence>
              {floaters.map(f => (
                <motion.div key={f.id}
                  initial={{ opacity: 0, y: 8, scale: 0.8 }} animate={{ opacity: [0, 1, 1, 0], y: -64, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  style={{ position: 'absolute', top: -4, left: 4, fontFamily: 'var(--mono, monospace)', fontWeight: 800, fontSize: 20, color: RED, textShadow: `0 0 18px ${RED}`, pointerEvents: 'none' }}>
                  +R$ {fmt(f.v)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div style={{ position: 'relative', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            <b style={{ color: '#fff', fontWeight: 800 }}>{count}</b> depósito{count !== 1 ? 's' : ''} capturado{count !== 1 ? 's' : ''}
          </div>

          {/* ultimas 3 */}
          <div style={{ position: 'relative', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 5, minHeight: 40 }}>
            <AnimatePresence initial={false}>
              {(last || []).slice(0, 3).map((c, i) => (
                <motion.div key={c.order_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1 - i * 0.22, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 11px', borderRadius: 9, background: i === 0 ? `${RED}1a` : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? RED + '44' : 'rgba(255,255,255,0.06)'}` }}>
                  <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{c.casa || 'PIX'}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: i === 0 ? RED : '#fafafa', fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(c.valor)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── SAQUES (em breve) ── */}
        <div style={{ position: 'relative', overflow: 'hidden', flex: '1 1 380px', maxWidth: 500, minWidth: 300, borderRadius: 22, padding: '26px', background: 'linear-gradient(180deg, #0c0c0d, #070707)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', right: -30, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><Radar active={false} color="#888" size={260} /></div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono, monospace)' }}>SAQUES</span>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>EM BREVE</span>
          </div>
          <div style={{ position: 'relative', fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginBottom: 'auto' }}>captura automática de saques</div>

          <div style={{ position: 'relative', margin: '26px 0 6px', opacity: 0.5 }}>
            <AnimatedTotal value={0} color="rgba(255,255,255,0.55)" accent="rgba(255,255,255,0.4)" />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Em desenvolvimento
          </div>
        </div>
      </div>

      {/* stats */}
      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, margin: '8px auto 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', maxWidth: 640, width: 'calc(100% - 40px)', flexShrink: 0 }}>
        <Stat label="Depósitos" value={count} />
        <Stat label="Média" value={`R$ ${fmt(media)}`} />
        <Stat label="Maior" value={`R$ ${fmt(max)}`} accent={RED} />
        <Stat label="Casas" value={casas || 0} />
      </div>

      {/* rodape */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 12, padding: '18px 26px 28px', flexShrink: 0 }}>
        <button type="button" onClick={onFinish} disabled={busy}
          style={{ padding: '15px 30px', borderRadius: 13, border: 'none', background: `linear-gradient(180deg, ${RED}, ${RED_DEEP})`, color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: busy ? 'wait' : 'pointer', boxShadow: `0 10px 34px ${RED}55, inset 0 1px 0 rgba(255,255,255,0.2)`, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Finalizar e usar total
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding: '15px 22px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>

      <style>{`
        @keyframes nx-radar { to { transform: rotate(360deg); } }
        @keyframes nx-blip { 0%,100%{opacity:0} 45%{opacity:0} 55%{opacity:1} 70%{opacity:0.6} }
      `}</style>
    </div>
  )
}

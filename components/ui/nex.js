'use client'
// ─────────────────────────────────────────────────────────────────────────
// NEX UI — sistema de design "centro de comando".
// Mesma linguagem do painel /owner novo: preto puro, hierarquia forte,
// números em mono, vermelho como acento, mint só pra lucro positivo.
// Primitivas reutilizáveis para o dashboard do cliente (admin + operador).
// Regra da casa: só preto/branco/vermelho/mint. Sem azul, âmbar, roxo ou ouro.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// ── tokens ──
export const NX = {
  red: 'var(--brand)', redSoft: 'var(--loss)', redDeep: 'var(--brand)',
  mint: 'var(--profit)', loss: 'var(--loss)',
  t1: 'var(--t1)', t2: 'var(--t2)', t3: 'var(--t3)', t4: 'var(--t4)',
  line: 'var(--b1)', lineSoft: 'var(--fill-1)',
  mono: 'var(--mono, "JetBrains Mono", monospace)',
}

export const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const fmt0 = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
export const brl = v => 'R$ ' + fmt(v)

// superfície padrão: preto sólido + filetes laterais de luz
export const surface = {
  borderRadius: 24, background: 'var(--surface)', border: `1px solid ${NX.line}`,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
}

// ── contagem animada ──
export function useCount(target, dur = 1000) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const t = Number(target || 0); let raf; const start = performance.now()
    const tick = now => { const p = Math.min((now - start) / dur, 1); setV(t * (1 - Math.pow(1 - p, 4))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return v
}

// ── rótulo de seção ──
export function Eyebrow({ children, color = NX.t3 }) {
  return <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color, margin: '0 0 10px' }}>{children}</p>
}
export function Sub({ children, color = NX.t4 }) {
  return <p style={{ fontSize: 11.5, color, margin: '7px 0 0', lineHeight: 1.45 }}>{children}</p>
}

// ── número monetário / inteiro ──
export function Valor({ v, size = 28, color = NX.t1, prefix = 'R$ ', animate = true }) {
  const n = useCount(animate ? v : 0)
  return <span style={{ fontFamily: NX.mono, fontSize: size, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{prefix}{fmt(animate ? n : v)}</span>
}
export function Num({ v, size = 24, color = NX.t1, suffix = '' }) {
  const n = useCount(v)
  return <span style={{ fontFamily: NX.mono, fontSize: size, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{fmt0(n)}{suffix}</span>
}

// ── variação ▲▼ ──
export function Delta({ pct, inverse = false }) {
  if (pct == null || isNaN(pct)) return null
  const up = pct >= 0
  const bom = inverse ? !up : up
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 800, fontFamily: NX.mono, color: bom ? NX.mint : NX.loss, padding: '3px 8px', borderRadius: 7, background: bom ? 'rgba(209,250,229,0.08)' : 'rgba(239,68,68,0.1)' }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d={up ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} /></svg>
      {Math.abs(pct)}%
    </span>
  )
}

// ── painel ──
export function Panel({ children, style, accent = false, pad = '22px 24px', ...rest }) {
  return (
    <div style={{
      ...surface, padding: pad, position: 'relative', overflow: 'hidden',
      ...(accent ? { border: '1px solid rgba(225,29,29,0.3)', boxShadow: `${surface.boxShadow}, 0 0 60px rgba(225,29,29,0.07)` } : null),
      ...style,
    }} {...rest}>
      {accent && <div aria-hidden style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1.5, background: `linear-gradient(90deg, transparent, ${NX.red}, transparent)` }} />}
      {children}
    </div>
  )
}

// ── tira de métricas coladas (sem gap, divididas por filete) ──
export function Strip({ items, cols }) {
  const n = cols || items.length
  return (
    <div className="nx-strip" style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 1, borderRadius: 16, overflow: 'hidden', border: `1px solid ${NX.line}`, background: 'var(--fill-1)' }}>
      {items.map((c, i) => (
        <div key={i} style={{ padding: '15px 17px', background: 'var(--surface)' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: NX.t3, margin: '0 0 8px' }}>{c.l}</p>
          <div>{c.v}</div>
          {c.hint && <p style={{ fontSize: 10.5, color: NX.t4, margin: '6px 0 0' }}>{c.hint}</p>}
        </div>
      ))}
    </div>
  )
}

// ── barra de progresso ──
export function Bar({ pct, color, height = 8, glow = true }) {
  const c = color || NX.red
  const p = Math.max(0, Math.min(100, pct))
  return (
    <div style={{ height, borderRadius: height / 2, background: 'var(--fill-1)', overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
        style={{ height: '100%', borderRadius: height / 2, background: `linear-gradient(90deg, ${c}, ${c === NX.red ? '#ff5b56' : '#7ff0ae'})`, boxShadow: glow ? `0 0 12px ${c === NX.red ? 'rgba(225,29,29,0.5)' : 'rgba(209,250,229,0.4)'}` : 'none' }} />
    </div>
  )
}

// ── sparkline ──
export function Spark({ data, w = 150, h = 40, color }) {
  const c = color || NX.mint
  if (!data?.length) return null
  const max = Math.max(...data), min = Math.min(...data), span = max - min || 1
  const step = w / (data.length - 1 || 1)
  const pts = data.map((v, i) => [i * step, h - ((v - min) / span) * h])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  const id = 'sg' + Math.round(w + h)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.22" /><stop offset="100%" stopColor={c} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.8" fill={c} />
    </svg>
  )
}

// ── linha de lista (ranking, feed) ──
export function Row({ left, right, sub, avatar, pos, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${NX.lineSoft}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {pos != null && <span style={{ fontFamily: NX.mono, fontSize: 10, fontWeight: 800, color: pos === 1 ? NX.redSoft : NX.t4, width: 16, flexShrink: 0 }}>{pos}º</span>}
        {avatar && <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'var(--fill-2)', border: `1px solid ${NX.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: NX.t2 }}>{avatar}</span>}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, color: NX.t1, margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{left}</p>
          {sub && <p style={{ fontSize: 10.5, color: NX.t4, margin: '2px 0 0' }}>{sub}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  )
}

// ── pill de status ──
export function Pill({ children, tone = 'neutral' }) {
  const map = {
    neutral: { bg: 'var(--fill-1)', bd: NX.line, c: NX.t2 },
    red: { bg: 'rgba(225,29,29,0.12)', bd: 'rgba(225,29,29,0.32)', c: NX.redSoft },
    mint: { bg: 'rgba(209,250,229,0.1)', bd: 'rgba(209,250,229,0.25)', c: NX.mint },
    loss: { bg: 'rgba(239,68,68,0.1)', bd: 'rgba(239,68,68,0.28)', c: NX.loss },
  }[tone] || {}
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 800, background: map.bg, border: `1px solid ${map.bd}`, color: map.c, whiteSpace: 'nowrap' }}>{children}</span>
}

// ── ponto pulsante "ao vivo" ──
export function LiveDot({ color }) {
  const c = color || NX.mint
  return (
    <motion.span animate={{ boxShadow: [`0 0 0 0 ${c === NX.mint ? 'rgba(209,250,229,0.5)' : 'rgba(225,29,29,0.5)'}`, `0 0 0 6px rgba(0,0,0,0)`, `0 0 0 0 rgba(0,0,0,0)`] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block', flexShrink: 0 }} />
  )
}

// ── entrada animada ──
export const rise = (i = 0) => ({
  initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] },
})

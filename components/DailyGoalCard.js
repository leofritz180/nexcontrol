'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────
// META DO DIA — card premium com fundo escuro profundo e glow de estado que
// muda conforme o progresso: vermelho (atrás) → vermelho intenso (reta final)
// → mint (batida). Sem emojis: ícones SVG. LUCRO (R$) do DIA OPERACIONAL
// (vira 5h). Gráfico = barra horizontal. data = { target, today, streak, best, hit }
// ─────────────────────────────────────────────────────────────────────────
const fmt = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

// Paletas por estado — base quase preta + glow discreto (sem amarelo/dourado).
const PAL = {
  low:  { b1: '#230a0c', b2: '#0a0405', a1: 'rgba(255,74,74,0.26)', a2: 'rgba(229,57,53,0.18)', ring: '#ff4a4a', accent: '#ff8a86', border: 'rgba(255,96,96,0.30)', shadow: 'rgba(229,57,53,0.32)' },
  near: { b1: '#2c0a0a', b2: '#0c0505', a1: 'rgba(255,58,58,0.40)', a2: 'rgba(255,40,40,0.26)', ring: '#ff2d2d', accent: '#ff7a75', border: 'rgba(255,72,72,0.44)', shadow: 'rgba(255,48,48,0.42)' },
  hit:  { b1: '#06210f', b2: '#03110a', a1: 'rgba(52,230,140,0.30)', a2: 'rgba(34,197,94,0.20)', ring: '#2fe08a', accent: '#7ff0ae', border: 'rgba(52,220,140,0.34)', shadow: 'rgba(34,197,94,0.36)' },
}

function meshBg(p) {
  return `radial-gradient(120% 120% at 0% 0%, ${p.a1} 0%, transparent 46%),`
    + `radial-gradient(110% 110% at 100% 6%, ${p.a2} 0%, transparent 50%),`
    + `radial-gradient(130% 130% at 92% 118%, ${p.a2} 0%, transparent 48%),`
    + `linear-gradient(140deg, ${p.b1} 0%, ${p.b2} 100%)`
}

// ── Ícones (lucide-style, stroke) ──
const Icon = ({ d, size = 22, sw = 1.8, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
)
const TargetIco = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /></>} />
const FlameIco = (p) => <Icon {...p} d={<path d="M12 2s5 4.5 5 9a5 5 0 0 1-10 0c0-1.6.8-3 1.6-4C9 9 9 11 10 11c1.2 0 1-2.4 0-4-.7-1.1-.4-3.4 2-5z" />} />
const TrophyIco = (p) => <Icon {...p} d={<><path d="M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 6H4.5a2 2 0 0 0 0 4H6M17 6h2.5a2 2 0 0 1 0 4H18M9 20h6M12 14v6" /></>} />
const CheckIco = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.4 2.4 4.6-5" /></>} />

function GoalEditor({ initial, onSave, onCancel }) {
  const [v, setV] = useState(initial ? String(initial) : '')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input autoFocus value={v} onChange={e => setV(e.target.value.replace(/\D/g, '').slice(0, 7))}
          inputMode="numeric" placeholder="ex: 5000"
          onKeyDown={e => { if (e.key === 'Enter') onSave(v) }}
          style={{ flex: 1, padding: '12px 14px', borderRadius: 11, background: 'rgba(0,0,0,0.32)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 16, fontFamily: 'var(--mono)', fontWeight: 800, outline: 'none' }} />
        <button onClick={() => onSave(v)} style={{ padding: '0 18px', borderRadius: 11, border: 'none', background: '#fff', color: '#111', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', flexShrink: 0 }}>Salvar</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[500, 1000, 2000, 5000].map(s => (
          <button key={s} onClick={() => setV(String(s))} style={{ padding: '5px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--mono)' }}>{fmt(s)}</button>
        ))}
        {onCancel && <button onClick={onCancel} style={{ padding: '5px 11px', borderRadius: 8, border: 'none', background: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12, cursor: 'pointer' }}>cancelar</button>}
      </div>
    </div>
  )
}

export default function DailyGoalCard({ data, onSave }) {
  const { target = 0, today = 0, streak = 0, best = 0, hit = false } = data || {}
  const [editing, setEditing] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const pct = target > 0 ? (today / target) * 100 : 0
  const remaining = Math.max(0, target - today)
  const over = Math.max(0, today - target)
  const st = hit ? PAL.hit : pct >= 80 ? PAL.near : PAL.low

  async function save(n) {
    const val = Math.max(0, Math.floor(Number(n) || 0))
    await onSave(val || null)
    setEditing(false)
    if (val) { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500) }
  }

  // moldura premium comum
  const frame = (extra = {}) => ({
    position: 'relative', overflow: 'hidden', borderRadius: 20, marginBottom: 24,
    background: meshBg(st), border: `1px solid ${st.border}`,
    boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 70px ${st.shadow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
    ...extra,
  })

  const blob = (
    <motion.div aria-hidden
      animate={{ x: [0, 30, 0], y: [0, -14, 0], opacity: [0.5, 0.78, 0.5] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', top: -60, right: -20, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${st.a1}, transparent 70%)`, filter: 'blur(38px)', pointerEvents: 'none' }} />
  )

  // sino/hairline no topo
  const topLine = <div style={{ position: 'absolute', top: 0, left: '7%', right: '7%', height: 1.5, background: `linear-gradient(90deg, transparent, ${st.accent}, transparent)`, opacity: 0.85 }} />

  // tile de ícone premium
  const iconTile = (IconCmp, sz = 52, isz = 24) => (
    <div style={{ width: sz, height: sz, borderRadius: 15, flexShrink: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(0,0,0,0.28))', border: `1px solid ${st.border}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 6px 18px rgba(0,0,0,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.accent }}>
      <IconCmp size={isz} />
    </div>
  )

  // ── Sem meta definida ──
  if (!target) {
    const p = PAL.low
    const bg = meshBg(p)
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '24px 26px', marginBottom: 24, background: bg, border: `1px solid ${p.border}`, boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 70px ${p.shadow}, inset 0 1px 0 rgba(255,255,255,0.08)` }}>
        <div style={{ position: 'absolute', top: 0, left: '7%', right: '7%', height: 1.5, background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)`, opacity: 0.85 }} />
        <motion.div aria-hidden animate={{ x: [0, 28, 0], opacity: [0.45, 0.72, 0.45] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: -60, right: -20, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${p.a1}, transparent 70%)`, filter: 'blur(36px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(0,0,0,0.28))', border: `1px solid ${p.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.accent, flexShrink: 0 }}>
            <TargetIco size={28} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Defina sua meta de lucro do dia</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>Qual o lucro que o time deve bater por dia? Acompanhe o progresso e mantenha a sequência.</p>
          </div>
          {editing
            ? <GoalEditor onSave={save} onCancel={() => setEditing(false)} />
            : <button onClick={() => setEditing(true)} style={{ padding: '13px 24px', borderRadius: 12, border: 'none', background: '#fff', color: '#7a1015', fontWeight: 900, fontSize: 14, cursor: 'pointer', flexShrink: 0, boxShadow: '0 10px 26px rgba(0,0,0,0.35)' }}>Definir meta →</button>}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={frame({ padding: '22px 26px' })}>
      {blob}
      {topLine}
      <AnimatePresence>
        {hit && [...Array(7)].map((_, i) => (
          <motion.span key={i} aria-hidden initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.4], y: [0, -24 - i * 4] }} transition={{ duration: 1.9, repeat: Infinity, delay: i * 0.26, ease: 'easeOut' }} style={{ position: 'absolute', top: 18, left: `${14 + i * 11}%`, width: 4, height: 4, borderRadius: '50%', background: st.accent, boxShadow: `0 0 8px ${st.ring}` }} />
        ))}
      </AnimatePresence>

      {editing ? (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.2em', color: st.accent, textTransform: 'uppercase', flexShrink: 0 }}>Meta do dia</span>
          <GoalEditor initial={target} onSave={save} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* ícone + números */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            {iconTile(TargetIco, 52, 24)}
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', color: st.accent, textTransform: 'uppercase', marginBottom: 4 }}>Meta do dia</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 35, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>{fmt(today)}</span>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--mono)', fontWeight: 700 }}>/ {fmt(target)}</span>
              </div>
            </div>
          </div>

          {/* barra + legenda */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7, gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {hit
                  ? <><CheckIco size={15} color={st.accent} /><strong>Meta batida.</strong>{over > 0 ? <> <span style={{ color: st.accent }}>+{fmt(over)}</span> acima</> : ''}</>
                  : <>faltam <strong style={{ color: st.accent, fontFamily: 'var(--mono)' }}>{fmt(remaining)}</strong> pra bater hoje</>}
              </span>
              {best > 0 && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}><TrophyIco size={13} color="rgba(255,255,255,0.6)" /> recorde {fmt(best)}</span>}
            </div>
            <div style={{ position: 'relative', height: 11, borderRadius: 6, background: 'rgba(0,0,0,0.34)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1.1, ease: [0.33, 1, 0.68, 1] }}
                style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg, #fff, ${st.ring})`, boxShadow: `0 0 12px ${st.ring}` }} />
            </div>
          </div>

          {/* streak + alterar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {streak > 1 && <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', border: `1px solid ${st.border}`, fontSize: 12, fontWeight: 800, color: st.accent, whiteSpace: 'nowrap' }}><FlameIco size={13} color={st.accent} /> {streak} dias</motion.span>}
            {savedFlash && <CheckIco size={15} color="#fff" />}
            <button onClick={() => setEditing(true)} title="Alterar meta" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,0,0,0.26)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

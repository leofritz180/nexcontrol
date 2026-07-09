'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────
// META DO DIA — card gamificado no painel principal. O admin define uma meta
// diária de depositantes; o card mostra progresso do DIA OPERACIONAL (vira 5h),
// quanto falta, comemora ao bater, e conta a sequência de dias batendo (🔥).
// data = { target, today, streak, best, hit }
// ─────────────────────────────────────────────────────────────────────────
const RED = '#e53935', GREEN = '#22C55E', GOLD = '#f5b83c'
const fmt = n => Number(n || 0).toLocaleString('pt-BR')

function Ring({ pct, hit }) {
  const size = 132, sw = 11, r = (size - sw) / 2, c = 2 * Math.PI * r
  const p = Math.min(100, pct)
  const color = hit ? GREEN : p >= 80 ? GOLD : RED
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * p) / 100 }}
          transition={{ duration: 1.3, ease: [0.33, 1, 0.68, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}aa)` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {hit ? (
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 200 }} style={{ fontSize: 34 }}>🎯</motion.div>
        ) : (
          <>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>{Math.floor(p)}<span style={{ fontSize: 14 }}>%</span></span>
          </>
        )}
      </div>
    </div>
  )
}

function GoalEditor({ initial, onSave, onCancel }) {
  const [v, setV] = useState(initial ? String(initial) : '')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input autoFocus value={v} onChange={e => setV(e.target.value.replace(/\D/g, '').slice(0, 7))}
          inputMode="numeric" placeholder="ex: 1000"
          onKeyDown={e => { if (e.key === 'Enter') onSave(v) }}
          style={{ flex: 1, padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: 16, fontFamily: 'var(--mono)', fontWeight: 800, outline: 'none' }} />
        <button onClick={() => onSave(v)} style={{ padding: '0 18px', borderRadius: 11, border: 'none', background: RED, color: '#fff', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', flexShrink: 0 }}>Salvar</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[500, 1000, 2000, 5000].map(s => (
          <button key={s} onClick={() => setV(String(s))} style={{ padding: '5px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'var(--t2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--mono)' }}>{fmt(s)}</button>
        ))}
        {onCancel && <button onClick={onCancel} style={{ padding: '5px 11px', borderRadius: 8, border: 'none', background: 'none', color: 'var(--t4)', fontSize: 12, cursor: 'pointer' }}>cancelar</button>}
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

  async function save(n) {
    const val = Math.max(0, Math.floor(Number(n) || 0))
    await onSave(val || null)
    setEditing(false)
    if (val) { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500) }
  }

  const accent = hit ? GREEN : pct >= 80 ? GOLD : RED
  const glow = hit ? 'rgba(34,197,94,0.18)' : pct >= 80 ? 'rgba(245,184,60,0.14)' : 'rgba(229,57,53,0.12)'

  // ── Sem meta definida: convite pra criar ──
  if (!target) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '22px 24px', marginBottom: 24, background: 'linear-gradient(135deg, rgba(229,57,53,0.1), var(--surface))', border: '1px solid rgba(229,57,53,0.24)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(229,57,53,0.16)', border: '1px solid rgba(229,57,53,0.34)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🎯</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>Defina sua meta do dia</p>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5 }}>Quantos depositantes o time deve processar por dia? Acompanhe o progresso e mantenha a sequência.</p>
          </div>
          {editing
            ? <GoalEditor onSave={save} onCancel={() => setEditing(false)} />
            : <button onClick={() => setEditing(true)} style={{ padding: '12px 22px', borderRadius: 12, border: 'none', background: RED, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', flexShrink: 0, boxShadow: '0 8px 22px rgba(229,57,53,0.35)' }}>Definir meta →</button>}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '22px 26px', marginBottom: 24, background: `linear-gradient(135deg, ${glow}, var(--surface))`, border: `1px solid ${accent}44`, boxShadow: hit ? `0 0 40px ${glow}` : 'none' }}>
      {/* faixa superior de luz */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${accent}88, transparent)` }} />

      {/* sparkles ao bater */}
      <AnimatePresence>
        {hit && [...Array(6)].map((_, i) => (
          <motion.span key={i} aria-hidden
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], y: [0, -18 - i * 4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
            style={{ position: 'absolute', top: 20, left: `${18 + i * 12}%`, fontSize: 13 }}>✨</motion.span>
        ))}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
        <Ring pct={pct} hit={hit} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: accent, textTransform: 'uppercase' }}>Meta do dia</span>
            {streak > 1 && (
              <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 20, background: 'rgba(245,120,40,0.14)', border: '1px solid rgba(245,120,40,0.34)', fontSize: 11, fontWeight: 800, color: '#ffa657' }}>
                🔥 {streak} dias seguidos
              </motion.span>
            )}
          </div>

          {editing ? (
            <div style={{ marginTop: 8 }}><GoalEditor initial={target} onSave={save} onCancel={() => setEditing(false)} /></div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmt(today)}</span>
                <span style={{ fontSize: 15, color: 'var(--t3)', fontFamily: 'var(--mono)', fontWeight: 700 }}>/ {fmt(target)} depositantes</span>
              </div>

              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: hit ? '#7ee6a4' : 'var(--t2)', fontWeight: 600, lineHeight: 1.4 }}>
                {hit
                  ? <>🎉 <strong style={{ color: '#7ee6a4' }}>Meta batida!</strong> {over > 0 && <>Já são <strong style={{ color: '#fff' }}>{fmt(over)}</strong> acima — bora esticar?</>}</>
                  : <>Faltam <strong style={{ color: '#fff', fontFamily: 'var(--mono)' }}>{fmt(remaining)}</strong> depositantes pra bater a meta de hoje.</>}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                {best > 0 && <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>🏆 Recorde: <strong style={{ color: 'var(--t1)', fontFamily: 'var(--mono)' }}>{fmt(best)}</strong>/dia</span>}
                <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--t4)', fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  alterar meta
                </button>
                {savedFlash && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 11.5, color: '#7ee6a4', fontWeight: 700 }}>✓ salvo</motion.span>}
              </div>

              {/* barra fina de progresso extra */}
              <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1.3, ease: [0.33, 1, 0.68, 1] }}
                  style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, ${accent}bb)`, boxShadow: `0 0 10px ${accent}` }} />
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

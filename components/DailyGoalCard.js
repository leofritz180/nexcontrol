'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────
// META DO DIA — card gamificado com FUNDO PREENCHIDO (mesh gradient vibrante)
// que muda de cor conforme o progresso: vermelho → âmbar (reta final) → verde
// (batida). Progresso do DIA OPERACIONAL (vira 5h). data = { target, today,
// streak, best, hit }
// ─────────────────────────────────────────────────────────────────────────
const RED = '#e53935'
// Meta do dia = LUCRO em R$
const fmt = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

// Paletas por estado (fundo cheio + acentos)
const PAL = {
  low:  { b1: '#4c0d11', b2: '#170608', a1: 'rgba(255,74,74,0.60)', a2: 'rgba(229,57,53,0.42)', ring: '#ff6b66', accent: '#ff8a86', border: 'rgba(255,96,96,0.45)', shadow: 'rgba(229,57,53,0.45)' },
  near: { b1: '#4a3207', b2: '#191104', a1: 'rgba(255,193,66,0.55)', a2: 'rgba(245,150,30,0.42)', ring: '#ffb020', accent: '#ffcf6b', border: 'rgba(255,193,66,0.5)',  shadow: 'rgba(245,160,40,0.45)' },
  hit:  { b1: '#0a3d23', b2: '#04160d', a1: 'rgba(52,230,140,0.55)', a2: 'rgba(34,197,94,0.42)', ring: '#2fe08a', accent: '#7ff0ae', border: 'rgba(52,220,140,0.5)',  shadow: 'rgba(34,197,94,0.5)' },
}
// Paleta VERDE premium (variante exclusiva do owner)
const G = { b1: '#0b3d24', b2: '#03130b', a1: 'rgba(48,224,138,0.5)', a2: 'rgba(16,150,96,0.42)', accent: '#34e08a', bright: '#8ff5b9', border: 'rgba(52,220,140,0.42)', shadow: 'rgba(34,197,94,0.4)' }

function meshBg(p) {
  return `radial-gradient(130% 130% at 0% 0%, ${p.a1} 0%, transparent 42%),`
    + `radial-gradient(120% 120% at 100% 8%, ${p.a2} 0%, transparent 48%),`
    + `radial-gradient(140% 140% at 90% 110%, ${p.a2} 0%, transparent 46%),`
    + `linear-gradient(135deg, ${p.b1} 0%, ${p.b2} 100%)`
}

function Ring({ pct, hit, color }) {
  const size = 138, sw = 12, r = (size - sw) / 2, c = 2 * Math.PI * r
  const p = Math.min(100, pct)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * p) / 100 }}
          transition={{ duration: 1.3, ease: [0.33, 1, 0.68, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {hit ? (
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 200 }} style={{ fontSize: 38, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>🎯</motion.div>
        ) : (
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>{Math.floor(p)}<span style={{ fontSize: 15 }}>%</span></span>
        )}
      </div>
    </div>
  )
}

function GoalEditor({ initial, onSave, onCancel, dark }) {
  const [v, setV] = useState(initial ? String(initial) : '')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input autoFocus value={v} onChange={e => setV(e.target.value.replace(/\D/g, '').slice(0, 7))}
          inputMode="numeric" placeholder="ex: 5000"
          onKeyDown={e => { if (e.key === 'Enter') onSave(v) }}
          style={{ flex: 1, padding: '12px 14px', borderRadius: 11, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 16, fontFamily: 'var(--mono)', fontWeight: 800, outline: 'none' }} />
        <button onClick={() => onSave(v)} style={{ padding: '0 18px', borderRadius: 11, border: 'none', background: '#fff', color: '#111', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', flexShrink: 0 }}>Salvar</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[500, 1000, 2000, 5000].map(s => (
          <button key={s} onClick={() => setV(String(s))} style={{ padding: '5px 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--mono)' }}>{fmt(s)}</button>
        ))}
        {onCancel && <button onClick={onCancel} style={{ padding: '5px 11px', borderRadius: 8, border: 'none', background: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>cancelar</button>}
      </div>
    </div>
  )
}

// Mini-gráfico dos últimos 7 dias (variante premium) — barras de lucro/dia + linha da meta
function MiniLucroBars({ history, target, accent, bright }) {
  const hist = history || []
  const max = Math.max(target || 0, ...hist.map(h => h.value), 1)
  const targetY = 100 - (target / max) * 100
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Últimos 7 dias</span>
        <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)' }}>— — linha da meta</span>
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, height: 66 }}>
        {/* linha da meta */}
        {target > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: `${Math.max(0, targetY)}%`, borderTop: `1.5px dashed ${bright}`, opacity: 0.6, pointerEvents: 'none' }} />
        )}
        {hist.map((h, i) => {
          const hp = Math.max(3, (h.value / max) * 100)
          const isToday = i === hist.length - 1
          const hitDay = target > 0 && h.value >= target
          const dd = h.day.slice(8) + '/' + h.day.slice(5, 7)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end', minWidth: 0 }}>
              <motion.div initial={{ height: 0 }} animate={{ height: `${hp}%` }} transition={{ duration: 0.9, delay: i * 0.05, ease: [0.33, 1, 0.68, 1] }}
                title={`${dd}: R$ ${Math.round(h.value).toLocaleString('pt-BR')}`}
                style={{
                  width: '100%', maxWidth: 24, borderRadius: 5,
                  background: hitDay ? `linear-gradient(180deg, ${bright}, ${accent})` : 'rgba(255,255,255,0.14)',
                  boxShadow: isToday ? `0 0 12px ${accent}` : 'none',
                  border: isToday ? `1px solid ${bright}` : '1px solid transparent',
                }} />
              <span style={{ fontSize: 8, color: isToday ? bright : 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)', fontWeight: isToday ? 800 : 500 }}>{dd}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DailyGoalCard({ data, onSave, premium }) {
  const { target = 0, today = 0, streak = 0, best = 0, hit = false, history = [] } = data || {}
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

  // Blob de luz animado (dá vida ao fundo cheio)
  const blob = (
    <motion.div aria-hidden
      animate={{ x: [0, 34, 0], y: [0, -16, 0], opacity: [0.55, 0.85, 0.55] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'absolute', top: -50, right: -10, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${st.a1}, transparent 70%)`, filter: 'blur(34px)', pointerEvents: 'none' }} />
  )

  // ── Sem meta definida ──
  if (!target) {
    const p = premium ? G : PAL.low
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '24px 26px', marginBottom: 24, background: meshBg(p), border: `1px solid ${p.border}`, boxShadow: `0 18px 50px rgba(0,0,0,0.5), 0 0 60px ${p.shadow}` }}>
        <motion.div aria-hidden animate={{ x: [0, 30, 0], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: -50, right: -10, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${p.a1}, transparent 70%)`, filter: 'blur(32px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>🎯</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Defina sua meta de lucro do dia</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Qual o lucro que o time deve bater por dia? Acompanhe o progresso e mantenha a sequência 🔥</p>
          </div>
          {editing
            ? <GoalEditor onSave={save} onCancel={() => setEditing(false)} />
            : <button onClick={() => setEditing(true)} style={{ padding: '13px 24px', borderRadius: 12, border: 'none', background: '#fff', color: '#7a1015', fontWeight: 900, fontSize: 14, cursor: 'pointer', flexShrink: 0, boxShadow: '0 10px 26px rgba(0,0,0,0.35)' }}>Definir meta →</button>}
        </div>
      </motion.div>
    )
  }

  // ── VARIANTE PREMIUM VERDE (exclusiva do owner) — sem círculo de %, com barra
  //    elegante + mini-gráfico de 7 dias e linha da meta ──
  if (premium) {
    const glow = hit ? 'rgba(52,230,140,0.5)' : G.shadow
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '26px 30px', marginBottom: 24, background: meshBg(G), border: `1px solid ${G.border}`, boxShadow: `0 22px 60px rgba(0,0,0,0.55), 0 0 80px ${glow}` }}>
        <motion.div aria-hidden animate={{ x: [0, 36, 0], y: [0, -18, 0], opacity: [0.5, 0.82, 0.5] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: -60, right: -20, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${G.a1}, transparent 70%)`, filter: 'blur(38px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1.5, background: `linear-gradient(90deg, transparent, ${G.bright}, transparent)` }} />
        <AnimatePresence>
          {hit && [...Array(7)].map((_, i) => (
            <motion.span key={i} aria-hidden initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], y: [0, -24 - i * 4] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: 'easeOut' }} style={{ position: 'absolute', top: 16, left: `${14 + i * 11}%`, fontSize: 14 }}>✨</motion.span>
          ))}
        </AnimatePresence>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.22em', color: G.bright, textTransform: 'uppercase' }}>Meta do dia</span>
              {streak > 1 && <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.28)', fontSize: 11.5, fontWeight: 800, color: '#ffd0a0' }}>🔥 {streak} dias</motion.span>}
            </div>
            {!editing && <button onClick={() => setEditing(true)} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: 11, cursor: 'pointer', padding: '5px 11px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', gap: 5 }}><svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>alterar</button>}
          </div>

          {editing ? (
            <GoalEditor initial={target} onSave={save} onCancel={() => setEditing(false)} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 46, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 2px 18px rgba(0,0,0,0.45)' }}>{fmt(today)}</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--mono)', fontWeight: 700 }}>de {fmt(target)}</span>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 14, color: '#fff', fontWeight: 600 }}>
                {hit ? <>🎉 <strong style={{ color: G.bright }}>Meta do dia batida!</strong> {over > 0 && <>+{fmt(over)} acima.</>}</> : <>Faltam <strong style={{ color: G.bright, fontFamily: 'var(--mono)' }}>{fmt(remaining)}</strong> pra bater a meta de hoje.</>}
              </p>

              {/* barra premium com marcos + cometa + brilho */}
              <div style={{ position: 'relative', marginTop: 18, height: 14, borderRadius: 8, background: 'rgba(0,0,0,0.32)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                {[25, 50, 75].map(t => <div key={t} style={{ position: 'absolute', left: `${t}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.12)' }} />)}
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1.3, ease: [0.33, 1, 0.68, 1] }}
                  style={{ position: 'relative', height: '100%', borderRadius: 8, background: `linear-gradient(90deg, ${G.accent}, ${G.bright})`, boxShadow: `0 0 16px ${G.accent}` }}>
                  <motion.span aria-hidden animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: `0 0 14px ${G.bright}` }} />
                  <motion.span aria-hidden animate={{ x: ['-120%', '320%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: 1.3 }} style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} />
                </motion.div>
              </div>

              <MiniLucroBars history={history} target={target} accent={G.accent} bright={G.bright} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
                {best > 0 && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>🏆 Recorde: <strong style={{ color: '#fff', fontFamily: 'var(--mono)' }}>{fmt(best)}</strong>/dia</span>}
                {savedFlash && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 11.5, color: G.bright, fontWeight: 700 }}>✓ salvo</motion.span>}
              </div>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '24px 28px', marginBottom: 24, background: meshBg(st), border: `1px solid ${st.border}`, boxShadow: `0 20px 55px rgba(0,0,0,0.55), 0 0 70px ${st.shadow}` }}>
      {blob}
      {/* linha de luz no topo */}
      <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1.5, background: `linear-gradient(90deg, transparent, ${st.accent}, transparent)` }} />

      {/* sparkles ao bater */}
      <AnimatePresence>
        {hit && [...Array(7)].map((_, i) => (
          <motion.span key={i} aria-hidden
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], y: [0, -22 - i * 4] }}
            transition={{ duration: 1.9, repeat: Infinity, delay: i * 0.26, ease: 'easeOut' }}
            style={{ position: 'absolute', top: 18, left: `${14 + i * 11}%`, fontSize: 14 }}>✨</motion.span>
        ))}
      </AnimatePresence>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <Ring pct={pct} hit={hit} color={st.ring} />

        <div style={{ flex: 1, minWidth: 230 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.2em', color: '#fff', textTransform: 'uppercase', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>Meta do dia</span>
            {streak > 1 && (
              <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.3)', fontSize: 11.5, fontWeight: 800, color: '#ffd0a0' }}>
                🔥 {streak} dias seguidos
              </motion.span>
            )}
          </div>

          {editing ? (
            <div style={{ marginTop: 8 }}><GoalEditor initial={target} onSave={save} onCancel={() => setEditing(false)} /></div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 2px 14px rgba(0,0,0,0.45)' }}>{fmt(today)}</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--mono)', fontWeight: 700 }}>/ {fmt(target)} de lucro</span>
              </div>

              <p style={{ margin: '9px 0 0', fontSize: 14, color: '#fff', fontWeight: 600, lineHeight: 1.45 }}>
                {hit
                  ? <>🎉 <strong>Meta batida!</strong> {over > 0 && <>Já são <strong style={{ color: st.accent }}>{fmt(over)}</strong> acima — bora esticar?</>}</>
                  : <>Faltam <strong style={{ color: st.accent, fontFamily: 'var(--mono)' }}>{fmt(remaining)}</strong> pra bater a meta de hoje.</>}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 13, flexWrap: 'wrap' }}>
                {best > 0 && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>🏆 Recorde: <strong style={{ color: '#fff', fontFamily: 'var(--mono)' }}>{fmt(best)}</strong>/dia</span>}
                <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  alterar meta
                </button>
                {savedFlash && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 11.5, color: '#fff', fontWeight: 700 }}>✓ salvo</motion.span>}
              </div>

              {/* barra de progresso preenchida */}
              <div style={{ marginTop: 15, height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1.3, ease: [0.33, 1, 0.68, 1] }}
                  style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, #fff, ${st.ring})`, boxShadow: `0 0 14px ${st.ring}` }} />
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

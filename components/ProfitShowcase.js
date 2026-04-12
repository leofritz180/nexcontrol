'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

function CountUpValue({ value, duration = 2000 }) {
  const [display, setDisplay] = useState('0,00')
  const ref = useRef(null)
  useEffect(() => {
    const num = Math.abs(Number(value || 0))
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(fmt(num * ease))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return display
}

function RadialRing({ progress, size, strokeWidth, color, delay = 0 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  return (
    <motion.circle
      cx={size/2} cy={size/2} r={r}
      fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circ}
      initial={{ strokeDashoffset: circ }}
      animate={{ strokeDashoffset: circ * (1 - progress) }}
      transition={{ duration: 1.8, delay, ease: [0.33,1,0.68,1] }}
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
    />
  )
}

export default function ProfitShowcase({ stats, goalData, operators, metas, onClose }) {
  const [mode, setMode] = useState('total') // total | today | week
  const [printMode, setPrintMode] = useState(false)

  const fechadas = metas.filter(m => m.status_fechamento === 'fechada' && m.fechada_em)
  const now = new Date()
  const todayStr = now.toDateString()
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7)

  const values = useMemo(() => ({
    total: fechadas.reduce((a, m) => a + Number(m.lucro_final || 0), 0),
    today: fechadas.filter(m => new Date(m.fechada_em).toDateString() === todayStr).reduce((a, m) => a + Number(m.lucro_final || 0), 0),
    week: fechadas.filter(m => new Date(m.fechada_em) >= d7).reduce((a, m) => a + Number(m.lucro_final || 0), 0),
  }), [metas])

  const labels = { total: 'Lucro total', today: 'Lucro de hoje', week: 'Ultimos 7 dias' }
  const val = values[mode]
  const isPos = val >= 0
  const mainColor = isPos ? '#22C55E' : '#EF4444'
  const glowColor = isPos ? 'rgba(34,197,94,' : 'rgba(239,68,68,'

  const goalPct = goalData.target > 0 ? Math.min(1, goalData.lucroFinalTotal / goalData.target) : 0
  const ringSize = 320

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: '#020408',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !printMode) onClose() }}
    >
      {/* Ambient background */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor}0.08), transparent 60%)`,
        filter: 'blur(80px)', pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.04), transparent 60%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }}/>

      {/* Top bar */}
      {!printMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            position: 'absolute', top: 24, left: 32, right: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={12} height={12} viewBox="0 0 28 28" fill="none">
                <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
                <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
                <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>NexControl</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPrintMode(true)}
              style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', transition: 'all 0.15s' }}>
              Modo print
            </button>
            <button onClick={onClose}
              style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', transition: 'all 0.15s' }}>
              Fechar
            </button>
          </div>
        </motion.div>
      )}

      {/* Print mode close */}
      {printMode && (
        <button onClick={() => setPrintMode(false)}
          style={{ position: 'absolute', top: 20, right: 24, zIndex: 10, fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
          Sair do print
        </button>
      )}

      {/* Central element */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* SVG rings */}
        <svg width={ringSize} height={ringSize} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={ringSize/2} cy={ringSize/2} r={(ringSize-12)/2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4}/>
          {/* Goal progress ring */}
          <RadialRing progress={goalPct} size={ringSize} strokeWidth={4} color="rgba(255,255,255,0.12)" delay={0.5}/>
        </svg>

        <svg width={ringSize-40} height={ringSize-40} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx={(ringSize-40)/2} cy={(ringSize-40)/2} r={(ringSize-52)/2} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={3}/>
          <RadialRing progress={Math.min(1, Math.abs(val) / Math.max(1, goalData.target || Math.abs(val) * 1.5))} size={ringSize-40} strokeWidth={3} color={mainColor} delay={0.3}/>
        </svg>

        {/* Outer glow ring */}
        <motion.div
          animate={{
            boxShadow: [
              `0 0 40px ${glowColor}0.1), 0 0 80px ${glowColor}0.05)`,
              `0 0 60px ${glowColor}0.15), 0 0 100px ${glowColor}0.08)`,
              `0 0 40px ${glowColor}0.1), 0 0 80px ${glowColor}0.05)`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: ringSize - 80, height: ringSize - 80, borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            {labels[mode]}
          </p>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 42, fontWeight: 900,
            color: mainColor, lineHeight: 1, letterSpacing: '-0.03em', margin: 0,
            textShadow: `0 0 40px ${glowColor}0.3)`,
          }}>
            {isPos ? '+' : '-'}R$ <CountUpValue value={val} key={mode}/>
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            {fechadas.length} metas fechadas
          </p>
        </motion.div>
      </motion.div>

      {/* Period switcher */}
      {!printMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: 4, marginTop: 36, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}
        >
          {[['total','Total'],['today','Hoje'],['week','7 dias']].map(([k,l]) => (
            <button key={k} onClick={() => setMode(k)}
              style={{
                fontSize: 12, fontWeight: 600, padding: '7px 20px', borderRadius: 8,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: mode === k ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: mode === k ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>
              {l}
            </button>
          ))}
        </motion.div>
      )}

      {/* Bottom stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex', gap: 40, marginTop: printMode ? 48 : 44,
        }}
      >
        {[
          { l: 'Depositado', v: `R$ ${fmt(stats.dep)}` },
          { l: 'Sacado', v: `R$ ${fmt(stats.saq)}` },
          { l: 'Operadores', v: operators.length },
          { l: 'Acerto', v: `${stats.taxa}%` },
        ].map(({ l, v }) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l}</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{v}</p>
          </div>
        ))}
      </motion.div>

      {/* Print footer */}
      {printMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'absolute', bottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={8} height={8} viewBox="0 0 28 28" fill="none">
              <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
              <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
              <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
            </svg>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>NexControl</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginLeft: 8 }}>
            {new Date().toLocaleDateString('pt-BR')}
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

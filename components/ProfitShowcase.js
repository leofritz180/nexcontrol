'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const ease = [0.33,1,0.68,1]

function CountUpValue({ value, duration = 2200 }) {
  const [display, setDisplay] = useState('0,00')
  const ref = useRef(null)
  useEffect(() => {
    const num = Math.abs(Number(value || 0))
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setDisplay(fmt(num * (1 - Math.pow(1 - p, 4))))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return display
}

function Ring({ progress, size, strokeWidth, color, delay = 0, glow = true }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  return (
    <motion.circle
      cx={size/2} cy={size/2} r={r}
      fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circ}
      initial={{ strokeDashoffset: circ }}
      animate={{ strokeDashoffset: circ * (1 - Math.max(0, Math.min(1, progress))) }}
      transition={{ duration: 2.2, delay, ease }}
      style={glow ? { filter: `drop-shadow(0 0 10px ${color})` } : {}}
    />
  )
}

function Particles({ color, count = 14, radius = 200 }) {
  const dots = useMemo(() => Array.from({length:count}, (_, i) => ({
    angle: (i / count) * 360,
    dist: radius + Math.random() * 50 - 25,
    size: 1 + Math.random() * 2,
    dur: 5 + Math.random() * 7,
    del: Math.random() * 5,
    opacity: 0.1 + Math.random() * 0.3,
  })), [count, radius])

  return dots.map((d, i) => {
    const rad = (d.angle * Math.PI) / 180
    return (
      <motion.div key={i}
        animate={{ opacity: [d.opacity * 0.2, d.opacity, d.opacity * 0.2], scale: [0.6, 1.3, 0.6] }}
        transition={{ duration: d.dur, delay: d.del, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          left: `calc(50% + ${Math.cos(rad) * d.dist}px)`,
          top: `calc(50% + ${Math.sin(rad) * d.dist}px)`,
          width: d.size, height: d.size, borderRadius: '50%',
          background: color, boxShadow: `0 0 ${d.size * 4}px ${color}`,
          pointerEvents: 'none',
        }}
      />
    )
  })
}

export default function ProfitShowcase({ stats, goalData, operators, metas, onClose }) {
  const [mode, setMode] = useState('total')
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

  const val = values[mode]
  const isPos = val >= 0
  const c = isPos ? '#22C55E' : '#EF4444'
  const cDim = isPos ? 'rgba(34,197,94,' : 'rgba(239,68,68,'
  const goalPct = goalData.target > 0 ? Math.min(1, goalData.lucroFinalTotal / goalData.target) : 0
  const profitPct = Math.min(1, Math.abs(val) / Math.max(1, goalData.target || Math.abs(val) * 1.5))

  // Print mode = bigger ring, no stats, pure visual
  const S = printMode ? 420 : 360

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: '#010204',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !printMode) onClose() }}
    >
      {/* === AMBIENT === */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          width: printMode ? 900 : 700, height: printMode ? 900 : 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${cDim}${printMode?'0.12':'0.08'}), ${cDim}0.03) 35%, transparent 60%)`,
          filter: `blur(${printMode?100:80}px)`, pointerEvents: 'none',
        }}
      />

      {/* === TOP BAR (normal mode only) === */}
      {!printMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ position: 'absolute', top: 24, left: 32, right: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={12} height={12} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>NexControl</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPrintMode(true)} style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
              Modo print
            </button>
            <button onClick={onClose} style={{ fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }}>
              Fechar
            </button>
          </div>
        </motion.div>
      )}

      {/* Print exit (tiny, top-right) */}
      {printMode && (
        <button onClick={() => setPrintMode(false)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, fontSize: 11, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
          Sair
        </button>
      )}

      {/* === PRINT: title above === */}
      {printMode && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 32 }}
        >
          Resultado da operacao
        </motion.p>
      )}

      {/* === CENTRAL HUD === */}
      <motion.div
        key={printMode ? 'print' : 'normal'}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.15, ease }}
        whileHover={!printMode ? { scale: 1.03, transition: { duration: 0.3 } } : {}}
        style={{ position: 'relative', width: S, height: S, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Particles color={c} count={printMode ? 18 : 14} radius={S/2 + 10}/>

        {/* Ring 1 — outer goal */}
        <svg width={S} height={S} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx={S/2} cy={S/2} r={(S-8)/2} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={2}/>
          <Ring progress={goalPct} size={S} strokeWidth={2} color="rgba(255,255,255,0.1)" delay={0.6} glow={false}/>
        </svg>

        {/* Ring 2 — decorative spin */}
        <motion.svg width={S-30} height={S-30} style={{ position: 'absolute' }}
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
          <circle cx={(S-30)/2} cy={(S-30)/2} r={(S-38)/2} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={1} strokeDasharray="4 14"/>
        </motion.svg>

        {/* Ring 3 — main progress */}
        <svg width={S-60} height={S-60} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx={(S-60)/2} cy={(S-60)/2} r={(S-72)/2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={printMode ? 5 : 4}/>
          <Ring progress={profitPct} size={S-60} strokeWidth={printMode ? 5 : 4} color={c} delay={0.4}/>
        </svg>

        {/* Ring 4 — inner accent */}
        <motion.svg width={S-100} height={S-100} style={{ position: 'absolute' }}
          animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}>
          <circle cx={(S-100)/2} cy={(S-100)/2} r={(S-106)/2} fill="none" stroke={`${cDim}0.1)`} strokeWidth={1} strokeDasharray="2 10"/>
        </motion.svg>

        {/* Center content */}
        <motion.div
          animate={{ boxShadow: [
            `0 0 60px ${cDim}0.06), 0 0 120px ${cDim}0.03)`,
            `0 0 100px ${cDim}0.12), 0 0 200px ${cDim}0.05)`,
            `0 0 60px ${cDim}0.06), 0 0 120px ${cDim}0.03)`,
          ]}}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: S - 140, height: S - 140, borderRadius: '50%',
            background: `radial-gradient(circle, ${cDim}0.05), transparent 70%)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {!printMode && (
            <AnimatePresence mode="wait">
              <motion.p key={mode+'-lbl'} initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:5}} transition={{duration:0.2}}
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                {mode==='total'?'Lucro total':mode==='today'?'Lucro de hoje':'Ultimos 7 dias'}
              </motion.p>
            </AnimatePresence>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={mode+'-val'} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}} transition={{duration:0.3}}>
              <motion.p
                animate={{ scale: [1, 1.015, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: printMode ? 54 : 44,
                  fontWeight: 900, color: c, lineHeight: 1, letterSpacing: '-0.03em',
                  margin: 0, textAlign: 'center',
                  textShadow: `0 0 40px ${cDim}0.4), 0 0 80px ${cDim}0.2), 0 0 120px ${cDim}0.1)`,
                }}>
                {isPos ? '+' : '-'}R$<br/>
                <span style={{ fontSize: printMode ? 58 : 48 }}><CountUpValue value={val} key={mode}/></span>
              </motion.p>
            </motion.div>
          </AnimatePresence>

          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.5}}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
            {fechadas.length} metas fechadas
          </motion.p>
        </motion.div>
      </motion.div>

      {/* === PERIOD SWITCHER (normal only) === */}
      {!printMode && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.7}}
          style={{ display: 'flex', gap: 4, marginTop: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, border: '1px solid rgba(255,255,255,0.04)' }}>
          {[['total','Total'],['today','Hoje'],['week','7 dias']].map(([k,l]) => (
            <motion.button key={k} onClick={() => setMode(k)} whileTap={{ scale: 0.95 }}
              style={{ fontSize: 12, fontWeight: 600, padding: '8px 22px', borderRadius: 8, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: mode===k ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: mode===k ? '#fff' : 'rgba(255,255,255,0.3)',
              }}>{l}</motion.button>
          ))}
        </motion.div>
      )}

      {/* === BOTTOM STATS (normal only) === */}
      {!printMode && (
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.9}}
          style={{ display: 'flex', gap: 48, marginTop: 48 }}>
          {[
            { l: 'Depositado', v: `R$ ${fmt(stats.dep)}` },
            { l: 'Sacado', v: `R$ ${fmt(stats.saq)}` },
            { l: 'Operadores', v: String(operators.length) },
            { l: 'Acerto', v: `${stats.taxa}%` },
          ].map(({ l, v }, i) => (
            <motion.div key={l} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1+i*0.1}} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{l}</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{v}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* === PRINT FOOTER === */}
      {printMode && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
          style={{ position: 'absolute', bottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={10} height={10} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
            </div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Nex<span style={{ color: '#ff4444' }}>Control</span>
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.06em' }}>
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

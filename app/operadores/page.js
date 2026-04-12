'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const getInitial = p => getName(p).charAt(0).toUpperCase()

const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: base + i * 0.06, ease },
})

/* ── League system ── */
const LEAGUES = [
  { name: 'Bronze', min: 0, max: 299, color: '#CD7F32', bg: 'rgba(205,127,50,0.12)', border: 'rgba(205,127,50,0.25)' },
  { name: 'Prata', min: 300, max: 599, color: '#C0C0C0', bg: 'rgba(192,192,192,0.12)', border: 'rgba(192,192,192,0.25)' },
  { name: 'Ouro', min: 600, max: 899, color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.25)' },
  { name: 'Elite', min: 900, max: Infinity, color: '#e53935', bg: 'rgba(229,57,53,0.12)', border: 'rgba(229,57,53,0.25)' },
]

function getLeague(score) {
  return LEAGUES.find(l => score >= l.min && score <= l.max) || LEAGUES[0]
}

function calcScore(op) {
  // Score 0-1000 based on lucro (40%), constancia/winRate (30%), volume/closedCount (30%)
  const lucroScore = Math.min(Math.max(op.lucroFinal / 50, 0), 400) // up to 400pts for R$50k+ lucro
  const winScore = (op.winRate / 100) * 300 // up to 300pts for 100% win rate
  const volumeScore = Math.min(op.closedCount * 15, 300) // up to 300pts for 20+ closed metas
  return Math.round(lucroScore + winScore + volumeScore)
}

function getNextLeague(score) {
  const current = getLeague(score)
  const idx = LEAGUES.indexOf(current)
  if (idx >= LEAGUES.length - 1) return null
  return LEAGUES[idx + 1]
}

/* ── Badges ── */
function getBadges(op) {
  const badges = []
  if (op.winRate >= 70 && op.closedCount >= 3) badges.push({ text: 'Top performer', color: '#FFD700', icon: 'trophy' })
  if (op.trend === 'up' && op.closedCount >= 3) badges.push({ text: 'Em alta', color: '#22c55e', icon: 'fire' })
  if (op.winRate >= 50 && op.winRate < 70 && op.closedCount >= 5) badges.push({ text: 'Consistente', color: '#60a5fa', icon: 'brain' })
  if (op.trend === 'down') badges.push({ text: 'Oscilando', color: '#f59e0b', icon: 'warn' })
  return badges
}

const badgeIcons = {
  trophy: 'M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0012 0V2z',
  fire: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  brain: 'M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z',
  warn: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
}

/* ── Count-up hook ── */
function useCountUp(target, duration = 1200, decimals = 0) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const tick = now => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(target * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val)
}

/* ── KPI Card ── */
function KpiCard({ label, value, suffix, rgb, i, isCurrency, dynamicColor }) {
  const [h, setH] = useState(false)
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0
  const animated = useCountUp(numVal, 1400, isCurrency ? 2 : (suffix === '%' ? 1 : 0))
  const displayColor = dynamicColor ? (numVal >= 0 ? '34,197,94' : '239,68,68') : rgb

  return (
    <motion.div {...fadeUp(i)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '26px 24px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, rgba(${displayColor},0.16), rgba(${displayColor},0.04) 55%, transparent 85%)`,
        border: `1px solid rgba(${displayColor},${h ? 0.35 : 0.18})`,
        borderRadius: 18,
        boxShadow: h
          ? `0 0 50px rgba(${displayColor},0.2), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 0 15px rgba(${displayColor},0.05), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: h ? 'translateY(-4px) scale(1.01)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
      <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, borderRadius:'50%', background:`radial-gradient(circle, rgba(${displayColor},${h?0.15:0.06}), transparent 70%)`, transition:'all 0.4s', pointerEvents:'none' }} />
      <p style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{label}</p>
      <p style={{ fontSize:30, fontWeight:800, color:`rgb(${displayColor})`, lineHeight:1, letterSpacing:'-0.03em', fontFamily:'var(--mono, monospace)' }}>
        {isCurrency ? `R$ ${Number(animated).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}` : animated}
        {suffix && <span style={{ fontSize:14, fontWeight:600, marginLeft:4 }}>{suffix}</span>}
      </p>
    </motion.div>
  )
}

/* ── XP Progress Bar ── */
function XpBar({ score, league, nextLeague }) {
  const pctInLeague = nextLeague
    ? ((score - league.min) / (nextLeague.min - league.min)) * 100
    : 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ height: 5, flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pctInLeague, 100)}%` }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${league.color}, ${league.color}88)` }}
        />
      </div>
      {nextLeague && (
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono, monospace)', flexShrink: 0 }}>
          {nextLeague.min - score}pts → {nextLeague.name}
        </span>
      )}
    </div>
  )
}

/* ── Mini Sparkline ── */
function MiniSparkline({ data, color }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(Math.abs), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28, flexShrink: 0 }}>
      {data.map((v, i) => {
        const h = Math.max((Math.abs(v) / max) * 100, 8)
        return (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.8, delay: i * 0.08, ease: [0.33, 1, 0.68, 1] }}
            style={{
              width: 4, borderRadius: 2, minHeight: 2,
              background: v >= 0 ? (color || '#22c55e') : '#ef4444',
              opacity: 0.5 + (i / data.length) * 0.5,
            }}
          />
        )
      })}
    </div>
  )
}

/* ── Live Alerts ── */
function LiveAlerts({ alerts }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    if (alerts.length <= 1) return
    const iv = setInterval(() => setVisible(v => (v + 1) % alerts.length), 4000)
    return () => clearInterval(iv)
  }, [alerts.length])

  if (alerts.length === 0) return null
  const a = alerts[visible]
  return (
    <motion.div {...fadeUp(0)} style={{ marginBottom: 24 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={visible}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
            background: a.type === 'up'
              ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))'
              : a.type === 'down'
                ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))'
                : 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
            border: `1px solid ${a.type === 'up' ? 'rgba(34,197,94,0.18)' : a.type === 'down' ? 'rgba(239,68,68,0.18)' : 'rgba(255,215,0,0.18)'}`,
            borderRadius: 14,
          }}>
          <span style={{
            fontSize: 16, flexShrink: 0,
            color: a.type === 'up' ? '#22c55e' : a.type === 'down' ? '#ef4444' : '#FFD700',
          }}>
            {a.type === 'up' ? '↑' : a.type === 'down' ? '↓' : '★'}
          </span>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0, flex: 1 }}>{a.text}</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {alerts.map((_, i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%',
                background: i === visible ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Operator Drawer ── */
function OperatorDrawer({ op, onClose, allMetas, allRemessas, score, league }) {
  const opMetas = useMemo(() => allMetas.filter(m => m.operator_id === op.id), [op.id, allMetas])
  const opClosed = useMemo(() => opMetas.filter(m => m.status_fechamento === 'fechada'), [opMetas])
  const opRemessas = useMemo(() => {
    const ids = new Set(opMetas.map(m => m.id))
    return allRemessas.filter(r => ids.has(r.meta_id))
  }, [opMetas, allRemessas])

  const lucroFinal = opClosed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
  const totalDeposit = opClosed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
  const winRate = opClosed.length > 0 ? (opClosed.filter(m => Number(m.lucro_final || 0) > 0).length / opClosed.length * 100) : 0
  const lucroPerRemessa = opRemessas.length > 0 ? lucroFinal / opRemessas.length : 0
  const nextLeague = getNextLeague(score)
  const recentMetas = opClosed.slice(0, 10)
  const badges = getBadges(op)

  // Weekly profit evolution (last 6 weeks)
  const weeklyProfit = useMemo(() => {
    const weeks = []
    const now = Date.now()
    for (let w = 5; w >= 0; w--) {
      const start = now - (w + 1) * 7 * 86400000
      const end = now - w * 7 * 86400000
      const wk = opClosed.filter(m => {
        const d = new Date(m.created_at).getTime()
        return d >= start && d < end
      }).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      weeks.push(wk)
    }
    return weeks
  }, [opClosed])

  // AI insights for drawer
  const insights = useMemo(() => {
    const lines = []
    if (winRate >= 70) lines.push({ text: 'Alta taxa de acerto — operador consistente e confiavel.', type: 'good' })
    else if (winRate < 40 && opClosed.length > 2) lines.push({ text: 'Taxa de acerto baixa. Revisar estrategia e redes utilizadas.', type: 'warn' })
    if (lucroPerRemessa > 50) lines.push({ text: `Eficiencia excelente: R$ ${fmt(lucroPerRemessa)} por remessa.`, type: 'good' })
    else if (lucroPerRemessa < 0) lines.push({ text: 'Lucro por remessa negativo. Operacao nao esta sendo rentavel.', type: 'warn' })
    if (op.trend === 'up') lines.push({ text: 'Tendencia de crescimento. Considere aumentar volume.', type: 'good' })
    if (op.trend === 'down') lines.push({ text: 'Performance em queda. Acompanhar de perto.', type: 'warn' })
    if (score >= 900) lines.push({ text: 'Operador Elite — referencia para a equipe.', type: 'good' })
    else if (nextLeague) lines.push({ text: `Faltam ${nextLeague.min - score} pontos para alcancar ${nextLeague.name}.`, type: 'neutral' })
    if (lines.length === 0) lines.push({ text: 'Aguardando mais dados para gerar insights.', type: 'neutral' })
    return lines
  }, [winRate, lucroPerRemessa, op.trend, score, opClosed.length])

  let recommendation = null
  if (winRate >= 60 && lucroFinal > 0) recommendation = { text: 'Aumentar volume de operacao', desc: 'Operador com boa consistencia. Escalar pode aumentar retorno.', color: '#22c55e' }
  else if (winRate < 45 && opClosed.length > 3) recommendation = { text: 'Reduzir exposicao', desc: 'Revisar redes e estrategia antes de escalar.', color: '#f59e0b' }
  else if (lucroFinal < 0) recommendation = { text: 'Pausar e revisar', desc: 'Resultado negativo. Reavaliar toda a operacao.', color: '#ef4444' }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'flex-end',
      }}>
      <motion.div
        initial={{ x: 440, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 440, opacity: 0 }}
        transition={{ duration: 0.35, ease }}
        style={{
          width: '100%', maxWidth: 440, height: '100%', overflowY: 'auto',
          background: 'linear-gradient(180deg, #0c1424, #080e1a)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
          padding: '32px 28px',
        }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, position: 'relative',
              background: `linear-gradient(135deg, ${league.color}35, ${league.color}10)`,
              border: `2px solid ${league.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#fff',
              boxShadow: `0 0 25px ${league.color}20`,
            }}>
              {getInitial(op)}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{getName(op)}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                  background: league.bg, color: league.color, border: `1px solid ${league.border}`,
                }}>{league.name}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--mono, monospace)' }}>{score} pts</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* XP Progress */}
        <div style={{ marginBottom: 24, padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: league.color, fontFamily: 'var(--mono, monospace)' }}>{score}/{ nextLeague ? nextLeague.min : '1000'}</span>
          </div>
          <XpBar score={score} league={league} nextLeague={nextLeague} />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {badges.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, background: `${b.color}10`, border: `1px solid ${b.color}20`,
              }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={b.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={badgeIcons[b.icon]} />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: b.color }}>{b.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Lucro final', value: `R$ ${fmt(lucroFinal)}`, color: lucroFinal >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Taxa de acerto', value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? '#22c55e' : '#f59e0b' },
            { label: 'Depositantes', value: totalDeposit, color: '#60a5fa' },
            { label: 'Remessas', value: opRemessas.length, color: '#a855f7' },
            { label: 'Metas fechadas', value: opClosed.length, color: '#60a5fa' },
            { label: 'Lucro/remessa', value: `R$ ${fmt(lucroPerRemessa)}`, color: lucroPerRemessa >= 0 ? '#22c55e' : '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: s.color, margin: 0, fontFamily: 'var(--mono, monospace)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Weekly Evolution */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Evolucao semanal</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, padding: '0 4px' }}>
            {weeklyProfit.map((v, i) => {
              const maxW = Math.max(...weeklyProfit.map(Math.abs), 1)
              const h = Math.max((Math.abs(v) / maxW) * 100, 5)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease }}
                    style={{
                      width: '100%', maxWidth: 24, borderRadius: 4, minHeight: 3,
                      background: v >= 0
                        ? `linear-gradient(180deg, #22c55e, #22c55e60)`
                        : `linear-gradient(180deg, #ef4444, #ef444460)`,
                    }}
                  />
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>S{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Analise AI</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.12)', padding: '2px 7px', borderRadius: 5 }}>AI</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 10,
                background: ins.type === 'good' ? 'rgba(34,197,94,0.05)' : ins.type === 'warn' ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${ins.type === 'good' ? 'rgba(34,197,94,0.12)' : ins.type === 'warn' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)'}`,
                fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
              }}>
                {ins.text}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div style={{
            padding: '18px 20px', borderRadius: 14, marginBottom: 24,
            background: `linear-gradient(135deg, ${recommendation.color}10, transparent)`,
            border: `1px solid ${recommendation.color}22`,
          }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Recomendacao</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: recommendation.color, margin: '0 0 4px' }}>{recommendation.text}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{recommendation.desc}</p>
          </div>
        )}

        {/* History */}
        {recentMetas.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Historico recente</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentMetas.map(m => {
                const lf = Number(m.lucro_final || 0)
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{m.rede || 'Rede'}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                        {m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)', color: lf >= 0 ? '#22c55e' : '#ef4444' }}>
                      {lf >= 0 ? '+' : ''}R$ {fmt(lf)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ */
/* ── Main Page ── */
/* ═══════════════════════════════════════════════ */
export default function OperadoresPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [operators, setOperators] = useState([])
  const [metas, setMetas] = useState([])
  const [remessas, setRemessas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('ranking')
  const [selectedOp, setSelectedOp] = useState(null)

  useEffect(() => { checkAndLoad() }, [])

  async function checkAndLoad() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p || p.role !== 'admin') { router.push('/operator'); return }
    setProfile(p)
    await loadAll(p.tenant_id)
  }

  async function loadAll(forceTenantId) {
    setLoading(true)
    const tid = forceTenantId || profile?.tenant_id
    const [{ data: ops }, { data: ms }, { data: rs }, { data: t }, { data: s2 }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'operator').order('created_at', { ascending: false }),
      supabase.from('metas').select('*').order('created_at', { ascending: false }),
      supabase.from('remessas').select('*').order('created_at', { ascending: false }),
      supabase.from('tenants').select('*').eq('id', tid).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    setOperators(ops || [])
    setMetas((ms || []).filter(m => !m.deleted_at))
    setRemessas(rs || [])
    if (t) setTenant(t)
    if (s2) setSub(s2)
    setLoading(false)
  }

  /* ── Derived data ── */
  const closedMetas = useMemo(() => metas.filter(m => m.status_fechamento === 'fechada'), [metas])

  const operatorStats = useMemo(() => {
    return operators.map(op => {
      const opMetas = metas.filter(m => m.operator_id === op.id)
      const opClosed = closedMetas.filter(m => m.operator_id === op.id)
      const metaIds = new Set(opMetas.map(m => m.id))
      const opRemessas = remessas.filter(r => metaIds.has(r.meta_id))
      const totalDeposit = opClosed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
      const lucroFinal = opClosed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const activeMetas = opMetas.filter(m => m.status === 'ativa' || m.status === 'em_andamento')
      const winMetas = opClosed.filter(m => Number(m.lucro_final || 0) > 0).length
      const winRate = opClosed.length > 0 ? (winMetas / opClosed.length) * 100 : 0
      const lastActivity = opRemessas.length > 0 ? new Date(opRemessas[0].created_at) : (opMetas.length > 0 ? new Date(opMetas[0].created_at) : null)
      const isActive = lastActivity && (Date.now() - lastActivity.getTime()) < 7 * 24 * 60 * 60 * 1000
      const lucroPerRemessa = opRemessas.length > 0 ? lucroFinal / opRemessas.length : 0

      // Trend
      const recent3 = opClosed.slice(0, 3).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const prev3 = opClosed.slice(3, 6).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const trend = opClosed.length >= 4 ? (recent3 >= prev3 ? 'up' : 'down') : 'stable'

      // Sparkline: last 6 weeks
      const sparkline = []
      const now = Date.now()
      for (let w = 5; w >= 0; w--) {
        const start = now - (w + 1) * 7 * 86400000
        const end = now - w * 7 * 86400000
        sparkline.push(opClosed.filter(m => {
          const d = new Date(m.created_at).getTime()
          return d >= start && d < end
        }).reduce((a, m) => a + Number(m.lucro_final || 0), 0))
      }

      const base = { ...op, metasCount: opMetas.length, closedCount: opClosed.length, remessasCount: opRemessas.length,
        totalDeposit, lucroFinal, activeMetas: activeMetas.length, winRate, isActive, lucroPerRemessa, trend, sparkline }
      base.score = calcScore(base)
      base.league = getLeague(base.score)
      base.badges = getBadges(base)
      return base
    })
  }, [operators, metas, closedMetas, remessas])

  const ranking = useMemo(() =>
    [...operatorStats].filter(o => o.closedCount > 0).sort((a, b) => b.score - a.score),
    [operatorStats]
  )

  const maxScore = useMemo(() => ranking.length > 0 ? Math.max(...ranking.map(o => o.score), 1) : 1, [ranking])
  const totalActive = useMemo(() => operatorStats.filter(o => o.activeMetas > 0).length, [operatorStats])
  const totalLucro = useMemo(() => closedMetas.reduce((a, m) => a + Number(m.lucro_final || 0), 0), [closedMetas])
  const avgWinRate = useMemo(() => {
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length === 0) return 0
    return withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
  }, [operatorStats])

  // Live alerts
  const alerts = useMemo(() => {
    const a = []
    if (ranking.length > 0) a.push({ text: `${getName(ranking[0])} esta na lideranca!`, type: 'record' })
    const rising = operatorStats.filter(o => o.trend === 'up' && o.closedCount >= 3)
    if (rising.length > 0) a.push({ text: `${getName(rising[0])} subiu de posicao — em alta!`, type: 'up' })
    const falling = operatorStats.filter(o => o.trend === 'down' && o.closedCount >= 3)
    if (falling.length > 0) a.push({ text: `${getName(falling[0])} caiu de posicao — performance em queda.`, type: 'down' })
    const elites = operatorStats.filter(o => o.score >= 900)
    if (elites.length > 0) a.push({ text: `${getName(elites[0])} alcancou a liga Elite!`, type: 'record' })
    return a
  }, [ranking, operatorStats])

  // AI insights
  const insights = useMemo(() => {
    const lines = []
    if (ranking.length > 0) lines.push({ text: `${getName(ranking[0])} lidera com score ${ranking[0].score} e R$ ${fmt(ranking[0].lucroFinal)} de lucro.`, type: 'up' })
    const evolving = operatorStats.filter(o => o.trend === 'up' && o.closedCount >= 3)
    if (evolving.length > 0) lines.push({ text: `${evolving.length} operador(es) em evolucao — considere dar mais volume.`, type: 'up' })
    const risk = operatorStats.filter(o => o.trend === 'down' && o.lucroFinal < 0)
    if (risk.length > 0) lines.push({ text: `${getName(risk[0])} precisa de atencao: lucro negativo e tendencia de queda.`, type: 'down' })
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length > 0) {
      const avg = withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
      lines.push({ text: `Media de acerto da equipe: ${avg.toFixed(1)}%`, type: avg >= 50 ? 'up' : 'down' })
    }
    const inactive = operatorStats.filter(o => !o.isActive && o.metasCount > 0)
    if (inactive.length > 0) lines.push({ text: `${inactive.length} operador(es) inativo(s) nos ultimos 7 dias.`, type: 'warn' })
    const bestEff = [...operatorStats].filter(o => o.remessasCount > 0 && o.lucroFinal > 0).sort((a, b) => b.lucroPerRemessa - a.lucroPerRemessa)[0]
    if (bestEff) lines.push({ text: `${getName(bestEff)} tem melhor eficiencia: R$ ${fmt(bestEff.lucroPerRemessa)}/remessa.`, type: 'up' })
    if (lines.length === 0) lines.push({ text: 'Sem dados suficientes para insights.', type: 'neutral' })
    return lines
  }, [ranking, operatorStats])

  /* ── Loading ── */
  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0c1424, #080e1a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando ranking...</p>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { key: 'ranking', label: 'Ranking', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
    { key: 'equipe', label: 'Equipe', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  ]

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>Arena de Performance</h1>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: 'rgba(229,57,53,0.1)', color: '#e53935',
              border: '1px solid rgba(229,57,53,0.2)', letterSpacing: '0.06em',
            }}>LIVE</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Ranking competitivo da equipe. Score, ligas e evolucao em tempo real.</p>
        </motion.div>

        {/* Live Alerts */}
        <LiveAlerts alerts={alerts} />

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <KpiCard label="Total operadores" value={operators.length} rgb="59,130,246" i={0} />
          <KpiCard label="Ativos (com metas)" value={totalActive} rgb="34,197,94" i={1} />
          <KpiCard label="Performance media" value={avgWinRate} suffix="%" rgb="168,85,247" i={2} />
          <KpiCard label="Lucro da equipe" value={totalLucro} rgb="34,197,94" i={3} isCurrency dynamicColor />
        </div>

        {/* League Overview */}
        <motion.div {...fadeUp(2)} style={{
          display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap',
        }}>
          {LEAGUES.map(l => {
            const count = operatorStats.filter(o => o.closedCount > 0 && getLeague(o.score).name === l.name).length
            return (
              <div key={l.name} style={{
                flex: '1 1 120px', padding: '14px 16px', borderRadius: 14,
                background: l.bg, border: `1px solid ${l.border}`,
                display: 'flex', alignItems: 'center', gap: 10, minWidth: 120,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${l.color}20`, border: `1px solid ${l.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: l.color, fontFamily: 'var(--mono, monospace)',
                }}>
                  {count}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: l.color, margin: 0 }}>{l.name}</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{l.min}-{l.max === Infinity ? '1000+' : l.max} pts</p>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Tabs */}
        <motion.div {...fadeUp(1)} style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4,
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '11px 16px', fontSize: 13, fontWeight: 600,
                borderRadius: 11, border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'rgba(229,57,53,0.12)' : 'transparent',
                color: tab === t.key ? '#e53935' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: tab === t.key ? 1 : 0.5 }}>
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* ═══ RANKING TAB ═══ */}
        {tab === 'ranking' && (
          <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {ranking.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)', marginBottom: 28,
              }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Nenhuma meta fechada ainda para gerar ranking.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {ranking.map((op, idx) => (
                  <RankingCard
                    key={op.id} op={op} idx={idx} maxScore={maxScore}
                    onClick={() => setSelectedOp(op)}
                  />
                ))}
              </div>
            )}

            {/* AI Insights */}
            <motion.div {...fadeUp(3)} style={{
              background: 'linear-gradient(145deg, rgba(168,85,247,0.1), rgba(59,130,246,0.05) 50%, rgba(255,255,255,0.01))',
              border: '1px solid rgba(168,85,247,0.18)',
              borderRadius: 18, padding: '26px 24px',
              boxShadow: '0 0 40px rgba(168,85,247,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Radar da equipe</h2>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '3px 9px', borderRadius: 6 }}>AI</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insights.map((ins, i) => (
                  <motion.div key={i} {...fadeUp(i, 0.15)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                    background: 'rgba(255,255,255,0.025)', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, flexShrink: 0, width: 20, textAlign: 'center',
                      color: ins.type === 'up' ? '#22c55e' : ins.type === 'down' ? '#ef4444' : ins.type === 'warn' ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                    }}>
                      {ins.type === 'up' ? '↑' : ins.type === 'down' ? '↓' : ins.type === 'warn' ? '!' : '•'}
                    </span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: '20px' }}>{ins.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══ EQUIPE TAB ═══ */}
        {tab === 'equipe' && (
          <motion.div key="equipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <motion.div {...fadeUp(0)} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <motion.button
                onClick={() => router.push('/admin')}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '10px 20px', fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))',
                  border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, color: '#22c55e',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Convidar operador
              </motion.button>
            </motion.div>

            {operators.length === 0 ? (
              <motion.div {...fadeUp(1)} style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}>
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Nenhum operador na equipe ainda.</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Use o botao acima para convidar.</p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {operatorStats.map((op, idx) => (
                  <motion.div key={op.id} {...fadeUp(idx, 0.05)}
                    onClick={() => setSelectedOp(op)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16, cursor: 'pointer', transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: `linear-gradient(135deg, ${op.league.color}30, ${op.league.color}10)`,
                      border: `1.5px solid ${op.league.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>{getInitial(op)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: op.league.bg, color: op.league.color, border: `1px solid ${op.league.border}`,
                        }}>{op.league.name}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono, monospace)' }}>{op.score}pts</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{op.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Metas</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.metasCount}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro</p>
                        <p style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)', color: op.lucroFinal >= 0 ? '#22c55e' : '#ef4444' }}>
                          {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                        </p>
                      </div>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedOp && (
          <OperatorDrawer
            op={selectedOp}
            onClose={() => setSelectedOp(null)}
            allMetas={metas}
            allRemessas={remessas}
            score={selectedOp.score}
            league={selectedOp.league}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

/* ═══════════════════════════════════════════════ */
/* ── Ranking Card ── */
/* ═══════════════════════════════════════════════ */
function RankingCard({ op, idx, maxScore, onClick }) {
  const [hovered, setHovered] = useState(false)
  const isTop3 = idx < 3
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
  const medalColor = isTop3 ? medalColors[idx] : null
  const league = op.league
  const nextLeague = getNextLeague(op.score)
  const badges = op.badges

  return (
    <motion.div
      {...fadeUp(idx, 0.08)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '22px 24px', borderRadius: 18, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        background: isTop3
          ? `linear-gradient(145deg, ${medalColor}0e, transparent 60%)`
          : hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isTop3 ? `${medalColor}30` : hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
        transform: hovered ? 'translateY(-3px) scale(1.01)' : 'none',
        boxShadow: hovered
          ? isTop3 ? `0 14px 45px rgba(0,0,0,0.4), 0 0 35px ${medalColor}15` : '0 14px 45px rgba(0,0,0,0.4)'
          : 'none',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Top 1 aura */}
      {idx === 0 && (
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%',
          background: `radial-gradient(circle, ${medalColor}${hovered ? '15' : '08'}, transparent 70%)`,
          transition: 'all 0.4s', pointerEvents: 'none',
        }} />
      )}

      {/* Row 1: Position + Avatar + Name + Badges + Score + Lucro */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, position: 'relative', zIndex: 1 }}>
        {/* Position */}
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: isTop3 ? `${medalColor}18` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isTop3 ? `${medalColor}35` : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: isTop3 ? medalColor : 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--mono, monospace)',
        }}>
          {idx + 1}
        </div>

        {/* Avatar with league glow */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0, position: 'relative',
          background: `linear-gradient(135deg, ${league.color}35, ${league.color}10)`,
          border: `2px solid ${league.color}45`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800, color: '#fff',
          boxShadow: hovered ? `0 0 20px ${league.color}25` : 'none',
          transition: 'box-shadow 0.3s',
        }}>
          {getInitial(op)}
        </div>

        {/* Name + League + Badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
              background: league.bg, color: league.color, border: `1px solid ${league.border}`,
            }}>{league.name}</span>
            {op.trend !== 'stable' && (
              <motion.span
                animate={op.trend === 'up' ? { y: [0, -2, 0] } : { y: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  fontSize: 12, fontWeight: 700,
                  color: op.trend === 'up' ? '#22c55e' : '#ef4444',
                }}>
                {op.trend === 'up' ? '↑' : '↓'}
              </motion.span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {badges.slice(0, 2).map((b, i) => (
              <span key={i} style={{
                fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                color: b.color, background: `${b.color}10`, border: `1px solid ${b.color}18`,
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={b.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={badgeIcons[b.icon]}/></svg>
                {b.text}
              </span>
            ))}
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{op.closedCount} meta{op.closedCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Sparkline */}
        <MiniSparkline data={op.sparkline} color={league.color} />

        {/* Right: Score + Lucro */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: league.color, margin: 0, fontFamily: 'var(--mono, monospace)' }}>{op.score}</p>
          </div>
          <div style={{ textAlign: 'right', minWidth: 100 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lucro</p>
            <p style={{
              fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'var(--mono, monospace)',
              color: op.lucroFinal >= 0 ? '#22c55e' : '#ef4444',
            }}>
              {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: XP Bar */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <XpBar score={op.score} league={league} nextLeague={nextLeague} />
      </div>
    </motion.div>
  )
}

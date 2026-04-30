'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'
import { SLOTS } from '../../lib/slots-data'
import { DEMO_OPERATORS, DEMO_OPERATOR_RANKING, DEMO_METAS, DEMO_REMESSAS, DEMO_BANNER_TEXT, shouldShowDemo } from '../../lib/demo-data'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const getInitial = p => getName(p).charAt(0).toUpperCase()

const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: base + i * 0.05, ease },
})

/* ── Score (internal metric) ── */
function calcScore(op) {
  const lucroScore = Math.min(Math.max(op.lucroFinal / 50, 0), 400)
  const winScore = (op.winRate / 100) * 300
  const volumeScore = Math.min(op.closedCount * 15, 300)
  return Math.round(lucroScore + winScore + volumeScore)
}

/* ── Badges (max 1 shown) ── */
function getBadge(op) {
  if (op.winRate >= 70 && op.closedCount >= 3) return { text: 'Top performer', color: '#008c5e' }
  if (op.trend === 'up' && op.closedCount >= 3) return { text: 'Em alta', color: '#008c5e' }
  if (op.trend === 'down' && op.closedCount >= 3) return { text: 'Oscilando', color: 'rgba(255,255,255,0.78)' }
  return null
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
  const c = dynamicColor ? (numVal >= 0 ? '34,197,94' : '239,68,68') : rgb
  return (
    <motion.div {...fadeUp(i)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '20px 22px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, rgba(${c},0.1), rgba(14,22,38,0.6) 60%, rgba(8,14,26,0.6))`,
        backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
        border: `1px solid rgba(${c},${h ? 0.3 : 0.12})`,
        borderRadius: 14,
        boxShadow: h
          ? `0 10px 32px rgba(0,0,0,0.45), 0 0 40px rgba(${c},0.15), inset 0 1px 0 rgba(255,255,255,0.06)`
          : '0 4px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
        transform: h ? 'translateY(-3px)' : 'none',
        transition: 'all 0.25s ease',
      }}>
      {/* Accent line vertical */}
      <div style={{ position:'absolute', left:0, top:'22%', bottom:'22%', width:2, borderRadius:'0 2px 2px 0', background:`rgb(${c})`, boxShadow:`0 0 8px rgb(${c})` }}/>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 900, color: `rgb(${c})`, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: 'var(--mono, monospace)', textShadow:`0 0 16px rgba(${c},0.25)` }}>
        {isCurrency ? `R$ ${Number(animated).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}` : animated}
        {suffix && <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 3 }}>{suffix}</span>}
      </p>
    </motion.div>
  )
}

/* ── Performance Bar ── */
function PerfBar({ value, max, delay = 0 }) {
  const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0
  const color = value >= 0 ? '#008c5e' : '#ef4444'
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', flex: 1 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, delay, ease }}
        style={{ height: '100%', borderRadius: 2, background: color }}
      />
    </div>
  )
}

/* ── Operator Drawer ── */
function OperatorDrawer({ op, onClose, allMetas, allRemessas }) {
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
  const recentMetas = opClosed.slice(0, 10)

  const weeklyProfit = useMemo(() => {
    const weeks = []
    const now = Date.now()
    for (let w = 5; w >= 0; w--) {
      const start = now - (w + 1) * 7 * 86400000
      const end = now - w * 7 * 86400000
      weeks.push(opClosed.filter(m => {
        const d = new Date(m.created_at).getTime()
        return d >= start && d < end
      }).reduce((a, m) => a + Number(m.lucro_final || 0), 0))
    }
    return weeks
  }, [opClosed])

  const insights = useMemo(() => {
    const lines = []
    if (winRate >= 70) lines.push({ text: 'Alta taxa de acerto — operador consistente.', type: 'good' })
    else if (winRate < 40 && opClosed.length > 2) lines.push({ text: 'Taxa de acerto baixa. Revisar estrategia.', type: 'warn' })
    if (lucroPerRemessa > 50) lines.push({ text: `Eficiencia: R$ ${fmt(lucroPerRemessa)} por remessa.`, type: 'good' })
    else if (lucroPerRemessa < 0) lines.push({ text: 'Lucro por remessa negativo.', type: 'warn' })
    if (op.trend === 'up') lines.push({ text: 'Tendencia de crescimento.', type: 'good' })
    if (op.trend === 'down') lines.push({ text: 'Performance em queda.', type: 'warn' })
    if (lines.length === 0) lines.push({ text: 'Aguardando mais dados.', type: 'neutral' })
    return lines
  }, [winRate, lucroPerRemessa, op.trend, opClosed.length])

  let recommendation = null
  if (winRate >= 60 && lucroFinal > 0) recommendation = { text: 'Aumentar volume', desc: 'Boa consistencia. Escalar pode aumentar retorno.', color: '#008c5e' }
  else if (winRate < 45 && opClosed.length > 3) recommendation = { text: 'Reduzir exposicao', desc: 'Revisar redes e estrategia.', color: 'rgba(255,255,255,0.78)' }
  else if (lucroFinal < 0) recommendation = { text: 'Pausar e revisar', desc: 'Resultado negativo.', color: '#ef4444' }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
      <motion.div
        initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.3, ease }}
        style={{
          width: '100%', maxWidth: 420, height: '100%', overflowY: 'auto',
          background: 'linear-gradient(180deg, #000000, #000000)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 26px',
        }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14,
              background: lucroFinal >= 0 ? 'rgba(0,140,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${lucroFinal >= 0 ? 'rgba(0,140,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
            }}>{getInitial(op)}</div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{getName(op)}</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{op.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Lucro destaque */}
        <div style={{ marginBottom: 24, padding: '20px', borderRadius: 14, background: lucroFinal >= 0 ? 'rgba(0,140,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${lucroFinal >= 0 ? 'rgba(0,140,94,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Lucro final</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: lucroFinal >= 0 ? '#008c5e' : '#ef4444', margin: 0, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.03em' }}>
            {lucroFinal >= 0 ? '+' : ''}R$ {fmt(lucroFinal)}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
          {[
            { label: 'Acerto', value: `${winRate.toFixed(0)}%`, color: winRate >= 50 ? '#008c5e' : '#ef4444' },
            { label: 'Depositantes', value: totalDeposit, color: 'rgba(255,255,255,0.6)' },
            { label: 'Remessas', value: opRemessas.length, color: 'rgba(255,255,255,0.6)' },
            { label: 'Metas', value: opClosed.length, color: 'rgba(255,255,255,0.6)' },
            { label: 'Lucro/remessa', value: `R$${fmt(lucroPerRemessa)}`, color: lucroPerRemessa >= 0 ? '#008c5e' : '#ef4444' },
            { label: 'Tendencia', value: op.trend === 'up' ? 'Alta' : op.trend === 'down' ? 'Queda' : 'Estavel', color: op.trend === 'up' ? '#008c5e' : op.trend === 'down' ? '#ef4444' : 'rgba(255,255,255,0.4)' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0, fontFamily: 'var(--mono, monospace)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Weekly Evolution */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Evolucao semanal</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 50 }}>
            {weeklyProfit.map((v, i) => {
              const maxW = Math.max(...weeklyProfit.map(Math.abs), 1)
              const h = Math.max((Math.abs(v) / maxW) * 100, 5)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease }}
                    style={{ width: '100%', maxWidth: 20, borderRadius: 3, minHeight: 2, background: v >= 0 ? '#008c5e' : '#ef4444' }} />
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>S{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Insights */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Insights</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{
                padding: '9px 12px', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              }}>{ins.text}</div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div style={{ padding: '16px 18px', borderRadius: 12, marginBottom: 24, background: `${recommendation.color}08`, border: `1px solid ${recommendation.color}18` }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Recomendacao</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: recommendation.color, margin: '0 0 3px' }}>{recommendation.text}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{recommendation.desc}</p>
          </div>
        )}

        {/* History */}
        {recentMetas.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Historico</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {recentMetas.map(m => {
                const lf = Number(m.lucro_final || 0)
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{m.rede || 'Rede'}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: 0 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)', color: lf >= 0 ? '#008c5e' : '#ef4444' }}>
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

/* ── Ranking Card — Leaderboard Premium ── */
function RankingCard({ op, idx, maxLucro, onClick }) {
  const [h, setH] = useState(false)
  const isTop1 = idx === 0
  const isTop2 = idx === 1
  const isTop3 = idx < 3
  const badge = op.badge
  const lucroPerConta = op.totalDeposit > 0 ? op.lucroFinal / op.totalDeposit : 0
  const isProfit = op.lucroFinal >= 0

  // Position colors
  const posColor = isTop1 ? 'var(--profit)' : isTop2 ? 'var(--t1)' : isTop3 ? 'var(--t2)' : 'var(--t4)'
  const posBg = isTop1 ? 'rgba(0,140,94,0.14)' : isTop2 ? 'rgba(255,255,255,0.08)' : isTop3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)'
  const posBorder = isTop1 ? 'rgba(0,140,94,0.25)' : isTop2 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'

  return (
    <motion.div
      {...fadeUp(idx, 0.06)}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '20px 22px', borderRadius: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        background: isTop1
          ? 'linear-gradient(145deg, rgba(0,140,94,0.05), rgba(0,140,94,0.015))'
          : isTop2
            ? 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
            : 'linear-gradient(145deg, var(--surface), rgba(8,12,22,0.8))',
        border: `1px solid ${h
          ? isTop1 ? 'var(--profit-border)' : 'var(--b3)'
          : isTop1 ? 'rgba(0,140,94,0.1)' : 'var(--b1)'}`,
        transform: h ? 'translateY(-3px) scale(1.005)' : 'none',
        boxShadow: h
          ? isTop1
            ? '0 12px 40px rgba(0,0,0,0.35), 0 0 30px rgba(0,140,94,0.06)'
            : '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.02)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Top edge shine on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: h ? `linear-gradient(90deg, transparent 10%, ${isTop1 ? 'rgba(0,140,94,0.15)' : 'rgba(255,255,255,0.06)'} 50%, transparent 90%)` : 'transparent',
        transition: 'background 0.35s',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, position: 'relative' }}>
        {/* Position badge */}
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: posBg, border: `1.5px solid ${posBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 900, color: posColor,
          fontFamily: 'var(--mono, monospace)',
          boxShadow: isTop1 ? '0 0 16px rgba(0,140,94,0.1)' : isTop2 ? '0 0 10px rgba(255,255,255,0.03)' : 'none',
          transition: 'box-shadow 0.3s',
        }}>
          {idx + 1}
        </div>

        {/* Avatar */}
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: isProfit
            ? 'linear-gradient(135deg, rgba(0,140,94,0.18), rgba(0,140,94,0.06))'
            : 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06))',
          border: `1.5px solid ${isProfit ? 'var(--profit-border)' : 'var(--loss-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19, fontWeight: 800, color: 'var(--t1)',
          boxShadow: h
            ? `0 0 20px ${isProfit ? 'rgba(0,140,94,0.1)' : 'rgba(239,68,68,0.1)'}`
            : `inset 0 1px 0 ${isProfit ? 'rgba(0,140,94,0.1)' : 'rgba(239,68,68,0.1)'}`,
          transition: 'box-shadow 0.3s',
        }}>
          {getInitial(op)}
        </div>

        {/* Name + info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
            {op.trend !== 'stable' && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                color: op.trend === 'up' ? 'var(--profit)' : 'var(--loss)',
                background: op.trend === 'up' ? 'var(--profit-dim)' : 'var(--loss-dim)',
                border: `1px solid ${op.trend === 'up' ? 'var(--profit-border)' : 'var(--loss-border)'}`,
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
                {op.trend === 'up' ? '\u2191' : '\u2193'}
              </span>
            )}
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                color: badge.color, background: `${badge.color}0c`,
                border: `1px solid ${badge.color}1a`,
                letterSpacing: '0.02em',
              }}>{badge.text}</span>
            )}
          </div>
          {/* Compact info line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>
              {op.totalDeposit} deps
              <span style={{ color: 'var(--t4)', margin: '0 4px' }}>&middot;</span>
              {op.closedCount} meta{op.closedCount !== 1 ? 's' : ''}
            </span>
            {op.totalDeposit > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
                padding: '2px 8px', borderRadius: 5,
                background: 'var(--brand-dim)', color: 'var(--brand-bright)',
                border: '1px solid var(--brand-border)',
              }}>
                R$ {fmt(lucroPerConta)}/conta
              </span>
            )}
          </div>
        </div>

        {/* Lucro — HERO element */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 120 }}>
          <p style={{
            fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'var(--mono, monospace)',
            color: isProfit ? 'var(--profit)' : 'var(--loss)',
            letterSpacing: '-0.03em', lineHeight: 1,
            textShadow: h ? `0 0 24px ${isProfit ? 'rgba(0,140,94,0.2)' : 'rgba(239,68,68,0.2)'}` : 'none',
            transition: 'text-shadow 0.35s',
          }}>
            {isProfit ? '+' : ''}R$ {fmt(op.lucroFinal)}
          </p>
          <p style={{ fontSize: 10, color: 'var(--t4)', margin: '4px 0 0', fontWeight: 500 }}>
            {op.totalDeposit} depositantes
          </p>
        </div>
      </div>

      {/* Performance bar */}
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.035)', overflow: 'hidden', position: 'relative' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${maxLucro > 0 ? Math.min((Math.abs(op.lucroFinal) / maxLucro) * 100, 100) : 0}%` }}
          transition={{ duration: 1.2, delay: 0.15 + idx * 0.05, ease }}
          style={{
            height: '100%', borderRadius: 3,
            background: isProfit
              ? 'linear-gradient(90deg, var(--profit), rgba(74,222,128,0.5))'
              : 'linear-gradient(90deg, var(--loss), rgba(248,113,113,0.5))',
            boxShadow: isProfit
              ? '0 0 10px rgba(0,140,94,0.2), 0 0 3px rgba(0,140,94,0.3)'
              : '0 0 10px rgba(239,68,68,0.2), 0 0 3px rgba(239,68,68,0.3)',
          }}
        />
      </div>
    </motion.div>
  )
}

/* ── Invite Card ── */
function InviteCard({ inv, onCopy, onDelete }) {
  const [h, setH] = useState(false)
  const link = typeof window !== 'undefined' ? `${window.location.origin}/invite?token=${inv.token}` : ''
  const createdAt = inv.created_at ? new Date(inv.created_at).toLocaleDateString('pt-BR') : ''
  const used = inv.used_by || inv.status === 'used'

  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        background: h ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${h ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 12, transition: 'all 0.2s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 3px', fontFamily: 'var(--mono, monospace)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {inv.token}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{createdAt}</span>
          {used && <span style={{ fontSize: 9, fontWeight: 600, color: '#008c5e', padding: '1px 6px', borderRadius: 4, background: 'rgba(0,140,94,0.1)' }}>Usado</span>}
          {!used && <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.78)', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }}>Pendente</span>}
        </div>
      </div>
      {!used && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => { navigator.clipboard.writeText(link); onCopy() }} style={{
            padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.78)', cursor: 'pointer', transition: 'all 0.2s',
          }}>Copiar</button>
          <button onClick={() => onDelete(inv.id)} style={{
            padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.08)', color: '#EF4444', cursor: 'pointer', transition: 'all 0.2s',
          }}>Excluir</button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
/* ── Payment Model Configuration (with confirmation) ── */
/* ═══════════════════════════════════════════════ */
function PaymentModelConfig({ tenant, setTenant, profileTenantId }) {
  const currentModel = tenant?.operator_payment_model || 'fixo_dep'
  const [pendingModel, setPendingModel] = useState(null) // model being considered
  const [pendingValue, setPendingValue] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const MODELS = [
    { key:'fixo_dep', label:'Fixo por depositante', desc:'Ex: R$ 2,00 por dep', valueLabel:'Valor por dep (R$)', placeholder:'2.00' },
    { key:'percentual', label:'% do lucro final', desc:'Ex: 15% do lucro', valueLabel:'Percentual (%)', placeholder:'15' },
    { key:'divisao_resultado', label:'Divisao de resultado', desc:'Split lucro e prejuizo', valueLabel:'% do operador', placeholder:'50' },
  ]

  function selectModel(key) {
    if (key === currentModel) return
    setPendingModel(key)
    setPendingValue(key === 'divisao_resultado' ? '50' : key === 'percentual' ? '15' : '2')
    setShowConfirm(true)
  }

  async function confirmChange() {
    setSaving(true)
    await supabase.from('tenants').update({
      operator_payment_model: pendingModel,
      operator_payment_value: Number(pendingValue || 0),
    }).eq('id', profileTenantId)
    setTenant(prev => ({ ...prev, operator_payment_model: pendingModel, operator_payment_value: Number(pendingValue || 0) }))
    setSaving(false)
    setShowConfirm(false)
    setPendingModel(null)
  }

  async function updateValue(val) {
    const num = Number(val)
    await supabase.from('tenants').update({ operator_payment_value: num }).eq('id', profileTenantId)
    setTenant(prev => ({ ...prev, operator_payment_value: num }))
  }

  const activeInfo = MODELS.find(m => m.key === currentModel)
  const isDivisao = currentModel === 'divisao_resultado'

  return (
    <div style={{ padding:'22px 20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#008c5e" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Pagamento de operadores</span>
        {isDivisao && <span style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:5, background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', border:'1px solid rgba(255,255,255,0.2)' }}>SPLIT {tenant?.operator_payment_value || 50}%</span>}
      </div>

      {/* Model selector */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {MODELS.map(opt => {
          const active = currentModel === opt.key
          const accentColor = opt.key === 'divisao_resultado' ? 'rgba(255,255,255,0.78)' : '#008c5e'
          return (
            <button key={opt.key} type="button" onClick={() => active ? null : selectModel(opt.key)} style={{
              flex:1, minWidth:120, padding:'12px 14px', borderRadius:10, cursor: active ? 'default' : 'pointer',
              background: active ? `${accentColor}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${active ? `${accentColor}33` : 'rgba(255,255,255,0.05)'}`,
              textAlign:'left', transition:'all 0.2s',
            }}>
              <p style={{ fontSize:12, fontWeight:700, color: active ? accentColor : 'rgba(255,255,255,0.5)', margin:'0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize:10, color: active ? `${accentColor}88` : 'rgba(255,255,255,0.2)', margin:0 }}>{opt.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Current value editor */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', flexShrink:0 }}>
          {activeInfo?.valueLabel || 'Valor'}
        </label>
        <input className="input" type="number" step="0.01" min="0"
          value={tenant?.operator_payment_value ?? 2}
          onChange={e => updateValue(e.target.value)}
          style={{ padding:'8px 12px', fontSize:14, maxWidth:100 }}
        />
      </div>

      {/* Divisao info */}
      {isDivisao && (
        <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', fontSize:11, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>
          Lucro e prejuizo serao divididos: operador recebe {tenant?.operator_payment_value || 50}%, admin fica com {100 - (tenant?.operator_payment_value || 50)}%. Valido para novas metas.
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showConfirm && pendingModel && (
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(2,4,8,0.9)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => { setShowConfirm(false); setPendingModel(null) }}>
          <div onClick={e => e.stopPropagation()} style={{
            width:'100%', maxWidth:480, padding:28, borderRadius:20,
            background:'linear-gradient(160deg, #000000, #000000)',
            border:'1px solid rgba(255,255,255,0.08)',
            boxShadow:'0 40px 100px rgba(0,0,0,0.7)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize:16, fontWeight:800, color:'#F1F5F9', margin:'0 0 2px' }}>Confirmar alteracao de modelo</h3>
                <p style={{ fontSize:12, color:'#94A3B8', margin:0 }}>Esta acao vale apenas para novas metas</p>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:16, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, color:'#64748B' }}>Modelo atual</span>
                <span style={{ fontSize:12, fontWeight:600, color:'#94A3B8' }}>{MODELS.find(m=>m.key===currentModel)?.label}</span>
              </div>
              <div style={{ width:'100%', height:1, background:'rgba(255,255,255,0.04)', margin:'0 0 10px' }} />
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, color:'#64748B' }}>Novo modelo</span>
                <span style={{ fontSize:12, fontWeight:700, color: pendingModel === 'divisao_resultado' ? 'rgba(255,255,255,0.78)' : '#008c5e' }}>{MODELS.find(m=>m.key===pendingModel)?.label}</span>
              </div>
              {/* Value input for new model */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#64748B' }}>{MODELS.find(m=>m.key===pendingModel)?.valueLabel}</span>
                <input className="input" type="number" step="0.01" min="0" max={pendingModel==='divisao_resultado'?100:undefined}
                  value={pendingValue}
                  onChange={e => setPendingValue(e.target.value)}
                  style={{ padding:'6px 10px', fontSize:14, maxWidth:80, textAlign:'right' }}
                />
              </div>
            </div>

            {/* Warnings */}
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
              {[
                'A mudanca vale apenas para novas metas criadas',
                'Metas anteriores continuam com o modelo antigo',
                pendingModel === 'divisao_resultado' ? `Operador recebera ${pendingValue}% do lucro E assumira ${pendingValue}% do prejuizo` : null,
              ].filter(Boolean).map((text, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2" strokeLinecap="round" style={{ marginTop:2, flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontSize:11, color:'#94A3B8', lineHeight:1.4 }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={() => { setShowConfirm(false); setPendingModel(null) }}
                style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'transparent', color:'#94A3B8', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancelar
              </button>
              <button type="button" onClick={confirmChange} disabled={saving || !pendingValue || Number(pendingValue) <= 0}
                style={{
                  flex:2, padding:'12px', borderRadius:10, border:'none', cursor:'pointer',
                  background: pendingModel === 'divisao_resultado' ? 'linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.78))' : '#008c5e',
                  color:'#fff', fontSize:13, fontWeight:700,
                  opacity: saving || !pendingValue || Number(pendingValue) <= 0 ? 0.5 : 1,
                }}>
                {saving ? 'Salvando...' : 'Confirmar alteracao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('ranking')
  const [selectedOp, setSelectedOp] = useState(null)
  const [invSaving, setInvSaving] = useState(false)
  const [invMsg, setInvMsg] = useState('')
  const [folhaPeriod, setFolhaPeriod] = useState('30')
  const [costs, setCosts] = useState([])

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
    const [{ data: ops }, { data: ms }, { data: rs }, { data: t }, { data: s2 }, { data: inv }, { data: costsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'operator').order('created_at', { ascending: false }),
      supabase.from('metas').select('*').order('created_at', { ascending: false }),
      supabase.from('remessas').select('*').order('created_at', { ascending: false }),
      supabase.from('tenants').select('*').eq('id', tid).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('invites').select('*').order('created_at', { ascending: false }),
      supabase.from('costs').select('amount,date').eq('tenant_id', tid),
    ])
    const activeMetas = (ms || []).filter(m => !m.deleted_at)
    const activeMetaIds = new Set(activeMetas.map(m => m.id))
    setOperators(ops || [])
    setMetas(activeMetas)
    setRemessas((rs || []).filter(r => activeMetaIds.has(r.meta_id)))
    setInvites(inv || [])
    setCosts(costsData || [])
    if (t) setTenant(t)
    if (s2) setSub(s2)
    setLoading(false)
  }

  async function sendInvite() {
    if (!profile?.tenant_id) return
    setInvSaving(true); setInvMsg('')

    // Validar limite do plano: contar operators + invites pendentes
    // contra operator_count da subscription ativa mais recente
    try {
      const { data: subActive } = await supabase.from('subscriptions')
        .select('operator_count, status, expires_at')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle()

      // Se tem sub ativa, validar limite. Se nao tem (trial), nao bloqueia.
      if (subActive && (!subActive.expires_at || new Date(subActive.expires_at) > new Date())) {
        const limit = Number(subActive.operator_count || 0)
        const currentOps = operators.length
        const pendingInvs = invites.filter(i => i.status === 'pending' || !i.status).length
        const used = currentOps + pendingInvs
        if (used >= limit) {
          setInvSaving(false)
          setInvMsg(`Limite atingido: seu plano inclui ${limit} operador${limit !== 1 ? 'es' : ''}. Atualize em Assinatura para adicionar mais.`)
          setTimeout(() => setInvMsg(''), 8000)
          return
        }
      }
    } catch (e) {
      console.error('[sendInvite] check limit failed', e?.message)
      // Em caso de erro na checagem, deixa passar (nao bloqueia operacao)
    }

    const { data, error: err } = await supabase.from('invites').insert({
      tenant_id: profile.tenant_id,
      role: 'operator',
    }).select().single()
    setInvSaving(false)
    if (err) { setInvMsg('Erro: ' + err.message); return }
    const link = `${window.location.origin}/invite?token=${data.token}`
    await navigator.clipboard.writeText(link)
    setInvites(prev => [data, ...prev])
    setInvMsg('Link copiado!')
    setTimeout(() => setInvMsg(''), 4000)
  }

  async function deleteInvite(id) {
    await supabase.from('invites').delete().eq('id', id)
    setInvites(prev => prev.filter(i => i.id !== id))
  }

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

      const recent3 = opClosed.slice(0, 3).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const prev3 = opClosed.slice(3, 6).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const trend = opClosed.length >= 4 ? (recent3 >= prev3 ? 'up' : 'down') : 'stable'

      const base = { ...op, metasCount: opMetas.length, closedCount: opClosed.length, remessasCount: opRemessas.length,
        totalDeposit, lucroFinal, activeMetas: activeMetas.length, winRate, isActive, lucroPerRemessa, trend }
      base.score = calcScore(base)
      base.badge = getBadge(base)
      return base
    })
  }, [operators, metas, closedMetas, remessas])

  // RANKING BY LUCRO FINAL
  const ranking = useMemo(() =>
    [...operatorStats].filter(o => o.closedCount > 0).sort((a, b) => b.lucroFinal - a.lucroFinal),
    [operatorStats]
  )

  const maxLucro = useMemo(() => ranking.length > 0 ? Math.max(...ranking.map(o => Math.abs(o.lucroFinal)), 1) : 1, [ranking])
  const totalActive = useMemo(() => operatorStats.filter(o => o.activeMetas > 0).length, [operatorStats])
  const totalDeps = useMemo(() => operatorStats.reduce((a, o) => a + o.totalDeposit, 0), [operatorStats])
  const custosTotal = useMemo(() => costs.reduce((a, c) => a + Number(c.amount || 0), 0), [costs])
  const totalLucro = useMemo(() => closedMetas.reduce((a, m) => a + Number(m.lucro_final || 0), 0) - custosTotal, [closedMetas, custosTotal])
  const avgWinRate = useMemo(() => {
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length === 0) return 0
    return withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
  }, [operatorStats])

  const insights = useMemo(() => {
    const lines = []
    if (ranking.length > 0) lines.push({ text: `${getName(ranking[0])} lidera com R$ ${fmt(ranking[0].lucroFinal)} de lucro.`, type: 'up' })
    const evolving = operatorStats.filter(o => o.trend === 'up' && o.closedCount >= 3)
    if (evolving.length > 0) lines.push({ text: `${evolving.length} operador(es) em crescimento.`, type: 'up' })
    const risk = operatorStats.filter(o => o.trend === 'down' && o.lucroFinal < 0)
    if (risk.length > 0) lines.push({ text: `${getName(risk[0])} precisa de atencao — lucro negativo.`, type: 'down' })
    const withClosed = operatorStats.filter(o => o.closedCount > 0)
    if (withClosed.length > 0) {
      const avg = withClosed.reduce((a, o) => a + o.winRate, 0) / withClosed.length
      lines.push({ text: `Media de acerto: ${avg.toFixed(1)}%`, type: avg >= 50 ? 'up' : 'down' })
    }
    const inactive = operatorStats.filter(o => !o.isActive && o.metasCount > 0)
    if (inactive.length > 0) lines.push({ text: `${inactive.length} operador(es) inativo(s) ha 7+ dias.`, type: 'warn' })
    // Best efficiency
    const withRemessas = operatorStats.filter(o => o.lucroPerRemessa > 0 && o.closedCount >= 2)
    if (withRemessas.length > 0) {
      const best = withRemessas.sort((a, b) => b.lucroPerRemessa - a.lucroPerRemessa)[0]
      lines.push({ text: `Melhor eficiencia: ${getName(best)} com R$ ${fmt(best.lucroPerRemessa)}/remessa.`, type: 'up' })
    }
    // Best lucro/conta
    const withDeps = operatorStats.filter(o => o.totalDeposit > 0 && o.closedCount >= 1)
    if (withDeps.length > 0) {
      const sorted = [...withDeps].sort((a, b) => (b.lucroFinal / b.totalDeposit) - (a.lucroFinal / a.totalDeposit))
      const best = sorted[0]
      lines.push({ text: `Maior lucro por conta: ${getName(best)} com R$ ${fmt(best.lucroFinal / best.totalDeposit)}/conta.`, type: 'up' })
      if (sorted.length > 1) {
        const worst = sorted[sorted.length - 1]
        const worstAvg = worst.lucroFinal / worst.totalDeposit
        lines.push({ text: `Menor lucro por conta: ${getName(worst)} com R$ ${fmt(worstAvg)}/conta.`, type: worstAvg < 0 ? 'down' : 'warn' })
      }
    }
    if (lines.length === 0) lines.push({ text: 'Sem dados suficientes.', type: 'neutral' })
    return lines
  }, [ranking, operatorStats])

  // Folha de pagamento data
  const folhaData = useMemo(() => {
    const payModel = tenant?.operator_payment_model || 'fixo_dep'
    const payValue = Number(tenant?.operator_payment_value ?? 2)
    const now = new Date()
    const periodMetas = closedMetas.filter(m => {
      if (folhaPeriod === 'all') return true
      if (!m.fechada_em) return false
      const d = new Date(m.fechada_em)
      if (folhaPeriod === 'hoje') return d.toDateString() === now.toDateString()
      const days = folhaPeriod === '7' ? 7 : 30
      return (now - d) < days * 86400000
    })
    return operators.map(op => {
      const opClosed = periodMetas.filter(m => m.operator_id === op.id)
      if (opClosed.length === 0) return null
      const totalDeposit = opClosed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
      const lucroFinal = opClosed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      let valor = 0
      if (payModel === 'divisao_resultado') {
        // For split model, use stored resultado_operador if available, else calculate
        const stored = opClosed.reduce((a, m) => a + Number(m.resultado_operador || 0), 0)
        valor = stored !== 0 ? stored : lucroFinal * (payValue / 100)
      } else if (payModel === 'percentual') {
        valor = lucroFinal > 0 ? lucroFinal * (payValue / 100) : 0
      } else {
        valor = totalDeposit * payValue
      }
      return { ...op, closedCount: opClosed.length, totalDeposit, lucroFinal, pagamento: valor, payModel, payValue }
    }).filter(Boolean).sort((a, b) => b.pagamento - a.pagamento)
  }, [operators, closedMetas, tenant, folhaPeriod])

  const isDemo = !loading && shouldShowDemo(metas)

  const DemoBanner = () => (
    <motion.div className="demo-banner" {...fadeUp(0)} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', marginBottom: 20,
      background: 'linear-gradient(135deg, rgba(229,57,53,0.12), rgba(229,57,53,0.04))',
      border: '1px solid rgba(229,57,53,0.18)', borderRadius: 12,
    }}>
      <span className="demo-banner-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#e53935', flexShrink: 0 }} />
      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(229,57,53,0.85)', margin: 0 }}>{DEMO_BANNER_TEXT}</p>
    </motion.div>
  )

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #000000, #000000)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando...</p>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { key: 'ranking', label: 'Ranking' },
    { key: 'equipe', label: 'Equipe' },
    { key: 'folha', label: 'Folha de pagamento' },
    { key: 'config', label: 'Configuracoes' },
  ]

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Hero — clean */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize:28, fontWeight:600, color:'var(--t1)', letterSpacing:'-0.03em', margin:'0 0 6px' }}>Operadores</h1>
          <p style={{ fontSize:13, color:'var(--t3)', margin:0, fontWeight:400 }}>
            Ranking, performance, folha de pagamento e configuracoes
          </p>
        </motion.div>

        {/* Tabs — underline minimalista */}
        <motion.div {...fadeUp(1)} style={{
          display: 'flex', gap: 0, marginBottom: 28,
          borderBottom: '1px solid var(--b1)',
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '12px 18px', fontSize: 13, fontWeight: 500,
                border: 'none', background: 'transparent', cursor: 'pointer', fontFamily:'inherit',
                color: tab === t.key ? 'var(--t1)' : 'var(--t3)',
                borderBottom: tab === t.key ? '2px solid var(--t1)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s ease',
              }}>
              {t.label}
            </button>
          ))}
        </motion.div>

        {/* ═══════════ TAB 1: RANKING ═══════════ */}
        {tab === 'ranking' && (
          <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
              <KpiCard label="Operadores" value={isDemo && !operators.length ? 3 : operators.length} rgb="148,163,184" i={0} />
              <KpiCard label="Ativos" value={isDemo && !totalActive ? 2 : totalActive} rgb="148,163,184" i={1} />
              <KpiCard label="Depositantes totais" value={isDemo && !totalDeps ? 160 : totalDeps} rgb="148,163,184" i={2} />
              <KpiCard label="Acerto medio" value={isDemo && !avgWinRate ? 80 : avgWinRate} suffix="%" rgb="148,163,184" i={3} />
              <KpiCard label="Lucro equipe" value={isDemo && !totalLucro ? 829.70 : totalLucro} rgb="34,197,94" i={4} isCurrency dynamicColor />
            </div>

            {/* Ranking list */}
            {ranking.length === 0 && !isDemo ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 28 }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Nenhuma meta fechada ainda.</p>
              </div>
            ) : ranking.length === 0 && isDemo ? (
              <div style={{ marginBottom: 32 }}>
                <DemoBanner />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {DEMO_OPERATOR_RANKING.map((op, idx) => {
                    const demoMaxLucro = Math.max(...DEMO_OPERATOR_RANKING.map(o => Math.abs(o.lucroFinal)), 1)
                    const isProfit = op.lucroFinal >= 0
                    const isTop1 = idx === 0
                    const isTop2 = idx === 1
                    const isTop3 = idx < 3
                    const posColor = isTop1 ? 'var(--profit)' : isTop2 ? 'var(--t1)' : isTop3 ? 'var(--t2)' : 'var(--t4)'
                    const posBg = isTop1 ? 'rgba(0,140,94,0.14)' : isTop2 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'
                    const posBorder = isTop1 ? 'rgba(0,140,94,0.25)' : isTop2 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'
                    return (
                      <motion.div key={op.id} {...fadeUp(idx, 0.06)} style={{
                        padding: '20px 22px', borderRadius: 16, position: 'relative', overflow: 'hidden',
                        background: isTop1
                          ? 'linear-gradient(145deg, rgba(0,140,94,0.05), rgba(0,140,94,0.015))'
                          : isTop2
                            ? 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
                            : 'linear-gradient(145deg, var(--surface), rgba(8,12,22,0.8))',
                        border: `1px solid ${isTop1 ? 'rgba(0,140,94,0.1)' : 'var(--b1)'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                            background: posBg, border: `1.5px solid ${posBorder}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 900, color: posColor, fontFamily: 'var(--mono, monospace)',
                          }}>{idx + 1}</div>
                          <div style={{
                            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                            background: isProfit
                              ? 'linear-gradient(135deg, rgba(0,140,94,0.18), rgba(0,140,94,0.06))'
                              : 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06))',
                            border: `1.5px solid ${isProfit ? 'var(--profit-border)' : 'var(--loss-border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 19, fontWeight: 800, color: 'var(--t1)',
                          }}>{getInitial(op)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{getName(op)}</p>
                              {op.trend !== 'stable' && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                                  color: op.trend === 'up' ? 'var(--profit)' : 'var(--loss)',
                                  background: op.trend === 'up' ? 'var(--profit-dim)' : 'var(--loss-dim)',
                                  border: `1px solid ${op.trend === 'up' ? 'var(--profit-border)' : 'var(--loss-border)'}`,
                                }}>{op.trend === 'up' ? '\u2191' : '\u2193'}</span>
                              )}
                              {op.badge && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                                  color: op.badge === 'Top performer' ? '#008c5e' : op.badge === 'Em alta' ? '#008c5e' : 'rgba(255,255,255,0.78)',
                                  background: op.badge === 'Oscilando' ? 'rgba(255,255,255,0.08)' : 'rgba(0,140,94,0.08)',
                                  border: `1px solid ${op.badge === 'Oscilando' ? 'rgba(255,255,255,0.18)' : 'rgba(0,140,94,0.18)'}`,
                                }}>{op.badge}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>
                                {op.totalDeposit} deps
                                <span style={{ color: 'var(--t4)', margin: '0 4px' }}>&middot;</span>
                                {op.metasFechadas} meta{op.metasFechadas !== 1 ? 's' : ''}
                              </span>
                              {op.totalDeposit > 0 && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
                                  padding: '2px 8px', borderRadius: 5,
                                  background: 'var(--brand-dim)', color: 'var(--brand-bright)',
                                  border: '1px solid var(--brand-border)',
                                }}>R$ {fmt(op.lucroPerConta)}/conta</span>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 120 }}>
                            <p style={{
                              fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'var(--mono, monospace)',
                              color: isProfit ? 'var(--profit)' : 'var(--loss)', letterSpacing: '-0.03em', lineHeight: 1,
                            }}>
                              {isProfit ? '+' : ''}R$ {fmt(op.lucroFinal)}
                            </p>
                            <p style={{ fontSize: 10, color: 'var(--t4)', margin: '4px 0 0', fontWeight: 500 }}>{op.totalDeposit} depositantes</p>
                          </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.035)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${demoMaxLucro > 0 ? Math.min((Math.abs(op.lucroFinal) / demoMaxLucro) * 100, 100) : 0}%` }}
                            transition={{ duration: 1.2, delay: 0.15 + idx * 0.05, ease }}
                            style={{
                              height: '100%', borderRadius: 3,
                              background: isProfit
                                ? 'linear-gradient(90deg, var(--profit), rgba(74,222,128,0.5))'
                                : 'linear-gradient(90deg, var(--loss), rgba(248,113,113,0.5))',
                            }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {ranking.map((op, idx) => (
                  <RankingCard key={op.id} op={op} idx={idx} maxLucro={maxLucro} onClick={() => setSelectedOp(op)} />
                ))}
              </div>
            )}

            {/* Insights — Radar da equipe (inteligencia de gestao) */}
            <motion.div {...fadeUp(3)} style={{
              position:'relative', overflow:'hidden',
              padding:'22px 24px', borderRadius:18,
              background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
              backdropFilter:'blur(22px) saturate(160%)', WebkitBackdropFilter:'blur(22px) saturate(160%)',
              border:'1px solid rgba(255,255,255,0.18)',
              boxShadow:'0 10px 36px rgba(0,0,0,0.45), 0 0 40px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', pointerEvents:'none' }}/>
              <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.14), transparent 60%)', filter:'blur(24px)', pointerEvents:'none' }}/>

              <div style={{ position:'relative', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width:36, height:36, borderRadius:10,
                  background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.32)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 16px rgba(255,255,255,0.2)',
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.01em' }}>Radar da equipe</p>
                  <p style={{ fontSize:10, color:'var(--t4)', margin:'2px 0 0', fontWeight:500 }}>Inteligencia de gestao em tempo real</p>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)' }}>
                  <motion.div
                    animate={{ boxShadow:['0 0 0 0 rgba(255,255,255,0.5)','0 0 0 5px rgba(255,255,255,0)','0 0 0 0 rgba(255,255,255,0)'] }}
                    transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                    style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.78)' }}
                  />
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.78)', fontWeight:800, letterSpacing:'0.08em' }}>{insights.length} SINAIS</span>
                </div>
              </div>

              <div style={{ position:'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((ins, i) => {
                  const c = ins.type === 'up' ? '#008C5E' : ins.type === 'down' ? '#EF4444' : ins.type === 'warn' ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.78)'
                  return (
                    <motion.div key={i}
                      initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                      transition={{ duration:0.35, delay:0.1+i*0.07, ease:[0.33,1,0.68,1] }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                        background: `${c}08`, borderRadius: 10, border: `1px solid ${c}18`,
                      }}>
                      <div style={{
                        width:24, height:24, borderRadius:7, flexShrink:0,
                        background:`${c}14`, border:`1px solid ${c}30`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:`0 0 8px ${c}30`,
                      }}>
                        {ins.type === 'up' ? (
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                        ) : ins.type === 'down' ? (
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                        ) : ins.type === 'warn' ? (
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        ) : (
                          <div style={{ width:5, height:5, borderRadius:'50%', background:c }}/>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: '#E2E8F0', margin: 0, fontWeight:600, lineHeight:1.45 }}>{ins.text}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════ TAB 2: EQUIPE ═══════════ */}
        {tab === 'equipe' && (
          <motion.div key="equipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

            {/* Invite section — premium */}
            <motion.div
              initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
              transition={{duration:0.4}}
              style={{
                position:'relative', overflow:'hidden',
                padding: '20px 22px', marginBottom: 24,
                background:'linear-gradient(145deg, rgba(14,22,38,0.7), rgba(8,14,26,0.7))',
                backdropFilter:'blur(18px) saturate(150%)', WebkitBackdropFilter:'blur(18px) saturate(150%)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 16,
                boxShadow:'0 8px 28px rgba(0,0,0,0.4), 0 0 32px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}>
              <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', pointerEvents:'none' }}/>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent:'space-between', gap:12, marginBottom: 16, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:34, height:34, borderRadius:10,
                    background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.3)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 0 14px rgba(255,255,255,0.18)',
                  }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin:0, letterSpacing:'-0.01em' }}>Convites para operadores</p>
                    <p style={{ fontSize:11, color:'var(--t4)', margin:'2px 0 0', fontWeight:500 }}>Gere links unicos para cada novo membro da equipe</p>
                  </div>
                </div>
                {invites.length > 0 && (
                  <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                    <span style={{ fontSize:18, fontWeight:900, color:'rgba(255,255,255,0.78)', fontFamily:'var(--mono)', letterSpacing:'-0.02em' }}>{invites.length}</span>
                    <span style={{ fontSize:10, color:'var(--t4)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>pendente{invites.length>1?'s':''}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: invites.length>0 ? 16 : 0, flexWrap:'wrap' }}>
                <motion.button
                  onClick={sendInvite} disabled={invSaving}
                  whileHover={invSaving?{}:{ scale:1.02, boxShadow:'0 10px 28px rgba(0,140,94,0.45)' }}
                  whileTap={invSaving?{}:{ scale:0.97 }}
                  style={{
                    padding: '11px 22px', fontSize: 13, fontWeight: 800, fontFamily:'inherit',
                    background: invSaving ? 'rgba(0,140,94,0.2)' : 'linear-gradient(145deg, #008C5E, #00a06d)',
                    border: 'none',
                    borderRadius: 11, color: '#fff', cursor: invSaving?'not-allowed':'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: invSaving ? 'none' : '0 6px 20px rgba(0,140,94,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                    opacity: invSaving ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}>
                  {invSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                        style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff' }}
                      />
                      Gerando link...
                    </>
                  ) : (
                    <>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Gerar link de convite
                    </>
                  )}
                </motion.button>
                {invMsg && (
                  <motion.span
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    style={{
                      fontSize: 12, fontWeight: 700,
                      padding:'6px 12px', borderRadius:8,
                      color: invMsg.startsWith('Erro') ? '#EF4444' : '#008C5E',
                      background: invMsg.startsWith('Erro') ? 'rgba(239,68,68,0.08)' : 'rgba(0,140,94,0.08)',
                      border: `1px solid ${invMsg.startsWith('Erro') ? 'rgba(239,68,68,0.2)' : 'rgba(0,140,94,0.2)'}`,
                    }}>{invMsg}</motion.span>
                )}
              </div>

              {/* Pending invites list */}
              {invites.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {invites.map(inv => (
                    <InviteCard
                      key={inv.id}
                      inv={inv}
                      onCopy={() => { setInvMsg('Link copiado!'); setTimeout(() => setInvMsg(''), 3000) }}
                      onDelete={deleteInvite}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Operators list */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Equipe ({isDemo && !operators.length ? DEMO_OPERATORS.length : operators.length})</span>
              </div>
            </div>

            {operators.length === 0 && !isDemo ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Nenhum operador na equipe.</p>
              </div>
            ) : operators.length === 0 && isDemo ? (
              <div>
                <DemoBanner />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {DEMO_OPERATOR_RANKING.map((op, idx) => {
                    const isActiveOp = op.metasAtivas > 0
                    return (
                      <motion.div key={op.id} {...fadeUp(idx, 0.04)} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 14,
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: op.lucroFinal >= 0 ? 'rgba(0,140,94,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${op.lucroFinal >= 0 ? 'rgba(0,140,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>{getInitial(op)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{getName(op)}</p>
                            <span style={{
                              fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                              color: '#94A3B8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)',
                            }}>Operador</span>
                          </div>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{op.email}</p>
                        </div>
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActiveOp ? '#008c5e' : 'rgba(255,255,255,0.15)' }} />
                          <span style={{ fontSize: 10, color: isActiveOp ? '#008c5e' : 'rgba(255,255,255,0.25)' }}>
                            {isActiveOp ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)', color: op.lucroFinal >= 0 ? '#008c5e' : '#ef4444' }}>
                            {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                          </p>
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{op.metasFechadas + op.metasAtivas} metas</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {operatorStats.map((op, idx) => {
                  const isActiveOp = op.isActive || op.activeMetas > 0
                  return (
                    <motion.div key={op.id} {...fadeUp(idx, 0.04)}
                      onClick={() => setSelectedOp(op)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 14, cursor: 'pointer', transition: 'all 0.25s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: op.lucroFinal >= 0 ? 'rgba(0,140,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${op.lucroFinal >= 0 ? 'rgba(0,140,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>{getInitial(op)}</div>

                      {/* Name + email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getName(op)}</p>
                          <span style={{
                            fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                            color: '#94A3B8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.12)',
                          }}>Operador</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{op.email}</p>
                      </div>

                      {/* Status */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: isActiveOp ? '#008c5e' : 'rgba(255,255,255,0.15)',
                        }} />
                        <span style={{ fontSize: 10, color: isActiveOp ? '#008c5e' : 'rgba(255,255,255,0.25)' }}>
                          {isActiveOp ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      {/* Lucro */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'var(--mono, monospace)', color: op.lucroFinal >= 0 ? '#008c5e' : '#ef4444' }}>
                          {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                        </p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{op.metasCount} metas</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════ TAB 3: CONFIGURACOES ═══════════ */}
        {/* FOLHA DE PAGAMENTO */}
        {tab === 'folha' && (
          <motion.div key="folha" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {/* Period filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[{ v: 'hoje', l: 'Hoje' }, { v: '7', l: '7 dias' }, { v: '30', l: '30 dias' }, { v: 'all', l: 'Tudo' }].map(p => (
                <button key={p.v} onClick={() => setFolhaPeriod(p.v)} style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: 'none', transition: 'all 0.2s',
                  background: folhaPeriod === p.v ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: folhaPeriod === p.v ? '#fff' : 'rgba(255,255,255,0.35)',
                }}>{p.l}</button>
              ))}
            </div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
                  Modelo: <strong style={{ color: 'var(--t2)' }}>{(tenant?.operator_payment_model || 'fixo_dep') === 'fixo_dep' ? `R$ ${fmt(Number(tenant?.operator_payment_value ?? 2))} por depositante` : `${Number(tenant?.operator_payment_value ?? 15)}% do lucro`}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--profit)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(folhaData.length > 0 ? folhaData.reduce((a, o) => a + o.pagamento, 0) : (isDemo ? DEMO_OPERATOR_RANKING.filter(o => o.metasFechadas > 0).reduce((a, o) => a + o.totalDeposit * 2, 0) : 0))}</p>
                  <p style={{ fontSize: 10, color: 'var(--t4)', margin: '2px 0 0' }}>Total a pagar</p>
                </div>
              </div>
            </div>

            {/* Table */}
            {folhaData.length === 0 && !isDemo ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--b1)' }}>
                <p style={{ fontSize: 14, color: 'var(--t3)' }}>Nenhum operador com metas fechadas.</p>
              </div>
            ) : folhaData.length === 0 && isDemo ? (
              <div>
                <DemoBanner />
                {(() => {
                  const demoFolha = DEMO_OPERATOR_RANKING.filter(op => op.metasFechadas > 0).map(op => ({
                    ...op,
                    pagamento: op.totalDeposit * 2,
                  }))
                  const totalPag = demoFolha.reduce((a, o) => a + o.pagamento, 0)
                  const totalDep = demoFolha.reduce((a, o) => a + o.totalDeposit, 0)
                  const totalMF = demoFolha.reduce((a, o) => a + o.metasFechadas, 0)
                  const totalLF = demoFolha.reduce((a, o) => a + o.lucroFinal, 0)
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--profit)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(totalPag)}</p>
                          <p style={{ fontSize: 10, color: 'var(--t4)', margin: '2px 0 0' }}>Total a pagar (demo)</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--b1)' }}>
                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px',
                          padding: '12px 20px', background: 'rgba(255,255,255,0.03)',
                          borderBottom: '1px solid var(--b1)',
                        }}>
                          {['Operador', 'Metas', 'Deps', 'Lucro', 'A pagar'].map(h => (
                            <p key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--t4)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Operador' ? 'left' : 'right' }}>{h}</p>
                          ))}
                        </div>
                        {demoFolha.map((op, i) => (
                          <motion.div key={op.id} {...fadeUp(i, 0.04)} style={{
                            display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px',
                            padding: '14px 20px', alignItems: 'center',
                            background: i % 2 === 0 ? 'var(--surface)' : 'rgba(255,255,255,0.015)',
                            borderBottom: i < demoFolha.length - 1 ? '1px solid var(--b1)' : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                                background: 'var(--profit-dim)', border: '1px solid var(--profit-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 700, color: 'var(--t1)',
                              }}>{getInitial(op)}</div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{getName(op)}</p>
                                <p style={{ fontSize: 10, color: 'var(--t4)', margin: 0 }}>{op.email}</p>
                              </div>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>{op.metasFechadas}</p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>{op.totalDeposit}</p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: op.lucroFinal >= 0 ? 'var(--profit)' : 'var(--loss)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>
                              {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                            </p>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-bright)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>
                                R$ {fmt(op.pagamento)}
                              </p>
                              <p style={{ fontSize: 9, color: 'var(--t4)', margin: '1px 0 0' }}>{op.totalDeposit} x R$ {fmt(2)}</p>
                            </div>
                          </motion.div>
                        ))}
                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px',
                          padding: '14px 20px', background: 'rgba(229,57,53,0.04)',
                          borderTop: '1px solid var(--brand-border)',
                        }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Total</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>{totalMF}</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>{totalDep}</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--profit)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(totalLF)}</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-bright)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(totalPag)}</p>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--b1)' }}>
                {/* Header row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px',
                  padding: '12px 20px', background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid var(--b1)',
                }}>
                  {['Operador', 'Metas', 'Deps', 'Lucro', 'A pagar'].map(h => (
                    <p key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--t4)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: h === 'Operador' ? 'left' : 'right' }}>{h}</p>
                  ))}
                </div>

                {/* Rows */}
                {folhaData.map((op, i) => (
                  <div key={op.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px',
                    padding: '14px 20px', alignItems: 'center',
                    background: i % 2 === 0 ? 'var(--surface)' : 'rgba(255,255,255,0.015)',
                    borderBottom: i < folhaData.length - 1 ? '1px solid var(--b1)' : 'none',
                    transition: 'background 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.035)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'rgba(255,255,255,0.015)'}
                  >
                    {/* Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: 'var(--profit-dim)', border: '1px solid var(--profit-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--t1)',
                      }}>{getInitial(op)}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{getName(op)}</p>
                        <p style={{ fontSize: 10, color: 'var(--t4)', margin: 0 }}>{op.email}</p>
                      </div>
                    </div>
                    {/* Metas */}
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>{op.closedCount}</p>
                    {/* Deps */}
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>{op.totalDeposit}</p>
                    {/* Lucro */}
                    <p style={{ fontSize: 14, fontWeight: 700, color: op.lucroFinal >= 0 ? 'var(--profit)' : 'var(--loss)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>
                      {op.lucroFinal >= 0 ? '+' : ''}R$ {fmt(op.lucroFinal)}
                    </p>
                    {/* A pagar */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-bright)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>
                        R$ {fmt(op.pagamento)}
                      </p>
                      <p style={{ fontSize: 9, color: 'var(--t4)', margin: '1px 0 0' }}>
                        {op.payModel === 'percentual' ? `${op.payValue}% lucro` : `${op.totalDeposit} × R$ ${fmt(op.payValue)}`}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Total row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 120px',
                  padding: '14px 20px', background: 'rgba(229,57,53,0.04)',
                  borderTop: '1px solid var(--brand-border)',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Total</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>
                    {folhaData.reduce((a, o) => a + o.closedCount, 0)}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>
                    {folhaData.reduce((a, o) => a + o.totalDeposit, 0)}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--profit)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>
                    R$ {fmt(folhaData.reduce((a, o) => a + o.lucroFinal, 0))}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-bright)', margin: 0, textAlign: 'right', fontFamily: 'var(--mono, monospace)' }}>
                    R$ {fmt(folhaData.reduce((a, o) => a + o.pagamento, 0))}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'config' && (
          <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>

            {/* Modelo de operacao padrao */}
            <div style={{ padding: '22px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Modelo de operacao padrao</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>Pode ser alterado por meta</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'salario_bau', label: 'Salario + Bau', desc: 'Com contrato de plataforma' },
                  { key: 'apenas_bau', label: 'Apenas Bau', desc: 'Sem contrato, lucro so do bau' },
                ].map(opt => {
                  const active = (tenant?.operation_model || 'salario_bau') === opt.key
                  return (
                    <button key={opt.key} onClick={async () => {
                      await supabase.from('tenants').update({ operation_model: opt.key }).eq('id', profile.tenant_id)
                      setTenant(prev => ({ ...prev, operation_model: opt.key }))
                    }} style={{
                      flex: 1, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      background: active ? 'rgba(229,57,53,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.05)'}`,
                      textAlign: 'left', transition: 'all 0.2s',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: active ? '#e53935' : 'rgba(255,255,255,0.5)', margin: '0 0 3px' }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: active ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.2)', margin: 0 }}>{opt.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pagamento de operadores */}
            <PaymentModelConfig tenant={tenant} setTenant={setTenant} profileTenantId={profile.tenant_id} />

            {/* Slots favoritos — apenas PRO */}
            {sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date()) ? (
            <div style={{ padding: '22px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Slots favoritos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Selecione os slots mais usados na sua operacao</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: (tenant?.favorite_slots || []).length > 0 ? 'var(--profit)' : 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {(tenant?.favorite_slots || []).length > 0 && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {(tenant?.favorite_slots || []).length} selecionado{(tenant?.favorite_slots || []).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                {SLOTS.map(slot => {
                  const favs = tenant?.favorite_slots || []
                  const selected = favs.includes(slot.name)
                  return (
                    <button key={slot.id} onClick={async () => {
                      const current = tenant?.favorite_slots || []
                      const newArray = selected ? current.filter(n => n !== slot.name) : [...current, slot.name]
                      const { error: saveErr } = await supabase.from('tenants').update({ favorite_slots: newArray }).eq('id', profile.tenant_id)
                      if (saveErr) { console.error('Erro ao salvar slots:', saveErr); alert('Erro ao salvar: ' + saveErr.message); return }
                      setTenant(prev => ({ ...prev, favorite_slots: newArray }))
                    }} style={{
                      background: selected ? 'rgba(0,140,94,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${selected ? 'rgba(0,140,94,0.5)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 10, padding: 6, cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.15s', position: 'relative',
                    }}>
                      {selected && (
                        <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#008c5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                      <div style={{ width: '100%', height: 60, borderRadius: 6, overflow: 'hidden', marginBottom: 4, background: 'rgba(0,0,0,0.2)' }}>
                        <img src={slot.image} alt={slot.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.5, transition: 'opacity 0.15s' }} />
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: selected ? '#008c5e' : 'rgba(255,255,255,0.4)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            ) : (
            <div style={{ padding: '18px 20px', background: 'rgba(229,57,53,0.04)', border: '1px solid rgba(229,57,53,0.1)', borderRadius: 14, marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#e53935', margin: '0 0 2px' }}>Slots favoritos — exclusivo PRO</p>
                <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>Assine o PRO para configurar slots para seus operadores</p>
              </div>
            </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Operator Drawer */}
      <AnimatePresence>
        {selectedOp && (
          <OperatorDrawer op={selectedOp} onClose={() => setSelectedOp(null)} allMetas={metas} allRemessas={remessas} />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

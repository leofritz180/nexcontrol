'use client'
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = v => Number(v || 0).toLocaleString('pt-BR')
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: i * 0.06, ease } })
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/* ── Count-up hook ── */
function useCountUp(target, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    startRef.current = performance.now()
    const tick = (now) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = (target) * eased
      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, decimals])

  return value
}

/* ── Mini Sparkline (CSS bars, last 6 weeks) ── */
function MiniSparkline({ data, color = '#22C55E', width = 90, height = 32 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data.map(Math.abs))
  const range = max || 1
  const barW = Math.max(3, (width / data.length) - 2)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, width, flexShrink: 0 }} title="Lucro ultimas 6 semanas">
      {data.map((v, i) => {
        const h = Math.max(3, (Math.abs(v) / range) * height)
        const isLast = i === data.length - 1
        return (
          <div key={i} style={{
            width: barW, height: h, borderRadius: 2,
            background: v >= 0
              ? `linear-gradient(180deg, ${color}, rgba(34,197,94,0.3))`
              : 'linear-gradient(180deg, #EF4444, rgba(239,68,68,0.3))',
            opacity: 0.4 + (i / data.length) * 0.6,
            boxShadow: isLast && v > 0 ? `0 0 6px ${color}40` : 'none',
            transition: 'height 0.6s ease',
          }} />
        )
      })}
    </div>
  )
}

/* ── Score Ring (circular indicator) ── */
function ScoreRing({ score, size = 52, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444'
  const bgColor = score >= 70 ? 'rgba(34,197,94,0.08)' : score >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill={bgColor}
          stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{
          fontSize: 14, fontWeight: 800, color, fontFamily: 'var(--mono, monospace)',
          lineHeight: 1, letterSpacing: '-0.02em',
        }}>{Math.round(score)}</span>
        <span style={{ fontSize: 7, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>score</span>
      </div>
    </div>
  )
}

/* ── KPI Card ── */
function KpiCard({ label, value, prefix, rgb, i, isProfit, rawValue, suffix }) {
  const displayCount = useCountUp(typeof rawValue === 'number' ? Math.abs(rawValue) : value, 1400, typeof rawValue === 'number' ? 2 : 0)
  const [hovered, setHovered] = useState(false)

  const profitColor = isProfit ? (rawValue >= 0 ? '34,197,94' : '239,68,68') : null
  const activeRgb = profitColor || rgb

  return (
    <motion.div {...fadeUp(i)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '24px 22px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(145deg, rgba(${activeRgb},0.12), rgba(${activeRgb},0.03) 50%, transparent 80%)`,
        border: `1px solid rgba(${activeRgb},0.18)`,
        borderRadius: 16,
        boxShadow: hovered
          ? `0 0 40px rgba(${activeRgb},0.15), 0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 0 12px rgba(${activeRgb},0.04), inset 0 1px 0 rgba(255,255,255,0.03)`,
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'default',
      }}>
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${activeRgb},${hovered ? 0.12 : 0.05}), transparent 70%)`,
        transition: 'all 0.4s', pointerEvents: 'none',
      }} />
      <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{
        fontSize: 28, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
        fontFamily: 'var(--mono, monospace)',
        color: isProfit ? (rawValue >= 0 ? '#22C55E' : '#EF4444') : `rgb(${rgb})`,
        textShadow: isProfit && rawValue >= 0 ? '0 0 16px rgba(34,197,94,0.25)' : 'none',
      }}>
        {prefix && <span style={{ fontSize: 15, fontWeight: 600, marginRight: 2 }}>{prefix}</span>}
        {isProfit && rawValue < 0 && '-'}
        {isProfit
          ? displayCount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : displayCount}
        {suffix && <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 2, color: 'rgba(255,255,255,0.4)' }}>{suffix}</span>}
      </p>
    </motion.div>
  )
}

/* ── Alert Card ── */
function AlertCard({ alert, i }) {
  const colors = {
    success: { bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', text: '#22C55E', glow: 'rgba(34,197,94,0.08)' },
    warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', text: '#F59E0B', glow: 'rgba(245,158,11,0.08)' },
    danger: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', text: '#EF4444', glow: 'rgba(239,68,68,0.08)' },
    info: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)', text: '#818CF8', glow: 'rgba(99,102,241,0.08)' },
  }
  const c = colors[alert.type] || colors.info

  return (
    <motion.div {...fadeUp(i)} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px', borderRadius: 14,
      background: c.bg, border: `1px solid ${c.border}`,
      boxShadow: `0 0 20px ${c.glow}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.bg, border: `1px solid ${c.border}`,
      }}>
        {alert.type === 'success' ? (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth={2.5} strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        ) : alert.type === 'danger' ? (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth={2.5} strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        ) : alert.type === 'warning' ? (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        ) : (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth={2.5} strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: c.text, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{alert.label}</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{alert.text}</p>
      </div>
    </motion.div>
  )
}

/* ── Drawer Panel ── */
function DrawerPanel({ rede, onClose, allRedes }) {
  if (!rede) return null

  const lucroPorRemessa = rede.remessaCount > 0 ? rede.lucroFinal / rede.remessaCount : 0
  const lucroPorDepositante = rede.depositantes > 0 ? rede.lucroFinal / rede.depositantes : 0
  const lucroPorMeta = rede.metas.length > 0 ? rede.lucroFinal / rede.metas.length : 0
  const ranking = allRedes.findIndex(r => r.nome === rede.nome) + 1
  const totalRedes = allRedes.length

  // Percentile
  const percentile = totalRedes > 1 ? Math.round(((totalRedes - ranking) / (totalRedes - 1)) * 100) : 100

  // Weekly data (6 weeks)
  const weeklyData = useMemo(() => {
    const weeks = []
    const now = new Date()
    for (let w = 5; w >= 0; w--) {
      const start = new Date(now); start.setDate(start.getDate() - (w + 1) * 7)
      const end = new Date(now); end.setDate(end.getDate() - w * 7)
      const weekProfit = rede.metas
        .filter(m => { const d = new Date(m.updated_at || m.created_at); return d >= start && d < end })
        .reduce((s, m) => s + Number(m.lucro_final || 0), 0)
      weeks.push(weekProfit)
    }
    return weeks
  }, [rede])

  // Recent metas (last 10)
  const recentMetas = useMemo(() => {
    return [...rede.metas]
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 10)
  }, [rede])

  // AI recommendation (detailed)
  const recommendation = useMemo(() => {
    const recs = []
    if (rede.trend === 'up' && rede.lucroFinal > 0) {
      recs.push('Rede em tendencia de alta com lucro positivo. Considere aumentar o volume de operacoes para maximizar retorno.')
    }
    if (rede.trend === 'down' && rede.lucroFinal > 0) {
      recs.push('Lucro ainda positivo mas em declinio. Monitore de perto e avalie reduzir exposicao se a tendencia persistir.')
    }
    if (rede.lucroFinal < 0) {
      recs.push('Rede operando no prejuizo. Recomendacao urgente: reavaliar operadores, reduzir volume e considerar pausa temporaria.')
    }
    if (rede.score >= 70) {
      recs.push('Network Score acima de 70 indica operacao saudavel. Esta e uma rede prioritaria para investimento.')
    }
    if (rede.score < 30) {
      recs.push('Network Score critico. Analise profunda necessaria antes de continuar operacoes nesta rede.')
    }
    if (lucroPorRemessa > 0 && rede.remessaCount >= 3) {
      recs.push(`Eficiencia de R$ ${fmt(lucroPorRemessa)} por remessa. ${lucroPorRemessa > 50 ? 'Excelente custo-beneficio.' : 'Eficiencia dentro do aceitavel.'}`)
    }
    if (percentile >= 80) {
      recs.push(`Top ${100 - percentile}% das redes. Performance de destaque no portfilio.`)
    }
    if (recs.length === 0) recs.push('Rede estavel. Avalie oportunidades de escalar gradualmente com base nos indicadores.')
    return recs
  }, [rede, lucroPorRemessa, percentile])

  const recType = rede.lucroFinal < 0 ? 'danger' : rede.trend === 'down' ? 'warning' : rede.score >= 60 ? 'success' : 'info'

  // Comparison metrics
  const avgLucro = allRedes.length > 0 ? allRedes.reduce((s, r) => s + r.lucroFinal, 0) / allRedes.length : 0
  const vsAvg = avgLucro !== 0 ? ((rede.lucroFinal - avgLucro) / Math.abs(avgLucro)) * 100 : 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        }}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9999,
          width: '100%', maxWidth: 480,
          background: 'linear-gradient(180deg, #0c1424 0%, #080e1a 100%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto', padding: '28px 24px 40px',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <ScoreRing score={rede.score} size={48} strokeWidth={4} />
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', marginBottom: 4 }}>{rede.nome}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: rede.trend === 'up' ? 'rgba(34,197,94,0.12)' : rede.trend === 'down' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                    color: rede.trend === 'up' ? '#22C55E' : rede.trend === 'down' ? '#EF4444' : '#94A3B8',
                    border: `1px solid ${rede.trend === 'up' ? 'rgba(34,197,94,0.2)' : rede.trend === 'down' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    {rede.trend === 'up' ? '\u2191 Crescimento' : rede.trend === 'down' ? '\u2193 Queda' : '\u2194 Estavel'}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>#{ranking} de {totalRedes}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: '#94A3B8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#F1F5F9' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94A3B8' }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Lucro destaque */}
        <div style={{
          padding: '22px 20px', borderRadius: 14, marginBottom: 16,
          background: rede.lucroFinal >= 0
            ? 'linear-gradient(145deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))'
            : 'linear-gradient(145deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))',
          border: `1px solid ${rede.lucroFinal >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Lucro total da rede</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <p style={{
              fontSize: 30, fontWeight: 800, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.03em',
              color: rede.lucroFinal >= 0 ? '#22C55E' : '#EF4444',
              textShadow: rede.lucroFinal >= 0 ? '0 0 24px rgba(34,197,94,0.2)' : '0 0 24px rgba(239,68,68,0.2)',
              margin: 0,
            }}>
              R$ {fmt(rede.lucroFinal)}
            </p>
            <span style={{
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
              color: vsAvg >= 0 ? '#22C55E' : '#EF4444',
            }}>
              {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(1)}% vs media
            </span>
          </div>
        </div>

        {/* Percentile bar */}
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Percentil entre redes</span>
            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--mono, monospace)', color: percentile >= 60 ? '#22C55E' : percentile >= 30 ? '#F59E0B' : '#EF4444' }}>
              Top {Math.max(1, 100 - percentile)}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentile}%` }}
              transition={{ duration: 0.8, ease }}
              style={{
                height: '100%', borderRadius: 3,
                background: percentile >= 60
                  ? 'linear-gradient(90deg, rgba(34,197,94,0.6), #22C55E)'
                  : percentile >= 30
                    ? 'linear-gradient(90deg, rgba(245,158,11,0.6), #F59E0B)'
                    : 'linear-gradient(90deg, rgba(239,68,68,0.6), #EF4444)',
              }}
            />
          </div>
        </div>

        {/* Metricas grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Metas fechadas', value: rede.metas.length, color: '99,102,241' },
            { label: 'Depositantes', value: fmtInt(rede.depositantes), color: '59,130,246' },
            { label: 'Remessas', value: fmtInt(rede.remessaCount), color: '168,85,247' },
            { label: 'Win rate', value: `${rede.winRate.toFixed(0)}%`, color: rede.winRate >= 50 ? '34,197,94' : '239,68,68' },
          ].map((m, idx) => (
            <div key={idx} style={{
              padding: '14px 14px', borderRadius: 12,
              background: `linear-gradient(145deg, rgba(${m.color},0.06), transparent)`,
              border: `1px solid rgba(${m.color},0.1)`,
            }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{m.label}</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: `rgb(${m.color})`, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em', margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Eficiencia avancada */}
        <div style={{
          padding: '18px', borderRadius: 14, marginBottom: 16,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>Eficiencia avancada</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Lucro por remessa', value: lucroPorRemessa, prefix: 'R$ ' },
              { label: 'Lucro por depositante', value: lucroPorDepositante, prefix: 'R$ ' },
              { label: 'Lucro por meta', value: lucroPorMeta, prefix: 'R$ ' },
            ].map((m, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{m.label}</span>
                <span style={{
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
                  color: m.value >= 0 ? '#22C55E' : '#EF4444',
                  padding: '2px 8px', borderRadius: 6,
                  background: m.value >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                }}>
                  {m.prefix}{fmt(m.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Evolucao semanal (6 weeks) */}
        <div style={{
          padding: '18px', borderRadius: 14, marginBottom: 16,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>Evolucao semanal (6 semanas)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {weeklyData.map((v, idx) => {
              const maxAbs = Math.max(...weeklyData.map(Math.abs), 1)
              const h = Math.max(6, (Math.abs(v) / maxAbs) * 64)
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, fontFamily: 'var(--mono, monospace)', color: v >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)' }}>
                    {v !== 0 ? (v >= 0 ? '+' : '') + fmt(v) : '-'}
                  </span>
                  <div style={{
                    width: '100%', height: h, borderRadius: 4,
                    background: v >= 0
                      ? 'linear-gradient(180deg, rgba(34,197,94,0.55), rgba(34,197,94,0.15))'
                      : 'linear-gradient(180deg, rgba(239,68,68,0.55), rgba(239,68,68,0.15))',
                    boxShadow: v > 0 ? '0 0 8px rgba(34,197,94,0.1)' : 'none',
                    transition: 'height 0.4s ease',
                  }} />
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>S{idx + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Historico recente (metas) */}
        <div style={{
          padding: '18px', borderRadius: 14, marginBottom: 16,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9', marginBottom: 14 }}>Historico recente ({recentMetas.length} metas)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
            {recentMetas.map((m, idx) => {
              const lucro = Number(m.lucro_final || 0)
              const date = new Date(m.updated_at || m.created_at)
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: lucro >= 0 ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
                  border: `1px solid ${lucro >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)'}`,
                }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                      {m.operador_nome || 'Operador'}
                    </span>
                    <span style={{ fontSize: 10, color: '#64748B', marginLeft: 8 }}>
                      {date.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
                    color: lucro >= 0 ? '#22C55E' : '#EF4444',
                  }}>
                    {lucro >= 0 ? '+' : ''}R$ {fmt(lucro)}
                  </span>
                </div>
              )
            })}
            {recentMetas.length === 0 && (
              <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', padding: '12px 0' }}>Nenhuma meta recente</p>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        <div style={{
          padding: '20px', borderRadius: 14,
          background: 'linear-gradient(145deg, rgba(168,85,247,0.08), rgba(59,130,246,0.04))',
          border: '1px solid rgba(168,85,247,0.15)',
          boxShadow: '0 0 30px rgba(168,85,247,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={2} strokeLinecap="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <line x1="9" y1="21" x2="15" y2="21" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>Insights estrategicos IA</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '2px 7px', borderRadius: 5 }}>AI</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendation.map((rec, idx) => (
              <p key={idx} style={{
                fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0,
                paddingLeft: 12,
                borderLeft: `2px solid ${recType === 'success' ? 'rgba(34,197,94,0.4)' : recType === 'warning' ? 'rgba(245,158,11,0.4)' : recType === 'danger' ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.4)'}`,
              }}>
                {rec}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* =================================================================
   Main Page — Sistema Estrategico de Decisao
   ================================================================= */
export default function RedesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [metas, setMetas] = useState([])
  const [remessas, setRemessas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRede, setSelectedRede] = useState(null)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p || p.role !== 'admin') { router.push('/operator'); return }
    setProfile(p)
    const [{ data: t }, { data: sb }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    setTenant(t); setSub(sb)
    loadData()
  }

  async function loadData() {
    setLoading(true)
    const [{ data: ms }, { data: rs }] = await Promise.all([
      supabase.from('metas').select('*').order('created_at', { ascending: false }),
      supabase.from('remessas').select('*').order('created_at', { ascending: false }),
    ])
    const activeMetas = (ms || []).filter(m => !m.deleted_at)
    const activeMetaIds = new Set(activeMetas.map(m => m.id))
    setMetas(activeMetas)
    setRemessas((rs || []).filter(r => activeMetaIds.has(r.meta_id)))
    setLoading(false)
  }

  /* ── Compute redes data with Network Score ── */
  const redesData = useMemo(() => {
    const closed = metas.filter(m => m.status_fechamento === 'fechada')
    const grouped = {}

    closed.forEach(m => {
      const rede = m.rede || 'Sem rede'
      if (!grouped[rede]) grouped[rede] = { nome: rede, metas: [], remessaCount: 0, lucroFinal: 0, depositantes: 0 }
      grouped[rede].metas.push(m)
      grouped[rede].lucroFinal += Number(m.lucro_final || 0)
      grouped[rede].depositantes += Number(m.quantidade_contas || 0)
    })

    // Count remessas per rede
    remessas.forEach(r => {
      const meta = metas.find(m => m.id === r.meta_id)
      if (meta) {
        const rede = meta.rede || 'Sem rede'
        if (grouped[rede]) grouped[rede].remessaCount++
      }
    })

    // Trend + sparkline + efficiency
    const now = new Date()
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
    const d14 = new Date(now); d14.setDate(d14.getDate() - 14)

    const allLucros = Object.values(grouped).map(g => g.lucroFinal)
    const maxLucro = Math.max(...allLucros, 1)
    const minLucro = Math.min(...allLucros, 0)

    Object.values(grouped).forEach(g => {
      const last7 = g.metas.filter(m => new Date(m.updated_at || m.created_at) >= d7).reduce((s, m) => s + Number(m.lucro_final || 0), 0)
      const prev7 = g.metas.filter(m => { const d = new Date(m.updated_at || m.created_at); return d >= d14 && d < d7 }).reduce((s, m) => s + Number(m.lucro_final || 0), 0)

      if (last7 > prev7 * 1.05) g.trend = 'up'
      else if (last7 < prev7 * 0.95) g.trend = 'down'
      else g.trend = 'stable'

      g.last7Lucro = last7
      g.prev7Lucro = prev7
      g.trendPct = prev7 !== 0 ? ((last7 - prev7) / Math.abs(prev7)) * 100 : (last7 > 0 ? 100 : last7 < 0 ? -100 : 0)

      // Sparkline: last 6 weeks
      const sparkline = []
      for (let w = 5; w >= 0; w--) {
        const ws = new Date(now); ws.setDate(ws.getDate() - (w + 1) * 7)
        const we = new Date(now); we.setDate(we.getDate() - w * 7)
        const wp = g.metas
          .filter(m => { const d = new Date(m.updated_at || m.created_at); return d >= ws && d < we })
          .reduce((s, m) => s + Number(m.lucro_final || 0), 0)
        sparkline.push(wp)
      }
      g.sparkline = sparkline

      // Efficiency
      g.lucroPorRemessa = g.remessaCount > 0 ? g.lucroFinal / g.remessaCount : 0
      g.lucroPorDepositante = g.depositantes > 0 ? g.lucroFinal / g.depositantes : 0

      // Win rate (metas com lucro positivo)
      const metasComLucro = g.metas.filter(m => Number(m.lucro_final || 0) > 0).length
      g.winRate = g.metas.length > 0 ? (metasComLucro / g.metas.length) * 100 : 0
    })

    // Compute Network Score (0-100)
    // Normalize lucro, efficiency, win rate
    const allEfficiencies = Object.values(grouped).map(g => g.lucroPorRemessa)
    const maxEff = Math.max(...allEfficiencies, 1)
    const minEff = Math.min(...allEfficiencies, 0)

    Object.values(grouped).forEach(g => {
      // Lucro score (40%): normalize 0..100
      const lucroNorm = maxLucro !== minLucro
        ? clamp(((g.lucroFinal - minLucro) / (maxLucro - minLucro)) * 100, 0, 100)
        : (g.lucroFinal > 0 ? 70 : 30)

      // Efficiency score (30%): lucro per remessa normalized
      const effNorm = maxEff !== minEff
        ? clamp(((g.lucroPorRemessa - minEff) / (maxEff - minEff)) * 100, 0, 100)
        : (g.lucroPorRemessa > 0 ? 60 : 20)

      // Consistency score (30%): win rate directly maps to 0-100
      const consistNorm = clamp(g.winRate, 0, 100)

      g.score = Math.round(lucroNorm * 0.4 + effNorm * 0.3 + consistNorm * 0.3)
      g.scoreBreakdown = { lucro: Math.round(lucroNorm), eficiencia: Math.round(effNorm), consistencia: Math.round(consistNorm) }
    })

    // Sort by score (primary), lucro (secondary)
    const sorted = Object.values(grouped).sort((a, b) => b.score - a.score || b.lucroFinal - a.lucroFinal)

    // Previous ranking (by lucro only, to detect movement)
    const byLucro = [...sorted].sort((a, b) => b.lucroFinal - a.lucroFinal)
    sorted.forEach((g, idx) => {
      const prevIdx = byLucro.findIndex(r => r.nome === g.nome)
      g.rankMovement = prevIdx - idx // positive = climbed, negative = fell
    })

    return sorted
  }, [metas, remessas])

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const totalRedes = redesData.length
    const redesLucrativas = redesData.filter(r => r.lucroFinal > 0).length
    const lucroTotal = redesData.reduce((s, r) => s + r.lucroFinal, 0)
    const avgScore = totalRedes > 0 ? Math.round(redesData.reduce((s, r) => s + r.score, 0) / totalRedes) : 0
    const bestEff = redesData.filter(r => r.remessaCount > 0).sort((a, b) => b.lucroPorRemessa - a.lucroPorRemessa)[0]
    return { totalRedes, redesLucrativas, lucroTotal, avgScore, bestEff }
  }, [redesData])

  /* ── AI Recommendations ── */
  const aiRecommendations = useMemo(() => {
    const recs = []
    if (redesData.length === 0) return recs

    // Best efficiency recommendation
    const withRemessas = redesData.filter(r => r.remessaCount > 0 && r.lucroFinal > 0)
    if (withRemessas.length > 0) {
      const best = [...withRemessas].sort((a, b) => b.lucroPorRemessa - a.lucroPorRemessa)[0]
      recs.push({
        type: 'success',
        text: `${best.nome} esta com o melhor custo-beneficio: R$ ${fmt(best.lucroPorRemessa)} por remessa. Considere aumentar volume nesta rede.`,
      })
    }

    // Growing networks
    const growing = redesData.filter(r => r.trend === 'up' && r.lucroFinal > 0)
    if (growing.length > 0) {
      recs.push({
        type: 'success',
        text: `Aumentar volume em ${growing.map(g => g.nome).slice(0, 2).join(' e ')} -- tendencia de alta com lucro positivo.`,
      })
    }

    // Declining networks
    const declining = redesData.filter(r => r.trend === 'down')
    if (declining.length > 0) {
      declining.slice(0, 2).forEach(d => {
        recs.push({
          type: d.lucroFinal < 0 ? 'danger' : 'warning',
          text: `Reduzir exposicao na ${d.nome}${d.trendPct ? ` (${d.trendPct > 0 ? '+' : ''}${d.trendPct.toFixed(0)}% na semana)` : ''}.${d.lucroFinal < 0 ? ' Rede operando no prejuizo.' : ' Tendencia de queda detectada.'}`,
        })
      })
    }

    // High score but low volume
    const underexploited = redesData.filter(r => r.score >= 60 && r.remessaCount < 5 && r.lucroFinal > 0)
    if (underexploited.length > 0) {
      recs.push({
        type: 'info',
        text: `${underexploited[0].nome} tem score ${underexploited[0].score} mas volume baixo. Oportunidade de escalar.`,
      })
    }

    return recs.slice(0, 5)
  }, [redesData])

  /* ── Strategic Alerts ── */
  const strategicAlerts = useMemo(() => {
    const alerts = []
    if (redesData.length === 0) return alerts

    // Peak profit detection
    redesData.forEach(r => {
      const last = r.sparkline[r.sparkline.length - 1]
      const prev = r.sparkline.slice(0, -1)
      const maxPrev = Math.max(...prev)
      if (last > 0 && last > maxPrev && maxPrev > 0) {
        alerts.push({
          type: 'success', label: 'Pico de lucro',
          text: `${r.nome} atingiu pico de lucro semanal: R$ ${fmt(last)}`,
        })
      }
    })

    // Decline alerts
    redesData.forEach(r => {
      if (r.trendPct < -15) {
        alerts.push({
          type: 'danger', label: 'Queda detectada',
          text: `Queda de ${Math.abs(r.trendPct).toFixed(0)}% na ${r.nome} na ultima semana`,
        })
      }
    })

    // Negative networks
    const negatives = redesData.filter(r => r.lucroFinal < 0)
    if (negatives.length > 0) {
      alerts.push({
        type: 'warning', label: 'Redes no vermelho',
        text: `${negatives.length} rede${negatives.length > 1 ? 's' : ''} com prejuizo acumulado: ${negatives.map(n => n.nome).slice(0, 3).join(', ')}`,
      })
    }

    // Low win rate alert
    redesData.filter(r => r.winRate < 40 && r.metas.length >= 3).forEach(r => {
      alerts.push({
        type: 'warning', label: 'Win rate baixo',
        text: `${r.nome} com apenas ${r.winRate.toFixed(0)}% de taxa de acerto em ${r.metas.length} metas`,
      })
    })

    return alerts.slice(0, 6)
  }, [redesData])

  /* ── Heatmap color per network ── */
  const getHeatmapStyle = useCallback((rede, isTop) => {
    let tintR, tintG, tintB, intensity

    if (rede.lucroFinal > 0 && rede.trend === 'up') {
      // High performance: green
      tintR = 34; tintG = 197; tintB = 94
      intensity = clamp(rede.score / 100 * 0.14, 0.04, 0.14)
    } else if (rede.lucroFinal > 0 && rede.trend === 'stable') {
      // Medium: yellow-green
      tintR = 180; tintG = 180; tintB = 50
      intensity = 0.05
    } else if (rede.lucroFinal > 0 && rede.trend === 'down') {
      // Positive but declining: yellow
      tintR = 245; tintG = 158; tintB = 11
      intensity = 0.07
    } else if (rede.lucroFinal <= 0) {
      // Risk: red
      tintR = 239; tintG = 68; tintB = 68
      intensity = clamp(Math.abs(rede.lucroFinal) / 1000, 0.04, 0.12)
    } else {
      tintR = 255; tintG = 255; tintB = 255
      intensity = 0.02
    }

    const rgb = `${tintR},${tintG},${tintB}`
    return {
      background: `linear-gradient(145deg, rgba(${rgb},${intensity}), rgba(${rgb},${intensity * 0.2}) 50%, rgba(12,18,32,0.95))`,
      borderColor: `rgba(${rgb},${intensity + 0.08})`,
      glowColor: `rgba(${rgb},${intensity * 0.6})`,
      rgb,
    }
  }, [])

  /* ── Loading state ── */
  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg, #0c1424, #080e1a)' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 32, height: 32, border: '3px solid rgba(229,57,53,0.2)', borderTopColor: '#e53935', borderRadius: '50%' }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando sistema estrategico...</p>
        </motion.div>
      </div>
    )
  }

  const topLucro = redesData.length > 0 ? Math.max(...redesData.map(r => r.lucroFinal), 1) : 1

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ padding: '32px 24px 64px', maxWidth: 1140, margin: '0 auto' }}>

          {/* ── Header ── */}
          <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(229,57,53,0.15), rgba(168,85,247,0.1))',
                border: '1px solid rgba(229,57,53,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(229,57,53,0.08)',
              }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="2" />
                  <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.03em', marginBottom: 2 }}>
                  Sistema Estrategico de Decisao
                </h1>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  Heatmap de performance, scoring, eficiencia e recomendacoes inteligentes por rede
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            <KpiCard label="Total de redes" value={kpis.totalRedes} rgb="99,102,241" i={1} />
            <KpiCard label="Redes lucrativas" value={kpis.redesLucrativas} rgb="34,197,94" i={2} />
            <KpiCard label="Lucro total" value={0} prefix="R$ " rgb="34,197,94" i={3} isProfit={true} rawValue={kpis.lucroTotal} />
            <KpiCard label="Score medio" value={kpis.avgScore} rgb="168,85,247" i={4} suffix="/100" />
          </div>

          {/* ── AI Recommendations Box ── */}
          {aiRecommendations.length > 0 && (
            <motion.div {...fadeUp(5)} style={{ marginBottom: 28 }}>
              <div style={{
                padding: '22px 24px', borderRadius: 16,
                background: 'linear-gradient(145deg, rgba(168,85,247,0.08), rgba(99,102,241,0.04) 50%, rgba(255,255,255,0.01))',
                border: '1px solid rgba(168,85,247,0.15)',
                boxShadow: '0 0 50px rgba(168,85,247,0.06), 0 0 100px rgba(168,85,247,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={2} strokeLinecap="round">
                      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                      <line x1="9" y1="21" x2="15" y2="21" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Recomendacoes automaticas</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '3px 9px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>IA</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {aiRecommendations.map((rec, i) => (
                    <motion.div key={i} {...fadeUp(6 + i)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 16px', borderRadius: 12,
                      background: rec.type === 'success' ? 'rgba(34,197,94,0.05)' : rec.type === 'warning' ? 'rgba(245,158,11,0.05)' : rec.type === 'danger' ? 'rgba(239,68,68,0.05)' : 'rgba(99,102,241,0.05)',
                      border: `1px solid ${rec.type === 'success' ? 'rgba(34,197,94,0.1)' : rec.type === 'warning' ? 'rgba(245,158,11,0.1)' : rec.type === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)'}`,
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: rec.type === 'success' ? 'rgba(34,197,94,0.1)' : rec.type === 'danger' ? 'rgba(239,68,68,0.1)' : rec.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                      }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: rec.type === 'success' ? '#22C55E' : rec.type === 'danger' ? '#EF4444' : rec.type === 'warning' ? '#F59E0B' : '#818CF8',
                        }}>
                          {rec.type === 'success' ? '\u2191' : rec.type === 'danger' ? '\u2193' : rec.type === 'warning' ? '!' : '\u2192'}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1.55 }}>{rec.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Strategic Alerts ── */}
          {strategicAlerts.length > 0 && (
            <motion.div {...fadeUp(7)} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>Alertas estrategicos</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
                {strategicAlerts.map((alert, i) => (
                  <AlertCard key={i} alert={alert} i={8 + i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Network Ranking with Heatmap ── */}
          <motion.div {...fadeUp(9)} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>Ranking por Network Score</span>
              <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>{redesData.length} rede{redesData.length !== 1 ? 's' : ''}</span>
            </div>

            {redesData.length === 0 ? (
              <div style={{
                padding: '56px 24px', textAlign: 'center', borderRadius: 16,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeLinecap="round" style={{ margin: '0 auto 16px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <p style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>Nenhuma rede com metas fechadas ainda</p>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Feche metas para ativar o sistema estrategico</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {redesData.map((rede, i) => {
                  const pct = topLucro > 0 ? Math.max(0, (rede.lucroFinal / topLucro) * 100) : 0
                  const isTop = i === 0
                  const heat = getHeatmapStyle(rede, isTop)

                  return (
                    <motion.div key={rede.nome} {...fadeUp(10 + i)}>
                      <div
                        onClick={() => setSelectedRede(rede)}
                        style={{
                          padding: '20px 22px', position: 'relative', overflow: 'hidden',
                          borderRadius: 16, cursor: 'pointer',
                          background: heat.background,
                          border: `1px solid ${heat.borderColor}`,
                          boxShadow: isTop ? `0 0 40px ${heat.glowColor}, 0 8px 32px rgba(0,0,0,0.2)` : 'none',
                          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.015) translateY(-2px)'
                          e.currentTarget.style.boxShadow = `0 0 50px ${heat.glowColor}, 0 16px 48px rgba(0,0,0,0.35)`
                          e.currentTarget.style.filter = 'brightness(1.06)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none'
                          e.currentTarget.style.boxShadow = isTop ? `0 0 40px ${heat.glowColor}, 0 8px 32px rgba(0,0,0,0.2)` : 'none'
                          e.currentTarget.style.filter = 'none'
                        }}
                      >
                        {/* Top network aura */}
                        {isTop && (
                          <div style={{
                            position: 'absolute', top: -60, right: -60, width: 200, height: 200,
                            borderRadius: '50%', pointerEvents: 'none',
                            background: `radial-gradient(circle, ${heat.glowColor}, transparent 70%)`,
                          }} />
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                          {/* Score Ring */}
                          <ScoreRing score={rede.score} size={52} strokeWidth={4} />

                          {/* Rank + Name */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: 11, fontWeight: 800, color: '#64748B', fontFamily: 'var(--mono, monospace)',
                                minWidth: 24,
                              }}>#{i + 1}</span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rede.nome}</span>
                              {/* Trend badge */}
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 6,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                background: rede.trend === 'up' ? 'rgba(34,197,94,0.1)' : rede.trend === 'down' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                                color: rede.trend === 'up' ? '#22C55E' : rede.trend === 'down' ? '#EF4444' : '#94A3B8',
                                border: `1px solid ${rede.trend === 'up' ? 'rgba(34,197,94,0.15)' : rede.trend === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`,
                              }}>
                                {rede.trend === 'up' ? '\u2191 Alta' : rede.trend === 'down' ? '\u2193 Queda' : '\u2194 Estavel'}
                              </span>
                              {/* Rank movement */}
                              {rede.rankMovement !== 0 && (
                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: rede.rankMovement > 0 ? '#22C55E' : '#EF4444',
                                }}>
                                  {rede.rankMovement > 0 ? `\u25B2${rede.rankMovement}` : `\u25BC${Math.abs(rede.rankMovement)}`}
                                </span>
                              )}
                            </div>
                            {/* Metrics row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: '#94A3B8' }}>{rede.metas.length}</span> metas
                              </span>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: '#94A3B8' }}>{rede.depositantes}</span> dep.
                              </span>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                <span style={{ fontWeight: 700, color: '#94A3B8' }}>{rede.remessaCount}</span> rem.
                              </span>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                win <span style={{ fontWeight: 700, color: rede.winRate >= 50 ? '#22C55E' : '#EF4444', fontFamily: 'var(--mono, monospace)' }}>{rede.winRate.toFixed(0)}%</span>
                              </span>
                            </div>
                          </div>

                          {/* Efficiency badges */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                            {rede.remessaCount > 0 && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
                                padding: '3px 8px', borderRadius: 6,
                                color: rede.lucroPorRemessa >= 0 ? '#22C55E' : '#EF4444',
                                background: rede.lucroPorRemessa >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                border: `1px solid ${rede.lucroPorRemessa >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
                              }}>
                                R$ {fmt(rede.lucroPorRemessa)}/rem
                              </span>
                            )}
                            {rede.depositantes > 0 && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono, monospace)',
                                padding: '3px 8px', borderRadius: 6,
                                color: rede.lucroPorDepositante >= 0 ? '#60a5fa' : '#EF4444',
                                background: 'rgba(59,130,246,0.06)',
                                border: '1px solid rgba(59,130,246,0.1)',
                              }}>
                                R$ {fmt(rede.lucroPorDepositante)}/dep
                              </span>
                            )}
                          </div>

                          {/* Sparkline */}
                          <MiniSparkline data={rede.sparkline} color={rede.lucroFinal >= 0 ? '#22C55E' : '#EF4444'} />

                          {/* Lucro */}
                          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
                            <p style={{
                              fontSize: 20, fontWeight: 800, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em',
                              color: rede.lucroFinal >= 0 ? '#22C55E' : '#EF4444',
                              textShadow: rede.lucroFinal >= 0 ? '0 0 16px rgba(34,197,94,0.2)' : 'none',
                              marginBottom: 2, margin: 0,
                            }}>
                              {rede.lucroFinal >= 0 ? '+' : ''}R$ {fmt(rede.lucroFinal)}
                            </p>
                            <p style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>lucro total</p>
                          </div>
                        </div>

                        {/* Performance bar (animated) */}
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${clamp(rede.score, 0, 100)}%` }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.06, ease }}
                            style={{
                              height: '100%', borderRadius: 2,
                              background: rede.score >= 70
                                ? 'linear-gradient(90deg, rgba(34,197,94,0.6), #22C55E)'
                                : rede.score >= 40
                                  ? 'linear-gradient(90deg, rgba(245,158,11,0.6), #F59E0B)'
                                  : 'linear-gradient(90deg, rgba(239,68,68,0.6), #EF4444)',
                              boxShadow: rede.score >= 70 ? '0 0 8px rgba(34,197,94,0.15)' : 'none',
                            }}
                          />
                        </div>

                        {/* Click hint */}
                        <div style={{
                          position: 'absolute', bottom: 6, right: 14,
                          fontSize: 9, color: 'rgba(255,255,255,0.12)',
                        }}>
                          Clique para analise completa
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </AppLayout>

      {/* ── Drawer Panel ── */}
      <AnimatePresence>
        {selectedRede && (
          <DrawerPanel
            rede={selectedRede}
            onClose={() => setSelectedRede(null)}
            allRedes={redesData}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

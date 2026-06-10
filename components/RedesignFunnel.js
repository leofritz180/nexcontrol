'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * RedesignFunnel — funil analítico da operação (flat, profissional).
 * Inspirado em dashboards modernas (HubSpot / Stripe / Linear).
 * Sem gradiente, 3D, gloss, glow ou trapézio estilizado. Só usado no
 * redesign (gated).
 *
 * props.items: [{ label, value, prefix?, suffix?, currency?, variation? }]
 *   variation: número em % (positivo/negativo) — opcional.
 */

const ease = [0.33, 1, 0.68, 1]
const BRAND = '#e53935'

// largura de cada bloco (afunila de cima p/ baixo) — sutil, não decorativo
const WIDTHS = [100, 92, 84, 76, 68]

function fmtCurrency(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtInt(v) { return Number(v || 0).toLocaleString('pt-BR') }

function CountUp({ value, currency, duration = 1.2 }) {
  const [d, setD] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  useEffect(() => {
    if (!inView) return
    const to = Number(value) || 0
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setD(to * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])
  return <span ref={ref}>{currency ? fmtCurrency(d) : fmtInt(Math.round(d))}</span>
}

export default function RedesignFunnel({ items = [], legacy = false }) {
  const data = items.slice(0, 5)

  // taxa de conversão de cada nível em relação ao anterior
  const conv = data.map((it, i) => {
    if (i === 0) return null
    const prev = Number(data[i - 1].value) || 0
    if (prev === 0) return null
    return Math.round((Number(it.value) || 0) / prev * 100)
  })

  return (
    <div style={{
      height: '100%',
      padding: '22px 22px 24px',
      background: 'var(--surface)',
      border: '1px solid var(--b1)',
      borderRadius: 14,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header — flat */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(229,57,53,0.10)', border: '1px solid rgba(229,57,53,0.30)',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em' }}>Funil da Operação</p>
            <p style={{ fontSize: 10.5, color: 'var(--t3)', margin: '1px 0 0' }}>Visão consolidada do sistema</p>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {data.map((it, i) => {
          const w = WIDTHS[i] ?? WIDTHS[WIDTHS.length - 1]
          const v = Number(it.variation)
          const hasVar = it.variation != null && !Number.isNaN(v)
          const highlight = i === 0 // bloco principal em destaque
          return (
            <div key={i} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* bloco da etapa */}
              <motion.div
                className="nx-on-red"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 * i, ease }}
                style={{
                  width: `${w}%`,
                  // legacy (leofritz178): fundo preto + contorno vermelho (visual antigo)
                  background: legacy ? '#000' : '#e10000',
                  border: legacy ? `1px solid ${BRAND}` : '1px solid rgba(255,255,255,0.28)',
                  boxShadow: highlight
                    ? (legacy ? `0 0 0 3px rgba(229,57,53,0.18), 0 0 18px rgba(229,57,53,0.20)` : '0 0 0 3px rgba(225,0,0,0.20)')
                    : 'none',
                  borderRadius: 10,
                  padding: '12px 16px',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span className="nx-red-txt" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.label}
                  </span>
                  {highlight ? (
                    <span style={{
                      flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                      color: '#c1121f', background: '#fff', borderRadius: 5, padding: '3px 7px',
                    }}>DESTAQUE</span>
                  ) : hasVar && (
                    <span style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)',
                      color: v >= 0 ? 'var(--profit)' : '#ffd0d0',
                    }}>
                      <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ transform: v >= 0 ? 'none' : 'rotate(180deg)' }}>
                        <polyline points="6 15 12 9 18 15" />
                      </svg>
                      {Math.abs(v)}%
                    </span>
                  )}
                </div>
                <p className="nx-red-txt" style={{ margin: '5px 0 0', fontFamily: 'var(--mono)', fontSize: highlight ? 24 : 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {it.prefix || ''}<CountUp value={it.value} currency={it.currency} />{it.suffix || ''}
                </p>
              </motion.div>

              {/* conector + taxa de conversão entre níveis */}
              {i < data.length - 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '7px 0' }}>
                  <div style={{ width: 1, height: 9, background: 'rgba(229,57,53,0.35)' }} />
                  <span style={{
                    fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                    color: '#ff6b6b', background: 'rgba(229,57,53,0.10)',
                    border: '1px solid rgba(229,57,53,0.25)', borderRadius: 5,
                    padding: '2px 7px', lineHeight: 1.2, letterSpacing: '0.02em',
                  }}>
                    {conv[i + 1] == null ? '—' : `${conv[i + 1]}%`}
                  </span>
                  <div style={{ width: 1, height: 9, background: 'rgba(229,57,53,0.35)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

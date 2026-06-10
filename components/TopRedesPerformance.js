'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * TopRedesPerformance — card analitico premium (EXPERIMENTAL, gated leofritz178).
 * Donut minimalista enterprise (Linear/Stripe/Vercel Analytics), familia
 * vermelha NexControl + cinzas. Sem cores chapadas de marketing.
 *
 * props.metas: array de metas do tenant (usa as fechadas, lucro_final por rede).
 * Se nao houver dados reais, usa mock (so cai aqui pra leofritz178).
 */

const ease = [0.33, 1, 0.68, 1]
// familia vermelha + cinzas premium (mesma identidade)
const PALETTE = ['#ff2a2a', '#d91c1c', '#a41212', '#4a4a4a', '#2d2d2d']
const MOCK = [
  { rede: 'WE', lucro: 2540 },
  { rede: 'KF', lucro: 1870 },
  { rede: 'WP', lucro: 1230 },
  { rede: 'A8', lucro: 760 },
  { rede: 'VOY', lucro: 410 },
]

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function TopRedesPerformance({ metas = [] }) {
  const [hover, setHover] = useState(-1)

  const data = useMemo(() => {
    const fechadas = (metas || []).filter(m => m && m.status_fechamento === 'fechada' && m.rede)
    const map = {}
    fechadas.forEach(m => {
      const r = m.rede || 'Outros'
      map[r] = (map[r] || 0) + Number(m.lucro_final || 0)
    })
    let arr = Object.entries(map)
      .map(([rede, lucro]) => ({ rede, lucro }))
      .filter(x => x.lucro > 0)            // distribuicao de lucro: so redes positivas
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 5)
    if (arr.length === 0) arr = MOCK       // sem dados reais -> mock (so leofritz178)
    const total = arr.reduce((a, x) => a + x.lucro, 0) || 1
    return arr.map((x, i) => ({ ...x, pct: (x.lucro / total) * 100, color: PALETTE[i] || PALETTE[PALETTE.length - 1] }))
  }, [metas])

  // geometria do donut
  const SIZE = 168, STROKE = 16, R = (SIZE - STROKE) / 2, CX = SIZE / 2, C = 2 * Math.PI * R
  const GAP = 2.5 // graus de respiro entre segmentos (em comprimento de arco)
  let acc = 0
  const segs = data.map((d) => {
    const len = (d.pct / 100) * C
    const gap = data.length > 1 ? GAP : 0
    const seg = { ...d, len: Math.max(len - gap, 0.5), offset: acc }
    acc += len
    return seg
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      style={{
        background: '#050505',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '22px 24px',
        boxShadow: '0 16px 44px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,42,42,0.08)', border: '1px solid rgba(255,42,42,0.22)',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ff2a2a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Top Redes Performance</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', margin: '2px 0 0' }}>Distribuição do lucro por rede</p>
          </div>
        </div>
      </div>

      {/* Corpo: donut + ranking */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>

        {/* DONUT */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0, margin: '0 auto' }}>
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            {/* trilho */}
            <circle cx={CX} cy={CX} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE} />
            {segs.map((s, i) => (
              <motion.circle
                key={s.rede}
                cx={CX} cy={CX} r={R} fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? STROKE + 3 : STROKE}
                strokeLinecap="round"
                strokeDasharray={`${s.len} ${C - s.len}`}
                initial={{ strokeDashoffset: -C }}
                animate={{ strokeDashoffset: -s.offset }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                style={{ cursor: 'pointer', opacity: hover === -1 || hover === i ? 1 : 0.32, transition: 'opacity 0.2s, stroke-width 0.2s' }}
              />
            ))}
          </svg>

          {/* Centro: foguete glass */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 76, height: 76, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 16px rgba(0,0,0,0.5)',
          }}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#ff2a2a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(255,42,42,0.30))' }}>
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>

          {/* Tooltip */}
          {hover >= 0 && segs[hover] && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', bottom: -8, left: '50%', transform: 'translate(-50%,100%)',
                whiteSpace: 'nowrap', zIndex: 5, pointerEvents: 'none',
                padding: '7px 11px', borderRadius: 9,
                background: 'rgba(10,10,10,0.96)', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 28px rgba(0,0,0,0.6)',
              }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: segs[hover].color }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', fontFamily: 'var(--mono)' }}>{segs[hover].rede}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--mono)' }}>R$ {fmt(segs[hover].lucro)} · {segs[hover].pct.toFixed(0)}%</span>
              </span>
            </motion.div>
          )}
        </div>

        {/* RANKING */}
        <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {segs.map((s, i) => (
            <motion.div
              key={s.rede}
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.06, ease }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 10, cursor: 'default',
                background: hover === i ? 'rgba(255,255,255,0.04)' : 'transparent',
                transition: 'background 0.2s',
              }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: `0 0 8px ${s.color}55` }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--mono)', minWidth: 38 }}>{s.rede}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', fontFamily: 'var(--mono)', textAlign: 'right' }}>+R$ {fmt(s.lucro)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', minWidth: 38, textAlign: 'right' }}>{s.pct.toFixed(0)}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

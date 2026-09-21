'use client'
// ─────────────────────────────────────────────────────────────────────────
// OWNER EXECUTIVE — topo premium do /owner. Hierarquia de leitura executiva:
//   1) MRR + ARR (heróis)  2) ritmo de caixa  3) saúde da base
//   4) tendência de 12 meses  5) funil
// Paleta da casa: preto profundo, vermelho brand, mint só pra positivo.
// Sem dourado/azul/âmbar. Todos os números vêm de /api/owner/stats (reais).
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt0 = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const RED = '#e11d1d', MINT = 'var(--profit)', LOSS = 'var(--loss)'
const T1 = '#F5F5F5', T2 = 'rgba(255,255,255,0.62)', T3 = 'rgba(255,255,255,0.42)', T4 = 'rgba(255,255,255,0.26)'

const shell = {
  borderRadius: 18, background: 'var(--surface)',
  border: '1px solid var(--b1)',
  boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.04), inset -1px 0 0 rgba(255,255,255,0.04), 0 18px 50px rgba(0,0,0,0.5)',
}

function useCount(target, dur = 1100) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const t = Number(target || 0); let raf; const start = performance.now()
    const tick = now => { const p = Math.min((now - start) / dur, 1); setV(t * (1 - Math.pow(1 - p, 4))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [target, dur])
  return v
}
function Money({ v, size = 30, color = T1 }) {
  const n = useCount(v)
  return <span style={{ fontFamily: 'var(--mono)', fontSize: size, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>R$ {fmt(n)}</span>
}
function Int({ v, size = 26, color = T1, suffix = '' }) {
  const n = useCount(v)
  return <span style={{ fontFamily: 'var(--mono)', fontSize: size, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{fmt0(n)}{suffix}</span>
}
function Delta({ pct }) {
  if (pct == null || isNaN(pct)) return null
  const up = pct >= 0
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 800, fontFamily: 'var(--mono)', color: up ? MINT : LOSS, padding: '3px 8px', borderRadius: 7, background: up ? 'rgba(209,250,229,0.08)' : 'rgba(239,68,68,0.1)' }}>
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d={up ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} /></svg>
      {Math.abs(pct)}%
    </span>
  )
}
function Label({ children }) {
  return <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T3, margin: '0 0 10px' }}>{children}</p>
}
function Hint({ children, color = T4 }) {
  return <p style={{ fontSize: 11.5, color, margin: '8px 0 0', lineHeight: 1.45 }}>{children}</p>
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// ── gráfico de 12 meses (barras) ──
function MonthChart({ series }) {
  const [hov, setHov] = useState(null)
  const max = Math.max(1, ...series.map(s => s.revenue))
  const last = series[series.length - 1], prev = series[series.length - 2]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150, padding: '0 2px' }}>
        {series.map((s, i) => {
          const h = Math.max(3, (s.revenue / max) * 150)
          const isLast = i === series.length - 1, isHov = hov === i
          return (
            <div key={s.month} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', cursor: 'default' }}>
              {isHov && (
                <div style={{ position: 'absolute', bottom: h + 10, left: '50%', transform: 'translateX(-50%)', padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--b1)', whiteSpace: 'nowrap', zIndex: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 800, color: T1 }}>R$ {fmt(s.revenue)}</span>
                </div>
              )}
              <motion.div initial={{ height: 0 }} animate={{ height: h }} transition={{ duration: 0.7, delay: i * 0.04, ease: [0.33, 1, 0.68, 1] }}
                style={{ width: '100%', borderRadius: '5px 5px 2px 2px', background: isLast ? `linear-gradient(180deg, #ff5b56, ${RED})` : isHov ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.13)', boxShadow: isLast ? '0 0 18px rgba(225,29,29,0.4)' : 'none' }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, padding: '0 2px' }}>
        {series.map((s, i) => <span key={s.month} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, fontFamily: 'var(--mono)', color: i === series.length - 1 ? 'var(--loss)' : T4, fontWeight: i === series.length - 1 ? 800 : 500 }}>{MESES[Number(s.month.slice(5, 7)) - 1]}</span>)}
      </div>
      {prev && prev.revenue > 0 && (
        <Hint>Mês atual (parcial) vs. anterior: <strong style={{ color: last.revenue >= prev.revenue ? MINT : LOSS }}>{last.revenue >= prev.revenue ? '+' : ''}{Math.round(((last.revenue - prev.revenue) / prev.revenue) * 100)}%</strong> · o anterior fechou em R$ {fmt(prev.revenue)}</Hint>
      )}
    </div>
  )
}

// ── funil ──
function Funnel({ f, active }) {
  const steps = [
    { l: 'Cadastraram', v: f.registered },
    { l: 'Criaram meta', v: f.withMeta },
    { l: 'Registraram remessa', v: f.withRemessa },
    { l: 'Assinaram (histórico)', v: f.withSub },
    { l: 'Pagantes hoje', v: active, hi: true },
  ]
  const max = Math.max(1, steps[0].v)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {steps.map((s, i) => {
        const pct = Math.round((s.v / max) * 100)
        const conv = i > 0 && steps[i - 1].v > 0 ? Math.round((s.v / steps[i - 1].v) * 100) : null
        return (
          <div key={s.l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: s.hi ? T1 : T2, fontWeight: s.hi ? 800 : 500 }}>{s.l}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 800, color: s.hi ? MINT : T1 }}>{fmt0(s.v)}{conv != null && <span style={{ color: T4, fontWeight: 600, marginLeft: 7 }}>{conv}%</span>}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--fill-2)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 1.5)}%` }} transition={{ duration: 0.8, delay: i * 0.08, ease: [0.33, 1, 0.68, 1] }}
                style={{ height: '100%', borderRadius: 4, background: s.hi ? `linear-gradient(90deg, ${MINT}, #7ff0ae)` : `linear-gradient(90deg, ${RED}, #ff5b56)`, opacity: s.hi ? 1 : 0.55 + (0.45 * (1 - i / steps.length)) }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function OwnerExecutive({ kpis, funnel, monthSeries, activity, salesMeta }) {
  const k = kpis || {}
  const renew = k.renewalRate ?? 0
  const teamPct = k.activeSubs > 0 ? Math.round((k.payingWithTeam / k.activeSubs) * 100) : 0
  const monthPace = (() => {
    const d = new Date(); const day = d.getDate(); const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    return day > 0 ? (Number(k.revenueMonth || 0) / day) * dim : 0
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>

      {/* NÍVEL 1: HERÓIS — MRR / ARR / mês */}
      <div className="ox-heroes" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          style={{ ...shell, padding: '26px 28px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(225,29,29,0.32)', boxShadow: `${shell.boxShadow}, 0 0 70px rgba(225,29,29,0.08)` }}>
          <div aria-hidden style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1.5, background: `linear-gradient(90deg, transparent, ${RED}, transparent)` }} />
          <div aria-hidden style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,29,0.16), transparent 68%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
          <Label>MRR · receita recorrente mensal</Label>
          <Money v={k.mrr} size={40} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <Delta pct={k.revenueVariation} />
            <span style={{ fontSize: 11.5, color: T3 }}>receita 7d vs. 7d anteriores</span>
          </div>
          <Hint>{fmt0(k.activeSubs)} pagantes · ticket mensal médio <strong style={{ color: T2 }}>R$ {fmt(k.mrrTicket)}</strong></Hint>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.07 }} style={{ ...shell, padding: '26px 28px' }}>
          <Label>ARR · anualizado</Label>
          <Money v={k.arr} size={30} />
          <Hint>MRR × 12. O tamanho do negócio no ritmo de hoje.</Hint>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.14 }} style={{ ...shell, padding: '26px 28px' }}>
          <Label>Total vendido</Label>
          <Money v={k.totalRevenue} size={30} />
          <Hint>{salesMeta?.total ? `${fmt0(salesMeta.total)} vendas · ` : ''}líquido R$ {fmt(k.netRevenue)}{k.totalRefunded > 0 ? ` (−R$ ${fmt(k.totalRefunded)} estornos)` : ''}</Hint>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.21 }} style={{ ...shell, padding: '26px 28px' }}>
          <Label>Receita do mês</Label>
          <Money v={k.revenueMonth} size={30} color={MINT} />
          <Hint>Projeção no ritmo atual: <strong style={{ color: T2 }}>R$ {fmt(monthPace)}</strong></Hint>
        </motion.div>
      </div>

      {/* NÍVEL 2: RITMO DE CAIXA + SAÚDE DA BASE */}
      <div className="ox-row2" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--b1)', background: 'var(--fill-2)' }}>
        {[
          { l: 'Hoje', v: <Money v={k.revenueToday} size={19} />, hint: 'receita do dia (BRT)' },
          { l: 'Ontem', v: <Money v={k.revenueYesterday} size={19} />, hint: 'dia anterior fechado' },
          { l: 'Últimos 7 dias', v: <Money v={k.rev7} size={19} />, hint: `30 dias R$ ${fmt(k.rev30)}` },
          { l: 'Renovação mensal', v: <Int v={renew} size={19} suffix="%" color={renew >= 60 ? MINT : renew >= 45 ? T1 : LOSS} />, hint: `${k.churnLost || 0} de ${k.churnDue || 0} não voltaram` },
          { l: 'Churn mensal', v: <Int v={k.churnRate} size={19} suffix="%" color={k.churnRate <= 40 ? MINT : k.churnRate <= 55 ? T1 : LOSS} />, hint: 'venceu nos últimos 30d e não renovou' },
          { l: 'LTV por cliente', v: <Money v={k.ltv} size={19} />, hint: 'ticket mensal ÷ churn' },
          { l: 'Pagantes com equipe', v: <Int v={teamPct} size={19} suffix="%" />, hint: `${k.payingWithTeam || 0} de ${k.activeSubs || 0} têm operador` },
        ].map((c, i) => (
          <div key={i} style={{ padding: '16px 18px', background: 'var(--surface)' }}>
            <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T3, margin: '0 0 8px' }}>{c.l}</p>
            <div>{c.v}</div>
            <p style={{ fontSize: 10.5, color: T4, margin: '6px 0 0' }}>{c.hint}</p>
          </div>
        ))}
      </div>

      {/* NÍVEL 3: TENDÊNCIA + FUNIL */}
      <div className="ox-row3" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} style={{ ...shell, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <Label>Receita · últimos 12 meses</Label>
            <span style={{ fontSize: 11, color: T4, fontFamily: 'var(--mono)' }}>histórico líquido R$ {fmt(k.netRevenue)}</span>
          </div>
          <MonthChart series={monthSeries || []} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.27 }} style={{ ...shell, padding: '22px 24px' }}>
          <Label>Funil · cadastro → pagante</Label>
          <Funnel f={funnel || {}} active={k.activeSubs} />
          <Hint>Novos: <strong style={{ color: T2 }}>{k.new7}</strong> em 7d · <strong style={{ color: T2 }}>{k.new30}</strong> em 30d · ativos hoje: <strong style={{ color: T2 }}>{activity?.activeToday ?? '—'}</strong></Hint>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 1250px) { .ox-heroes { grid-template-columns: 1fr 1fr !important; } .ox-row2 { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 760px) { .ox-heroes, .ox-row3 { grid-template-columns: 1fr !important; } .ox-row2 { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  )
}

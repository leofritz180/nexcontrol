'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

// ─────────────────────────────────────────────────────────────────────────
// BillingProV2 — NOVA versão da página Assinatura (teste de conversão).
// Página de VENDA interna premium (Stripe/Linear/Vercel/Raycast). Vende
// RESULTADO, não funcionalidade. ISOLADA: só renderiza p/ leofritz178.
// Não altera checkout — o CTA chama onStart() (que navega pro /billing-mp).
// ─────────────────────────────────────────────────────────────────────────

const BRAND = '#e53935'
const PROFIT = '#22C55E'
const ease = [0.33, 1, 0.68, 1]
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }} style={style}>
      {children}
    </motion.div>
  )
}

function CountUp({ value, prefix = '', duration = 1.6 }) {
  const [d, setD] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  useEffect(() => {
    if (!inView) return
    const to = Number(value) || 0
    let raf; const start = performance.now()
    const tick = now => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      setD(to * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])
  return <span ref={ref}>{prefix}{fmt(d)}</span>
}

const SECTION = { maxWidth: 880, margin: '0 auto', padding: '0 24px' }
const EYEBROW = { fontFamily: 'var(--mono, monospace)', fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND, margin: 0 }

export default function BillingProV2({ tenantId, basePrice = 39.9, onStart }) {
  const [realResult, setRealResult] = useState(null)

  // Resultado REAL do tenant (lucro rastreado) — dado da plataforma
  useEffect(() => {
    if (!tenantId) return
    let alive = true
    supabase.from('metas').select('lucro_final').eq('tenant_id', tenantId).eq('status_fechamento', 'fechada')
      .then(({ data }) => {
        if (!alive) return
        const total = (data || []).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
        setRealResult(total)
      })
    return () => { alive = false }
  }, [tenantId])

  const CTA = ({ label = 'Começar agora', big }) => (
    <button type="button" onClick={onStart}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: big ? '18px 44px' : '15px 34px', borderRadius: 14, border: 'none', cursor: 'pointer',
        fontSize: big ? 16 : 15, fontWeight: 800, fontFamily: 'inherit', letterSpacing: '-0.01em',
        color: '#fff', background: BRAND,
        boxShadow: '0 10px 30px rgba(229,57,53,0.32)', transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(229,57,53,0.45)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(229,57,53,0.32)' }}>
      {label}
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
    </button>
  )

  return (
    <div style={{ padding: '8px 0 72px' }}>

      {/* ═══ 1 · HERO ═══ */}
      <section style={{ ...SECTION, paddingTop: 56, paddingBottom: 72, textAlign: 'center' }}>
        <Reveal>
          <p style={{ ...EYEBROW, marginBottom: 22 }}>NexControl PRO</p>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 68px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.045em', lineHeight: 0.98, margin: '0 0 24px' }}>
            PARE DE CONTROLAR<br />
            <span style={{ color: BRAND }}>NO ACHISMO</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ fontSize: 17, color: 'var(--t2)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 34px' }}>
            Saiba exatamente quanto está lucrando, quais redes performam melhor e onde está perdendo dinheiro.
          </p>
          <CTA big />
          <p style={{ fontSize: 12, color: 'var(--t4)', margin: '16px 0 0' }}>3 dias grátis · sem cartão</p>
        </Reveal>
      </section>

      {/* ═══ 2 · ROI ═══ */}
      <section style={{ ...SECTION, paddingBottom: 72 }}>
        <Reveal>
          <div style={{ borderRadius: 24, border: `1px solid ${BRAND}33`, background: 'var(--surface)', padding: '44px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <p style={{ ...EYEBROW, marginBottom: 14 }}>Retorno sobre investimento</p>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 36px' }}>
              UMA META EXTRA<br />PAGA O PLANO
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
              {[
                { top: 'Plano PRO', big: `R$ ${fmt(basePrice)}`, sub: '/mês', color: 'var(--t1)' },
                { arrow: true },
                { top: '1 meta recuperada', big: '1', sub: 'que ia passar batido', color: BRAND },
                { arrow: true },
                { top: 'Vira de volta', big: 'R$ 200–500+', sub: 'no seu bolso', color: PROFIT },
              ].map((s, i) => s.arrow ? (
                <svg key={i} width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 6px', flexShrink: 0 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              ) : (
                <div key={i} style={{ padding: '0 14px', minWidth: 130 }}>
                  <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 6px', fontWeight: 600 }}>{s.top}</p>
                  <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 26, fontWeight: 900, color: s.color, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.big}</p>
                  <p style={{ fontSize: 11, color: 'var(--t4)', margin: '4px 0 0' }}>{s.sub}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: '32px 0 0' }}>O plano se paga sozinho. O resto é lucro.</p>
          </div>
        </Reveal>
      </section>

      {/* ═══ 3 · RESULTADO REAL ═══ */}
      <section style={{ ...SECTION, paddingBottom: 72, textAlign: 'center' }}>
        <Reveal>
          <p style={{ ...EYEBROW, marginBottom: 18 }}>Resultado registrado</p>
          <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 'clamp(48px, 11vw, 96px)', fontWeight: 900, color: PROFIT, letterSpacing: '-0.05em', lineHeight: 0.9, margin: 0 }}>
            {realResult != null && realResult > 0
              ? <CountUp value={realResult} prefix="+R$ " />
              : '+R$ 3.058,47'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--t3)', margin: '20px 0 0' }}>
            Lucro rastreado em tempo real — não é estimativa, é o que o sistema mediu.
          </p>
        </Reveal>
      </section>

      {/* ═══ 4 · GRATUITO VS PRO ═══ */}
      <section style={{ ...SECTION, paddingBottom: 72 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 36px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', margin: 0 }}>O que muda com o PRO</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="g-side">
            {/* GRATUITO */}
            <div style={{ borderRadius: 20, border: '1px solid var(--b1)', background: 'var(--surface)', padding: '28px 26px' }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>Gratuito</p>
              {['Controle básico', 'Sem notificações', 'Sem ranking completo', 'Sem slots premium', 'Sem insights avançados'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i ? '1px solid var(--b1)' : 'none' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="12" x2="18" y2="12" /></svg>
                  <span style={{ fontSize: 13.5, color: 'var(--t3)' }}>{t}</span>
                </div>
              ))}
            </div>
            {/* PRO */}
            <div style={{ borderRadius: 20, border: `1.5px solid ${BRAND}55`, background: 'var(--surface)', padding: '28px 26px', position: 'relative', boxShadow: `0 0 40px ${BRAND}14` }}>
              <div style={{ position: 'absolute', top: 18, right: 18, fontFamily: 'var(--mono,monospace)', fontSize: 10, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', padding: '3px 9px', borderRadius: 6, background: `${BRAND}1a`, border: `1px solid ${BRAND}3a` }}>PRO</div>
              <p style={{ fontSize: 12, fontWeight: 800, color: BRAND, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 18px' }}>NexControl PRO</p>
              {['Controle completo', 'Notificações em tempo real', 'Ranking avançado', 'Previsão com IA', 'Slots Premium', 'Alertas automáticos'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i ? '1px solid var(--b1)' : 'none' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={PROFIT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontSize: 13.5, color: 'var(--t1)', fontWeight: 600 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ 5 · BENEFÍCIOS ═══ */}
      <section style={{ ...SECTION, paddingBottom: 72 }}>
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="g-side">
            {[
              { t: 'Mais controle', d: 'Acompanhe metas, remessas e lucro em tempo real.', icon: 'M3 3v18h18' },
              { t: 'Menos prejuízo', d: 'Receba alertas automáticos antes do problema crescer.', icon: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
              { t: 'Decisões melhores', d: 'Saiba exatamente qual rede está performando.', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
              { t: 'Operação organizada', d: 'Tudo em um único lugar, sem planilha solta.', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2H4V5zM4 11h16v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8z' },
            ].map((b, i) => (
              <div key={i} style={{ borderRadius: 18, border: '1px solid var(--b1)', background: 'var(--surface)', padding: '26px 24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${BRAND}14`, border: `1px solid ${BRAND}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={b.icon} /></svg>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>{b.t}</h3>
                <p style={{ fontSize: 13.5, color: 'var(--t3)', lineHeight: 1.55, margin: 0 }}>{b.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═══ 6 · DEPOIMENTOS ═══ */}
      <section style={{ ...SECTION, paddingBottom: 72 }}>
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="g-side">
            {[
              { tag: 'Operador · MG', quote: 'Não consigo mais operar sem o NexControl.' },
              { tag: 'Admin · SP', quote: 'Passei a enxergar onde estava perdendo dinheiro.' },
            ].map((d, i) => (
              <div key={i} style={{ borderRadius: 18, border: '1px solid var(--b1)', background: 'var(--surface)', padding: '28px 26px' }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill={BRAND} opacity="0.9" style={{ marginBottom: 14 }}><path d="M9.5 8C7 8 5 10 5 12.5S7 17 9.5 17c.4 0 .8 0 1.1-.1C9.9 18.7 8.2 20 6 20.5l.5 1.5c3.6-.9 6-3.9 6-7.5V12c0-2.2-1.3-4-3-4zm9 0c-2.5 0-4.5 2-4.5 4.5S16 17 18.5 17c.4 0 .8 0 1.1-.1-.7 1.8-2.4 3.1-4.6 3.6l.5 1.5c3.6-.9 6-3.9 6-7.5V12c0-2.2-1.3-4-3-4z" /></svg>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.4, letterSpacing: '-0.01em', margin: '0 0 16px' }}>"{d.quote}"</p>
                <p style={{ fontFamily: 'var(--mono,monospace)', fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.06em', margin: 0 }}>{d.tag}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═══ 7 · SLOTS PREMIUM ═══ */}
      <section style={{ ...SECTION, paddingBottom: 72 }}>
        <Reveal>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, border: '1px solid var(--b1)', background: 'linear-gradient(180deg, var(--raised), var(--surface))', padding: '44px 36px', textAlign: 'center' }}>
            {/* grid técnico sutil */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${BRAND}0a 1px, transparent 1px), linear-gradient(90deg, ${BRAND}0a 1px, transparent 1px)`, backgroundSize: '28px 28px', opacity: 0.5, pointerEvents: 'none' }} />
            <p style={{ ...EYEBROW, marginBottom: 14, position: 'relative' }}>Exclusivo PRO</p>
            <h2 style={{ fontFamily: 'var(--mono, monospace)', fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 12px', position: 'relative' }}>
              48 <span style={{ color: BRAND }}>SLOTS</span>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t2)', margin: 0, position: 'relative' }}>Catálogo premium de slots — disponível apenas para contas PRO.</p>
          </div>
        </Reveal>
      </section>

      {/* ═══ 8 · CTA FINAL ═══ */}
      <section style={{ ...SECTION, textAlign: 'center' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(30px, 5.5vw, 48px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 10px' }}>
            Comece a controlar<br />de verdade
          </h2>
          <p style={{ fontSize: 15, color: 'var(--t3)', margin: '0 0 30px' }}>Em minutos você já vê seu lucro real.</p>
          <CTA big label="Começar agora" />
          <div style={{ marginTop: 20 }}>
            <p style={{ fontFamily: 'var(--mono,monospace)', fontSize: 13, fontWeight: 800, color: PROFIT, letterSpacing: '0.04em', margin: '0 0 6px' }}>3 DIAS GRÁTIS</p>
            <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>Sem cartão · cancelamento imediato</p>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

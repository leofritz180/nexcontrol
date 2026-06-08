'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { SLOTS } from '../lib/slots-data'

// ─────────────────────────────────────────────────────────────────────────
// BillingProV2 — PREVIEW premium da página Assinatura (teste de conversão).
// ISOLADO: só renderiza p/ leofritz178 (flag em app/billing/page.js).
// Vende RESULTADO. Não altera checkout — CTA chama onStart(operators), que
// navega pro /billing-mp. Paleta NexControl: preto/vermelho/branco, verde só
// p/ lucro. Refs: Stripe / Linear / Framer / Arc / Vercel.
// ─────────────────────────────────────────────────────────────────────────

const BRAND = '#e53935'
const PROFIT = '#22C55E'
const ease = [0.33, 1, 0.68, 1]
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = v => Number(v || 0).toLocaleString('pt-BR')

const SECTION = { maxWidth: 980, margin: '0 auto', padding: '0 24px' }
const EYEBROW = { fontFamily: 'var(--mono, monospace)', fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: BRAND, margin: 0 }
const CARD = { borderRadius: 20, border: '1px solid var(--b1)', background: 'var(--surface)' }

function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }} style={style}>{children}</motion.div>
  )
}

function CountUp({ value, prefix = '', decimals = 2, duration = 1.6 }) {
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
  return <span ref={ref}>{prefix}{decimals ? fmt(d) : fmtInt(Math.round(d))}</span>
}

// Partículas sutis do hero (posições fixas, float lento)
const PARTICLES = [
  { x: 8, y: 22, s: 3, d: 0, c: BRAND }, { x: 88, y: 16, s: 2, d: 1.2, c: '#fff' },
  { x: 18, y: 70, s: 2, d: 0.6, c: '#fff' }, { x: 76, y: 64, s: 4, d: 0.3, c: BRAND },
  { x: 50, y: 12, s: 2, d: 1.8, c: BRAND }, { x: 30, y: 40, s: 2, d: 0.9, c: '#fff' },
  { x: 66, y: 36, s: 3, d: 1.5, c: '#fff' }, { x: 94, y: 48, s: 2, d: 0.4, c: BRAND },
  { x: 6, y: 50, s: 2, d: 2.0, c: '#fff' }, { x: 42, y: 80, s: 3, d: 1.0, c: BRAND },
]

export default function BillingProV2({ tenantId, basePrice = 39.9, opPrice = 19.9, onStart = () => {} }) {
  const [stats, setStats] = useState(null) // { lucro, contas, metas, remessas }

  useEffect(() => {
    if (!tenantId) return
    let alive = true
    ;(async () => {
      const [{ data: metas }, { count: remCount }] = await Promise.all([
        supabase.from('metas').select('lucro_final, quantidade_contas, status_fechamento').eq('tenant_id', tenantId),
        supabase.from('remessas').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      ])
      if (!alive) return
      const fechadas = (metas || []).filter(m => m.status_fechamento === 'fechada')
      setStats({
        lucro: fechadas.reduce((a, m) => a + Number(m.lucro_final || 0), 0),
        contas: (metas || []).reduce((a, m) => a + Number(m.quantidade_contas || 0), 0),
        metas: fechadas.length,
        remessas: remCount || 0,
      })
    })()
    return () => { alive = false }
  }, [tenantId])

  const hasReal = stats && stats.lucro > 0
  const R = hasReal ? stats : { lucro: 720, contas: 50, metas: 1, remessas: 1 }

  const Btn = ({ label, onClick, variant = 'solid', big }) => (
    <button type="button" onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
        padding: big ? '17px 28px' : '13px 22px', borderRadius: 13, cursor: 'pointer',
        fontSize: big ? 15.5 : 14, fontWeight: 800, fontFamily: 'inherit', letterSpacing: '-0.01em',
        color: variant === 'solid' ? '#fff' : 'var(--t1)',
        background: variant === 'solid' ? BRAND : 'transparent',
        border: variant === 'solid' ? 'none' : '1px solid var(--b2)',
        boxShadow: variant === 'solid' ? '0 10px 28px rgba(229,57,53,0.32)' : 'none',
        transition: 'transform 0.18s, box-shadow 0.18s, background 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; if (variant === 'solid') e.currentTarget.style.boxShadow = '0 16px 38px rgba(229,57,53,0.46)'; else e.currentTarget.style.background = 'var(--raised)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (variant === 'solid') e.currentTarget.style.boxShadow = '0 10px 28px rgba(229,57,53,0.32)'; else e.currentTarget.style.background = 'transparent' }}>
      {label}
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
    </button>
  )

  return (
    <div style={{ padding: '4px 0 80px', overflow: 'hidden' }}>

      {/* ═══ 1 · HERO ═══ */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '64px 24px 76px' }}>
        {/* partículas */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', maxWidth: 760, margin: '0 auto' }}>
          {PARTICLES.map((p, i) => (
            <motion.span key={i}
              animate={{ y: [0, -14, 0], opacity: [0.18, 0.5, 0.18] }}
              transition={{ duration: 5 + p.d, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
              style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, borderRadius: '50%', background: p.c, boxShadow: `0 0 8px ${p.c}` }} />
          ))}
        </div>
        {/* glow vermelho sutil atrás */}
        <div style={{ position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)', width: 440, height: 240, borderRadius: '50%', background: `radial-gradient(ellipse, ${BRAND}1f, transparent 70%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <Reveal>
            <p style={{ ...EYEBROW, marginBottom: 22 }}>NexControl PRO</p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
              style={{ fontSize: 'clamp(40px, 8vw, 74px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.045em', lineHeight: 0.96, margin: '0 0 24px' }}>
              PARE DE CONTROLAR<br />
              <span style={{ color: BRAND, textShadow: `0 0 40px ${BRAND}55` }}>NO ACHISMO</span>
            </motion.h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p style={{ fontSize: 'clamp(15px, 2.4vw, 18px)', color: 'var(--t2)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 34px' }}>
              Saiba exatamente quanto está lucrando, quais redes performam melhor e onde está perdendo dinheiro.
            </p>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 240 }}><Btn label="Começar teste grátis" onClick={() => onStart(0)} big /></div>
              <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>3 dias grátis · sem cartão</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 2 · COMPARAÇÃO DOS PLANOS ═══ */}
      <section style={{ ...SECTION, paddingBottom: 80 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', margin: 0 }}>Escolha como vai operar</h2>
          <p style={{ fontSize: 14, color: 'var(--t3)', margin: '10px 0 0' }}>Pague só pelo que precisa. Sem fidelidade.</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'stretch' }}>
          {/* SOLO */}
          <Reveal style={{ display: 'flex' }}>
            <div style={{ ...CARD, padding: '30px 28px', display: 'flex', flexDirection: 'column', width: '100%' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>Admin Solo</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 4px' }}>
                <span style={{ fontFamily: 'var(--mono,monospace)', fontSize: 40, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1 }}>R$ {fmt(basePrice)}</span>
                <span style={{ fontSize: 14, color: 'var(--t4)', fontWeight: 600 }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: '6px 0 20px' }}>Ideal para quem opera sozinho.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                {['Controle de metas', 'Controle de remessas', 'Custos', 'Lucro real', 'Ranking', 'Redes'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={PROFIT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
                    <span style={{ fontSize: 13.5, color: 'var(--t2)' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}><Btn label="Começar Solo" onClick={() => onStart(0)} variant="outline" /></div>
            </div>
          </Reveal>

          {/* ADMIN + OPERADORES — DOMINANTE */}
          <Reveal delay={0.08} style={{ display: 'flex' }}>
            <div style={{
              position: 'relative', padding: '30px 28px', borderRadius: 20, width: '100%',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              background: `linear-gradient(180deg, ${BRAND}14, var(--surface) 60%)`,
              border: `1.5px solid ${BRAND}66`,
              boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 60px ${BRAND}1f`,
            }}>
              <div style={{ position: 'absolute', top: 0, left: '12%', right: '12%', height: 1, background: `linear-gradient(90deg, transparent, ${BRAND}, transparent)` }} />
              <div style={{ position: 'absolute', top: 16, right: 16, fontFamily: 'var(--mono,monospace)', fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '0.08em', padding: '5px 11px', borderRadius: 7, background: BRAND, boxShadow: `0 6px 18px ${BRAND}66` }}>MAIS ESCOLHIDO</div>
              <p style={{ fontSize: 11, fontWeight: 800, color: BRAND, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>Admin + Operadores</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '0 0 4px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--mono,monospace)', fontSize: 40, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1 }}>R$ {fmt(basePrice)}</span>
                <span style={{ fontSize: 14, color: 'var(--t3)', fontWeight: 600 }}>+ R$ {fmt(opPrice)}/op</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--t2)', margin: '6px 0 20px' }}>Pra escalar com a equipe inteira.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
                {[['Tudo do plano Solo', false], ['Operadores ilimitados', true], ['Ranking individual', false], ['Dashboard da equipe', false], ['Controle por operador', false], ['Escala da operação', true]].map(([t, strong], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={PROFIT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
                    <span style={{ fontSize: 13.5, color: strong ? 'var(--t1)' : 'var(--t2)', fontWeight: strong ? 700 : 400 }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}><Btn label="Montar Equipe" onClick={() => onStart(1)} variant="solid" /></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 3 · O QUE VOCÊ ESTÁ PERDENDO HOJE ═══ */}
      <section style={{ ...SECTION, paddingBottom: 80 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <p style={{ ...EYEBROW, marginBottom: 12 }}>Sem o NexControl</p>
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', margin: 0 }}>O que você está perdendo hoje</h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { t: 'Prejuízo escondido', d: 'Você perde dinheiro e nem percebe.', icon: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
            { t: 'Planilhas espalhadas', d: 'Informação solta em vários lugares.', icon: 'M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8' },
            { t: 'Tempo desperdiçado', d: 'Horas analisando o que o sistema faz em segundos.', icon: 'M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z' },
          ].map((c, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div style={{ ...CARD, padding: '28px 24px', height: '100%', borderColor: `${BRAND}26` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${BRAND}16`, border: `1px solid ${BRAND}3a`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', margin: '0 0 8px' }}>{c.t}</h3>
                <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.55, margin: 0 }}>{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ 4 · ROI ═══ */}
      <section style={{ ...SECTION, paddingBottom: 80 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', margin: 0 }}>O plano se paga sozinho</h2>
        </Reveal>
        {[
          { plano: 'Plano Solo', preco: `R$ ${fmt(basePrice)}`, retorno: 'R$ 200 a 500+' },
          { plano: 'Plano Equipe', preco: `R$ ${fmt(basePrice + opPrice)}+`, retorno: 'R$ 500 a 1.000+' },
        ].map((row, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div style={{ ...CARD, padding: '22px 26px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 120 }}>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 4px', fontWeight: 600 }}>{row.plano}</p>
                <p style={{ fontFamily: 'var(--mono,monospace)', fontSize: 24, fontWeight: 900, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{row.preco}</p>
              </div>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              <div style={{ minWidth: 90, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 4px', fontWeight: 600 }}>1 meta recuperada</p>
                <span style={{ fontFamily: 'var(--mono,monospace)', fontSize: 18, fontWeight: 800, color: BRAND }}>1 META</span>
              </div>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              <div style={{ minWidth: 130, textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--t3)', margin: '0 0 4px', fontWeight: 600 }}>De volta pra você</p>
                <p style={{ fontFamily: 'var(--mono,monospace)', fontSize: 24, fontWeight: 900, color: PROFIT, margin: 0, letterSpacing: '-0.02em' }}>{row.retorno}</p>
              </div>
            </div>
          </Reveal>
        ))}
        <Reveal><p style={{ fontSize: 14, color: 'var(--t3)', textAlign: 'center', margin: '18px 0 0' }}>O sistema costuma se pagar na <strong style={{ color: 'var(--t1)' }}>primeira meta recuperada</strong>.</p></Reveal>
      </section>

      {/* ═══ 5 · RESULTADO REAL ═══ */}
      <section style={{ ...SECTION, paddingBottom: 80 }}>
        <Reveal>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, border: `1px solid ${PROFIT}33`, background: 'linear-gradient(180deg, var(--raised), var(--surface))', padding: 'clamp(34px, 6vw, 56px) clamp(24px, 5vw, 48px)', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 480, height: 300, borderRadius: '50%', background: `radial-gradient(ellipse, ${PROFIT}1c, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
            <p style={{ ...EYEBROW, color: PROFIT, marginBottom: 16, position: 'relative' }}>Resultado real · rastreado</p>
            <p style={{ fontFamily: 'var(--mono,monospace)', fontSize: 'clamp(52px, 13vw, 110px)', fontWeight: 900, color: PROFIT, letterSpacing: '-0.05em', lineHeight: 0.88, margin: 0, position: 'relative', textShadow: `0 0 60px ${PROFIT}40` }}>
              <CountUp value={R.lucro} prefix="+R$ " />
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '18px 0 28px', position: 'relative' }}>Lucro registrado — medido pelo sistema, não é estimativa.</p>
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 1, background: 'var(--b1)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--b1)', maxWidth: 560, margin: '0 auto' }}>
              {[
                { v: fmtInt(R.contas), l: 'contas' },
                { v: fmtInt(R.metas), l: `meta${R.metas !== 1 ? 's' : ''}` },
                { v: fmtInt(R.remessas), l: `remessa${R.remessas !== 1 ? 's' : ''}` },
                { v: '100%', l: 'rastreado' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface)', padding: '16px 8px' }}>
                  <p style={{ fontFamily: 'var(--mono,monospace)', fontSize: 22, fontWeight: 900, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{s.v}</p>
                  <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ 6 · DIFERENCIAIS DO PRO ═══ */}
      <section style={{ ...SECTION, paddingBottom: 80 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 30 }}>
          <p style={{ ...EYEBROW, marginBottom: 12 }}>Só no PRO</p>
          <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', margin: 0 }}>Recursos que viram lucro</h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { t: 'Notificações em tempo real', d: 'Receba cada remessa instantaneamente.', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
            { t: 'Comando de voz', d: 'Controle o sistema falando.', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4' },
            { t: 'Ranking de redes', d: 'Descubra quais redes realmente performam.', icon: 'M3 3v18h18M7 14l4-4 4 4 5-6' },
            { t: 'Ranking de operadores', d: 'Saiba quem está gerando resultado.', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87' },
            { t: 'OCR de prints', d: 'Leitura automática de depósitos e saques.', icon: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18' },
            { t: 'Slots Premium', d: 'Conteúdo exclusivo pra assinantes.', icon: 'M15 5v2M15 11v2M15 17v2M5 5a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 1 1 0-4V7a2 2 0 0 0-2-2H5z' },
            { t: 'Insights automáticos', d: 'Alertas inteligentes do sistema.', icon: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z' },
            { t: 'Gestão completa', d: 'Tudo centralizado em um lugar.', icon: 'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2H4V5zM4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8z' },
          ].map((f, i) => (
            <Reveal key={i} delay={(i % 4) * 0.05}>
              <div style={{ ...CARD, padding: '22px 20px', height: '100%' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${BRAND}14`, border: `1px solid ${BRAND}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em', margin: '0 0 6px' }}>{f.t}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.5, margin: 0 }}>{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ 6.5 · 48 SLOTS PREMIUM (cadeado) ═══ */}
      <section style={{ ...SECTION, paddingBottom: 80 }}>
        <Reveal>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, border: '1px solid var(--b1)', background: 'linear-gradient(180deg, var(--raised), var(--surface))', padding: 'clamp(34px, 5vw, 44px) clamp(20px, 4vw, 40px)' }}>
            <div style={{ position: 'absolute', top: -70, right: -40, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${BRAND}1c, transparent 70%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />
            <div style={{ textAlign: 'center', marginBottom: 26, position: 'relative' }}>
              <p style={{ ...EYEBROW, marginBottom: 12 }}>Exclusivo PRO</p>
              <h2 style={{ fontFamily: 'var(--mono, monospace)', fontSize: 'clamp(34px, 7vw, 60px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 10px' }}>
                48 <span style={{ color: BRAND }}>SLOTS</span> PREMIUM
              </h2>
              <p style={{ fontSize: 14, color: 'var(--t2)', margin: 0 }}>Catálogo completo de slots — liberado na assinatura.</p>
            </div>

            {/* parede de slots travados */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8, position: 'relative' }}>
              {SLOTS.slice(0, 48).map(s => (
                <div key={s.id} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--b1)', background: 'var(--raised)' }}>
                  <img src={s.image} alt="" loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(5px) brightness(0.45) saturate(0.6)' }}
                    onError={e => { e.currentTarget.style.display = 'none' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.62))' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 5px ${BRAND}88)` }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)', margin: '24px 0 0', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7, width: '100%', justifyContent: 'center' }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              48 slots bloqueados — <strong style={{ color: 'var(--t1)' }}>desbloqueie com o PRO</strong>
            </p>
          </div>
        </Reveal>
      </section>

      {/* ═══ 7 · NOTIFICAÇÕES (mockup celular) ═══ */}
      <section style={{ ...SECTION, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 36, alignItems: 'center' }}>
          <Reveal>
            <p style={{ ...EYEBROW, marginBottom: 16 }}>Em tempo real</p>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 16px' }}>
              Cada resultado<br />no seu bolso, na hora.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>
              Meta finalizada, remessa registrada, operador concluindo, rede batendo objetivo. Você fica sabendo no segundo em que acontece — sem abrir o painel.
            </p>
          </Reveal>

          <Reveal delay={0.1} style={{ display: 'flex', justifyContent: 'center' }}>
            {/* celular */}
            <div style={{ position: 'relative', width: 290, maxWidth: '100%', borderRadius: 40, padding: 12, background: 'linear-gradient(180deg, #161616, #050505)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 70px rgba(229,57,53,0.08)' }}>
              <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', width: 90, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
              <div style={{ borderRadius: 30, background: 'linear-gradient(180deg, #0b0b0f, #060608)', padding: '48px 14px 22px', minHeight: 470 }}>
                <p style={{ textAlign: 'center', fontFamily: 'var(--mono,monospace)', fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 18px', letterSpacing: '0.1em' }}>9:41 · NexControl</p>
                {[
                  { t: 'Meta finalizada', v: '+R$ 1.250', green: true },
                  { t: 'Remessa registrada', v: '+R$ 720', green: true },
                  { t: 'Operador finalizou meta', v: 'João · W1', green: false },
                  { t: 'Rede atingiu objetivo', v: 'OKOK · 100%', green: false },
                ].map((n, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.15, ease }}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 16, marginBottom: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src="/icons/nexcontrol-icon-clean.png" alt="" width={22} height={22} style={{ objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.t}</p>
                      <p style={{ fontFamily: 'var(--mono,monospace)', fontSize: 13, fontWeight: 800, color: n.green ? PROFIT : 'rgba(255,255,255,0.65)', margin: '2px 0 0' }}>{n.v}</p>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>agora</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ 8 · CTA FINAL ═══ */}
      <section style={{ ...SECTION }}>
        <Reveal>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 26, border: `1px solid ${BRAND}3a`, background: 'linear-gradient(180deg, #120606, var(--surface))', padding: 'clamp(40px, 7vw, 64px) clamp(24px, 5vw, 48px)', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: -90, left: '50%', transform: 'translateX(-50%)', width: 520, height: 320, borderRadius: '50%', background: `radial-gradient(ellipse, ${BRAND}26, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
            <h2 style={{ position: 'relative', fontSize: 'clamp(30px, 5.5vw, 52px)', fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.035em', lineHeight: 1.04, margin: '0 0 14px' }}>
              Comece a controlar<br />de verdade
            </h2>
            <p style={{ position: 'relative', fontSize: 'clamp(14px, 2.4vw, 17px)', color: 'var(--t2)', margin: '0 0 30px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
              Pare de depender de planilhas e decisões no escuro.
            </p>
            <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 260 }}>
              <Btn label="Começar teste gratuito" onClick={() => onStart(0)} big />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['3 dias grátis', 'Sem cartão', 'Cancelamento imediato'].map((t, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--t3)', fontWeight: 600 }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={PROFIT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

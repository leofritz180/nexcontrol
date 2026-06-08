'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import { PLANS, getPlan } from '../../lib/plans'
import { calculatePrice as calcOpTier } from '../../lib/pricing'

const ease = [0.33, 1, 0.68, 1]
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// Combina desconto de tier (operator-count) com desconto de periodo.
// monthlyTier ja vem com desconto de tier aplicado.
function combinedPrice(monthlyTier, planId) {
  const plan = getPlan(planId)
  const gross = monthlyTier * plan.months
  const total = Number((gross * (1 - plan.discount)).toFixed(2))
  const perMonth = Number((total / plan.months).toFixed(2))
  const savings = Number((gross - total).toFixed(2))
  return { total, perMonth, gross, savings, plan }
}

export default function BillingMpPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const opQty = Math.max(0, Number(sp.get('operators')) || 0)
  const isRenewal = sp.get('renewal') === '1' || sp.get('early') === '1'

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [subscription, setSubscription] = useState(null) // sub ativa atual (se houver)
  const [stage, setStage] = useState('period') // period | loading | pix | approved | error
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('annual')
  const pollRef = useRef(null)

  // Preco mensal base ja com desconto de tier por quantidade de operadores
  const monthlyTier = useMemo(() => calcOpTier(opQty).total, [opQty])

  // Dias restantes da sub atual (se houver)
  const daysRemaining = useMemo(() => {
    if (!subscription?.expires_at) return 0
    const diff = new Date(subscription.expires_at) - new Date()
    return Math.max(0, Math.ceil(diff / 86400000))
  }, [subscription])

  const isEarlyRenewal = daysRemaining > 0 && isRenewal

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      // Teste de conversao (leofritz178): abre no MENSAL, nao no anual.
      if ((u.email || '').toLowerCase() === 'leofritz178@gmail.com') setSelectedPlan('monthly')
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p || p.role !== 'admin') { router.push('/operator'); return }
      setProfile(p)
      // Busca sub ativa atual pra mostrar dias restantes + calcular renovacao antecipada
      const { data: sub } = await supabase.from('subscriptions')
        .select('expires_at,operator_count,status')
        .eq('tenant_id', p.tenant_id)
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .limit(1).maybeSingle()
      setSubscription(sub)
    })
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const selectedCalc = useMemo(() => combinedPrice(monthlyTier, selectedPlan), [monthlyTier, selectedPlan])
  const isV2 = (user?.email || '').toLowerCase() === 'leofritz178@gmail.com'

  async function handleStart() {
    if (!user || !profile) return
    setStage('loading'); setError('')
    try {
      const planLabel = opQty > 0 ? `Admin + ${opQty} op${opQty > 1 ? 's' : ''}` : 'Admin Solo'
      const res = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: profile.nome || user.email.split('@')[0],
          tenant_id: profile.tenant_id,
          user_id: user.id,
          amount: selectedCalc.total,
          operator_count: opQty,
          plan_period: selectedPlan,
          description: `NexControl PRO - ${planLabel} - ${selectedCalc.plan.label}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Falha ao gerar cobranca')
        setStage('error')
        return
      }
      setPayment(data)
      setStage('pix')
      startPolling(data.id)
    } catch (e) {
      setError(e?.message || 'Erro de conexao')
      setStage('error')
    }
  }

  function startPolling(paymentId) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch('/api/mercadopago/check-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId }),
        })
        const d = await r.json()
        if (d?.status === 'approved' || d?.status === 'RECEIVED' || d?.status === 'CONFIRMED') {
          clearInterval(pollRef.current)
          setStage('approved')
          setTimeout(() => router.push('/admin'), 2400)
        }
      } catch {}
    }, 3000)
  }

  async function copyPix() {
    if (!payment?.qr_code) return
    try {
      await navigator.clipboard.writeText(payment.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div style={{ position: 'fixed', top: '-18%', left: '-12%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.14) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: '-18%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(209,250,229,0.1) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 620, position: 'relative', zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {stage === 'period' && (
            <motion.div key="period" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
              <PeriodCard
                v2={isV2}
                opQty={opQty}
                monthlyTier={monthlyTier}
                selectedPlan={selectedPlan}
                setSelectedPlan={setSelectedPlan}
                selectedCalc={selectedCalc}
                onConfirm={handleStart}
                onBack={() => router.push(isRenewal ? '/admin' : '/billing')}
                isRenewal={isRenewal}
                isEarlyRenewal={isEarlyRenewal}
                daysRemaining={daysRemaining}
                currentExpires={subscription?.expires_at}
              />
            </motion.div>
          )}

          {stage === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingCard />
            </motion.div>
          )}

          {stage === 'pix' && payment && (
            <motion.div key="pix" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
              <PixCard payment={payment} copied={copied} onCopy={copyPix} amount={selectedCalc.total} planLabel={selectedCalc.plan.label} />
            </motion.div>
          )}

          {stage === 'approved' && (
            <motion.div key="approved" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }}>
              <ApprovedCard />
            </motion.div>
          )}

          {stage === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }}>
              <ErrorCard error={error} onRetry={() => setStage('period')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

/* ── Cards ── */

function PeriodCard({ v2, opQty, monthlyTier, selectedPlan, setSelectedPlan, selectedCalc, onConfirm, onBack, isRenewal, isEarlyRenewal, daysRemaining, currentExpires }) {
  const planLabel = opQty > 0 ? `Admin + ${opQty} operador${opQty > 1 ? 'es' : ''}` : 'Admin Solo'

  // Dias adicionados (aproximado): planMonths * 30. Pra exibicao do painel.
  const addedDays = selectedCalc.plan.months * 30
  const totalDaysAfter = daysRemaining + addedDays

  // Data final estimada apos a renovacao
  const newExpiresDate = useMemo(() => {
    const base = (currentExpires && new Date(currentExpires) > new Date())
      ? new Date(currentExpires)
      : new Date()
    base.setMonth(base.getMonth() + selectedCalc.plan.months)
    return base
  }, [currentExpires, selectedCalc.plan.months])

  return (
    <div style={v2 ? cardStyleV2 : cardStyle}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--t3)', fontSize: 12, fontWeight: 600, padding: 0,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>

        {isRenewal && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 99,
            background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.25)',
            fontSize: 10, fontWeight: 800, color: '#e53935', letterSpacing: '0.08em',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#e53935' }}/>
            {isEarlyRenewal ? 'RENOVAÇÃO ANTECIPADA' : 'RENOVAÇÃO DE PLANO'}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round">
            {isRenewal
              ? <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              : <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>}
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9', margin: '0 0 4px', letterSpacing: '-0.025em' }}>
          {isRenewal ? 'Renove seu plano' : 'Escolha o periodo'}
        </h1>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0 }}>
          {planLabel} · <strong style={{ color: '#CBD5E1' }}>R$ {fmt(monthlyTier)}/mês</strong>
        </p>
      </div>

      {/* Painel de Upgrade — so aparece em renovacao antecipada */}
      {isEarlyRenewal && (
        <UpgradePanel
          daysRemaining={daysRemaining}
          addedDays={addedDays}
          totalDaysAfter={totalDaysAfter}
          newExpiresDate={newExpiresDate}
          planLabel={selectedCalc.plan.label}
        />
      )}

      {/* Seletor de periodo — v2: lista vertical premium · padrao: grid 2x2 */}
      {v2 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
          {PLANS.map(plan => (
            <PlanRowV2
              key={plan.id}
              plan={plan}
              calc={combinedPrice(monthlyTier, plan.id)}
              isSelected={plan.id === selectedPlan}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
          {PLANS.map(plan => {
            const isSelected = plan.id === selectedPlan
            const calc = combinedPrice(monthlyTier, plan.id)
            return (
              <PlanCard key={plan.id} plan={plan} calc={calc} isSelected={isSelected} onSelect={() => setSelectedPlan(plan.id)} />
            )
          })}
        </div>
      )}

      {/* Summary final */}
      <div style={{
        padding: '14px 18px',
        borderRadius: 12,
        background: 'rgba(209,250,229,0.04)',
        border: '1px solid rgba(209,250,229,0.12)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Periodo</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>
            {selectedCalc.plan.label} ({selectedCalc.plan.months} {selectedCalc.plan.months === 1 ? 'mês' : 'meses'})
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9' }}>Total a pagar</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 900, color: 'var(--profit)', letterSpacing: '-0.02em' }}>
            R$ {fmt(selectedCalc.total)}
          </span>
        </div>
        {isEarlyRenewal && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 11, color: 'var(--t3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Após a compra
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--profit)' }}>
              ~{totalDaysAfter} dias de acesso
            </span>
          </div>
        )}
      </div>

      <motion.button
        onClick={onConfirm}
        whileHover={{ scale: 1.015, boxShadow: '0 8px 40px rgba(229,57,53,0.5)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%', padding: '16px 24px', borderRadius: 13, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(145deg, #e53935, #c62828)',
          color: 'white', fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 24px rgba(229,57,53,0.35)',
        }}
      >
        <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        {isRenewal ? 'Renovar' : 'Gerar PIX'} · R$ {fmt(selectedCalc.total)}
      </motion.button>

      <p style={{ fontSize: 10.5, color: '#64748B', textAlign: 'center', margin: '12px 0 0' }}>
        PIX via Mercado Pago · aprovação em segundos
      </p>
    </div>
  )
}

function UpgradePanel({ daysRemaining, addedDays, totalDaysAfter, newExpiresDate, planLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease }}
      style={{
        position: 'relative',
        padding: '16px 18px',
        borderRadius: 14,
        marginBottom: 18,
        background: 'linear-gradient(145deg, rgba(229,57,53,0.08), rgba(229,57,53,0.02))',
        border: '1px solid rgba(229,57,53,0.22)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(229,57,53,0.5), transparent)' }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(229,57,53,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5" strokeLinecap="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </div>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#e53935', margin: 0, letterSpacing: '0.02em' }}>
          Dias acumulados
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: 6 }}>
        {/* Dias atuais */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 9.5, color: 'var(--t3)', margin: '0 0 3px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Atuais</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 900, color: '#F1F5F9', margin: 0, letterSpacing: '-0.02em' }}>{daysRemaining}</p>
          <p style={{ fontSize: 9, color: '#64748B', margin: '2px 0 0' }}>dias</p>
        </div>

        <span style={{ fontSize: 16, color: '#475569', fontWeight: 300 }}>+</span>

        {/* Dias adicionados */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 9.5, color: 'var(--t3)', margin: '0 0 3px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{planLabel}</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 900, color: '#F1F5F9', margin: 0, letterSpacing: '-0.02em' }}>+{addedDays}</p>
          <p style={{ fontSize: 9, color: '#64748B', margin: '2px 0 0' }}>dias</p>
        </div>

        <span style={{ fontSize: 16, color: '#475569', fontWeight: 300 }}>=</span>

        {/* Total */}
        <div style={{ textAlign: 'center', padding: '4px 0', borderRadius: 8, background: 'rgba(209,250,229,0.06)' }}>
          <p style={{ fontSize: 9.5, color: 'var(--profit)', margin: '0 0 3px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 800 }}>Total</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 900, color: 'var(--profit)', margin: 0, letterSpacing: '-0.02em' }}>{totalDaysAfter}</p>
          <p style={{ fontSize: 9, color: '#64748B', margin: '2px 0 0' }}>dias</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(229,57,53,0.12)' }}>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <p style={{ fontSize: 10, color: 'var(--t3)', margin: 0 }}>
          Novo vencimento: <strong style={{ color: '#CBD5E1' }}>{fmtDate(newExpiresDate)}</strong>
        </p>
      </div>
    </motion.div>
  )
}

function PlanCard({ plan, calc, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        position: 'relative',
        padding: '16px 14px 14px',
        borderRadius: 14,
        border: '1.5px solid ' + (isSelected ? '#e53935' : 'rgba(255,255,255,0.08)'),
        background: isSelected
          ? 'linear-gradient(145deg, rgba(229,57,53,0.10), rgba(229,57,53,0.02))'
          : 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s',
        fontFamily: 'inherit',
        display: 'flex', flexDirection: 'column', gap: 4,
        boxShadow: isSelected ? '0 8px 28px rgba(229,57,53,0.15)' : 'none',
        minHeight: 130,
      }}
    >
      {plan.badge && (
        <span style={{
          position: 'absolute', top: -9, right: 12,
          fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 5,
          background: plan.highlighted ? '#e53935' : 'rgba(209,250,229,0.15)',
          color: plan.highlighted ? '#fff' : 'var(--profit)',
          border: plan.highlighted ? 'none' : '1px solid rgba(209,250,229,0.3)',
          letterSpacing: '0.06em',
          boxShadow: plan.highlighted ? '0 4px 12px rgba(229,57,53,0.4)' : 'none',
        }}>{plan.badge}</span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          border: '1.5px solid ' + (isSelected ? '#e53935' : 'rgba(255,255,255,0.18)'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e53935' }} />}
        </div>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', margin: 0, letterSpacing: '-0.01em' }}>
          {plan.label}
        </p>
      </div>

      <p style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 900, color: isSelected ? '#fff' : '#E2E8F0', margin: '4px 0 2px', letterSpacing: '-0.025em' }}>
        R$ {fmt(calc.total)}
      </p>

      <p style={{ fontSize: 10.5, color: '#64748B', margin: 0 }}>
        R$ {fmt(calc.perMonth)}/mês
      </p>

      {calc.savings > 0 ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 9.5, color: 'var(--profit)', fontWeight: 700 }}>
          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          economia R$ {fmt(calc.savings)}
        </div>
      ) : (
        <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 4 }}>
          {plan.months} {plan.months === 1 ? 'mês' : 'meses'}
        </div>
      )}
    </button>
  )
}

// Linha de periodo premium (v2) — limpa, combina com o sistema
function PlanRowV2({ plan, calc, isSelected, onSelect }) {
  const isPop = plan.highlighted
  return (
    <button type="button" onClick={onSelect} style={{
      position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '15px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      border: '1.5px solid ' + (isSelected ? '#e53935' : 'var(--b1)'),
      background: isSelected ? 'linear-gradient(90deg, rgba(229,57,53,0.10), rgba(229,57,53,0.02))' : 'var(--surface)',
      boxShadow: isSelected ? '0 0 26px rgba(229,57,53,0.14)' : 'none',
      transition: 'all 0.18s',
    }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: '1.5px solid ' + (isSelected ? '#e53935' : 'var(--b2)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isSelected && <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#e53935' }} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{plan.label}</span>
          {plan.badge && <span style={{ fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5, letterSpacing: '0.05em', background: isPop ? '#e53935' : 'rgba(34,197,94,0.14)', color: isPop ? '#fff' : '#22C55E', border: isPop ? 'none' : '1px solid rgba(34,197,94,0.3)' }}>{plan.badge}</span>}
        </div>
        <p style={{ fontSize: 11, color: 'var(--t3)', margin: '3px 0 0' }}>
          R$ {fmt(calc.perMonth)}/mês{calc.savings > 0 ? ` · economia R$ ${fmt(calc.savings)}` : ''}
        </p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 900, color: isSelected ? '#fff' : 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>R$ {fmt(calc.total)}</p>
        <p style={{ fontSize: 10, color: 'var(--t4)', margin: '2px 0 0' }}>{plan.months === 1 ? 'à vista' : `${plan.months} meses`}</p>
      </div>
    </button>
  )
}

function LoadingCard() {
  return (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <motion.div
        style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(229,57,53,0.2)', borderTopColor: '#e53935', margin: '0 auto 18px' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <p style={{ fontSize: 14, color: '#E2E8F0', margin: 0, fontWeight: 600 }}>Gerando cobranca PIX...</p>
      <p style={{ fontSize: 12, color: '#64748B', margin: '6px 0 0' }}>Aguarde alguns segundos</p>
    </div>
  )
}

function PixCard({ payment, copied, onCopy, amount, planLabel }) {
  return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 14 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,0.5)', '0 0 0 6px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0)'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.78)' }}
          />
          <span style={{ fontSize: 10, color: '#FCD34D', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>Aguardando pagamento</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: '0 0 4px' }}>Escaneie o QR Code</h2>
        <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
          {planLabel} · <strong style={{ color: 'var(--profit)' }}>R$ {fmt(amount)}</strong>
        </p>
      </div>

      {payment.qr_code_base64 ? (
        <div style={{ background: '#fff', padding: 14, borderRadius: 14, margin: '0 auto 18px', width: 'fit-content' }}>
          <img
            src={`data:image/png;base64,${payment.qr_code_base64}`}
            alt="QR Code PIX"
            width={220}
            height={220}
            style={{ display: 'block' }}
          />
        </div>
      ) : null}

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Codigo PIX copia e cola
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{
            padding: '12px 44px 12px 14px', borderRadius: 10,
            background: 'rgba(4,8,16,0.7)', border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--t3)',
            wordBreak: 'break-all', maxHeight: 70, overflowY: 'auto',
          }}>
            {payment.qr_code}
          </div>
          <motion.button
            onClick={onCopy}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              position: 'absolute', right: 8, top: 8,
              width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: copied ? 'rgba(209,250,229,0.15)' : 'rgba(229,57,53,0.15)',
              color: copied ? 'var(--profit)' : '#e53935',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {copied ? (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </motion.button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <motion.div
          style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'rgba(255,255,255,0.78)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <span style={{ fontSize: 11, color: '#93C5FD', fontWeight: 600, letterSpacing: '0.04em' }}>
          Detectando pagamento automaticamente...
        </span>
      </div>
    </div>
  )
}

function ApprovedCard() {
  return (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.45, ease: [0.33, 1.4, 0.68, 1] }}
        style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(209,250,229,0.15)', border: '2px solid rgba(209,250,229,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </motion.div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: '0 0 8px' }}>Pagamento aprovado!</h2>
      <p style={{ fontSize: 13, color: 'var(--t3)', margin: '0 0 16px' }}>Seu plano PRO foi ativado. Redirecionando...</p>
      <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.4, ease: 'linear' }}
          style={{ height: '100%', background: 'var(--profit)' }}
        />
      </div>
    </div>
  )
}

function ErrorCard({ error, onRetry }) {
  return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', margin: '0 0 6px' }}>Nao foi possivel gerar a cobranca</h2>
        <p style={{ fontSize: 12, color: '#FCA5A5', margin: 0 }}>{error}</p>
      </div>
      <button
        onClick={onRetry}
        style={{
          width: '100%', padding: '12px 20px', borderRadius: 12,
          background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.3)',
          color: '#e53935', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}

const cardStyle = {
  padding: 32, borderRadius: 22,
  background: 'rgba(15, 24, 41, 0.78)',
  backdropFilter: 'blur(30px) saturate(160%)',
  WebkitBackdropFilter: 'blur(30px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 40px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
}

// v2 (teste 178) — card limpo, alinhado ao tema (sem o glass azulado)
const cardStyleV2 = {
  padding: 32, borderRadius: 22,
  background: 'var(--surface)',
  border: '1px solid var(--b1)',
  boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
}

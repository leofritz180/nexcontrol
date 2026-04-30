'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'

const PRICE = 39.9
const ease = [0.33, 1, 0.68, 1]

export default function BillingMpPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stage, setStage] = useState('intro') // intro | loading | pix | approved | error
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      setProfile(p)
    })
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function handleStart() {
    if (!user || !profile) return
    setStage('loading'); setError('')
    try {
      const res = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: profile.nome || user.email.split('@')[0],
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
        if (d?.status === 'approved') {
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
      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '-18%', left: '-12%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.14) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
      <div style={{ position: 'fixed', bottom: '-18%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%)', filter: 'blur(60px)', pointerEvents: 'none' }}/>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 2 }}>
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
              <IntroCard onStart={handleStart} />
            </motion.div>
          )}

          {stage === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingCard />
            </motion.div>
          )}

          {stage === 'pix' && payment && (
            <motion.div key="pix" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
              <PixCard payment={payment} copied={copied} onCopy={copyPix} />
            </motion.div>
          )}

          {stage === 'approved' && (
            <motion.div key="approved" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }}>
              <ApprovedCard />
            </motion.div>
          )}

          {stage === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }}>
              <ErrorCard error={error} onRetry={() => setStage('intro')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

/* ── Cards ── */

function IntroCard({ onStart }) {
  return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9', margin: '0 0 6px', letterSpacing: '-0.02em' }}>NexControl PRO</h1>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Acesso completo por 30 dias</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {[
          'Operadores ilimitados',
          'Ranking estrategico de redes',
          'Slots Premium e Proxy',
          'Previsoes inteligentes',
          'Suporte prioritario',
        ].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.08)' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 13, color: '#E2E8F0' }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Preco unico</p>
        <p style={{ fontSize: 34, fontWeight: 900, color: '#F1F5F9', margin: 0, fontFamily: 'var(--mono)', letterSpacing: '-0.03em' }}>
          R$ {PRICE.toFixed(2).replace('.', ',')}
        </p>
        <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0' }}>PIX · aprovacao imediata</p>
      </div>

      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.02, boxShadow: '0 8px 40px rgba(229,57,53,0.5)' }}
        whileTap={{ scale: 0.97 }}
        style={{
          width: '100%', padding: '15px 24px', borderRadius: 13, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(145deg, #e53935, #c62828)',
          color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 24px rgba(229,57,53,0.35)',
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        Assinar PRO
      </motion.button>
    </div>
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

function PixCard({ payment, copied, onCopy }) {
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
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Ou copie o codigo e cole no app do banco</p>
      </div>

      {/* QR */}
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

      {/* Copia e cola */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Codigo PIX copia e cola
        </label>
        <div style={{ position: 'relative' }}>
          <div style={{
            padding: '12px 44px 12px 14px', borderRadius: 10,
            background: 'rgba(4,8,16,0.7)', border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11, fontFamily: 'var(--mono)', color: '#94A3B8',
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
              background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(229,57,53,0.15)',
              color: copied ? '#10B981' : '#e53935',
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

      {/* Polling indicator */}
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
        style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </motion.div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: '0 0 8px' }}>Pagamento aprovado!</h2>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 16px' }}>Seu plano PRO foi ativado. Redirecionando...</p>
      <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.4, ease: 'linear' }}
          style={{ height: '100%', background: '#10B981' }}
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
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
  padding: 32, borderRadius: 20,
  background: 'rgba(15, 24, 41, 0.75)',
  backdropFilter: 'blur(30px) saturate(160%)',
  WebkitBackdropFilter: 'blur(30px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 40px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
}

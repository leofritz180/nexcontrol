'use client'
import { useState, useEffect, useRef } from 'react'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

export default function PixPayment({ tenantId, userId, userName, userEmail, amount, planName, planId, onSuccess, onClose }) {
  const [step, setStep] = useState('intro') // intro | loading | pix | paid | error
  const [pixData, setPixData] = useState(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function createPayment() {
    setStep('loading')
    try {
      const res = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          user_id: userId,
          plan_id: planId,
          amount,
          name: userName || (userEmail ? userEmail.split('@')[0] : 'Cliente'),
          email: userEmail,
          description: planName ? `NexControl — ${planName}` : 'NexControl',
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error || !data.payment_id) throw new Error('fail')

      setPixData(data)
      setStep('pix')

      pollRef.current = setInterval(async () => {
        try {
          const check = await fetch('/api/mercadopago/check-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_id: data.payment_id }),
          }).then(r => r.json())

          if (check.status === 'RECEIVED' || check.status === 'CONFIRMED' || check.status === 'approved') {
            clearInterval(pollRef.current)
            setStep('paid')
            setTimeout(() => { if (onSuccess) onSuccess() }, 1800)
          }
        } catch {}
      }, 3000)
    } catch {
      setStep('error')
    }
  }

  function copyPayload() {
    const code = pixData?.qr_code || pixData?.pix_payload
    if (!code) return
    try {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const qrImage = pixData?.qr_code_base64 || pixData?.pix_qr_code
  const qrCode  = pixData?.qr_code || pixData?.pix_payload

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(4,8,16,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          animation: 'pix-overlay-in 0.3s ease-out both',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 440, borderRadius: 24, overflow: 'hidden',
            background: 'rgba(15,24,41,0.75)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 60px rgba(229,57,53,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
            animation: 'pix-card-in 0.35s cubic-bezier(0.33,1,0.68,1) both',
            position: 'relative',
          }}
        >
          {/* Glow sutil no topo */}
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(229,57,53,0.35), transparent)' }}/>

          {/* Header */}
          <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Pagamento via Pix</h2>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {planName || 'NexControl'} · <strong style={{ color: '#e53935', fontFamily: 'var(--mono)' }}>R$ {fmt(amount)}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94A3B8', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,57,53,0.12)'; e.currentTarget.style.color = '#e53935' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94A3B8' }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '26px 24px 28px' }}>

            {/* ── INTRO ── */}
            {step === 'intro' && (
              <div style={{ animation: 'pix-fade-in 0.3s ease-out both' }}>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <p style={{ fontSize: 15, color: '#E2E8F0', margin: '0 0 6px', fontWeight: 600, lineHeight: 1.4 }}>
                    Pague em poucos segundos
                  </p>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                    Libere o acesso PRO imediatamente após o pagamento.
                  </p>
                </div>

                <button
                  onClick={createPayment}
                  style={{
                    width: '100%', padding: '15px 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(145deg, #e53935, #c62828)',
                    color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 24px rgba(229,57,53,0.4), 0 0 40px rgba(229,57,53,0.12), inset 0 1px 0 rgba(255,255,255,0.2)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(229,57,53,0.55), 0 0 60px rgba(229,57,53,0.18)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(229,57,53,0.4), 0 0 40px rgba(229,57,53,0.12), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                >
                  <span style={{ fontSize: 16 }}>⚡</span> Gerar QR Code Pix
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16, padding: '8px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span style={{ fontSize: 11, color: 'rgba(16,185,129,0.75)', fontWeight: 600, letterSpacing: '0.02em' }}>
                    Pagamento 100% seguro via Mercado Pago
                  </span>
                </div>
              </div>
            )}

            {/* ── LOADING ── */}
            {step === 'loading' && (
              <div style={{ animation: 'pix-fade-in 0.3s ease-out both' }}>
                {/* Skeleton do QR */}
                <div style={{
                  width: 220, height: 220, borderRadius: 14, margin: '0 auto 18px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'pix-shimmer 1.4s ease-in-out infinite',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}/>
                {/* Skeleton da linha de código */}
                <div style={{ height: 42, borderRadius: 10, marginBottom: 18,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                  backgroundSize: '200% 100%', animation: 'pix-shimmer 1.4s ease-in-out infinite',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}/>
                {/* Botao disabled */}
                <div style={{
                  width: '100%', padding: '14px 24px', borderRadius: 13, textAlign: 'center',
                  background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.2)',
                  color: '#FCA5A5', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(229,57,53,0.25)', borderTopColor: '#e53935',
                    animation: 'pix-spin 0.7s linear infinite',
                  }}/>
                  Gerando pagamento...
                </div>
              </div>
            )}

            {/* ── PIX ── */}
            {step === 'pix' && pixData && (
              <div style={{ animation: 'pix-fade-in 0.35s ease-out both', textAlign: 'center' }}>
                {/* QR Code com leve pulse */}
                {qrImage && (
                  <div style={{
                    display: 'inline-block', padding: 12, background: '#fff', borderRadius: 14,
                    marginBottom: 18,
                    animation: 'pix-pulse 2.6s ease-in-out infinite',
                    boxShadow: '0 0 30px rgba(229,57,53,0.18)',
                  }}>
                    <img
                      src={`data:image/png;base64,${qrImage}`}
                      alt="QR Code Pix"
                      style={{ width: 200, height: 200, display: 'block' }}
                    />
                  </div>
                )}

                {/* Código copia-e-cola + botão */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                    background: 'rgba(4,8,16,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 10, fontFamily: 'var(--mono)', color: '#64748B',
                    wordBreak: 'break-all', maxHeight: 56, overflowY: 'auto', textAlign: 'left',
                  }}>
                    {qrCode}
                  </div>

                  <button
                    onClick={copyPayload}
                    style={{
                      width: '100%', padding: '13px 20px', borderRadius: 13, border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s',
                      background: copied ? 'rgba(16,185,129,0.15)' : 'linear-gradient(145deg, #e53935, #c62828)',
                      color: copied ? '#10B981' : 'white',
                      boxShadow: copied
                        ? '0 0 0 1px rgba(16,185,129,0.3) inset'
                        : '0 4px 20px rgba(229,57,53,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >
                    {copied ? (
                      <>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Código copiado
                      </>
                    ) : (
                      <>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Copiar código Pix
                      </>
                    )}
                  </button>
                </div>

                {/* Status aguardando */}
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.78)',
                    animation: 'pix-ping 1.6s ease-in-out infinite',
                  }}/>
                  <span style={{ fontSize: 12, color: '#FCD34D', fontWeight: 600, letterSpacing: '0.02em' }}>
                    ⏳ Aguardando pagamento...
                  </span>
                </div>
              </div>
            )}

            {/* ── PAID ── */}
            {step === 'paid' && (
              <div style={{ textAlign: 'center', padding: '8px 0', animation: 'pix-fade-in 0.35s ease-out both' }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                  animation: 'pix-pop 0.5s cubic-bezier(0.33,1.4,0.68,1) both',
                  boxShadow: '0 0 40px rgba(16,185,129,0.25)',
                }}>
                  <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#10B981', margin: '0 0 6px' }}>
                  ✅ Pagamento confirmado!
                </h3>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 18px' }}>
                  Liberando acesso...
                </p>
                <div style={{ width: '100%', height: 3, borderRadius: 2, overflow: 'hidden', background: 'rgba(16,185,129,0.08)' }}>
                  <div style={{ height: '100%', background: '#10B981', animation: 'pix-bar 1.8s linear both', transformOrigin: 'left' }}/>
                </div>
              </div>
            )}

            {/* ── ERROR ── */}
            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '8px 0', animation: 'pix-fade-in 0.3s ease-out both' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px' }}>
                  Erro ao gerar pagamento
                </p>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 22px' }}>
                  Tente novamente em alguns segundos.
                </p>
                <button
                  onClick={createPayment}
                  style={{
                    width: '100%', padding: '13px 20px', borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(145deg, #e53935, #c62828)',
                    color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(229,57,53,0.35)',
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pix-overlay-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pix-card-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes pix-fade-in {
          from { opacity: 0; transform: translateY(6px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes pix-shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes pix-spin { to { transform: rotate(360deg) } }
        @keyframes pix-pulse {
          0%,100% { box-shadow: 0 0 30px rgba(229,57,53,0.18) }
          50%     { box-shadow: 0 0 48px rgba(229,57,53,0.32) }
        }
        @keyframes pix-ping {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5) }
          70%     { box-shadow: 0 0 0 7px rgba(255,255,255,0) }
        }
        @keyframes pix-pop {
          0%   { opacity: 0; transform: scale(0.5) }
          60%  { transform: scale(1.08) }
          100% { opacity: 1; transform: scale(1) }
        }
        @keyframes pix-bar {
          from { transform: scaleX(0) }
          to   { transform: scaleX(1) }
        }

        /* Mobile first */
        @media (max-width: 480px) {
          .pix-card { max-width: 100%; border-radius: 20px; }
        }
      `}</style>
    </>
  )
}

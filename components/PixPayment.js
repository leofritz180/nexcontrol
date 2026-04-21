'use client'
import { useState, useEffect, useRef } from 'react'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

function maskCpf(v) {
  const n = v.replace(/\D/g,'').slice(0,11)
  if (n.length<=3) return n
  if (n.length<=6) return n.slice(0,3)+'.'+n.slice(3)
  if (n.length<=9) return n.slice(0,3)+'.'+n.slice(3,6)+'.'+n.slice(6)
  return n.slice(0,3)+'.'+n.slice(3,6)+'.'+n.slice(6,9)+'-'+n.slice(9)
}

export default function PixPayment({ tenantId, userId, userName, userEmail, amount, planName, planId, onSuccess, onClose }) {
  const [step, setStep] = useState('cpf') // cpf | loading | pix | paid | error
  const [cpf, setCpf] = useState('')
  const [pixData, setPixData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    return () => clearInterval(pollRef.current)
  }, [])

  async function createPayment() {
    if (cpf.replace(/\D/g,'').length < 11) { setError('CPF invalido'); return }
    setStep('loading'); setError('')
    try {
      const res = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          user_id: userId,
          plan_id: planId,
          amount,
          name: userName,
          email: userEmail,
          cpfCnpj: cpf.replace(/\D/g,''),
          description: planName ? `NexControl — ${planName}` : 'NexControl',
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setPixData(data)
      setStep('pix')

      pollRef.current = setInterval(async () => {
        const check = await fetch('/api/mercadopago/check-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: data.payment_id }),
        }).then(r => r.json())

        if (check.status === 'RECEIVED' || check.status === 'CONFIRMED' || check.status === 'approved') {
          clearInterval(pollRef.current)
          setStep('paid')
          if (onSuccess) onSuccess()
        }
      }, 3000)
    } catch (e) {
      setError(e.message)
      setStep('error')
    }
  }

  function copyPayload() {
    if (!pixData?.pix_payload) return
    navigator.clipboard.writeText(pixData.pix_payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:10000,
      background:'rgba(4,8,16,0.95)', backdropFilter:'blur(20px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        maxWidth:440, width:'100%', borderRadius:24, overflow:'hidden',
        background:'var(--surface)', border:'1px solid var(--b2)',
        boxShadow:'0 40px 80px rgba(0,0,0,0.5)',
        animation:'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both',
      }}>
        {/* Header */}
        <div style={{
          padding:'24px 28px', borderBottom:'1px solid var(--b1)',
          background:'linear-gradient(135deg, rgba(59,130,246,0.08), var(--surface))',
        }}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <h2 style={{fontSize:18,fontWeight:800,color:'var(--t1)',margin:'0 0 4px'}}>Pagamento via Pix</h2>
              <p className="t-small">{planName || 'NexControl'} · R$ {fmt(amount)}</p>
            </div>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--b2)',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div style={{padding:'28px'}}>
          {/* CPF Step */}
          {step==='cpf' && (
            <div>
              <p style={{fontSize:14,color:'var(--t2)',marginBottom:20}}>Informe seu CPF para gerar o Pix</p>
              <div style={{marginBottom:16}}>
                <label className="t-label" style={{display:'block',marginBottom:8}}>CPF</label>
                <input className="input" type="text" value={cpf} onChange={e=>setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} style={{fontSize:18,fontFamily:'var(--mono)',textAlign:'center',letterSpacing:'0.05em'}}/>
              </div>
              {error && <p style={{fontSize:12,color:'var(--loss)',marginBottom:12}}>{error}</p>}
              <button onClick={createPayment} disabled={cpf.replace(/\D/g,'').length<11} className="btn btn-profit btn-lg" style={{width:'100%',justifyContent:'center',fontSize:15,fontWeight:700}}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Gerar Pix
              </button>
            </div>
          )}

          {/* Loading */}
          {step==='loading' && (
            <div style={{textAlign:'center',padding:'40px 0'}}>
              <div className="spinner" style={{margin:'0 auto 16px',width:28,height:28,borderTopColor:'var(--brand-bright)'}}/>
              <p style={{fontSize:14,color:'var(--t2)'}}>Gerando codigo Pix...</p>
            </div>
          )}

          {/* Error */}
          {step==='error' && (
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <div style={{width:48,height:48,borderRadius:14,background:'var(--loss-dim)',border:'1px solid var(--loss-border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p style={{fontSize:14,fontWeight:600,color:'var(--loss)',marginBottom:8}}>Erro ao gerar Pix</p>
              <p className="t-small" style={{marginBottom:20}}>{error}</p>
              <button onClick={()=>setStep('cpf')} className="btn btn-brand btn-sm">Tentar novamente</button>
            </div>
          )}

          {/* PIX QR Code */}
          {step==='pix' && pixData && (
            <div style={{textAlign:'center'}}>
              <div style={{marginBottom:20}}>
                <p className="t-label" style={{marginBottom:6}}>VALOR</p>
                <p className="t-num" style={{fontSize:32,fontWeight:900,color:'var(--brand-bright)'}}>R$ {fmt(amount)}</p>
              </div>

              {pixData.pix_qr_code && (
                <div style={{display:'inline-block',padding:16,background:'white',borderRadius:16,marginBottom:20}}>
                  <img src={`data:image/png;base64,${pixData.pix_qr_code}`} alt="QR Code Pix" style={{width:200,height:200,display:'block'}}/>
                </div>
              )}

              <div style={{marginBottom:20}}>
                <button onClick={copyPayload} className="btn btn-brand" style={{width:'100%',justifyContent:'center'}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {copied ? 'Copiado!' : 'Copiar codigo Pix'}
                </button>
              </div>

              <div style={{padding:'12px 16px',borderRadius:12,background:'var(--warn-dim)',border:'1px solid var(--warn-border)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <div className="spinner" style={{width:14,height:14,borderTopColor:'var(--warn)',borderWidth:2}}/>
                <span style={{fontSize:12,fontWeight:600,color:'var(--warn)'}}>Aguardando pagamento...</span>
              </div>
            </div>
          )}

          {/* Paid */}
          {step==='paid' && (
            <div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{width:56,height:56,borderRadius:16,background:'var(--profit-dim)',border:'1px solid var(--profit-border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',animation:'badge-pop 0.4s cubic-bezier(0.33,1,0.68,1) both'}}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 style={{fontSize:20,fontWeight:800,color:'var(--profit)',marginBottom:6}}>Pagamento confirmado!</h3>
              <p style={{fontSize:14,color:'var(--t2)',marginBottom:24}}>Seu plano foi ativado com sucesso.</p>
              <button onClick={onClose} className="btn btn-profit btn-lg" style={{width:'100%',justifyContent:'center'}}>Continuar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

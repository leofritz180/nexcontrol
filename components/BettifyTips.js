'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// Card rotativo de dicas de uso + propaganda da Loja Bettify (integrada).
// Gira automaticamente e tem CTA pra loja. Usar onde fizer sentido (Minhas Proxies, etc).
const TIPS = [
  { t: 'Residencial bloqueia menos', d: 'Proxies residenciais são bem menos bloqueadas que datacenter — ideais pra operar com segurança.' },
  { t: 'Rotativas = zero bloqueio', d: 'As rotativas trocam de IP sozinhas, zerando a taxa de bloqueio na sua operação.' },
  { t: '+90M de IPs, BR e globais', d: 'Liberação automática, IPs brasileiros e do mundo todo — escala sem dor de cabeça.' },
  { t: 'Recarga na mesma proxy', d: 'Acabou a giga? Recarrega e o GB entra na MESMA proxy — host, porta e senha não mudam.' },
  { t: 'Alerta antes de acabar', d: 'Você recebe aviso quando a giga está baixando — recarregue sem parar a operação no meio.' },
  { t: 'Performance 24/7', d: 'Estabilidade o tempo todo pra sua operação não travar em horário de pico.' },
]

export default function BettifyTips() {
  const router = useRouter()
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TIPS.length), 6000)
    return () => clearInterval(id)
  }, [])
  const tip = TIPS[i]

  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '18px 20px',
      background: 'linear-gradient(135deg, rgba(255,107,0,0.10), rgba(255,107,0,0.02))',
      border: '1px solid rgba(255,107,0,0.28)', boxShadow: '0 0 30px rgba(255,107,0,0.08)',
    }}>
      <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,0,0.18), transparent 65%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: '#FF6B00', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Dica · Bettify Proxy</span>
      </div>

      <div style={{ position: 'relative', minHeight: 64 }}>
        <AnimatePresence mode="wait">
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: '0 0 4px' }}>{tip.t}</p>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, lineHeight: 1.5 }}>{tip.d}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 }}>
        {/* bolinhas de navegacao */}
        <div style={{ display: 'flex', gap: 5 }}>
          {TIPS.map((_, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={`Dica ${k + 1}`}
              style={{ width: k === i ? 16 : 6, height: 6, borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, background: k === i ? '#FF6B00' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
          ))}
        </div>
        <button type="button" onClick={() => router.push('/proxy')}
          style={{ padding: '9px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 800, background: '#FF6B00', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 6px 18px rgba(255,107,0,0.3)', flexShrink: 0 }}>
          Ver na Loja
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
      </div>
    </div>
  )
}

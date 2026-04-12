'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const KEY = 'nexcontrol_onboarded'

export default function Onboarding() {
  const [step, setStep] = useState(-1) // -1=checking, 0=loading, 1/2/3=tips, 4=done

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(KEY)) {
        setStep(4)
        return
      }
    } catch {
      setStep(4)
      return
    }
    setStep(0)
    const t = setTimeout(() => setStep(1), 2000)
    return () => clearTimeout(t)
  }, [])

  function next() {
    if (step < 3) setStep(step + 1)
    else finish()
  }

  function finish() {
    try { localStorage.setItem(KEY, '1') } catch {}
    setStep(4)
  }

  if (step === -1 || step === 4) return null

  const tips = [
    { title:'Lucro em tempo real', desc:'Acompanhe cada centavo da sua operacao. Atualiza a cada 30 segundos.' },
    { title:'Equipe conectada', desc:'Operadores registram remessas e voce ve tudo no painel automaticamente.' },
    { title:'App no celular', desc:'Instale como app no iPhone e receba notificacoes quando algo acontece.' },
  ]

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding"
        initial={{ opacity:1 }}
        exit={{ opacity:0 }}
        transition={{ duration:0.4 }}
        style={{
          position:'fixed', inset:0, zIndex:99998, background:'#000',
          display:'flex', alignItems:'center', justifyContent:'center', padding:24,
        }}
      >
        {/* Loading */}
        {step === 0 && (
          <motion.div
            key="loading"
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ textAlign:'center' }}
          >
            <div style={{
              width:52, height:52, borderRadius:14, background:'#e53935',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 20px', boxShadow:'0 0 30px rgba(229,57,53,0.3)',
            }}>
              <svg width={22} height={22} viewBox="0 0 28 28" fill="none">
                <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
                <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
                <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
              </svg>
            </div>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.35)' }}>Preparando seu painel...</p>
          </motion.div>
        )}

        {/* Tips 1-3 */}
        {step >= 1 && step <= 3 && (
          <motion.div
            key={`tip-${step}`}
            initial={{ opacity:0, x:30 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-30 }}
            transition={{ duration:0.3 }}
            style={{ textAlign:'center', maxWidth:400 }}
          >
            <h2 style={{ fontSize:24, fontWeight:800, color:'var(--t1)', margin:'0 0 10px' }}>
              {tips[step-1].title}
            </h2>
            <p style={{ fontSize:14, color:'var(--t3)', lineHeight:1.5, margin:'0 0 32px' }}>
              {tips[step-1].desc}
            </p>

            {/* Dots */}
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:24 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  width: step===i?20:6, height:6, borderRadius:3,
                  background: step===i?'#e53935':'rgba(255,255,255,0.12)',
                  transition:'all 0.3s',
                }}/>
              ))}
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={next}
                style={{
                  padding:'12px 32px', borderRadius:10, fontSize:14, fontWeight:700,
                  background:'#e53935', color:'white', border:'none', cursor:'pointer',
                  boxShadow:'0 4px 16px rgba(229,57,53,0.25)',
                }}>
                {step < 3 ? 'Proximo' : 'Comecar a usar'}
              </button>
              <button onClick={finish}
                style={{
                  padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600,
                  background:'transparent', color:'var(--t3)', border:'1px solid rgba(255,255,255,0.08)',
                  cursor:'pointer',
                }}>
                Pular
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

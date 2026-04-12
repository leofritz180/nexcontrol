'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ONBOARDING_KEY = 'nexcontrol_onboarded'

export default function Onboarding() {
  const [phase, setPhase] = useState(-1) // -1=check, 0=loading, 1=welcome, 2=tips, 3=done
  const [tip, setTip] = useState(0)

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_KEY)) {
      setPhase(3) // already onboarded
      return
    }
    setPhase(0) // start onboarding
    setTimeout(() => setPhase(1), 2000) // loading → welcome
    setTimeout(() => setPhase(2), 4000) // welcome → tips
  }, [])

  function finish() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setPhase(3)
  }

  if (phase === -1 || phase === 3) return null

  const tips = [
    { title:'Lucro em tempo real', desc:'Acompanhe cada centavo da operacao atualizado a cada 30 segundos' },
    { title:'Operadores conectados', desc:'Sua equipe registra remessas e voce recebe tudo no painel' },
    { title:'Notificacoes no celular', desc:'Instale como app e receba alertas quando algo acontece' },
  ]

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          initial={{ opacity:1 }}
          exit={{ opacity:0 }}
          transition={{ duration:0.5 }}
          style={{
            position:'fixed', inset:0, zIndex:99998,
            background:'#000',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:24,
          }}
        >
          {/* Phase 0: Loading */}
          {phase === 0 && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ textAlign:'center' }}
            >
              <motion.div
                animate={{ boxShadow:['0 0 20px rgba(229,57,53,0.2)','0 0 40px rgba(229,57,53,0.4)','0 0 20px rgba(229,57,53,0.2)'] }}
                transition={{ duration:2, repeat:Infinity }}
                style={{ width:56, height:56, borderRadius:16, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}
              >
                <svg width={24} height={24} viewBox="0 0 28 28" fill="none">
                  <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
                  <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
                  <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
                </svg>
              </motion.div>
              <motion.p
                animate={{ opacity:[0.3,0.7,0.3] }}
                transition={{ duration:2, repeat:Infinity }}
                style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}
              >
                Preparando seu painel...
              </motion.p>
            </motion.div>
          )}

          {/* Phase 1: Welcome */}
          {phase === 1 && (
            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.6 }}
              style={{ textAlign:'center', maxWidth:400 }}
            >
              <h1 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>
                Bem-vindo ao NexControl
              </h1>
              <p style={{ fontSize:15, color:'var(--t3)', lineHeight:1.5, margin:0 }}>
                Seu painel de controle esta pronto. Veja o que voce pode fazer.
              </p>
            </motion.div>
          )}

          {/* Phase 2: Tips */}
          {phase === 2 && (
            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5 }}
              style={{ textAlign:'center', maxWidth:420 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={tip}
                  initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                  transition={{ duration:0.3 }}
                >
                  <div style={{
                    width:48, height:48, borderRadius:14, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px',
                  }}>
                    <span style={{ fontSize:20 }}>{tip===0?'💰':tip===1?'👥':'📱'}</span>
                  </div>
                  <h2 style={{ fontSize:22, fontWeight:800, color:'var(--t1)', margin:'0 0 8px' }}>
                    {tips[tip].title}
                  </h2>
                  <p style={{ fontSize:14, color:'var(--t3)', lineHeight:1.5, margin:'0 0 32px' }}>
                    {tips[tip].desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dots */}
              <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:24 }}>
                {tips.map((_,i) => (
                  <div key={i} style={{
                    width: tip===i?20:6, height:6, borderRadius:3,
                    background: tip===i?'#e53935':'rgba(255,255,255,0.15)',
                    transition:'all 0.3s',
                  }}/>
                ))}
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                {tip < tips.length-1 ? (
                  <button onClick={() => setTip(tip+1)}
                    style={{ padding:'12px 32px', borderRadius:10, fontSize:14, fontWeight:700, background:'#e53935', color:'white', border:'none', cursor:'pointer' }}>
                    Proximo
                  </button>
                ) : (
                  <button onClick={finish}
                    style={{ padding:'12px 32px', borderRadius:10, fontSize:14, fontWeight:700, background:'#e53935', color:'white', border:'none', cursor:'pointer' }}>
                    Comecar a usar
                  </button>
                )}
                <button onClick={finish}
                  style={{ padding:'12px 20px', borderRadius:10, fontSize:13, fontWeight:600, background:'transparent', color:'var(--t3)', border:'1px solid var(--b2)', cursor:'pointer' }}>
                  Pular
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

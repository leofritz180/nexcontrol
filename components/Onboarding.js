'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ONBOARDING_KEY = 'nexcontrol_onboarded'
const ease = [0.33,1,0.68,1]

export default function Onboarding() {
  const [phase, setPhase] = useState(-1) // -1=check, 0=loading, 1=sim, 2=tips, 3=done
  const [tip, setTip] = useState(0)
  const [simIdx, setSimIdx] = useState(0)
  const [simTotal, setSimTotal] = useState(0)
  const [simFlash, setSimFlash] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_KEY)) { setPhase(3); return }
    } catch { setPhase(3); return }
    setPhase(0)
    setTimeout(() => setPhase(1), 2200)
  }, [])

  // Simulation loop during phase 1
  const simData = [
    { name:'Pedro', value:32 },
    { name:'Ana', value:58 },
    { name:'Lucas', value:95 },
  ]

  useEffect(() => {
    if (phase !== 1) return
    let i = 0
    const iv = setInterval(() => {
      if (i >= simData.length) { clearInterval(iv); setTimeout(() => setPhase(2), 1000); return }
      setSimIdx(i)
      setSimTotal(prev => prev + simData[i].value)
      setSimFlash(true)
      setTimeout(() => setSimFlash(false), 600)
      i++
    }, 1500)
    return () => clearInterval(iv)
  }, [phase])

  function finish() {
    try { localStorage.setItem(ONBOARDING_KEY, 'true') } catch {}
    setPhase(3)
  }

  if (phase === -1 || phase === 3) return null

  const tips = [
    { emoji:'💰', title:'Lucro em tempo real', desc:'Acompanhe cada centavo. Atualiza a cada 30 segundos automaticamente.' },
    { emoji:'👥', title:'Equipe conectada', desc:'Operadores registram remessas e voce ve tudo no painel.' },
    { emoji:'📱', title:'App no celular', desc:'Instale como app e receba notificacoes quando algo acontece.' },
  ]

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          initial={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.5 }}
          style={{ position:'fixed', inset:0, zIndex:99998, background:'#000',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>

          {/* Phase 0: Loading */}
          {phase === 0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ textAlign:'center' }}>
              <motion.div
                animate={{ boxShadow:['0 0 20px rgba(229,57,53,0.2)','0 0 40px rgba(229,57,53,0.4)','0 0 20px rgba(229,57,53,0.2)'] }}
                transition={{ duration:2, repeat:Infinity }}
                style={{ width:56, height:56, borderRadius:16, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
                <svg width={24} height={24} viewBox="0 0 28 28" fill="none">
                  <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
                  <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
                  <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
                </svg>
              </motion.div>
              <motion.p animate={{opacity:[0.3,0.7,0.3]}} transition={{duration:2,repeat:Infinity}}
                style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>
                Conectando sua operacao...
              </motion.p>
            </motion.div>
          )}

          {/* Phase 1: Simulation — remessas entering */}
          {phase === 1 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ textAlign:'center', maxWidth:380 }}>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', marginBottom:16 }}>PAINEL AO VIVO</p>

              {/* Simulated KPI */}
              <motion.div
                animate={simFlash ? {scale:[1,1.03,1]} : {}}
                transition={{duration:0.3}}
                style={{
                  padding:'20px 28px', borderRadius:14,
                  background:'linear-gradient(145deg, #0c1424, #080e1a)',
                  border:'1px solid rgba(255,255,255,0.06)',
                  marginBottom:16, position:'relative', overflow:'hidden',
                }}>
                <p style={{ fontSize:10, color:'rgba(255,255,255,0.3)', margin:'0 0 6px' }}>Lucro total</p>
                <p style={{
                  fontFamily:'var(--mono)', fontSize:32, fontWeight:900, color:'#22C55E', margin:0,
                  textShadow: simFlash ? '0 0 20px rgba(34,197,94,0.3)' : 'none',
                  transition:'text-shadow 0.3s',
                }}>
                  +R$ {simTotal.toLocaleString('pt-BR')},00
                </p>
                {simFlash && <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%, rgba(34,197,94,0.1), transparent 60%)', pointerEvents:'none' }}/>}
              </motion.div>

              {/* Notification */}
              <AnimatePresence mode="wait">
                {simIdx < simData.length && (
                  <motion.div
                    key={simIdx}
                    initial={{ opacity:0, y:-30, scale:0.95 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:-15 }}
                    transition={{ duration:0.4, ease }}
                    style={{
                      padding:'12px 16px', borderRadius:14,
                      background:'rgba(255,255,255,0.06)',
                      backdropFilter:'blur(16px)',
                      border:'1px solid rgba(255,255,255,0.06)',
                      display:'flex', alignItems:'center', gap:10,
                      marginBottom:12,
                    }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width={9} height={9} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
                    </div>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>NexControl</span>
                      <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>
                        {simData[simIdx].name}: <span style={{ color:'#22C55E', fontWeight:700 }}>+R$ {simData[simIdx].value},00</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Phase 2: Tips */}
          {phase === 2 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
              style={{ textAlign:'center', maxWidth:420 }}>
              <AnimatePresence mode="wait">
                <motion.div key={tip}
                  initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
                  transition={{duration:0.3}}>
                  <span style={{ fontSize:36, display:'block', marginBottom:16 }}>{tips[tip].emoji}</span>
                  <h2 style={{ fontSize:22, fontWeight:800, color:'var(--t1)', margin:'0 0 8px' }}>{tips[tip].title}</h2>
                  <p style={{ fontSize:14, color:'var(--t3)', lineHeight:1.5, margin:'0 0 32px' }}>{tips[tip].desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Dots */}
              <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:24 }}>
                {tips.map((_,i) => (
                  <div key={i} style={{ width:tip===i?20:6, height:6, borderRadius:3, background:tip===i?'#e53935':'rgba(255,255,255,0.12)', transition:'all 0.3s' }}/>
                ))}
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={tip<tips.length-1 ? ()=>setTip(tip+1) : finish}
                  style={{ padding:'13px 32px', borderRadius:11, fontSize:14, fontWeight:700, background:'#e53935', color:'white', border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(229,57,53,0.3)' }}>
                  {tip<tips.length-1 ? 'Proximo' : 'Comecar a usar'}
                </button>
                <button onClick={finish}
                  style={{ padding:'13px 20px', borderRadius:11, fontSize:13, fontWeight:600, background:'transparent', color:'var(--t3)', border:'1px solid var(--b2)', cursor:'pointer' }}>
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

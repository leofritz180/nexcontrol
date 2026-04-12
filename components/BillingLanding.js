'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo, { NexIcon } from './Logo'

const ease = [0.33,1,0.68,1]
const fadeUp = (d=0) => ({initial:{opacity:0,y:16},whileInView:{opacity:1,y:0},viewport:{once:true},transition:{duration:0.5,delay:d,ease}})

const NOTIF_DATA = [
  { name:'Pedro', value:95 },
  { name:'Ana', value:147 },
  { name:'Lucas', value:68 },
  { name:'Maria', value:32 },
  { name:'Carlos', value:120 },
  { name:'Rafael', value:89 },
]

export default function BillingLanding() {
  const [idx, setIdx] = useState(0)
  const [total, setTotal] = useState(3058)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i = (i+1) % NOTIF_DATA.length
      setIdx(i)
      setTotal(prev => prev + NOTIF_DATA[i].value)
      setFlash(true)
      setTimeout(() => setFlash(false), 800)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const n = NOTIF_DATA[idx]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 28px 80px' }}>

      {/* ═══ RESULTADO ═══ */}
      <motion.div {...fadeUp()} style={{ textAlign:'center', padding:'60px 0 50px' }}>
        <p style={{ fontSize:11, color:'var(--t3)', letterSpacing:'0.15em', marginBottom:14, fontWeight:600 }}>RESULTADO REAL NA PLATAFORMA</p>
        <motion.p
          animate={{ scale:[1,1.015,1] }}
          transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
          style={{ fontFamily:'var(--mono)', fontSize:56, fontWeight:900, color:'#22C55E', lineHeight:1, margin:'0 0 10px',
            textShadow:'0 0 50px rgba(34,197,94,0.2), 0 0 100px rgba(34,197,94,0.1)',
          }}>
          +R$ 3.058,47
        </motion.p>
        <p style={{ fontSize:14, color:'var(--t3)' }}>Lucro real rastreado. Cada centavo, cada meta fechada com custos descontados.</p>
      </motion.div>

      {/* ═══ DIFERENCIAIS ═══ */}
      <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:36 }}>
        <h2 style={{ fontSize:26, fontWeight:800, color:'var(--t1)', margin:'0 0 10px', letterSpacing:'-0.03em' }}>Tudo que o PRO libera</h2>
        <p style={{ fontSize:13, color:'var(--t3)', maxWidth:420, margin:'0 auto' }}>Recursos exclusivos que transformam dados em decisoes.</p>
      </motion.div>

      <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:60 }}>
        {[
          {icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', t:'Dashboard premium', d:'Lucro, metas e operadores em tempo real'},
          {icon:'M13 2L3 14h9l-1 8 10-12h-9l1-8z', t:'Inteligencia IA', d:'Previsoes e insights automaticos'},
          {icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5', t:'Alertas estrategicos', d:'Queda, risco e inatividade detectados'},
          {icon:'M3 4h18M3 8h12M3 12h18M3 16h8M3 20h14', t:'Ranking de redes', d:'Saiba quais redes geram mais lucro'},
          {icon:'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', t:'Modo apresentacao', d:'Video cinematografico do resultado'},
          {icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7', t:'Equipe ilimitada', d:'Operadores sem limite'},
          {icon:'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', t:'Exportacao premium', d:'Imagem e video pra compartilhar'},
          {icon:'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', t:'App no celular', d:'Push notifications no iPhone'},
        ].map(({icon,t,d},i) => (
          <motion.div key={i} {...fadeUp(i*0.04)}
            whileHover={{ y:-3, transition:{duration:0.2} }}
            style={{ padding:'20px 18px', borderRadius:12, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.04)', boxShadow:'0 4px 16px rgba(0,0,0,0.25)' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:10, opacity:0.7 }}>
              <path d={icon}/>
            </svg>
            <h4 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 4px' }}>{t}</h4>
            <p style={{ fontSize:11, color:'var(--t3)', margin:0, lineHeight:1.4 }}>{d}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ CELULAR 3D + NOTIFICACOES ═══ */}
      <section style={{ padding:'40px 0 60px', position:'relative' }}>
        <div style={{ position:'absolute', top:'25%', right:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.04), transparent 55%)', filter:'blur(60px)', pointerEvents:'none' }}/>

        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr', gap:48, alignItems:'center' }}>

          {/* Copy */}
          <motion.div {...fadeUp()}>
            <h2 style={{ fontSize:30, fontWeight:900, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em', lineHeight:1.15 }}>
              Seu lucro chega assim
            </h2>
            <p style={{ fontSize:15, color:'var(--t3)', lineHeight:1.6, margin:'0 0 32px' }}>
              Cada remessa vira uma notificacao no seu celular. Em tempo real.
            </p>
            {[
              {t:'Notificacao instantanea', d:'Saiba na hora quando dinheiro entra ou sai'},
              {t:'Lucro atualizado ao vivo', d:'O valor muda a cada remessa registrada'},
              {t:'Instale em 2 toques', d:'App nativo no iPhone e Android'},
            ].map(({t,d}) => (
              <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" style={{ marginTop:3, flexShrink:0 }}><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 3px' }}>{t}</p>
                  <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{d}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* iPhone 3D */}
          <motion.div {...fadeUp(0.2)} style={{ display:'flex', justifyContent:'center', perspective:1000 }}>
            <motion.div
              animate={{ y:[0,-6,0,4,0] }}
              transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }}
              style={{
                width:260, borderRadius:36, padding:'10px 8px 14px',
                background:'linear-gradient(165deg, #333 0%, #1c1c1c 25%, #111 60%, #0a0a0a 100%)',
                border:'1.5px solid rgba(255,255,255,0.12)',
                boxShadow:`0 35px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 ${flash?'50':'25'}px rgba(34,197,94,${flash?'0.1':'0.03'})`,
                position:'relative', transform:'rotateY(-3deg) rotateX(2deg)',
                transition:'box-shadow 0.5s ease',
              }}>
              {/* Dynamic Island */}
              <div style={{ width:90, height:24, borderRadius:12, background:'#000', margin:'0 auto 8px', border:'1px solid rgba(255,255,255,0.06)' }}/>

              {/* Screen */}
              <div style={{ borderRadius:24, overflow:'hidden', background:'#060a12', position:'relative', minHeight:340 }}>
                {/* Flash */}
                <AnimatePresence>
                  {flash && (
                    <motion.div initial={{opacity:0.2}} animate={{opacity:0}} exit={{opacity:0}} transition={{duration:0.8}}
                      style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 15%, rgba(34,197,94,0.25), transparent 55%)', zIndex:10, pointerEvents:'none' }}/>
                  )}
                </AnimatePresence>

                {/* Notification */}
                <div style={{ padding:'8px 10px 0', position:'relative', zIndex:8 }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={idx}
                      initial={{ opacity:0, y:-45, scale:0.92 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      exit={{ opacity:0, y:-20, scale:0.96 }}
                      transition={{ duration:0.45, ease:[0.16,1,0.3,1] }}
                      style={{
                        padding:'10px 12px', borderRadius:14,
                        background:'rgba(255,255,255,0.08)',
                        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                        border:'1px solid rgba(255,255,255,0.06)',
                        marginBottom:6, boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
                      }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <div style={{ width:18, height:18, borderRadius:5, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <NexIcon size={8}/>
                        </div>
                        <div style={{ flex:1, display:'flex', justifyContent:'space-between' }}>
                          <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>NexControl</span>
                          <span style={{ fontSize:6, color:'rgba(255,255,255,0.25)' }}>agora</span>
                        </div>
                      </div>
                      <p style={{ fontSize:8, color:'rgba(255,255,255,0.5)', margin:0, paddingLeft:26 }}>
                        Nova remessa: <span style={{ color:'#22C55E', fontWeight:700, fontSize:9 }}>+R$ {n.value},00</span>
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* App */}
                <div style={{ padding:'4px 12px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                    <div style={{ width:16, height:16, borderRadius:5, background:'#e53935' }}/>
                    <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.45)' }}>NexControl</span>
                  </div>
                  <motion.div animate={flash?{scale:[1,1.025,1]}:{}} transition={{duration:0.35}}
                    style={{ padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)', marginBottom:10, position:'relative', overflow:'hidden' }}>
                    <p style={{ fontSize:7, color:'rgba(255,255,255,0.3)', margin:'0 0 5px' }}>Lucro total</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:900, color:'#22C55E', margin:0,
                      textShadow:flash?'0 0 20px rgba(34,197,94,0.3)':'none', transition:'text-shadow 0.3s' }}>
                      +R$ {total.toLocaleString('pt-BR')}
                    </p>
                    {flash && <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%, rgba(34,197,94,0.1), transparent 60%)', pointerEvents:'none' }}/>}
                  </motion.div>
                  {NOTIF_DATA.slice(0,3).map((item,i) => (
                    <div key={item.name} style={{ padding:'5px 2px', borderBottom:i<2?'1px solid rgba(255,255,255,0.03)':'none', display:'flex', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:14, height:14, borderRadius:4, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:6, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>{item.name[0]}</span>
                        </div>
                        <span style={{ fontSize:7, color:'rgba(255,255,255,0.35)' }}>{item.name}</span>
                      </div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:8, fontWeight:700, color:'#22C55E' }}>+R$ {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width:70, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)', margin:'10px auto 0' }}/>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', borderRadius:'36px 36px 0 0', background:'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)', pointerEvents:'none' }}/>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ PROVA SOCIAL ═══ */}
      <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:28 }}>
        <h2 style={{ fontSize:24, fontWeight:800, color:'var(--t1)', margin:'0 0 20px', letterSpacing:'-0.02em' }}>Quem usa, nao volta pra planilha</h2>
      </motion.div>
      <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:48 }}>
        {[
          {q:'Agora consigo controlar tudo em um lugar so. Nao volto pra planilha.', n:'R. Silva'},
          {q:'O app no celular mudou minha rotina. Recebo tudo em tempo real.', n:'M. Costa'},
          {q:'Visual premium e controle real. Minha equipe toda usa.', n:'L. Santos'},
        ].map(({q,n},i) => (
          <motion.div key={i} {...fadeUp(i*0.08)}
            style={{ padding:'22px 20px', borderRadius:12, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.6, margin:'0 0 14px', fontStyle:'italic' }}>"{q}"</p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:6, background:'var(--raised)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--t2)' }}>{n[0]}</span>
              </div>
              <span style={{ fontSize:11, color:'var(--t3)', fontWeight:600 }}>{n}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', padding:'20px 0' }}>
        <p style={{ fontSize:12, color:'var(--t4)' }}>3 dias gratis. Sem cartao. Cancele quando quiser.</p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:12 }}>
          <div style={{ width:22, height:22, borderRadius:6, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <NexIcon size={9}/>
          </div>
          <Logo showIcon={false} textSize={12} style={{ opacity:0.3 }}/>
        </div>
      </div>
    </div>
  )
}

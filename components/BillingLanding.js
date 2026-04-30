'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Logo, { NexIcon } from './Logo'
import { SLOTS } from '../lib/slots-data'

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

const FEED_DATA = [
  { rede:'WE',   name:'Pedro',  value:87,  pos:true,  t:'2s atras' },
  { rede:'FP',   name:'Lucas',  value:42,  pos:true,  t:'5s atras' },
  { rede:'91',   name:'Joao',   value:12,  pos:false, t:'9s atras' },
  { rede:'OKOK', name:'Ana',    value:127, pos:true,  t:'14s atras' },
  { rede:'VOY',  name:'Rafa',   value:68,  pos:true,  t:'21s atras' },
  { rede:'DY',   name:'Carlos', value:29,  pos:false, t:'34s atras' },
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
          style={{ fontFamily:'var(--mono)', fontSize:56, fontWeight:900, color:'#ECFDF5', lineHeight:1, margin:'0 0 10px',
            textShadow:'0 0 50px rgba(236,253,245,0.2), 0 0 100px rgba(236,253,245,0.1)',
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
            style={{ padding:'20px 18px', borderRadius:12, background:'linear-gradient(145deg, #000000, #000000)', border:'1px solid rgba(255,255,255,0.04)', boxShadow:'0 4px 16px rgba(0,0,0,0.25)' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:10, opacity:0.7 }}>
              <path d={icon}/>
            </svg>
            <h4 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 4px' }}>{t}</h4>
            <p style={{ fontSize:11, color:'var(--t3)', margin:0, lineHeight:1.4 }}>{d}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ MINI NEXCONTROL MOBILE (realista) ═══ */}
      <section style={{ padding:'40px 0 60px', position:'relative' }}>
        <div style={{ position:'absolute', top:'20%', right:'15%', width:440, height:440, borderRadius:'50%', background:'radial-gradient(circle, rgba(236,253,245,0.08), transparent 55%)', filter:'blur(70px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'10%', left:'10%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.06), transparent 55%)', filter:'blur(56px)', pointerEvents:'none' }}/>

        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr', gap:56, alignItems:'center', position:'relative' }}>

          {/* Copy — vendedor */}
          <motion.div {...fadeUp()}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:99, background:'rgba(236,253,245,0.08)', border:'1px solid rgba(236,253,245,0.2)', marginBottom:18 }}>
              <motion.div
                animate={{ boxShadow:['0 0 0 0 rgba(236,253,245,0.55)','0 0 0 5px rgba(236,253,245,0)','0 0 0 0 rgba(236,253,245,0)'] }}
                transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:6, height:6, borderRadius:'50%', background:'#ECFDF5' }}
              />
              <span style={{ fontSize:10, color:'#ECFDF5', fontWeight:800, letterSpacing:'0.1em' }}>AO VIVO NO SEU BOLSO</span>
            </div>

            <h2 style={{ fontSize:34, fontWeight:900, color:'var(--t1)', margin:'0 0 14px', letterSpacing:'-0.035em', lineHeight:1.1 }}>
              Veja o dinheiro entrando<br/>
              <span style={{ background:'linear-gradient(135deg, #ECFDF5, #4ADE80)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>em tempo real</span>
            </h2>
            <p style={{ fontSize:15, color:'var(--t2)', lineHeight:1.6, margin:'0 0 28px' }}>
              Cada remessa registrada vira uma <strong style={{ color:'#fff' }}>notificação instantânea</strong> no seu celular. Você acompanha tudo ao vivo — <strong style={{ color:'#ECFDF5' }}>operador, rede e lucro</strong>.
            </p>

            {[
              {t:'Notificação imediata por remessa', d:'Som e vibração no instante que alguém registra'},
              {t:'Lucro atualizado em segundos', d:'Você vê cada centavo somando ao total'},
              {t:'Controle total mesmo longe do painel', d:'Sem precisar abrir o computador'},
            ].map(({t,d},i) => (
              <motion.div key={t}
                initial={{opacity:0, x:-8}} whileInView={{opacity:1, x:0}} viewport={{once:true}}
                transition={{duration:0.4, delay:0.1+i*0.08, ease}}
                style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                <div style={{ width:22, height:22, borderRadius:6, background:'rgba(236,253,245,0.12)', border:'1px solid rgba(236,253,245,0.28)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2, boxShadow:'0 0 10px rgba(236,253,245,0.12)' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ECFDF5" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 3px', letterSpacing:'-0.01em' }}>{t}</p>
                  <p style={{ fontSize:11, color:'var(--t3)', margin:0, lineHeight:1.45 }}>{d}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Device Premium Realista — sem cara de iPhone mock */}
          <motion.div {...fadeUp(0.2)} style={{ display:'flex', justifyContent:'center', perspective:1400 }}>
            <motion.div
              animate={{ y:[0,-8,0,5,0], rotateY:[-2,-4,-2,-1,-2] }}
              transition={{ duration:8, repeat:Infinity, ease:'easeInOut' }}
              style={{
                width:300,
                borderRadius:36,
                padding:'14px 12px 18px',
                background:'linear-gradient(160deg, rgba(14,22,38,0.95) 0%, rgba(8,12,20,0.95) 50%, rgba(4,7,14,0.95) 100%)',
                backdropFilter:'blur(30px) saturate(160%)', WebkitBackdropFilter:'blur(30px) saturate(160%)',
                border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:`0 50px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(229,57,53,0.04), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 ${flash?'80':'40'}px rgba(236,253,245,${flash?'0.18':'0.05'})`,
                position:'relative', transform:'rotateX(3deg)',
                transition:'box-shadow 0.6s ease',
              }}>
              {/* Subtle top speaker */}
              <div style={{ width:60, height:5, borderRadius:3, background:'rgba(255,255,255,0.06)', margin:'0 auto 10px' }}/>

              {/* Screen */}
              <div style={{
                borderRadius:26, overflow:'hidden', position:'relative', minHeight:440,
                background:'linear-gradient(180deg, #0a0f1c 0%, #060a14 100%)',
                border:'1px solid rgba(255,255,255,0.04)',
              }}>
                {/* Top flash overlay quando chega notificacao */}
                <AnimatePresence>
                  {flash && (
                    <motion.div initial={{opacity:0.3}} animate={{opacity:0}} exit={{opacity:0}} transition={{duration:0.9}}
                      style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 15%, rgba(236,253,245,0.22), transparent 58%)', zIndex:10, pointerEvents:'none' }}/>
                  )}
                </AnimatePresence>

                {/* Header NexControl */}
                <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:18, height:18, borderRadius:5, background:'linear-gradient(145deg, #e53935, #c62828)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 10px rgba(229,57,53,0.35)' }}>
                      <NexIcon size={9}/>
                    </div>
                    <div>
                      <p style={{ fontSize:10, fontWeight:800, color:'#F1F5F9', margin:0, letterSpacing:'-0.01em' }}>NexControl</p>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:1 }}>
                        <motion.div
                          animate={{ boxShadow:['0 0 0 0 rgba(236,253,245,0.6)','0 0 0 3px rgba(236,253,245,0)','0 0 0 0 rgba(236,253,245,0)'] }}
                          transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }}
                          style={{ width:4, height:4, borderRadius:'50%', background:'#ECFDF5' }}
                        />
                        <span style={{ fontSize:7, color:'rgba(236,253,245,0.8)', fontWeight:700, letterSpacing:'0.08em' }}>TEMPO REAL</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize:7, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)' }}>{new Date().getHours().toString().padStart(2,'0')}:{new Date().getMinutes().toString().padStart(2,'0')}</span>
                </div>

                {/* Notification slide from top */}
                <div style={{ padding:'8px 10px 0', position:'relative', zIndex:9 }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={idx}
                      initial={{ opacity:0, y:-60, scale:0.88 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      exit={{ opacity:0, y:-30, scale:0.94 }}
                      transition={{ duration:0.5, ease:[0.16,1.2,0.3,1] }}
                      style={{
                        padding:'10px 12px', borderRadius:14,
                        background:'rgba(20,30,48,0.85)',
                        backdropFilter:'blur(24px) saturate(160%)', WebkitBackdropFilter:'blur(24px) saturate(160%)',
                        border:'1px solid rgba(236,253,245,0.22)',
                        boxShadow:'0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(236,253,245,0.1)',
                      }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                        <div style={{ width:16, height:16, borderRadius:4, background:'linear-gradient(145deg, #e53935, #c62828)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <NexIcon size={8}/>
                        </div>
                        <span style={{ fontSize:8, fontWeight:800, color:'#F1F5F9', letterSpacing:'-0.01em' }}>NexControl</span>
                        <span style={{ fontSize:7, color:'rgba(236,253,245,0.9)', fontWeight:700, marginLeft:'auto' }}>agora</span>
                      </div>
                      <p style={{ fontSize:10, fontWeight:700, color:'#F1F5F9', margin:'0 0 2px', paddingLeft:23 }}>
                        {FEED_DATA[idx % FEED_DATA.length].rede} · {FEED_DATA[idx % FEED_DATA.length].name}
                      </p>
                      <p style={{ fontSize:8, color:'rgba(255,255,255,0.55)', margin:0, paddingLeft:23 }}>
                        <span style={{ color: FEED_DATA[idx % FEED_DATA.length].pos ? '#ECFDF5' : '#EF4444', fontWeight:800, fontSize:10 }}>
                          {FEED_DATA[idx % FEED_DATA.length].pos?'+':'-'}R$ {FEED_DATA[idx % FEED_DATA.length].value},00
                        </span> {FEED_DATA[idx % FEED_DATA.length].pos ? 'lucro' : 'prejuizo'}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Main app — mini dashboard */}
                <div style={{ padding:'14px 14px 18px' }}>
                  {/* Lucro total card */}
                  <motion.div
                    animate={flash?{scale:[1,1.02,1]}:{}}
                    transition={{duration:0.4, ease}}
                    style={{
                      position:'relative', overflow:'hidden',
                      padding:'14px 16px', borderRadius:14, marginBottom:12,
                      background:'linear-gradient(145deg, rgba(236,253,245,0.12), rgba(14,22,38,0.8))',
                      border:'1px solid rgba(236,253,245,0.24)',
                      boxShadow:`0 6px 20px rgba(0,0,0,0.35), 0 0 ${flash?'30':'14'}px rgba(236,253,245,${flash?'0.25':'0.08'})`,
                      transition:'box-shadow 0.4s',
                    }}>
                    <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg, transparent, rgba(236,253,245,0.4), transparent)' }}/>
                    <p style={{ fontSize:8, color:'rgba(255,255,255,0.45)', margin:'0 0 5px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Lucro de hoje</p>
                    <motion.p
                      animate={flash?{ textShadow:['0 0 10px rgba(236,253,245,0.25)','0 0 28px rgba(236,253,245,0.55)','0 0 10px rgba(236,253,245,0.25)'] }:{}}
                      transition={{duration:0.8}}
                      style={{
                        fontFamily:'var(--mono)', fontSize:26, fontWeight:900, color:'#ECFDF5', margin:0,
                        letterSpacing:'-0.03em', lineHeight:1,
                        textShadow:'0 0 18px rgba(236,253,245,0.3)',
                      }}>
                      +R$ {total.toLocaleString('pt-BR')}
                    </motion.p>
                    <p style={{ fontSize:8, color:'rgba(236,253,245,0.75)', margin:'5px 0 0', fontWeight:600 }}>
                      ↑ atualizado ha 2s
                    </p>
                  </motion.div>

                  {/* Feed header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:8, fontWeight:800, color:'rgba(255,255,255,0.55)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Atividade ao vivo</span>
                    <motion.div
                      animate={{ boxShadow:['0 0 0 0 rgba(236,253,245,0.5)','0 0 0 4px rgba(236,253,245,0)','0 0 0 0 rgba(236,253,245,0)'] }}
                      transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                      style={{ width:5, height:5, borderRadius:'50%', background:'#ECFDF5' }}
                    />
                  </div>

                  {/* Feed items */}
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {FEED_DATA.slice(0,4).map((item,i) => {
                      const ac = item.pos ? '#ECFDF5' : '#EF4444'
                      return (
                        <motion.div key={`${item.rede}-${item.name}-${i}`}
                          initial={{opacity:0, y:6}}
                          animate={{opacity:1, y:0}}
                          transition={{duration:0.35, delay:0.1+i*0.08, ease}}
                          style={{
                            padding:'7px 2px', display:'flex', alignItems:'center', justifyContent:'space-between',
                            borderBottom: i<3?'1px solid rgba(255,255,255,0.04)':'none',
                          }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                            <div style={{
                              width:22, height:22, borderRadius:6, flexShrink:0,
                              background: `${ac}14`, border:`1px solid ${ac}30`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontFamily:'var(--mono)', fontSize:7, fontWeight:800, color:ac,
                            }}>
                              {item.rede}
                            </div>
                            <div style={{ minWidth:0 }}>
                              <p style={{ fontSize:9, fontWeight:700, color:'#F1F5F9', margin:0, letterSpacing:'-0.01em' }}>{item.rede} · {item.name}</p>
                              <p style={{ fontSize:7, color:'rgba(255,255,255,0.35)', margin:0, fontFamily:'var(--mono)' }}>{item.t}</p>
                            </div>
                          </div>
                          <span style={{
                            fontFamily:'var(--mono)', fontSize:10, fontWeight:800, color:ac, flexShrink:0,
                            textShadow: item.pos ? `0 0 10px ${ac}35` : 'none',
                          }}>
                            {item.pos?'+':'-'}R$ {item.value},00
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom home indicator */}
              <div style={{ width:90, height:4, borderRadius:2, background:'rgba(255,255,255,0.1)', margin:'12px auto 0' }}/>

              {/* Top glossy */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', borderRadius:'36px 36px 0 0', background:'linear-gradient(180deg, rgba(255,255,255,0.035), transparent)', pointerEvents:'none' }}/>

              {/* External red glow glow bleed */}
              <div style={{ position:'absolute', top:'40%', left:-30, width:60, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.18), transparent 65%)', filter:'blur(24px)', pointerEvents:'none' }}/>
              <div style={{ position:'absolute', bottom:'30%', right:-30, width:60, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(236,253,245,0.14), transparent 65%)', filter:'blur(24px)', pointerEvents:'none' }}/>
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
            style={{ padding:'22px 20px', borderRadius:12, background:'linear-gradient(145deg, #000000, #000000)', border:'1px solid rgba(255,255,255,0.04)' }}>
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

      {/* ═══ Slots Premium Spoiler ═══ */}
      <motion.div {...fadeUp(0.1)} style={{ marginBottom: 48 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99,
            background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.15)',
            marginBottom: 16,
          }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#e53935', letterSpacing: '0.06em' }}>EXCLUSIVO PRO</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>
            +{SLOTS.length} slots premium liberados no PRO
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
            Slots mapeados por performance, organizados por provedor e nivel de retorno. Conteudo que so usuarios PRO conseguem visualizar.
          </p>
        </div>

        {/* Mini stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { v: `+${SLOTS.length}`, l: 'slots mapeados' },
            { v: '8', l: 'provedores' },
            { v: '24/7', l: 'atualizado' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#e53935', margin: '0 0 2px', fontFamily: 'var(--mono, monospace)' }}>{s.v}</p>
              <p style={{ fontSize: 10, color: 'var(--t4)', margin: 0, letterSpacing: '0.04em' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Spoiler grid — 6 locked cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {SLOTS.filter(s => s.performance === 'alta').slice(0, 6).map((slot, i) => {
            const lvColor = '#ecfdf5'
            const blurVar = 7 + (slot.id % 4)
            return (
              <motion.div key={slot.id} {...fadeUp(0.1 + i * 0.06)} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(229,57,53,0.06)',
                borderRadius: 14, overflow: 'hidden', position: 'relative',
              }}>
                {/* Shimmer */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden', borderRadius: 14 }}>
                  <div style={{
                    position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 52%, transparent 60%)',
                    animation: `shine ${6 + i}s ease-in-out infinite`,
                    animationDelay: `${i * 0.8}s`,
                  }} />
                </div>

                {/* Image */}
                <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
                  {slot.image && (
                    <img src={slot.image} alt="" style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                      filter: `blur(${blurVar}px) brightness(0.55) saturate(0.5)`,
                    }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3))', zIndex: 1 }} />

                  {/* Badges */}
                  <span style={{
                    position: 'absolute', top: 7, left: 7, zIndex: 3, padding: '3px 7px', borderRadius: 5,
                    background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase',
                  }}>{slot.provider.toUpperCase()}</span>
                  <span style={{
                    position: 'absolute', top: 7, right: 7, zIndex: 3, padding: '3px 7px', borderRadius: 5,
                    background: `${lvColor}18`, border: `1px solid ${lvColor}30`,
                    fontSize: 8, fontWeight: 700, color: lvColor, textTransform: 'uppercase',
                  }}>ALTA</span>

                  {/* Lock */}
                  <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                </div>

                {/* Skeleton */}
                <div style={{ padding: '10px 10px 8px' }}>
                  <div style={{ height: 10, width: '65%', borderRadius: 3, backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)', animation: 'shimmer 2.5s ease-in-out infinite' }} />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Reinforcement text */}
        <p style={{ fontSize: 12, color: 'var(--t4)', textAlign: 'center', marginBottom: 20, lineHeight: 1.5, maxWidth: 380, margin: '0 auto 20px' }}>
          Voce esta vendo apenas uma versao limitada. Slots com maior performance nao ficam visiveis para contas gratuitas.
        </p>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/billing" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 14,
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            background: 'linear-gradient(135deg, #e53935, #c62828)', color: '#fff',
            boxShadow: '0 6px 24px rgba(229,57,53,0.25)',
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Desbloquear Slots Premium
          </Link>
        </div>
      </motion.div>

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

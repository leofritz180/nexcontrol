'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase/client'

const ease = [0.33,1,0.68,1]
const fadeUp = (d=0) => ({initial:{opacity:0,y:20},whileInView:{opacity:1,y:0},viewport:{once:true},transition:{duration:0.5,delay:d,ease}})

const NOTIFS = [
  { name:'Pedro', value:95, delay:0 },
  { name:'Ana', value:147, delay:4 },
  { name:'Lucas', value:68, delay:8 },
  { name:'Maria', value:32, delay:12 },
  { name:'Carlos', value:120, delay:16 },
]

function PhoneSection() {
  const [idx, setIdx] = useState(0)
  const [total, setTotal] = useState(3058)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % NOTIFS.length
      setIdx(i)
      setTotal(prev => prev + NOTIFS[i].value)
      setFlash(true)
      setTimeout(() => setFlash(false), 600)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const current = NOTIFS[idx]

  return (
    <section style={{ padding:'100px 24px', maxWidth:1000, margin:'0 auto', position:'relative' }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute', top:'30%', right:'15%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.05), transparent 60%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
        {/* Text */}
        <motion.div {...fadeUp()}>
          <h2 style={{ fontSize:32, fontWeight:900, color:'var(--t1)', margin:'0 0 14px', letterSpacing:'-0.03em', lineHeight:1.15 }}>
            Veja seu lucro chegando<br/>em tempo real
          </h2>
          <p style={{ fontSize:16, color:'var(--t3)', lineHeight:1.6, margin:'0 0 32px' }}>
            Cada remessa registrada vira uma notificacao no seu celular. Simples assim.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              {t:'Notificacao instantanea', d:'Saiba na hora quando dinheiro entra ou sai'},
              {t:'Lucro atualizado ao vivo', d:'O dashboard muda a cada operacao'},
              {t:'Instale em 2 toques', d:'Funciona como app nativo no iPhone e Android'},
            ].map(({t,d}) => (
              <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" style={{ marginTop:3, flexShrink:0 }}><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'var(--t1)', margin:'0 0 3px' }}>{t}</p>
                  <p style={{ fontSize:12, color:'var(--t3)', margin:0 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* iPhone */}
        <motion.div {...fadeUp(0.2)} style={{ display:'flex', justifyContent:'center', perspective:800 }}>
          <div style={{
            width:260, borderRadius:36, padding:'10px 8px 14px',
            background:'linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 30%, #111 100%)',
            border:'1.5px solid rgba(255,255,255,0.12)',
            boxShadow:'0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
            position:'relative', transform:'rotateY(-3deg) rotateX(2deg)',
          }}>
            {/* Dynamic Island */}
            <div style={{ width:90, height:24, borderRadius:12, background:'#000', margin:'0 auto 8px', border:'1px solid rgba(255,255,255,0.08)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:20, top:8, width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
            </div>

            {/* Screen */}
            <div style={{ borderRadius:22, overflow:'hidden', background:'#060a12', position:'relative' }}>
              {/* Green flash on notification */}
              <AnimatePresence>
                {flash && (
                  <motion.div
                    initial={{ opacity:0.15 }} animate={{ opacity:0 }}
                    exit={{ opacity:0 }} transition={{ duration:0.6 }}
                    style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 20%, rgba(34,197,94,0.2), transparent 60%)', zIndex:5, pointerEvents:'none' }}
                  />
                )}
              </AnimatePresence>

              {/* iOS Notification dropping in */}
              <div style={{ padding:'8px 10px 0', position:'relative', zIndex:4 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity:0, y:-40, scale:0.95 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:-20, scale:0.97 }}
                    transition={{ duration:0.4, ease:[0.33,1,0.68,1] }}
                    style={{
                      padding:'10px 12px', borderRadius:14,
                      background:'rgba(255,255,255,0.08)',
                      backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                      border:'1px solid rgba(255,255,255,0.06)',
                      marginBottom:8,
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:18, height:18, borderRadius:5, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width={8} height={8} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>NexControl</span>
                          <span style={{ fontSize:6, color:'rgba(255,255,255,0.25)' }}>agora</span>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize:8, color:'rgba(255,255,255,0.5)', margin:0, paddingLeft:26 }}>
                      Lucro na remessa: <span style={{ color:'#22C55E', fontWeight:700 }}>+R$ {current.value},00</span>
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* App content */}
              <div style={{ padding:'4px 12px 16px' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                  <div style={{ width:16, height:16, borderRadius:5, background:'#e53935' }}/>
                  <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.45)' }}>NexControl</span>
                </div>

                {/* KPI — updates live */}
                <motion.div
                  animate={flash ? { scale:[1,1.02,1] } : {}}
                  transition={{ duration:0.3 }}
                  style={{ padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)', marginBottom:10, position:'relative', overflow:'hidden' }}>
                  <p style={{ fontSize:7, color:'rgba(255,255,255,0.3)', margin:'0 0 5px' }}>Lucro total</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:900, color:'#22C55E', margin:0,
                    textShadow: flash ? '0 0 20px rgba(34,197,94,0.3)' : 'none', transition:'text-shadow 0.3s',
                  }}>
                    +R$ {total.toLocaleString('pt-BR')}
                  </p>
                  {/* Green glow pulse */}
                  {flash && <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%, rgba(34,197,94,0.08), transparent 60%)', pointerEvents:'none' }}/>}
                </motion.div>

                {/* Recent items */}
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {NOTIFS.slice(0,3).map((n,i) => (
                    <div key={n.name} style={{ padding:'5px 2px', borderBottom:'1px solid rgba(255,255,255,0.03)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:14, height:14, borderRadius:4, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontSize:6, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>{n.name[0]}</span>
                        </div>
                        <span style={{ fontSize:7, color:'rgba(255,255,255,0.35)' }}>{n.name}</span>
                      </div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:8, fontWeight:700, color:'#22C55E' }}>+R$ {n.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Home indicator */}
            <div style={{ width:70, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)', margin:'10px auto 0' }}/>

            {/* Glass reflection */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'45%', borderRadius:'36px 36px 0 0', background:'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)', pointerEvents:'none' }}/>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) router.push('/operator')
      else setChecking(false)
    })
  }, [])

  if (checking) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" style={{ width:24, height:24, borderTopColor:'var(--t1)' }}/>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1, overflow:'hidden' }}>

      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', position:'relative' }}>
        {/* Ambient */}
        <div style={{ position:'absolute', top:'-10%', left:'20%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.06), transparent 60%)', filter:'blur(80px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'0%', right:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.04), transparent 60%)', filter:'blur(60px)', pointerEvents:'none' }}/>

        <motion.div {...fadeUp(0)} style={{ maxWidth:700, position:'relative', zIndex:1 }}>
          {/* Logo */}
          <motion.div
            animate={{ boxShadow:['0 0 30px rgba(229,57,53,0.2)','0 0 50px rgba(229,57,53,0.4)','0 0 30px rgba(229,57,53,0.2)'] }}
            transition={{ duration:3, repeat:Infinity }}
            style={{ width:64, height:64, borderRadius:18, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 32px' }}>
            <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
              <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
              <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
              <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
            </svg>
          </motion.div>

          <h1 style={{ fontSize:48, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, color:'var(--t1)', margin:'0 0 16px' }}>
            Controle cada centavo<br/>da sua operacao
          </h1>
          <p style={{ fontSize:18, color:'var(--t2)', lineHeight:1.6, margin:'0 0 40px', maxWidth:520, marginLeft:'auto', marginRight:'auto' }}>
            Metas, remessas, operadores e lucro em um unico painel premium. Acompanhe tudo em tempo real. No computador e no celular.
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:220, justifyContent:'center', fontSize:16, fontWeight:700 }}>
              Comecar agora
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg" style={{ minWidth:180, justifyContent:'center', fontSize:14 }}>
              Ja tenho conta
            </Link>
          </div>

          <motion.div {...fadeUp(0.3)} style={{ display:'flex', gap:32, justifyContent:'center', marginTop:48 }}>
            {[
              {v:'3 dias',l:'teste gratis'},
              {v:'Tempo real',l:'atualizacao 30s'},
              {v:'App celular',l:'iPhone e Android'},
            ].map(({v,l}) => (
              <div key={v} style={{ textAlign:'center' }}>
                <p style={{ fontSize:16, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{v}</p>
                <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:0.3, y:[0,8,0] }}
          transition={{ opacity:{delay:2,duration:0.5}, y:{duration:2,repeat:Infinity,ease:'easeInOut'} }}
          style={{ marginTop:40, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em' }}>DESCUBRA MAIS</span>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div {...fadeUp(0.5)} style={{ maxWidth:700, width:'100%', margin:'60px auto 0', position:'relative', zIndex:1 }}>
          <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', background:'linear-gradient(145deg, #0c1424, #080e1a)', padding:'20px 24px 24px' }}>
            {/* Fake header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:20, height:20, borderRadius:5, background:'#e53935' }}/>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Painel executivo</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[6,6,6].map((_,i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }}/>)}
              </div>
            </div>
            {/* Fake KPI cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:12, marginBottom:12 }}>
              <div style={{ padding:'18px 20px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.3)', margin:'0 0 8px' }}>Lucro final acumulado</p>
                <p style={{ fontFamily:'var(--mono)', fontSize:28, fontWeight:900, color:'#22C55E', margin:0 }}>+R$ 3.058,47</p>
                <p style={{ fontSize:8, color:'rgba(255,255,255,0.2)', marginTop:6 }}>11 metas fechadas</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[{l:'Depositado',v:'R$ 57.581'},{l:'Sacado',v:'R$ 51.330'},{l:'Metas',v:'20'}].map(({l,v}) => (
                  <div key={l} style={{ flex:1, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:8, color:'rgba(255,255,255,0.25)' }}>{l}</span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Fake list */}
            <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.3)', margin:'0 0 10px' }}>Remessas recentes</p>
              {[{n:'Pedro',v:'+R$ 95,00',g:true},{n:'Lucas',v:'-R$ 18,00',g:false},{n:'Ana',v:'+R$ 145,00',g:true}].map(({n,v,g}) => (
                <div key={n} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>{n[0]}</span>
                    </div>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)' }}>{n}</span>
                  </div>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:g?'#22C55E':'#EF4444' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Shadow glow below mockup */}
          <div style={{ position:'absolute', bottom:-30, left:'20%', right:'20%', height:60, background:'radial-gradient(ellipse, rgba(229,57,53,0.08), transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }}/>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          RESULTADO / LUCRO
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', textAlign:'center' }}>
        <motion.div {...fadeUp()} style={{ maxWidth:600, margin:'0 auto' }}>
          <p style={{ fontSize:12, color:'var(--t3)', letterSpacing:'0.15em', marginBottom:16, fontWeight:600 }}>RESULTADO REAL</p>
          <motion.p
            animate={{ scale:[1,1.015,1] }}
            transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}
            style={{ fontFamily:'var(--mono)', fontSize:64, fontWeight:900, color:'#22C55E', lineHeight:1, margin:'0 0 12px',
              textShadow:'0 0 60px rgba(34,197,94,0.2), 0 0 120px rgba(34,197,94,0.1)',
            }}>
            +R$ 3.058,47
          </motion.p>
          <p style={{ fontSize:15, color:'var(--t3)', lineHeight:1.5 }}>
            Lucro real registrado na plataforma. Cada centavo rastreado, cada meta fechada com custos descontados.
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          DIFERENCIAIS
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:1100, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:32, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Tudo que voce precisa em um lugar</h2>
          <p style={{ fontSize:15, color:'var(--t3)', maxWidth:500, margin:'0 auto' }}>Pare de perder tempo com planilhas. Controle sua operacao como um profissional.</p>
        </motion.div>

        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            {icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', t:'Dashboard premium', d:'Lucro, prejuizo, metas e operadores em tempo real'},
            {icon:'M13 2L3 14h9l-1 8 10-12h-9l1-8z', t:'Controle ao vivo', d:'Atualizacao automatica a cada 30 segundos'},
            {icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', t:'Notificacoes push', d:'Receba alertas no celular quando operadores registram'},
            {icon:'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', t:'App no celular', d:'Instale como app no iPhone e Android'},
            {icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0', t:'Equipe completa', d:'Admin + operadores com permissoes separadas'},
            {icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', t:'Fechamento inteligente', d:'Salario, custos e taxa do agente no lucro final'},
            {icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', t:'PIX integrado', d:'Pagamento via PIX com QR code automatico'},
            {icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', t:'Multi-tenant seguro', d:'Cada admin isolado com dados protegidos'},
          ].map(({icon,t,d},i) => (
            <motion.div key={i} {...fadeUp(i*0.05)}
              whileHover={{ y:-3, transition:{duration:0.2} }}
              style={{ padding:'24px 22px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:14 }}>
                <path d={icon}/>
              </svg>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--t1)', margin:'0 0 6px' }}>{t}</h3>
              <p style={{ fontSize:12, color:'var(--t3)', margin:0, lineHeight:1.5 }}>{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          FUNCOES PRO
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:1100, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ fontSize:11, fontWeight:700, padding:'4px 14px', borderRadius:6, background:'rgba(229,57,53,0.1)', color:'#ff4444', border:'1px solid rgba(229,57,53,0.2)', letterSpacing:'0.1em' }}>PRO</span>
          <h2 style={{ fontSize:32, fontWeight:800, color:'var(--t1)', margin:'16px 0 12px', letterSpacing:'-0.03em' }}>Leve sua operacao para outro nivel</h2>
          <p style={{ fontSize:15, color:'var(--t3)', maxWidth:500, margin:'0 auto' }}>Recursos exclusivos que transformam dados em decisoes.</p>
        </motion.div>

        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            {t:'Inteligencia da operacao', d:'Insights automaticos sobre lucro, tendencia e pontos de atencao', icon:'M13 10V3L4 14h7v7l9-11h-7z'},
            {t:'Ranking de redes', d:'Saiba quais redes geram mais lucro e quais estao caindo', icon:'M3 4h18M3 8h12M3 12h18M3 16h8M3 20h14'},
            {t:'Modo apresentacao', d:'Video cinematografico do resultado pra compartilhar', icon:'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'},
            {t:'Previsao de resultado', d:'Projecao inteligente baseada no ritmo da operacao', icon:'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'},
            {t:'Alertas estrategicos', d:'Notificacoes automaticas sobre queda de performance', icon:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5'},
            {t:'Exportacao premium', d:'Imagem e video do resultado pra Instagram e WhatsApp', icon:'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'},
          ].map(({t,d,icon},i) => (
            <motion.div key={i} {...fadeUp(i*0.06)}
              whileHover={{ y:-3, borderColor:'rgba(229,57,53,0.2)', transition:{duration:0.2} }}
              style={{ position:'relative', padding:'28px 24px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.3)', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:12, right:12, fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:5, background:'rgba(229,57,53,0.1)', color:'#ff4444', border:'1px solid rgba(229,57,53,0.15)' }}>PRO</div>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:14, opacity:0.7 }}>
                <path d={icon}/>
              </svg>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--t1)', margin:'0 0 6px' }}>{t}</h3>
              <p style={{ fontSize:12, color:'var(--t3)', margin:0, lineHeight:1.5 }}>{d}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp(0.3)} style={{ textAlign:'center', marginTop:32 }}>
          <Link href="/billing" className="btn btn-brand btn-lg" style={{ minWidth:240, justifyContent:'center', fontSize:15, fontWeight:700 }}>
            Desbloquear plano PRO
          </Link>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          APP NO CELULAR — dopamine section
      ═══════════════════════════════════ */}
      <PhoneSection/>

      {/* ═══════════════════════════════════
          PROVA SOCIAL
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:900, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:40 }}>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Quem usa, nao volta pra planilha</h2>
        </motion.div>

        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[
            {q:'Agora consigo controlar tudo em um lugar so. Nao volto pra planilha.', n:'R. Silva'},
            {q:'O app no celular mudou minha rotina. Recebo tudo em tempo real.', n:'M. Costa'},
            {q:'Visual premium e controle real. Minha equipe toda usa.', n:'L. Santos'},
          ].map(({q,n},i) => (
            <motion.div key={i} {...fadeUp(i*0.1)}
              style={{ padding:'24px 22px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.6, margin:'0 0 16px', fontStyle:'italic' }}>"{q}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:'var(--raised)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--t2)' }}>{n[0]}</span>
                </div>
                <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>{n}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          PLANOS PRO
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px', maxWidth:860, margin:'0 auto' }}>
        <motion.div {...fadeUp()} style={{ textAlign:'center', marginBottom:16 }}>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Escolha como usar o PRO</h2>
          <p style={{ fontSize:14, color:'var(--t3)', margin:0 }}>Teste gratuito de 3 dias em todos os planos. Acesso completo.</p>
        </motion.div>

        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1.15fr', gap:16, marginTop:32 }}>

          {/* PRO Solo */}
          <motion.div {...fadeUp(0)}
            whileHover={{ y:-4, transition:{duration:0.2} }}
            style={{ padding:'36px 30px', borderRadius:18, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.06)', transition:'all 0.25s ease' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--t2)', marginBottom:16, letterSpacing:'0.1em' }}>PRO SOLO</p>
            <p style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:900, color:'var(--t1)', margin:'0 0 4px' }}>R$ 39,90<span style={{ fontSize:14, fontWeight:500, color:'var(--t3)' }}>/mes</span></p>
            <p style={{ fontSize:13, color:'var(--t3)', marginBottom:28 }}>Para quem opera sozinho com controle total</p>
            {['Dashboard completo','Metas e fechamento inteligente','Remessas ilimitadas','Notificacoes em tempo real','App no celular','PIX integrado'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize:12, color:'var(--t2)' }}>{f}</span>
              </div>
            ))}
            <Link href="/signup" className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', marginTop:28, fontWeight:600 }}>
              Comecar 3 dias gratis
            </Link>
          </motion.div>

          {/* PRO Equipe — DESTAQUE */}
          <motion.div {...fadeUp(0.1)}
            whileHover={{ y:-4, boxShadow:'0 0 50px rgba(229,57,53,0.1)', transition:{duration:0.2} }}
            style={{ padding:'36px 30px', borderRadius:18, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(229,57,53,0.22)', position:'relative', boxShadow:'0 0 30px rgba(229,57,53,0.05)', transition:'all 0.25s ease' }}>

            <motion.div
              animate={{ boxShadow:['0 0 8px rgba(229,57,53,0.3)','0 0 16px rgba(229,57,53,0.5)','0 0 8px rgba(229,57,53,0.3)'] }}
              transition={{ duration:3, repeat:Infinity }}
              style={{ position:'absolute', top:-12, right:20, fontSize:10, fontWeight:700, padding:'5px 14px', borderRadius:7, background:'#e53935', color:'white' }}>
              RECOMENDADO
            </motion.div>

            <p style={{ fontSize:11, fontWeight:700, color:'#ff4444', marginBottom:16, letterSpacing:'0.1em' }}>PRO EQUIPE</p>
            <p style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:900, color:'var(--t1)', margin:'0 0 4px' }}>R$ 39,90<span style={{ fontSize:14, fontWeight:500, color:'var(--t3)' }}>/mes + operadores</span></p>
            <p style={{ fontSize:13, color:'var(--t3)', marginBottom:28 }}>Para escalar sua operacao com equipe</p>
            {['Tudo do PRO Solo','Operadores ilimitados','Inteligencia da operacao','Ranking de redes','Modo apresentacao','Exportacao premium','Previsoes e alertas','Prioridade em novidades'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize:12, color:'var(--t1)' }}>{f}</span>
              </div>
            ))}
            <Link href="/billing" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', marginTop:28, fontWeight:700, fontSize:15 }}>
              Ativar plano PRO
            </Link>
          </motion.div>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--t4)', marginTop:20 }}>
          Sem plano gratuito. Teste completo por 3 dias em qualquer plano.
        </p>
      </section>

      {/* ═══════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════ */}
      <section style={{ padding:'80px 24px 100px', textAlign:'center' }}>
        <motion.div {...fadeUp()}>
          <h2 style={{ fontSize:32, fontWeight:800, color:'var(--t1)', margin:'0 0 12px', letterSpacing:'-0.03em' }}>Pronto pra ter controle total?</h2>
          <p style={{ fontSize:15, color:'var(--t3)', marginBottom:32 }}>3 dias gratis. Sem cartao. Cancele quando quiser.</p>
          <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:260, justifyContent:'center', fontSize:16, fontWeight:700 }}>
            Comecar agora
          </Link>
        </motion.div>

        <div style={{ marginTop:48, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width={12} height={12} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Nex<span style={{ color:'#ff4444' }}>Control</span></span>
        </div>
        <p style={{ fontSize:11, color:'var(--t4)', marginTop:8 }}>Sistema operacional de resultados</p>
      </section>
    </main>
  )
}

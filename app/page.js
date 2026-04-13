'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import Logo, { NexIcon } from '../components/Logo'

const ease = [0.33,1,0.68,1]

const DEMO_OPS = [
  { name:'Pedro', value:132 },
  { name:'Ana', value:95 },
  { name:'Lucas', value:47 },
  { name:'Maria', value:68 },
  { name:'Carlos', value:120 },
]

const FEED_EVENTS = [
  { text:'Carlos registrou +R$ 120', color:'#22C55E' },
  { text:'Meta concluida com sucesso', color:'#22C55E' },
  { text:'Novo operador ativo', color:'#e53935' },
  { text:'+R$ 68 registrado agora', color:'#22C55E' },
  { text:'Pedro finalizou meta', color:'#22C55E' },
  { text:'Ana registrou +R$ 95', color:'#22C55E' },
  { text:'Nova remessa processada', color:'#e53935' },
]

const STATUS_LINES = [
  'Operacao sendo atualizada em tempo real',
  'Dados sendo processados agora',
  'Nova atividade detectada',
]

/* ── Count-up with glow + pulse ── */
function SocialProofNumber({ target, suffix, active }) {
  const [val, setVal] = useState(0)
  const [done, setDone] = useState(false)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const dur = 1800, start = performance.now()
    const tick = now => {
      const t = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setVal(Math.round(target * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setDone(true)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, target])

  const display = target >= 1000000
    ? `${(val / 1000000).toFixed(val < target ? 1 : 0)}`
    : target >= 1000 ? val.toLocaleString('pt-BR') : String(val)

  const glowOpacity = active && !done ? 0.18 : done ? 0.06 : 0

  return (
    <motion.p
      animate={done ? { scale:[1, 1.02, 1] } : {}}
      transition={done ? { duration:3, repeat:Infinity, ease:'easeInOut' } : {}}
      style={{
        fontSize:36, fontWeight:900, color:'#fff', margin:0,
        fontFamily:'var(--mono, "JetBrains Mono", monospace)',
        letterSpacing:'-0.03em',
        textShadow:`0 0 ${active ? 25 : 0}px rgba(255,255,255,${glowOpacity})`,
        transition:'text-shadow 0.6s ease',
      }}
    >
      {display}{suffix}
    </motion.p>
  )
}

/* ── Live feed (events appearing one by one) ── */
function LiveFeed({ active }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => {
      setIndex(prev => (prev + 1) % FEED_EVENTS.length)
    }, 2500)
    return () => clearInterval(iv)
  }, [active])

  if (!active) return null
  const ev = FEED_EVENTS[index]

  return (
    <div style={{ minHeight:24, display:'flex', alignItems:'center', justifyContent:'center', marginTop:20 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-10 }}
          transition={{ duration:0.35 }}
          style={{ display:'flex', alignItems:'center', gap:8 }}
        >
          <span style={{ width:6, height:6, borderRadius:'50%', background:ev.color, boxShadow:`0 0 8px ${ev.color}44`, flexShrink:0 }} />
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>{ev.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ── Dynamic status text ── */
function StatusLine({ active }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => {
      setIndex(prev => (prev + 1) % STATUS_LINES.length)
    }, 3000)
    return () => clearInterval(iv)
  }, [active])

  if (!active) return null

  return (
    <div style={{ minHeight:20, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:16 }}>
      <motion.span
        animate={{ opacity:[0.4, 1, 0.4] }}
        transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
        style={{ width:5, height:5, borderRadius:'50%', background:'#e53935', boxShadow:'0 0 6px rgba(229,57,53,0.4)' }}
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity:0 }}
          animate={{ opacity:0.4 }}
          exit={{ opacity:0 }}
          transition={{ duration:0.4 }}
          style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:500, letterSpacing:'0.02em' }}
        >
          {STATUS_LINES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

/* ── Social Proof Section (viewport-triggered) ── */
function SocialProofSection() {
  const [active, setActive] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setActive(true); obs.disconnect() }
    }, { threshold: 0.3 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  const stats = [
    { target: 400, suffix: '+', label: 'Operadores ativos' },
    { target: 1, suffix: 'M+', label: 'Monitorados em operacoes' },
    { target: 3000, suffix: '+', label: 'Metas analisadas' },
  ]

  return (
    <section ref={sectionRef} style={{ padding:'48px 24px 40px', maxWidth:800, margin:'0 auto', textAlign:'center', position:'relative' }}>

      {/* HUD scan line */}
      {active && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, bottom:0,
          pointerEvents:'none', overflow:'hidden', borderRadius:20,
        }}>
          <div style={{
            position:'absolute', left:0, right:0, height:1,
            background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
            animation:'hudScan 4s linear infinite',
          }} />
        </div>
      )}

      <style>{`
        @keyframes hudScan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <motion.p
        initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
        transition={{ duration:0.4 }}
        style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.4)', letterSpacing:'0.06em', marginBottom:28 }}
      >
        QUEM USA NEXCONTROL JA TEM CONTROLE REAL DA OPERACAO:
      </motion.p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }} className="g-4">
        {stats.map(({ target, suffix, label }, i) => (
          <motion.div
            key={i}
            initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            transition={{ duration:0.4, delay:i * 0.15 }}
            whileHover={{ y:-4, transition:{ duration:0.2 } }}
            style={{
              padding:'24px 18px', borderRadius:16, position:'relative', overflow:'hidden',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)',
              cursor:'default', transition:'box-shadow 0.3s, border-color 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow='none' }}
          >
            <SocialProofNumber target={target} suffix={suffix} active={active} />
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:'8px 0 0', fontWeight:500 }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Live feed */}
      <LiveFeed active={active} />

      {/* Dynamic status text */}
      <StatusLine active={active} />
    </section>
  )
}

function LiveDashboardDemo() {
  const [total, setTotal] = useState(3058)
  const [idx, setIdx] = useState(0)
  const [flash, setFlash] = useState(false)
  const [feed, setFeed] = useState([
    { n:'Pedro', v:95, g:true },
    { n:'Lucas', v:18, g:false },
    { n:'Ana', v:145, g:true },
  ])

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      i = (i+1) % DEMO_OPS.length
      const op = DEMO_OPS[i]
      setIdx(i)
      setTotal(prev => prev + op.value)
      setFlash(true)
      setFeed(prev => [{ n:op.name, v:op.value, g:true }, ...prev.slice(0,2)])
      setTimeout(() => setFlash(false), 700)
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  const op = DEMO_OPS[idx]

  return (
    <section style={{ padding:'0 24px 80px', maxWidth:700, margin:'0 auto', position:'relative' }}>
      <motion.div
        initial={{ opacity:0, y:30 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }}
        transition={{ duration:0.6, ease }}
        style={{
          borderRadius:16, overflow:'hidden', position:'relative',
          border:'1px solid rgba(255,255,255,0.06)',
          boxShadow:`0 20px 60px rgba(0,0,0,0.5)${flash?', 0 0 40px rgba(34,197,94,0.06)':''}`,
          background:'linear-gradient(145deg, #0c1424, #080e1a)',
          padding:'20px 24px 24px',
          transition:'box-shadow 0.5s ease',
        }}
      >
        {/* Green flash */}
        <AnimatePresence>
          {flash && (
            <motion.div initial={{opacity:0.12}} animate={{opacity:0}} exit={{opacity:0}} transition={{duration:0.7}}
              style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 30%, rgba(34,197,94,0.12), transparent 60%)', zIndex:5, pointerEvents:'none' }}/>
          )}
        </AnimatePresence>

        {/* Notification dropping */}
        <div style={{ position:'relative', zIndex:6, marginBottom:12 }}>
          <AnimatePresence mode="wait">
            <motion.div key={idx}
              initial={{ opacity:0, y:-35, scale:0.94 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-15, scale:0.97 }}
              transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
              style={{
                padding:'10px 14px', borderRadius:12,
                background:'rgba(255,255,255,0.06)',
                backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                border:'1px solid rgba(255,255,255,0.06)',
                display:'flex', alignItems:'center', gap:10,
                boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
              }}>
              <div style={{ width:20, height:20, borderRadius:6, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <NexIcon size={9}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.65)' }}>NexControl</span>
                  <span style={{ fontSize:7, color:'rgba(255,255,255,0.2)' }}>agora</span>
                </div>
                <p style={{ fontSize:9, color:'rgba(255,255,255,0.45)', margin:'3px 0 0' }}>
                  {op.name} registrou: <span style={{ color:'#22C55E', fontWeight:700 }}>+R$ {op.value},00</span>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:18, height:18, borderRadius:5, background:'#e53935' }}/>
            <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Painel executivo</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <motion.div animate={{ boxShadow:['0 0 0 0 rgba(34,197,94,0.5)','0 0 0 4px rgba(34,197,94,0)','0 0 0 0 rgba(34,197,94,0)'] }}
              transition={{ duration:2, repeat:Infinity }}
              style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E' }}/>
            <span style={{ fontSize:8, color:'rgba(255,255,255,0.2)' }}>ao vivo</span>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:12, marginBottom:12 }}>
          <motion.div
            animate={flash ? { scale:[1,1.02,1] } : {}}
            transition={{ duration:0.3 }}
            style={{ padding:'18px 20px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)', position:'relative', overflow:'hidden' }}
          >
            <p style={{ fontSize:9, color:'rgba(255,255,255,0.3)', margin:'0 0 8px' }}>Lucro final acumulado</p>
            <p style={{
              fontFamily:'var(--mono)', fontSize:28, fontWeight:900, color:'#22C55E', margin:0,
              textShadow: flash ? '0 0 20px rgba(34,197,94,0.25)' : 'none',
              transition:'text-shadow 0.3s',
            }}>
              +R$ {total.toLocaleString('pt-BR')},47
            </p>
            <p style={{ fontSize:8, color:'rgba(255,255,255,0.2)', marginTop:6 }}>metas fechadas</p>
            {flash && <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%, rgba(34,197,94,0.06), transparent 60%)', pointerEvents:'none' }}/>}
          </motion.div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[{l:'Depositado',v:'R$ 57.581'},{l:'Sacado',v:'R$ 51.330'},{l:'Metas',v:'20'}].map(({l,v}) => (
              <div key={l} style={{ flex:1, padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:8, color:'rgba(255,255,255,0.25)' }}>{l}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live feed */}
        <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.3)', margin:'0 0 10px' }}>Remessas recentes</p>
          <AnimatePresence>
            {feed.map((item,i) => (
              <motion.div key={item.n+item.v+i}
                initial={{ opacity:0, x:-20 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.3 }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:i<2?'1px solid rgba(255,255,255,0.03)':'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:8, fontWeight:700, color:'rgba(255,255,255,0.3)' }}>{item.n[0]}</span>
                  </div>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)' }}>{item.n}</span>
                </div>
                <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:item.g?'#22C55E':'#EF4444' }}>{item.g?'+':'-'}R$ {item.v},00</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Shadow glow */}
      <div style={{ position:'absolute', bottom:-20, left:'25%', right:'25%', height:40, background:'radial-gradient(ellipse, rgba(34,197,94,0.05), transparent 70%)', filter:'blur(15px)', pointerEvents:'none' }}/>
    </section>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) router.push('/admin')
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

      {/* Ambient */}
      <div style={{ position:'fixed', top:'-10%', left:'20%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.04), transparent 55%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'5%', right:'15%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.03), transparent 55%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', position:'relative' }}>

        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6, ease }}
          style={{ maxWidth:580, position:'relative', zIndex:1 }}
        >
          {/* Logo */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:28 }}>
            <Logo size={1.88} showText={false} glow/>
          </div>

          <motion.h1
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.15, ease }}
            style={{ fontSize:40, fontWeight:900, letterSpacing:'-0.04em', color:'var(--t1)', margin:'0 0 14px', lineHeight:1.12 }}
          >
            Voce nao sabe se esta lucrando de verdade.
          </motion.h1>

          <motion.p
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.25, ease }}
            style={{ fontSize:16, color:'var(--t2)', marginBottom:16, lineHeight:1.6 }}
          >
            Controle depositantes, metas e resultado em tempo real — sem operar no escuro.
          </motion.p>

          <motion.p
            initial={{ opacity:0, y:6 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.3, ease }}
            style={{ fontSize:14, color:'var(--t3)', marginBottom:36, lineHeight:1.6 }}
          >
            Acompanhe cada remessa, receba alertas e veja exatamente onde esta o lucro ou prejuizo da sua operacao.
          </motion.p>

          <motion.div
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.35, ease }}
            style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}
          >
            <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:220, justifyContent:'center', fontSize:15, fontWeight:700 }}>
              Comecar agora
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg" style={{ minWidth:180, justifyContent:'center', fontSize:14 }}>
              Ja tenho conta
            </Link>
          </motion.div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12, textAlign: 'center' }}>3 dias gratis • Sem compromisso</p>

          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ duration:0.4, delay:0.5 }}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginTop:40 }}
          >
            {[
              { v:'3 dias', l:'teste gratis' },
              { v:'Tempo real', l:'atualizacao 30s' },
              { v:'App celular', l:'iPhone e Android' },
            ].map(({ v, l }) => (
              <div key={v} style={{ textAlign:'center' }}>
                <p style={{ fontSize:14, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{v}</p>
                <p style={{ fontSize:10, color:'var(--t3)', margin:0 }}>{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1, y:[0,10,0] }}
          transition={{ opacity:{delay:1.5,duration:0.6}, y:{duration:1.8,repeat:Infinity,ease:'easeInOut'} }}
          style={{ position:'absolute', bottom:36, display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer' }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', letterSpacing:'0.12em' }}>VEJA COMO FUNCIONA</span>
          <motion.div
            animate={{ y:[0,5,0] }}
            transition={{ duration:1.2, repeat:Infinity, ease:'easeInOut', delay:0.3 }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ PROVA SOCIAL ═══ */}
      <SocialProofSection />

      {/* ═══ LIVE DASHBOARD DEMO ═══ */}
      <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 20 }}>Veja sua operacao acontecendo em tempo real:</p>
      <LiveDashboardDemo/>

      {/* ═══ 3 PILARES ═══ */}
      <section style={{ padding:'40px 24px 80px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="g-4">
          {[
            { icon:'M13 2L3 14h9l-1 8 10-12h-9l1-8z', t:'Inteligencia em tempo real', d:'Veja o que esta acontecendo na sua operacao agora — nao depois.' },
            { icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0', t:'Equipe com performance', d:'Saiba exatamente quem esta performando e quem esta te fazendo perder dinheiro.' },
            { icon:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', t:'Lucro real, nao estimativa', d:'Pare de operar no achismo. Veja o resultado real da sua operacao.' },
          ].map(({icon,t,d},i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:16 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.4, delay:i*0.1, ease }}
              style={{ padding:'28px 24px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)' }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:16 }}>
                <path d={icon}/>
              </svg>
              <h3 style={{ fontSize:16, fontWeight:700, color:'var(--t1)', margin:'0 0 8px' }}>{t}</h3>
              <p style={{ fontSize:13, color:'var(--t3)', margin:0, lineHeight:1.5 }}>{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ PAIN SECTION ═══ */}
      <motion.div
        initial={{ opacity:0, y:16 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }}
        transition={{ duration:0.4, delay:0.1, ease }}
        style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 24, letterSpacing: '-0.03em' }}>
          Se voce nao controla isso, voce ja perdeu dinheiro:
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, textAlign: 'left', maxWidth: 440, margin: '0 auto 28px' }}>
          {['Depositantes desorganizados', 'Metas sem controle', 'Prejuizo escondido', 'Operacao no feeling', 'Falta de visao real'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--loss)', lineHeight: 1.5 }}>
          Sem controle, qualquer operacao vira prejuizo invisivel.
        </p>
      </motion.div>

      {/* ═══ CTA FINAL ═══ */}
      <section style={{ padding:'40px 24px 80px', textAlign:'center' }}>
        <motion.div
          initial={{ opacity:0 }}
          whileInView={{ opacity:1 }}
          viewport={{ once:true }}
          transition={{ duration:0.5 }}
        >
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:'0 0 10px', letterSpacing:'-0.03em' }}>Pare de operar no escuro.</h2>
          <p style={{ fontSize:14, color:'var(--t3)', marginBottom:28 }}>Comece a ver sua operacao como ela realmente e.</p>
          <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:240, justifyContent:'center', fontSize:15, fontWeight:700 }}>
            Comecar agora
          </Link>
        </motion.div>

        <div style={{ marginTop:48, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Logo size={0.75} textSize={13} style={{ gap:8, opacity:0.4 }}/>
        </div>
        <p style={{ fontSize:10, color:'var(--t4)', marginTop:6 }}>Sistema operacional de resultados</p>
      </section>
    </main>
  )
}

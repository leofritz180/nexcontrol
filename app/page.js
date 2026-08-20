'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import Logo, { NexIcon } from '../components/Logo'
import CursorSpotlight from '../components/marketing/CursorSpotlight'
import SpotlightCard from '../components/marketing/SpotlightCard'

const ease = [0.33,1,0.68,1]

const DEMO_OPS = [
  { name:'Pedro', value:132 },
  { name:'Ana', value:95 },
  { name:'Lucas', value:47 },
  { name:'Maria', value:68 },
  { name:'Carlos', value:120 },
]

const FEED_EVENTS = [
  { text:'Carlos registrou +R$ 120', color:'var(--profit)' },
  { text:'Meta concluida com sucesso', color:'var(--profit)' },
  { text:'Novo operador ativo', color:'#e53935' },
  { text:'+R$ 68 registrado agora', color:'var(--profit)' },
  { text:'Pedro finalizou meta', color:'var(--profit)' },
  { text:'Ana registrou +R$ 95', color:'var(--profit)' },
  { text:'Nova remessa processada', color:'#e53935' },
]

const TICKER_ITEMS = [
  '+R$ 120 registrado',
  'Meta concluida',
  'Novo operador ativo',
  '+R$ 68 registrado',
  'Deposito confirmado',
  '+R$ 340 processado',
  'Remessa finalizada',
  '+R$ 95 registrado',
]

const STATUS_LINES = [
  'Operacao sendo atualizada em tempo real',
  'Dados sendo processados agora',
  'Nova atividade detectada',
]

/* ── Count-up with live fluctuation ── */
/* mode: 'up' = only increases, 'fixed' = no fluctuation after count-up */
function SocialProofNumber({ target, suffix, active, mode }) {
  const [val, setVal] = useState(0)
  const [done, setDone] = useState(false)
  const [delta, setDelta] = useState(0)
  const rafRef = useRef(null)
  const flickerRef = useRef(null)

  // Count-up animation
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

  // Live micro-fluctuations after count-up (skip if 'fixed')
  useEffect(() => {
    if (!done || mode === 'fixed') return
    const flicker = () => {
      const change = Math.random() < 0.6 ? 1 : Math.random() < 0.5 ? 2 : 0
      if (change === 0) return
      setDelta(change)
      setVal(prev => prev + change)
      setTimeout(() => setDelta(0), 400)
    }
    flickerRef.current = setInterval(flicker, 2800 + Math.random() * 1200)
    return () => clearInterval(flickerRef.current)
  }, [done, target, mode])

  const display = target >= 1000000
    ? `${(val / 1000000).toFixed(val < target ? 1 : 0)}`
    : target >= 1000 ? val.toLocaleString('pt-BR') : String(val)

  const numColor = delta > 0 ? 'var(--profit)' : '#fff'
  const glowColor = delta > 0 ? 'rgba(209,250,229,0.2)' : 'rgba(255,255,255,0.06)'

  return (
    <motion.p
      animate={done ? { scale:[1, 1.015, 1] } : {}}
      transition={done ? { duration:4, repeat:Infinity, ease:'easeInOut' } : {}}
      style={{
        fontSize:36, fontWeight:900, margin:0,
        fontFamily:'var(--mono, "JetBrains Mono", monospace)',
        letterSpacing:'-0.03em',
        color: numColor,
        textShadow:`0 0 20px ${glowColor}`,
        transition:'color 0.2s ease, text-shadow 0.3s ease',
      }}
    >
      {display}{suffix}
    </motion.p>
  )
}

/* ── Horizontal Ticker (infinite scroll) ── */
function Ticker({ active }) {
  if (!active) return null
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div style={{
      overflow:'hidden', marginTop:24, position:'relative',
      maskImage:'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
      WebkitMaskImage:'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
    }}>
      <div style={{
        display:'flex', gap:32, whiteSpace:'nowrap',
        animation:'tickerScroll 28s linear infinite',
      }}>
        {items.map((text, i) => (
          <span key={i} style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>{text}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Mini Sparkline Chart ── */
function MiniChart({ active }) {
  const [points, setPoints] = useState(() => {
    const pts = []
    let v = 50
    for (let i = 0; i < 30; i++) {
      v += (Math.random() - 0.42) * 8
      v = Math.max(15, Math.min(85, v))
      pts.push(v)
    }
    return pts
  })

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => {
      setPoints(prev => {
        const last = prev[prev.length - 1]
        const next = Math.max(15, Math.min(85, last + (Math.random() - 0.42) * 7))
        return [...prev.slice(1), next]
      })
    }, 1200)
    return () => clearInterval(iv)
  }, [active])

  if (!active) return null

  const w = 200, h = 40
  const step = w / (points.length - 1)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${h - (p / 100) * h}`).join(' ')
  const areaD = d + ` L${w},${h} L0,${h} Z`

  return (
    <div style={{ display:'flex', justifyContent:'center', marginTop:16 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:'visible' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--profit)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--profit)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartGrad)" />
        <path d={d} fill="none" stroke="var(--profit)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter:'drop-shadow(0 0 4px rgba(209,250,229,0.3))' }} />
        {/* Live dot at end */}
        <circle cx={w} cy={h - (points[points.length - 1] / 100) * h} r="2.5" fill="var(--profit)" style={{ filter:'drop-shadow(0 0 6px rgba(209,250,229,0.5))' }}>
          <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

/* ── Live feed with event flash ── */
function LiveFeed({ active }) {
  const [index, setIndex] = useState(0)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!active) return
    const iv = setInterval(() => {
      setFlash(true)
      setIndex(prev => (prev + 1) % FEED_EVENTS.length)
      setTimeout(() => setFlash(false), 350)
    }, 2500)
    return () => clearInterval(iv)
  }, [active])

  if (!active) return null
  const ev = FEED_EVENTS[index]

  return (
    <div style={{ minHeight:24, display:'flex', alignItems:'center', justifyContent:'center', marginTop:20, position:'relative' }}>
      {/* Event flash */}
      {flash && (
        <div style={{
          position:'absolute', inset:'-8px -24px',
          background:`radial-gradient(ellipse, ${ev.color}08, transparent 70%)`,
          pointerEvents:'none', borderRadius:12,
          animation:'eventFlash 0.35s ease-out forwards',
        }} />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-10 }}
          transition={{ duration:0.3 }}
          style={{ display:'flex', alignItems:'center', gap:8, position:'relative', zIndex:1 }}
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
    { target: 400, suffix: '+', label: 'Operadores ativos', mode: 'up' },
    { target: 1, suffix: 'M+', label: 'Monitorados em operacoes', mode: 'fixed' },
    { target: 3000, suffix: '+', label: 'Metas analisadas', mode: 'up' },
  ]

  return (
    <section ref={sectionRef} className="lp-social" style={{ padding:'48px 24px 40px', maxWidth:800, margin:'0 auto', textAlign:'center', position:'relative' }}>

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
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes eventFlash {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
        @media (max-width: 640px) {
          .miniChartWrap { display: none !important; }
        }
      `}</style>

      <motion.p
        initial={{ opacity:0, y:10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
        transition={{ duration:0.4 }}
        className="lp-social-label"
        style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.4)', letterSpacing:'0.06em', marginBottom:28 }}
      >
        QUEM USA NEXCONTROL JA TEM CONTROLE REAL DA OPERACAO:
      </motion.p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }} className="g-4">
        {stats.map(({ target, suffix, label, mode }, i) => (
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
            <SocialProofNumber target={target} suffix={suffix} active={active} mode={mode} />
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:'8px 0 0', fontWeight:500 }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Ticker strip */}
      <Ticker active={active} />

      {/* Mini sparkline chart */}
      <div className="miniChartWrap" style={{ display:'flex', justifyContent:'center' }}>
        <MiniChart active={active} />
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
    <section className="lp-demo-section" style={{ padding:'0 24px 80px', maxWidth:700, margin:'0 auto', position:'relative' }}>
      <motion.div
        initial={{ opacity:0, y:30 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }}
        transition={{ duration:0.6, ease }}
        style={{
          borderRadius:16, overflow:'hidden', position:'relative',
          border:'1px solid rgba(255,255,255,0.06)',
          boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
          background:'linear-gradient(145deg, var(--surface), var(--surface))',
          padding:'20px 24px 24px',
          transition:'box-shadow 0.5s ease',
        }}
      >
        {/* Green flash */}
        <AnimatePresence>
          {flash && (
            <motion.div initial={{opacity:0.12}} animate={{opacity:0}} exit={{opacity:0}} transition={{duration:0.7}}
              style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 30%, rgba(209,250,229,0.12), transparent 60%)', zIndex:5, pointerEvents:'none' }}/>
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
                  {op.name} registrou: <span style={{ color:'var(--profit)', fontWeight:700 }}>+R$ {op.value},00</span>
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
            <motion.div animate={{ boxShadow:['0 0 0 0 rgba(209,250,229,0.5)','0 0 0 4px rgba(209,250,229,0)','0 0 0 0 rgba(209,250,229,0)'] }}
              transition={{ duration:2, repeat:Infinity }}
              style={{ width:6, height:6, borderRadius:'50%', background:'var(--profit)' }}/>
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
              fontFamily:'var(--mono)', fontSize:28, fontWeight:900, color:'var(--profit)', margin:0,
              textShadow: flash ? '0 0 20px rgba(209,250,229,0.25)' : 'none',
              transition:'text-shadow 0.3s',
            }}>
              +R$ {total.toLocaleString('pt-BR')},47
            </p>
            <p style={{ fontSize:8, color:'rgba(255,255,255,0.2)', marginTop:6 }}>metas fechadas</p>
            {flash && <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 50%, rgba(209,250,229,0.06), transparent 60%)', pointerEvents:'none' }}/>}
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
                <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:item.g?'var(--profit)':'var(--loss)' }}>{item.g?'+':'-'}R$ {item.v},00</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Shadow glow */}
      <div style={{ position:'absolute', bottom:-20, left:'25%', right:'25%', height:40, background:'radial-gradient(ellipse, rgba(209,250,229,0.05), transparent 70%)', filter:'blur(15px)', pointerEvents:'none' }}/>
    </section>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data?.session?.user
      if (!u) { setChecking(false); return }
      try {
        const { data: p } = await supabase.from('profiles').select('role,is_team_leader,tenant_id,team').eq('id', u.id).maybeSingle()
        const role = p?.role || 'operator'
        // EQUIPES (DS MENTORIA): líder vai pro painel da equipe
        const isLeader = p?.is_team_leader && p?.tenant_id === '78da0085-9308-41b1-98b1-1e4c44063c51' && p?.team
        router.push(role === 'admin' ? '/admin' : (isLeader ? '/equipe' : '/operator'))
      } catch {
        router.push('/operator')
      }
    })
  }, [])

  if (checking) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" style={{ width:24, height:24, borderTopColor:'var(--t1)' }}/>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1, overflow:'hidden' }}>

      {/* Ambient glow orbs — strong red/green like login page */}
      <div className="lp-ambient" style={{ position:'fixed', top:'-18%', left:'-12%', width:750, height:750, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.18) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none', animation:'lpOrb1 20s ease-in-out infinite' }}/>
      <div className="lp-ambient" style={{ position:'fixed', bottom:'-18%', right:'-10%', width:650, height:650, borderRadius:'50%', background:'radial-gradient(circle, rgba(209,250,229,0.12) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none', animation:'lpOrb2 25s ease-in-out infinite' }}/>
      <div className="lp-ambient" style={{ position:'fixed', top:'40%', right:'10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.08) 0%, transparent 65%)', filter:'blur(70px)', pointerEvents:'none', animation:'lpOrb3 30s ease-in-out infinite' }}/>
      <style>{`
        @keyframes lpOrb1 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(30px,-20px) scale(1.05); } 66% { transform:translate(-20px,15px) scale(0.97); } }
        @keyframes lpOrb2 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(-25px,20px) scale(0.96); } 66% { transform:translate(15px,-10px) scale(1.04); } }
        @keyframes lpOrb3 { 0%,100% { transform:translate(0,0); } 50% { transform:translate(40px,-30px); } }
      `}</style>

      {/* LED difuso vermelho que segue o cursor. zIndex -1 -> atras de TODO o
          conteudo (main e transparente sobre o preto do body). Desktop-only,
          respeita reduced-motion, pointer-events none (nao bloqueia clique). */}
      <CursorSpotlight zIndex={-1} />

      {/* ═══ HERO ═══ */}
      <section className="lp-hero" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', position:'relative' }}>

        <div className="lp-hero-wrap" style={{ maxWidth:640, position:'relative', zIndex:1, animation:'fade-in 0.5s ease both' }}>
          {/* Logo + Brand */}
          <div className="lp-logo" style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:26 }}>
            <Logo size={1.7} showText={false} glow/>
            <h2 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.03em', margin:'12px 0 0', lineHeight:1 }}>
              <span style={{ color:'#F1F5F9' }}>Nex</span><span style={{ color:'#e53935' }}>Control</span>
            </h2>
          </div>

          {/* selo */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:99, background:'rgba(229,57,53,0.1)', border:'1px solid rgba(229,57,53,0.25)', marginBottom:22, animation:'fade-up 0.5s ease 0.05s both' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#e53935', boxShadow:'0 0 8px #e53935' }}/>
            <span style={{ fontSize:11, fontWeight:800, color:'#ff6b6b', letterSpacing:'0.08em', textTransform:'uppercase' }}>O sistema operacional do CPA</span>
          </div>

          <h1 style={{ fontSize:44, fontWeight:900, letterSpacing:'-0.04em', color:'var(--t1)', margin:'0 0 16px', lineHeight:1.08, animation:'fade-up 0.5s ease 0.1s both' }}>
            Sua operação inteira,<br/><span style={{ color:'#e53935' }}>lucrando no controle.</span>
          </h1>

          <p className="lp-sub1" style={{ fontSize:16.5, color:'var(--t2)', marginBottom:34, lineHeight:1.6, animation:'fade-up 0.5s ease 0.2s both', maxWidth:520, marginLeft:'auto', marginRight:'auto' }}>
            Metas, operadores e lucro em tempo real — com <strong style={{ color:'#fff' }}>insights de IA</strong>, <strong style={{ color:'#fff' }}>notificações na hora</strong>, <strong style={{ color:'#fff' }}>Network privilegiado</strong> e <strong style={{ color:'#fff' }}>slots premium</strong>. Tudo num lugar só.
          </p>

          <div className="lp-ctas" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', animation:'fade-up 0.5s ease 0.3s both' }}>
            <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:240, justifyContent:'center', fontSize:15.5, fontWeight:800 }}>
              Assinar agora — 3 dias grátis
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg" style={{ minWidth:160, justifyContent:'center', fontSize:14 }}>
              Já tenho conta
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 12 }}>Ativação na hora via PIX • Cancele quando quiser</p>

          <div className="lp-badges" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginTop:38, flexWrap:'wrap', animation:'fade-in 0.4s ease 0.4s both' }}>
            {[
              { v:'IA', l:'insights automáticos' },
              { v:'Tempo real', l:'push na hora' },
              { v:'Network', l:'comunidade fechada' },
              { v:'App', l:'iPhone e Android' },
            ].map(({ v, l }) => (
              <div key={v} style={{ textAlign:'center' }}>
                <p style={{ fontSize:14, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{v}</p>
                <p style={{ fontSize:10, color:'var(--t3)', margin:0 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-scroll-hint" style={{ position:'absolute', bottom:36, display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', animation:'fade-in 0.6s ease 1.5s both' }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', letterSpacing:'0.12em' }}>TUDO QUE VOCÊ RECEBE</span>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} strokeLinecap="round" style={{ animation:'float 1.8s ease-in-out infinite' }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      {/* ═══ DIFERENCIAIS (grade de benefícios) ═══ */}
      <section className="lp-benefits" style={{ padding:'20px 24px 70px', maxWidth:1040, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <p style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#ff6b6b', margin:'0 0 10px' }}>Tudo incluído no PRO</p>
          <h2 style={{ fontSize:30, fontWeight:900, letterSpacing:'-0.03em', color:'#fff', margin:0, lineHeight:1.15 }}>Muito além de uma planilha.</h2>
        </div>
        <div className="lp-benefits-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            { c:'#e53935', icon:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', t:'Lucro real em tempo real', d:'Cada remessa entra e o resultado da operação se atualiza sozinho. Sem achismo, sem planilha.' },
            { c:'#e53935', icon:'M12 3l1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7L12 3z', t:'Insights de IA', d:'A IA vigia sua operação e te avisa: sequência negativa, prejuízo acima da média, meta parada.' },
            { c:'#e53935', icon:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0', t:'Notificações em tempo real', d:'Push na hora do que importa: meta batida, prejuízo, movimentação da equipe — no celular.' },
            { c:'var(--profit)', icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 0M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', t:'Network privilegiado', d:'Comunidade fechada de admins: troque estratégia, veja resultados reais e cresça junto com os grandes.' },
            { c:'var(--profit)', icon:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', t:'Slots premium', d:'Organize contas e slots no padrão premium — controle visual da operação inteira.' },
            { c:'var(--profit)', icon:'M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z', t:'VIP & Premiações', d:'Aulas VIP, placas de faturamento e status de elite conforme sua operação cresce.' },
          ].map(({ c, icon, t, d }, i) => (
            <SpotlightCard key={i} style={{ padding:'26px 22px', borderRadius:16, background:'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width:42, height:42, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, background:`${c==='var(--profit)'?'rgba(209,250,229,0.1)':'rgba(229,57,53,0.12)'}`, border:`1px solid ${c==='var(--profit)'?'rgba(209,250,229,0.22)':'rgba(229,57,53,0.3)'}` }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
              </div>
              <h3 style={{ fontSize:16.5, fontWeight:800, color:'var(--t1)', margin:'0 0 7px', letterSpacing:'-0.01em' }}>{t}</h3>
              <p style={{ fontSize:13, color:'var(--t3)', margin:0, lineHeight:1.55 }}>{d}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ═══ LIVE DASHBOARD DEMO ═══ */}
      <p className="lp-demo-title" style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 20 }}>Veja sua operação acontecendo em tempo real:</p>
      <LiveDashboardDemo/>

      {/* ═══ PROVA SOCIAL ═══ */}
      <SocialProofSection />

      {/* ═══ PREÇO / PLANO ═══ */}
      <section id="planos" className="lp-pricing" style={{ padding:'50px 24px 70px', maxWidth:560, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <p style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--profit)', margin:'0 0 10px' }}>Comece hoje</p>
          <h2 style={{ fontSize:30, fontWeight:900, letterSpacing:'-0.03em', color:'#fff', margin:0 }}>Um plano. Tudo liberado.</h2>
        </div>

        <div style={{ position:'relative', overflow:'hidden', borderRadius:22, padding:'32px 28px', background:'linear-gradient(180deg, #140707, #080404)', border:'1px solid rgba(229,57,53,0.3)', boxShadow:'0 30px 90px rgba(0,0,0,0.6), 0 0 70px rgba(229,57,53,0.08)' }}>
          <div style={{ position:'absolute', top:0, left:'18%', right:'18%', height:1, background:'linear-gradient(90deg, transparent, #e53935, transparent)' }}/>

          <div style={{ textAlign:'center', marginBottom:22 }}>
            <div style={{ display:'inline-block', padding:'4px 12px', borderRadius:99, background:'rgba(209,250,229,0.1)', border:'1px solid rgba(209,250,229,0.25)', fontSize:11, fontWeight:800, color:'var(--profit)', marginBottom:16 }}>3 DIAS GRÁTIS</div>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:4 }}>
              <span style={{ fontSize:18, fontWeight:700, color:'var(--t3)', marginBottom:8 }}>R$</span>
              <span style={{ fontSize:56, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1 }}>59,90</span>
              <span style={{ fontSize:15, color:'var(--t3)', marginBottom:9 }}>/mês</span>
            </div>
            <p style={{ fontSize:12.5, color:'var(--t3)', margin:'8px 0 0' }}>+ R$ 29,90 por operador · com desconto por volume</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:11, margin:'24px 0 26px' }}>
            {[
              'Lucro e metas em tempo real',
              'Insights de IA + notificações na hora',
              'Network privilegiado (comunidade de admins)',
              'Slots premium e gestão de operadores',
              'Aulas VIP, premiações e status de elite',
              'App no celular (iPhone e Android)',
            ].map((b, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:11 }}>
                <span style={{ flexShrink:0, width:20, height:20, borderRadius:6, background:'rgba(209,250,229,0.12)', border:'1px solid rgba(209,250,229,0.28)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth={3} strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </span>
                <span style={{ fontSize:13.5, color:'rgba(255,255,255,0.82)', fontWeight:500 }}>{b}</span>
              </div>
            ))}
          </div>

          <Link href="/signup" className="btn btn-brand btn-lg" style={{ width:'100%', justifyContent:'center', fontSize:15.5, fontWeight:800 }}>
            Criar conta e começar grátis
          </Link>
          <p style={{ fontSize:11.5, color:'var(--t4)', textAlign:'center', margin:'12px 0 0' }}>Sem cartão pra testar • Ativação via PIX quando decidir assinar</p>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="lp-cta-final" style={{ padding:'30px 24px 80px', textAlign:'center' }}>
        <div>
          <h2 style={{ fontSize:30, fontWeight:900, color:'var(--t1)', margin:'0 0 10px', letterSpacing:'-0.03em' }}>Pare de operar no escuro.</h2>
          <p style={{ fontSize:14.5, color:'var(--t3)', marginBottom:26 }}>Assine agora e comece a ver sua operação como ela realmente é.</p>
          <Link href="/signup" className="btn btn-brand btn-lg" style={{ minWidth:260, justifyContent:'center', fontSize:15.5, fontWeight:800 }}>
            Assinar agora — 3 dias grátis
          </Link>
        </div>

        <div style={{ marginTop:48, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <Logo size={0.75} showText={false} style={{ opacity:0.5 }}/>
          <p style={{ fontSize:14, fontWeight:800, margin:0 }}>
            <span style={{ color:'rgba(255,255,255,0.4)' }}>Nex</span><span style={{ color:'rgba(229,57,53,0.5)' }}>Control</span>
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(209,250,229,0.4)' }}/>
            <span style={{ fontSize:9, color:'var(--t4)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Sistema operacional ativo</span>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          .lp-benefits-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}

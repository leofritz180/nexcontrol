'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase/client'

/* ═══════════════════════════════════
   FLOATING NOTIFICATIONS
═══════════════════════════════════ */
const NOTIFS = [
  { title:'Nova meta iniciada', body:'OPERADOR THOMAS iniciou 50 DEP VOY', icon:'plus', color:'79,110,247' },
  { title:'Remessa registrada', body:'OPERADOR MINI7 · Lucro: R$ 320,00', icon:'dollar', color:'5,217,140' },
  { title:'Meta finalizada', body:'30 DEP COROA finalizado · +R$ 665', icon:'check', color:'5,217,140' },
  { title:'Operador online', body:'DIOGO conectou ao sistema', icon:'user', color:'56,182,255' },
  { title:'Remessa registrada', body:'OPERADOR FELIPE · Prejuizo: R$ 80', icon:'dollar', color:'240,61,107' },
  { title:'Pagamento aprovado', body:'Plano Equipe 5 ativado com sucesso', icon:'bolt', color:'124,92,252' },
]

function FloatingNotif({ notif, style }) {
  if (!notif) return null
  const icons = {
    plus:<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    dollar:<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>,
    check:<polyline points="20 6 9 17 4 12"/>,
    user:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bolt:<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
  }
  return (
    <div style={{
      position:'absolute', ...style,
      padding:'10px 14px', borderRadius:14, maxWidth:260,
      background:`rgba(${notif.color},0.06)`, border:`1px solid rgba(${notif.color},0.15)`,
      backdropFilter:'blur(20px)',
      boxShadow:`0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(${notif.color},0.05)`,
      display:'flex', alignItems:'center', gap:10,
      animation:'fade-up 0.5s cubic-bezier(0.33,1,0.68,1) both',
      pointerEvents:'none',
    }}>
      <div style={{ width:28, height:28, borderRadius:8, background:`rgba(${notif.color},0.15)`, border:`1px solid rgba(${notif.color},0.25)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={`rgb(${notif.color})`} strokeWidth="2.5" strokeLinecap="round">{icons[notif.icon]}</svg>
      </div>
      <div>
        <p style={{ fontSize:9, fontWeight:700, color:`rgb(${notif.color})`, margin:'0 0 1px', letterSpacing:'0.03em' }}>{notif.title}</p>
        <p style={{ fontSize:8, color:'var(--t3)', margin:0 }}>{notif.body}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════ */
function MiniCounter({ target, prefix='', duration=3000 }) {
  const [val, setVal] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now-start)/duration, 1)
      setVal(Math.round(target * (1 - Math.pow(1-p, 3))))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [target])
  return <span>{prefix}{val.toLocaleString('pt-BR')}</span>
}

/* ═══════════════════════════════════
   PHONE MOCKUP — LIVE DASHBOARD
═══════════════════════════════════ */
function PhoneMockup() {
  const [activeNotif, setActiveNotif] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setActiveNotif(n => (n + 1) % NOTIFS.length), 4000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="a2" style={{ position:'relative', display:'flex', justifyContent:'center', alignItems:'center', minHeight:620 }}>
      {/* Ambient glow */}
      <div style={{ position:'absolute', width:400, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,110,247,0.12), transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:300, height:300, top:'60%', left:'20%', borderRadius:'50%', background:'radial-gradient(circle, rgba(5,217,140,0.06), transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      {/* Floating notifications */}
      <FloatingNotif key={activeNotif} notif={NOTIFS[activeNotif]} style={{ top:20, right:-20, zIndex:10 }}/>
      <FloatingNotif key={`b${(activeNotif+3)%NOTIFS.length}`} notif={NOTIFS[(activeNotif+3)%NOTIFS.length]} style={{ bottom:80, left:-30, zIndex:10, animationDelay:'0.2s' }}/>

      {/* Phone */}
      <div style={{
        position:'relative', width:290, height:590, borderRadius:44, overflow:'hidden',
        background:'linear-gradient(160deg, #1c1c2e, #0e0e1a, #0a0a14)',
        border:'2.5px solid rgba(255,255,255,0.08)',
        boxShadow:'0 0 100px rgba(79,110,247,0.1), 0 60px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)',
        animation:'float 7s ease-in-out infinite',
        zIndex:5,
      }}>
        {/* Dynamic island */}
        <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', width:100, height:28, borderRadius:14, background:'#000', zIndex:20, boxShadow:'0 2px 8px rgba(0,0,0,0.5)' }}>
          <div style={{ position:'absolute', right:20, top:9, width:8, height:8, borderRadius:'50%', background:'#1a1a2e', border:'1.5px solid #333' }}/>
        </div>

        {/* Screen content */}
        <div style={{ position:'absolute', inset:2.5, borderRadius:41, overflow:'hidden', background:'#080d18' }}>
          {/* Status bar */}
          <div style={{ padding:'36px 20px 6px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700, color:'white' }}>9:41</span>
            <div style={{ display:'flex', gap:5, alignItems:'center' }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
              <div style={{ width:18, height:9, borderRadius:2.5, border:'1.5px solid rgba(255,255,255,0.4)', position:'relative' }}>
                <div style={{ position:'absolute', inset:1.5, borderRadius:1, background:'#05d98c', width:'75%' }}/>
                <div style={{ position:'absolute', right:-3, top:2, width:2, height:4, borderRadius:'0 1px 1px 0', background:'rgba(255,255,255,0.3)' }}/>
              </div>
            </div>
          </div>

          {/* App nav */}
          <div style={{ padding:'6px 16px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:7, background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 10px rgba(79,110,247,0.3)' }}>
                <svg width={10} height={10} viewBox="0 0 28 28" fill="none"><path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/><path d="M12 22L18 22L18 6L12 6Z" fill="white"/><path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/></svg>
              </div>
              <span style={{ fontSize:12, fontWeight:800, color:'white', letterSpacing:'-0.02em' }}>NexControl</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#05d98c', boxShadow:'0 0 6px #05d98c' }}/>
              <span style={{ fontSize:7, color:'var(--t3)', fontWeight:600 }}>ONLINE</span>
            </div>
          </div>

          {/* Dashboard */}
          <div style={{ padding:14, overflowY:'hidden', height:'calc(100% - 90px)' }}>
            {/* Hero stat */}
            <div style={{ marginBottom:12, padding:'14px 14px 12px', borderRadius:14, background:'linear-gradient(135deg, rgba(5,217,140,0.1), rgba(79,110,247,0.05))', border:'1px solid rgba(5,217,140,0.12)' }}>
              <p style={{ fontSize:7, fontWeight:700, color:'rgba(5,217,140,0.6)', letterSpacing:'0.1em', marginBottom:6 }}>LUCRO FINAL DA OPERACAO</p>
              <p style={{ fontSize:22, fontWeight:900, margin:0, fontFamily:'var(--mono)', lineHeight:1, background:'linear-gradient(135deg, #05d98c, #34d399, #6ee7b7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                R$ <MiniCounter target={5226} duration={2500}/>
              </p>
              <p style={{ fontSize:7, color:'var(--t3)', marginTop:4 }}>6 metas fechadas · 19 remessas</p>
            </div>

            {/* KPI row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
              {[
                { l:'Hoje', v:2909, c:'#05d98c' },
                { l:'Operadores', v:11, c:'#6b84ff', noR:true },
              ].map(({ l, v, c, noR }) => (
                <div key={l} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, padding:'8px 10px' }}>
                  <p style={{ fontSize:6, fontWeight:700, color:'var(--t3)', marginBottom:3, letterSpacing:'0.06em' }}>{l}</p>
                  <p style={{ fontSize:14, fontWeight:800, color:c, margin:0, fontFamily:'var(--mono)' }}>
                    {noR ? v : <>R$ <MiniCounter target={v} duration={2000}/></>}
                  </p>
                </div>
              ))}
            </div>

            {/* Mini chart simulation */}
            <div style={{ height:40, marginBottom:10, borderRadius:10, overflow:'hidden', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', padding:'8px 10px', display:'flex', alignItems:'flex-end', gap:3 }}>
              {[30,45,25,60,40,70,55,80,65,50,75,90,60,85].map((h, i) => (
                <div key={i} style={{ flex:1, height:`${h}%`, borderRadius:2, background:`rgba(79,110,247,${0.3 + (h/100)*0.5})`, transition:'height 1s ease' }}/>
              ))}
            </div>

            {/* Feed */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:10, padding:'8px 10px' }}>
              <p style={{ fontSize:7, fontWeight:700, color:'var(--t3)', marginBottom:6, letterSpacing:'0.06em' }}>REMESSAS RECENTES</p>
              {[
                { op:'T', name:'THOMAS', rede:'OKOK', v:'-R$ 50', c:'#f03d6b' },
                { op:'M', name:'MINI7', rede:'VOY', v:'+R$ 320', c:'#05d98c' },
                { op:'D', name:'DIOGO', rede:'W1', v:'+R$ 180', c:'#05d98c' },
                { op:'F', name:'FELIPE', rede:'DZ', v:'-R$ 82', c:'#f03d6b' },
              ].map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i<3?'1px solid rgba(255,255,255,0.03)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:18, height:18, borderRadius:5, background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:7, fontWeight:800, color:'white' }}>{r.op}</span>
                    </div>
                    <span style={{ fontSize:8, fontWeight:600, color:'var(--t1)' }}>{r.name}</span>
                    <span style={{ fontSize:6, fontWeight:600, padding:'1px 4px', borderRadius:3, background:'rgba(79,110,247,0.1)', color:'rgba(107,132,255,0.8)' }}>{r.rede}</span>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:r.c, fontFamily:'var(--mono)' }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* Meta cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 }}>
              {[
                { dep:'50', rede:'VOY', v:'+665', c:'#3b82f6', pct:100, done:true },
                { dep:'60', rede:'WE', v:'+412', c:'#8b5cf6', pct:65 },
              ].map((m, i) => (
                <div key={i} style={{ background:`rgba(${m.done?'5,217,140':m.c.replace('#','')},0.06)`, border:`1px solid ${m.done?'rgba(5,217,140,0.15)':m.c+'20'}`, borderRadius:8, padding:'8px 8px 6px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:3 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:m.done?'#05d98c':m.c, boxShadow:`0 0 4px ${m.done?'#05d98c':m.c}` }}/>
                    <span style={{ fontSize:8, fontWeight:800, color:m.done?'#05d98c':m.c }}>{m.dep} DEP {m.rede}</span>
                  </div>
                  <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:99, marginBottom:4 }}>
                    <div style={{ height:'100%', width:`${m.pct}%`, borderRadius:99, background:m.done?'linear-gradient(90deg,#05d98c,#34d399)':m.c }}/>
                  </div>
                  <p style={{ fontSize:9, fontWeight:700, color:'#05d98c', textAlign:'right', margin:0, fontFamily:'var(--mono)' }}>R$ {m.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Glass reflection */}
        <div style={{ position:'absolute', inset:2.5, borderRadius:41, background:'linear-gradient(155deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.01) 30%, transparent 50%)', pointerEvents:'none', zIndex:15 }}/>
        {/* Bottom home indicator */}
        <div style={{ position:'absolute', bottom:6, left:'50%', transform:'translateX(-50%)', width:100, height:4, borderRadius:4, background:'rgba(255,255,255,0.15)', zIndex:20 }}/>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) router.push('/operator')
    })
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (err) { setError(err.message); setLoading(false); return }
    const { data: p } = await supabase.from('profiles').select('role,tenant_id').eq('id', data.user.id).maybeSingle()
    router.push(p?.role === 'admin' ? '/admin' : '/operator')
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', position:'relative', overflow:'hidden' }}>
      {/* BG layers */}
      <div style={{ position:'fixed', top:'-30%', left:'-20%', width:900, height:900, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 60%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-30%', right:'-15%', width:800, height:800, borderRadius:'50%', background:'radial-gradient(circle, rgba(5,217,140,0.05) 0%, transparent 60%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', top:'30%', right:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,92,252,0.04) 0%, transparent 60%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, maxWidth:1100, width:'100%', alignItems:'center', position:'relative', zIndex:1 }}>
        {/* LEFT — Brand + Form */}
        <div style={{ maxWidth:440 }}>
          {/* Logo */}
          <div className="a1" style={{ marginBottom:44 }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:52, height:52, borderRadius:15, background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)', boxShadow:'0 0 40px rgba(79,110,247,0.4)', marginBottom:24 }}>
              <svg width={22} height={22} viewBox="0 0 28 28" fill="none">
                <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
                <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
                <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
                <circle cx="21" cy="8" r="3" fill="#05d98c"/>
              </svg>
            </div>
            <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:40, letterSpacing:'-0.04em', color:'#eef2ff', margin:'0 0 12px', lineHeight:1.1 }}>
              Controle total da sua <span style={{ background:'linear-gradient(135deg,#818cf8,#a78bfa,#6b84ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>operacao</span> em tempo real.
            </h1>
            <p style={{ fontSize:16, color:'var(--t2)', margin:0, lineHeight:1.7 }}>
              Gerencie metas, operadores e faturamento em um unico painel premium.
            </p>
          </div>

          {/* Form */}
          <div className="a2" style={{ padding:32, borderRadius:22, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', boxShadow:'0 40px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:focused==='email'?'var(--brand-bright)':'var(--t3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, transition:'color 0.2s' }}>Email</label>
                <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')} placeholder="seu@email.com" required/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:focused==='pass'?'var(--brand-bright)':'var(--t3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, transition:'color 0.2s' }}>Senha</label>
                <div style={{ position:'relative' }}>
                  <input className="input" type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} onFocus={()=>setFocused('pass')} onBlur={()=>setFocused('')} placeholder="••••••••" required style={{ paddingRight:44 }}/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', display:'flex' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
              </div>

              {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

              <button type="submit" className="btn btn-brand btn-lg" disabled={loading} style={{ width:'100%', fontSize:15, fontWeight:700 }}>
                {loading ? <><div className="spinner"/><span>Entrando...</span></> : 'Acessar painel'}
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:18 }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize:10, color:'rgba(5,217,140,0.45)', fontWeight:600 }}>Dados criptografados · Conexao segura</span>
            </div>
          </div>

          <div className="a3" style={{ marginTop:18 }}>
            <Link href="/signup" className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', fontSize:14, fontWeight:600, padding:'12px 24px', borderColor:'rgba(255,255,255,0.08)', color:'var(--t2)' }}>
              Criar conta gratuita
            </Link>
          </div>

          {/* Social proof */}
          <div className="a4" style={{ display:'flex', gap:24, marginTop:28 }}>
            {[
              { v:'7 dias', l:'gratis' },
              { v:'Multi-tenant', l:'isolamento total' },
              { v:'Push', l:'notificacoes' },
            ].map(({ v, l }) => (
              <div key={v}>
                <p style={{ fontSize:13, fontWeight:800, color:'var(--t1)', margin:'0 0 1px' }}>{v}</p>
                <p style={{ fontSize:10, color:'var(--t4)', margin:0 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Phone */}
        <PhoneMockup/>
      </div>
    </main>
  )
}

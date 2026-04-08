'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase/client'

/* ─── Phone Mockup with Dashboard ─── */
function PhoneMockup() {
  return (
    <div className="a2" style={{ position:'relative', display:'flex', justifyContent:'center', alignItems:'center' }}>
      {/* Glow behind phone */}
      <div style={{ position:'absolute', width:300, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,110,247,0.15), transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      {/* Phone frame */}
      <div style={{
        position:'relative', width:280, height:560, borderRadius:40, overflow:'hidden',
        background:'linear-gradient(145deg, #1a1a2e, #0f0f1a)',
        border:'3px solid rgba(255,255,255,0.1)',
        boxShadow:'0 0 80px rgba(79,110,247,0.12), 0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        animation:'float 6s ease-in-out infinite',
      }}>
        {/* Notch */}
        <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:90, height:24, borderRadius:12, background:'#000', zIndex:10 }}/>

        {/* Screen */}
        <div style={{ position:'absolute', inset:3, borderRadius:37, overflow:'hidden', background:'#0a0f1a' }}>
          {/* Status bar */}
          <div style={{ padding:'32px 18px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--t2)' }}>9:41</span>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <div style={{ width:14, height:8, borderRadius:2, border:'1px solid var(--t3)', position:'relative' }}>
                <div style={{ position:'absolute', inset:1, borderRadius:1, background:'var(--profit)', width:'70%' }}/>
              </div>
            </div>
          </div>

          {/* App header */}
          <div style={{ padding:'8px 16px 12px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width:22, height:22, borderRadius:6, background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:3, height:6, background:'white', borderRadius:1, opacity:0.7 }}/>
              <div style={{ width:3, height:10, background:'white', borderRadius:1, marginLeft:1 }}/>
              <div style={{ width:3, height:7, background:'white', borderRadius:1, marginLeft:1, opacity:0.8 }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--t1)' }}>NexControl</span>
          </div>

          {/* Dashboard content */}
          <div style={{ padding:14 }}>
            {/* Welcome */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--profit)' }}/>
                <span style={{ fontSize:7, color:'var(--t3)', fontWeight:600, letterSpacing:'0.08em' }}>SISTEMA ONLINE</span>
              </div>
              <p style={{ fontSize:13, fontWeight:800, color:'var(--t1)', margin:0 }}>Painel executivo</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {[
                { l:'Lucro hoje', v:'R$ 2.909', c:'#05d98c', bg:'rgba(5,217,140,0.08)' },
                { l:'Lucro final', v:'R$ 5.226', c:'#6b84ff', bg:'rgba(79,110,247,0.08)' },
                { l:'Resultado', v:'R$ 2.167', c:'#f03d6b', bg:'rgba(240,61,107,0.06)' },
                { l:'Operadores', v:'11', c:'#38b6ff', bg:'rgba(56,182,255,0.08)' },
              ].map(({ l, v, c, bg }) => (
                <div key={l} style={{ background:bg, border:`1px solid ${c}22`, borderRadius:10, padding:'10px 10px 8px' }}>
                  <p style={{ fontSize:6, fontWeight:700, color:'var(--t3)', letterSpacing:'0.06em', marginBottom:4, textTransform:'uppercase' }}>{l}</p>
                  <p style={{ fontSize:12, fontWeight:800, color:c, margin:0, fontFamily:'var(--mono)' }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Feed */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, padding:10 }}>
              <p style={{ fontSize:7, fontWeight:700, color:'var(--t3)', marginBottom:8, letterSpacing:'0.06em' }}>FEED DE REMESSAS</p>
              {[
                { op:'THOMAS', rede:'OKOK', v:'-R$ 50', c:'#f03d6b' },
                { op:'MINI7', rede:'VOY', v:'+R$ 320', c:'#05d98c' },
                { op:'DIOGO', rede:'W1', v:'+R$ 180', c:'#05d98c' },
              ].map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:i<2?'1px solid rgba(255,255,255,0.04)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:18, height:18, borderRadius:5, background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:7, fontWeight:800, color:'white' }}>{r.op[0]}</span>
                    </div>
                    <div>
                      <span style={{ fontSize:8, fontWeight:600, color:'var(--t1)' }}>{r.op}</span>
                      <span style={{ fontSize:7, color:'var(--t3)', marginLeft:4 }}>{r.rede}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:r.c, fontFamily:'var(--mono)' }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* Meta cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:10 }}>
              {[
                { dep:'50', rede:'VOY', v:'+R$ 665', c:'#3b82f6', pct:100 },
                { dep:'30', rede:'COROA', v:'+R$ 412', c:'#d4a017', pct:80 },
              ].map((m, i) => (
                <div key={i} style={{ background:`${m.c}12`, border:`1px solid ${m.c}25`, borderRadius:8, padding:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:m.c }}/>
                    <span style={{ fontSize:8, fontWeight:800, color:m.c }}>{m.dep} DEP {m.rede}</span>
                  </div>
                  <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:99, marginBottom:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${m.pct}%`, background:m.c, borderRadius:99 }}/>
                  </div>
                  <p style={{ fontSize:9, fontWeight:700, color:'#05d98c', textAlign:'right', margin:0, fontFamily:'var(--mono)' }}>{m.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reflection */}
        <div style={{ position:'absolute', inset:3, borderRadius:37, background:'linear-gradient(165deg, rgba(255,255,255,0.06) 0%, transparent 40%)', pointerEvents:'none' }}/>
      </div>
    </div>
  )
}

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
    const role = p?.role || 'operator'
    router.push(role === 'admin' ? '/admin' : '/operator')
  }

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      {/* Orbs */}
      <div style={{ position:'fixed', top:'-20%', left:'-15%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,110,247,0.1) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(5,217,140,0.07) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, maxWidth:1000, width:'100%', alignItems:'center', position:'relative', zIndex:1 }}>

        {/* Left — Login */}
        <div>
          {/* Logo */}
          <div className="a1" style={{ marginBottom:40 }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)', boxShadow:'0 0 50px rgba(79,110,247,0.4)', marginBottom:20, animation:'float 4s ease-in-out infinite' }}>
              <svg width={24} height={24} viewBox="0 0 28 28" fill="none">
                <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
                <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
                <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
                <circle cx="21" cy="8" r="3" fill="#05d98c"/>
              </svg>
            </div>
            <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:36, letterSpacing:'-0.04em', color:'#eef2ff', margin:'0 0 8px' }}>
              Nex<span style={{ background:'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Control</span>
            </h1>
            <p style={{ fontSize:15, color:'var(--t2)', margin:'0 0 4px', lineHeight:1.6 }}>Gestao inteligente de metas, operadores e faturamento.</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
              <span className="live-dot" style={{ width:6, height:6 }}/>
              <span style={{ fontSize:10, color:'rgba(136,150,179,0.6)', letterSpacing:'0.1em', fontWeight:600 }}>SISTEMA OPERACIONAL ATIVO</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="a2 card card-glass" style={{ padding:32, boxShadow:'0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,110,247,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', marginBottom:3 }}>Acesse sua conta</h2>
            <p style={{ fontSize:12, color:'var(--t3)', marginBottom:24 }}>Central de operacoes NexControl</p>

            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:focused==='email'?'var(--brand-bright)':'var(--t3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, transition:'color 0.2s' }}>Email</label>
                <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')} placeholder="operador@nexcontrol.io" required/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:700, color:focused==='pass'?'var(--brand-bright)':'var(--t3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, transition:'color 0.2s' }}>Senha</label>
                <div style={{ position:'relative' }}>
                  <input className="input" type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} onFocus={()=>setFocused('pass')} onBlur={()=>setFocused('')} placeholder="••••••••••••" required style={{ paddingRight:44 }}/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', display:'flex', alignItems:'center' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
              </div>

              {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

              <button type="submit" className="btn btn-brand btn-lg" disabled={loading} style={{ width:'100%', fontSize:15, fontWeight:700 }}>
                {loading ? <><div className="spinner"/><span>Autenticando...</span></> : <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg><span>Entrar no sistema</span></>}
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:20, padding:'8px 14px', background:'rgba(5,217,140,0.04)', border:'1px solid rgba(5,217,140,0.08)', borderRadius:8 }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize:10, color:'rgba(5,217,140,0.5)', fontWeight:600, letterSpacing:'0.05em' }}>CONEXAO SEGURA</span>
            </div>
          </div>

          <div className="a3" style={{ marginTop:20 }}>
            <Link href="/signup" className="btn btn-ghost btn-lg" style={{ width:'100%', justifyContent:'center', fontSize:14, fontWeight:700, padding:'12px 24px', borderColor:'var(--brand-border)', color:'var(--brand-bright)' }}>
              Criar conta
            </Link>
          </div>
        </div>

        {/* Right — Phone Mockup */}
        <PhoneMockup/>
      </div>
    </main>
  )
}

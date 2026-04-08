'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase/client'

function Particle({ style }) {
  return <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', ...style }}/>
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

  const particles = [
    { width:3, height:3, top:'15%', left:'12%', background:'rgba(79,110,247,0.5)', animation:'float 6s ease-in-out infinite' },
    { width:2, height:2, top:'70%', left:'8%', background:'rgba(5,217,140,0.4)', animation:'float 8s ease-in-out infinite 1s' },
    { width:4, height:4, top:'30%', right:'10%', background:'rgba(79,110,247,0.3)', animation:'float 7s ease-in-out infinite 0.5s' },
    { width:2, height:2, top:'80%', right:'15%', background:'rgba(240,61,107,0.4)', animation:'float 5s ease-in-out infinite 2s' },
    { width:3, height:3, top:'50%', left:'5%', background:'rgba(5,217,140,0.3)', animation:'float 9s ease-in-out infinite 0.3s' },
    { width:2, height:2, top:'20%', right:'25%', background:'rgba(245,166,35,0.35)', animation:'float 7s ease-in-out infinite 1.5s' },
  ]

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      {particles.map((p, i) => <Particle key={i} style={p}/>)}

      {/* Orbs */}
      <div style={{ position:'fixed', top:'-20%', left:'-15%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(79,110,247,0.12) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(5,217,140,0.08) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div className="a1" style={{ textAlign:'center', marginBottom:44 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:60, height:60, borderRadius:18, background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)', boxShadow:'0 0 60px rgba(79,110,247,0.5), 0 0 120px rgba(79,110,247,0.15)', marginBottom:22, animation:'float 4s ease-in-out infinite, glow-brand 3s ease-in-out infinite' }}>
            <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
              <path d="M4 22 L10 22 L10 12 L4 12 Z" fill="white" opacity={0.5}/>
              <path d="M12 22 L18 22 L18 6 L12 6 Z" fill="white"/>
              <path d="M20 22 L26 22 L26 16 L20 16 Z" fill="white" opacity={0.7}/>
              <circle cx="21" cy="8" r="3" fill="rgba(5,217,140,1)"/>
            </svg>
          </div>
          <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:32, letterSpacing:'-0.04em', color:'#eef2ff', margin:'0 0 6px' }}>
            Nex<span style={{ background:'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Control</span>
          </h1>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <span className="live-dot" style={{ width:6, height:6 }}/>
            <span style={{ fontSize:11, color:'rgba(136,150,179,0.7)', letterSpacing:'0.12em', fontWeight:600 }}>SISTEMA OPERACIONAL ATIVO</span>
          </div>
        </div>

        {/* Card */}
        <div className="a2 card card-glass" style={{ padding:36, boxShadow:'0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,110,247,0.1), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.02em', marginBottom:4 }}>Acesse sua conta</h2>
          <p style={{ fontSize:13, color:'var(--t3)', marginBottom:28 }}>Central de operacoes NexControl</p>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:focused==='email'?'var(--brand-bright)':'var(--t3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:9, transition:'color 0.2s' }}>Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')} placeholder="operador@nexcontrol.io" required style={{ fontSize:14 }}/>
            </div>

            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:focused==='pass'?'var(--brand-bright)':'var(--t3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:9, transition:'color 0.2s' }}>Senha</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} onFocus={()=>setFocused('pass')} onBlur={()=>setFocused('')} placeholder="••••••••••••" required style={{ paddingRight:44 }}/>
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', display:'flex', alignItems:'center', transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>

            {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

            <button type="submit" className="btn btn-brand btn-lg" disabled={loading} style={{ width:'100%', marginTop:6, fontSize:15, fontWeight:700 }}>
              {loading ? <><div className="spinner"/><span>Autenticando...</span></> : <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg><span>Entrar no sistema</span></>}
            </button>
          </form>

          {/* Security badge */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:24, padding:'10px 16px', background:'rgba(5,217,140,0.05)', border:'1px solid rgba(5,217,140,0.1)', borderRadius:10 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize:11, color:'rgba(5,217,140,0.6)', fontWeight:600, letterSpacing:'0.06em' }}>CONEXÃO SEGURA · DADOS CRIPTOGRAFADOS</span>
          </div>
        </div>

        <div className="a3" style={{ textAlign:'center', marginTop:28 }}>
          <Link href="/signup" className="btn btn-ghost btn-lg" style={{ width:'100%', maxWidth:420, justifyContent:'center', fontSize:15, fontWeight:700, padding:'14px 24px', borderColor:'var(--brand-border)', color:'var(--brand-bright)' }}>
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  )
}

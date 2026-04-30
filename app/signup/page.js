'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import { markJustSignedUp } from '../../components/InstallPrompt'
import Logo from '../../components/Logo'

function Particles() {
  const dots = useMemo(() => [
    { size:3, x:'10%', y:'18%', color:'rgba(229,57,53,0.4)', dur:7, del:0 },
    { size:2, x:'85%', y:'25%', color:'rgba(229,57,53,0.25)', dur:8, del:0.5 },
    { size:2, x:'8%', y:'72%', color:'rgba(16,185,129,0.3)', dur:6, del:1 },
    { size:3, x:'90%', y:'70%', color:'rgba(229,57,53,0.2)', dur:9, del:2 },
    { size:2, x:'50%', y:'88%', color:'rgba(16,185,129,0.2)', dur:10, del:1.5 },
  ], [])
  return dots.map((d, i) => (
    <motion.div key={i}
      style={{ position:'absolute', left:d.x, top:d.y, width:d.size, height:d.size, borderRadius:'50%', background:d.color, pointerEvents:'none' }}
      animate={{ y:[0,-8,0,6,0], opacity:[0.3,0.7,0.3] }}
      transition={{ duration:d.dur, repeat:Infinity, ease:'easeInOut', delay:d.del }}
    />
  ))
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nome, setNome] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Captura ?ref=CODIGO e persiste em sessionStorage (sobrevive ao redirect de confirmacao)
  useEffect(() => {
    const ref = searchParams?.get('ref')
    if (ref && typeof window !== 'undefined') {
      try { sessionStorage.setItem('nx_ref', ref) } catch {}
    }
  }, [searchParams])

  async function attachRef(userEmail) {
    if (typeof window === 'undefined') return
    let ref = null
    try { ref = sessionStorage.getItem('nx_ref') } catch {}
    if (!ref) return
    // Retry curto — o profile/tenant pode ser criado por trigger assincrono
    for (let i = 0; i < 5; i++) {
      try {
        const res = await fetch('/api/affiliate/attach', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, ref }),
        })
        const j = await res.json()
        if (j.ok) { try { sessionStorage.removeItem('nx_ref') } catch {} ; return }
        if (j.msg === 'profile_not_ready') { await new Promise(r => setTimeout(r, 800)); continue }
        return
      } catch { return }
    }
  }

  async function waitForProfile(userId) {
    for (let i = 0; i < 8; i++) {
      try {
        const { data: p } = await supabase.from('profiles').select('id,tenant_id').eq('id', userId).maybeSingle()
        if (p && p.tenant_id) return true
      } catch {}
      await new Promise(r => setTimeout(r, 600))
    }
    return false
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (!email || !pass || !nome.trim() || !tenantName.trim()) return
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { nome: nome.trim(), tenant_name: tenantName.trim(), role: 'admin' } }
      })
      if (err) { setLoading(false); setError(err.message); return }
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.user) {
        markJustSignedUp()
        await attachRef(email)
        await waitForProfile(session.session.user.id)
        setLoading(false)
        router.push('/admin')
        return
      }
      // Signup com confirmacao por email — tenta attach mesmo assim
      attachRef(email)
      setLoading(false)
      setSuccess(true)
    } catch (e) {
      setLoading(false)
      setError(e?.message || 'Erro de conexao. Verifique sua internet.')
    }
  }

  if (success) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', zIndex:1 }}>
      <Particles />
      <div style={{ width:'100%', maxWidth:420, textAlign:'center', position:'relative', zIndex:2 }}>
        <div style={{ padding:40, borderRadius:24, background:'rgba(12,18,32,0.85)', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'var(--profit-dim)', border:'1px solid var(--profit-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize:22, fontWeight:800, color:'var(--t1)', marginBottom:8 }}>Conta criada!</h2>
          <p style={{ fontSize:14, color:'var(--t2)', marginBottom:24 }}>Verifique seu email para confirmar o cadastro.</p>
          <Link href="/login" className="btn btn-brand btn-lg" style={{ width:'100%', justifyContent:'center' }}>Entrar no sistema</Link>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', zIndex:1, overflow:'hidden' }}>
      {/* Ambient orbs */}
      <div style={{ position:'fixed', top:'-18%', left:'-12%', width:750, height:750, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.18) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none', animation:'lpOrb1 20s ease-in-out infinite' }}/>
      <div style={{ position:'fixed', bottom:'-18%', right:'-8%', width:650, height:650, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)', filter:'blur(60px)', pointerEvents:'none', animation:'lpOrb2 25s ease-in-out infinite' }}/>
      <div style={{ position:'fixed', top:'40%', right:'20%', width:450, height:450, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.07) 0%, transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>
      <style>{`
        @keyframes lpOrb1 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(30px,-20px) scale(1.05); } 66% { transform:translate(-20px,15px) scale(0.97); } }
        @keyframes lpOrb2 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(-25px,20px) scale(0.96); } 66% { transform:translate(15px,-10px) scale(1.04); } }
      `}</style>

      <Particles />

      <motion.div
        initial={{ opacity:0, y:16 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:[0.33,1,0.68,1] }}
        style={{ width:'100%', maxWidth:420, position:'relative', zIndex:2 }}
      >
        {/* Brand */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
            <Logo size={1.5} showText={false} glow />
          </div>
          <h2 style={{ fontSize:24, fontWeight:900, margin:'0 0 4px' }}>
            <span style={{ color:'#F1F5F9' }}>Nex</span><span style={{ color:'#e53935' }}>Control</span>
          </h2>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:6 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 6px rgba(16,185,129,0.5)' }}/>
            <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Criar sua operação</span>
          </div>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity:0, y:12 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.4, delay:0.15, ease:[0.33,1,0.68,1] }}
          style={{
            padding:28, borderRadius:24,
            background:'rgba(12,18,32,0.85)',
            border:'1px solid rgba(255,255,255,0.06)',
            boxShadow:'0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ marginBottom:20 }}>
            <h1 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', margin:'0 0 4px', letterSpacing:'-0.02em' }}>Começar agora</h1>
            <p style={{ fontSize:13, color:'var(--t3)', margin:0 }}>Cadastre-se como administrador</p>
          </div>

          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', marginBottom:6, fontSize:10, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Nome da operação *</label>
              <input className="input" value={tenantName} onChange={e=>setTenantName(e.target.value)} placeholder="Ex: Minha Empresa" required style={{ fontSize:14 }}/>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:6, fontSize:10, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Seu nome *</label>
              <input className="input" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome completo" required style={{ fontSize:14 }}/>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:6, fontSize:10, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Email *</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@empresa.com" required style={{ fontSize:14 }}/>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:6, fontSize:10, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Senha *</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} style={{ fontSize:14, paddingRight:40 }}/>
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t4)', padding:4 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', fontSize:12, color:'#EF4444' }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <motion.button type="submit" className="btn btn-brand btn-lg" disabled={loading}
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              style={{ width:'100%', justifyContent:'center', fontSize:15, fontWeight:700, marginTop:4 }}>
              {loading ? <><div className="spinner" style={{ width:16, height:16 }}/> Criando...</> : (
                <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Criar conta admin</>
              )}
            </motion.button>
          </form>

          <div style={{ textAlign:'center', marginTop:20 }}>
            <p style={{ fontSize:12, color:'var(--t4)' }}>
              Já tem conta? <Link href="/login" style={{ color:'#e53935', fontWeight:700, textDecoration:'none' }}>Entrar</Link>
            </p>
          </div>
        </motion.div>

        {/* Security badge */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.5, duration:0.4 }}
          style={{ textAlign:'center', marginTop:20 }}
        >
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, background:'rgba(16,185,129,0.04)', border:'1px solid rgba(16,185,129,0.1)' }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize:9, fontWeight:700, color:'rgba(16,185,129,0.6)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Conexão segura · Dados criptografados</span>
          </div>
        </motion.div>

        {/* Trial info */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:0.6, duration:0.4 }}
          style={{ textAlign:'center', marginTop:12 }}
        >
          <p style={{ fontSize:10, color:'var(--t4)' }}>3 dias grátis · Sem cartão · Cancele quando quiser</p>
        </motion.div>
      </motion.div>
    </main>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase/client'
import { markJustSignedUp } from '../../components/InstallPrompt'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nome, setNome] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    if (!email || !pass || !nome.trim() || !tenantName.trim()) return
    setLoading(true); setError('')

    const { error: err } = await supabase.auth.signUp({
      email, password: pass,
      options: { data: { nome: nome.trim(), tenant_name: tenantName.trim(), role: 'admin' } }
    })

    setLoading(false)
    if (err) { setError(err.message); return }
    // Try to redirect directly if auto-confirmed
    const { data: session } = await supabase.auth.getSession()
    if (session?.session?.user) {
      markJustSignedUp()
      router.push('/admin')
      return
    }
    setSuccess(true)
  }

  if (success) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', zIndex:1 }}>
      <div style={{ width:'100%', maxWidth:420, textAlign:'center' }}>
        <div className="a1 card card-glass" style={{ padding:40 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'var(--profit-dim)', border:'1px solid var(--profit-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="t-h2" style={{ marginBottom:8 }}>Conta criada</h2>
          <p className="t-body" style={{ marginBottom:24 }}>Verifique seu email para confirmar o cadastro.</p>
          <Link href="/login" className="btn btn-brand" style={{ width:'100%', justifyContent:'center' }}>Entrar no sistema</Link>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', zIndex:1 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div className="a1" style={{ textAlign:'center', marginBottom:36 }}>
          <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:28, letterSpacing:'-0.04em', color:'var(--t1)', marginBottom:6 }}>
            Criar sua operacao
          </h1>
          <p className="t-body">Cadastre-se como administrador do NexControl</p>
        </div>

        <div className="a2 card card-glass" style={{ padding:32 }}>
          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="t-label" style={{ display:'block', marginBottom:8 }}>Nome da operacao *</label>
              <input className="input" value={tenantName} onChange={e=>setTenantName(e.target.value)} placeholder="Ex: Minha Empresa" required/>
            </div>
            <div>
              <label className="t-label" style={{ display:'block', marginBottom:8 }}>Seu nome *</label>
              <input className="input" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome completo" required/>
            </div>
            <div>
              <label className="t-label" style={{ display:'block', marginBottom:8 }}>Email *</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@empresa.com" required/>
            </div>
            <div>
              <label className="t-label" style={{ display:'block', marginBottom:8 }}>Senha *</label>
              <input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Minimo 6 caracteres" required minLength={6}/>
            </div>
            {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
            <button type="submit" className="btn btn-brand btn-lg" disabled={loading} style={{ width:'100%' }}>
              {loading ? <><div className="spinner"/> Criando...</> : 'Criar conta admin'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--t3)' }}>
            Ja tem conta? <Link href="/login" style={{ color:'var(--brand-bright)', fontWeight:600 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

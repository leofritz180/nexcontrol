'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabase/client'

export default function InviteWrapper() {
  return <Suspense fallback={<main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1,position:'relative'}}><div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/></main>}><InvitePage/></Suspense>
}

function InvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [invite, setInvite] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) loadInvite()
    else setLoading(false)
  }, [token])

  async function loadInvite() {
    const { data: inv } = await supabase.from('invites').select('*').eq('token', token).eq('status', 'pending').maybeSingle()
    if (!inv) { setLoading(false); return }
    setInvite(inv)
    if (inv.email) setEmail(inv.email)
    const { data: t } = await supabase.from('tenants').select('name').eq('id', inv.tenant_id).maybeSingle()
    setTenant(t)
    setLoading(false)
  }

  async function handleAccept(e) {
    e.preventDefault()
    if (!email || !pass || !nome.trim()) return
    setSaving(true); setError('')

    // Re-validate invite still exists and is pending
    const { data: valid } = await supabase.from('invites').select('id,tenant_id').eq('token', token).eq('status', 'pending').maybeSingle()
    if (!valid) { setError('Este convite expirou ou foi cancelado.'); setSaving(false); return }

    // Validar limite do plano usando o MAIOR operator_count entre todas as
    // subscriptions ativas e nao expiradas (multiplas compras coexistem).
    try {
      const tid = valid.tenant_id || invite?.tenant_id
      if (tid) {
        const [{ count: opCount }, { data: activeSubs }] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tid).eq('role', 'operator'),
          supabase.from('subscriptions').select('operator_count, expires_at').eq('tenant_id', tid).eq('status', 'active'),
        ])
        const validLimits = (activeSubs || [])
          .filter(s => !s.expires_at || new Date(s.expires_at) > new Date())
          .map(s => Number(s.operator_count || 0))
        if (validLimits.length > 0) {
          const limit = Math.max(...validLimits)
          if ((opCount || 0) >= limit) {
            setSaving(false)
            setError('Este convite expirou por limite de plano. Peca ao admin para liberar uma vaga.')
            return
          }
        }
      }
    } catch (e) {
      console.error('[invite] check limit failed', e?.message)
    }

    const { error: err } = await supabase.auth.signUp({
      email, password: pass,
      options: { data: { nome: nome.trim(), invite_token: token } }
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
  }

  if (loading) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, position:'relative' }}>
      <div className="spinner" style={{ width:28, height:28, borderTopColor:'var(--brand-bright)' }}/>
    </main>
  )

  if (!token || !invite) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, zIndex:1, position:'relative' }}>
      <div className="card card-glass" style={{ padding:40, textAlign:'center', maxWidth:400 }}>
        <h2 className="t-h2" style={{ marginBottom:8 }}>Convite invalido</h2>
        <p className="t-body" style={{ marginBottom:24 }}>Este link de convite expirou ou nao existe.</p>
        <Link href="/login" className="btn btn-brand">Ir para login</Link>
      </div>
    </main>
  )

  if (success) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, zIndex:1, position:'relative' }}>
      <div className="card card-glass" style={{ padding:40, textAlign:'center', maxWidth:420 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:'var(--profit-dim)', border:'1px solid var(--profit-border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="t-h2" style={{ marginBottom:8 }}>Conta criada</h2>
        <p className="t-body" style={{ marginBottom:4 }}>Voce foi adicionado a <strong style={{ color:'var(--t1)' }}>{tenant?.name}</strong></p>
        <p className="t-body" style={{ marginBottom:24 }}>Verifique seu email para confirmar.</p>
        <Link href="/login" className="btn btn-brand" style={{ width:'100%', justifyContent:'center' }}>Ir para o login</Link>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, zIndex:1, position:'relative' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div className="a1" style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 14px', borderRadius:99, background:'var(--brand-dim)', border:'1px solid var(--brand-border)', marginBottom:16 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--brand-bright)', letterSpacing:'0.06em' }}>CONVITE</span>
          </div>
          <h1 style={{ fontFamily:'Inter,sans-serif', fontWeight:900, fontSize:26, letterSpacing:'-0.03em', color:'var(--t1)', marginBottom:6 }}>
            Junte-se a {tenant?.name || 'equipe'}
          </h1>
          <p className="t-body">Voce foi convidado como <strong style={{ color:'var(--brand-bright)' }}>{invite.role}</strong></p>
        </div>

        <div className="a2 card card-glass" style={{ padding:32 }}>
          <form onSubmit={handleAccept} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="t-label" style={{ display:'block', marginBottom:8 }}>Seu nome *</label>
              <input className="input" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome completo" required/>
            </div>
            <div>
              <label className="t-label" style={{ display:'block', marginBottom:8 }}>Email *</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required/>
            </div>
            <div>
              <label className="t-label" style={{ display:'block', marginBottom:8 }}>Criar senha *</label>
              <input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Minimo 6 caracteres" required minLength={6}/>
            </div>
            {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
            <button type="submit" className="btn btn-profit btn-lg" disabled={saving} style={{ width:'100%' }}>
              {saving ? <><div className="spinner" style={{ width:14, height:14, borderTopColor:'#012b1c' }}/> Criando...</> : 'Aceitar convite e criar conta'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

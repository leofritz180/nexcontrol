'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import { markJustSignedUp } from '../../components/InstallPrompt'

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
      attachRef(email)
      setLoading(false)
      setSuccess(true)
    } catch (e) {
      setLoading(false)
      setError(e?.message || 'Erro de conexao. Verifique sua internet.')
    }
  }

  // Estilo dos inputs (centralizado pra reuso)
  const inputStyle = {
    width: '100%', fontSize: 14, fontWeight: 400,
    padding: '12px 14px', borderRadius: 8, outline: 'none',
    color: 'var(--t1)',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'border-color 0.15s, background 0.15s',
  }
  const inputFocus = {
    onFocus: e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' },
    onBlur: e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' },
  }
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--t1)', marginBottom: 8 }

  if (success) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#000000' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'rgba(0,140,94,0.08)', border: '1px solid rgba(0,140,94,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em',
          color: 'var(--t1)', margin: '0 0 8px', lineHeight: 1.1,
        }}>
          Conta criada
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t2)', margin: '0 0 28px' }}>
          Verifique seu email para confirmar o cadastro.
        </p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '12px 20px', fontSize: 14, fontWeight: 600,
          borderRadius: 8, background: '#e53935', color: 'white', textDecoration: 'none',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#d32f2f'}
          onMouseLeave={e => e.currentTarget.style.background = '#e53935'}
        >
          Entrar no sistema
        </Link>
      </div>
    </main>
  )

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative', overflow: 'hidden', background: '#000000',
    }}>
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: 0, width: '40vw', height: '100vh', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 0% 50%, rgba(229,57,53,0.12) 0%, rgba(229,57,53,0.04) 30%, transparent 60%)',
        filter: 'blur(40px)',
      }} />
      <div aria-hidden style={{
        position: 'fixed', top: 0, right: 0, width: '40vw', height: '100vh', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 30%, transparent 60%)',
        filter: 'blur(40px)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-flex' }}>
            <img
              src="/icons/nexcontrol-icon-clean.png"
              alt="NexControl"
              width={56}
              height={56}
              style={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }}
            />
          </Link>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em',
          textAlign: 'center', color: 'var(--t1)', margin: '0 0 8px', lineHeight: 1.1,
        }}>
          Criar conta NexControl
        </h1>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--t2)', margin: '0 0 36px' }}>
          Ja tem conta?{' '}
          <Link href="/login" style={{ color: 'var(--t1)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--t3)' }}>
            Entrar
          </Link>
          .
        </p>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Nome da operacao</label>
            <input
              value={tenantName} onChange={e => setTenantName(e.target.value)}
              placeholder="Ex: Minha Empresa" required
              style={inputStyle} {...inputFocus}
            />
          </div>

          <div>
            <label style={labelStyle}>Seu nome</label>
            <input
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Nome completo" required
              style={inputStyle} {...inputFocus}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" required autoComplete="email"
              style={inputStyle} {...inputFocus}
            />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="Minimo 6 caracteres" required minLength={6} autoComplete="new-password"
                style={{ ...inputStyle, paddingRight: 42 }} {...inputFocus}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--t3)', display: 'flex', alignItems: 'center', padding: 4,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  {showPass
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: 12, color: '#EF4444',
                }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 20px', marginTop: 4, fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
              borderRadius: 8, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'white',
              background: loading ? 'rgba(229,57,53,0.5)' : '#e53935',
              transition: 'background 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#d32f2f' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#e53935' }}
          >
            {loading ? (
              <>
                <motion.div
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', flexShrink: 0,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                />
                Criando conta...
              </>
            ) : 'Criar conta'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: 12, color: 'var(--t3)', marginTop: 24,
        }}>
          3 dias gratis · Sem cartao · Cancele quando quiser
        </p>

        <p style={{
          textAlign: 'center', fontSize: 11, color: 'var(--t4)', marginTop: 16,
          letterSpacing: '0.04em',
        }}>
          Conexao segura · Dados criptografados
        </p>
      </motion.div>
    </main>
  )
}

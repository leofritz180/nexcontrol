'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise.then(v => ({ value: v })),
      new Promise(res => setTimeout(() => res({ timeout: true, label }), ms)),
    ])
  }

  async function resolveRoleAndGo(userId) {
    let role = null
    try {
      const r = await withTimeout(
        supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
        2500, 'profile'
      )
      if (!r.timeout) role = r.value?.data?.role || null
    } catch {}
    const target = role === 'operator' ? '/operator' : '/admin'
    if (typeof window !== 'undefined') window.location.assign(target)
    else router.push(target)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user
      if (u) resolveRoleAndGo(u.id)
    })
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await withTimeout(
        supabase.auth.signInWithPassword({ email, password: pass }),
        10000, 'signin'
      )
      if (r.timeout) {
        setError('Conexao lenta. Tente novamente.')
        setLoading(false)
        return
      }
      const { data, error: err } = r.value || {}
      if (err) { setError(err.message); setLoading(false); return }
      if (!data?.user) { setError('Falha ao autenticar. Tente novamente.'); setLoading(false); return }
      await resolveRoleAndGo(data.user.id)
    } catch (e) {
      setError(e?.message || 'Erro de conexao. Verifique sua internet.')
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative', overflow: 'hidden', background: '#000000',
    }}>
      {/* Edge cinematic gradients — efeito silk Resend, em tom brand red */}
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
        {/* Logo */}
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

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em',
          textAlign: 'center', color: 'var(--t1)', margin: '0 0 8px', lineHeight: 1.1,
        }}>
          Entrar no NexControl
        </h1>

        <p style={{
          textAlign: 'center', fontSize: 14, color: 'var(--t2)', margin: '0 0 36px',
        }}>
          Nao tem conta?{' '}
          <Link href="/signup" style={{ color: 'var(--t1)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--t3)' }}>
            Criar conta
          </Link>
          .
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--t1)', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required autoComplete="email"
              style={{
                width: '100%', fontSize: 14, fontWeight: 400,
                padding: '12px 14px', borderRadius: 8, outline: 'none',
                color: 'var(--t1)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--t1)', marginBottom: 8 }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                required autoComplete="current-password"
                style={{
                  width: '100%', fontSize: 14, fontWeight: 400,
                  padding: '12px 14px', paddingRight: 42, borderRadius: 8, outline: 'none',
                  color: 'var(--t1)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--t3)', display: 'flex', alignItems: 'center', padding: 4,
                  transition: 'color 0.15s',
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
              transition: 'background 0.15s, transform 0.1s',
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
                Autenticando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: 11, color: 'var(--t4)', marginTop: 32,
          letterSpacing: '0.04em',
        }}>
          Conexao segura · Dados criptografados
        </p>
      </motion.div>
    </main>
  )
}

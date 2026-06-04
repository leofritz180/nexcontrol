'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Supabase processa o token (hash #access_token=...&type=recovery) automaticamente
  // ao carregar o client. Verificamos se ja temos sessao valida.
  useEffect(() => {
    let unsub = null
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setHasSession(true)
        setChecking(false)
      } else {
        // Espera o evento PASSWORD_RECOVERY (caso o token ainda esteja sendo processado)
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (session?.user)) {
            setHasSession(true)
            setChecking(false)
          }
        })
        unsub = sub?.subscription
        setTimeout(() => setChecking(false), 1500)
      }
    })
    return () => { try { unsub?.unsubscribe?.() } catch {} }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (pass.length < 6) { setError('A senha deve ter no minimo 6 caracteres.'); return }
    if (pass !== confirm) { setError('As senhas nao coincidem.'); return }
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password: pass })
      if (err) { setError(err.message); setLoading(false); return }
      setSuccess(true)
      setLoading(false)
      setTimeout(async () => {
        try { await supabase.auth.signOut() } catch {}
        router.push('/login')
      }, 2000)
    } catch (e) {
      setError(e?.message || 'Erro ao alterar senha.')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', fontSize: 14, fontWeight: 400,
    padding: '12px 14px', borderRadius: 8, outline: 'none',
    color: 'var(--t1)',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'border-color 0.15s, background 0.15s',
  }

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
            <img src="/icons/nexcontrol-icon-clean.png" alt="NexControl" width={56} height={56}
              style={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }} />
          </Link>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em',
          textAlign: 'center', color: 'var(--t1)', margin: '0 0 8px', lineHeight: 1.1,
        }}>
          Definir nova senha
        </h1>
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--t2)', margin: '0 0 36px' }}>
          Escolha uma senha segura para sua conta.
        </p>

        {checking && (
          <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            Validando link...
          </div>
        )}

        {!checking && !hasSession && (
          <div style={{
            padding: '14px 16px', borderRadius: 8,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: 13, color: '#EF4444', textAlign: 'center',
          }}>
            Link invalido ou expirado.<br />
            <Link href="/login" style={{ color: 'var(--t1)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--t3)' }}>
              Voltar ao login
            </Link>
          </div>
        )}

        {!checking && hasSession && !success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--t1)', marginBottom: 8 }}>
                Nova senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  required minLength={6} autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)',
                    display: 'flex', alignItems: 'center', padding: 4 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--t1)', marginBottom: 8 }}>
                Confirmar nova senha
              </label>
              <input
                type={showPass ? 'text' : 'password'} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required minLength={6} autoComplete="new-password"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 12, color: '#EF4444' }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 20px', marginTop: 4, fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                color: 'white', background: loading ? 'rgba(229,57,53,0.5)' : '#e53935',
                transition: 'background 0.15s', opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#d32f2f' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#e53935' }}>
              {loading ? (
                <>
                  <motion.div style={{ width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', flexShrink: 0 }}
                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                  Alterando...
                </>
              ) : 'Salvar nova senha'}
            </button>
          </form>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '20px 16px', borderRadius: 10,
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)',
              color: '#10B981', fontSize: 14 }}>
            Senha alterada com sucesso.<br />
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Redirecionando para o login...</span>
          </motion.div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t4)', marginTop: 32, letterSpacing: '0.04em' }}>
          Conexao segura · Dados criptografados
        </p>
      </motion.div>
    </main>
  )
}

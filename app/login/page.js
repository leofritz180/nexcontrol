'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import Logo from '../../components/Logo'

/* ── Floating particles (memoized) ── */
function Particles() {
  const dots = useMemo(() => [
    { size: 3, x: '12%', y: '15%', color: 'rgba(229,57,53,0.45)', dur: 6, del: 0 },
    { size: 2, x: '8%',  y: '70%', color: 'rgba(236,253,245,0.35)',  dur: 8, del: 1 },
    { size: 4, x: '88%', y: '28%', color: 'rgba(229,57,53,0.25)', dur: 7, del: 0.5 },
    { size: 2, x: '85%', y: '78%', color: 'rgba(239,68,68,0.3)',  dur: 5, del: 2 },
    { size: 3, x: '5%',  y: '50%', color: 'rgba(236,253,245,0.25)',  dur: 9, del: 0.3 },
    { size: 2, x: '75%', y: '18%', color: 'rgba(255,255,255,0.3)',  dur: 7, del: 1.5 },
    { size: 2, x: '50%', y: '90%', color: 'rgba(229,57,53,0.2)',  dur: 10, del: 3 },
    { size: 3, x: '92%', y: '55%', color: 'rgba(229,57,53,0.25)', dur: 8, del: 2.5 },
  ], [])

  return dots.map((d, i) => (
    <motion.div
      key={i}
      style={{
        position: 'absolute', left: d.x, top: d.y,
        width: d.size, height: d.size, borderRadius: '50%',
        background: d.color, pointerEvents: 'none',
      }}
      animate={{ y: [0, -10, 0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: d.dur, delay: d.del, repeat: Infinity, ease: 'easeInOut' }}
    />
  ))
}

/* ── Animated orbs ── */
function BackgroundOrbs() {
  return (
    <>
      <motion.div
        style={{
          position: 'fixed', top: '-18%', left: '-12%', width: 700, height: 700,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(229,57,53,0.14) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.97, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'fixed', bottom: '-18%', right: '-8%', width: 600, height: 600,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(236,253,245,0.1) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0], scale: [1, 0.96, 1.04, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'fixed', top: '40%', right: '20%', width: 400, height: 400,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(229,57,53,0.06) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
        animate={{ x: [0, 40, -30, 0], y: [0, -30, 25, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  )
}

/* ── Logo icon (uses reusable Logo component) ── */

/* ── Main ── */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState('')

  // Race uma promise com timeout. Se estourar, retorna { timeout: true }.
  function withTimeout(promise, ms, label) {
    return Promise.race([
      promise.then(v => ({ value: v })),
      new Promise(res => setTimeout(() => res({ timeout: true, label }), ms)),
    ])
  }

  // Resolve role e navega. Se nao conseguir ler profile, manda pra /admin
  // (que tem checagem propria e redireciona pra /operator se necessario).
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
    // window.location.assign forca navegacao real — router.push pode travar em conexoes lentas
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

  // Stagger children
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
  }
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.33, 1, 0.68, 1] } },
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <motion.div
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <BackgroundOrbs />
        <Particles />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* ── Logo + Title ── */}
        <motion.div style={{ textAlign: 'center', marginBottom: 44 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            style={{ marginBottom: 22 }}
          >
            <Logo size={2} showText={false} glow/>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.33, 1, 0.68, 1] }}
            style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 34,
              letterSpacing: '-0.04em', color: '#eef2ff', margin: '0 0 8px',
            }}
          >
            <Logo showIcon={false} textSize={34} style={{ fontWeight: 900 }}/>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <motion.span
              style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: 'var(--profit)',
              }}
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(236,253,245,0.6)',
                  '0 0 0 7px rgba(236,253,245,0)',
                  '0 0 0 0 rgba(236,253,245,0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span style={{ fontSize: 11, color: 'rgba(136,150,179,0.7)', letterSpacing: '0.12em', fontWeight: 600 }}>
              SISTEMA OPERACIONAL ATIVO
            </span>
          </motion.div>
        </motion.div>

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.33, 1, 0.68, 1] }}
          style={{
            padding: 36, borderRadius: 20, position: 'relative', overflow: 'hidden',
            background: 'rgba(15, 24, 41, 0.65)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(229,57,53,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          {/* Glass gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            background: 'linear-gradient(145deg, rgba(229,57,53,0.06) 0%, transparent 40%, rgba(229,57,53,0.03) 100%)',
          }} />
          {/* Top highlight */}
          <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, pointerEvents: 'none',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <motion.h2
              variants={item}
              style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: 'var(--t1)' }}
            >
              Controle total da sua operacao
            </motion.h2>
            <motion.p
              variants={item}
              style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 28 }}
            >
              Acesse sua central de operacoes NexControl
            </motion.p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Email */}
              <motion.div variants={item}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: focused === 'email' ? 'var(--brand-bright)' : 'var(--t3)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 9, transition: 'color 0.25s',
                }}>
                  Email
                </label>
                <input
                  className="login-input"
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  placeholder="operador@nexcontrol.io"
                  required
                  style={{
                    width: '100%', fontSize: 14, fontWeight: 500,
                    padding: '13px 16px', borderRadius: 12, outline: 'none',
                    color: 'var(--t1)',
                    background: focused === 'email' ? 'rgba(229,57,53,0.06)' : 'rgba(4,8,16,0.7)',
                    border: `1px solid ${focused === 'email' ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: focused === 'email'
                      ? '0 0 0 3px rgba(229,57,53,0.12), 0 0 20px rgba(229,57,53,0.08)'
                      : 'none',
                    transition: 'all 0.25s ease',
                  }}
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={item}>
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: focused === 'pass' ? 'var(--brand-bright)' : 'var(--t3)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 9, transition: 'color 0.25s',
                }}>
                  Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="login-input"
                    type={showPass ? 'text' : 'password'} value={pass}
                    onChange={e => setPass(e.target.value)}
                    onFocus={() => setFocused('pass')}
                    onBlur={() => setFocused('')}
                    placeholder="••••••••••••"
                    required
                    style={{
                      width: '100%', fontSize: 14, fontWeight: 500,
                      padding: '13px 16px', paddingRight: 46, borderRadius: 12, outline: 'none',
                      color: 'var(--t1)',
                      background: focused === 'pass' ? 'rgba(229,57,53,0.06)' : 'rgba(4,8,16,0.7)',
                      border: `1px solid ${focused === 'pass' ? 'rgba(229,57,53,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: focused === 'pass'
                        ? '0 0 0 3px rgba(229,57,53,0.12), 0 0 20px rgba(229,57,53,0.08)'
                        : 'none',
                      transition: 'all 0.25s ease',
                    }}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--t3)', display: 'flex', alignItems: 'center',
                      transition: 'color 0.2s',
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
                  </motion.button>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="alert-error"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.div variants={item}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 8px 40px rgba(229,57,53,0.5), 0 0 60px rgba(229,57,53,0.2)' }}
                  whileTap={loading ? {} : { scale: 0.96 }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '15px 28px', marginTop: 6, fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                    borderRadius: 13, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    color: 'white', position: 'relative', overflow: 'hidden',
                    background: loading
                      ? 'linear-gradient(145deg, rgba(229,57,53,0.4), rgba(229,57,53,0.3))'
                      : 'linear-gradient(145deg, #e53935, #c62828)',
                    boxShadow: loading
                      ? 'none'
                      : '0 4px 24px rgba(229,57,53,0.4), 0 0 40px rgba(229,57,53,0.12), inset 0 1px 0 rgba(255,255,255,0.2)',
                    opacity: loading ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Shine sweep */}
                  {!loading && (
                    <span style={{
                      position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                      animation: 'shine 4s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                  )}
                  {loading ? (
                    <>
                      <motion.div
                        style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.2)',
                          borderTopColor: 'white', flexShrink: 0,
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      <span>Entrar no sistema</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Security badge */}
            <motion.div
              variants={item}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 24, padding: '10px 16px',
                background: 'rgba(236,253,245,0.04)',
                border: '1px solid rgba(236,253,245,0.1)',
                borderRadius: 10,
              }}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span style={{ fontSize: 11, color: 'rgba(236,253,245,0.6)', fontWeight: 600, letterSpacing: '0.06em' }}>
                CONEXAO SEGURA · DADOS CRIPTOGRAFADOS
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Create account ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.75, ease: [0.33, 1, 0.68, 1] }}
          style={{ textAlign: 'center', marginTop: 28 }}
        >
          <Link href="/signup" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{
                scale: 1.015,
                borderColor: 'rgba(229,57,53,0.4)',
                boxShadow: '0 0 30px rgba(229,57,53,0.1)',
              }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', maxWidth: 420, padding: '14px 24px',
                fontSize: 15, fontWeight: 700, borderRadius: 13,
                color: 'var(--brand-bright)', background: 'transparent',
                border: '1px solid var(--brand-border)',
                cursor: 'pointer', transition: 'all 0.25s ease',
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Criar conta
            </motion.div>
          </Link>
        </motion.div>

        {/* ── Footer version ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          style={{ textAlign: 'center', marginTop: 32 }}
        >
          <span style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '0.1em', fontWeight: 500 }}>
            NEXCONTROL v6.0 · PLATAFORMA OPERACIONAL
          </span>
        </motion.div>
      </motion.div>
    </main>
  )
}

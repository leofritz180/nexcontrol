'use client'
// ─────────────────────────────────────────────────────────────────────────
// /LOGIN — refeito no visual "NexControl 2.0" (item F2).
//
// SÓ O VISUAL MUDOU. Handlers, tempos, redirects e mensagens continuam
// idênticos aos da tela antiga: handleLogin, handleForgot, withTimeout,
// resolveRoleAndGo, o getSession de entrada e o translateAuthError.
// A casca (split claro/escuro) vive em components/v2/AuthSplitV2.js e os
// campos vêm do kit components/ui/campo.js.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import { translateAuthError } from '../../lib/auth-errors'
import { Campo } from '../../components/ui/campo'
import { SOMBRA } from '../../components/ui/bento'
import AuthSplitV2, { AvisoAuth, BotaoAuth, LinkAuth, OlhoSenha } from '../../components/v2/AuthSplitV2'

const ICO_EMAIL = <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 7 9 6 9-6" /></>
const ICO_SENHA = <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Esqueci a senha
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')

  async function handleForgot(e) {
    e.preventDefault()
    setForgotError(''); setForgotMsg('')
    const em = (forgotEmail || '').trim()
    if (!em || !em.includes('@')) { setForgotError('Digite um email valido.'); return }
    setForgotLoading(true)
    try {
      const redirectTo = typeof window !== 'undefined' ? (window.location.origin + '/reset-password') : undefined
      const { error: err } = await supabase.auth.resetPasswordForEmail(em, { redirectTo })
      if (err) { setForgotError(translateAuthError(err.message)); setForgotLoading(false); return }
      setForgotMsg('Se este email estiver cadastrado, voce recebera um link para redefinir a senha nos proximos minutos. Verifique tambem a caixa de spam.')
      setForgotLoading(false)
    } catch (e) {
      setForgotError(e?.message || 'Erro ao enviar email. Tente novamente.')
      setForgotLoading(false)
    }
  }

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
    // Banner do novo Instagram reaparece a cada login (limpa a marca do dia)
    try { localStorage.removeItem('nx_instabanner_v3') } catch {}
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
      if (err) { setError(translateAuthError(err.message)); setLoading(false); return }
      if (!data?.user) { setError('Falha ao autenticar. Tente novamente.'); setLoading(false); return }
      await resolveRoleAndGo(data.user.id)
    } catch (e) {
      setError(translateAuthError(e?.message, 'Erro de conexão. Verifique sua internet.'))
      setLoading(false)
    }
  }

  // ── MODAL "ESQUECI A SENHA" ────────────────────────────────────────────
  // Vai no `sobreposicao` da casca (filho direto do <main>, fora da coluna
  // animada) pra que o position:fixed continue valendo.
  const modalSenha = (
    <AnimatePresence>
      {showForgot && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setShowForgot(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(19,19,23,0.45)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 400,
              background: '#ffffff', border: '1px solid var(--b1)',
              borderRadius: 24, padding: 28, boxShadow: SOMBRA.flutuante,
            }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)', margin: '0 0 7px' }}>
              Recuperar senha
            </h2>
            <p style={{ fontSize: 13, color: 'var(--t2)', margin: '0 0 20px', lineHeight: 1.55 }}>
              Digite seu email cadastrado. Enviaremos um link para voce criar uma nova senha.
            </p>

            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Campo
                tipo="email" valor={forgotEmail} aoMudar={setForgotEmail}
                placeholder="seu@email.com" obrigatorio autoComplete="email"
                desabilitado={!!forgotMsg} icone={ICO_EMAIL}
              />

              <AnimatePresence>
                {forgotError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                    <AvisoAuth tipo="erro">{forgotError}</AvisoAuth>
                  </motion.div>
                )}
                {forgotMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                    <AvisoAuth tipo="ok">{forgotMsg}</AvisoAuth>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  style={{
                    flex: 1, padding: '12px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                    borderRadius: 30, cursor: 'pointer', color: 'var(--t2)',
                    background: 'var(--fill-1)', border: '1px solid var(--b2)',
                  }}
                >
                  {forgotMsg ? 'Fechar' : 'Cancelar'}
                </button>
                {!forgotMsg && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <BotaoAuth carregando={forgotLoading} textoCarregando="Enviando">Enviar link</BotaoAuth>
                  </div>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <AuthSplitV2
      frase="Sua operação inteira em uma tela só."
      apoio="Metas, remessas, operadores e o lucro do dia — tudo calculado sozinho, no mesmo lugar."
      rodape="Conexao segura · Dados criptografados"
      sobreposicao={modalSenha}
    >
      <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--t1)', margin: '0 0 8px' }}>
        Entrar no NexControl
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 30px' }}>
        Nao tem conta? <LinkAuth href="/signup">Criar conta</LinkAuth>.
      </p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Campo
          rotulo="Email" tipo="email" valor={email} aoMudar={setEmail}
          placeholder="seu@email.com" obrigatorio autoComplete="email" icone={ICO_EMAIL}
        />

        <div>
          <Campo
            rotulo="Senha" tipo={showPass ? 'text' : 'password'} valor={pass} aoMudar={setPass}
            placeholder="••••••••" obrigatorio autoComplete="current-password" icone={ICO_SENHA}
            sufixo={<OlhoSenha mostrando={showPass} aoAlternar={() => setShowPass(!showPass)} />}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => { setForgotEmail(email); setForgotMsg(''); setForgotError(''); setShowForgot(true) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 12, fontWeight: 600, color: 'var(--t2)', fontFamily: 'inherit',
              }}
            >
              Esqueceu a senha?
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
            >
              <AvisoAuth tipo="erro">{error}</AvisoAuth>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 4 }}>
          <BotaoAuth carregando={loading} textoCarregando="Autenticando...">Entrar</BotaoAuth>
        </div>
      </form>
    </AuthSplitV2>
  )
}

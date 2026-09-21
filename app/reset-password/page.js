'use client'
// ─────────────────────────────────────────────────────────────────────────
// REDEFINIR SENHA — visual 2.0.
//
// Usa a mesma casca do /login e do /signup (components/v2/AuthSplitV2.js),
// então as três telas de entrada agora são a mesma linguagem.
//
// A lógica NÃO mudou: a leitura da sessão de recuperação, as duas validações
// (mínimo de 6 e senhas iguais), o updateUser, o signOut e o redirect com
// 2s continuam byte a byte como estavam. Só o JSX é novo.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AuthSplitV2, { AvisoAuth, BotaoAuth, LinkAuth, OlhoSenha } from '../../components/v2/AuthSplitV2'
import { Campo } from '../../components/ui/campo'

const ICO_CADEADO = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>

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

  return (
    <AuthSplitV2
      frase="Uma senha nova, e a operação continua."
      apoio="Escolha uma senha que só você saiba. Depois de salvar, você volta para o login."
      rodape="Conexao segura · Dados criptografados"
    >
      <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--t1)', margin: '0 0 8px' }}>
        Redefinir senha
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 30px' }}>
        Lembrou a sua? <LinkAuth href="/login">Voltar ao login</LinkAuth>.
      </p>

      {/* enquanto o token é processado */}
      {checking && (
        <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: 0 }}>Verificando o link…</p>
      )}

      {/* link morto */}
      {!checking && !hasSession && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AvisoAuth tipo="erro">Link inválido ou expirado.</AvisoAuth>
          <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0 }}>
            Peça um novo link em <LinkAuth href="/login">entrar</LinkAuth>, no “Esqueceu a senha?”.
          </p>
        </div>
      )}

      {/* formulário */}
      {!checking && hasSession && !success && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Campo
            rotulo="Nova senha"
            tipo={showPass ? 'text' : 'password'}
            valor={pass} aoMudar={setPass}
            placeholder="••••••••"
            obrigatorio minLength={6} autoComplete="new-password"
            icone={ICO_CADEADO}
            ajuda="Mínimo de 6 caracteres."
            sufixo={<OlhoSenha mostrando={showPass} aoAlternar={() => setShowPass(!showPass)} />}
          />
          <Campo
            rotulo="Confirmar senha"
            tipo={showPass ? 'text' : 'password'}
            valor={confirm} aoMudar={setConfirm}
            placeholder="••••••••"
            obrigatorio minLength={6} autoComplete="new-password"
            icone={ICO_CADEADO}
            erro={confirm && pass !== confirm ? 'As senhas não coincidem.' : ''}
          />

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <AvisoAuth tipo="erro">{error}</AvisoAuth>
              </motion.div>
            )}
          </AnimatePresence>

          <BotaoAuth carregando={loading} textoCarregando="Alterando...">Salvar nova senha</BotaoAuth>
        </form>
      )}

      {/* sucesso */}
      {success && (
        <AvisoAuth tipo="sucesso">
          Senha alterada com sucesso. Redirecionando para o login…
        </AvisoAuth>
      )}
    </AuthSplitV2>
  )
}

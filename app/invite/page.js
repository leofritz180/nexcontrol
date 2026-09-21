'use client'
// ─────────────────────────────────────────────────────────────────────────
// ACEITAR CONVITE — visual 2.0.
//
// Esta é a PRIMEIRA tela que um operador vê do NexControl. Ela ficou no
// visual antigo enquanto login, cadastro e redefinir senha já eram 2.0 —
// ou seja, quem entrava por convite via a versão velha logo de cara.
//
// A lógica não mudou: o lookup do convite pelo endpoint público (RLS
// bloqueia o select anônimo), a revalidação antes de criar, a checagem do
// limite de operadores do plano e o signUp continuam byte a byte como
// estavam. Só o JSX é novo.
// ─────────────────────────────────────────────────────────────────────────
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AuthSplitV2, { AvisoAuth, BotaoAuth, LinkAuth, OlhoSenha } from '../../components/v2/AuthSplitV2'
import { Campo } from '../../components/ui/campo'

const ICO_PESSOA = <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
const ICO_EMAIL = <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>
const ICO_CADEADO = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>

export default function InviteWrapper() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative' }}>
        <div className="spinner" style={{ width: 28, height: 28, borderTopColor: 'var(--brand-bright)' }} />
      </main>
    }><InvitePage /></Suspense>
  )
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
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (token) loadInvite()
    else setLoading(false)
  }, [token])

  async function loadInvite() {
    // Usa endpoint publico (service role) — RLS impede operador anonimo ler invites direto
    try {
      const res = await fetch('/api/invite/lookup?token=' + encodeURIComponent(token))
      const data = await res.json()
      if (!data?.valid) { setLoading(false); return }
      setInvite(data.invite)
      if (data.invite.email) setEmail(data.invite.email)
      setTenant(data.tenant)
    } catch {}
    setLoading(false)
  }

  async function handleAccept(e) {
    e.preventDefault()
    if (!email || !pass || !nome.trim()) return
    setSaving(true); setError('')

    // Re-validate invite via endpoint publico (RLS bloqueia anonimo no select direto)
    const lookup = await fetch('/api/invite/lookup?token=' + encodeURIComponent(token)).then(r => r.json()).catch(() => null)
    if (!lookup?.valid) { setError('Este convite expirou ou foi cancelado.'); setSaving(false); return }
    const valid = lookup.invite

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
            setError('Este convite expirou por limite de plano. Peça ao admin para liberar uma vaga.')
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

  const equipe = tenant?.name || 'a equipe'

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative' }}>
      <div className="spinner" style={{ width: 28, height: 28, borderTopColor: 'var(--brand-bright)' }} />
    </main>
  )

  // ── link morto ──
  if (!token || !invite) return (
    <AuthSplitV2
      frase="Todo operador começa por um convite."
      apoio="O link é individual e tem prazo. Se o seu venceu, o administrador gera outro em segundos."
      rodape="Conexão segura · Dados criptografados"
    >
      <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--t1)', margin: '0 0 8px' }}>
        Convite indisponível
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 26px' }}>
        Este link expirou ou foi revogado pelo administrador.
      </p>
      <AvisoAuth tipo="erro">
        Não crie uma conta nova por fora — peça um novo link de convite ao administrador da sua operação.
      </AvisoAuth>
      <p style={{ fontSize: 13, color: 'var(--t2)', margin: '18px 0 0' }}>
        Já tem conta? <LinkAuth href="/login">Entrar</LinkAuth>.
      </p>
    </AuthSplitV2>
  )

  // ── conta criada ──
  if (success) return (
    <AuthSplitV2
      frase="Bem-vindo à operação."
      apoio="A partir de agora suas metas, remessas e resultados ficam todos num lugar só."
      rodape="Conexão segura · Dados criptografados"
    >
      <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--t1)', margin: '0 0 8px' }}>
        Conta criada
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 22px' }}>
        Você entrou em <strong style={{ color: 'var(--t1)' }}>{equipe}</strong>.
      </p>
      <AvisoAuth tipo="sucesso">
        Confirme o seu e-mail para liberar o acesso. Se não achar a mensagem, olhe no spam.
      </AvisoAuth>
      <div style={{ marginTop: 20 }}>
        <BotaoAuth tipo="button" onClick={() => router.push('/login')}>Ir para o login</BotaoAuth>
      </div>
    </AuthSplitV2>
  )

  // ── formulário ──
  return (
    <AuthSplitV2
      frase={`Você foi chamado para ${equipe}.`}
      apoio="Crie a sua conta e entre direto na operação — sem pagar nada: quem assina é o administrador."
      rodape="Conexão segura · Dados criptografados"
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 99,
        background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', marginBottom: 16,
      }}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--brand)', letterSpacing: '0.14em' }}>CONVITE</span>
      </span>

      <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--t1)', margin: '0 0 8px' }}>
        Junte-se a {equipe}
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 28px' }}>
        Você foi convidado como <strong style={{ color: 'var(--t1)' }}>{invite.role}</strong>.
      </p>

      <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Campo
          rotulo="Seu nome"
          valor={nome} aoMudar={setNome}
          placeholder="Nome completo"
          obrigatorio autoComplete="name"
          icone={ICO_PESSOA}
          ajuda="É assim que o administrador vai te ver no painel."
        />
        <Campo
          rotulo="E-mail"
          tipo="email"
          valor={email} aoMudar={setEmail}
          placeholder="seu@email.com"
          obrigatorio autoComplete="email"
          icone={ICO_EMAIL}
        />
        <Campo
          rotulo="Criar senha"
          tipo={showPass ? 'text' : 'password'}
          valor={pass} aoMudar={setPass}
          placeholder="••••••••"
          obrigatorio minLength={6} autoComplete="new-password"
          icone={ICO_CADEADO}
          ajuda="Mínimo de 6 caracteres."
          sufixo={<OlhoSenha mostrando={showPass} aoAlternar={() => setShowPass(!showPass)} />}
        />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <AvisoAuth tipo="erro">{error}</AvisoAuth>
            </motion.div>
          )}
        </AnimatePresence>

        <BotaoAuth carregando={saving} textoCarregando="Criando…">Aceitar convite e criar conta</BotaoAuth>
      </form>
    </AuthSplitV2>
  )
}

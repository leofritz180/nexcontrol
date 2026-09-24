'use client'
// ─────────────────────────────────────────────────────────────────────────
// /SIGNUP — refeito no visual "NexControl 2.0" (item F2).
//
// SÓ O VISUAL MUDOU. Continuam iguais: o ?ref= de afiliado gravado na
// sessionStorage, o attachRef, o waitForProfile, o WhatsApp obrigatório
// validado pelo normalizeBRPhone, a gravação do telefone no profile, o
// /api/tenant/start-unpaid (modelo "só entra se pagar"), o redirect pra
// /billing-mp e a tela de sucesso.
// A casca (split claro/escuro) vive em components/v2/AuthSplitV2.js e os
// campos vêm do kit components/ui/campo.js.
// ─────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import { markJustSignedUp } from '../../components/InstallPrompt'
import { translateAuthError } from '../../lib/auth-errors'
import { normalizeBRPhone } from '../../lib/phone'
import { Campo } from '../../components/ui/campo'
import { RED, RED2 } from '../../components/ui/bento'
import AuthSplitV2, { AvisoAuth, BotaoAuth, EstiloAuth, LinkAuth, MarcaAuth, OlhoSenha } from '../../components/v2/AuthSplitV2'

const ICO_OPERACAO = <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M10 12h4M10 16h4" /></>
const ICO_PESSOA = <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
const ICO_EMAIL = <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 7 9 6 9-6" /></>
const ICO_ZAP = <><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5Z" /></>
const ICO_SENHA = <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [nome, setNome] = useState('')
  const [phone, setPhone] = useState('')
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
    // convite de teste (/convite/<token>): fica guardado até o resgate
    const convite = searchParams?.get('convite')
    if (convite && typeof window !== 'undefined') {
      try { localStorage.setItem('nx_convite', convite) } catch {}
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
    // WhatsApp obrigatorio e valido (normaliza pra 55+DDD+numero)
    const normPhone = normalizeBRPhone(phone)
    if (!normPhone) { setError('WhatsApp inválido. Use DDD + número, ex: (32) 99834-8889'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { nome: nome.trim(), tenant_name: tenantName.trim(), role: 'admin', phone: normPhone } }
      })
      if (err) { setLoading(false); setError(translateAuthError(err.message)); return }
      const { data: session } = await supabase.auth.getSession()
      if (session?.session?.user) {
        markJustSignedUp()
        await attachRef(email)
        await waitForProfile(session.session.user.id)
        // Grava o WhatsApp no profile (best-effort; o PhoneGate cobre se falhar)
        try {
          await fetch('/api/profile/phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.session.access_token },
            body: JSON.stringify({ phone: normPhone }),
          })
          try { sessionStorage.setItem('nx_phone_ok', '1') } catch {}
        } catch {}
        // Novo modelo "só entra se pagar": desliga o trial da conta recém-criada
        // (rebaixa trial -> expired no servidor). Best-effort: se falhar, o signup
        // segue normal e o pior caso é a conta manter o trial antigo (fail-open).
        try {
          await fetch('/api/tenant/start-unpaid', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + session.session.access_token },
          })
        } catch {}
        // CONVITE DE TESTE: se a pessoa veio de /convite/<token>, a conta
        // nasce com a assinatura de cortesia e vai direto pro painel — sem
        // passar pela cobrança. Se o resgate falhar (link usado/expirado),
        // segue o fluxo normal e a tela de cobrança mostra o motivo.
        try {
          const tokenConvite = localStorage.getItem('nx_convite')
          if (tokenConvite) {
            const r = await fetch('/api/convite/resgatar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.session.access_token },
              body: JSON.stringify({ token: tokenConvite }),
            })
            const j = await r.json().catch(() => ({}))
            if (r.ok && j.ok) {
              localStorage.removeItem('nx_convite')
              setLoading(false)
              router.push('/admin')
              return
            }
            try { sessionStorage.setItem('nx_convite_erro', j.error || 'Convite não pôde ser aplicado.') } catch {}
            localStorage.removeItem('nx_convite')
          }
        } catch {}
        setLoading(false)
        // Após criar a conta, leva DIRETO pra tela de pagamento (não pro painel):
        // o cadastro veio do "Assinar agora".
        router.push('/billing-mp')
        return
      }
      attachRef(email)
      setLoading(false)
      setSuccess(true)
    } catch (e) {
      setLoading(false)
      setError(translateAuthError(e?.message, 'Erro de conexão. Verifique sua internet.'))
    }
  }

  // ── TELA DE SUCESSO ────────────────────────────────────────────────────
  // Só aparece quando o Supabase pede confirmação de email (sem sessão na
  // volta do signUp). O return condicional vem DEPOIS de todos os hooks —
  // hook depois de return já derrubou a produção aqui (React #300).
  if (success) return (
    <main className="nxa" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', background: '#f0f0f3', color: '#15151a',
    }}>
      {/* a casca não é montada aqui, então o estilo escopado vem direto */}
      <EstiloAuth />
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        style={{
          width: '100%', maxWidth: 400, textAlign: 'center',
          background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 28,
          padding: '38px 30px', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 30px 80px rgba(0,0,0,0.12)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}><MarcaAuth /></div>
        <div style={{
          width: 58, height: 58, borderRadius: 20,
          background: '#e3f7c6', border: '1px solid #bfe895',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#3f9b1e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.035em', color: '#15151a', margin: '0 0 8px', lineHeight: 1.1 }}>
          Conta criada
        </h1>
        <p style={{ fontSize: 13.5, color: '#6c6c78', margin: '0 0 26px', lineHeight: 1.55 }}>
          Verifique seu e-mail para confirmar o cadastro.
        </p>
        <Link href="/login" className="nxa-branco" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '14px 20px', fontSize: 14, fontWeight: 800,
          borderRadius: 30, textDecoration: 'none',
          background: `linear-gradient(135deg, ${RED2}, ${RED})`,
          boxShadow: '0 10px 26px rgba(229,57,31,0.30)',
        }}>
          Entrar no sistema
        </Link>
      </motion.div>
    </main>
  )

  return (
    <AuthSplitV2
      frase="Comece a enxergar o lucro real da operação."
      apoio="Cadastre a operação, lance as metas e as remessas: o painel fecha o dia sozinho, sem planilha."
      rodape="Conexão segura · Dados criptografados"
    >
      <h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--t1)', margin: '0 0 8px' }}>
        Criar conta NexControl
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 28px' }}>
        Já tem conta? <LinkAuth href="/login">Entrar</LinkAuth>.
      </p>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {/* "Minha Empresa" afastava quem opera sozinho, e e a maioria:
            dos 84 pagantes, 66 nao tem nenhum operador. Quem trabalha so
            nao se ve como empresa — se ve como operacao. */}
        <Campo
          rotulo="Nome da sua operação" valor={tenantName} aoMudar={setTenantName}
          placeholder="Ex.: Operação CASH HUNTER" obrigatorio icone={ICO_OPERACAO}
        />

        <Campo
          rotulo="Seu nome" valor={nome} aoMudar={setNome}
          placeholder="Nome completo" obrigatorio icone={ICO_PESSOA}
        />

        <Campo
          rotulo="Email" tipo="email" valor={email} aoMudar={setEmail}
          placeholder="seu@email.com" obrigatorio autoComplete="email" icone={ICO_EMAIL}
        />

        <Campo
          rotulo="WhatsApp (com DDD)" tipo="text" inputMode="tel" valor={phone} aoMudar={setPhone}
          placeholder="(32) 99834-8889" obrigatorio autoComplete="tel" icone={ICO_ZAP}
        />

        <Campo
          rotulo="Senha" tipo={showPass ? 'text' : 'password'} valor={pass} aoMudar={setPass}
          placeholder="Mínimo 6 caracteres" obrigatorio minLength={6} autoComplete="new-password"
          icone={ICO_SENHA}
          sufixo={<OlhoSenha mostrando={showPass} aoAlternar={() => setShowPass(!showPass)} />}
        />

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
          <BotaoAuth carregando={loading} textoCarregando="Criando conta…">Criar conta</BotaoAuth>
        </div>
      </form>

      {/* AQUI NINGUEM ESTA PAGANDO AINDA. Falar de PIX e de cancelamento no
          cadastro faz parecer que o botao "Criar conta" cobra — e o medo de
          cobranca inesperada trava o clique. O fluxo e cadastro -> plano ->
          pagamento; PIX e cancelamento sao assunto da tela de planos. */}
      <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 18, textAlign: 'center' }}>
        Leva menos de 1 minuto · Sem burocracia
      </p>
    </AuthSplitV2>
  )
}

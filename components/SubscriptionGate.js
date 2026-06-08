'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase/client'

const FREE_PATHS = ['/login', '/signup', '/invite', '/billing', '/billing-mp', '/', '/owner', '/slots', '/proxy', '/performance', '/aulas', '/demo', '/reset-password']

// Emails com acesso VITALICIO em qualquer rota, independente de
// assinatura/trial/operadores (owner + admins liberados manualmente).
const LIFETIME_EMAILS = new Set([
  'leofritz180@gmail.com',
  'luizmanutti@gmail.com',
  'leofritz178@gmail.com',
  'vlopes00@hotmail.com',
])

const fmtBR = v => Number(v||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function SubscriptionGate({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState('ok')
  // reason: 'trial' (nunca pagou) | 'expired' (PRO venceu)
  const [reason, setReason] = useState('trial')
  const [stats, setStats] = useState({ metas: 0, ops: 0, lucro: 0 })
  const cache = useRef({ checked: false, result: 'ok', ts: 0, reason: 'trial', stats: { metas: 0, ops: 0, lucro: 0 } })

  useEffect(() => {
    if (FREE_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
      setStatus('ok')
      return
    }
    // Bypass cache se ?preview=... esta na URL (modo preview do owner)
    const hasPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview')
    const now = Date.now()
    if (!hasPreview && cache.current.checked && (now - cache.current.ts) < 30000) {
      setStatus(cache.current.result)
      setReason(cache.current.reason)
      setStats(cache.current.stats)
      return
    }
    check()
  }, [pathname])

  async function check() {
    try {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { finish('ok'); return }

      // Reset tour flags se trocou de usuario (signup nova conta ou login em outra conta no mesmo browser).
      // Sem isso, localStorage do antigo dono persiste e a conta nova nunca ve os tutoriais.
      try {
        const lastUserId = localStorage.getItem('nx_last_user_id')
        if (lastUserId !== u.id) {
          Object.keys(localStorage)
            .filter(k => k.startsWith('nx_tour_completed_'))
            .forEach(k => localStorage.removeItem(k))
          localStorage.setItem('nx_last_user_id', u.id)
        }
      } catch {}

      // Modo preview pra owner: forca o bloqueio pra visualizar a UI sem precisar de sub vencida.
      //   /admin?preview=renewal → bloqueio de mensalidade vencida (ex-PRO)
      //   /admin?preview=trial   → bloqueio de trial expirado
      if (typeof window !== 'undefined' && u.email && LIFETIME_EMAILS.has(u.email.toLowerCase())) {
        const previewMode = new URLSearchParams(window.location.search).get('preview')
        if (previewMode === 'renewal') {
          finish('blocked', 'expired', { metas: 12, ops: 3, lucro: 4287.50 })
          return
        }
        if (previewMode === 'trial') {
          finish('blocked', 'trial', { metas: 0, ops: 0, lucro: 0 })
          return
        }
      }

      // Owner vitalicio — libera sem checar nada
      if (u.email && LIFETIME_EMAILS.has(u.email.toLowerCase())) { finish('ok'); return }

      const { data: p } = await supabase.from('profiles').select('role,tenant_id').eq('id', u.id).maybeSingle()
      if (!p || !p.tenant_id) { finish('ok'); return }

      const { data: t, error: tErr } = await supabase.from('tenants').select('trial_end,subscription_status').eq('id', p.tenant_id).maybeSingle()
      if (tErr || !t) { finish('ok'); return } // erro/sem leitura → NUNCA bloqueia

      const now = new Date()
      const trialEnd = t.trial_end ? new Date(t.trial_end) : null

      const { data: subs, error: subsErr } = await supabase.from('subscriptions')
        .select('status,expires_at').eq('tenant_id', p.tenant_id).eq('status', 'active')
      if (subsErr) { finish('ok'); return } // erro de leitura → nao arrisca barrar pagante

      const hasValidSub = (subs || []).some(s => !s.expires_at || new Date(s.expires_at) > now)
      // FAIL-SAFE de pagante: tenant 'active' e flag autoritativa (setada pelo webhook
      // de pagamento, revertida pra 'expired' pelo cron de renovacao). Nunca bloquear
      // quem esta 'active', mesmo que a tabela subscriptions venha vazia por glitch.
      if (hasValidSub || t.subscription_status === 'active') { finish('ok'); return }

      if (t.subscription_status === 'trial' && trialEnd && now < trialEnd) {
        finish('ok'); return
      }

      // === Bloqueado. Determina se era trial ou ja foi PRO ===
      // Se existe sub paga (mesmo vencida), trata como mensalidade vencida.
      const { data: paidSubs } = await supabase.from('subscriptions')
        .select('id, total_amount, payment_method, expires_at')
        .eq('tenant_id', p.tenant_id)
        .gt('total_amount', 0)
        .limit(1)

      const wasPaying = (paidSubs || []).length > 0
      const reasonNow = wasPaying ? 'expired' : 'trial'

      // Stats pra exibir na tela (so faz sentido pra ex-PRO)
      let statsNow = { metas: 0, ops: 0, lucro: 0 }
      if (wasPaying) {
        const [{ count: metasCount }, { count: opsCount }, { data: metasClose }] = await Promise.all([
          supabase.from('metas').select('id', { count: 'exact', head: true }).eq('tenant_id', p.tenant_id).is('deleted_at', null),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', p.tenant_id).eq('role', 'operator'),
          supabase.from('metas').select('lucro_final').eq('tenant_id', p.tenant_id).eq('status_fechamento', 'fechada').is('deleted_at', null),
        ])
        const totalLucro = (metasClose || []).reduce((a, m) => a + Number(m.lucro_final || 0), 0)
        statsNow = { metas: metasCount || 0, ops: opsCount || 0, lucro: totalLucro }
      }

      finish('blocked', reasonNow, statsNow)
    } catch {
      finish('ok')
    }
  }

  function finish(result, reasonNow = 'trial', statsNow = { metas: 0, ops: 0, lucro: 0 }) {
    cache.current = { checked: true, result, ts: Date.now(), reason: reasonNow, stats: statsNow }
    setStatus(result)
    setReason(reasonNow)
    setStats(statsNow)
  }

  if (status === 'blocked') {
    const isExpired = reason === 'expired'

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(24px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        {/* HUD grid sutil */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}/>
        {/* glow sutil */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 520, height: 520, borderRadius: '50%', pointerEvents: 'none',
          background: isExpired
            ? 'radial-gradient(circle, rgba(16,185,129,0.06), transparent 65%)'
            : 'radial-gradient(circle, rgba(229,57,53,0.08), transparent 65%)',
          filter: 'blur(40px)',
        }}/>

        <div style={{
          position: 'relative', maxWidth: 480, width: '100%', textAlign: 'center',
          background: 'linear-gradient(180deg, var(--raised), #050505)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '40px 36px',
          boxShadow: isExpired
            ? '0 0 0 1px rgba(16,185,129,0.04), 0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(16,185,129,0.05)'
            : '0 0 0 1px rgba(229,57,53,0.04), 0 40px 100px rgba(0,0,0,0.7), 0 0 80px rgba(229,57,53,0.06)',
          animation: 'scale-in 0.35s cubic-bezier(0.33,1,0.68,1) both',
        }}>
          {/* eyebrow mono */}
          <div style={{
            fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
            fontSize: 9, fontWeight: 600, letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: isExpired ? '#10B981' : '#e53935',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <span style={{ width: 24, height: 1, background: isExpired ? '#10B981' : '#e53935' }}/>
            {isExpired ? 'Assinatura · vencida' : 'Período de teste · expirado'}
            <span style={{ width: 24, height: 1, background: isExpired ? '#10B981' : '#e53935' }}/>
          </div>

          {/* Title — Instrument Serif feel */}
          <h2 style={{
            fontSize: 26, fontWeight: 700, color: '#fafafa',
            letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.15,
          }}>
            {isExpired ? 'Sua mensalidade venceu.' : 'Acesso bloqueado.'}
          </h2>

          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.62)', marginBottom: 28, lineHeight: 1.55, fontWeight: 300 }}>
            {isExpired
              ? 'Renove em segundos via PIX e retome o controle de onde parou.'
              : 'Seu período de teste chegou ao fim. Assine pra continuar operando.'}
          </p>

          {/* Stats — so aparece pra ex-PRO */}
          {isExpired && (stats.metas > 0 || stats.ops > 0 || stats.lucro > 0) && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 1, marginBottom: 24, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 8px', background: '#050505' }}>
                <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--mono, monospace)' }}>Metas</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fafafa', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>{stats.metas}</div>
              </div>
              <div style={{ padding: '14px 8px', background: '#050505' }}>
                <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--mono, monospace)' }}>Operadores</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fafafa', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>{stats.ops}</div>
              </div>
              <div style={{ padding: '14px 8px', background: '#050505' }}>
                <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, fontFamily: 'var(--mono, monospace)' }}>Lucro acum.</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#6ee7b7', fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>R$ {fmtBR(stats.lucro)}</div>
              </div>
            </div>
          )}

          {isExpired && (
            <p style={{
              fontSize: 11, color: 'rgba(255,255,255,0.42)',
              marginBottom: 22, fontStyle: 'italic',
              letterSpacing: '0.005em',
            }}>
              Tudo intacto. Seus dados continuam aqui — só esperando você voltar.
            </p>
          )}

          <button
            onClick={() => router.push(isExpired ? `/billing-mp?operators=${stats.ops || 0}&renewal=1` : '/billing')}
            className="btn btn-profit btn-lg"
            style={{
              width: '100%', justifyContent: 'center', fontSize: 14.5, fontWeight: 800,
              animation: 'cta-pulse 2.5s ease-in-out infinite',
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            {isExpired ? 'Renovar agora' : 'Desbloquear acesso'}
          </button>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 14, letterSpacing: '0.01em' }}>
            {isExpired
              ? <>PIX instantâneo · a partir de <strong style={{ color: '#e53935', fontWeight: 700 }}>R$ 39,90/mês</strong></>
              : <>A partir de <strong style={{ color: '#e53935', fontWeight: 700 }}>R$ 39,90/mês</strong></>}
          </p>

          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            style={{
              display:'block', width:'100%', marginTop: 18, padding: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'rgba(255,255,255,0.32)', textAlign: 'center',
              letterSpacing: '0.02em',
            }}
          >
            Sair da conta
          </button>
        </div>
      </div>
    )
  }

  return children
}

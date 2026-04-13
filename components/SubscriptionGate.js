'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase/client'

const FREE_PATHS = ['/login', '/signup', '/invite', '/billing', '/', '/owner']

export default function SubscriptionGate({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState('ok')
  const cache = useRef({ checked: false, result: 'ok', ts: 0 })

  useEffect(() => {
    // Skip check for free paths
    if (FREE_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
      setStatus('ok')
      return
    }
    // Use cached result if checked within last 30s
    const now = Date.now()
    if (cache.current.checked && (now - cache.current.ts) < 30000) {
      setStatus(cache.current.result)
      return
    }
    check()
  }, [pathname])

  async function check() {
    try {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { finish('ok'); return }

      const { data: p } = await supabase.from('profiles').select('role,tenant_id').eq('id', u.id).maybeSingle()
      if (!p || !p.tenant_id) { finish('ok'); return }

      const { data: t } = await supabase.from('tenants').select('trial_end,subscription_status').eq('id', p.tenant_id).maybeSingle()
      if (!t) { finish('ok'); return }

      const now = new Date()
      const trialEnd = new Date(t.trial_end)

      // First check: active subscription in subscriptions table (source of truth)
      const { data: sub } = await supabase.from('subscriptions')
        .select('status,expires_at').eq('tenant_id', p.tenant_id).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle()

      if (sub && new Date(sub.expires_at) > now) {
        finish('ok'); return
      }

      // Second check: tenant-level status
      if (t.subscription_status === 'active') {
        // tenant says active but no valid subscription found — allow but may be stale
        finish('ok'); return
      }

      // Third check: trial
      if (t.subscription_status === 'trial' && now < trialEnd) {
        finish('ok'); return
      }

      finish('blocked')
    } catch {
      finish('ok')
    }
  }

  function finish(result) {
    cache.current = { checked: true, result, ts: Date.now() }
    setStatus(result)
  }

  if (status === 'blocked') return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(4,8,16,0.95)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        maxWidth: 480, width: '100%', textAlign: 'center',
        background: 'var(--surface)', border: '1px solid var(--loss-border)',
        borderRadius: 24, padding: '48px 40px',
        boxShadow: '0 0 80px rgba(240,61,107,0.08), 0 40px 80px rgba(0,0,0,0.5)',
        animation: 'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--loss-dim)', border: '1px solid var(--loss-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>Acesso bloqueado</h2>
        <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 6 }}>Seu periodo de teste expirou.</p>
        <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 28 }}>Assine o NexControl para continuar operando. Seus dados estao seguros.</p>
        <button onClick={() => router.push('/billing')} className="btn btn-profit btn-lg" style={{ width: '100%', justifyContent: 'center', fontSize: 15, fontWeight: 800, animation: 'cta-pulse 2.5s ease-in-out infinite' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Desbloquear acesso
        </button>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 16 }}>A partir de <strong style={{ color: 'var(--brand-bright)' }}>R$ 39,90/mes</strong></p>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{ display:'block', width:'100%', marginTop: 16, padding: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t4)', textAlign: 'center' }}>
          Sair da conta
        </button>
      </div>
    </div>
  )

  return children
}

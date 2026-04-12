'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase/client'
import { TrialStatusBadge } from './TrialBanner'
import dynamic from 'next/dynamic'
const PushManager = dynamic(() => import('./PushManager'), { ssr: false })

function Logo() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
      background: '#e53935',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={14} height={14} viewBox="0 0 28 28" fill="none">
        <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
        <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
        <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
      </svg>
    </div>
  )
}

const OWNER_EMAIL = 'leofritz180@gmail.com'

export default function Header({ userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  const name = userName || userEmail?.split('@')[0] || '?'
  const initial = name[0].toUpperCase()

  return (<>
    <header style={{
      position: 'sticky', top: 0, zIndex: 200, height: 52,
      background: 'rgba(5,7,15,0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1380, margin: '0 auto', padding: '0 28px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        {/* Logo */}
        <Link href="/operator" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Logo/>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--t1)' }}>
            Nex<span style={{ color: '#ff4444' }}>Control</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {[
            { href: '/operator', label: 'Operador' },
            { href: '/pix', label: 'Chaves PIX' },
            ...(isAdmin ? [
              { href: '/admin', label: 'Admin' },
              { href: '/faturamento', label: 'Faturamento' },
              { href: '/billing', label: 'Assinatura' },
              { href: '/tutorial', label: 'Tutorial' },
              ...(userEmail === OWNER_EMAIL ? [{ href: '/owner', label: 'Owner' }] : []),
            ] : []),
          ].map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                style={{
                  padding: '6px 14px', borderRadius: 6,
                  fontSize: 13, fontWeight: 500,
                  color: active ? 'var(--t1)' : 'var(--t3)',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: 'color 0.15s, background 0.15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--t2)' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--t3)' } }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAdmin && <TrialStatusBadge tenant={tenant} subscription={subscription}/>}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 10px 4px 4px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'var(--raised)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>{initial}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--t2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          </div>
          <button onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              fontSize: 12, fontWeight: 500, color: 'var(--t3)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair
          </button>
        </div>
      </div>
    </header>
    <PushManager userId={userId} tenantId={tenantId}/>
  </>)
}

'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase/client'
import { TrialStatusBadge } from './TrialBanner'
import dynamic from 'next/dynamic'
const PushManager = dynamic(() => import('./PushManager'), { ssr: false })

/* no wrapper, no container, just the image */

export default function Header({ userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  const name = userName || userEmail?.split('@')[0] || '?'
  const initial = name[0].toUpperCase()

  return (<>
    <header style={{ position:'sticky', top:0, zIndex:200, height:62, background:'rgba(6,11,20,0.88)', backdropFilter:'blur(28px) saturate(180%)', WebkitBackdropFilter:'blur(28px) saturate(180%)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth:1380, margin:'0 auto', padding:'0 28px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        {/* Logo */}
        <Link href="/operator" style={{ display:'flex', alignItems:'center', gap:8, transition:'transform 0.3s ease' }}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.03)'}
          onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
          <Image src="/branding/logo-nexcontrol.png" alt="NexControl" width={44} height={44} priority quality={100} style={{ objectFit:'contain', flexShrink:0 }}/>
          <span style={{ fontWeight:700, fontSize:16, letterSpacing:'-0.02em', color:'var(--t1)' }}>
            Nex<span style={{ color:'var(--brand-bright)' }}>Control</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display:'flex', alignItems:'center', gap:2 }}>
          {[
            { href:'/operator', label:'Operador' },
            { href:'/pix', label:'Chaves PIX' },
            ...(isAdmin ? [{ href:'/admin', label:'Admin' },{ href:'/faturamento', label:'Faturamento' },{ href:'/billing', label:'Assinatura' }] : []),
          ].map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600, letterSpacing:'0.01em', color:active?'var(--t1)':'var(--t3)', background:active?'rgba(255,255,255,0.06)':'transparent', border:active?'1px solid rgba(255,255,255,0.08)':'1px solid transparent', transition:'all 0.2s' }}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.color='var(--t2)';e.currentTarget.style.background='rgba(255,255,255,0.03)'}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.color='var(--t3)';e.currentTarget.style.background='transparent'}}}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isAdmin && <TrialStatusBadge tenant={tenant} subscription={subscription}/>}
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px 5px 5px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:800, color:'white' }}>{initial}</span>
            </div>
            <span style={{ fontSize:12, color:'var(--t2)', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
          </div>
          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair
          </button>
        </div>
      </div>
    </header>
    <PushManager userId={userId} tenantId={tenantId}/>
    </>
  )
}

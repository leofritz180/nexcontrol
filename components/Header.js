'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase/client'
import { TrialStatusBadge } from './TrialBanner'
import dynamic from 'next/dynamic'
const PushManager = dynamic(() => import('./PushManager'), { ssr: false })

function AnimatedLogo() {
  return (
    <div style={{ position:'relative', width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      {/* Orbit ring 1 */}
      <div style={{
        position:'absolute', inset:-4, borderRadius:'50%',
        border:'1px solid transparent',
        borderTopColor:'rgba(59,130,246,0.5)',
        borderRightColor:'rgba(59,130,246,0.15)',
        animation:'orbit 3s linear infinite',
        filter:'drop-shadow(0 0 3px rgba(59,130,246,0.4))',
      }}/>
      {/* Orbit ring 2 */}
      <div style={{
        position:'absolute', inset:-7, borderRadius:'50%',
        border:'1px solid transparent',
        borderBottomColor:'rgba(34,197,94,0.4)',
        borderLeftColor:'rgba(34,197,94,0.1)',
        animation:'orbit-reverse 5s linear infinite',
        filter:'drop-shadow(0 0 3px rgba(34,197,94,0.3))',
      }}/>
      {/* Particle dots */}
      <div style={{
        position:'absolute', width:3, height:3, borderRadius:'50%', background:'#22C55E',
        top:-5, left:'50%', marginLeft:-1.5,
        boxShadow:'0 0 6px #22C55E',
        animation:'orbit 3s linear infinite',
        transformOrigin:'1.5px 22px',
      }}/>
      <div style={{
        position:'absolute', width:2, height:2, borderRadius:'50%', background:'#60A5FA',
        bottom:-6, left:'50%', marginLeft:-1,
        boxShadow:'0 0 5px #60A5FA',
        animation:'orbit-reverse 5s linear infinite',
        transformOrigin:'1px -16px',
      }}/>
      {/* Glow base */}
      <div style={{
        position:'absolute', inset:0, borderRadius:9,
        background:'linear-gradient(135deg,#3B82F6,#2563EB)',
        boxShadow:'0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.1)',
        animation:'breathe 4s ease-in-out infinite',
      }}/>
      {/* Icon */}
      <svg width={14} height={14} viewBox="0 0 28 28" fill="none" style={{ position:'relative', zIndex:2 }}>
        <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
        <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
        <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
        <circle cx="21" cy="8" r="3" fill="rgba(34,197,94,1)"/>
      </svg>
    </div>
  )
}

export default function Header({ userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()
  const router = useRouter()
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  const name = userName || userEmail?.split('@')[0] || '?'
  const initial = name[0].toUpperCase()

  return (<>
    <header style={{ position:'sticky', top:0, zIndex:200, height:58, background:'rgba(10,10,10,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth:1380, margin:'0 auto', padding:'0 28px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        {/* Logo */}
        <Link href="/operator" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <AnimatedLogo/>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.03em', color:'var(--t1)' }}>
            Nex<span style={{ color:'var(--brand-bright)' }}>Control</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display:'flex', alignItems:'center', gap:2 }}>
          {[
            { href:'/operator', label:'Operador' },
            { href:'/pix', label:'Chaves PIX' },
            ...(isAdmin ? [{ href:'/admin', label:'Admin' },{ href:'/faturamento', label:'Faturamento' },{ href:'/billing', label:'Assinatura' },{ href:'/tutorial', label:'Tutorial' }] : []),
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
            <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#3B82F6,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
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

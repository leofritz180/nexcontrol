'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { TrialStatusBadge } from './TrialBanner'
import dynamic from 'next/dynamic'
const PushManager = dynamic(() => import('./PushManager'), { ssr: false })

const OWNER_EMAIL = 'leofritz180@gmail.com'

const NAV_ITEMS = {
  admin: [
    { href:'/admin', label:'Admin', icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1' },
    { href:'/faturamento', label:'Faturamento', icon:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { href:'/pix', label:'Chaves PIX', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { href:'/billing', label:'Assinatura', icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { href:'/tutorial', label:'Tutorial', icon:'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
  ],
  operator: [
    { href:'/operator', label:'Operador', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10' },
    { href:'/pix', label:'Chaves PIX', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ],
}

export default function Sidebar({ userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const name = userName || userEmail?.split('@')[0] || '?'
  const initial = name[0].toUpperCase()
  const items = isAdmin ? NAV_ITEMS.admin : NAV_ITEMS.operator
  const allItems = [
    ...items,
    ...(isAdmin && userEmail === OWNER_EMAIL ? [{ href:'/owner', label:'Owner', icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }] : []),
  ]

  const sidebarContent = (
    <>
      {/* Logo */}
      <Link href={isAdmin?'/admin':'/operator'} style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 20px 24px', textDecoration:'none' }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width={14} height={14} viewBox="0 0 28 28" fill="none">
            <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
            <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
            <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
          </svg>
        </div>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--t1)' }}>
          Nex<span style={{ color:'#ff4444' }}>Control</span>
        </span>
      </Link>

      {/* Nav items */}
      <nav style={{ flex:1, padding:'0 10px', display:'flex', flexDirection:'column', gap:2 }}>
        {allItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 14px', borderRadius:10, textDecoration:'none',
                fontSize:13, fontWeight:active?600:500,
                color: active ? 'var(--t1)' : 'var(--t3)',
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderLeft: active ? '3px solid #e53935' : '3px solid transparent',
                transition:'all 0.15s ease',
                position:'relative',
              }}
              onMouseEnter={e => { if(!active) { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='var(--t2)' }}}
              onMouseLeave={e => { if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--t3)' }}}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, opacity:active?1:0.5 }}>
                <path d={item.icon}/>
              </svg>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Trial badge */}
      {isAdmin && (
        <div style={{ padding:'0 14px 12px' }}>
          <TrialStatusBadge tenant={tenant} subscription={subscription}/>
        </div>
      )}

      {/* User + logout */}
      <div style={{ padding:'12px 14px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:'var(--raised)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--t2)' }}>{initial}</span>
          </div>
          <span style={{ fontSize:12, color:'var(--t2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{name}</span>
        </div>
        <button onClick={logout}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:500,
            color:'var(--t3)', background:'transparent', border:'1px solid rgba(255,255,255,0.06)',
            cursor:'pointer', transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='var(--t1)' }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--t3)' }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        position:'fixed', left:0, top:0, bottom:0, width:240, zIndex:200,
        background:'rgba(6,10,18,0.95)',
        backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
        borderRight:'1px solid rgba(255,255,255,0.05)',
        display:'flex', flexDirection:'column',
        overflowY:'auto',
      }}
        className="sidebar-desktop"
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="sidebar-mobile-toggle"
        style={{
          position:'fixed', top:14, left:14, zIndex:250,
          width:36, height:36, borderRadius:9, border:'none',
          background:'rgba(255,255,255,0.06)', cursor:'pointer',
          display:'none', alignItems:'center', justifyContent:'center',
        }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth={2} strokeLinecap="round">
          {mobileOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
        </svg>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setMobileOpen(false)}
              style={{ position:'fixed', inset:0, zIndex:240, background:'rgba(0,0,0,0.6)' }}
              className="sidebar-mobile-overlay"
            />
            <motion.aside
              initial={{x:-260}} animate={{x:0}} exit={{x:-260}}
              transition={{duration:0.25,ease:[0.33,1,0.68,1]}}
              style={{
                position:'fixed', left:0, top:0, bottom:0, width:240, zIndex:245,
                background:'rgba(6,10,18,0.98)',
                borderRight:'1px solid rgba(255,255,255,0.05)',
                display:'flex', flexDirection:'column',
                overflowY:'auto',
              }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <PushManager userId={userId} tenantId={tenantId}/>

      {/* CSS for responsive */}
      <style jsx global>{`
        .sidebar-desktop { display: flex !important; }
        .sidebar-mobile-toggle { display: none !important; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-toggle { display: flex !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}

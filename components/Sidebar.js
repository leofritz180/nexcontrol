'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import Logo from './Logo'
import dynamic from 'next/dynamic'
const PushManager = dynamic(() => import('./PushManager'), { ssr: false })

const OWNER_EMAIL = 'leofritz180@gmail.com'

const ADMIN_NAV = [
  { href:'/admin', label:'Admin', icon:'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { href:'/operadores', label:'Operadores', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
  { href:'/redes', label:'Redes', icon:'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { href:'/faturamento', label:'Faturamento', icon:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { href:'/pix', label:'Chaves PIX', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href:'/billing', label:'Assinatura', icon:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { href:'/slots', label:'Slots Premium', icon:'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { href:'/tutorial', label:'Tutorial', icon:'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const OP_NAV = [
  { href:'/operator', label:'Operador', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href:'/pix', label:'Chaves PIX', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
]

export default function Sidebar({ userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ownSub, setOwnSub] = useState(null)

  // Sidebar fetches subscription independently — never depends on parent passing it
  useEffect(() => {
    if (!tenantId) return
    supabase.from('subscriptions').select('status,expires_at')
      .eq('tenant_id', tenantId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data) setOwnSub(data) })
  }, [tenantId])

  async function logout() { await supabase.auth.signOut(); router.push('/login') }

  const name = userName || userEmail?.split('@')[0] || '?'
  const initial = name[0].toUpperCase()
  const items = isAdmin ? ADMIN_NAV : OP_NAV
  const allItems = [
    ...items,
    ...(isAdmin && userEmail === OWNER_EMAIL ? [{ href:'/owner', label:'Owner', icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }] : []),
  ]

  // Use own fetch OR parent prop — whichever confirms PRO
  const sub = ownSub || subscription
  const subActive = sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())

  const content = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Logo ── */}
      <Link href={isAdmin?'/admin':'/operator'} onClick={()=>setMobileOpen(false)}
        style={{ display:'flex', alignItems:'center', padding:'22px 22px 28px', textDecoration:'none' }}>
        <Logo size={1} glow style={{ gap:11 }}/>
      </Link>

      {/* ── Nav ── */}
      <nav style={{ flex:1, padding:'0 12px', display:'flex', flexDirection:'column', gap:2 }}>
        {allItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <motion.div key={item.href} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}>
              <Link href={item.href} onClick={()=>setMobileOpen(false)}
                style={{
                  display:'flex', alignItems:'center', gap:11,
                  padding:'10px 14px', borderRadius:10, textDecoration:'none',
                  fontSize:13, fontWeight: active?600:500,
                  color: active?'var(--t1)':'var(--t3)',
                  background: active?'rgba(255,255,255,0.05)':'transparent',
                  borderLeft: active?'3px solid #e53935':'3px solid transparent',
                  boxShadow: active?'inset 0 0 20px rgba(229,57,53,0.04)':'none',
                  transition:'all 0.2s ease',
                }}
                onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.color='var(--t2)'}}}
                onMouseLeave={e=>{ if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--t3)'}}}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, opacity:active?0.9:0.4 }}>
                  <path d={item.icon}/>
                </svg>
                {item.label}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* ── PRO CTA ── */}
      {isAdmin && !subActive && (
        <div style={{ padding:'0 14px 14px' }}>
          <motion.div
            animate={{ boxShadow:['0 0 15px rgba(229,57,53,0.08)','0 0 25px rgba(229,57,53,0.15)','0 0 15px rgba(229,57,53,0.08)'] }}
            transition={{ duration:3, repeat:Infinity }}
            style={{ borderRadius:10 }}
          >
          <Link href="/billing" onClick={()=>setMobileOpen(false)}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'11px 16px', borderRadius:10, textDecoration:'none',
              fontSize:12, fontWeight:700, color:'#ff4444',
              background:'rgba(229,57,53,0.08)', border:'1px solid rgba(229,57,53,0.18)',
              transition:'all 0.2s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(229,57,53,0.14)';e.currentTarget.style.boxShadow='0 0 20px rgba(229,57,53,0.08)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(229,57,53,0.08)';e.currentTarget.style.boxShadow='none'}}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth={2} strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Desbloquear PRO
          </Link>
          </motion.div>
        </div>
      )}

      {/* ── Plan status card ── */}
      <div style={{ padding:'0 14px 14px' }}>
        <div style={{
          padding:'12px 14px', borderRadius:10,
          background: subActive?'rgba(34,197,94,0.05)':'rgba(255,255,255,0.02)',
          border:`1px solid ${subActive?'rgba(34,197,94,0.12)':'rgba(255,255,255,0.04)'}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:subActive?'#22C55E':'var(--warn)' }}/>
            <span style={{ fontSize:10, fontWeight:600, color:subActive?'var(--profit)':'var(--warn)' }}>
              {subActive?'PRO ativo':'Trial ativo'}
            </span>
          </div>
          <p style={{ fontSize:10, color:'var(--t4)', margin:0 }}>
            {subActive?'Plano PRO':'3 dias de teste'}
          </p>
        </div>
      </div>

      {/* ── User + logout ── */}
      <div style={{ padding:'14px 14px 18px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)' }}>{initial}</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:600, color:'var(--t1)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
            <p style={{ fontSize:9, color:'var(--t4)', margin:'1px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userEmail}</p>
          </div>
        </div>
        <button onClick={logout}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'8px 12px', borderRadius:8, fontSize:11, fontWeight:500,
            color:'var(--t3)', background:'transparent', border:'1px solid rgba(255,255,255,0.05)',
            cursor:'pointer', transition:'all 0.15s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='var(--t1)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--t3)'}}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="sidebar-desktop" style={{
        position:'fixed', left:0, top:0, bottom:0, width:248, zIndex:200,
        background:'rgba(6,10,18,0.97)',
        backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
        borderRight:'1px solid rgba(255,255,255,0.05)',
        boxShadow:'4px 0 24px rgba(0,0,0,0.15)',
        overflowY:'auto', overflowX:'hidden',
      }}>
        {content}
      </aside>

      {/* Mobile toggle */}
      <motion.button
        whileTap={{ scale:0.92 }}
        onClick={()=>setMobileOpen(!mobileOpen)}
        className="sidebar-mobile-toggle"
        style={{
          position:'fixed', top:14, left:14, zIndex:250,
          width:38, height:38, borderRadius:10, border:'none',
          background:'rgba(255,255,255,0.06)', cursor:'pointer',
          display:'none', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
        }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth={2} strokeLinecap="round">
          {mobileOpen
            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
          }
        </svg>
      </motion.button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (<>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setMobileOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:240, background:'rgba(0,0,0,0.6)' }}/>
          <motion.aside
            initial={{x:-260}} animate={{x:0}} exit={{x:-260}}
            transition={{ duration:0.25, ease:[0.33,1,0.68,1] }}
            style={{
              position:'fixed', left:0, top:0, bottom:0, width:248, zIndex:245,
              background:'rgba(6,10,18,0.98)',
              borderRight:'1px solid rgba(255,255,255,0.05)',
              overflowY:'auto',
            }}>
            {content}
          </motion.aside>
        </>)}
      </AnimatePresence>

      <PushManager userId={userId} tenantId={tenantId}/>

      <style jsx global>{`
        .sidebar-desktop { display: block !important; }
        .sidebar-mobile-toggle { display: none !important; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-toggle { display: flex !important; }
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}

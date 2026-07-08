'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import Logo from './Logo'
import { isRedesign } from '../lib/redesign'
import { isPushSupported, getPermissionState, registerSW, subscribePush, savePushSubscription } from '../lib/pushClient'
import ProfileModal from './ProfileModal'
import { loadLocalProfile } from '../lib/profileLocal'
import { aulasEnabled } from '../lib/aulas-tenants'
import { networkEnabled, NETWORK_GA } from '../lib/network-access'
import dynamic from 'next/dynamic'
const PushManager = dynamic(() => import('./PushManager'), { ssr: false })

const OWNER_EMAIL = 'leofritz180@gmail.com'

const AULAS_VIP_ITEM = { href:'/aulas', label:'Aulas VIP', icon:'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z', vip: true }
const NETWORK_ITEM = { href:'/network', label:'Network', icon:'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z', network: true }

const ADMIN_NAV = [
  { href:'/admin', label:'Admin', icon:'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { href:'/operadores', label:'Operadores', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
  { href:'/redes', label:'Redes', icon:'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { href:'/faturamento', label:'Faturamento', icon:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { href:'/custos', label:'Custos', icon:'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { href:'/pix', label:'Chaves PIX', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href:'/afiliados', label:'Afiliados', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M13 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 100-4 2 2 0 000 4zM9 13a4 4 0 00-4 4v2h8v-2a4 4 0 00-4-4z' },
  { href:'/billing', label:'Assinatura', icon:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { href:'/slots', label:'Slots Premium', icon:'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z', pro: true },
  { href:'/proxy', label:'Loja Proxy', icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', bettify: true },
  { href:'/minhas-proxies', label:'Minhas Proxies', icon:'M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4' },
  { href:'/tutorial', label:'Tutorial', icon:'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

const OP_NAV = [
  { href:'/operator', label:'Operador', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href:'/performance', label:'Performance', icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { href:'/slots', label:'Slots Premium', icon:'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z', pro: true },
  { href:'/proxy', label:'Loja Proxy', icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', bettify: true },
  { href:'/minhas-proxies', label:'Minhas Proxies', icon:'M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4' },
  { href:'/pix', label:'Chaves PIX', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
]

export default function Sidebar({ userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ownSub, setOwnSub] = useState(null)
  const [showAulas, setShowAulas] = useState(false)
  const [pushState, setPushState] = useState('loading') // loading|unsupported|default|prompt|granted|denied|error
  const [pushBusy, setPushBusy] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [localProfile, setLocalProfile] = useState({})
  const [netUnread, setNetUnread] = useState(false)

  // Perfil estendido local (foto, nome custom) — reflete no avatar/nome da sidebar
  useEffect(() => {
    if (!userId) return
    const refresh = () => setLocalProfile(loadLocalProfile(userId))
    refresh()
    window.addEventListener('profile:updated', refresh)
    return () => window.removeEventListener('profile:updated', refresh)
  }, [userId])

  // Sidebar fetches subscription independently — never depends on parent passing it
  useEffect(() => {
    if (!tenantId) return
    supabase.from('subscriptions').select('status,expires_at')
      .eq('tenant_id', tenantId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data) setOwnSub(data) })
  }, [tenantId])

  // Aulas VIP aparece para tenants com a função habilitada (ver lib/aulas-tenants)
  useEffect(() => {
    setShowAulas(aulasEnabled(tenantId))
  }, [tenantId])

  // Network: dot de "tem mensagem nova" (compara ultima msg com o "visto" salvo)
  useEffect(() => {
    if (!isAdmin || !networkEnabled(userEmail)) return
    let stop = false
    async function check() {
      try {
        const { data: s } = await supabase.auth.getSession()
        const tok = s?.session?.access_token; if (!tok) return
        const r = await fetch('/api/network/status', { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json()
        let seen = null; try { seen = localStorage.getItem('nx_net_seen') } catch {}
        if (!stop) setNetUnread(!!d.latest && (!seen || d.latest > seen))
      } catch {}
    }
    check()
    const id = setInterval(() => { if (document.visibilityState === 'visible') check() }, 30000)
    const onFocus = () => check()
    window.addEventListener('focus', onFocus)
    return () => { stop = true; clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [isAdmin, userEmail])

  async function logout() { await supabase.auth.signOut(); router.push('/login') }

  // Estado do push (botao fixo no menu pra ativar — vale pra admin e operador)
  useEffect(() => {
    if (!isPushSupported()) { setPushState('unsupported'); return }
    setPushState(getPermissionState())
  }, [])

  async function enablePush() {
    if (pushBusy) return
    setPushBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setPushState(permission); setPushBusy(false); return }
      const reg = await registerSW()
      if (!reg) { setPushState('error'); setPushBusy(false); return }
      const sub = await subscribePush(reg)
      const saved = await savePushSubscription(sub, userId, tenantId)
      if (saved) {
        setPushState('granted')
        fetch('/api/push/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, title: 'NexControl', body: 'Notificações ativadas — você receberá alertas em tempo real', url: isAdmin ? '/admin' : '/operator' }),
        }).catch(() => {})
      } else { setPushState('error') }
    } catch (e) { setPushState('error') }
    setPushBusy(false)
  }

  const name = localProfile.nome || userName || userEmail?.split('@')[0] || '?'
  const initial = name[0].toUpperCase()
  const avatar = localProfile.avatar
  const myRole = userEmail === OWNER_EMAIL ? 'owner' : (isAdmin ? 'admin' : 'operator')
  const baseItems = isAdmin ? ADMIN_NAV : OP_NAV
  // Inject Aulas VIP after Tutorial (admin) or after Chaves PIX (operator)
  const items = showAulas
    ? (() => {
        const arr = [...baseItems]
        const anchor = isAdmin
          ? arr.findIndex(i => i.href === '/tutorial')
          : arr.findIndex(i => i.href === '/pix')
        arr.splice(anchor !== -1 ? anchor + 1 : arr.length, 0, AULAS_VIP_ITEM)
        return arr
      })()
    : baseItems

  // Use own fetch OR parent prop — whichever confirms PRO
  const sub = ownSub || subscription
  const subActive = sub?.status === 'active' && (!sub.expires_at || new Date(sub.expires_at) > new Date())

  const allItems = [
    ...items,
    // Network — comunidade entre admins. Allowlist (fase teste) OU, no rollout
    // geral (NETWORK_GA), qualquer admin PRO ativo.
    ...(isAdmin && (networkEnabled(userEmail) || (NETWORK_GA && subActive)) ? [NETWORK_ITEM] : []),
    ...(isAdmin && userEmail === OWNER_EMAIL ? [
      { href:'/planejamento', label:'Controle Op.', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { href:'/owner', label:'Owner', icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    ] : []),
  ]

  const redesign = isRedesign(userEmail)

  const content = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Logo ── */}
      <Link href={isAdmin?'/admin':'/operator'} onClick={()=>setMobileOpen(false)}
        style={{ display:'flex', alignItems:'center', padding:'22px 22px 28px', textDecoration:'none' }}>
        <Logo size={0.875} style={{ gap:10 }}/>
      </Link>

      {/* ── Nav ── */}
      <nav style={{ flex:1, padding:'0 12px', display:'flex', flexDirection:'column', gap:2 }}>
        {allItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const bettify = item.bettify
          const BETT_BG = 'linear-gradient(135deg, rgba(255,107,0,0.16), rgba(255,107,0,0.05))'
          const BETT_BG_HOVER = 'linear-gradient(135deg, rgba(255,107,0,0.28), rgba(255,107,0,0.09))'
          return (
            <Link key={item.href} href={item.href} onClick={()=>setMobileOpen(false)}
              data-tour={`menu-${item.href.replace(/^\//, '').replace(/\//g, '-')}`}
              style={{
                display:'flex', alignItems:'center', gap: redesign?13:11,
                padding: redesign?'10px 14px':'9px 12px', borderRadius: redesign?10:8, textDecoration:'none',
                fontSize: redesign?13.5:13, fontWeight: bettify?700:(active?(redesign?600:500):(redesign?500:400)),
                color: bettify ? 'var(--t1)' : (active?'var(--t1)':'var(--t3)'),
                background: bettify ? BETT_BG : (active?'var(--raised)':'transparent'),
                border: bettify ? '1px solid rgba(255,107,0,0.4)' : '1px solid transparent',
                boxShadow: bettify ? '0 0 18px rgba(255,107,0,0.10)' : 'none',
                transition:'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e=>{ if(bettify){ e.currentTarget.style.background=BETT_BG_HOVER; e.currentTarget.style.boxShadow='0 6px 22px rgba(255,107,0,0.22)' } else if(!active){e.currentTarget.style.background='var(--raised)';e.currentTarget.style.color='var(--t2)'} }}
              onMouseLeave={e=>{ if(bettify){ e.currentTarget.style.background=BETT_BG; e.currentTarget.style.boxShadow='0 0 18px rgba(255,107,0,0.10)' } else if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--t3)'} }}
            >
              {bettify ? (
                <img className="sb-ico" src="/bettify-logo.png" alt="Bettify" width={redesign?22:18} height={redesign?22:18}
                  style={{ flexShrink:0, objectFit:'contain', filter:'drop-shadow(0 0 6px rgba(255,107,0,0.55))' }} />
              ) : (
                <svg className="sb-ico" width={redesign?20:15} height={redesign?20:15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={redesign?1.9:1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, opacity: redesign ? (active?1:0.85) : (active?0.9:0.45) }}>
                  <path d={item.icon}/>
                </svg>
              )}
              <span className="sb-label">{item.label}</span>
              {bettify && (
                <span className="sb-label" style={{
                  marginLeft:'auto', fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:4,
                  background:'rgba(255,107,0,0.18)', color:'#FF8A3D', border:'1px solid rgba(255,107,0,0.4)',
                  letterSpacing:'0.06em',
                }}>PARCEIRO</span>
              )}
              {item.pro && !subActive && (
                <span style={{
                  marginLeft:'auto', fontSize:8, fontWeight:600, padding:'2px 6px', borderRadius:4,
                  background:'var(--fill-2)', color:'var(--t3)',
                  letterSpacing:'0.06em',
                }}>PRO</span>
              )}
              {item.vip && (
                <span style={{
                  marginLeft:'auto', fontSize:8, fontWeight:600, padding:'2px 6px', borderRadius:4,
                  background:'var(--fill-2)', color:'var(--t3)',
                  letterSpacing:'0.06em',
                }}>VIP</span>
              )}
              {item.network && netUnread && (
                <span style={{
                  marginLeft:'auto', width:8, height:8, borderRadius:'50%', flexShrink:0,
                  background:'#e53935', boxShadow:'0 0 8px #e53935',
                  animation:'notif-pulse 1.8s ease-in-out infinite',
                }} title="Mensagens novas"/>
              )}
              {item.network && !netUnread && (
                <span className="sb-label" style={{
                  marginLeft:'auto', fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:4,
                  background:'rgba(229,57,53,0.16)', color:'#ff7a7a', border:'1px solid rgba(229,57,53,0.4)',
                  letterSpacing:'0.06em',
                }}>BETA</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── PRO CTA — clean ── */}
      {isAdmin && !subActive && (
        <div style={{ padding:'0 12px 12px' }}>
          <Link href="/billing" onClick={()=>setMobileOpen(false)}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'10px 14px', borderRadius:8, textDecoration:'none',
              fontSize:12, fontWeight:500, color:'#fff',
              background:'rgba(255,255,255,0.78)', border:'none',
              transition:'background 0.15s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background='#2563eb'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.78)'}}
          >
            <span className="sb-label">Desbloquear PRO</span>
          </Link>
        </div>
      )}

      {/* ── Plan status — minimal ── */}
      <div style={{ padding:'0 12px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px' }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:subActive?'var(--profit)':'#9ca3af' }}/>
          <span className="sb-label" style={{ fontSize:11, color:'var(--t3)', fontWeight:400 }}>
            {subActive?'PRO ativo':'Trial · 3 dias'}
          </span>
        </div>
      </div>

      {/* ── Ativar notificacoes (push) — fixo no menu, admin + operador ── */}
      {userId && tenantId && pushState !== 'unsupported' && pushState !== 'loading' && (
        <div style={{ padding:'0 12px 12px' }}>
          {pushState === 'granted' ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, fontSize:12, fontWeight:500, color:'var(--profit)', background:'rgba(209,250,229,0.06)', border:'1px solid rgba(209,250,229,0.18)' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d="M20 6L9 17l-5-5"/></svg>
              <span className="sb-label">Notificações ativadas</span>
            </div>
          ) : pushState === 'denied' ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8, fontSize:11, color:'var(--t3)', background:'var(--fill-1)', border:'1px solid var(--fill-3)', lineHeight:1.4 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink:0 }}><path d="M18.36 6.64A9 9 0 0 1 20.77 15"/><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              Notificações bloqueadas — libere nas configurações do navegador
            </div>
          ) : (
            <button onClick={enablePush} disabled={pushBusy}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                padding:'10px 14px', borderRadius:8, fontSize:12.5, fontWeight:600,
                color:'#fff', background:'#e53935', border:'none',
                cursor: pushBusy ? 'default' : 'pointer', opacity: pushBusy ? 0.7 : 1,
                transition:'background 0.15s',
                animation: pushBusy ? 'none' : 'notif-pulse 2.2s ease-in-out infinite',
              }}
              onMouseEnter={e=>{ if(!pushBusy) e.currentTarget.style.background='#d32f2f' }}
              onMouseLeave={e=>{ if(!pushBusy) e.currentTarget.style.background='#e53935' }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="sb-label">{pushBusy ? 'Ativando...' : 'Ativar notificações'}</span>
            </button>
          )}
        </div>
      )}

      {/* ── User + logout ── */}
      <div style={{ padding:'14px 14px 18px', borderTop:'1px solid var(--fill-2)' }}>
        <button type="button" onClick={()=>setProfileOpen(true)} aria-label="Meu perfil"
          style={{ width:'100%', display:'flex', alignItems:'center', gap:10, marginBottom:12, background:'transparent', border:'none', padding:0, cursor:'pointer', textAlign:'left', fontFamily:'inherit', borderRadius:8 }}
          onMouseEnter={e=>{ e.currentTarget.style.opacity='0.82' }}
          onMouseLeave={e=>{ e.currentTarget.style.opacity='1' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', overflow:'hidden', background:'transparent', border:'1px solid var(--fill-3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:11, fontWeight:500, color:'var(--t2)' }}>{initial}</span>}
          </div>
          <div className="sb-label" style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:8.5, fontWeight:700, color:'var(--t4)', margin:0, letterSpacing:'0.06em', textTransform:'uppercase' }}>Meu perfil</p>
            <p style={{ fontSize: redesign?13:12, fontWeight:600, color:'var(--t1)', margin:'1px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
            <p style={{ fontSize: redesign?11:9, color:'var(--t4)', margin:'1px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userEmail}</p>
          </div>
          <svg className="sb-label" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button onClick={logout}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'8px 12px', borderRadius:8, fontSize:11, fontWeight:500,
            color:'var(--t3)', background:'transparent', border:'1px solid var(--fill-2)',
            cursor:'pointer', transition:'all 0.15s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--fill-2)';e.currentTarget.style.color='var(--t1)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--t3)'}}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="sb-label">Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className={"sidebar-desktop" + (redesign ? " sb-rd" : "")} style={{
        position:'fixed', left:0, top:0, bottom:0, width:248, zIndex:200,
        background:'var(--sb-bg)',
        borderRight:'1px solid var(--fill-1)',
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
          background:'var(--fill-3)', cursor:'pointer',
          display:'none', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
        }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth={2} strokeLinecap="round">
          {mobileOpen
            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
          }
        </svg>
        {/* Lembrete: pontinho vermelho quando ainda nao ativou push */}
        {!mobileOpen && userId && tenantId && (pushState === 'default' || pushState === 'prompt') && (
          <span style={{ position:'absolute', top:5, right:5, width:9, height:9, borderRadius:'50%', background:'#e53935', border:'2px solid #000', animation:'notif-pulse 1.8s ease-in-out infinite' }}/>
        )}
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
              background:'var(--sb-bg)',
              borderRight:'1px solid var(--fill-3)',
              overflowY:'auto',
            }}>
            {content}
          </motion.aside>
        </>)}
      </AnimatePresence>

      <PushManager userId={userId} tenantId={tenantId}/>

      <ProfileModal
        open={profileOpen}
        onClose={()=>setProfileOpen(false)}
        userId={userId}
        userEmail={userEmail}
        userName={userName}
        role={myRole}
        onNameSaved={()=>setLocalProfile(loadLocalProfile(userId))}
      />

      <style jsx global>{`
        @keyframes notif-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.5); }
          60% { box-shadow: 0 0 0 7px rgba(229,57,53,0); }
        }
        .sidebar-desktop { display: block !important; }
        .sidebar-mobile-toggle { display: none !important; }
        /* REDESIGN: sidebar só-ícones (76px) que expande no hover. Só na .sb-rd
           (contas do redesign); mobile e demais contas intactos. */
        .sb-rd { width: 76px !important; transition: width .26s cubic-bezier(.4,0,.2,1) !important; }
        .sb-rd:hover { width: 248px !important; }
        .sb-rd .sb-label, .sb-rd .logo-text { opacity: 0; white-space: nowrap; transition: opacity .18s; }
        .sb-rd:hover .sb-label, .sb-rd:hover .logo-text { opacity: 1; }
        /* Colapsada: ícones centralizados e maiores (padrão do preview) */
        .sb-rd:not(:hover) .sb-label, .sb-rd:not(:hover) .logo-text { display: none; }
        .sb-rd:not(:hover) nav a { justify-content: center; padding-left: 0 !important; padding-right: 0 !important; }
        .sb-rd:not(:hover) nav a > span:not(.sb-label) { display: none; }
        .sb-rd:not(:hover) > div > a:first-child { justify-content: center; padding-left: 0 !important; padding-right: 0 !important; }
        .sb-rd .sb-ico { transition: transform .18s ease; }
        .sb-rd:not(:hover) nav a:hover .sb-ico { transform: scale(1.08); }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-toggle { display: flex !important; }
          .app-content { margin-left: 0 !important; }
          .sb-rd { width: 248px !important; }
          .sb-rd .sb-label { opacity: 1; }
        }
      `}</style>
    </>
  )
}

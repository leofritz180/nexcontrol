'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { calculatePrice, getAllTiers, BASE_PRICE, OP_BASE_PRICE } from '../../lib/pricing'
import dynamic from 'next/dynamic'
const PixPayment = dynamic(() => import('../../components/PixPayment'), { ssr: false })
const BillingLanding = dynamic(() => import('../../components/BillingLanding'), { ssr: false })

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Op'

export default function BillingPage() {
  const router = useRouter()
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [tenant,setTenant]=useState(null)
  const [operators,setOperators]=useState([])
  const [subscription,setSubscription]=useState(null)
  const [loading,setLoading]=useState(true)
  const [opQty,setOpQty]=useState(0)
  const [showPix,setShowPix]=useState(false)

  useEffect(()=>{ init() },[])

  async function init() {
    const {data:s}=await supabase.auth.getSession()
    const u=s?.session?.user
    if(!u){router.push('/login');return}
    setUser(u)
    const {data:p}=await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle()
    if(!p||p.role!=='admin'){router.push('/operator');return}
    setProfile(p)
    const [{data:t},{data:ops},{data:sub}]=await Promise.all([
      supabase.from('tenants').select('*').eq('id',p.tenant_id).maybeSingle(),
      supabase.from('profiles').select('*').eq('role','operator').eq('tenant_id',p.tenant_id).order('created_at',{ascending:false}),
      supabase.from('subscriptions').select('*').eq('tenant_id',p.tenant_id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    ])
    setTenant(t); setOperators(ops||[]); setSubscription(sub)
    setOpQty(Math.max((ops||[]).length, 0))
    setLoading(false)
  }

  const billing = useMemo(()=>{
    if(!tenant) return null
    const now=new Date(), trialEnd=new Date(tenant.trial_end)
    const trialActive=tenant.subscription_status==='trial'&&now<trialEnd
    const trialExpired=tenant.subscription_status==='trial'&&now>=trialEnd
    const daysLeft=trialActive?Math.max(0,Math.ceil((trialEnd-now)/(1000*60*60*24))):0
    const subActive=subscription?.status==='active'&&new Date(subscription.expires_at)>now
    return {trialActive,trialExpired,daysLeft,trialEnd,subActive,opCount:operators.length}
  },[tenant,operators,subscription])

  const price = useMemo(()=>calculatePrice(opQty),[opQty])
  const currentPrice = useMemo(()=>calculatePrice(operators.length),[operators])
  const tiers = getAllTiers()

  if(loading) return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/></div>
      </AppLayout>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>

      <div style={{maxWidth:820,margin:'0 auto',padding:'40px 28px'}}>

        {/* ── HERO — vendedor premium ── */}
        <motion.div
          initial={{opacity:0, y:12}} animate={{opacity:1, y:0}}
          transition={{duration:0.5, ease:[0.33,1,0.68,1]}}
          style={{ position:'relative', textAlign:'center', marginBottom:36 }}>
          {/* Ambient glow */}
          <div style={{ position:'absolute', top:'-10%', left:'20%', right:'20%', height:260, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(255,255,255,0.12), transparent 65%)', filter:'blur(50px)', pointerEvents:'none', zIndex:-1 }}/>
          <div style={{ position:'absolute', top:'10%', right:'15%', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.08), transparent 65%)', filter:'blur(40px)', pointerEvents:'none', zIndex:-1 }}/>

          {/* Status badge */}
          <motion.div
            initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}}
            transition={{duration:0.4, delay:0.1}}
            style={{
              display:'inline-flex', alignItems:'center', gap:7,
              padding:'6px 16px', borderRadius:99, marginBottom:22,
              background: billing?.subActive
                ? 'linear-gradient(135deg, rgba(209,250,229,0.15), rgba(209,250,229,0.06))'
                : billing?.trialActive
                ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.06))',
              border:`1px solid ${billing?.subActive?'rgba(209,250,229,0.3)':billing?.trialActive?'rgba(255,255,255,0.3)':'rgba(239,68,68,0.3)'}`,
              boxShadow:`0 0 20px ${billing?.subActive?'rgba(209,250,229,0.15)':billing?.trialActive?'rgba(255,255,255,0.15)':'rgba(239,68,68,0.15)'}`,
            }}>
            <motion.div
              animate={{ boxShadow:[`0 0 0 0 ${billing?.subActive?'rgba(209,250,229,0.6)':billing?.trialActive?'rgba(255,255,255,0.6)':'rgba(239,68,68,0.6)'}`,`0 0 0 5px ${billing?.subActive?'rgba(209,250,229,0)':billing?.trialActive?'rgba(255,255,255,0)':'rgba(239,68,68,0)'}`,`0 0 0 0 rgba(0,0,0,0)`] }}
              transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
              style={{ width:7, height:7, borderRadius:'50%', background:billing?.subActive?'#D1FAE5':billing?.trialActive?'rgba(255,255,255,0.78)':'#EF4444' }}
            />
            <span style={{ fontSize:11, fontWeight:800, color:billing?.subActive?'#D1FAE5':billing?.trialActive?'rgba(255,255,255,0.78)':'#EF4444', letterSpacing:'0.08em' }}>
              {billing?.subActive?'ASSINATURA ATIVA':billing?.trialActive?`TRIAL · ${billing.daysLeft} DIA${billing.daysLeft!==1?'S':''} RESTANTE${billing.daysLeft!==1?'S':''}`:'ASSINE PARA CONTINUAR'}
            </span>
          </motion.div>

          <motion.h1
            initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
            transition={{duration:0.5, delay:0.15, ease:[0.33,1,0.68,1]}}
            style={{ fontSize:38, fontWeight:900, color:'var(--t1)', letterSpacing:'-0.035em', marginBottom:12, lineHeight:1.1 }}>
            Escale sua operacao<br/>
            <span style={{ background:'linear-gradient(135deg, rgba(255,255,255,0.78), #D1FAE5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>com estrutura profissional</span>
          </motion.h1>

          <motion.p
            initial={{opacity:0}} animate={{opacity:1}}
            transition={{duration:0.5, delay:0.25}}
            style={{ fontSize:15, color:'var(--t2)', maxWidth:520, margin:'0 auto 18px', lineHeight:1.55 }}>
            Pague apenas pelo que precisa. <strong style={{ color:'var(--t1)' }}>Comece sozinho</strong> ou <strong style={{ color:'rgba(255,255,255,0.78)' }}>escale com operadores</strong> e economize ate 25% com descontos progressivos.
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{opacity:0, y:6}} animate={{opacity:1, y:0}}
            transition={{duration:0.45, delay:0.35}}
            style={{ display:'flex', gap:18, justifyContent:'center', flexWrap:'wrap' }}>
            {[
              { icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>, t:'Cancele quando quiser' },
              { icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, t:'Pagamento 100% seguro' },
              { icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, t:'Liberacao imediata' },
            ].map((x,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                {x.icon}
                <span style={{ fontSize:11, color:'var(--t3)', fontWeight:600 }}>{x.t}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── TWO CARDS premium ── */}
        <div className="a2 g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:28}}>

          {/* ADMIN SOLO */}
          <motion.div
            whileHover={{ y:-3, transition:{duration:0.2} }}
            onClick={()=>setOpQty(0)}
            style={{
              position:'relative', overflow:'hidden', borderRadius:20, cursor:'pointer',
              background: opQty===0
                ? 'linear-gradient(145deg, rgba(14,22,38,0.85), rgba(8,14,26,0.85))'
                : 'linear-gradient(145deg, rgba(14,22,38,0.6), rgba(8,14,26,0.6))',
              backdropFilter:'blur(18px) saturate(150%)', WebkitBackdropFilter:'blur(18px) saturate(150%)',
              border: `${opQty===0?'1.5px':'1px'} solid ${opQty===0?'rgba(148,163,184,0.25)':'rgba(255,255,255,0.06)'}`,
              boxShadow: opQty===0
                ? '0 14px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 4px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              transition:'all 0.3s',
            }}>
            {opQty===0 && <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(148,163,184,0.4), transparent)' }}/>}
            <div style={{padding:'26px 24px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <p style={{ fontSize:9, fontWeight:800, color:'var(--t4)', margin:'0 0 4px', letterSpacing:'0.12em', textTransform:'uppercase' }}>Para comecar</p>
                  <h3 style={{fontSize:18,fontWeight:900,color:'var(--t1)',margin:0, letterSpacing:'-0.02em'}}>Admin Solo</h3>
                </div>
                {opQty===0 && (
                  <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(145deg, #94A3B8, #64748B)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 12px rgba(148,163,184,0.4)'}}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:4}}>
                <span className="t-num" style={{fontSize:38,fontWeight:900,color:opQty===0?'#F1F5F9':'var(--t2)', letterSpacing:'-0.03em', lineHeight:1}}>R$ {fmt(BASE_PRICE)}</span>
                <span style={{fontSize:13,color:'var(--t4)',fontWeight:600}}>/mes</span>
              </div>
              <p style={{ fontSize:11, color:'var(--t4)', margin:'0 0 16px', fontWeight:500 }}>Ideal pra quem opera sozinho</p>
              <div style={{display:'flex',flexDirection:'column',gap:9}}>
                {['Acesso completo ao painel','Gestao de metas e remessas','Faturamento e relatorios','Chaves PIX','Sem operadores'].map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{ width:16, height:16, borderRadius:4, background: i<4?'rgba(209,250,229,0.12)':'rgba(148,163,184,0.08)', border:`1px solid ${i<4?'rgba(209,250,229,0.25)':'rgba(148,163,184,0.18)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={i<4?'#D1FAE5':'#64748B'} strokeWidth="3" strokeLinecap="round">
                        {i<4?<polyline points="20 6 9 17 4 12"/>:<line x1="5" y1="12" x2="19" y2="12"/>}
                      </svg>
                    </div>
                    <span style={{fontSize:12, color:i<4?'var(--t2)':'var(--t4)', fontWeight:i<4?500:400}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ADMIN + OPERATORS — RECOMENDADO */}
          <motion.div
            whileHover={{ y:-3, transition:{duration:0.2} }}
            onClick={()=>{if(opQty===0)setOpQty(Math.max(1,operators.length))}}
            style={{
              position:'relative', overflow:'hidden', borderRadius:20, cursor:'pointer',
              background: opQty>0
                ? 'linear-gradient(145deg, rgba(255,255,255,0.12), rgba(14,22,38,0.85) 70%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(14,22,38,0.6) 70%)',
              backdropFilter:'blur(20px) saturate(160%)', WebkitBackdropFilter:'blur(20px) saturate(160%)',
              border:`${opQty>0?'1.5px':'1px'} solid ${opQty>0?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.2)'}`,
              boxShadow: opQty>0
                ? '0 14px 44px rgba(0,0,0,0.5), 0 0 48px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.06)'
                : '0 6px 22px rgba(0,0,0,0.35), 0 0 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              transition:'all 0.3s',
            }}>
            {/* Recomendado ribbon */}
            <div style={{
              position:'absolute', top:-1, right:-1, padding:'6px 14px', borderRadius:'0 20px 0 12px',
              background:'linear-gradient(135deg, rgba(255,255,255,0.78), #1d4ed8)',
              fontSize:9, fontWeight:900, color:'white', letterSpacing:'0.1em',
              boxShadow:'0 4px 14px rgba(255,255,255,0.4)',
              display:'flex', alignItems:'center', gap:5,
            }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              RECOMENDADO
            </div>

            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}/>

            <div style={{padding:'26px 24px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <p style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.78)', margin:'0 0 4px', letterSpacing:'0.12em', textTransform:'uppercase' }}>Para escalar</p>
                  <h3 style={{fontSize:18,fontWeight:900,color:'var(--t1)',margin:0, letterSpacing:'-0.02em'}}>Admin + Operadores</h3>
                </div>
                {opQty>0 && (
                  <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(145deg, rgba(255,255,255,0.78), #1d4ed8)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 14px rgba(255,255,255,0.5)'}}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:4}}>
                <span className="t-num" style={{fontSize:38,fontWeight:900,color:opQty>0?'rgba(255,255,255,0.78)':'var(--t1)', letterSpacing:'-0.03em', lineHeight:1, textShadow: opQty>0?'0 0 20px rgba(255,255,255,0.3)':'none'}}>R$ {fmt(BASE_PRICE)}</span>
                <span style={{fontSize:13,color:'var(--t4)',fontWeight:600}}>+ R$ {fmt(OP_BASE_PRICE)}/op</span>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:6, background:'rgba(209,250,229,0.1)', border:'1px solid rgba(209,250,229,0.22)', marginBottom:16 }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                <span style={{ fontSize:10, color:'#D1FAE5', fontWeight:800, letterSpacing:'0.04em' }}>ATE 25% DE DESCONTO</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:9}}>
                {[
                  { t:'Tudo do Admin Solo', strong:false },
                  { t:'Operadores ilimitados', strong:true },
                  { t:'Notificacoes em tempo real', strong:false },
                  { t:'Descontos progressivos ate 25%', strong:true },
                ].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{ width:16, height:16, borderRadius:4, background:'rgba(209,250,229,0.14)', border:'1px solid rgba(209,250,229,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: item.strong?'0 0 8px rgba(209,250,229,0.25)':'none' }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{fontSize:12, color: item.strong?'var(--t1)':'var(--t2)', fontWeight: item.strong?700:500}}>{item.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── DISCOUNT TIERS premium ── */}
        {opQty > 0 && (
          <motion.div
            initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
            transition={{duration:0.4}}
            style={{
              position:'relative', overflow:'hidden',
              padding:'20px 22px', borderRadius:16, marginBottom:22,
              background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
              backdropFilter:'blur(18px) saturate(150%)', WebkitBackdropFilter:'blur(18px) saturate(150%)',
              border:'1px solid rgba(209,250,229,0.14)',
              boxShadow:'0 8px 28px rgba(0,0,0,0.4), 0 0 32px rgba(209,250,229,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(209,250,229,0.4), transparent)' }}/>

            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{
                  width:30, height:30, borderRadius:9,
                  background:'rgba(209,250,229,0.12)', border:'1px solid rgba(209,250,229,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 12px rgba(209,250,229,0.18)',
                }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
                <div>
                  <p style={{fontSize:13,fontWeight:800,color:'var(--t1)', margin:0, letterSpacing:'-0.01em'}}>Descontos progressivos</p>
                  <p style={{fontSize:10, color:'var(--t4)', margin:'2px 0 0', fontWeight:500}}>Quanto mais operadores, menor o preco unitario</p>
                </div>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:`repeat(${tiers.length},1fr)`,gap:8}}>
              {tiers.map((t,i)=>{
                const isActive = price.discount === t.discount && opQty > 0
                return (
                  <motion.div key={i}
                    whileHover={{ y:-2, transition:{duration:0.15} }}
                    style={{
                      position:'relative', overflow:'hidden',
                      padding:'14px 10px', borderRadius:12, textAlign:'center', cursor:'default',
                      background: isActive
                        ? 'linear-gradient(145deg, rgba(209,250,229,0.15), rgba(209,250,229,0.03))'
                        : t.discount > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(148,163,184,0.04)',
                      border:`${isActive?'1.5px':'1px'} solid ${isActive?'rgba(209,250,229,0.4)':'rgba(255,255,255,0.06)'}`,
                      boxShadow: isActive ? '0 6px 20px rgba(209,250,229,0.2), 0 0 24px rgba(209,250,229,0.1)' : 'none',
                      transition:'all 0.25s',
                    }}>
                    {isActive && (
                      <div style={{ position:'absolute', top:-4, left:'50%', transform:'translateX(-50%)', padding:'2px 8px', borderRadius:'0 0 6px 6px', background:'#D1FAE5', fontSize:7, fontWeight:900, color:'white', letterSpacing:'0.08em' }}>
                        ATIVO
                      </div>
                    )}
                    <p style={{fontSize:9, fontWeight:800, color:isActive?'#D1FAE5':'var(--t4)', letterSpacing:'0.08em', marginBottom:5, marginTop: isActive?4:0, textTransform:'uppercase'}}>{t.label}</p>
                    <p className="t-num" style={{fontSize:isActive?20:16, fontWeight:900, color:isActive?'#D1FAE5':t.discount>0?'var(--t1)':'var(--t4)', marginBottom:3, letterSpacing:'-0.02em', textShadow: isActive?'0 0 14px rgba(209,250,229,0.3)':'none'}}>
                      {t.discount>0?`-${t.discount}%`:'—'}
                    </p>
                    <p style={{fontSize:9, color:'var(--t4)', margin:0, fontFamily:'var(--mono)', fontWeight:500}}>R$ {fmt(t.unitPrice)}/op</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── OPERATOR SELECTOR + SUMMARY (only when operators selected) ── */}
        {opQty > 0 && (
          <div className="a3" style={{borderRadius:22,overflow:'hidden',background:'var(--surface)',border:'1px solid var(--brand-border)',boxShadow:'0 0 40px rgba(255,255,255,0.06)',marginBottom:24}}>
            <div style={{padding:'24px 28px',background:'linear-gradient(135deg,rgba(255,255,255,0.08),transparent)',borderBottom:'1px solid var(--b1)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <h2 style={{fontSize:16,fontWeight:800,color:'var(--t1)',margin:'0 0 4px'}}>Quantidade de operadores</h2>
                  <p className="t-small">R$ {fmt(price.opUnitPrice)}/operador{price.discount>0?` (${price.discount}% desc)`:''}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:0}}>
                  <button onClick={()=>setOpQty(Math.max(1,opQty-1))} style={{width:44,height:44,borderRadius:'12px 0 0 12px',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--t1)',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>-</button>
                  <div style={{width:64,height:44,border:'1px solid var(--b2)',borderLeft:'none',borderRight:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--void)'}}>
                    <span className="t-num" style={{fontSize:22,fontWeight:900,color:'var(--brand-bright)'}}>{opQty}</span>
                  </div>
                  <button onClick={()=>setOpQty(opQty+1)} style={{width:44,height:44,borderRadius:'0 12px 12px 0',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--t1)',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>+</button>
                </div>
              </div>
            </div>

            <div style={{padding:'24px 28px'}}>
              {/* Discount badge */}
              {price.discount > 0 && (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(209,250,229,0.06)',border:'1px solid rgba(209,250,229,0.12)',marginBottom:14}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--profit)'}}>{price.discount}% desbloqueado — economia de R$ {fmt(price.savings)}/mes</span>
                </div>
              )}
              {price.nextTier && (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',marginBottom:14}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  <span style={{fontSize:12,color:'var(--t2)'}}>+{price.nextTierOps - opQty} op{price.nextTierOps-opQty>1?'s':''} para <strong style={{color:'var(--brand-bright)'}}>{price.nextTierDiscount}% desconto</strong></span>
                </div>
              )}

              {/* Line items */}
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
                <span style={{fontSize:13,color:'var(--t2)'}}>Plano Admin</span>
                <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(BASE_PRICE)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
                <div>
                  <span style={{fontSize:13,color:'var(--t2)'}}>{opQty} operador{opQty>1?'es':''}</span>
                  {price.discount>0&&<span style={{fontSize:11,color:'var(--profit)',marginLeft:6}}>(-{price.discount}%)</span>}
                </div>
                <div style={{textAlign:'right'}}>
                  {price.discount>0&&<span style={{fontSize:11,color:'var(--t4)',textDecoration:'line-through',marginRight:8}}>R$ {fmt(opQty*OP_BASE_PRICE)}</span>}
                  <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(price.opTotal)}</span>
                </div>
              </div>
              {price.savings>0&&(
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
                  <span style={{fontSize:13,color:'var(--profit)'}}>Economia</span>
                  <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--profit)'}}>-R$ {fmt(price.savings)}</span>
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',padding:'16px 0'}}>
                <span style={{fontSize:16,fontWeight:800,color:'var(--t1)'}}>Total mensal</span>
                <span className="t-num" style={{fontSize:28,fontWeight:900,color:'var(--profit)'}}>R$ {fmt(price.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SUMMARY (admin solo) ── */}
        {opQty === 0 && (
          <div className="a3" style={{borderRadius:22,background:'var(--surface)',border:'1px solid var(--b1)',padding:'24px 28px',marginBottom:24}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
              <span style={{fontSize:13,color:'var(--t2)'}}>Plano Admin Solo</span>
              <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(BASE_PRICE)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'16px 0'}}>
              <span style={{fontSize:16,fontWeight:800,color:'var(--t1)'}}>Total mensal</span>
              <span className="t-num" style={{fontSize:28,fontWeight:900,color:'var(--profit)'}}>R$ {fmt(BASE_PRICE)}</span>
            </div>
          </div>
        )}

        {/* ── CTA (new subscribers only) ── */}
        {!billing?.subActive && (
          <div className="a4" style={{marginBottom:32}}>
            <button onClick={()=>setShowPix(true)} className="btn btn-profit btn-lg" style={{width:'100%',justifyContent:'center',fontSize:16,fontWeight:800,padding:'16px'}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Assinar por R$ {fmt(price.total)}/mes
            </button>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:12}}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{fontSize:10,color:'rgba(209,250,229,0.5)',fontWeight:600}}>Pagamento seguro via Pix · Ativacao instantanea</span>
            </div>
          </div>
        )}

        {/* ── ADD OPERATORS (active subscribers only) ── */}
        {billing?.subActive && (()=>{
          const [addQty, setAddQty] = [opQty - operators.length, (v)=>setOpQty(operators.length + v)]
          const extraOps = Math.max(0, opQty - operators.length)
          const newPrice = calculatePrice(opQty)
          const extraCost = Math.round((newPrice.total - currentPrice.total) * 100) / 100
          return (
          <div className="a4" style={{borderRadius:22,overflow:'hidden',background:'var(--surface)',border:'1px solid var(--brand-border)',boxShadow:'0 0 30px rgba(255,255,255,0.05)',marginBottom:32}}>
            <div style={{padding:'22px 28px',background:'linear-gradient(135deg,rgba(255,255,255,0.08),transparent)',borderBottom:'1px solid var(--b1)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <div>
                  <h2 style={{fontSize:16,fontWeight:800,color:'var(--t1)',margin:0}}>Adicionar operadores</h2>
                  <p className="t-small">Pague apenas pelos operadores adicionais</p>
                </div>
              </div>
            </div>
            <div style={{padding:'24px 28px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:20}}>
                <div>
                  <p style={{fontSize:13,color:'var(--t2)',margin:'0 0 4px'}}>Operadores atuais: <strong style={{color:'var(--t1)'}}>{operators.length}</strong></p>
                  <p style={{fontSize:13,color:'var(--t2)',margin:0}}>Adicionar: <strong style={{color:'var(--brand-bright)'}}>{extraOps}</strong></p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:0}}>
                  <button onClick={()=>setOpQty(Math.max(operators.length,opQty-1))} style={{width:40,height:40,borderRadius:'10px 0 0 10px',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'var(--t1)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>-</button>
                  <div style={{width:56,height:40,border:'1px solid var(--b2)',borderLeft:'none',borderRight:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--void)'}}>
                    <span className="t-num" style={{fontSize:20,fontWeight:900,color:'var(--brand-bright)'}}>{extraOps}</span>
                  </div>
                  <button onClick={()=>setOpQty(opQty+1)} style={{width:40,height:40,borderRadius:'0 10px 10px 0',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'var(--t1)'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>+</button>
                </div>
              </div>

              {extraOps > 0 && (()=>{
                const extraOnlyCost = Math.round(extraOps * newPrice.opUnitPrice * 100) / 100
                return (<>
                {/* Cost breakdown */}
                <div style={{padding:'14px 16px',borderRadius:14,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,color:'var(--t2)'}}>{extraOps} novo{extraOps>1?'s':''} operador{extraOps>1?'es':''} x R$ {fmt(newPrice.opUnitPrice)}</span>
                    <span className="t-num" style={{fontSize:13,fontWeight:700,color:'var(--brand-bright)'}}>R$ {fmt(extraOnlyCost)}</span>
                  </div>
                  {newPrice.discount > 0 && (
                    <p style={{fontSize:11,color:'var(--t3)',margin:'4px 0 0'}}>Preco por operador com {newPrice.discount}% de desconto</p>
                  )}
                  {newPrice.discount > currentPrice.discount && (
                    <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{fontSize:11,color:'var(--profit)'}}>Desconto subiu para {newPrice.discount}% com {opQty} operadores</span>
                    </div>
                  )}
                </div>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0'}}>
                  <div>
                    <span style={{fontSize:15,fontWeight:800,color:'var(--t1)'}}>Valor a pagar agora</span>
                    <p style={{fontSize:11,color:'var(--t3)',margin:'2px 0 0'}}>Apenas os operadores adicionais</p>
                  </div>
                  <span className="t-num" style={{fontSize:28,fontWeight:900,color:'var(--profit)'}}>R$ {fmt(extraOnlyCost)}</span>
                </div>

                <div style={{padding:'10px 14px',borderRadius:10,background:'var(--raised)',border:'1px solid var(--b1)',marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--t3)'}}>
                    <span>Proximo mes (admin + {opQty} ops)</span>
                    <span className="t-num" style={{fontWeight:700,color:'var(--t2)'}}>R$ {fmt(newPrice.total)}/mes</span>
                  </div>
                </div>

                <button onClick={()=>setShowPix(true)} className="btn btn-profit btn-lg" style={{width:'100%',justifyContent:'center',fontSize:15,fontWeight:800,padding:'14px'}}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  Adicionar {extraOps} operador{extraOps>1?'es':''} — R$ {fmt(extraOnlyCost)}
                </button>
              </>)})()}

              {extraOps === 0 && (
                <p style={{fontSize:13,color:'var(--t3)',textAlign:'center',padding:'12px 0'}}>Use os botoes + e - para adicionar operadores ao seu plano</p>
              )}
            </div>
          </div>
          )
        })()}

        {/* ── OPERATORS LIST ── */}
        {operators.length>0&&(
          <div className="a5 card" style={{padding:24,marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <h3 style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>Operadores ativos ({operators.length})</h3>
              {opQty>0&&<span style={{fontSize:11,fontWeight:600,color:'var(--profit)'}}>R$ {fmt(price.opUnitPrice)}/cada</span>}
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {operators.map(op=>(
                <div key={op.id} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px 5px 5px',borderRadius:8,background:'var(--raised)',border:'1px solid var(--b1)'}}>
                  <div style={{width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:9,fontWeight:800,color:'white'}}>{getName(op)[0].toUpperCase()}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--t2)'}}>{getName(op)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTION INFO ── */}
        {(billing?.subActive||billing?.trialActive)&&(
          <div className="a5 card" style={{padding:24,marginBottom:24}}>
            <h3 style={{fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:12}}>Detalhes da assinatura</h3>
            <div className="g-form" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div style={{background:'var(--raised)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--b1)'}}>
                <p className="t-label" style={{marginBottom:4}}>Status</p>
                <p style={{fontSize:13,fontWeight:700,color:billing?.subActive?'var(--profit)':'var(--brand-bright)',margin:0}}>{billing?.subActive?'Ativa':'Trial'}</p>
              </div>
              <div style={{background:'var(--raised)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--b1)'}}>
                <p className="t-label" style={{marginBottom:4}}>Pagando</p>
                <p style={{fontSize:13,fontWeight:700,color:'var(--t1)',margin:0}}>R$ {fmt(currentPrice.total)}/mes</p>
              </div>
              <div style={{background:'var(--raised)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--b1)'}}>
                <p className="t-label" style={{marginBottom:4}}>{billing?.subActive?'Renovacao':'Expira'}</p>
                <p style={{fontSize:13,fontWeight:700,color:'var(--t1)',margin:0}}>
                  {billing?.subActive&&subscription?.expires_at?new Date(subscription.expires_at).toLocaleDateString('pt-BR'):billing?.trialActive?`${billing.daysLeft} dias`:'—'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{textAlign:'center',marginTop:24}}>
          <p style={{fontSize:12,color:'var(--t3)'}}>Precisa de ajuda? suporte@nexcontrol.io</p>
        </div>
      </div>

      {showPix&&(()=>{
        const extraOps = billing?.subActive ? Math.max(0, opQty - operators.length) : 0
        const isUpgrade = billing?.subActive && extraOps > 0
        const upgradeAmount = isUpgrade ? Math.round(extraOps * price.opUnitPrice * 100) / 100 : price.total
        return (
        <PixPayment
          tenantId={profile?.tenant_id}
          userId={user?.id}
          userName={profile?.nome}
          userEmail={user?.email}
          amount={upgradeAmount}
          operatorCount={opQty}
          planName={isUpgrade ? `+${extraOps} operador${extraOps>1?'es':''}` : opQty>0?`Admin + ${opQty} ops`:'Admin Solo'}
          onSuccess={()=>{setShowPix(false);init()}}
          onClose={()=>setShowPix(false)}
        />
        )
      })()}
      {/* Landing sections with iPhone demo, features, social proof */}
      <BillingLanding/>
      </AppLayout>
    </main>
  )
}

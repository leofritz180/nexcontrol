'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { supabase } from '../../lib/supabase/client'
import { calculatePrice, getAllTiers, BASE_PRICE, OP_BASE_PRICE } from '../../lib/pricing'
import dynamic from 'next/dynamic'
const PixPayment = dynamic(() => import('../../components/PixPayment'), { ssr: false })

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
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/></div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}/>

      <div style={{maxWidth:820,margin:'0 auto',padding:'40px 28px'}}>

        {/* ── HERO ── */}
        <div className="a1" style={{textAlign:'center',marginBottom:40}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',borderRadius:99,background:billing?.subActive?'var(--profit-dim)':billing?.trialActive?'rgba(59,130,246,0.08)':'var(--loss-dim)',border:`1px solid ${billing?.subActive?'var(--profit-border)':billing?.trialActive?'rgba(59,130,246,0.15)':'var(--loss-border)'}`,marginBottom:20}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:billing?.subActive?'var(--profit)':billing?.trialActive?'var(--brand-bright)':'var(--loss)'}}/>
            <span style={{fontSize:11,fontWeight:700,color:billing?.subActive?'var(--profit)':billing?.trialActive?'var(--brand-bright)':'var(--loss)',letterSpacing:'0.06em'}}>
              {billing?.subActive?'ASSINATURA ATIVA':billing?.trialActive?`TRIAL · ${billing.daysLeft} DIAS`:'ASSINE PARA CONTINUAR'}
            </span>
          </div>
          <h1 style={{fontSize:34,fontWeight:900,color:'var(--t1)',letterSpacing:'-0.03em',marginBottom:10,lineHeight:1.2}}>
            Escolha a estrutura ideal<br/>para sua operacao
          </h1>
          <p style={{fontSize:15,color:'var(--t2)',maxWidth:480,margin:'0 auto'}}>
            Pague apenas pelo que precisa. Comece sozinho ou escale com operadores.
          </p>
        </div>

        {/* ── TWO CARDS ── */}
        <div className="a2 g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:32}}>

          {/* ADMIN SOLO */}
          <div style={{
            borderRadius:22,overflow:'hidden',
            background:'var(--surface)',border:opQty===0?'2px solid var(--brand-border)':'1px solid var(--b1)',
            boxShadow:opQty===0?'0 0 40px rgba(59,130,246,0.08)':'none',
            transition:'all 0.3s',cursor:'pointer',
          }} onClick={()=>setOpQty(0)}>
            <div style={{padding:'28px 26px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontSize:17,fontWeight:800,color:'var(--t1)',margin:0}}>Admin Solo</h3>
                {opQty===0&&<div style={{width:20,height:20,borderRadius:'50%',background:'var(--brand)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:12}}>
                <span className="t-num" style={{fontSize:36,fontWeight:900,color:opQty===0?'var(--brand-bright)':'var(--t1)'}}>R$ {fmt(BASE_PRICE)}</span>
                <span style={{fontSize:13,color:'var(--t3)'}}>/mes</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {['Acesso completo ao painel','Gestao de metas e remessas','Faturamento e relatorios','Chaves PIX','Sem operadores'].map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={i<4?'var(--profit)':'var(--t4)'} strokeWidth="2.5" strokeLinecap="round">
                      {i<4?<polyline points="20 6 9 17 4 12"/>:<line x1="5" y1="12" x2="19" y2="12"/>}
                    </svg>
                    <span style={{fontSize:13,color:i<4?'var(--t2)':'var(--t4)'}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ADMIN + OPERATORS */}
          <div style={{
            borderRadius:22,overflow:'hidden',position:'relative',
            background:opQty>0?'linear-gradient(145deg,rgba(59,130,246,0.1),var(--surface) 60%)':'var(--surface)',
            border:opQty>0?'2px solid var(--brand-border)':'1px solid var(--b1)',
            boxShadow:opQty>0?'0 0 40px rgba(59,130,246,0.08)':'none',
            transition:'all 0.3s',cursor:'pointer',
          }} onClick={()=>{if(opQty===0)setOpQty(Math.max(1,operators.length))}}>
            <div style={{position:'absolute',top:0,right:0,padding:'6px 16px',borderRadius:'0 20px 0 12px',background:'linear-gradient(135deg,#3B82F6,#3B82F6)',fontSize:10,fontWeight:800,color:'white',letterSpacing:'0.06em'}}>RECOMENDADO</div>
            <div style={{padding:'28px 26px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontSize:17,fontWeight:800,color:'var(--t1)',margin:0}}>Admin + Operadores</h3>
                {opQty>0&&<div style={{width:20,height:20,borderRadius:'50%',background:'var(--brand)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
                <span className="t-num" style={{fontSize:36,fontWeight:900,color:opQty>0?'var(--brand-bright)':'var(--t1)'}}>R$ {fmt(BASE_PRICE)}</span>
                <span style={{fontSize:13,color:'var(--t3)'}}>+ R$ {fmt(OP_BASE_PRICE)}/op</span>
              </div>
              <p className="t-small" style={{marginBottom:14}}>Descontos progressivos de ate 25%</p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {['Tudo do Admin Solo','Operadores ilimitados','Notificacoes em tempo real','Descontos progressivos'].map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{fontSize:13,color:'var(--t2)'}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DISCOUNT TIERS (only when operators selected) ── */}
        {opQty > 0 && (
          <div className="a3" style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>Descontos progressivos</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${tiers.length},1fr)`,gap:8}}>
              {tiers.map((t,i)=>{
                const isActive = price.discount === t.discount && opQty > 0
                return (
                  <div key={i} style={{padding:'12px 10px',borderRadius:12,textAlign:'center',background:isActive?'rgba(34,197,94,0.08)':'var(--surface)',border:`1px solid ${isActive?'rgba(34,197,94,0.2)':'var(--b1)'}`,transition:'all 0.2s'}}>
                    <p style={{fontSize:9,fontWeight:700,color:isActive?'var(--profit)':'var(--t3)',letterSpacing:'0.06em',marginBottom:4}}>{t.label.toUpperCase()}</p>
                    <p className="t-num" style={{fontSize:isActive?18:14,fontWeight:900,color:isActive?'var(--profit)':t.discount>0?'var(--t1)':'var(--t3)',marginBottom:2}}>
                      {t.discount>0?`-${t.discount}%`:'—'}
                    </p>
                    <p style={{fontSize:9,color:'var(--t4)',margin:0}}>R$ {fmt(t.unitPrice)}/op</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── OPERATOR SELECTOR + SUMMARY (only when operators selected) ── */}
        {opQty > 0 && (
          <div className="a3" style={{borderRadius:22,overflow:'hidden',background:'var(--surface)',border:'1px solid var(--brand-border)',boxShadow:'0 0 40px rgba(59,130,246,0.06)',marginBottom:24}}>
            <div style={{padding:'24px 28px',background:'linear-gradient(135deg,rgba(59,130,246,0.08),transparent)',borderBottom:'1px solid var(--b1)'}}>
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
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.12)',marginBottom:14}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--profit)'}}>{price.discount}% desbloqueado — economia de R$ {fmt(price.savings)}/mes</span>
                </div>
              )}
              {price.nextTier && (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(59,130,246,0.05)',border:'1px solid rgba(59,130,246,0.1)',marginBottom:14}}>
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
              <span style={{fontSize:10,color:'rgba(34,197,94,0.5)',fontWeight:600}}>Pagamento seguro via Pix · Ativacao instantanea</span>
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
          <div className="a4" style={{borderRadius:22,overflow:'hidden',background:'var(--surface)',border:'1px solid var(--brand-border)',boxShadow:'0 0 30px rgba(59,130,246,0.05)',marginBottom:32}}>
            <div style={{padding:'22px 28px',background:'linear-gradient(135deg,rgba(59,130,246,0.08),transparent)',borderBottom:'1px solid var(--b1)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <div>
                  <h2 style={{fontSize:16,fontWeight:800,color:'var(--t1)',margin:0}}>Adicionar operadores</h2>
                  <p className="t-small">Pague apenas pelos operadores adicionais</p>
                </div>
              </div>
            </div>
            <div style={{padding:'24px 28px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
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
                <div style={{padding:'14px 16px',borderRadius:14,background:'rgba(59,130,246,0.05)',border:'1px solid rgba(59,130,246,0.1)',marginBottom:16}}>
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
                  <div style={{width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(59,130,246,0.2))',display:'flex',alignItems:'center',justifyContent:'center'}}>
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
          planName={isUpgrade ? `+${extraOps} operador${extraOps>1?'es':''}` : opQty>0?`Admin + ${opQty} ops`:'Admin Solo'}
          onSuccess={()=>{setShowPix(false);init()}}
          onClose={()=>setShowPix(false)}
        />
        )
      })()}
    </main>
  )
}

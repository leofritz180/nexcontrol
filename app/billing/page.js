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
  const upgrade = useMemo(()=>({
    isUpgrade: opQty > operators.length,
    diff: Math.round((price.total - currentPrice.total) * 100) / 100,
  }),[price,currentPrice,opQty,operators])

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
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',borderRadius:99,background:billing?.subActive?'var(--profit-dim)':billing?.trialActive?'rgba(79,110,247,0.08)':'var(--loss-dim)',border:`1px solid ${billing?.subActive?'var(--profit-border)':billing?.trialActive?'rgba(79,110,247,0.15)':'var(--loss-border)'}`,marginBottom:20}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:billing?.subActive?'var(--profit)':billing?.trialActive?'var(--brand-bright)':'var(--loss)'}}/>
            <span style={{fontSize:11,fontWeight:700,color:billing?.subActive?'var(--profit)':billing?.trialActive?'var(--brand-bright)':'var(--loss)',letterSpacing:'0.06em'}}>
              {billing?.subActive?'ASSINATURA ATIVA':billing?.trialActive?`TRIAL · ${billing.daysLeft} DIAS`:'ASSINE PARA CONTINUAR'}
            </span>
          </div>
          <h1 style={{fontSize:34,fontWeight:900,color:'var(--t1)',letterSpacing:'-0.03em',marginBottom:10,lineHeight:1.2}}>
            {billing?.subActive?'Gerencie sua assinatura':'Monte seu plano ideal'}
          </h1>
          <p style={{fontSize:15,color:'var(--t2)',maxWidth:480,margin:'0 auto'}}>
            Adicione operadores e desbloqueie descontos progressivos automaticamente.
          </p>
        </div>

        {/* ── DISCOUNT TIERS ── */}
        <div className="a2" style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>Descontos progressivos</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${tiers.length},1fr)`,gap:8}}>
            {tiers.map((t,i)=>{
              const isActive = price.discount === t.discount && opQty > 0
              return (
                <div key={i} style={{
                  padding:'14px 12px',borderRadius:14,textAlign:'center',
                  background:isActive?'rgba(5,217,140,0.08)':'var(--surface)',
                  border:`1px solid ${isActive?'rgba(5,217,140,0.2)':'var(--b1)'}`,
                  transition:'all 0.2s',
                }}>
                  <p style={{fontSize:10,fontWeight:700,color:isActive?'var(--profit)':'var(--t3)',letterSpacing:'0.06em',marginBottom:6}}>{t.label.toUpperCase()}</p>
                  <p className="t-num" style={{fontSize:isActive?20:16,fontWeight:900,color:isActive?'var(--profit)':t.discount>0?'var(--t1)':'var(--t3)',marginBottom:2}}>
                    {t.discount>0?`-${t.discount}%`:'—'}
                  </p>
                  <p style={{fontSize:10,color:'var(--t4)',margin:0}}>R$ {fmt(t.unitPrice)}/op</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── PLAN BUILDER ── */}
        <div className="a3" style={{
          borderRadius:22,overflow:'hidden',
          background:'var(--surface)',border:'1px solid var(--brand-border)',
          boxShadow:'0 0 40px rgba(79,110,247,0.06)',
          marginBottom:24,
        }}>
          {/* Header */}
          <div style={{padding:'24px 28px',background:'linear-gradient(135deg,rgba(79,110,247,0.08),transparent)',borderBottom:'1px solid var(--b1)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:'var(--t1)',margin:'0 0 4px'}}>
                  {billing?.subActive?'Atualizar plano':'Configure seu plano'}
                </h2>
                <p className="t-small">Base admin R$ {fmt(BASE_PRICE)} + operadores</p>
              </div>
              {/* Stepper */}
              <div style={{display:'flex',alignItems:'center',gap:0}}>
                <button onClick={()=>setOpQty(Math.max(0,opQty-1))} style={{width:44,height:44,borderRadius:'12px 0 0 12px',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--t1)',transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>-</button>
                <div style={{width:70,height:44,border:'1px solid var(--b2)',borderLeft:'none',borderRight:'none',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--void)'}}>
                  <span className="t-num" style={{fontSize:22,fontWeight:900,color:'var(--brand-bright)',lineHeight:1}}>{opQty}</span>
                  <span style={{fontSize:7,color:'var(--t4)',fontWeight:600}}>OPS</span>
                </div>
                <button onClick={()=>setOpQty(opQty+1)} style={{width:44,height:44,borderRadius:'0 12px 12px 0',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--t1)',transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>+</button>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{padding:'24px 28px'}}>
            {/* Discount badge */}
            {price.discount > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(5,217,140,0.06)',border:'1px solid rgba(5,217,140,0.12)',marginBottom:16}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{fontSize:12,fontWeight:600,color:'var(--profit)'}}>
                  {price.discount}% de desconto desbloqueado — economia de R$ {fmt(price.savings)}/mes
                </span>
              </div>
            )}
            {/* Next tier hint */}
            {price.nextTier && opQty > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'rgba(79,110,247,0.05)',border:'1px solid rgba(79,110,247,0.1)',marginBottom:16}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                <span style={{fontSize:12,color:'var(--t2)'}}>
                  Adicione mais {price.nextTierOps - opQty} operador{price.nextTierOps - opQty > 1?'es':''} para desbloquear <strong style={{color:'var(--brand-bright)'}}>{price.nextTierDiscount}% de desconto</strong>
                </span>
              </div>
            )}

            {/* Line items */}
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
              <span style={{fontSize:13,color:'var(--t2)'}}>Plano Admin (base)</span>
              <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(BASE_PRICE)}</span>
            </div>
            {opQty > 0 && (<>
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
                <div>
                  <span style={{fontSize:13,color:'var(--t2)'}}>{opQty} operador{opQty>1?'es':''}</span>
                  {price.discount > 0 && <span style={{fontSize:11,color:'var(--profit)',marginLeft:6}}>(-{price.discount}%)</span>}
                </div>
                <div style={{textAlign:'right'}}>
                  {price.discount > 0 && <span style={{fontSize:11,color:'var(--t4)',textDecoration:'line-through',marginRight:8}}>R$ {fmt(opQty*OP_BASE_PRICE)}</span>}
                  <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(price.opTotal)}</span>
                </div>
              </div>
            </>)}
            {price.savings > 0 && (
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
                <span style={{fontSize:13,color:'var(--profit)'}}>Economia mensal</span>
                <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--profit)'}}>-R$ {fmt(price.savings)}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',padding:'16px 0'}}>
              <span style={{fontSize:16,fontWeight:800,color:'var(--t1)'}}>Total mensal</span>
              <span className="t-num" style={{fontSize:30,fontWeight:900,color:'var(--profit)'}}>R$ {fmt(price.total)}</span>
            </div>

            {/* Upgrade diff */}
            {billing?.subActive && upgrade.isUpgrade && upgrade.diff > 0 && (
              <div style={{padding:'12px 16px',borderRadius:12,background:'rgba(79,110,247,0.06)',border:'1px solid rgba(79,110,247,0.12)',marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12,color:'var(--t2)'}}>Diferenca para upgrade</span>
                  <span className="t-num" style={{fontSize:16,fontWeight:800,color:'var(--brand-bright)'}}>+R$ {fmt(upgrade.diff)}/mes</span>
                </div>
              </div>
            )}

            {/* CTA */}
            <button onClick={()=>setShowPix(true)} className="btn btn-profit btn-lg" style={{width:'100%',justifyContent:'center',fontSize:16,fontWeight:800,padding:'16px',marginTop:4}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              {billing?.subActive && upgrade.isUpgrade ? `Upgrade — R$ ${fmt(price.total)}/mes` : billing?.subActive ? 'Manter plano atual' : `Assinar por R$ ${fmt(price.total)}/mes`}
            </button>

            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:14}}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{fontSize:10,color:'rgba(5,217,140,0.5)',fontWeight:600}}>Pagamento seguro via Pix · Ativacao instantanea</span>
            </div>
          </div>
        </div>

        {/* ── OPERATORS LIST ── */}
        {operators.length > 0 && (
          <div className="a4 card" style={{padding:24,marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <h3 style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>Operadores ativos ({operators.length})</h3>
              <span style={{fontSize:11,fontWeight:600,color:'var(--profit)'}}>R$ {fmt(price.opUnitPrice)}/cada</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {operators.map(op=>(
                <div key={op.id} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px 5px 5px',borderRadius:8,background:'var(--raised)',border:'1px solid var(--b1)'}}>
                  <div style={{width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:9,fontWeight:800,color:'white'}}>{getName(op)[0].toUpperCase()}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--t2)'}}>{getName(op)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBSCRIPTION INFO ── */}
        {(billing?.subActive||billing?.trialActive) && (
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

      {showPix && (
        <PixPayment
          tenantId={profile?.tenant_id}
          userId={user?.id}
          userName={profile?.nome}
          userEmail={user?.email}
          amount={price.total}
          planName={opQty>0?`Admin + ${opQty} op${opQty>1?'s':''} (${price.discount}% desc)`:'Admin Solo'}
          onSuccess={()=>{ setShowPix(false); init() }}
          onClose={()=>setShowPix(false)}
        />
      )}
    </main>
  )
}

'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Op'
const BASE = 39.90
const OP_PRICE = 19.90

export default function BillingPage() {
  const router = useRouter()
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [tenant,setTenant]=useState(null)
  const [operators,setOperators]=useState([])
  const [plans,setPlans]=useState([])
  const [subscription,setSubscription]=useState(null)
  const [payments,setPayments]=useState([])
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [tab,setTab]=useState('plans')

  useEffect(()=>{ init() },[])

  async function init() {
    const {data:s}=await supabase.auth.getSession()
    const u=s?.session?.user
    if(!u){router.push('/login');return}
    setUser(u)
    const {data:p}=await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle()
    if(!p||p.role!=='admin'){router.push('/operator');return}
    setProfile(p)
    const [{data:t},{data:ops},{data:pl},{data:sub},{data:pay}]=await Promise.all([
      supabase.from('tenants').select('*').eq('id',p.tenant_id).maybeSingle(),
      supabase.from('profiles').select('*').eq('role','operator').eq('tenant_id',p.tenant_id).order('created_at',{ascending:false}),
      supabase.from('plans').select('*').eq('active',true).order('sort_order',{ascending:true}),
      supabase.from('subscriptions').select('*').eq('tenant_id',p.tenant_id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('payments').select('*').eq('tenant_id',p.tenant_id).order('created_at',{ascending:false}).limit(10),
    ])
    setTenant(t); setOperators(ops||[]); setPlans(pl||[]); setSubscription(sub); setPayments(pay||[])
    setLoading(false)
  }

  const billing = useMemo(()=>{
    if(!tenant) return null
    const now=new Date(), trialEnd=new Date(tenant.trial_end)
    const trialActive=tenant.subscription_status==='trial'&&now<trialEnd
    const trialExpired=tenant.subscription_status==='trial'&&now>=trialEnd
    const daysLeft=trialActive?Math.max(0,Math.ceil((trialEnd-now)/(1000*60*60*24))):0
    const subActive=subscription?.status==='active'&&new Date(subscription.expires_at)>now
    const blocked=trialExpired&&!subActive
    const currentPlan=plans.find(p=>p.id===tenant.plan_id)||plans[0]
    return {trialActive,trialExpired,daysLeft,trialEnd,subActive,blocked,currentPlan,opCount:operators.length}
  },[tenant,operators,subscription,plans])

  function calcPlan(plan) {
    const ops=plan.max_operators
    const opFull=ops*OP_PRICE
    const discount=opFull*(plan.discount_pct/100)
    const opFinal=opFull-discount
    const total=BASE+opFinal
    const fullPrice=BASE+(ops*OP_PRICE)
    const savings=fullPrice-total
    return {ops,opFull,discount,opFinal,total,fullPrice,savings}
  }

  async function selectPlan(plan) {
    if(!tenant||saving) return
    setSaving(true)
    await supabase.from('tenants').update({plan_id:plan.id}).eq('id',tenant.id)
    setTenant(t=>({...t,plan_id:plan.id}))
    setSaving(false)
  }

  const [simulating,setSimulating]=useState(false)
  const [simMsg,setSimMsg]=useState('')

  async function simulatePayment(status) {
    if(!tenant||!billing?.currentPlan) return
    setSimulating(true); setSimMsg('')
    const c = calcPlan(billing.currentPlan)
    const isPaid = status==='paid'
    const now = new Date()
    const expires = new Date(now); expires.setDate(expires.getDate()+30)

    // Create subscription
    const {data:newSub} = await supabase.from('subscriptions').insert({
      tenant_id: tenant.id,
      plan_id: billing.currentPlan.id,
      status: isPaid?'active':status==='pending'?'pending':'failed',
      plan_base: BASE,
      price_per_operator: OP_PRICE,
      operator_count: billing.opCount,
      total_amount: c.total,
      payment_method: 'mock',
      external_id: `mock_${Date.now()}`,
      starts_at: now.toISOString(),
      expires_at: isPaid?expires.toISOString():now.toISOString(),
    }).select().single()

    // Create payment record
    await supabase.from('payments').insert({
      tenant_id: tenant.id,
      subscription_id: newSub?.id,
      amount: c.total,
      status,
      payment_method: 'mock',
      external_id: `mock_pay_${Date.now()}`,
      description: `${billing.currentPlan.name} — ${status==='paid'?'Aprovado':status==='pending'?'Pendente':'Recusado'}`,
    })

    // Update tenant status
    const newStatus = isPaid?'active':status==='pending'?'trial':'trial'
    await supabase.from('tenants').update({subscription_status:newStatus}).eq('id',tenant.id)
    setTenant(t=>({...t,subscription_status:newStatus}))
    if(newSub) setSubscription(isPaid?{...newSub,status:'active'}:newSub)

    setSimulating(false)
    setSimMsg(isPaid?'Pagamento aprovado! Acesso liberado.':status==='pending'?'Pagamento pendente. Aguardando confirmacao.':'Pagamento recusado. Tente novamente.')
    // Reload payments
    const {data:pay}=await supabase.from('payments').select('*').eq('tenant_id',tenant.id).order('created_at',{ascending:false}).limit(10)
    setPayments(pay||[])
  }

  const popular = plans.find(p=>p.slug==='equipe5')

  if(loading) return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/></div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true}/>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'40px 28px'}}>
        {/* Header */}
        <div className="a1" style={{textAlign:'center',marginBottom:12}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',borderRadius:99,background:billing?.trialActive?'var(--profit-dim)':billing?.subActive?'var(--brand-dim)':'var(--loss-dim)',border:`1px solid ${billing?.trialActive?'var(--profit-border)':billing?.subActive?'var(--brand-border)':'var(--loss-border)'}`,marginBottom:16}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:billing?.trialActive?'var(--profit)':billing?.subActive?'var(--brand-bright)':'var(--loss)'}}/>
            <span style={{fontSize:11,fontWeight:700,color:billing?.trialActive?'var(--profit)':billing?.subActive?'var(--brand-bright)':'var(--loss)',letterSpacing:'0.06em'}}>
              {billing?.trialActive?'TRIAL ATIVO':billing?.subActive?'ASSINATURA ATIVA':'ASSINATURA NECESSARIA'}
            </span>
          </div>
          <h1 style={{fontSize:32,fontWeight:900,color:'var(--t1)',letterSpacing:'-0.03em',marginBottom:8}}>Escolha seu plano</h1>
          <p style={{fontSize:15,color:'var(--t2)',maxWidth:500,margin:'0 auto'}}>Escale sua operacao com descontos progressivos. Quanto mais operadores, maior a economia.</p>
        </div>

        {/* Trial banner */}
        {billing?.trialActive && (
          <div className="a2" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:'14px 24px',borderRadius:14,background:'linear-gradient(135deg,rgba(5,217,140,0.08),rgba(79,110,247,0.05))',border:'1px solid rgba(5,217,140,0.15)',marginBottom:32,maxWidth:500,margin:'0 auto 32px'}}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{fontSize:13,color:'var(--t2)'}}>Teste gratuito: <strong style={{color:'var(--profit)'}}>{billing.daysLeft} dia(s) restantes</strong></span>
          </div>
        )}

        {/* Tabs */}
        <div className="a2 tabs-scroll" style={{display:'flex',gap:4,marginBottom:32,justifyContent:'center'}}>
          <div style={{display:'flex',gap:4,background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:12,padding:5}}>
            {[['plans','Planos'],['current','Meu plano'],['history','Historico']].map(([k,l])=>(
              <button key={k} onClick={()=>setTab(k)} style={{fontFamily:'Inter,sans-serif',fontSize:12,fontWeight:600,padding:'8px 20px',borderRadius:9,cursor:'pointer',transition:'all 0.15s',background:tab===k?'var(--raised)':'transparent',border:tab===k?'1px solid var(--b2)':'1px solid transparent',color:tab===k?'var(--t1)':'var(--t3)',boxShadow:tab===k?'0 2px 8px rgba(0,0,0,0.3)':''}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ PLANS ═══ */}
        {tab==='plans' && (
          <div key="plans" className="tab-content">
            <div style={{display:'grid',gridTemplateColumns:`repeat(${plans.length},1fr)`,gap:16,marginBottom:40}}>
              {plans.map((plan,i)=>{
                const c=calcPlan(plan)
                const isCurrent=billing?.currentPlan?.id===plan.id
                const isPop=plan.id===popular?.id
                const canSelect=billing?.opCount<=plan.max_operators
                return (
                  <div key={plan.id} className="a1" style={{animationDelay:`${i*60}ms`,position:'relative'}}>
                    {/* Popular badge */}
                    {isPop && (
                      <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',zIndex:10,padding:'4px 16px',borderRadius:99,background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)',color:'white',fontSize:10,fontWeight:800,letterSpacing:'0.08em',boxShadow:'0 4px 20px rgba(79,110,247,0.4)'}}>
                        MAIS POPULAR
                      </div>
                    )}
                    <div style={{
                      borderRadius:20,overflow:'hidden',height:'100%',display:'flex',flexDirection:'column',
                      background:isPop?'linear-gradient(145deg,rgba(79,110,247,0.12),var(--surface) 60%)':'var(--surface)',
                      border:isPop?'2px solid rgba(79,110,247,0.35)':isCurrent?'2px solid var(--profit-border)':'1px solid var(--b1)',
                      boxShadow:isPop?'0 0 60px rgba(79,110,247,0.1), 0 20px 60px rgba(0,0,0,0.3)':'0 2px 12px rgba(0,0,0,0.2)',
                      transition:'all 0.3s cubic-bezier(0.33,1,0.68,1)',
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow=isPop?'0 0 80px rgba(79,110,247,0.15), 0 30px 80px rgba(0,0,0,0.4)':'0 16px 48px rgba(0,0,0,0.35)'}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=isPop?'0 0 60px rgba(79,110,247,0.1), 0 20px 60px rgba(0,0,0,0.3)':'0 2px 12px rgba(0,0,0,0.2)'}}
                    >
                      <div style={{padding:'28px 24px 20px',flex:1}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                          <h3 style={{fontSize:18,fontWeight:800,color:'var(--t1)'}}>{plan.name}</h3>
                          {isCurrent && <span className="badge badge-profit" style={{fontSize:9}}>Atual</span>}
                        </div>
                        <div style={{marginBottom:20}}>
                          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
                            <span className="t-num" style={{fontSize:36,fontWeight:900,color:isPop?'var(--brand-bright)':'var(--t1)'}}>R$ {fmt(c.total)}</span>
                            <span style={{fontSize:13,color:'var(--t3)'}}>/mes</span>
                          </div>
                          {c.savings>0 && (
                            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
                              <span style={{fontSize:13,color:'var(--t4)',textDecoration:'line-through'}}>R$ {fmt(c.fullPrice)}</span>
                              <span className="badge badge-profit" style={{fontSize:9}}>-{plan.discount_pct}%</span>
                            </div>
                          )}
                        </div>
                        {/* Features */}
                        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
                          {[
                            {t:'1 admin incluido',ok:true},
                            {t:`Ate ${plan.max_operators} operador${plan.max_operators>1?'es':''}`,ok:true},
                            {t:plan.discount_pct>0?`${plan.discount_pct}% desconto nos operadores`:'Sem desconto',ok:plan.discount_pct>0},
                            {t:c.savings>0?`Economia de R$ ${fmt(c.savings)}/mes`:'Preco por operador: R$ '+fmt(OP_PRICE),ok:c.savings>0},
                          ].map((f,j)=>(
                            <div key={j} style={{display:'flex',alignItems:'center',gap:8}}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={f.ok?'var(--profit)':'var(--t4)'} strokeWidth="2.5" strokeLinecap="round">
                                {f.ok?<polyline points="20 6 9 17 4 12"/>:<line x1="18" y1="6" x2="6" y2="18"/>}
                              </svg>
                              <span style={{fontSize:13,color:f.ok?'var(--t2)':'var(--t4)'}}>{f.t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* CTA */}
                      <div style={{padding:'0 24px 24px'}}>
                        {isCurrent ? (
                          <div style={{padding:'12px',borderRadius:12,textAlign:'center',background:'var(--profit-dim)',border:'1px solid var(--profit-border)'}}>
                            <span style={{fontSize:13,fontWeight:700,color:'var(--profit)'}}>Plano atual</span>
                          </div>
                        ) : !canSelect ? (
                          <div style={{padding:'12px',borderRadius:12,textAlign:'center',background:'var(--loss-dim)',border:'1px solid var(--loss-border)'}}>
                            <span style={{fontSize:12,fontWeight:600,color:'var(--loss)'}}>Voce tem {billing?.opCount} ops (limite: {plan.max_operators})</span>
                          </div>
                        ) : (
                          <button onClick={()=>selectPlan(plan)} disabled={saving} className={`btn ${isPop?'btn-brand':'btn-ghost'} btn-lg`} style={{width:'100%',justifyContent:'center',fontSize:14,fontWeight:700}}>
                            {saving?'Salvando...':isPop?'Escolher plano':'Selecionar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Savings comparison */}
            <div className="card a3" style={{padding:28,textAlign:'center'}}>
              <h3 style={{fontSize:16,fontWeight:800,color:'var(--t1)',marginBottom:16}}>Compare e economize</h3>
              <div style={{display:'grid',gridTemplateColumns:`repeat(${plans.length},1fr)`,gap:12}}>
                {plans.map(plan=>{
                  const c=calcPlan(plan)
                  return (
                    <div key={plan.id} style={{background:'var(--raised)',borderRadius:12,padding:'16px 12px',border:'1px solid var(--b1)'}}>
                      <p className="t-label" style={{marginBottom:8}}>{plan.name}</p>
                      <p className="t-num" style={{fontSize:20,fontWeight:800,color:c.savings>0?'var(--profit)':'var(--t2)',marginBottom:4}}>
                        {c.savings>0?`-R$ ${fmt(c.savings)}`:'-'}
                      </p>
                      <p className="t-small">{c.savings>0?'economia/mes':'sem desconto'}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CURRENT PLAN ═══ */}
        {tab==='current' && (
          <div key="current" className="tab-content" style={{maxWidth:700,margin:'0 auto'}}>
            <div className="card" style={{padding:0,overflow:'hidden',border:'1px solid var(--brand-border)',boxShadow:'0 0 60px rgba(79,110,247,0.08), 0 20px 60px rgba(0,0,0,0.3)',marginBottom:28}}>
              <div style={{padding:'28px 32px',background:'linear-gradient(135deg, rgba(79,110,247,0.12), rgba(124,92,252,0.06))',borderBottom:'1px solid rgba(79,110,247,0.1)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <p className="t-label" style={{color:'var(--brand-bright)',marginBottom:6}}>{billing?.currentPlan?.name||'BASICO'}</p>
                    <h2 style={{fontSize:22,fontWeight:900,color:'var(--t1)'}}>Seu plano atual</h2>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p className="t-num" style={{fontSize:38,fontWeight:900,color:'var(--brand-bright)',lineHeight:1}}>
                      R$ {fmt(billing?.currentPlan ? calcPlan(billing.currentPlan).total : BASE)}
                    </p>
                    <p className="t-small" style={{marginTop:4}}>/mes</p>
                  </div>
                </div>
              </div>
              <div style={{padding:'24px 32px'}}>
                {[
                  {l:'Plano admin',v:`R$ ${fmt(BASE)}`,c:'var(--t1)'},
                  {l:`Operadores (${billing?.opCount||0} de ${billing?.currentPlan?.max_operators||1})`,v:`R$ ${fmt((billing?.opCount||0)*OP_PRICE*(1-(billing?.currentPlan?.discount_pct||0)/100))}`,c:'var(--t1)'},
                  ...(billing?.currentPlan?.discount_pct>0?[{l:`Desconto ${billing.currentPlan.discount_pct}%`,v:`-R$ ${fmt((billing?.opCount||0)*OP_PRICE*(billing.currentPlan.discount_pct/100))}`,c:'var(--profit)'}]:[]),
                ].map((item,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--b1)'}}>
                    <span style={{fontSize:13,color:'var(--t2)'}}>{item.l}</span>
                    <span className="t-num" style={{fontSize:14,fontWeight:700,color:item.c}}>{item.v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'16px 0'}}>
                  <span style={{fontSize:15,fontWeight:800,color:'var(--t1)'}}>Total mensal</span>
                  <span className="t-num" style={{fontSize:26,fontWeight:900,color:'var(--profit)'}}>R$ {fmt(billing?.currentPlan ? calcPlan(billing.currentPlan).total : BASE)}</span>
                </div>
                <button onClick={()=>setTab('plans')} className="btn btn-brand btn-lg" style={{width:'100%',justifyContent:'center',marginTop:8}}>
                  {billing?.subActive?'Trocar plano':'Escolher plano e assinar'}
                </button>
              </div>
            </div>

            {/* Mock Payment */}
            <div className="card" style={{padding:24,marginTop:16,marginBottom:28,border:'1px dashed var(--brand-border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <div style={{width:30,height:30,borderRadius:8,background:'var(--brand-dim)',border:'1px solid var(--brand-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <div>
                  <h3 className="t-h3" style={{fontSize:13}}>Simular pagamento</h3>
                  <p className="t-small">Ambiente de teste — sera substituido pelo gateway real</p>
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <button onClick={()=>simulatePayment('paid')} disabled={simulating} className="btn btn-profit" style={{flex:1,justifyContent:'center',fontSize:12}}>
                  {simulating?'Processando...':'Aprovar pagamento'}
                </button>
                <button onClick={()=>simulatePayment('pending')} disabled={simulating} className="btn btn-ghost" style={{flex:1,justifyContent:'center',fontSize:12,borderColor:'var(--warn-border)',color:'var(--warn)'}}>
                  Simular pendente
                </button>
                <button onClick={()=>simulatePayment('failed')} disabled={simulating} className="btn btn-danger" style={{flex:1,justifyContent:'center',fontSize:12}}>
                  Simular recusado
                </button>
              </div>
              {simMsg && (
                <div className={simMsg.includes('aprovado')?'alert-success':simMsg.includes('pendente')?'alert-success':'alert-error'} style={{fontSize:12,display:'flex',alignItems:'center',gap:8}}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {simMsg.includes('aprovado')?<polyline points="20 6 9 17 4 12"/>:<circle cx="12" cy="12" r="10"/>}
                  </svg>
                  {simMsg}
                </div>
              )}
            </div>

            {/* Operators */}
            <div className="card" style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <h3 className="t-h3" style={{fontSize:14}}>Operadores ({billing?.opCount||0}/{billing?.currentPlan?.max_operators||1})</h3>
                <div className="progress" style={{width:120,height:5}}>
                  <div className="progress-bar" style={{width:`${Math.min(100,((billing?.opCount||0)/(billing?.currentPlan?.max_operators||1))*100)}%`,background:'linear-gradient(90deg,var(--profit),#34d399)'}}/>
                </div>
              </div>
              {operators.length===0?(
                <p className="t-small" style={{textAlign:'center',padding:20}}>Nenhum operador vinculado.</p>
              ):operators.map(op=>(
                <div key={op.id} className="data-row" style={{padding:'8px 14px',marginBottom:4}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:9,fontWeight:800,color:'white'}}>{getName(op)[0].toUpperCase()}</span>
                    </div>
                    <span style={{fontSize:12,fontWeight:600,color:'var(--t1)'}}>{getName(op)}</span>
                  </div>
                  <span className="t-num" style={{fontSize:12,color:'var(--t3)'}}>+R$ {fmt(OP_PRICE*(1-(billing?.currentPlan?.discount_pct||0)/100))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {tab==='history' && (
          <div key="history" className="tab-content" style={{maxWidth:700,margin:'0 auto'}}>
            <div className="card" style={{padding:24}}>
              <h3 className="t-h3" style={{fontSize:14,marginBottom:16}}>Historico de pagamentos</h3>
              {payments.length===0?(
                <div style={{padding:40,textAlign:'center',border:'1px dashed var(--b2)',borderRadius:12}}>
                  <p className="t-small">Nenhum pagamento registrado.</p>
                </div>
              ):payments.map(p=>(
                <div key={p.id} className="data-row" style={{padding:'10px 16px',marginBottom:4}}>
                  <div>
                    <p style={{fontSize:12,fontWeight:600,color:'var(--t1)',margin:0}}>{p.description||'Pagamento'}</p>
                    <p className="t-small">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className={`badge ${p.status==='paid'?'badge-profit':'badge-warn'}`}>{p.status==='paid'?'Pago':'Pendente'}</span>
                    <p className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(p.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{textAlign:'center',marginTop:36}}>
          <p style={{fontSize:12,color:'var(--t3)'}}>Precisa de ajuda? suporte@nexcontrol.io</p>
        </div>
      </div>
    </main>
  )
}

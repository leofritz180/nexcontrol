'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { supabase } from '../../lib/supabase/client'
import dynamic from 'next/dynamic'
const PixPayment = dynamic(() => import('../../components/PixPayment'), { ssr: false })

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
    setOpQty((ops||[]).length)
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

  const total = useMemo(()=>{
    const opCost = Math.round(opQty * OP_PRICE * 100) / 100
    return Math.round((BASE + opCost) * 100) / 100
  },[opQty])

  if(loading) return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/></div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}/>

      <div style={{maxWidth:800,margin:'0 auto',padding:'40px 28px'}}>

        {/* ── HERO ── */}
        <div className="a1" style={{textAlign:'center',marginBottom:40}}>
          {/* Status badge */}
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 14px',borderRadius:99,background:billing?.subActive?'var(--profit-dim)':billing?.trialActive?'rgba(79,110,247,0.08)':'var(--loss-dim)',border:`1px solid ${billing?.subActive?'var(--profit-border)':billing?.trialActive?'rgba(79,110,247,0.15)':'var(--loss-border)'}`,marginBottom:20}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:billing?.subActive?'var(--profit)':billing?.trialActive?'var(--brand-bright)':'var(--loss)'}}/>
            <span style={{fontSize:11,fontWeight:700,color:billing?.subActive?'var(--profit)':billing?.trialActive?'var(--brand-bright)':'var(--loss)',letterSpacing:'0.06em'}}>
              {billing?.subActive?'ASSINATURA ATIVA':billing?.trialActive?`TRIAL · ${billing.daysLeft} DIAS RESTANTES`:'ASSINE PARA CONTINUAR'}
            </span>
          </div>
          <h1 style={{fontSize:34,fontWeight:900,color:'var(--t1)',letterSpacing:'-0.03em',marginBottom:10,lineHeight:1.2}}>
            Escolha a estrutura ideal<br/>para sua operacao
          </h1>
          <p style={{fontSize:15,color:'var(--t2)',maxWidth:480,margin:'0 auto'}}>
            Pague apenas pelo que precisa. Comece sozinho ou escale com operadores.
          </p>
        </div>

        {/* ── TWO OPTIONS ── */}
        <div className="a2 g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:32}}>

          {/* ADMIN SOLO */}
          <div style={{
            borderRadius:22,overflow:'hidden',
            background:'var(--surface)',border:opQty===0?'2px solid var(--brand-border)':'1px solid var(--b1)',
            boxShadow:opQty===0?'0 0 40px rgba(79,110,247,0.08)':'none',
            transition:'all 0.3s',cursor:'pointer',
          }} onClick={()=>setOpQty(0)}>
            <div style={{padding:'28px 26px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontSize:17,fontWeight:800,color:'var(--t1)',margin:0}}>Admin Solo</h3>
                {opQty===0&&<div style={{width:20,height:20,borderRadius:'50%',background:'var(--brand)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:12}}>
                <span className="t-num" style={{fontSize:36,fontWeight:900,color:opQty===0?'var(--brand-bright)':'var(--t1)'}}>R$ {fmt(BASE)}</span>
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
            background:opQty>0?'linear-gradient(145deg,rgba(79,110,247,0.1),var(--surface) 60%)':'var(--surface)',
            border:opQty>0?'2px solid var(--brand-border)':'1px solid var(--b1)',
            boxShadow:opQty>0?'0 0 40px rgba(79,110,247,0.08)':'none',
            transition:'all 0.3s',cursor:'pointer',
          }} onClick={()=>{if(opQty===0)setOpQty(Math.max(1,operators.length))}}>
            {/* Recommended badge */}
            <div style={{position:'absolute',top:0,right:0,padding:'6px 16px',borderRadius:'0 20px 0 12px',background:'linear-gradient(135deg,#4f6ef7,#7c5cfc)',fontSize:10,fontWeight:800,color:'white',letterSpacing:'0.06em'}}>RECOMENDADO</div>
            <div style={{padding:'28px 26px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontSize:17,fontWeight:800,color:'var(--t1)',margin:0}}>Admin + Operadores</h3>
                {opQty>0&&<div style={{width:20,height:20,borderRadius:'50%',background:'var(--brand)',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
                <span className="t-num" style={{fontSize:36,fontWeight:900,color:opQty>0?'var(--brand-bright)':'var(--t1)'}}>R$ {fmt(BASE)}</span>
                <span style={{fontSize:13,color:'var(--t3)'}}>+ R$ {fmt(OP_PRICE)}/op</span>
              </div>
              <p className="t-small" style={{marginBottom:14}}>Cada operador adicional R$ {fmt(OP_PRICE)}/mes</p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {['Tudo do Admin Solo','Operadores ilimitados','Notificacoes em tempo real','Controle total da equipe'].map((t,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7}}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{fontSize:13,color:'var(--t2)'}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── OPERATOR SELECTOR ── */}
        {opQty > 0 && (
          <div className="a3 card" style={{padding:'28px 30px',marginBottom:32,border:'1px solid var(--brand-border)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:800,color:'var(--t1)',margin:'0 0 4px'}}>Quantidade de operadores</h3>
                <p className="t-small">Cada operador adicional: R$ {fmt(OP_PRICE)}/mes</p>
              </div>
              {/* Stepper */}
              <div style={{display:'flex',alignItems:'center',gap:0}}>
                <button onClick={()=>setOpQty(Math.max(1,opQty-1))} style={{width:44,height:44,borderRadius:'12px 0 0 12px',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--t1)',transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>-</button>
                <div style={{width:64,height:44,border:'1px solid var(--b2)',borderLeft:'none',borderRight:'none',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--void)'}}>
                  <span className="t-num" style={{fontSize:22,fontWeight:900,color:'var(--brand-bright)'}}>{opQty}</span>
                </div>
                <button onClick={()=>setOpQty(opQty+1)} style={{width:44,height:44,borderRadius:'0 12px 12px 0',border:'1px solid var(--b2)',background:'var(--raised)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--t1)',transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--overlay)'} onMouseLeave={e=>e.currentTarget.style.background='var(--raised)'}>+</button>
              </div>
            </div>
            {/* Current operators */}
            {operators.length>0 && (
              <div style={{padding:'12px 14px',background:'var(--raised)',borderRadius:12,border:'1px solid var(--b1)'}}>
                <p className="t-small" style={{marginBottom:8}}>Operadores ativos: {operators.length}</p>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {operators.map(op=>(
                    <div key={op.id} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px 4px 4px',borderRadius:8,background:'var(--void)',border:'1px solid var(--b1)'}}>
                      <div style={{width:20,height:20,borderRadius:5,background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontSize:8,fontWeight:800,color:'white'}}>{getName(op)[0].toUpperCase()}</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:600,color:'var(--t2)'}}>{getName(op)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUMMARY + CTA ── */}
        <div className="a4" style={{
          borderRadius:22,overflow:'hidden',
          background:'linear-gradient(145deg,rgba(5,217,140,0.06),var(--surface))',
          border:'1px solid rgba(5,217,140,0.15)',
          boxShadow:'0 0 40px rgba(5,217,140,0.04)',
          marginBottom:32,
        }}>
          <div style={{padding:'28px 30px'}}>
            <h3 style={{fontSize:14,fontWeight:700,color:'var(--t1)',marginBottom:16}}>Resumo da assinatura</h3>
            {/* Line items */}
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
              <span style={{fontSize:13,color:'var(--t2)'}}>Plano Admin</span>
              <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(BASE)}</span>
            </div>
            {opQty > 0 && (
              <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
                <span style={{fontSize:13,color:'var(--t2)'}}>{opQty} operador{opQty>1?'es':''} x R$ {fmt(OP_PRICE)}</span>
                <span className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>R$ {fmt(opQty*OP_PRICE)}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',padding:'14px 0'}}>
              <span style={{fontSize:16,fontWeight:800,color:'var(--t1)'}}>Total mensal</span>
              <span className="t-num" style={{fontSize:28,fontWeight:900,color:'var(--profit)'}}>R$ {fmt(total)}</span>
            </div>

            {/* CTA */}
            <button onClick={()=>setShowPix(true)} className="btn btn-profit btn-lg" style={{width:'100%',justifyContent:'center',fontSize:16,fontWeight:800,padding:'16px',marginTop:4}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              {billing?.subActive?'Atualizar assinatura':`Assinar por R$ ${fmt(total)}/mes`}
            </button>

            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:14}}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{fontSize:10,color:'rgba(5,217,140,0.5)',fontWeight:600}}>Pagamento seguro via Pix · Ativacao instantanea</span>
            </div>
          </div>
        </div>

        {/* ── CURRENT SUBSCRIPTION INFO ── */}
        {(billing?.subActive||billing?.trialActive) && (
          <div className="a5 card" style={{padding:24,marginBottom:24}}>
            <h3 style={{fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:12}}>Detalhes da assinatura</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div style={{background:'var(--raised)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--b1)'}}>
                <p className="t-label" style={{marginBottom:4}}>Status</p>
                <p style={{fontSize:13,fontWeight:700,color:billing?.subActive?'var(--profit)':'var(--brand-bright)',margin:0}}>{billing?.subActive?'Ativa':'Trial'}</p>
              </div>
              <div style={{background:'var(--raised)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--b1)'}}>
                <p className="t-label" style={{marginBottom:4}}>Operadores</p>
                <p style={{fontSize:13,fontWeight:700,color:'var(--info)',margin:0}}>{operators.length} ativos</p>
              </div>
              <div style={{background:'var(--raised)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--b1)'}}>
                <p className="t-label" style={{marginBottom:4}}>{billing?.subActive?'Renovacao':'Expira em'}</p>
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
          amount={total}
          planName={opQty>0?`Admin + ${opQty} operador${opQty>1?'es':''}`:'Admin Solo'}
          onSuccess={()=>{ setShowPix(false); init() }}
          onClose={()=>setShowPix(false)}
        />
      )}
    </main>
  )
}

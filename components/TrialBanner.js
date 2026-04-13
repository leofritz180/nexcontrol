'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

/* ═══════════════════════════════
   TRIAL & CONVERSION SYSTEM
═══════════════════════════════ */

function getLevel(days) {
  if (days > 3) return 'green'
  if (days > 1) return 'yellow'
  if (days === 1) return 'orange'
  return 'red'
}

const CFG = {
  green:  { bg:'rgba(34,197,94,0.06)', border:'rgba(34,197,94,0.15)', color:'var(--profit)', rgb:'34,197,94' },
  yellow: { bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.2)', color:'var(--warn)', rgb:'245,158,11' },
  orange: { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)', color:'#f59e0b', rgb:'245,158,11' },
  red:    { bg:'rgba(239,68,68,0.1)', border:'rgba(239,68,68,0.25)', color:'var(--loss)', rgb:'239,68,68' },
}

function useTrialState(tenant, subscription) {
  return useMemo(() => {
    if (!tenant) return null
    const now = new Date(), trialEnd = new Date(tenant.trial_end)
    const trialActive = tenant.subscription_status === 'trial' && now < trialEnd
    const trialExpired = tenant.subscription_status === 'trial' && now >= trialEnd
    const subActive = subscription?.status === 'active' && new Date(subscription.expires_at) > now
    const days = trialActive ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))) : 0
    const hours = trialActive && days <= 1 ? Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60))) : 0
    const level = trialActive ? getLevel(days) : 'red'
    return { trialActive, trialExpired, subActive, days, hours, level, trialEnd }
  }, [tenant, subscription])
}

/* ─── Header Badge ─── */
export function TrialStatusBadge({ tenant, subscription }) {
  const t = useTrialState(tenant, subscription)
  if (!t || t.subActive || (!t.trialActive && !t.trialExpired)) return null
  const cfg = CFG[t.level]
  return (
    <div style={{
      display:'flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:99,
      background:cfg.bg,border:`1px solid ${cfg.border}`,
      fontSize:10,fontWeight:700,color:cfg.color,letterSpacing:'0.04em',
      animation:t.level==='orange'||t.level==='red'?'breathe 3s ease-in-out infinite':'none',
    }}>
      <div style={{width:5,height:5,borderRadius:'50%',background:cfg.color}}/>
      {t.days>0?`TRIAL: ${t.days}d`:'EXPIRADO'}
    </div>
  )
}

/* ─── Conversion Modal ─── */
export function ConversionModal({ tenant, subscription, stats }) {
  const router = useRouter()
  const t = useTrialState(tenant, subscription)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!t || t.subActive || dismissed) return
    if (t.trialExpired || (t.trialActive && t.days <= 2)) {
      // Wait at least 1 min from account creation before showing
      const created = tenant?.created_at ? new Date(tenant.created_at).getTime() : 0
      const elapsed = created ? Date.now() - created : Infinity
      const minDelay = Math.max(0, 60000 - elapsed)
      const baseDelay = t.trialExpired ? 500 : 3000
      const timer = setTimeout(() => setShow(true), Math.max(baseDelay, minDelay))
      return () => clearTimeout(timer)
    }
  }, [t, dismissed, tenant?.created_at])

  if (!show || !t) return null
  const cfg = CFG[t.level]
  const moved = stats?.totalMoved || 0
  const metas = stats?.totalMetas || 0
  const remessas = stats?.totalRemessas || 0

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:10000,
      background:'rgba(4,8,16,0.92)',backdropFilter:'blur(16px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:24,
      animation:'fade-in 0.3s ease both',
    }} onClick={()=>{if(!t.trialExpired){setShow(false);setDismissed(true)}}}>
      <div onClick={e=>e.stopPropagation()} style={{
        maxWidth:520,width:'100%',
        background:'var(--surface)',borderRadius:28,overflow:'hidden',
        border:`1px solid ${t.trialExpired?'rgba(239,68,68,0.2)':'rgba(59,130,246,0.2)'}`,
        boxShadow:`0 0 100px ${t.trialExpired?'rgba(239,68,68,0.1)':'rgba(59,130,246,0.1)'}, 0 40px 80px rgba(0,0,0,0.5)`,
        animation:'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both',
      }}>
        {/* Top gradient */}
        <div style={{
          padding:'32px 36px 24px',
          background:t.trialExpired
            ?'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))'
            :'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(34,197,94,0.06))',
          borderBottom:`1px solid ${t.trialExpired?'rgba(239,68,68,0.1)':'rgba(59,130,246,0.1)'}`,
          textAlign:'center',
        }}>
          {/* Countdown */}
          {t.trialActive && (
            <div style={{
              display:'inline-flex',alignItems:'center',gap:8,
              padding:'8px 20px',borderRadius:99,marginBottom:16,
              background:`rgba(${cfg.rgb},0.1)`,border:`1px solid rgba(${cfg.rgb},0.2)`,
            }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{fontSize:13,fontWeight:700,color:cfg.color}}>
                {t.days > 0 ? `${t.days} dia${t.days!==1?'s':''} restante${t.days!==1?'s':''}` : `${t.hours}h restante${t.hours!==1?'s':''}`}
              </span>
            </div>
          )}
          {t.trialExpired && (
            <div style={{width:52,height:52,borderRadius:15,background:'var(--loss-dim)',border:'1px solid var(--loss-border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
          )}
          <h2 style={{fontSize:22,fontWeight:900,color:'var(--t1)',marginBottom:6}}>
            {t.trialExpired?'Seu acesso foi bloqueado':t.days===1?'Ultimo dia de acesso gratuito':'Seu teste esta acabando'}
          </h2>
          <p style={{fontSize:14,color:'var(--t2)'}}>
            {t.trialExpired?'Assine agora para desbloquear todas as funcionalidades.':'Garanta seu acesso antes que expire.'}
          </p>
        </div>

        <div style={{padding:'24px 36px 32px'}}>
          {/* Social proof — user stats */}
          {(moved>0||metas>0) && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:24}}>
              {[
                {l:'Movimentado',v:`R$ ${Number(moved).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0})}`,c:'var(--profit)'},
                {l:'Metas criadas',v:metas,c:'var(--brand-bright)'},
                {l:'Remessas',v:remessas,c:'var(--info)'},
              ].map(({l,v,c})=>(
                <div key={l} style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px 12px',textAlign:'center'}}>
                  <p className="t-num" style={{fontSize:18,fontWeight:800,color:c,marginBottom:2}}>{v}</p>
                  <p style={{fontSize:10,color:'var(--t3)',letterSpacing:'0.04em',fontWeight:600}}>{l}</p>
                </div>
              ))}
            </div>
          )}

          {moved>0 && (
            <div style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px 18px',marginBottom:24,display:'flex',alignItems:'center',gap:12}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p style={{fontSize:13,color:'var(--t2)',flex:1}}>
                Voce ja movimentou <strong style={{color:'var(--profit)'}}>R$ {Number(moved).toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong> no sistema. Nao perca o controle da sua operacao.
              </p>
            </div>
          )}

          {/* Pricing preview */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 0',borderBottom:'1px solid var(--b1)',marginBottom:20}}>
            <span style={{fontSize:13,color:'var(--t2)'}}>A partir de</span>
            <div style={{textAlign:'right'}}>
              <span className="t-num" style={{fontSize:28,fontWeight:900,color:'var(--brand-bright)'}}>R$ 39,90</span>
              <span style={{fontSize:12,color:'var(--t3)'}}> /mes</span>
            </div>
          </div>

          {/* CTA */}
          <button onClick={()=>router.push('/billing')} className="btn btn-profit btn-lg" style={{
            width:'100%',justifyContent:'center',fontSize:16,fontWeight:800,padding:'16px 24px',
            boxShadow:'0 0 0 0 rgba(34,197,94,0.5)',
            animation:'cta-pulse 2.5s ease-in-out infinite',
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            {t.trialExpired?'Desbloquear acesso':'Assinar agora'}
          </button>

          {!t.trialExpired && (
            <button onClick={()=>{setShow(false);setDismissed(true)}} style={{
              display:'block',width:'100%',marginTop:12,padding:10,
              background:'none',border:'none',cursor:'pointer',
              fontSize:12,color:'var(--t4)',textAlign:'center',
            }}>
              Continuar no trial
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Banner ─── */
export default function TrialBanner({ tenant, subscription, stats }) {
  const router = useRouter()
  const t = useTrialState(tenant, subscription)
  const [ready, setReady] = useState(false)

  // Delay: only show after 1 minute from account creation
  useEffect(() => {
    if (!tenant?.created_at) { setReady(true); return }
    const created = new Date(tenant.created_at).getTime()
    const elapsed = Date.now() - created
    const DELAY = 60 * 1000 // 1 minute
    if (elapsed >= DELAY) { setReady(true); return }
    const timer = setTimeout(() => setReady(true), DELAY - elapsed)
    return () => clearTimeout(timer)
  }, [tenant?.created_at])

  if (!ready) return null
  if (!t || t.subActive) return null
  if (!t.trialActive && !t.trialExpired) return null

  const cfg = CFG[t.level]
  const moved = stats?.totalMoved || 0
  const msgs = {
    green:  { title:'Aproveite seu teste gratuito', sub:`Voce tem ${t.days} dias para explorar o NexControl sem custo.` },
    yellow: { title:`Faltam ${t.days} dias para o fim do seu acesso`, sub:'Escolha um plano agora e mantenha sua operacao ativa.' },
    orange: { title:'Seu acesso sera bloqueado amanha', sub:'Assine hoje para nao perder o controle da sua operacao.' },
    red:    { title:'Seu acesso foi bloqueado', sub:'Assine um plano para continuar usando o NexControl.' },
  }
  const msg = msgs[t.level]

  return (
    <div style={{
      borderRadius:20,padding:'26px 30px',marginBottom:24,
      background:`linear-gradient(135deg, ${cfg.bg}, rgba(${cfg.rgb},0.02))`,
      border:`1px solid ${cfg.border}`,
      boxShadow:`0 0 40px rgba(${cfg.rgb},0.06)`,
      animation:'fade-up 0.4s cubic-bezier(0.4,0,0.2,1) both',
      position:'relative',overflow:'hidden',
    }}>
      {/* Ambient glow */}
      {(t.level==='orange'||t.level==='red') && (
        <div style={{position:'absolute',top:-50,right:-50,width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle, rgba(${cfg.rgb},0.08), transparent 70%)`,pointerEvents:'none',animation:'breathe 4s ease-in-out infinite'}}/>
      )}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,position:'relative',zIndex:1,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,flex:1,minWidth:240}}>
          <div style={{
            width:48,height:48,borderRadius:14,flexShrink:0,
            background:`rgba(${cfg.rgb},0.12)`,border:`1px solid rgba(${cfg.rgb},0.2)`,
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:`0 0 20px rgba(${cfg.rgb},0.15)`,
          }}>
            {t.trialExpired ? (
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            ) : (
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            )}
          </div>
          <div>
            <h3 style={{fontSize:16,fontWeight:800,color:cfg.color,marginBottom:4}}>{msg.title}</h3>
            <p style={{fontSize:13,color:'var(--t2)',margin:0}}>{msg.sub}</p>
            {moved>0 && t.level!=='green' && (
              <p style={{fontSize:12,color:'var(--t3)',marginTop:6}}>
                Voce ja movimentou <strong style={{color:'var(--profit)'}}>R$ {Number(moved).toLocaleString('pt-BR',{minimumFractionDigits:0})}</strong> no sistema.
              </p>
            )}
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:16,flexShrink:0}}>
          {/* Countdown */}
          {t.trialActive && (
            <div style={{textAlign:'center',minWidth:56}}>
              <p style={{fontFamily:'var(--mono)',fontSize:36,fontWeight:900,color:cfg.color,lineHeight:1}}>{t.days}</p>
              <p style={{fontSize:9,fontWeight:700,color:cfg.color,letterSpacing:'0.08em',marginTop:3}}>DIA{t.days!==1?'S':''}</p>
            </div>
          )}
          {/* CTA — increasingly prominent */}
          <button onClick={()=>router.push('/billing')} className={`btn ${t.trialExpired||t.level==='orange'?'btn-profit':t.level==='yellow'?'btn-brand':'btn-ghost'}`} style={{
            whiteSpace:'nowrap',
            padding:t.level==='green'?'8px 16px':'12px 24px',
            fontSize:t.level==='green'?12:14,
            fontWeight:t.level==='green'?600:800,
            animation:t.level!=='green'&&!t.trialExpired?'cta-pulse 2.5s ease-in-out infinite':'none',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            {t.trialExpired?'Desbloquear acesso':t.level==='green'?'Ver planos':'Assinar agora'}
          </button>
        </div>
      </div>
    </div>
  )
}

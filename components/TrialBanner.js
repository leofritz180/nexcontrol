'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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
  const moved = stats?.totalMoved || 0
  const metas = stats?.totalMetas || 0
  const remessas = stats?.totalRemessas || 0

  // Tempo restante dinamico: dias se > 1, senao horas
  const showHours = t.trialActive && t.days <= 1 && t.hours > 0
  const badgeLabel = t.trialExpired
    ? 'Acesso expirado'
    : showHours
      ? `Faltam apenas ${t.hours}h`
      : `Faltam apenas ${t.days} dia${t.days !== 1 ? 's' : ''}`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(4,8,16,0.78)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        onClick={() => { if (!t.trialExpired) { setShow(false); setDismissed(true) } }}
      >
        {/* Glow vermelho de urgencia (ambiente) */}
        <motion.div
          aria-hidden
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(720px, 95vw)', height: 'min(540px, 80vh)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.16), transparent 65%)',
            filter: 'blur(60px)', pointerEvents: 'none',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.38, ease: [0.33, 1, 0.68, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 480,
            background: 'linear-gradient(155deg, rgba(14,20,35,0.95), rgba(8,12,22,0.95))',
            borderRadius: 24, overflow: 'hidden',
            border: '1px solid rgba(239,68,68,0.18)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 30px 70px rgba(0,0,0,0.6), 0 0 80px rgba(239,68,68,0.12)',
          }}
        >
          {/* Linha superior com brilho sutil */}
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.45), transparent)' }} />

          {/* Top */}
          <div style={{ padding: '32px 32px 22px', textAlign: 'center', position: 'relative' }}>
            {/* Badge pulsante */}
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 6px rgba(239,68,68,0.14)', '0 0 0 0 rgba(239,68,68,0)'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 16px', borderRadius: 99, marginBottom: 18,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.22)',
                fontSize: 12, fontWeight: 700, color: '#fca5a5', letterSpacing: '0.02em',
              }}
            >
              <motion.svg
                width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round"
                animate={{ rotate: [0, -6, 6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </motion.svg>
              {badgeLabel}
            </motion.div>

            <h2 style={{ fontSize: 21, fontWeight: 900, color: '#F1F5F9', margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              {t.trialExpired ? 'Seu acesso foi interrompido' : 'Seu acesso está prestes a ser interrompido'}
            </h2>
            <p style={{ fontSize: 13.5, color: '#CBD5E1', margin: '0 0 6px', lineHeight: 1.5 }}>
              Não perca seus dados, metas e histórico da sua operação
            </p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Continue acompanhando lucro, operadores e resultados em tempo real
            </p>
          </div>

          {/* Social proof compacto quando tem dados */}
          {(moved > 0 || metas > 0) && (
            <div style={{ padding: '0 32px 12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { l: 'Movimentado', v: `R$ ${Number(moved).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, c: '#22C55E' },
                  { l: 'Metas', v: metas, c: '#60A5FA' },
                  { l: 'Remessas', v: remessas, c: '#a855f7' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 800, color: c, margin: '0 0 2px' }}>{v}</p>
                    <p style={{ fontSize: 9, color: '#64748B', letterSpacing: '0.04em', fontWeight: 600, margin: 0 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div style={{ padding: '18px 32px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 2px', fontWeight: 600 }}>A partir de</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>Menos que 1 operação perdida por dia</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 900, color: '#22C55E', letterSpacing: '-0.02em' }}>R$ 39,90</span>
                <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4, fontWeight: 600 }}>/mês</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ padding: '18px 32px 28px' }}>
            <motion.button
              onClick={() => router.push('/billing')}
              whileHover={{ scale: 1.015, boxShadow: '0 0 0 1px rgba(34,197,94,0.35), 0 12px 28px rgba(34,197,94,0.28), 0 0 42px rgba(34,197,94,0.22)' }}
              whileTap={{ scale: 0.98 }}
              className="nc-unlock-cta"
              style={{
                position: 'relative', overflow: 'hidden',
                width: '100%', padding: '15px 22px', borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: 'linear-gradient(180deg, #22c55e, #16a34a)',
                color: '#04120a',
                fontSize: 15, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 0 0 1px rgba(34,197,94,0.2), 0 8px 22px rgba(34,197,94,0.22), 0 0 30px rgba(34,197,94,0.18)',
                letterSpacing: '-0.01em',
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
              Liberar acesso completo
              {/* Shimmer loop */}
              <span aria-hidden className="nc-unlock-shimmer" />
            </motion.button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#64748B', margin: '10px 0 0', fontWeight: 500 }}>
              Ativação imediata · Sem perder dados
            </p>

            {!t.trialExpired && (
              <button
                onClick={() => { setShow(false); setDismissed(true) }}
                style={{
                  display: 'block', width: '100%', marginTop: 14, padding: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: '#64748B', textAlign: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
              >
                Continuar no trial
              </button>
            )}
          </div>

          <style>{`
            .nc-unlock-cta .nc-unlock-shimmer {
              position: absolute; top: 0; left: -40%; height: 100%; width: 40%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent);
              transform: skewX(-20deg);
              animation: ncShimmerLoop 3.2s ease-in-out infinite;
              pointer-events: none;
            }
            @keyframes ncShimmerLoop {
              0% { left: -50%; }
              60% { left: 120%; }
              100% { left: 120%; }
            }
            @media (max-width: 520px) {
              .nc-unlock-cta { font-size: 14px !important; padding: 13px 18px !important; }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

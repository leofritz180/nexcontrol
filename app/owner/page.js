'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'

const OWNER = 'leofritz180@gmail.com'
const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtInt = v => Number(v||0).toLocaleString('pt-BR')
const ease = [0.33,1,0.68,1]
const fadeUp = (i,base=0) => ({initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{duration:0.3,delay:base+i*0.05,ease}})

function CountUp({value,prefix='',suffix='',duration=1200}) {
  const [d,setD]=useState('0')
  const ref=useRef(null)
  useEffect(()=>{
    const n=Math.abs(Number(value||0)),s=performance.now()
    const tick=now=>{const p=Math.min((now-s)/duration,1);setD(fmt(n*(1-Math.pow(1-p,3))));if(p<1)ref.current=requestAnimationFrame(tick)}
    ref.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(ref.current)
  },[value])
  return <span>{prefix}{d}{suffix}</span>
}

export default function OwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u || u.email !== OWNER) { router.push('/admin'); return }
      const res = await fetch('/api/owner/stats', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: u.email }),
      })
      if (!res.ok) { router.push('/admin'); return }
      setData(await res.json())
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--base)'}}>
      <div className="spinner" style={{width:24,height:24,borderTopColor:'var(--t1)'}}/>
    </main>
  )
  if (!data) return null

  const { kpis, funnel, activity, adminStats, alerts, insights } = data

  // Health score
  let hScore = 50
  if (kpis.mrr > 0) hScore += 15
  if (kpis.churnRate < 10) hScore += 10
  if (kpis.activeSubs > 0) hScore += 10
  if (kpis.churnRate > 20) hScore -= 15
  if (activity.active7 > 0) hScore += 5
  const health = hScore >= 70 ? {l:'Saudavel',c:'var(--profit)'} : hScore >= 45 ? {l:'Atencao',c:'var(--warn)'} : {l:'Risco',c:'var(--loss)'}

  // Funnel conversion
  const convRate = funnel.registered > 0 ? Math.round((funnel.withSub/funnel.registered)*100) : 0
  const funnelSteps = [
    {l:'Cadastrados', v:funnel.registered, pct:100},
    {l:'Criaram meta', v:funnel.withMeta, pct:funnel.registered>0?Math.round(funnel.withMeta/funnel.registered*100):0},
    {l:'Lancaram remessa', v:funnel.withRemessa, pct:funnel.registered>0?Math.round(funnel.withRemessa/funnel.registered*100):0},
    {l:'Assinaram', v:funnel.withSub, pct:funnel.registered>0?Math.round(funnel.withSub/funnel.registered*100):0},
  ]
  // Find biggest drop
  let biggestDrop = '', biggestDropPct = 0
  for (let i=1;i<funnelSteps.length;i++) {
    const drop = funnelSteps[i-1].pct - funnelSteps[i].pct
    if (drop > biggestDropPct) { biggestDropPct=drop; biggestDrop=funnelSteps[i].l }
  }

  const card = {
    padding:'28px', borderRadius:16,
    background:'linear-gradient(145deg, #0c1424, #080e1a)',
    border:'1px solid rgba(255,255,255,0.05)',
    boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
  }

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'40px 28px 80px'}}>

        {/* ═══ BLOCO 1 — HERO EXECUTIVO ═══ */}
        <motion.div {...fadeUp(0)} style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div>
              <p style={{fontSize:11,color:'var(--t3)',letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:600,margin:'0 0 6px'}}>Owner dashboard</p>
              <h1 style={{fontSize:28,fontWeight:800,color:'var(--t1)',margin:0,letterSpacing:'-0.03em'}}>Comando do SaaS</h1>
              <p style={{fontSize:13,color:'var(--t3)',margin:'6px 0 0'}}>Receita, ativacao, retencao e saude do produto</p>
            </div>
            <button onClick={()=>router.push('/admin')} style={{fontSize:12,fontWeight:600,padding:'7px 16px',borderRadius:8,cursor:'pointer',border:'1px solid var(--b2)',background:'transparent',color:'var(--t3)'}}>
              Voltar ao admin
            </button>
          </div>
        </motion.div>

        {/* Hero row: MRR + Health */}
        <div className="g-side" style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:16,marginBottom:24}}>
          {/* MRR Hero */}
          <motion.div {...fadeUp(1)} style={{...card,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:'10%',left:'5%',width:350,height:250,borderRadius:'50%',background:'radial-gradient(circle, rgba(34,197,94,0.06), transparent 60%)',filter:'blur(40px)',pointerEvents:'none'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <p style={{fontSize:12,color:'var(--t3)',marginBottom:12}}>Receita mensal recorrente (MRR)</p>
              <p style={{fontFamily:'var(--mono)',fontSize:48,fontWeight:900,color:'var(--profit)',lineHeight:1,letterSpacing:'-0.03em',margin:'0 0 8px',textShadow:'0 0 40px rgba(34,197,94,0.15)'}}>
                <CountUp value={kpis.mrr} prefix="R$ "/>
              </p>
              <p style={{fontSize:12,color:'var(--t3)',margin:0}}>{kpis.activeSubs} assinaturas ativas · Ticket medio R$ {fmt(kpis.avgTicket)}</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:20,marginTop:20,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                <div><p style={{fontSize:10,color:'var(--t4)',marginBottom:2,textTransform:'uppercase'}}>Receita total</p><p style={{fontFamily:'var(--mono)',fontSize:16,fontWeight:700,color:'var(--t1)',margin:0}}>R$ {fmt(kpis.totalRevenue)}</p></div>
                <div style={{width:1,height:28,background:'rgba(255,255,255,0.05)'}}/>
                <div><p style={{fontSize:10,color:'var(--t4)',marginBottom:2,textTransform:'uppercase'}}>Ultimos 30d</p><p style={{fontFamily:'var(--mono)',fontSize:16,fontWeight:700,color:'var(--t1)',margin:0}}>R$ {fmt(kpis.rev30)}</p></div>
                <div style={{width:1,height:28,background:'rgba(255,255,255,0.05)'}}/>
                <div><p style={{fontSize:10,color:'var(--t4)',marginBottom:2,textTransform:'uppercase'}}>Ultimos 7d</p><p style={{fontFamily:'var(--mono)',fontSize:16,fontWeight:700,color:'var(--t1)',margin:0}}>R$ {fmt(kpis.rev7)}</p></div>
              </div>
            </div>
          </motion.div>

          {/* Health */}
          <motion.div {...fadeUp(2)} style={{...card,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <p style={{fontSize:12,color:'var(--t3)',margin:0}}>Saude do produto</p>
                <span style={{fontSize:10,fontWeight:700,padding:'4px 12px',borderRadius:6,background:health.c==='var(--profit)'?'var(--profit-dim)':health.c==='var(--warn)'?'var(--warn-dim)':'var(--loss-dim)',color:health.c,border:`1px solid ${health.c==='var(--profit)'?'var(--profit-border)':health.c==='var(--warn)'?'var(--warn-border)':'var(--loss-border)'}`}}>
                  {health.l}
                </span>
              </div>
              {[
                {l:'Clientes ativos (7d)',v:activity.active7,c:'var(--t1)'},
                {l:'Churn rate',v:`${kpis.churnRate}%`,c:kpis.churnRate>10?'var(--loss)':'var(--t1)'},
                {l:'Conversao',v:`${convRate}%`,c:convRate>=30?'var(--profit)':'var(--warn)'},
                {l:'Canceladas',v:kpis.cancelledSubs,c:kpis.cancelledSubs>0?'var(--loss)':'var(--t1)'},
              ].map(({l,v,c},i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<3?'1px solid rgba(255,255,255,0.04)':'none'}}>
                  <span style={{fontSize:12,color:'var(--t3)'}}>{l}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:700,color:c}}>{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ═══ BLOCO 2 — KPIs ═══ */}
        <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
          {[
            {l:'Clientes',v:fmtInt(kpis.totalAdmins),accent:'rgba(255,255,255,0.12)'},
            {l:'Operadores',v:fmtInt(kpis.totalOperators),accent:'rgba(255,255,255,0.12)'},
            {l:'Novos (7d)',v:`+${kpis.new7}`,accent:'rgba(34,197,94,0.4)'},
            {l:'Novos (30d)',v:`+${kpis.new30}`,accent:'rgba(34,197,94,0.4)'},
          ].map((k,i)=>(
            <motion.div key={i} {...fadeUp(i,0.15)} style={{...card,padding:'18px 22px 18px 26px',position:'relative',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{position:'absolute',left:0,top:'20%',bottom:'20%',width:2,borderRadius:'0 2px 2px 0',background:k.accent}}/>
              <span style={{fontSize:11,color:'var(--t3)'}}>{k.l}</span>
              <span style={{fontFamily:'var(--mono)',fontSize:20,fontWeight:800,color:'var(--t1)'}}>{k.v}</span>
            </motion.div>
          ))}
        </div>

        {/* ═══ BLOCO 3 — SAAS METRICS + FUNNEL ═══ */}
        <div className="g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
          {/* SaaS Metrics */}
          <motion.div {...fadeUp(0,0.25)} style={card}>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--t1)',margin:'0 0 20px'}}>Metricas SaaS</h3>
            {[
              {l:'ARPU',v:`R$ ${fmt(kpis.arpu)}`},
              {l:'LTV estimado',v:`R$ ${fmt(kpis.ltv)}`},
              {l:'Ticket medio',v:`R$ ${fmt(kpis.avgTicket)}`},
              {l:'Total metas',v:fmtInt(kpis.totalMetas)},
              {l:'Total remessas',v:fmtInt(kpis.totalRemessas)},
              {l:'Assinaturas ativas',v:fmtInt(kpis.activeSubs)},
            ].map(({l,v},i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:i<5?'1px solid rgba(255,255,255,0.04)':'none'}}>
                <span style={{fontSize:12,color:'var(--t3)'}}>{l}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:15,fontWeight:700,color:'var(--t1)'}}>{v}</span>
              </div>
            ))}
          </motion.div>

          {/* Funnel */}
          <motion.div {...fadeUp(1,0.25)} style={card}>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--t1)',margin:'0 0 20px'}}>Funil de ativacao</h3>
            {funnelSteps.map(({l,v,pct},i)=>(
              <div key={i} style={{marginBottom:i<3?18:0}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:12,color:'var(--t2)'}}>{l}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:700,color:'var(--t1)'}}>{v} <span style={{color:'var(--t3)',fontWeight:500}}>({pct}%)</span></span>
                </div>
                <div style={{height:5,background:'rgba(255,255,255,0.04)',borderRadius:99}}>
                  <div style={{height:'100%',width:`${pct}%`,borderRadius:99,background:pct>=60?'var(--profit)':pct>=30?'var(--warn)':'var(--loss)',transition:'width 0.5s ease'}}/>
                </div>
              </div>
            ))}
            {biggestDrop && (
              <div style={{marginTop:16,padding:'12px 14px',borderRadius:10,background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.1)'}}>
                <p style={{fontSize:11,color:'var(--warn)',margin:0}}>Maior queda: etapa "{biggestDrop}" (-{biggestDropPct}%)</p>
              </div>
            )}
            <div style={{marginTop:16,padding:'14px',borderRadius:10,background:'rgba(255,255,255,0.02)'}}>
              <p style={{fontSize:10,color:'var(--t4)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Engajamento</p>
              <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
                {[{l:'Hoje',v:activity.activeToday},{l:'7 dias',v:activity.active7},{l:'30 dias',v:activity.active30}].map(({l,v})=>(
                  <div key={l}><p style={{fontFamily:'var(--mono)',fontSize:20,fontWeight:800,color:'var(--t1)',margin:'0 0 2px'}}>{v}</p><p style={{fontSize:10,color:'var(--t3)',margin:0}}>{l}</p></div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ BLOCO 5 — INSIGHTS + ALERTAS ═══ */}
        <div className="g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
          <motion.div {...fadeUp(0,0.35)} style={card}>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--t1)',margin:'0 0 20px'}}>Inteligencia executiva</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {insights.map((ins,i)=>(
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',borderRadius:10,background:'rgba(255,255,255,0.02)'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,marginTop:5,background:ins.type==='profit'?'var(--profit)':ins.type==='warn'?'var(--warn)':'var(--t3)'}}/>
                  <span style={{fontSize:12,color:'var(--t2)',lineHeight:1.5}}>{ins.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(1,0.35)} style={card}>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--t1)',margin:'0 0 20px'}}>Alertas do dono</h3>
            {alerts.length===0 ? (
              <div style={{padding:'24px 0',textAlign:'center'}}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round" style={{margin:'0 auto 8px',display:'block'}}><polyline points="20 6 9 17 4 12"/></svg>
                <p style={{fontSize:12,color:'var(--t3)'}}>Nenhum alerta</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {alerts.map((al,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',borderRadius:10,background:al.type==='loss'?'rgba(239,68,68,0.04)':'rgba(245,158,11,0.04)',border:`1px solid ${al.type==='loss'?'rgba(239,68,68,0.08)':'rgba(245,158,11,0.08)'}`}}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={al.type==='loss'?'var(--loss)':'var(--warn)'} strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{fontSize:12,color:al.type==='loss'?'var(--loss)':'var(--warn)',lineHeight:1.5}}>{al.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{marginTop:20,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.04)'}}>
              <p style={{fontSize:10,color:'var(--t4)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>Proximos focos</p>
              {[
                alerts.length>0?'Resolver alertas pendentes':null,
                kpis.cancelledSubs>0?'Investigar cancelamentos':null,
                convRate<30?'Melhorar conversao para assinatura':null,
                funnel.withMeta<funnel.registered*0.5?'Incentivar criacao de primeira meta':null,
              ].filter(Boolean).slice(0,3).map((action,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
                  <div style={{width:4,height:4,borderRadius:'50%',background:'var(--brand-bright)',flexShrink:0}}/>
                  <span style={{fontSize:12,color:'var(--t2)'}}>{action}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ═══ BLOCO 6 — TOP CLIENTES ═══ */}
        <motion.div {...fadeUp(0,0.4)} style={{...card,marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--t1)',margin:0}}>Clientes</h3>
            <span style={{fontSize:11,color:'var(--t4)'}}>{adminStats.length} total</span>
          </div>

          {/* Top 3 cards */}
          <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
            {adminStats.slice(0,3).map((a,i)=>(
              <div key={a.id} style={{padding:'16px 18px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:28,height:28,borderRadius:7,background:'var(--raised)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--t2)'}}>{a.email[0].toUpperCase()}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:12,fontWeight:600,color:'var(--t1)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.email}</p>
                  </div>
                  <span style={{fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:4,background:a.hasActiveSub?'var(--profit-dim)':'var(--loss-dim)',color:a.hasActiveSub?'var(--profit)':'var(--loss)',border:`1px solid ${a.hasActiveSub?'var(--profit-border)':'var(--loss-border)'}`}}>
                    {a.hasActiveSub?'Ativo':'Inativo'}
                  </span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div><p style={{fontSize:9,color:'var(--t4)',margin:'0 0 2px'}}>Pago</p><p style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:700,color:'var(--profit)',margin:0}}>R$ {fmt(a.totalPaid)}</p></div>
                  <div style={{textAlign:'center'}}><p style={{fontSize:9,color:'var(--t4)',margin:'0 0 2px'}}>Ops</p><p style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:700,color:'var(--t1)',margin:0}}>{a.operators}</p></div>
                  <div style={{textAlign:'right'}}><p style={{fontSize:9,color:'var(--t4)',margin:'0 0 2px'}}>Metas</p><p style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:700,color:'var(--t1)',margin:0}}>{a.metas}</p></div>
                </div>
              </div>
            ))}
          </div>

          {/* Full table */}
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Email','Ops','Metas','Fechadas','Pago','Status','Ultimo uso'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',color:'var(--t4)',fontWeight:600,fontSize:10,letterSpacing:'0.04em',textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminStats.map(a=>(
                  <tr key={a.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td style={{padding:'10px 12px',color:'var(--t1)',fontWeight:500,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.email}</td>
                    <td style={{padding:'10px 12px',fontFamily:'var(--mono)',color:'var(--t2)'}}>{a.operators}</td>
                    <td style={{padding:'10px 12px',fontFamily:'var(--mono)',color:'var(--t2)'}}>{a.metas}</td>
                    <td style={{padding:'10px 12px',fontFamily:'var(--mono)',color:'var(--t2)'}}>{a.fechadas}</td>
                    <td style={{padding:'10px 12px',fontFamily:'var(--mono)',fontWeight:700,color:'var(--t1)'}}>R$ {fmt(a.totalPaid)}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:5,background:a.hasActiveSub?'var(--profit-dim)':'var(--loss-dim)',color:a.hasActiveSub?'var(--profit)':'var(--loss)',border:`1px solid ${a.hasActiveSub?'var(--profit-border)':'var(--loss-border)'}`}}>
                        {a.hasActiveSub?'Ativo':'Inativo'}
                      </span>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:11,color:a.daysSinceActivity>7?'var(--loss)':a.daysSinceActivity>3?'var(--warn)':'var(--t3)'}}>
                      {(()=>{
                        if(!a.lastActivity) return 'Nunca'
                        const diff=Date.now()-new Date(a.lastActivity).getTime()
                        const min=Math.floor(diff/60000)
                        if(min<1) return 'Agora'
                        if(min<60) return `${min}min`
                        const hrs=Math.floor(min/60)
                        if(hrs<24) return `${hrs}h`
                        return `${Math.floor(hrs/24)}d`
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </main>
  )
}

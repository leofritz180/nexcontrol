'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'

const OWNER = 'leofritz180@gmail.com'
const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtInt = v => Number(v||0).toLocaleString('pt-BR')
const ease = [0.33,1,0.68,1]

export default function OwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [email, setEmail] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u || u.email !== OWNER) { router.push('/admin'); return }
      setEmail(u.email)
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
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--base)' }}>
      <div className="spinner" style={{ width:24, height:24, borderTopColor:'var(--t1)' }}/>
    </main>
  )

  if (!data) return null
  const { kpis, funnel, activity, adminStats, alerts, insights } = data

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'40px 28px 80px' }}>

        {/* Header */}
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease}}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:40 }}>
          <div>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:4, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Owner dashboard</p>
            <h1 style={{ fontSize:28, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.03em' }}>NexControl SaaS</h1>
          </div>
          <button onClick={() => router.push('/admin')} style={{ fontSize:12, fontWeight:600, padding:'7px 16px', borderRadius:8, cursor:'pointer', border:'1px solid var(--b2)', background:'transparent', color:'var(--t3)' }}>
            Voltar ao admin
          </button>
        </motion.div>

        {/* KPIs — 2 rows of 4 */}
        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
          {[
            { label:'MRR', value:`R$ ${fmt(kpis.mrr)}`, color:'var(--profit)' },
            { label:'Receita total', value:`R$ ${fmt(kpis.totalRevenue)}`, color:'var(--t1)' },
            { label:'Clientes (admins)', value:fmtInt(kpis.totalAdmins), color:'var(--t1)' },
            { label:'Operadores', value:fmtInt(kpis.totalOperators), color:'var(--t1)' },
          ].map((k,i) => (
            <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3,delay:i*0.05,ease}}
              style={{ padding:'22px 26px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize:10, color:'var(--t3)', marginBottom:10 }}>{k.label}</p>
              <p style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:k.color, margin:0, lineHeight:1 }}>{k.value}</p>
            </motion.div>
          ))}
        </div>
        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
          {[
            { label:'Assinaturas ativas', value:fmtInt(kpis.activeSubs), color:'var(--profit)' },
            { label:'Canceladas', value:fmtInt(kpis.cancelledSubs), color:'var(--loss)' },
            { label:'Novos (7d)', value:`+${kpis.new7}`, color:'var(--profit)' },
            { label:'Novos (30d)', value:`+${kpis.new30}`, color:'var(--t1)' },
          ].map((k,i) => (
            <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3,delay:0.2+i*0.05,ease}}
              style={{ padding:'22px 26px', borderRadius:14, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize:10, color:'var(--t3)', marginBottom:10 }}>{k.label}</p>
              <p style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:k.color, margin:0, lineHeight:1 }}>{k.value}</p>
            </motion.div>
          ))}
        </div>

        {/* SaaS Metrics + Funnel */}
        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>

          {/* SaaS metrics */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.3,ease}}
            style={{ padding:'28px', borderRadius:16, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:'0 0 20px' }}>Metricas SaaS</h3>
            {[
              { l:'Ticket medio', v:`R$ ${fmt(kpis.avgTicket)}` },
              { l:'ARPU (receita/admin)', v:`R$ ${fmt(kpis.arpu)}` },
              { l:'Churn rate', v:`${kpis.churnRate}%`, c:kpis.churnRate>10?'var(--loss)':'var(--t1)' },
              { l:'LTV estimado', v:`R$ ${fmt(kpis.ltv)}` },
              { l:'Total metas', v:fmtInt(kpis.totalMetas) },
              { l:'Total remessas', v:fmtInt(kpis.totalRemessas) },
            ].map(({l,v,c},i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<5?'1px solid rgba(255,255,255,0.04)':'none' }}>
                <span style={{ fontSize:12, color:'var(--t3)' }}>{l}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:15, fontWeight:700, color:c||'var(--t1)' }}>{v}</span>
              </div>
            ))}
          </motion.div>

          {/* Funnel */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.35,ease}}
            style={{ padding:'28px', borderRadius:16, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:'0 0 20px' }}>Funil de ativacao</h3>
            {[
              { l:'Cadastrados', v:funnel.registered, pct:100 },
              { l:'Criaram meta', v:funnel.withMeta, pct:funnel.registered>0?Math.round(funnel.withMeta/funnel.registered*100):0 },
              { l:'Lancaram remessa', v:funnel.withRemessa, pct:funnel.registered>0?Math.round(funnel.withRemessa/funnel.registered*100):0 },
              { l:'Assinaram', v:funnel.withSub, pct:funnel.registered>0?Math.round(funnel.withSub/funnel.registered*100):0 },
            ].map(({l,v,pct},i) => (
              <div key={i} style={{ marginBottom:i<3?16:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:'var(--t2)' }}>{l}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--t1)' }}>{v} <span style={{ color:'var(--t3)', fontWeight:500 }}>({pct}%)</span></span>
                </div>
                <div style={{ height:4, background:'rgba(255,255,255,0.04)', borderRadius:99 }}>
                  <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:pct>=60?'var(--profit)':pct>=30?'var(--warn)':'var(--loss)', transition:'width 0.5s ease' }}/>
                </div>
              </div>
            ))}

            <div style={{ marginTop:24, padding:'16px', borderRadius:10, background:'rgba(255,255,255,0.02)' }}>
              <p style={{ fontSize:10, color:'var(--t4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Engajamento</p>
              <div style={{ display:'flex', gap:20 }}>
                <div><p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{activity.activeToday}</p><p style={{ fontSize:10, color:'var(--t3)' }}>Hoje</p></div>
                <div><p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{activity.active7}</p><p style={{ fontSize:10, color:'var(--t3)' }}>7 dias</p></div>
                <div><p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{activity.active30}</p><p style={{ fontSize:10, color:'var(--t3)' }}>30 dias</p></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Insights + Alerts */}
        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.4,ease}}
            style={{ padding:'28px', borderRadius:16, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:'0 0 20px' }}>Insights</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {insights.map((ins,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.02)' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background:ins.type==='profit'?'var(--profit)':ins.type==='warn'?'var(--warn)':'var(--t3)' }}/>
                  <span style={{ fontSize:12, color:'var(--t2)', lineHeight:1.4 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.45,ease}}
            style={{ padding:'28px', borderRadius:16, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:'0 0 20px' }}>Alertas</h3>
            {alerts.length === 0 ? (
              <div style={{ padding:'20px 0', textAlign:'center' }}>
                <p style={{ fontSize:12, color:'var(--t3)' }}>Nenhum alerta</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {alerts.map((al,i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10,
                    background:al.type==='loss'?'rgba(239,68,68,0.05)':'rgba(245,158,11,0.05)',
                    border:`1px solid ${al.type==='loss'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)'}`,
                  }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={al.type==='loss'?'var(--loss)':'var(--warn)'} strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span style={{ fontSize:12, color:al.type==='loss'?'var(--loss)':'var(--warn)', lineHeight:1.4 }}>{al.text}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Admin ranking */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.5,ease}}
          style={{ padding:'28px', borderRadius:16, background:'linear-gradient(145deg, #0c1424, #080e1a)', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:'0 0 20px' }}>Clientes (admins)</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  {['Email','Ops','Metas','Fechadas','Remessas','Pago','Status','Ultimo uso'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'var(--t3)', fontWeight:600, fontSize:10, letterSpacing:'0.04em', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adminStats.map((a,i) => (
                  <tr key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding:'10px 12px', color:'var(--t1)', fontWeight:500 }}>{a.email}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', color:'var(--t2)' }}>{a.operators}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', color:'var(--t2)' }}>{a.metas}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', color:'var(--t2)' }}>{a.fechadas}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', color:'var(--t2)' }}>{a.remessas}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', fontWeight:700, color:'var(--t1)' }}>R$ {fmt(a.totalPaid)}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{
                        fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:5,
                        background: a.hasActiveSub ? 'var(--profit-dim)' : 'var(--loss-dim)',
                        color: a.hasActiveSub ? 'var(--profit)' : 'var(--loss)',
                        border: `1px solid ${a.hasActiveSub ? 'var(--profit-border)' : 'var(--loss-border)'}`,
                      }}>
                        {a.hasActiveSub ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 12px', fontSize:11, color: a.daysSinceActivity > 7 ? 'var(--loss)' : a.daysSinceActivity > 3 ? 'var(--warn)' : 'var(--t3)' }}>
                      {(()=>{
                        if (!a.lastActivity) return 'Nunca'
                        const diff = Date.now() - new Date(a.lastActivity).getTime()
                        const min = Math.floor(diff/60000)
                        if (min < 1) return 'Agora'
                        if (min < 60) return `${min}min atras`
                        const hrs = Math.floor(min/60)
                        if (hrs < 24) return `${hrs}h atras`
                        const days = Math.floor(hrs/24)
                        return `${days}d atras`
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

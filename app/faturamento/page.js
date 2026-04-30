'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { generateInsights, getHealthStatus } from '../../lib/insights'
import { ProLockedCard } from '../../components/pro/ProGate'
import { DEMO_METAS, DEMO_REMESSAS, DEMO_OPERATORS, DEMO_GLOBAL, DEMO_BANNER_TEXT, shouldShowDemo } from '../../lib/demo-data'
import dynamic from 'next/dynamic'
const ProfitShowcase = dynamic(() => import('../../components/ProfitShowcase'), { ssr: false })
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Op'

/* ─── CountUp ─── */
function CountUp({ value, prefix='', duration=1200 }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(null)
  useEffect(()=>{
    const num = Math.abs(Number(value||0))
    const start = performance.now()
    const tick = now => {
      const p = Math.min((now-start)/duration,1)
      setDisplay(fmt(num*(1-Math.pow(1-p,3))))
      if(p<1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return ()=>cancelAnimationFrame(ref.current)
  },[value])
  return <span>{prefix}{display}</span>
}

/* ─── Hero Card ─── */
function HeroStat({ label, value, rgb, prefix='R$ ', sub, big }) {
  const [h,setH]=useState(false)
  return (
    <div className={`card ${big?'':'a1'}`}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        padding:big?'36px 32px':'24px',
        background:`linear-gradient(145deg, rgba(${rgb},0.14), rgba(${rgb},0.03) 50%, var(--surface) 80%)`,
        borderColor:`rgba(${rgb},0.2)`,
        boxShadow:h?`0 0 60px rgba(${rgb},0.18), 0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`:`0 0 20px rgba(${rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform:h?'translateY(-4px)':'none', transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)', position:'relative', overflow:'hidden',
      }}>
      <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, rgba(${rgb},${h?0.12:0.05}), transparent 70%)`, transition:'all 0.4s', pointerEvents:'none' }}/>
      <div style={{ position:'relative', zIndex:1 }}>
        <p className="t-label" style={{ marginBottom:big?14:10 }}>{label}</p>
        <p className="t-num" style={{ fontSize:big?42:28, fontWeight:800, color:`rgb(${rgb})`, lineHeight:1, letterSpacing:'-0.03em' }}>
          <CountUp value={value} prefix={prefix}/>
        </p>
        {sub && <p style={{ fontSize:12, color:'var(--t3)', marginTop:big?12:8 }}>{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Chart Tooltip ─── */
function ChartTooltip({ active, payload, label }) {
  if(!active||!payload?.length) return null
  return (
    <div style={{ background:'var(--raised)', border:'1px solid var(--b2)', borderRadius:12, padding:'12px 16px', boxShadow:'0 12px 40px rgba(0,0,0,0.5)' }}>
      <p style={{ fontSize:11, color:'var(--t3)', marginBottom:6 }}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{ fontSize:13, fontWeight:700, color:p.color, fontFamily:'var(--mono)' }}>{p.name}: R$ {fmt(p.value)}</p>
      ))}
    </div>
  )
}

/* ─── Filters ─── */
function Filters({ operators, redes, filters, setFilters }) {
  return (
    <div className="card a2" style={{ padding:'18px 22px', marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <span className="t-label" style={{ fontSize:11 }}>Filtros</span>
        </div>
        <input type="date" className="input" value={filters.dateFrom} onChange={e=>setFilters(f=>({...f,dateFrom:e.target.value}))} style={{ width:150, padding:'8px 12px', fontSize:12 }}/>
        <input type="date" className="input" value={filters.dateTo} onChange={e=>setFilters(f=>({...f,dateTo:e.target.value}))} style={{ width:150, padding:'8px 12px', fontSize:12 }}/>
        <select className="input" value={filters.operador} onChange={e=>setFilters(f=>({...f,operador:e.target.value}))} style={{ width:160, padding:'8px 12px', fontSize:12 }}>
          <option value="">Todos operadores</option>
          {operators.map(o=><option key={o.id} value={o.id}>{getName(o)}</option>)}
        </select>
        <select className="input" value={filters.rede} onChange={e=>setFilters(f=>({...f,rede:e.target.value}))} style={{ width:140, padding:'8px 12px', fontSize:12 }}>
          <option value="">Todas redes</option>
          {redes.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input" value={filters.tipo} onChange={e=>setFilters(f=>({...f,tipo:e.target.value}))} style={{ width:140, padding:'8px 12px', fontSize:12 }}>
          <option value="">Lucro + Prejuizo</option>
          <option value="lucro">Somente lucro</option>
          <option value="prejuizo">Somente prejuizo</option>
        </select>
        {(filters.dateFrom||filters.dateTo||filters.operador||filters.rede||filters.tipo) && (
          <button onClick={()=>setFilters({dateFrom:'',dateTo:'',operador:'',rede:'',tipo:''})} className="btn btn-ghost btn-sm">Limpar</button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════ MAIN ═══════════════════════════ */
export default function FaturamentoPage() {
  const router = useRouter()
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [operators,setOperators]=useState([])
  const [metas,setMetas]=useState([])
  const [remessas,setRemessas]=useState([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState('overview')
  const [chartPeriod,setChartPeriod]=useState('day')
  const [filters,setFilters]=useState({dateFrom:'',dateTo:'',operador:'',rede:'',tipo:''})
  const [editGoal,setEditGoal]=useState(false)
  const [goalInput,setGoalInput]=useState('')
  const [savingGoal,setSavingGoal]=useState(false)
  const [showShowcase,setShowShowcase]=useState(false)
  const [subData,setSubData]=useState(null)
  const [demoMode,setDemoMode]=useState(false)
  const [costs,setCosts]=useState([])

  useEffect(()=>{ checkAndLoad() },[])

  /* ── Demo mode: inject demo data when no real metas exist ── */
  useEffect(()=>{
    if(!loading && shouldShowDemo(metas) && !demoMode) {
      setMetas(DEMO_METAS)
      setRemessas(DEMO_REMESSAS)
      setOperators(DEMO_OPERATORS)
      setDemoMode(true)
    }
  },[loading, metas, demoMode])

  const isPro = subData?.status === 'active' && (!subData.expires_at || new Date(subData.expires_at) > new Date())

  async function checkAndLoad() {
    const {data:s}=await supabase.auth.getSession()
    const u=s?.session?.user
    if(!u){router.push('/login');return}
    setUser(u)
    const {data:p}=await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle()
    if(!p||p.role!=='admin'){router.push('/operator');return}
    setProfile(p); loadAll(p.tenant_id)
  }

  async function loadAll(tid) {
    setLoading(true)
    setDemoMode(false)
    const [{data:ops},{data:ms},{data:rs},{data:subRow},{data:costsData}]=await Promise.all([
      supabase.from('profiles').select('*').eq('role','operator').order('created_at',{ascending:false}),
      supabase.from('metas').select('*').order('created_at',{ascending:false}),
      supabase.from('remessas').select('*').order('created_at',{ascending:false}),
      supabase.from('subscriptions').select('*').eq('tenant_id',tid||profile?.tenant_id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('costs').select('amount,date').eq('tenant_id',tid||profile?.tenant_id),
    ])
    const activeMetas = (ms||[]).filter(m=>!m.deleted_at)
    const activeMetaIds = new Set(activeMetas.map(m=>m.id))
    setOperators(ops||[]); setMetas(activeMetas); setRemessas((rs||[]).filter(r=>activeMetaIds.has(r.meta_id)))
    setCosts(costsData||[])
    if(subRow) setSubData(subRow)
    setLoading(false)
  }

  async function saveGoal() {
    if(!goalInput||Number(goalInput)<=0) return
    setSavingGoal(true)
    await supabase.from('profiles').update({meta_global:Number(goalInput)}).eq('id',user.id)
    setProfile(p=>({...p,meta_global:Number(goalInput)}))
    setSavingGoal(false)
    setEditGoal(false)
  }

  /* ── Redes list ── */
  const redesList = useMemo(()=>[...new Set(metas.map(m=>m.rede).filter(Boolean))].sort(),[metas])

  /* ── Filtered remessas ── */
  const fRem = useMemo(()=>{
    let list = remessas
    if(filters.dateFrom) list=list.filter(r=>new Date(r.created_at)>=new Date(filters.dateFrom))
    if(filters.dateTo) { const d=new Date(filters.dateTo); d.setDate(d.getDate()+1); list=list.filter(r=>new Date(r.created_at)<d) }
    if(filters.operador) { const ids=new Set(metas.filter(m=>m.operator_id===filters.operador).map(m=>m.id)); list=list.filter(r=>ids.has(r.meta_id)) }
    if(filters.rede) { const ids=new Set(metas.filter(m=>m.rede===filters.rede).map(m=>m.id)); list=list.filter(r=>ids.has(r.meta_id)) }
    if(filters.tipo==='lucro') list=list.filter(r=>Number(r.resultado||0)>=0)
    if(filters.tipo==='prejuizo') list=list.filter(r=>Number(r.resultado||0)<0)
    return list
  },[remessas,metas,filters])

  /* ── Global stats ── */
  const stats = useMemo(()=>{
    // Remessas brutas
    const lucro=fRem.reduce((a,r)=>a+Number(r.lucro||0),0)
    const prej=fRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
    const dep=fRem.reduce((a,r)=>a+Number(r.deposito||0),0)
    const saq=fRem.reduce((a,r)=>a+Number(r.saque||0),0)
    const liq=lucro-prej
    const roi=dep>0?((liq/dep)*100):0
    const pos=fRem.filter(r=>Number(r.resultado||0)>=0).length
    const taxa=fRem.length>0?Math.round((pos/fRem.length)*100):0
    // Lucro final das metas fechadas (valor real pos salario/custo)
    const fechadas=metas.filter(m=>m.status_fechamento==='fechada')
    const lucroFinalBruto=fechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const custosTotal=costs.reduce((a,c)=>a+Number(c.amount||0),0)
    const lucroFinal=Number((lucroFinalBruto-custosTotal).toFixed(2))
    return {lucro:Number(lucro.toFixed(2)),prej:Number(prej.toFixed(2)),liq:Number(liq.toFixed(2)),dep:Number(dep.toFixed(2)),saq:Number(saq.toFixed(2)),roi,taxa,total:fRem.length,pos,lucroFinal,lucroFinalBruto:Number(lucroFinalBruto.toFixed(2)),custosTotal:Number(custosTotal.toFixed(2)),fechadas:fechadas.length}
  },[fRem,metas,costs])

  /* ── Chart data ── */
  const chartData = useMemo(()=>{
    const map = {}
    fRem.forEach(r=>{
      const d = new Date(r.created_at)
      let key
      if(chartPeriod==='day') key=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
      else if(chartPeriod==='week') { const w=new Date(d); w.setDate(w.getDate()-w.getDay()); key=`Sem ${w.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}` }
      else key=d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
      if(!map[key]) map[key]={name:key,lucro:0,prejuizo:0,liquido:0}
      map[key].lucro+=Number(r.lucro||0)
      map[key].prejuizo+=Number(r.prejuizo||0)
      map[key].liquido+=Number(r.lucro||0)-Number(r.prejuizo||0)
    })
    return Object.values(map)
  },[fRem,chartPeriod])

  /* ── Operators ranking ── */
  const opRanking = useMemo(()=>
    operators.map(op=>{
      const opMetas=metas.filter(m=>m.operator_id===op.id)
      const ids=new Set(opMetas.map(m=>m.id))
      const opRem=fRem.filter(r=>ids.has(r.meta_id))
      const lucro=opRem.reduce((a,r)=>a+Number(r.lucro||0),0)
      const prej=opRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
      const pos=opRem.filter(r=>Number(r.resultado||0)>=0).length
      const taxa=opRem.length>0?Math.round((pos/opRem.length)*100):0
      return {...op,lucro,prej,liq:lucro-prej,nMetas:opMetas.length,nRem:opRem.length,taxa}
    }).sort((a,b)=>b.liq-a.liq)
  ,[operators,metas,fRem])

  /* ── Redes ranking ── */
  const redeRanking = useMemo(()=>{
    const map={}
    metas.forEach(m=>{
      if(!m.rede) return
      if(!map[m.rede]) map[m.rede]={rede:m.rede,lucro:0,prej:0,liq:0,nMetas:0,nRem:0,pos:0,total:0}
      map[m.rede].nMetas++
    })
    fRem.forEach(r=>{
      const m=metas.find(x=>x.id===r.meta_id)
      if(!m?.rede||!map[m.rede]) return
      const e=map[m.rede]
      e.lucro+=Number(r.lucro||0); e.prej+=Number(r.prejuizo||0); e.nRem++; e.total++
      if(Number(r.resultado||0)>=0) e.pos++
    })
    Object.values(map).forEach(e=>{e.liq=e.lucro-e.prej; e.taxa=e.total>0?Math.round((e.pos/e.total)*100):0})
    return Object.values(map).sort((a,b)=>b.liq-a.liq)
  },[metas,fRem])

  /* ── Predictions (based on closed metas lucro_final) ── */
  const predictions = useMemo(()=>{
    const fechadas = metas.filter(m=>m.status_fechamento==='fechada'&&m.fechada_em)
    if(fechadas.length===0) return {trend:'neutral',lucroFinalTotal:0,mediaPorMeta:0,metasFechadas:0,liqLast:0,liqPrev:0,pctChange:0,dailyAvg:0}
    const now = new Date()
    const d7 = new Date(now); d7.setDate(d7.getDate()-7)
    const d14 = new Date(now); d14.setDate(d14.getDate()-14)
    const d30 = new Date(now); d30.setDate(d30.getDate()-30)
    const last7 = fechadas.filter(m=>new Date(m.fechada_em)>=d7)
    const prev7 = fechadas.filter(m=>{const d=new Date(m.fechada_em); return d>=d14&&d<d7})
    const liqLast = last7.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const liqPrev = prev7.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const trend = liqLast>liqPrev?'up':liqLast<liqPrev?'down':'neutral'
    const lucroFinalTotal = fechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const mediaPorMeta = fechadas.length > 0 ? lucroFinalTotal / fechadas.length : 0

    // Media por DIA ATIVO (dias em que houve fechamento) nos ultimos 30 dias
    // Usar timezone BR para agrupar — evita divergencia entre UTC e data local
    const brKey = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    const recentFechadas = fechadas.filter(m => new Date(m.fechada_em) >= d30)
    const byDay = {}
    recentFechadas.forEach(m => {
      const k = brKey(m.fechada_em)
      byDay[k] = (byDay[k] || 0) + Number(m.lucro_final || 0)
    })
    const activeDays = Object.keys(byDay).length
    const sum30 = Object.values(byDay).reduce((a, v) => a + v, 0)
    // Fallback: se nao ha dados em 30d, usa media total por dia ativo historico
    let dailyAvg = 0
    if (activeDays > 0) dailyAvg = sum30 / activeDays
    else {
      const allByDay = {}
      fechadas.forEach(m => { const k = brKey(m.fechada_em); allByDay[k] = (allByDay[k] || 0) + Number(m.lucro_final || 0) })
      const n = Object.keys(allByDay).length
      dailyAvg = n > 0 ? Object.values(allByDay).reduce((a, v) => a + v, 0) / n : 0
    }
    // Leve viés otimista quando tendencia esta subindo (projeta melhoria recente)
    if (trend === 'up' && dailyAvg > 0) dailyAvg *= 1.15

    return {trend,lucroFinalTotal,mediaPorMeta,metasFechadas:fechadas.length,liqLast,liqPrev,pctChange:liqPrev!==0?Math.round(((liqLast-liqPrev)/Math.abs(liqPrev))*100):0,dailyAvg,activeDays}
  },[metas])

  /* ── Goal progress ── */
  const goalData = useMemo(()=>{
    const metasFechadas=metas.filter(m=>m.status_fechamento==='fechada')
    const lucroFinalTotal=metasFechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const target=Number(profile?.meta_global)||100000
    const pct=target>0?Math.min(100,Math.round((lucroFinalTotal/target)*100)):0
    const falta=Math.max(0,target-lucroFinalTotal)
    // Use predictions daily avg (last 14 days) for dias restantes
    const diasRestantes=predictions.dailyAvg>0?Math.ceil(falta/predictions.dailyAvg):999
    return {lucroFinalTotal,target,pct,falta,diasRestantes}
  },[metas,predictions,profile])

  const medals=['#FFD700','#C0C0C0','#CD7F32']

  if(loading) return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
        <div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/>
      </div>
      </AppLayout>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      {showShowcase && <ProfitShowcase stats={stats} goalData={goalData} operators={operators} metas={metas} onClose={()=>setShowShowcase(false)}/>}
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>

      <div style={{maxWidth:1380,margin:'0 auto',padding:'32px 28px'}}>
        {/* Header — clean */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:28}}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:600, color:'var(--t1)', letterSpacing:'-0.03em', margin:'0 0 6px' }}>Faturamento</h1>
            <p style={{ fontSize:13, color:'var(--t3)', margin:0, fontWeight:400 }}>Painel financeiro</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowShowcase(true)}
              style={{ padding:'8px 14px', fontSize:12, fontWeight:500, fontFamily:'inherit', cursor:'pointer',
                background:'transparent', border:'1px solid var(--b1)', borderRadius:8,
                color:'var(--t2)', display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--b2)';e.currentTarget.style.color='var(--t1)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b1)';e.currentTarget.style.color='var(--t2)'}}>
              Apresentacao
            </button>
            <button onClick={loadAll}
              style={{ padding:'8px 14px', fontSize:12, fontWeight:500, fontFamily:'inherit', cursor:'pointer',
                background:'transparent', border:'1px solid var(--b1)', borderRadius:8,
                color:'var(--t3)', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--b2)';e.currentTarget.style.color='var(--t1)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b1)';e.currentTarget.style.color='var(--t3)'}}>
              Atualizar
            </button>
          </div>
        </div>

        {/* Demo Banner */}
        {demoMode && (
          <div className="demo-banner" style={{
            marginBottom:20, padding:'14px 20px', borderRadius:14,
            background:'linear-gradient(135deg, rgba(229,57,53,0.08), rgba(229,57,53,0.03))',
            border:'1px solid rgba(229,57,53,0.15)',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <span className="demo-banner-dot" style={{width:8,height:8,borderRadius:'50%',background:'#e53935',flexShrink:0}}/>
            <p style={{fontSize:13,color:'var(--t2)',fontWeight:500,margin:0,lineHeight:1.5}}>{DEMO_BANNER_TEXT}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="a2 tabs-scroll" style={{display:'flex',gap:4,marginBottom:24,background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:12,padding:5,width:'fit-content'}}>
          {[['overview','Visao Geral'],['chart','Evolucao'],['history','Historico']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{fontFamily:'Inter,sans-serif',fontSize:12,fontWeight:600,padding:'8px 18px',borderRadius:9,cursor:'pointer',transition:'all 0.15s',background:tab===k?'var(--raised)':'transparent',border:tab===k?'1px solid var(--b2)':'1px solid transparent',color:tab===k?'var(--t1)':'var(--t3)',boxShadow:tab===k?'0 2px 8px rgba(0,0,0,0.3)':''}}>
              {l}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Filters operators={operators} redes={redesList} filters={filters} setFilters={setFilters}/>

        {/* ═══ OVERVIEW ═══ */}
        {tab==='overview' && (<div key="ov" className="tab-content">

          {/* ── HERO + KPIs side by side ── */}
          <div className="g-side" style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:16,marginBottom:24}}>

            {/* Hero financeiro — cinematografico */}
            <div style={{
              position:'relative', overflow:'hidden', borderRadius:18, padding:'36px 36px 32px',
              background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
              backdropFilter:'blur(24px) saturate(160%)', WebkitBackdropFilter:'blur(24px) saturate(160%)',
              border:`1px solid ${stats.lucroFinal>=0?'rgba(209,250,229,0.18)':'rgba(239,68,68,0.18)'}`,
              boxShadow:`0 10px 40px rgba(0,0,0,0.5), 0 0 60px ${stats.lucroFinal>=0?'rgba(209,250,229,0.08)':'rgba(239,68,68,0.08)'}, inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}>
              <div style={{position:'absolute',top:'5%',left:'0%',width:500,height:380,borderRadius:'50%',background:`radial-gradient(circle, ${stats.lucroFinal>=0?'rgba(209,250,229,0.13)':'rgba(239,68,68,0.13)'}, transparent 60%)`,filter:'blur(60px)',pointerEvents:'none'}}/>
              <div style={{position:'absolute',top:0,left:'12%',right:'12%',height:1,background:`linear-gradient(90deg, transparent, ${stats.lucroFinal>=0?'rgba(209,250,229,0.5)':'rgba(239,68,68,0.5)'}, transparent)`,pointerEvents:'none'}}/>

              {/* Mini sparkline de fundo (sutil) */}
              <svg style={{ position:'absolute', bottom:0, left:0, right:0, pointerEvents:'none', opacity:0.22 }} viewBox="0 0 400 80" preserveAspectRatio="none" width="100%" height="80">
                <defs>
                  <linearGradient id="fatHeroArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={stats.lucroFinal>=0?'#D1FAE5':'#EF4444'} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={stats.lucroFinal>=0?'#D1FAE5':'#EF4444'} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,60 L40,55 L80,48 L120,50 L160,40 L200,34 L240,38 L280,26 L320,20 L360,12 L400,6 L400,80 L0,80 Z" fill="url(#fatHeroArea)"/>
                <path d="M0,60 L40,55 L80,48 L120,50 L160,40 L200,34 L240,38 L280,26 L320,20 L360,12 L400,6" fill="none" stroke={stats.lucroFinal>=0?'#D1FAE5':'#EF4444'} strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.6"/>
              </svg>

              <div style={{position:'relative',zIndex:1}}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:3, height:12, borderRadius:2, background: stats.lucroFinal>=0?'#D1FAE5':'#EF4444', boxShadow:`0 0 10px ${stats.lucroFinal>=0?'rgba(209,250,229,0.7)':'rgba(239,68,68,0.7)'}` }}/>
                  <p style={{fontSize:10, color:'var(--t4)', fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', margin:0}}>
                    Receita consolidada
                  </p>
                </div>
                <p style={{fontSize:12,color:'var(--t3)',marginBottom:14,fontWeight:500}}>Lucro final da operacao — apos custos</p>

                <p style={{fontFamily:'var(--mono)',fontSize:56,fontWeight:900,lineHeight:1,letterSpacing:'-0.035em',margin:'0 0 10px',
                  color: stats.lucroFinal>=0 ? 'var(--profit)' : 'var(--loss)',
                  textShadow:`0 0 70px ${stats.lucroFinal>=0?'rgba(209,250,229,0.25)':'rgba(239,68,68,0.25)'}`,
                }}>
                  <CountUp value={stats.lucroFinal} prefix="R$ "/>
                </p>

                {predictions.pctChange!==0 ? (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:7,
                    background: predictions.pctChange>0?'rgba(209,250,229,0.1)':'rgba(239,68,68,0.1)',
                    border:`1px solid ${predictions.pctChange>0?'rgba(209,250,229,0.22)':'rgba(239,68,68,0.22)'}`,
                  }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={predictions.pctChange>0?'#D1FAE5':'#EF4444'} strokeWidth="2.5" strokeLinecap="round">
                      <polyline points={predictions.pctChange>0?"23 6 13.5 15.5 8.5 10.5 1 18":"1 18 10.5 8.5 15.5 13.5 23 6"}/>
                    </svg>
                    <span style={{fontSize:11, color:predictions.pctChange>0?'#D1FAE5':'#EF4444', fontWeight:800, letterSpacing:'0.02em'}}>
                      {predictions.pctChange>0?'+':''}{predictions.pctChange}% vs semana anterior
                    </span>
                  </div>
                ) : (
                  <p style={{ fontSize:11, color:'var(--t4)', margin:0, fontWeight:500, letterSpacing:'0.02em' }}>
                    Sem variacao significativa vs semana anterior
                  </p>
                )}

                <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:20,marginTop:22,paddingTop:18,borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                  <div>
                    <p style={{fontSize:9,color:'var(--t4)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700}}>Fechadas</p>
                    <p style={{fontFamily:'var(--mono)',fontSize:17,fontWeight:800,color:'var(--t1)',margin:0,letterSpacing:'-0.02em'}}>{stats.fechadas}</p>
                  </div>
                  <div style={{width:1,height:28,background:'rgba(255,255,255,0.06)'}}/>
                  <div>
                    <p style={{fontSize:9,color:'var(--t4)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700}}>Remessas</p>
                    <p style={{fontFamily:'var(--mono)',fontSize:17,fontWeight:800,color:'var(--t1)',margin:0,letterSpacing:'-0.02em'}}>{stats.total}</p>
                  </div>
                  <div style={{width:1,height:28,background:'rgba(255,255,255,0.06)'}}/>
                  <div>
                    <p style={{fontSize:9,color:'var(--t4)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:700}}>Operadores</p>
                    <p style={{fontFamily:'var(--mono)',fontSize:17,fontWeight:800,color:'var(--t1)',margin:0,letterSpacing:'-0.02em'}}>{operators.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — 4 KPI cards premium */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                {l:'Lucro bruto', sub:'Soma de lucros', v:`R$ ${fmt(stats.lucro)}`, accent:'#D1FAE5'},
                {l:'Total depositado', sub:'Volume em entradas', v:`R$ ${fmt(stats.dep)}`, accent:'rgba(255,255,255,0.78)'},
                {l:'Total sacado', sub:'Volume em saidas', v:`R$ ${fmt(stats.saq)}`, accent:'rgba(255,255,255,0.78)'},
                {l:'Taxa de acerto', sub:'Remessas positivas', v:`${stats.taxa}%`, accent:'rgba(255,255,255,0.78)'},
              ].map(({l,sub,v,accent},i)=>(
                <motion.div key={l}
                  initial={{opacity:0, x:14}} animate={{opacity:1, x:0}}
                  transition={{duration:0.3, delay:0.1+i*0.07}}
                  whileHover={{ y:-2, boxShadow:`0 14px 32px rgba(0,0,0,0.5), 0 0 24px ${accent}20`, transition:{duration:0.2} }}
                  style={{
                    position:'relative', overflow:'hidden',
                    flex:1, padding:'14px 20px 14px 24px', borderRadius:12,
                    background:'linear-gradient(145deg, rgba(14,22,38,0.7), rgba(8,14,26,0.7))',
                    backdropFilter:'blur(14px) saturate(150%)', WebkitBackdropFilter:'blur(14px) saturate(150%)',
                    border:`1px solid rgba(255,255,255,0.06)`,
                    boxShadow:'0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
                    transition:'all 0.25s ease',
                  }}>
                  <div style={{position:'absolute',left:0,top:'18%',bottom:'18%',width:2,borderRadius:'0 2px 2px 0', background:accent, boxShadow:`0 0 8px ${accent}`}}/>
                  <div>
                    <p style={{fontSize:10, color:'var(--t3)', margin:0, fontWeight:700, letterSpacing:'0.04em'}}>{l}</p>
                    <p style={{fontSize:9, color:'var(--t4)', margin:'2px 0 0', fontWeight:500}}>{sub}</p>
                  </div>
                  <span style={{fontFamily:'var(--mono)', fontSize:17, fontWeight:800, color:'#F1F5F9', letterSpacing:'-0.02em'}}>{v}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Predictions + Goal */}
          <div className="g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
            {/* Predictions — executivo */}
            <div className="card a3" style={{
              position:'relative', overflow:'hidden', padding:22,
              background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
              backdropFilter:'blur(20px) saturate(150%)', WebkitBackdropFilter:'blur(20px) saturate(150%)',
              border:'1px solid rgba(255,255,255,0.14)',
              boxShadow:'0 8px 28px rgba(0,0,0,0.4), 0 0 36px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', pointerEvents:'none' }}/>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
                <div style={{
                  width:36, height:36, borderRadius:10,
                  background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 16px rgba(255,255,255,0.18)',
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div style={{ flex:1 }}>
                  <h3 style={{fontSize:14, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.01em'}}>Inteligencia da operacao</h3>
                  <p style={{fontSize:10, color:'var(--t4)', margin:'2px 0 0', fontWeight:500}}>Analise sobre metas fechadas</p>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)' }}>
                  <motion.div
                    animate={{ boxShadow:['0 0 0 0 rgba(255,255,255,0.5)','0 0 0 4px rgba(255,255,255,0)','0 0 0 0 rgba(255,255,255,0)'] }}
                    transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                    style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.78)' }}
                  />
                  <span style={{fontSize:9, color:'rgba(255,255,255,0.78)', fontWeight:800, letterSpacing:'0.08em'}}>AO VIVO</span>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                <div style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:12,padding:'16px 14px'}}>
                  <p className="t-label" style={{marginBottom:8}}>Tendencia</p>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:28,height:28,borderRadius:8,background:predictions.trend==='up'?'var(--profit-dim)':predictions.trend==='down'?'var(--loss-dim)':'var(--brand-dim)',border:`1px solid ${predictions.trend==='up'?'var(--profit-border)':predictions.trend==='down'?'var(--loss-border)':'var(--brand-border)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={predictions.trend==='up'?'var(--profit)':predictions.trend==='down'?'var(--loss)':'var(--brand-bright)'} strokeWidth="3" strokeLinecap="round"><polyline points={predictions.trend==='down'?'6 9 12 15 18 9':'18 15 12 9 6 15'}/></svg>
                    </div>
                    <div>
                      <p style={{fontSize:14,fontWeight:700,color:predictions.trend==='up'?'var(--profit)':predictions.trend==='down'?'var(--loss)':'var(--t2)'}}>
                        {predictions.trend==='up'?'Subindo':predictions.trend==='down'?'Caindo':'Estavel'}
                      </p>
                      {predictions.pctChange!==0 && <p className="t-small">{predictions.pctChange>0?'+':''}{predictions.pctChange}% vs semana ant.</p>}
                    </div>
                  </div>
                </div>
                <div style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:12,padding:'16px 14px'}}>
                  <p className="t-label" style={{marginBottom:8}}>Lucro final real</p>
                  <p className="t-num" style={{fontSize:18,fontWeight:700,color:predictions.lucroFinalTotal>=0?'var(--profit)':'var(--loss)'}}>
                    {predictions.lucroFinalTotal>=0?'+':''}R$ {fmt(Math.abs(predictions.lucroFinalTotal))}
                  </p>
                  <p className="t-small">{predictions.metasFechadas} meta{predictions.metasFechadas!==1?'s':''} · Media: R$ {fmt(Math.abs(predictions.mediaPorMeta))}/meta</p>
                </div>
                <div style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:12,padding:'16px 14px'}}>
                  <p className="t-label" style={{marginBottom:8}}>Alerta</p>
                  {predictions.trend==='down' ? (
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <p style={{fontSize:12,fontWeight:600,color:'var(--loss)'}}>Queda detectada</p>
                    </div>
                  ) : predictions.trend==='up' ? (
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <p style={{fontSize:12,fontWeight:600,color:'var(--profit)'}}>Performance OK</p>
                    </div>
                  ) : (
                    <p style={{fontSize:12,color:'var(--t3)'}}>Sem alertas</p>
                  )}
                </div>
              </div>
            </div>

            {/* Goal — meta global premium */}
            <div className="card a4" style={{
              position:'relative', overflow:'hidden', padding:22,
              background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
              backdropFilter:'blur(20px) saturate(150%)', WebkitBackdropFilter:'blur(20px) saturate(150%)',
              border:`1px solid ${goalData.pct>=100?'rgba(209,250,229,0.25)':'rgba(209,250,229,0.14)'}`,
              boxShadow:`0 8px 28px rgba(0,0,0,0.4), 0 0 36px rgba(209,250,229,${goalData.pct>=100?'0.1':'0.04'}), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
              <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(209,250,229,0.45), transparent)', pointerEvents:'none' }}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18, flexWrap:'wrap', gap:10}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{
                    width:36, height:36, borderRadius:10,
                    background:'rgba(209,250,229,0.12)', border:'1px solid rgba(209,250,229,0.3)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 0 16px rgba(209,250,229,0.18)',
                  }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <div>
                    <h3 style={{fontSize:14, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.01em'}}>Meta global</h3>
                    <p style={{fontSize:10, color:'var(--t4)', margin:'2px 0 0', fontWeight:500, fontFamily:'var(--mono)'}}>Objetivo: R$ {fmt(goalData.target)}</p>
                  </div>
                </div>
                <motion.button
                  onClick={()=>{setEditGoal(!editGoal);setGoalInput(String(goalData.target))}}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  style={{
                    padding:'7px 14px', borderRadius:9, border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer',
                    fontSize:11, fontWeight:700, fontFamily:'inherit',
                    background:'rgba(255,255,255,0.03)', color:'var(--t2)',
                    display:'flex', alignItems:'center', gap:5, transition:'all 0.2s',
                  }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='rgba(209,250,229,0.08)'; e.currentTarget.style.color='#D1FAE5'; e.currentTarget.style.borderColor='rgba(209,250,229,0.22)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='var(--t2)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </motion.button>
              </div>

              {editGoal && (
                <div style={{background:'var(--raised)',border:'1px solid var(--brand-border)',borderRadius:12,padding:16,marginBottom:16,animation:'scale-in 0.2s cubic-bezier(0.4,0,0.2,1) both'}}>
                  <p className="t-label" style={{marginBottom:10}}>Definir meta de faturamento (R$)</p>
                  <div style={{display:'flex',gap:8}}>
                    <input className="input" type="number" min="1" step="1000" value={goalInput} onChange={e=>setGoalInput(e.target.value)} placeholder="Ex: 500000" style={{flex:1}}/>
                    <button onClick={saveGoal} disabled={savingGoal||!goalInput||Number(goalInput)<=0} className="btn btn-profit btn-sm">
                      {savingGoal?'Salvando...':'Salvar'}
                    </button>
                    <button onClick={()=>setEditGoal(false)} className="btn btn-ghost btn-sm">Cancelar</button>
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                    {[50000,100000,250000,500000,1000000].map(v=>(
                      <button key={v} onClick={()=>setGoalInput(String(v))} className="btn btn-ghost btn-sm" style={{fontSize:11,padding:'5px 10px'}}>
                        R$ {(v/1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:16}}>
                <p className="t-num" style={{fontSize:36,fontWeight:800,color:'var(--profit)'}}>{goalData.pct}%</p>
                <p className="t-small">concluido</p>
              </div>
              <div className="progress" style={{height:8,marginBottom:14}}>
                <div className="progress-bar" style={{width:`${goalData.pct}%`,background:'linear-gradient(90deg,var(--profit),#4ADE80)',boxShadow:'0 0 12px rgba(209,250,229,0.3)'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div style={{background:'var(--raised)',borderRadius:10,padding:'10px 12px',border:'1px solid var(--b1)'}}>
                  <p className="t-label" style={{fontSize:9,marginBottom:4}}>Atingido</p>
                  <p className="t-num" style={{fontSize:13,color:'var(--profit)'}}>R$ {fmt(goalData.lucroFinalTotal)}</p>
                </div>
                <div style={{background:'var(--raised)',borderRadius:10,padding:'10px 12px',border:'1px solid var(--b1)'}}>
                  <p className="t-label" style={{fontSize:9,marginBottom:4}}>Falta</p>
                  <p className="t-num" style={{fontSize:13,color:'var(--warn)'}}>R$ {fmt(goalData.falta)}</p>
                </div>
                <div style={{background:'var(--raised)',borderRadius:10,padding:'10px 12px',border:'1px solid var(--b1)'}}>
                  <p className="t-label" style={{fontSize:9,marginBottom:4}}>Previsao</p>
                  <p className="t-num" style={{fontSize:13,color:'var(--info)'}}>{goalData.diasRestantes<999?`~${goalData.diasRestantes} dias`:'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── INSIGHTS AUTOMÁTICOS ── */}
          {(()=>{
            const { insights, alerts } = generateInsights({ stats, predictions, goalData, metas, operators, remessas:fRem })
            const health = getHealthStatus(stats, predictions)
            return (
            <div className="g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
              {/* Health + Insights */}
              <div style={{
                padding:'28px 28px', borderRadius:16,
                background:'linear-gradient(145deg, #000000, #000000)',
                border:'1px solid rgba(255,255,255,0.05)',
                boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <h3 style={{fontSize:15,fontWeight:700,color:'var(--t1)',margin:0}}>Leitura da operacao</h3>
                  <span style={{
                    fontSize:10,fontWeight:700,padding:'4px 12px',borderRadius:6,
                    background: health.level==='good'||health.level==='growing'?'var(--profit-dim)':health.level==='attention'||health.level==='unstable'?'var(--warn-dim)':'var(--loss-dim)',
                    color: health.color,
                    border:`1px solid ${health.level==='good'||health.level==='growing'?'var(--profit-border)':health.level==='attention'||health.level==='unstable'?'var(--warn-border)':'var(--loss-border)'}`,
                  }}>
                    {health.label}
                  </span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {insights.map((ins,i)=>(
                    <div key={i} style={{
                      display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,
                      background:'rgba(255,255,255,0.02)',
                    }}>
                      <div style={{
                        width:6,height:6,borderRadius:'50%',flexShrink:0,
                        background: ins.type==='profit'?'var(--profit)':ins.type==='loss'?'var(--loss)':'var(--t3)',
                      }}/>
                      <span style={{fontSize:12,color:'var(--t2)',lineHeight:1.4}}>{ins.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div style={{
                padding:'28px 28px', borderRadius:16,
                background:'linear-gradient(145deg, #000000, #000000)',
                border:'1px solid rgba(255,255,255,0.05)',
                boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}>
                <h3 style={{fontSize:15,fontWeight:700,color:'var(--t1)',margin:'0 0 20px'}}>Alertas e atencao</h3>
                {alerts.length===0 ? (
                  <div style={{padding:'20px 0',textAlign:'center'}}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round" style={{margin:'0 auto 8px',display:'block'}}><polyline points="20 6 9 17 4 12"/></svg>
                    <p style={{fontSize:12,color:'var(--t3)'}}>Nenhum alerta no momento</p>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {alerts.map((al,i)=>(
                      <div key={i} style={{
                        display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,
                        background: al.type==='loss'?'rgba(239,68,68,0.05)':'rgba(255,255,255,0.05)',
                        border:`1px solid ${al.type==='loss'?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.1)'}`,
                      }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={al.type==='loss'?'var(--loss)':'var(--warn)'} strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}>
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span style={{fontSize:12,color:al.type==='loss'?'var(--loss)':'var(--warn)',lineHeight:1.4}}>{al.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projection */}
                {goalData.target>0 && goalData.pct<100 && (
                  <div style={{marginTop:20,padding:'14px 16px',borderRadius:10,background:'rgba(255,255,255,0.02)',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <p style={{fontSize:10,color:'var(--t4)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Projecao</p>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:12,color:'var(--t2)'}}>Meta global ({goalData.pct}%)</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:700,color:'var(--t1)'}}>
                        {goalData.diasRestantes<999?`~${goalData.diasRestantes} dias`:'N/A'}
                      </span>
                    </div>
                    <div style={{marginTop:8,height:4,background:'var(--raised)',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${goalData.pct}%`,borderRadius:99,background:'var(--profit)',transition:'width 0.5s ease'}}/>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )
          })()}

          {/* PRO locked — only show if NOT PRO */}
          {!isPro && <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}>
            <ProLockedCard title="Projecao de lucro" description="Veja quanto voce pode faturar nos proximos 30 dias mantendo o ritmo atual. Projecao automatica baseada nas suas metas fechadas." icon="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z">
              <div><div style={{height:14,width:'55%',background:'rgba(209,250,229,0.08)',borderRadius:3,marginBottom:5}}/><div style={{height:18,width:'40%',background:'rgba(209,250,229,0.06)',borderRadius:3}}/></div>
            </ProLockedCard>
            <ProLockedCard title="Comparativo de operadores" description="Compare a performance de cada operador lado a lado. Taxa de acerto, volume, lucro e velocidade em um so lugar." icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0">
              <div>{[1,2,3].map(i=>(<div key={i} style={{height:10,width:`${75-i*12}%`,background:'rgba(255,255,255,0.04)',borderRadius:3,marginBottom:4}}/>))}</div>
            </ProLockedCard>
            <ProLockedCard title="Heatmap de performance" description="Mapa visual mostrando os melhores dias e horarios da sua operacao. Identifique padroes e otimize seu tempo." icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z">
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>{Array.from({length:14}).map((_,i)=>(<div key={i} style={{width:10,height:10,borderRadius:2,background:'rgba(255,255,255,0.03)'}}/>))}</div>
            </ProLockedCard>
          </div>}

          {/* Mini chart + Quick stats */}
          <div className="g-side" style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
            <div className="card a5" style={{padding:24}}>
              <h3 className="t-h3" style={{fontSize:14,marginBottom:16}}>Evolucao recente</h3>
              <div style={{height:200}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.slice(-14)}>
                    <defs>
                      <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D1FAE5" stopOpacity={0.3}/><stop offset="100%" stopColor="#D1FAE5" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Area type="monotone" dataKey="liquido" name="Liquido" stroke="#D1FAE5" fill="url(#gProfit)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {l:'Operadores ativos',v:operators.length,c:'var(--info)',rgb:'56,182,255'},
                {l:'Total metas',v:metas.length,c:'var(--brand-bright)',rgb:'79,110,247'},
                {l:'Metas fechadas',v:metas.filter(m=>m.status_fechamento==='fechada').length,c:'var(--profit)',rgb:'5,217,140'},
                {l:'Redes ativas',v:redesList.length,c:'var(--warn)',rgb:'245,166,35'},
              ].map(({l,v,c,rgb},i)=>(
                <div key={l} className={`card a${i+3}`} style={{padding:'16px 20px',background:`linear-gradient(145deg, rgba(${rgb},0.08), var(--surface) 70%)`,borderColor:`rgba(${rgb},0.15)`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span className="t-body" style={{fontSize:12}}>{l}</span>
                    <span className="t-num" style={{fontSize:24,fontWeight:800,color:c}}>{v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {/* ═══ CHART ═══ */}
        {tab==='chart' && (
          <div key="ch" className="tab-content">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <h2 className="t-h2">Evolucao do faturamento</h2>
              <div style={{display:'flex',gap:4,background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:10,padding:4}}>
                {[['day','Diario'],['week','Semanal'],['month','Mensal']].map(([k,l])=>(
                  <button key={k} onClick={()=>setChartPeriod(k)} style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,padding:'6px 14px',borderRadius:7,cursor:'pointer',transition:'all 0.15s',border:'none',background:chartPeriod===k?'var(--raised)':'transparent',color:chartPeriod===k?'var(--t1)':'var(--t3)',boxShadow:chartPeriod===k?'0 2px 8px rgba(0,0,0,0.3)':''}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="card" style={{padding:28}}>
              <div style={{height:360}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D1FAE5" stopOpacity={0.25}/><stop offset="100%" stopColor="#D1FAE5" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.2}/><stop offset="100%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.78)" stopOpacity={0.25}/><stop offset="100%" stopColor="rgba(255,255,255,0.78)" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#D1FAE5" fill="url(#gL)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="prejuizo" name="Prejuizo" stroke="#EF4444" fill="url(#gP)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="liquido" name="Liquido" stroke="rgba(255,255,255,0.78)" fill="url(#gN)" strokeWidth={2.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Bar chart */}
            <div className="card" style={{padding:28,marginTop:20}}>
              <h3 className="t-h3" style={{fontSize:14,marginBottom:20}}>Comparativo lucro vs prejuizo</h3>
              <div style={{height:280}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Bar dataKey="lucro" name="Lucro" fill="#D1FAE5" radius={[4,4,0,0]} maxBarSize={32}/>
                    <Bar dataKey="prejuizo" name="Prejuizo" fill="#EF4444" radius={[4,4,0,0]} maxBarSize={32}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {tab==='history' && (
          <div key="hist" className="tab-content">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h2 className="t-h2">Historico detalhado</h2>
              <span className="badge badge-brand">{fRem.length} registros</span>
            </div>
            {/* Table header */}
            <div style={{display:'grid',gridTemplateColumns:'1.2fr 0.8fr 0.8fr 1fr 1fr 1fr 0.8fr',gap:8,padding:'10px 20px',marginBottom:8}}>
              {['Operador','Rede','Plataforma','Deposito','Saque','Resultado','Data'].map(h=>(
                <p key={h} className="t-label" style={{fontSize:9}}>{h}</p>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {fRem.slice(0,50).map((r,i)=>{
                const m=metas.find(x=>x.id===r.meta_id)
                const op=operators.find(o=>o.id===m?.operator_id)
                const pos=Number(r.resultado||0)>=0
                return (
                  <div key={r.id} className="data-row a1" style={{animationDelay:`${i*15}ms`,display:'grid',gridTemplateColumns:'1.2fr 0.8fr 0.8fr 1fr 1fr 1fr 0.8fr',gap:8,padding:'12px 20px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                      <div style={{width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:9,fontWeight:800,color:'white'}}>{getName(op)[0]?.toUpperCase()}</span>
                      </div>
                      <span style={{fontSize:12,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getName(op)}</span>
                    </div>
                    <span className="badge badge-brand" style={{fontSize:9,alignSelf:'center',width:'fit-content'}}>{m?.rede||'—'}</span>
                    <span style={{fontSize:11,color:'var(--t2)',alignSelf:'center'}}>{m?.plataforma||'—'}</span>
                    <span className="t-num" style={{fontSize:12,color:'var(--t2)',alignSelf:'center'}}>R$ {fmt(r.deposito)}</span>
                    <span className="t-num" style={{fontSize:12,color:'var(--t2)',alignSelf:'center'}}>R$ {fmt(r.saque)}</span>
                    <span className="t-num" style={{fontSize:12,fontWeight:700,color:pos?'var(--profit)':'var(--loss)',alignSelf:'center'}}>
                      {pos?'+':'−'}R$ {fmt(Math.abs(Number(r.resultado||0)))}
                    </span>
                    <span style={{fontSize:10,color:'var(--t3)',alignSelf:'center'}}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )
              })}
              {fRem.length===0 && (
                <div style={{border:'1px dashed var(--b2)',borderRadius:16,padding:64,textAlign:'center'}}>
                  <p className="t-small">Nenhum registro encontrado com os filtros atuais.</p>
                </div>
              )}
              {fRem.length>50 && <p className="t-small" style={{textAlign:'center',padding:16}}>Exibindo 50 de {fRem.length} registros. Use filtros para refinar.</p>}
            </div>
          </div>
        )}
      </div>
      </AppLayout>
    </main>
  )
}

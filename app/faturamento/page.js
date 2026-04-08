'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { supabase } from '../../lib/supabase/client'
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

  useEffect(()=>{ checkAndLoad() },[])

  async function checkAndLoad() {
    const {data:s}=await supabase.auth.getSession()
    const u=s?.session?.user
    if(!u){router.push('/login');return}
    setUser(u)
    const {data:p}=await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle()
    if(!p||p.role!=='admin'){router.push('/operator');return}
    setProfile(p); loadAll()
  }

  async function loadAll() {
    setLoading(true)
    const [{data:ops},{data:ms},{data:rs}]=await Promise.all([
      supabase.from('profiles').select('*').eq('role','operator').order('created_at',{ascending:false}),
      supabase.from('metas').select('*').order('created_at',{ascending:false}),
      supabase.from('remessas').select('*').order('created_at',{ascending:false}),
    ])
    setOperators(ops||[]); setMetas(ms||[]); setRemessas(rs||[])
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
    const lucro=fRem.reduce((a,r)=>a+Number(r.lucro||0),0)
    const prej=fRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
    const dep=fRem.reduce((a,r)=>a+Number(r.deposito||0),0)
    const liq=lucro-prej
    const roi=dep>0?((liq/dep)*100):0
    const pos=fRem.filter(r=>Number(r.resultado||0)>=0).length
    const taxa=fRem.length>0?Math.round((pos/fRem.length)*100):0
    return {lucro,prej,liq,dep,roi,taxa,total:fRem.length,pos}
  },[fRem])

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

  /* ── Predictions ── */
  const predictions = useMemo(()=>{
    if(chartData.length<2) return {trend:'neutral',estimated:0,dailyAvg:0}
    const last7 = fRem.filter(r=>{const d=new Date(r.created_at); const w=new Date(); w.setDate(w.getDate()-7); return d>=w})
    const prev7 = fRem.filter(r=>{const d=new Date(r.created_at); const w1=new Date(); w1.setDate(w1.getDate()-14); const w2=new Date(); w2.setDate(w2.getDate()-7); return d>=w1&&d<w2})
    const liqLast=last7.reduce((a,r)=>a+Number(r.lucro||0)-Number(r.prejuizo||0),0)
    const liqPrev=prev7.reduce((a,r)=>a+Number(r.lucro||0)-Number(r.prejuizo||0),0)
    const trend=liqLast>liqPrev?'up':liqLast<liqPrev?'down':'neutral'
    const days=new Set(fRem.map(r=>new Date(r.created_at).toDateString())).size||1
    const dailyAvg=stats.liq/days
    const estimated=stats.liq+(dailyAvg*30)
    return {trend,estimated,dailyAvg,liqLast,liqPrev,pctChange:liqPrev!==0?Math.round(((liqLast-liqPrev)/Math.abs(liqPrev))*100):0}
  },[fRem,chartData,stats])

  /* ── Goal progress ── */
  const goalData = useMemo(()=>{
    const metasFechadas=metas.filter(m=>m.status_fechamento==='fechada')
    const lucroFinalTotal=metasFechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const target=Number(profile?.meta_global)||100000
    const pct=target>0?Math.min(100,Math.round((lucroFinalTotal/target)*100)):0
    const falta=Math.max(0,target-lucroFinalTotal)
    const days=new Set(fRem.map(r=>new Date(r.created_at).toDateString())).size||1
    const dailyAvg=stats.liq/days
    const diasRestantes=dailyAvg>0?Math.ceil(falta/dailyAvg):999
    return {lucroFinalTotal,target,pct,falta,diasRestantes}
  },[metas,fRem,stats,profile])

  const medals=['#FFD700','#C0C0C0','#CD7F32']

  if(loading) return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
        <div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/>
      </div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true}/>

      <div style={{maxWidth:1380,margin:'0 auto',padding:'32px 28px'}}>
        {/* Header */}
        <div className="a1" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:28}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,rgba(5,217,140,0.2),rgba(79,110,247,0.15))',border:'1px solid var(--profit-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <h1 className="t-h1">Faturamento</h1>
                <p className="t-small">Painel estrategico de gestao financeira</p>
              </div>
            </div>
          </div>
          <button onClick={loadAll} className="btn btn-ghost btn-sm" style={{display:'flex',alignItems:'center',gap:6}}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            Atualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="a2 tabs-scroll" style={{display:'flex',gap:4,marginBottom:24,background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:12,padding:5,width:'fit-content'}}>
          {[['overview','Visao Geral'],['chart','Evolucao'],['operators','Operadores'],['networks','Redes'],['history','Historico']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{fontFamily:'Inter,sans-serif',fontSize:12,fontWeight:600,padding:'8px 18px',borderRadius:9,cursor:'pointer',transition:'all 0.15s',background:tab===k?'var(--raised)':'transparent',border:tab===k?'1px solid var(--b2)':'1px solid transparent',color:tab===k?'var(--t1)':'var(--t3)',boxShadow:tab===k?'0 2px 8px rgba(0,0,0,0.3)':''}}>
              {l}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Filters operators={operators} redes={redesList} filters={filters} setFilters={setFilters}/>

        {/* ═══ OVERVIEW ═══ */}
        {tab==='overview' && (<div key="ov" className="tab-content">
          {/* ── HERO SHOWCASE ── */}
          <div className="a1" style={{
            position:'relative', overflow:'hidden', borderRadius:28, padding:'52px 48px',
            background:'linear-gradient(160deg, #040810 0%, #060b14 30%, #081018 60%, #040810 100%)',
            border:'1px solid rgba(5,217,140,0.12)',
            boxShadow:'0 0 100px rgba(5,217,140,0.05), 0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
            marginBottom:24,
          }}>
            {/* ── Ambient orbs ── */}
            <div style={{position:'absolute',top:'-25%',left:'-8%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(5,217,140,0.07), transparent 60%)',filter:'blur(50px)',pointerEvents:'none',animation:'drift 20s ease-in-out infinite'}}/>
            <div style={{position:'absolute',bottom:'-30%',right:'-5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(79,110,247,0.05), transparent 60%)',filter:'blur(50px)',pointerEvents:'none',animation:'drift 25s ease-in-out infinite 5s'}}/>

            {/* ── Energy Circle (right side) ── */}
            <div style={{position:'absolute',right:40,top:'50%',transform:'translateY(-50%)',width:320,height:320,pointerEvents:'none'}}>
              {/* Outer ring spinning */}
              <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'1.5px solid transparent',borderTopColor:'rgba(5,217,140,0.35)',borderRightColor:'rgba(5,217,140,0.08)',animation:'energy-spin 8s linear infinite',filter:'drop-shadow(0 0 6px rgba(5,217,140,0.3))'}}/>
              {/* Middle ring reverse */}
              <div style={{position:'absolute',inset:20,borderRadius:'50%',border:'1px solid transparent',borderBottomColor:'rgba(79,110,247,0.3)',borderLeftColor:'rgba(79,110,247,0.06)',animation:'energy-spin 12s linear infinite reverse',filter:'drop-shadow(0 0 4px rgba(79,110,247,0.2))'}}/>
              {/* Inner ring */}
              <div style={{position:'absolute',inset:45,borderRadius:'50%',border:'1px solid transparent',borderTopColor:'rgba(5,217,140,0.2)',animation:'energy-spin 6s linear infinite'}}/>
              {/* Pulsing core */}
              <div style={{position:'absolute',inset:65,borderRadius:'50%',background:'radial-gradient(circle, rgba(5,217,140,0.08) 0%, rgba(5,217,140,0.02) 50%, transparent 70%)',animation:'breathe 5s ease-in-out infinite'}}/>
              {/* Ring pulse */}
              <div style={{position:'absolute',inset:30,borderRadius:'50%',border:'1px solid rgba(5,217,140,0.06)',animation:'ring-pulse 4s ease-in-out infinite'}}/>
              <div style={{position:'absolute',inset:55,borderRadius:'50%',border:'1px solid rgba(79,110,247,0.05)',animation:'ring-pulse 4s ease-in-out infinite 2s'}}/>
              {/* Particles */}
              {[
                {size:3,top:'15%',left:'20%',color:'#05d98c',delay:'0s',dur:'7s'},
                {size:2,top:'70%',left:'15%',color:'#6b84ff',delay:'1s',dur:'9s'},
                {size:3,top:'25%',left:'75%',color:'#05d98c',delay:'2s',dur:'8s'},
                {size:2,top:'60%',left:'80%',color:'#6b84ff',delay:'0.5s',dur:'6s'},
                {size:2,top:'45%',left:'50%',color:'#05d98c',delay:'3s',dur:'10s'},
                {size:2,top:'80%',left:'45%',color:'#34d399',delay:'1.5s',dur:'7s'},
              ].map((p,i)=>(
                <div key={i} style={{position:'absolute',width:p.size,height:p.size,borderRadius:'50%',background:p.color,top:p.top,left:p.left,boxShadow:`0 0 8px ${p.color}`,opacity:0.7,animation:`drift ${p.dur} ease-in-out infinite ${p.delay}`}}/>
              ))}
            </div>

            {/* ── Content ── */}
            <div style={{position:'relative',zIndex:1,maxWidth:700}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:24}}>
                <span className="live-dot" style={{width:8,height:8}}/>
                <span style={{fontSize:11,fontWeight:700,color:'rgba(5,217,140,0.7)',letterSpacing:'0.12em'}}>FATURAMENTO TOTAL DA OPERACAO</span>
              </div>
              <div className="shine-text" style={{display:'inline-block',marginBottom:14}}>
                <p className="t-num" style={{fontSize:68,fontWeight:900,lineHeight:1,letterSpacing:'-0.04em',
                  background:'linear-gradient(135deg, #05d98c 0%, #34d399 30%, #6ee7b7 60%, #34d399 80%, #05d98c 100%)',
                  WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
                  filter:'drop-shadow(0 0 40px rgba(5,217,140,0.25))',
                }}>
                  <CountUp value={stats.lucro} prefix="R$ "/>
                </p>
              </div>
              <p style={{fontSize:14,color:'var(--t3)',marginBottom:32}}>{stats.total} remessas processadas · {operators.length} operadores · {redesList.length} redes</p>

              {/* Sub KPIs */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                {[
                  {label:'Lucro liquido',value:Math.abs(stats.liq),prefix:stats.liq>=0?'+R$ ':'-R$ ',color:stats.liq>=0?'#05d98c':'#f03d6b',sub:stats.liq>=0?'Resultado positivo':'Resultado negativo',rgb:'5,217,140'},
                  {label:'Prejuizo total',value:stats.prej,prefix:'R$ ',color:'#f03d6b',sub:`${stats.total-stats.pos} remessas negativas`,rgb:'240,61,107'},
                  {label:'ROI estimado',value:null,color:stats.roi>=0?'#6b84ff':'#f03d6b',sub:`Taxa acerto: ${stats.taxa}%`,rgb:'79,110,247'},
                ].map((kpi,i)=>(
                  <div key={i} style={{
                    background:`linear-gradient(145deg, rgba(${kpi.rgb},0.06), rgba(255,255,255,0.02))`,
                    border:`1px solid rgba(${kpi.rgb},0.1)`,borderRadius:16,padding:'20px 22px',
                    backdropFilter:'blur(12px)',
                    transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`rgba(${kpi.rgb},0.25)`;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 30px rgba(${kpi.rgb},0.1)`}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=`rgba(${kpi.rgb},0.1)`;e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}
                  >
                    <p className="t-label" style={{marginBottom:10}}>{kpi.label}</p>
                    <p className="t-num" style={{fontSize:26,fontWeight:800,color:kpi.color}}>
                      {kpi.value!==null ? <CountUp value={kpi.value} prefix={kpi.prefix}/> : <>{stats.roi>=0?'+':''}{fmt(stats.roi)}%</>}
                    </p>
                    <p className="t-small" style={{marginTop:8}}>{kpi.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Predictions + Goal */}
          <div className="g-side" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
            {/* Predictions */}
            <div className="card a3" style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
                <div style={{width:34,height:34,borderRadius:9,background:'var(--brand-dim)',border:'1px solid var(--brand-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                  <h3 className="t-h3" style={{fontSize:14}}>Previsoes inteligentes</h3>
                  <p className="t-small">Baseado nos ultimos 14 dias</p>
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
                  <p className="t-label" style={{marginBottom:8}}>Previsao 30 dias</p>
                  <p className="t-num" style={{fontSize:18,fontWeight:700,color:predictions.estimated>=0?'var(--profit)':'var(--loss)'}}>
                    {predictions.estimated>=0?'+':''}R$ {fmt(Math.abs(predictions.estimated))}
                  </p>
                  <p className="t-small">Media diaria: R$ {fmt(Math.abs(predictions.dailyAvg))}</p>
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

            {/* Goal */}
            <div className="card a4" style={{padding:24}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:34,height:34,borderRadius:9,background:'var(--profit-dim)',border:'1px solid var(--profit-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <div>
                    <h3 className="t-h3" style={{fontSize:14}}>Meta global</h3>
                    <p className="t-small">Objetivo: R$ {fmt(goalData.target)}</p>
                  </div>
                </div>
                <button onClick={()=>{setEditGoal(!editGoal);setGoalInput(String(goalData.target))}} className="btn btn-ghost btn-sm" style={{display:'flex',alignItems:'center',gap:5}}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
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
                <div className="progress-bar" style={{width:`${goalData.pct}%`,background:'linear-gradient(90deg,var(--profit),#34d399)',boxShadow:'0 0 12px rgba(5,217,140,0.3)'}}/>
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

          {/* Mini chart + Quick stats */}
          <div className="g-side" style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
            <div className="card a5" style={{padding:24}}>
              <h3 className="t-h3" style={{fontSize:14,marginBottom:16}}>Evolucao recente</h3>
              <div style={{height:200}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.slice(-14)}>
                    <defs>
                      <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#05d98c" stopOpacity={0.3}/><stop offset="100%" stopColor="#05d98c" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Area type="monotone" dataKey="liquido" name="Liquido" stroke="#05d98c" fill="url(#gProfit)" strokeWidth={2}/>
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
                      <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#05d98c" stopOpacity={0.25}/><stop offset="100%" stopColor="#05d98c" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f03d6b" stopOpacity={0.2}/><stop offset="100%" stopColor="#f03d6b" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f6ef7" stopOpacity={0.25}/><stop offset="100%" stopColor="#4f6ef7" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#05d98c" fill="url(#gL)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="prejuizo" name="Prejuizo" stroke="#f03d6b" fill="url(#gP)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="liquido" name="Liquido" stroke="#4f6ef7" fill="url(#gN)" strokeWidth={2.5}/>
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
                    <Bar dataKey="lucro" name="Lucro" fill="#05d98c" radius={[4,4,0,0]} maxBarSize={32}/>
                    <Bar dataKey="prejuizo" name="Prejuizo" fill="#f03d6b" radius={[4,4,0,0]} maxBarSize={32}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══ OPERATORS ═══ */}
        {tab==='operators' && (
          <div key="op" className="tab-content">
            <h2 className="t-h2" style={{marginBottom:20}}>Ranking de operadores</h2>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {opRanking.map((op,i)=>{
                const medal=medals[i]
                const isTop=i<3
                const maxL=Math.abs(opRanking[0]?.liq)||1
                const barW=Math.max(3,(Math.abs(op.liq)/maxL)*100)
                const pos=op.liq>=0
                return (
                  <div key={op.id} className="card a1" style={{animationDelay:`${i*50}ms`,padding:'22px 26px',border:isTop?`1px solid ${medal}22`:'1px solid var(--b1)',background:isTop?`rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.03)`:'var(--surface)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:20}}>
                      <div style={{width:50,height:50,borderRadius:14,background:isTop?`${medal}15`:'var(--raised)',border:`2px solid ${isTop?medal:'var(--b2)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:18,fontWeight:900,color:isTop?medal:'var(--t4)',fontFamily:'Inter,sans-serif'}}>#{i+1}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                          <div style={{width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <span style={{fontSize:11,fontWeight:800,color:'white'}}>{getName(op)[0].toUpperCase()}</span>
                          </div>
                          <p style={{fontSize:15,fontWeight:800,color:isTop&&i===0?medal:'var(--t1)',margin:0}}>{getName(op)}</p>
                          {i===0&&<span className="badge badge-warn">Lider</span>}
                        </div>
                        <p className="t-small" style={{marginBottom:10}}>{op.nMetas} metas · {op.nRem} remessas · {op.taxa}% acerto</p>
                        <div className="progress" style={{height:4}}>
                          <div className="progress-bar" style={{width:`${barW}%`,background:pos?'linear-gradient(90deg,var(--profit),#34d399)':'linear-gradient(90deg,var(--loss),#f87171)'}}/>
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,flexShrink:0}}>
                        {[
                          {l:'Lucro',v:`R$ ${fmt(op.lucro)}`,c:'var(--profit)'},
                          {l:'Prejuizo',v:`R$ ${fmt(op.prej)}`,c:'var(--loss)'},
                          {l:'Liquido',v:`${op.liq>=0?'+':''}R$ ${fmt(Math.abs(op.liq))}`,c:pos?'var(--profit)':'var(--loss)'},
                        ].map(({l,v,c})=>(
                          <div key={l} style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:10,padding:'11px 16px',textAlign:'center',minWidth:100}}>
                            <p className="t-label" style={{fontSize:9,marginBottom:5}}>{l}</p>
                            <p className="t-num" style={{fontSize:13,fontWeight:700,color:c}}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
              {opRanking.length===0 && (
                <div style={{border:'1px dashed var(--b2)',borderRadius:16,padding:64,textAlign:'center'}}>
                  <p className="t-small">Nenhum operador com dados no periodo filtrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ NETWORKS ═══ */}
        {tab==='networks' && (
          <div key="net" className="tab-content">
            <h2 className="t-h2" style={{marginBottom:20}}>Ranking de redes</h2>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {redeRanking.map((r,i)=>{
                const medal=medals[i]
                const isTop=i<3
                const isTop1=i===0
                const maxL=Math.abs(redeRanking[0]?.liq)||1
                const barW=Math.max(3,(Math.abs(r.liq)/maxL)*100)
                const pos=r.liq>=0
                return (
                  <div key={r.rede} className="card a1" style={{animationDelay:`${i*50}ms`,padding:isTop1?0:'22px 26px',border:isTop1?'1px solid rgba(255,215,0,0.3)':isTop?`1px solid ${medal}22`:'1px solid var(--b1)',overflow:'hidden'}}>
                    {isTop1 && (
                      <div style={{background:'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(5,217,140,0.06))',borderBottom:'1px solid rgba(255,215,0,0.15)',padding:'14px 26px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 4v10"/><path d="M18 4v10"/></svg>
                          <span style={{fontSize:11,fontWeight:800,color:'#FFD700',letterSpacing:'0.08em'}}>REDE #1</span>
                        </div>
                        <span className="badge badge-warn">TOP</span>
                      </div>
                    )}
                    <div style={{padding:isTop1?'22px 26px':0,display:'flex',alignItems:'center',gap:20}}>
                      <div style={{width:50,height:50,borderRadius:14,background:isTop?`${medal}15`:'var(--raised)',border:`2px solid ${isTop?medal:'var(--b2)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:18,fontWeight:900,color:isTop?medal:'var(--t4)'}}>#{i+1}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                          <p style={{fontSize:isTop1?20:16,fontWeight:900,color:isTop1?'#FFD700':isTop?medal:'var(--t1)',margin:0}}>{r.rede}</p>
                          {isTop1&&<span className="badge badge-warn">Lider</span>}
                        </div>
                        <p className="t-small" style={{marginBottom:10}}>{r.nMetas} metas · {r.nRem} remessas · {r.taxa}% acerto</p>
                        <div className="progress" style={{height:4}}>
                          <div className="progress-bar" style={{width:`${barW}%`,background:isTop1?'linear-gradient(90deg,#FFD700,#f5a623)':pos?'linear-gradient(90deg,var(--profit),#34d399)':'linear-gradient(90deg,var(--loss),#f87171)'}}/>
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,flexShrink:0}}>
                        {[
                          {l:'Lucro',v:`R$ ${fmt(r.lucro)}`,c:'var(--profit)'},
                          {l:'Prejuizo',v:`R$ ${fmt(r.prej)}`,c:'var(--loss)'},
                          {l:'Resultado',v:`${r.liq>=0?'+':''}R$ ${fmt(Math.abs(r.liq))}`,c:isTop1&&pos?'#FFD700':pos?'var(--profit)':'var(--loss)'},
                        ].map(({l,v,c})=>(
                          <div key={l} style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:10,padding:'11px 16px',textAlign:'center',minWidth:100}}>
                            <p className="t-label" style={{fontSize:9,marginBottom:5}}>{l}</p>
                            <p className="t-num" style={{fontSize:13,fontWeight:700,color:c}}>{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
              {redeRanking.length===0 && (
                <div style={{border:'1px dashed var(--b2)',borderRadius:16,padding:64,textAlign:'center'}}>
                  <p className="t-small">Nenhuma rede com dados no periodo filtrado.</p>
                </div>
              )}
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
                      <div style={{width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
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
    </main>
  )
}

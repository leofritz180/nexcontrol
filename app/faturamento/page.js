'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import FaturamentoBento from '../../components/modules/FaturamentoBento'
import { ModuloEsqueleto } from '../../components/ui/bento'
import { isNex2 } from '../../lib/theme-v2'
import AppLayout from '../../components/AppLayout'
import RouteTour from '../../components/RouteTour'
import { supabase } from '../../lib/supabase/client'
import { tenantEhPro } from '../../lib/pro'
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
  // Helpers pra setar quick-period (formato YYYY-MM-DD em local time)
  const ymd = d => {
    const off = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - off).toISOString().slice(0, 10)
  }
  function setQuickPeriod(period) {
    const today = new Date(); today.setHours(0,0,0,0)
    if (period === 'hoje') {
      setFilters(f => ({ ...f, dateFrom: ymd(today), dateTo: ymd(today), period: 'hoje' }))
    } else if (period === 'ontem') {
      const y = new Date(today); y.setDate(y.getDate() - 1)
      setFilters(f => ({ ...f, dateFrom: ymd(y), dateTo: ymd(y), period: 'ontem' }))
    } else if (period === '7d') {
      const start = new Date(today); start.setDate(start.getDate() - 6)
      setFilters(f => ({ ...f, dateFrom: ymd(start), dateTo: ymd(today), period: '7d' }))
    } else if (period === '30d') {
      const start = new Date(today); start.setDate(start.getDate() - 29)
      setFilters(f => ({ ...f, dateFrom: ymd(start), dateTo: ymd(today), period: '30d' }))
    }
  }
  const QUICK = [['hoje','Hoje'],['ontem','Ontem'],['7d','7 dias'],['30d','30 dias']]
  const activePeriod = filters.period

  return (
    <div className="card a2" style={{ padding:'18px 22px', marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <span className="t-label" style={{ fontSize:11 }}>Filtros</span>
        </div>
        {/* Quick period chips */}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {QUICK.map(([key,label]) => {
            const active = activePeriod === key
            return (
              <button key={key} type="button" onClick={()=>setQuickPeriod(key)}
                style={{
                  padding:'7px 12px', borderRadius:8, fontSize:11, fontWeight:700, fontFamily:'inherit',
                  letterSpacing:'0.04em', cursor:'pointer',
                  background: active ? 'rgba(229,57,31,0.14)' : 'rgba(255,255,255,0.03)',
                  color: active ? 'var(--loss)' : 'var(--t2)',
                  border: `1px solid ${active ? 'rgba(229,57,31,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: active ? '0 0 14px rgba(229,57,31,0.2)' : 'none',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => { if(!active) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='var(--t1)' } }}
                onMouseLeave={e => { if(!active) { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='var(--t2)' } }}>
                {label}
              </button>
            )
          })}
        </div>
        <div style={{ width:1, height:24, background:'var(--fill-3)' }}/>
        <input type="date" className="input" value={filters.dateFrom} onChange={e=>setFilters(f=>({...f,dateFrom:e.target.value, period:''}))} style={{ width:150, padding:'8px 12px', fontSize:12 }}/>
        <input type="date" className="input" value={filters.dateTo} onChange={e=>setFilters(f=>({...f,dateTo:e.target.value, period:''}))} style={{ width:150, padding:'8px 12px', fontSize:12 }}/>
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
          <button onClick={()=>setFilters({dateFrom:'',dateTo:'',operador:'',rede:'',tipo:'',period:''})} className="btn btn-ghost btn-sm">Limpar</button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════ MAIN ═══════════════════════════ */
// O bloco de leitura quando a conta nao e Pro. Mostra O QUE ELE ENTREGA em
// vez de sumir — quem nao assina precisa saber o que esta deixando na mesa,
// e quem assina precisa reconhecer o que comprou.
function BlocoPro() {
  return (
    <div className="card a3" style={{ position:'relative', overflow:'hidden', padding:22, display:'flex', flexDirection:'column', justifyContent:'center' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:7, marginBottom:12 }}>
        <span style={{ width:22, height:22, borderRadius:7, background:'rgba(200,242,29,0.16)', border:'1px solid rgba(200,242,29,0.45)', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#7E9A0B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg>
        </span>
        <span style={{ fontSize:10.5, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--t3)' }}>Solo Pro</span>
      </div>
      <p style={{ fontSize:15.5, fontWeight:800, color:'var(--t1)', margin:'0 0 8px', letterSpacing:'-0.01em' }}>
        Leitura da operação
      </p>
      <p style={{ fontSize:12.5, color:'var(--t3)', margin:'0 0 16px', lineHeight:1.6 }}>
        Projeção de fechamento do mês, comparação com o período anterior e
        tendência de alta ou queda. Os números você já tem — isto diz o que
        eles estão dizendo.
      </p>
      <a href="/billing-mp" style={{ alignSelf:'flex-start', display:'inline-flex', alignItems:'center', gap:6, height:38, padding:'0 16px', borderRadius:11, background:'var(--brand)', color:'#fff', fontSize:12.5, fontWeight:800, textDecoration:'none' }}>
        Ativar por + R$ 40/mês
      </a>
    </div>
  )
}

export default function FaturamentoPage() {
  const router = useRouter()
  const [user,setUser]=useState(null)
  // PRO: a leitura da operacao (projecao, comparacao e tendencia) passou a
  // ser do Solo Pro. Quem nao tem ve o bloco trancado, com o que ele
  // entrega escrito — nao um espaco vazio.
  const [pro,setPro]=useState(true)
  const [profile,setProfile]=useState(null)
  const [operators,setOperators]=useState([])
  const [metas,setMetas]=useState([])
  const [remessas,setRemessas]=useState([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState('overview')
  const [chartPeriod,setChartPeriod]=useState('day')
  const [filters,setFilters]=useState({dateFrom:'',dateTo:'',operador:'',rede:'',tipo:'',period:''})
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
    if(!loading && shouldShowDemo(metas, user?.id) && !demoMode) {
      setMetas(DEMO_METAS)
      setRemessas(DEMO_REMESSAS)
      setOperators(DEMO_OPERATORS)
      setDemoMode(true)
    }
  },[loading, metas, demoMode, user?.id])

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
    const [{data:ops},{data:ms},{data:rs},{data:subRow},{data:subsAtivas},{data:costsData}]=await Promise.all([
      supabase.from('profiles').select('*').eq('role','operator').order('created_at',{ascending:false}),
      supabase.from('metas').select('*').order('created_at',{ascending:false}),
      supabase.from('remessas').select('*').order('created_at',{ascending:false}),
      supabase.from('subscriptions').select('*').eq('tenant_id',tid||profile?.tenant_id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('subscriptions').select('operator_count,total_amount,plan_months,status,expires_at').eq('tenant_id',tid||profile?.tenant_id).eq('status','active'),
      supabase.from('costs').select('amount,date').eq('tenant_id',tid||profile?.tenant_id),
    ])
    setPro(tenantEhPro(subsAtivas))
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

    // Janela de data dos filtros — aplicada tambem em metas fechadas + custos
    // pra que lucro_final reflita o periodo selecionado.
    const dFromObj = filters.dateFrom ? new Date(filters.dateFrom) : null
    const dToObj = filters.dateTo ? (() => { const d = new Date(filters.dateTo); d.setDate(d.getDate()+1); return d })() : null
    const inRange = (dStr) => {
      if (!dFromObj && !dToObj) return true
      if (!dStr) return false
      const d = new Date(dStr)
      if (dFromObj && d < dFromObj) return false
      if (dToObj && d >= dToObj) return false
      return true
    }

    // Lucro final das metas FECHADAS no periodo (usa fechada_em; fallback created_at)
    let fechadas = metas.filter(m=>m.status_fechamento==='fechada')
    fechadas = fechadas.filter(m => inRange(m.fechada_em || m.created_at))
    // Tambem aplica filtros de operador/rede que sao do useMemo de Filters
    if (filters.operador) fechadas = fechadas.filter(m => m.operator_id === filters.operador)
    if (filters.rede) fechadas = fechadas.filter(m => m.rede === filters.rede)
    const lucroFinalBruto=fechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)

    // Custos do periodo (rows tem campo `date`)
    const custosNoPeriodo = costs.filter(c => inRange(c.date))
    const custosTotal=custosNoPeriodo.reduce((a,c)=>a+Number(c.amount||0),0)

    const lucroFinal=Number((lucroFinalBruto-custosTotal).toFixed(2))
    return {lucro:Number(lucro.toFixed(2)),prej:Number(prej.toFixed(2)),liq:Number(liq.toFixed(2)),dep:Number(dep.toFixed(2)),saq:Number(saq.toFixed(2)),roi,taxa,total:fRem.length,pos,lucroFinal,lucroFinalBruto:Number(lucroFinalBruto.toFixed(2)),custosTotal:Number(custosTotal.toFixed(2)),fechadas:fechadas.length}
  },[fRem,metas,costs,filters])

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

  const leitura = useMemo(()=>{
    const { insights, alerts } = generateInsights({ stats, predictions, goalData, metas, operators, remessas:fRem })
    return { pro, insights, alertas: alerts, saude: getHealthStatus(stats, predictions), projecao: goalData }
  },[stats,predictions,goalData,metas,operators,fRem,pro])

  const medals=['#FFD700','#C0C0C0','#CD7F32']

  if(loading) return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>
      {isNex2(user?.email) ? (
        <div style={{maxWidth:1380,margin:'0 auto',padding:'32px 28px'}}><ModuloEsqueleto cards={4}/></div>
      ) : (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
        <div className="spinner" style={{width:28,height:28,borderTopColor:'var(--brand-bright)'}}/>
      </div>
      )}
      </AppLayout>
    </main>
  )

  // No V2 da Visao geral o bento e a pagina inteira: o titulo antigo sai e os
  // botoes vao pro cabecalho dele. Sao os MESMOS handlers.
  const v2Overview = isNex2(user?.email) && tab === 'overview'
  const btnSecundario = {
    padding: '9px 16px', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 30,
    color: 'var(--t2)', transition: 'all 0.15s',
  }
  const acoesFaturamento = (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" onClick={() => setShowShowcase(true)} style={btnSecundario}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--t1)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}>
        Apresentação
      </button>
      <button type="button" onClick={loadAll} style={btnSecundario}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--t1)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}>
        Atualizar
      </button>
    </div>
  )

  return (
    <main style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      {showShowcase && <ProfitShowcase stats={stats} goalData={goalData} operators={operators} metas={metas} onClose={()=>setShowShowcase(false)}/>}
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} userId={user?.id} tenantId={profile?.tenant_id}>

      <div style={{maxWidth:1380,margin:'0 auto',padding:'32px 28px'}}>
        {/* V2 na Visao geral: o bento E a pagina. Antes ele era desenhado por
            CIMA do layout antigo, e logo abaixo vinham de novo o titulo
            "Faturamento / Painel financeiro", os botoes e a barra de filtros
            — duas paginas empilhadas. Agora o titulo antigo some e os botoes
            e os filtros entram DENTRO do bento. Nenhuma funcao sai do ar:
            Apresentacao, Atualizar e todos os filtros continuam os mesmos
            elementos, so que no lugar certo. */}
        {/* Header — clean */}
        {!v2Overview && (
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
              Apresentação
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
        )}

        {/* Demo Banner */}
        {demoMode && (
          <div className="demo-banner" style={{
            marginBottom:20, padding:'14px 20px', borderRadius:14,
            background:'linear-gradient(135deg, rgba(229,57,31,0.08), rgba(229,57,31,0.03))',
            border:'1px solid rgba(229,57,31,0.15)',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <span className="demo-banner-dot" style={{width:8,height:8,borderRadius:'50%',background:'#e5391f',flexShrink:0}}/>
            <p style={{fontSize:13,color:'var(--t2)',fontWeight:500,margin:0,lineHeight:1.5}}>{DEMO_BANNER_TEXT}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="a2 tabs-scroll" style={{display:'flex',gap:4,marginBottom:24,background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:12,padding:5,width:'fit-content'}}>
          {[['overview','Visão geral'],['chart','Evolução'],['history','Histórico']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} data-active={tab===k?'true':'false'} style={{fontFamily:'Inter,sans-serif',fontSize:12,fontWeight:600,padding:'8px 18px',borderRadius:9,cursor:'pointer',transition:'all 0.15s',background:tab===k?'var(--raised)':'transparent',border:tab===k?'1px solid var(--b2)':'1px solid transparent',color:tab===k?'var(--t1)':'var(--t3)',boxShadow:tab===k?'0 2px 8px rgba(0,0,0,0.3)':''}}>
              {l}
            </button>
          ))}
        </div>

        {/* Filters — no V2 da Visao geral eles vao pra dentro do bento */}
        {!v2Overview && <Filters operators={operators} redes={redesList} filters={filters} setFilters={setFilters}/>}

        {v2Overview && (
          <FaturamentoBento
            stats={stats} chartData={chartData}
            operadores={operators?.length || 0}
            redes={new Set(metas.filter(m=>m.rede).map(m=>m.rede)).size}
            acoes={acoesFaturamento}
            filtros={<Filters operators={operators} redes={redesList} filters={filters} setFilters={setFilters}/>}
            leitura={leitura}
          />
        )}

        {/* ═══ OVERVIEW ═══ */}
        

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
                      <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--profit)" stopOpacity={0.25}/><stop offset="100%" stopColor="var(--profit)" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--loss)" stopOpacity={0.2}/><stop offset="100%" stopColor="var(--loss)" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,0.78)" stopOpacity={0.25}/><stop offset="100%" stopColor="rgba(255,255,255,0.78)" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:'#4a5878'}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(1)}k`}/>
                    <Tooltip content={<ChartTooltip/>}/>
                    <Area type="monotone" dataKey="lucro" name="Lucro" stroke="var(--profit)" fill="url(#gL)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="prejuizo" name="Prejuizo" stroke="var(--loss)" fill="url(#gP)" strokeWidth={2}/>
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
                    <Bar dataKey="lucro" name="Lucro" fill="var(--profit)" radius={[4,4,0,0]} maxBarSize={32}/>
                    <Bar dataKey="prejuizo" name="Prejuizo" fill="var(--loss)" radius={[4,4,0,0]} maxBarSize={32}/>
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
                      <div style={{width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,var(--fill-3),rgba(255,255,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:9,fontWeight:800,color:'var(--t1)'}}>{getName(op)[0]?.toUpperCase()}</span>
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
      <RouteTour tourId="faturamento" />
      </AppLayout>
    </main>
  )
}

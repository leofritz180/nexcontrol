'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import TrialBanner, { ConversionModal } from '../../components/TrialBanner'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtDate = d => d?new Date(d).toLocaleString('pt-BR'):'—'
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

function Sparkline({ data, color, height=32 }) {
  if (!data||data.length<2) return <div style={{ height, display:'flex', alignItems:'center' }}><span style={{ fontSize:10,color:'var(--t4)' }}>sem dados</span></div>
  const max = Math.max(...data,1), min = Math.min(...data,0)
  const range = max-min||1
  const w = 120, h = height
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*(h-4)+2}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="3" fill={color}/>
    </svg>
  )
}

function ModalFechamento({ meta, remessas, operador, onClose, onSaved }) {
  const lucroRem = remessas.reduce((a,r)=>a+Number(r.lucro||0),0)
  const prejRem  = remessas.reduce((a,r)=>a+Number(r.prejuizo||0),0)
  const liqRem   = lucroRem-prejRem
  const [salario,setSalario]=useState(String(meta.salario||''))
  const [custo,  setCusto]  =useState(String(meta.custo_fixo||''))
  const [saving, setSaving] =useState(false)
  const [error,  setError]  =useState('')

  const lucroFinal = useMemo(()=>liqRem+Number(salario||0)-Number(custo||0),[salario,custo,liqRem])

  async function save() {
    if (saving) return
    setSaving(true); setError('')
    // Conditional update: only if not already fechada (prevent double-close)
    const { data:updated, error:err } = await supabase.from('metas').update({
      salario:Number(salario||0), custo_fixo:Number(custo||0),
      lucro_final:lucroFinal, status:'finalizada',
      status_fechamento:'fechada', fechada_em:new Date().toISOString(),
    }).eq('id',meta.id).neq('status_fechamento','fechada').select()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (!updated||updated.length===0) { setError('Meta ja foi fechada por outro usuario.'); return }
    onSaved(); onClose()
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(2,4,8,0.9)',backdropFilter:'blur(16px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div className="as card" style={{ width:'100%',maxWidth:520,padding:32,boxShadow:'0 40px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(79,110,247,0.15)',border:'1px solid rgba(79,110,247,0.2)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:42,height:42,borderRadius:12,background:'var(--profit-dim)',border:'1px solid var(--profit-border)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <h2 className="t-h3" style={{ margin:'0 0 2px' }}>Fechamento de meta</h2>
              <p className="t-small">{meta.titulo} · {getName(operador)}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Resumo */}
        <div style={{ background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:12,padding:18,marginBottom:22 }}>
          <p className="t-label" style={{ marginBottom:14 }}>Resultado das remessas</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
            {[
              {l:'Lucro bruto',v:`R$ ${fmt(lucroRem)}`,c:'var(--profit)'},
              {l:'Prejuízo',   v:`R$ ${fmt(prejRem)}`, c:'var(--loss)'},
              {l:'Resultado',  v:`R$ ${fmt(liqRem)}`,  c:liqRem>=0?'var(--profit)':'var(--loss)'},
            ].map(({l,v,c})=>(
              <div key={l} style={{ textAlign:'center',background:'var(--void)',borderRadius:10,padding:12 }}>
                <p className="t-label" style={{ fontSize:9,marginBottom:5 }}>{l}</p>
                <p className="t-num" style={{ fontSize:14,fontWeight:700,color:c }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:15 }}>
          <div>
            <label className="t-label" style={{ display:'block',marginBottom:8 }}>Meu salário nesta meta (R$)</label>
            <p className="t-small" style={{ margin:'0 0 8px' }}>Valor recebido por bater a meta — soma ao resultado (+)</p>
            <input className="input" type="number" step="0.01" min="0" value={salario} onChange={e=>setSalario(e.target.value)} placeholder="0,00"/>
          </div>
          <div>
            <label className="t-label" style={{ display:'block',marginBottom:8 }}>Custo fixo da operação (R$)</label>
            <p className="t-small" style={{ margin:'0 0 8px' }}>Salário do operador + despesas — deduzido (−)</p>
            <input className="input" type="number" step="0.01" min="0" value={custo} onChange={e=>setCusto(e.target.value)} placeholder="0,00"/>
          </div>

          <div style={{ background:lucroFinal>=0?'var(--profit-dim)':'var(--loss-dim)',border:`1px solid ${lucroFinal>=0?'var(--profit-border)':'var(--loss-border)'}`,borderRadius:12,padding:'18px 22px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div>
              <p className="t-label" style={{ marginBottom:4 }}>Lucro final da meta</p>
              <p className="t-small">Resultado + salário − custo fixo</p>
            </div>
            <p className="t-num" style={{ fontSize:28,fontWeight:800,color:lucroFinal>=0?'var(--profit)':'var(--loss)' }}>
              {lucroFinal>=0?'+':''}R$ {fmt(lucroFinal)}
            </p>
          </div>

          {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

          <div style={{ display:'flex',gap:10 }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex:1 }}>Cancelar</button>
            <button onClick={save} disabled={saving} className="btn btn-profit" style={{ flex:2 }}>
              {saving?<><div className="spinner" style={{ width:14,height:14,borderTopColor:'#012b1c' }}/> Salvando...</>:<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Confirmar fechamento</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [loading,   setLoading]   = useState(true)
  const [operators, setOperators] = useState([])
  const [metas,     setMetas]     = useState([])
  const [remessas,  setRemessas]  = useState([])
  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [selectedOp,setSelectedOp]= useState(null)
  const [modalMeta, setModalMeta] = useState(null)
  const [tab,       setTab]       = useState('overview')
  const [redePeriodo,setRedePeriodo]=useState('all')
  const [metaStatus, setMetaStatus]=useState('all')
  const [metaPeriod, setMetaPeriod]=useState('all')
  const [tenant,    setTenant]    = useState(null)
  const [sub,       setSub]       = useState(null)
  const [invites,   setInvites]   = useState([])
  const [invSaving, setInvSaving] = useState(false)
  const [invMsg,    setInvMsg]    = useState('')
  const [focusMeta, setFocusMeta] = useState(null)
  const [focusRem,  setFocusRem]  = useState([])
  const [focusLogs, setFocusLogs] = useState([])
  const [notification, setNotification] = useState(null)
  const prevRemCount = useRef(0)
  const [focusLoad, setFocusLoad] = useState(false)

  useEffect(()=>{ checkAndLoad() },[])
  useEffect(()=>{ const iv=setInterval(loadAll,30000); return()=>clearInterval(iv) },[])

  async function checkAndLoad() {
    const { data:s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data:p } = await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle()
    if (!p||p.role!=='admin') { router.push('/operator'); return }
    setProfile(p)
    loadAll()
  }

  async function loadAll() {
    setLoading(true)
    const [{ data:ops },{ data:ms },{ data:rs },{ data:inv },{ data:t },{ data:s2 }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role','operator').order('created_at',{ascending:false}),
      supabase.from('metas').select('*').order('created_at',{ascending:false}),
      supabase.from('remessas').select('*').order('created_at',{ascending:false}),
      supabase.from('invites').select('*').order('created_at',{ascending:false}),
      supabase.from('tenants').select('*').eq('id',profile?.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id',profile?.tenant_id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    ])
    // Detect new remessas for notification
    const newRs = rs||[]
    if (prevRemCount.current > 0 && newRs.length > prevRemCount.current) {
      const latest = newRs[0]
      const latestMeta = (ms||[]).find(x=>x.id===latest?.meta_id)
      const latestOp = (ops||[]).find(o=>o.id===latestMeta?.operator_id)
      const val = Number(latest?.resultado||0)
      const pos = val >= 0
      setNotification({
        op: getName(latestOp),
        rede: latestMeta?.rede || '',
        val: Math.abs(val),
        pos,
        time: Date.now(),
      })
      setTimeout(()=>setNotification(null), 5000)
    }
    prevRemCount.current = newRs.length

    setOperators(ops||[]); setMetas(ms||[]); setRemessas(newRs); setInvites(inv||[])
    if(t) setTenant(t); if(s2) setSub(s2)
    setLoading(false)
  }

  async function sendInvite() {
    if(!profile?.tenant_id) return
    setInvSaving(true); setInvMsg('')
    const { data, error:err } = await supabase.from('invites').insert({
      tenant_id: profile.tenant_id,
      role: 'operator',
    }).select().single()
    setInvSaving(false)
    if(err) { setInvMsg('Erro: '+err.message); return }
    const link = `${window.location.origin}/invite?token=${data.token}`
    await navigator.clipboard.writeText(link)
    setInvMsg('Link copiado! Envie para o operador.')
    loadAll()
  }

  async function deleteInvite(id) {
    await supabase.from('invites').delete().eq('id',id)
    setInvites(prev=>prev.filter(i=>i.id!==id))
  }

  async function openMetaDetail(meta) {
    setFocusMeta(meta); setFocusLoad(true)
    const [{data:r},{data:l}] = await Promise.all([
      supabase.from('remessas').select('*').eq('meta_id',meta.id).order('created_at',{ascending:true}),
      supabase.from('activity_logs').select('*').eq('meta_id',meta.id).order('created_at',{ascending:false}).limit(50),
    ])
    setFocusRem(r||[]); setFocusLogs(l||[]); setFocusLoad(false)
  }

  // Polling for active focused meta
  useEffect(()=>{
    if(!focusMeta||(focusMeta.status==='finalizada'&&focusMeta.status_fechamento==='fechada')) return
    const iv=setInterval(async()=>{
      const [{data:r},{data:l},{data:m}]=await Promise.all([
        supabase.from('remessas').select('*').eq('meta_id',focusMeta.id).order('created_at',{ascending:true}),
        supabase.from('activity_logs').select('*').eq('meta_id',focusMeta.id).order('created_at',{ascending:false}).limit(50),
        supabase.from('metas').select('*').eq('id',focusMeta.id).single(),
      ])
      if(r) setFocusRem(r); if(l) setFocusLogs(l); if(m) setFocusMeta(m)
    },10000)
    return()=>clearInterval(iv)
  },[focusMeta?.id,focusMeta?.status])

  const global = useMemo(()=>{
    const lucro = remessas.reduce((a,r)=>a+Number(r.lucro||0),0)
    const prej  = remessas.reduce((a,r)=>a+Number(r.prejuizo||0),0)
    const today = new Date().toDateString()
    // Lucro hoje = lucro_final das metas fechadas hoje pelo admin
    const lucroHoje = metas.filter(m=>m.status_fechamento==='fechada'&&m.fechada_em&&new Date(m.fechada_em).toDateString()===today).reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const fechadas  = metas.filter(m=>m.status_fechamento==='fechada')
    const lucroFinalTotal = fechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    return { lucro,prej,liq:lucro-prej,lucroHoje,ativas:metas.filter(m=>(m.status||'ativa')==='ativa').length,fechadas:fechadas.length,lucroFinalTotal,ops:operators.length,totalMetas:metas.length,totalRem:remessas.length }
  },[operators,metas,remessas])

  const ranking = useMemo(()=>
    operators.map(op=>{
      const opMetas = metas.filter(m=>m.operator_id===op.id&&m.status_fechamento==='fechada')
      const ids = new Set(opMetas.map(m=>m.id))
      const opRem = remessas.filter(r=>ids.has(r.meta_id))
      const sparkData = opMetas.map(m=>Number(m.lucro_final||0))
      return { ...op, metasFechadas:opMetas.length, lucroFinal:opMetas.reduce((a,m)=>a+Number(m.lucro_final||0),0), totalRem:opRem.length, sparkData }
    }).sort((a,b)=>b.lucroFinal-a.lucroFinal)
  ,[operators,metas,remessas])

  const filteredMetas = useMemo(()=>{
    let list = metas
    if(selectedOp) list=list.filter(m=>m.operator_id===selectedOp)
    if(metaStatus==='ativa') list=list.filter(m=>(m.status||'ativa')==='ativa'&&m.status_fechamento!=='fechada')
    else if(metaStatus==='finalizada') list=list.filter(m=>m.status==='finalizada'&&m.status_fechamento!=='fechada')
    else if(metaStatus==='fechada') list=list.filter(m=>m.status_fechamento==='fechada')
    if(metaPeriod!=='all'){
      const now=new Date()
      list=list.filter(m=>{
        const d=new Date(m.created_at)
        if(metaPeriod==='today') return d.toDateString()===now.toDateString()
        if(metaPeriod==='week'){const w=new Date(now);w.setDate(w.getDate()-7);return d>=w}
        if(metaPeriod==='month'){const mo=new Date(now);mo.setDate(mo.getDate()-30);return d>=mo}
        return true
      })
    }
    return list
  },[metas,selectedOp,metaStatus,metaPeriod])

  const rankingRedes = useMemo(()=>{
    const now = new Date()
    const filteredRem = redePeriodo==='all' ? remessas : remessas.filter(r=>{
      const d = new Date(r.created_at)
      if (redePeriodo==='today') return d.toDateString()===now.toDateString()
      if (redePeriodo==='week') { const w=new Date(now); w.setDate(w.getDate()-7); return d>=w }
      if (redePeriodo==='month') { const m=new Date(now); m.setMonth(m.getMonth()-1); return d>=m }
      return true
    })
    const redeMap = {}
    metas.forEach(m=>{
      const rede = m.rede
      if (!rede) return
      if (!redeMap[rede]) redeMap[rede]={rede,lucro:0,prej:0,liq:0,nMetas:0,nRem:0,metaIds:new Set()}
      redeMap[rede].nMetas++
      redeMap[rede].metaIds.add(m.id)
    })
    filteredRem.forEach(r=>{
      const m = metas.find(x=>x.id===r.meta_id)
      if (!m?.rede || !redeMap[m.rede]) return
      const entry = redeMap[m.rede]
      if (!entry.metaIds.has(r.meta_id)) return
      entry.lucro += Number(r.lucro||0)
      entry.prej  += Number(r.prejuizo||0)
      entry.nRem++
    })
    Object.values(redeMap).forEach(e=>{ e.liq = e.lucro - e.prej; delete e.metaIds })
    return Object.values(redeMap).sort((a,b)=>b.liq-a.liq)
  },[metas,remessas,redePeriodo])

  const convStats = useMemo(()=>({
    totalMoved: remessas.reduce((a,r)=>a+Number(r.deposito||0)+Number(r.saque||0),0),
    totalMetas: metas.length,
    totalRemessas: remessas.length,
  }),[remessas,metas])

  const kpis = [
    { label:'Lucro hoje', value:`R$ ${fmt(Math.abs(global.lucroHoje))}`, sub:global.lucroHoje>=0?'Fechamentos de hoje':'Resultado negativo', color:global.lucroHoje>=0?'var(--profit)':'var(--loss)', card:global.lucroHoje>=0?'card-profit':'card-loss', badge:'ao vivo' },
    { label:'Lucro final total', value:`R$ ${fmt(global.lucroFinalTotal)}`, sub:'Metas 100% fechadas', color:'var(--brand-bright)', card:'card-primary', badge:'fechado' },
    { label:'Resultado liquido', value:`R$ ${fmt(Math.abs(global.liq))}`, sub:global.liq>=0?'Positivo':'Negativo', color:global.liq>=0?'var(--profit)':'var(--loss)', card:global.liq>=0?'card-profit':'card-loss', badge:'remessas' },
    { label:'Prejuizo total', value:`R$ ${fmt(global.prej)}`, sub:'Total acumulado', color:'var(--loss)', card:'card-loss', badge:'acumulado' },
  ]

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      {modalMeta && (
        <ModalFechamento
          meta={modalMeta}
          remessas={remessas.filter(r=>r.meta_id===modalMeta.id)}
          operador={operators.find(o=>o.id===modalMeta.operator_id)}
          onClose={()=>setModalMeta(null)}
          onSaved={loadAll}
        />
      )}

      {/* META DETAIL PANEL */}
      {focusMeta && (
        <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(4,8,16,0.92)',backdropFilter:'blur(16px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'40px 24px',overflowY:'auto'}} onClick={()=>setFocusMeta(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:900,animation:'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both'}}>
            {(()=>{
              const m=focusMeta, op=operators.find(o=>o.id===m.operator_id)
              const fechada=m.status_fechamento==='fechada', finalizada=m.status==='finalizada'
              const lucroR=focusRem.reduce((a,r)=>a+Number(r.lucro||0),0)
              const prejR=focusRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
              const liqR=lucroR-prejR
              const pct=focusRem.length>0?Math.round((focusRem.filter(r=>Number(r.resultado||0)>=0).length/focusRem.length)*100):0
              const displayVal=fechada&&m.lucro_final!=null?Number(m.lucro_final):liqR
              return (<>
                {/* Header */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <h2 style={{fontSize:22,fontWeight:900,color:'var(--t1)',margin:0}}>{m.titulo}</h2>
                    <span style={{padding:'4px 12px',borderRadius:99,fontSize:10,fontWeight:700,letterSpacing:'0.05em',background:fechada?'rgba(5,217,140,0.15)':finalizada?'rgba(240,61,107,0.1)':'rgba(79,110,247,0.1)',border:`1px solid ${fechada?'rgba(5,217,140,0.3)':finalizada?'rgba(240,61,107,0.2)':'rgba(79,110,247,0.2)'}`,color:fechada?'#05d98c':finalizada?'#f03d6b':'#6b84ff'}}>
                      {fechada?'CONCLUIDA':finalizada?'Finalizada':'Ativa'}
                    </span>
                    {!fechada&&!finalizada&&<span className="live-dot" style={{width:7,height:7}}/>}
                  </div>
                  <button onClick={()=>setFocusMeta(null)} style={{width:36,height:36,borderRadius:10,border:'1px solid var(--b2)',background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {/* Info cards */}
                <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
                  {[
                    {l:'Rede',v:m.rede||'—',c:'var(--brand-bright)'},
                    {l:'Plataforma',v:m.plataforma||'—',c:'var(--t1)'},
                    {l:'Operador',v:getName(op),c:'var(--info)'},
                    {l:'Contas',v:m.quantidade_contas||0,c:'var(--warn)'},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:14,padding:'14px 16px'}}>
                      <p className="t-label" style={{marginBottom:5}}>{l}</p>
                      <p style={{fontSize:15,fontWeight:700,color:c,margin:0,fontFamily:typeof v==='number'?'var(--mono)':'inherit'}}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* KPIs */}
                <div className="g-5" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
                  {[
                    {l:'Remessas',v:focusRem.length,c:'var(--info)'},
                    {l:'Lucro',v:`R$ ${fmt(lucroR)}`,c:'var(--profit)'},
                    {l:'Prejuizo',v:`R$ ${fmt(prejR)}`,c:'var(--loss)'},
                    {l:'Acerto',v:`${pct}%`,c:pct>=50?'var(--profit)':'var(--warn)'},
                    {l:fechada?'LUCRO FINAL':'Liquido',v:`${fechada?'+':liqR>=0?'+':''}R$ ${fmt(Math.abs(displayVal))}`,c:'#05d98c'},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:l.includes('FINAL')?'rgba(5,217,140,0.1)':'var(--surface)',border:`1px solid ${l.includes('FINAL')?'rgba(5,217,140,0.2)':'var(--b1)'}`,borderRadius:14,padding:'14px 16px',textAlign:'center'}}>
                      <p className="t-label" style={{marginBottom:5,color:l.includes('FINAL')?'#05d98c':undefined}}>{l}</p>
                      <p className="t-num" style={{fontSize:l.includes('FINAL')?22:16,fontWeight:800,color:c,margin:0}}>{v}</p>
                    </div>
                  ))}
                </div>

                {focusLoad ? (
                  <div style={{padding:40,textAlign:'center'}}><div className="spinner" style={{margin:'0 auto',borderTopColor:'var(--brand-bright)'}}/></div>
                ) : (
                <div className="g-side" style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
                  {/* Remessas */}
                  <div className="card" style={{padding:22}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                      <h3 className="t-h3" style={{fontSize:14}}>Remessas ({focusRem.length})</h3>
                      {!fechada&&<span className="live-dot" style={{width:6,height:6}}/>}
                    </div>
                    {focusRem.length===0?(
                      <p className="t-small" style={{textAlign:'center',padding:24}}>Nenhuma remessa registrada.</p>
                    ):(
                      <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:400,overflowY:'auto'}}>
                        {[...focusRem].reverse().map((r,i)=>{
                          const pos=Number(r.resultado||0)>=0
                          return (
                            <div key={r.id} className="data-row" style={{padding:'10px 14px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                                <div style={{width:28,height:28,borderRadius:7,background:pos?'var(--profit-dim)':'var(--loss-dim)',border:`1px solid ${pos?'var(--profit-border)':'var(--loss-border)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={pos?'var(--profit)':'var(--loss)'} strokeWidth="3" strokeLinecap="round"><polyline points={pos?'18 15 12 9 6 15':'6 9 12 15 18 9'}/></svg>
                                </div>
                                <div style={{minWidth:0}}>
                                  <p style={{fontSize:12,fontWeight:600,color:'var(--t1)',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.titulo||`Remessa ${focusRem.length-i}`}</p>
                                  <p className="t-small">{r.tipo} · D: R$ {fmt(r.deposito)} · S: R$ {fmt(r.saque)}</p>
                                </div>
                              </div>
                              <p className="t-num" style={{fontSize:14,fontWeight:700,color:pos?'var(--profit)':'var(--loss)',flexShrink:0}}>
                                {pos?'+':'-'}R$ {fmt(Math.abs(Number(r.resultado||0)))}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="card" style={{padding:22}}>
                    <h3 className="t-h3" style={{fontSize:14,marginBottom:14}}>Timeline</h3>
                    {focusLogs.length===0?(
                      <p className="t-small" style={{textAlign:'center',padding:24}}>Nenhum evento registrado.</p>
                    ):(
                      <div style={{display:'flex',flexDirection:'column',gap:0,maxHeight:400,overflowY:'auto'}}>
                        {focusLogs.map((log,i)=>{
                          const logOp=operators.find(o=>o.id===log.operator_id)
                          const iconMap={meta_created:'plus',meta_finalized:'flag',meta_closed:'check',meta_status_changed:'refresh',remessa_created:'dollar'}
                          const colorMap={meta_created:'var(--brand-bright)',meta_finalized:'var(--warn)',meta_closed:'var(--profit)',remessa_created:'var(--info)',meta_status_changed:'var(--t2)'}
                          const ic=iconMap[log.action]||'circle'
                          const lc=colorMap[log.action]||'var(--t2)'
                          return (
                            <div key={log.id} style={{display:'flex',gap:12,paddingBottom:16,position:'relative'}}>
                              {/* Line */}
                              {i<focusLogs.length-1&&<div style={{position:'absolute',left:13,top:28,bottom:0,width:1,background:'var(--b1)'}}/>}
                              {/* Dot */}
                              <div style={{width:26,height:26,borderRadius:8,background:`${lc}15`,border:`1px solid ${lc}30`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,zIndex:1}}>
                                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={lc} strokeWidth="2.5" strokeLinecap="round">
                                  {ic==='plus'?<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
                                  :ic==='check'?<polyline points="20 6 9 17 4 12"/>
                                  :ic==='dollar'?<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                  :ic==='flag'?<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>
                                  :<circle cx="12" cy="12" r="4"/>}
                                </svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontSize:12,fontWeight:600,color:'var(--t1)',margin:'0 0 2px'}}>{log.description}</p>
                                <p className="t-small">{getName(logOp)} · {new Date(log.created_at).toLocaleString('pt-BR')}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Meta info footer */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:20,padding:'12px 0',borderTop:'1px solid var(--b1)'}}>
                  <p className="t-small">Criada em {fmtDate(m.created_at)}{m.fechada_em?` · Fechada em ${fmtDate(m.fechada_em)}`:''}{m.observacoes?` · ${m.observacoes}`:''}</p>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>{setFocusMeta(null);setModalMeta(m)}} className="btn btn-brand btn-sm">{fechada?'Editar fechamento':'Fechar meta'}</button>
                  </div>
                </div>
              </>)
            })()}
          </div>
        </div>
      )}

      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}/>

      <div style={{ maxWidth:1380, margin:'0 auto', padding:'32px 28px' }}>
        {/* Header */}
        <div className="a1" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:28 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:99, background:'rgba(79,110,247,0.1)', border:'1px solid rgba(79,110,247,0.18)' }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--brand-bright)', letterSpacing:'0.08em' }}>ADMIN · ACESSO EXCLUSIVO</span>
              </div>
              <span className="live-dot" style={{ width:6, height:6 }}/>
              <span className="t-small">Sync a cada 30s</span>
            </div>
            <h1 className="t-h1">Painel executivo</h1>
          </div>
          <button onClick={loadAll} className="btn btn-ghost btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            Atualizar
          </button>
        </div>

        <TrialBanner tenant={tenant} subscription={sub} stats={convStats}/>
        <ConversionModal tenant={tenant} subscription={sub} stats={convStats}/>

        {/* Tabs */}
        <div className="a2 tabs-scroll" style={{ display:'flex', gap:4, marginBottom:24, background:'var(--surface)', border:'1px solid var(--b1)', borderRadius:12, padding:5, width:'fit-content' }}>
          {[['overview','Visão geral'],['operations','Metas & Fechamento'],['ranking','Ranking'],['redes','Redes'],['team','Equipe']].map(([k,l])=>{
            const active = tab===k
            return (
              <button key={k} onClick={()=>setTab(k)} style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, padding:'8px 18px', borderRadius:9, cursor:'pointer', transition:'all 0.15s', background:active?'var(--raised)':'transparent', border:active?'1px solid var(--b2)':'1px solid transparent', color:active?'var(--t1)':'var(--t3)', boxShadow:active?'0 2px 8px rgba(0,0,0,0.3)':'' }}>
                {l}
              </button>
            )
          })}
        </div>

        {/* OVERVIEW */}
        {tab==='overview' && (<div key="overview" className="tab-content">
          <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:16 }}>
            {kpis.map((k,i)=>(
              <div key={i} className={`card ${k.card} a${i+1}`} style={{ padding:'22px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <span className={`badge ${k.card.includes('profit')?'badge-profit':k.card.includes('loss')?'badge-loss':'badge-brand'}`}>{k.badge}</span>
                </div>
                <p className="t-label" style={{ marginBottom:10 }}>{k.label}</p>
                <p className="t-num" style={{ fontSize:26, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</p>
                <p className="t-small" style={{ marginTop:8 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
            {[
              { l:'Operadores', v:global.ops,       c:'var(--info)' },
              { l:'Total metas', v:global.totalMetas,c:'var(--brand-bright)' },
              { l:'Metas fechadas', v:global.fechadas, c:'var(--profit)' },
              { l:'Total remessas', v:global.totalRem, c:'var(--warn)' },
            ].map((c,i)=>(
              <div key={i} className={`a${i+1}`} style={{ background:'var(--surface)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span className="t-body" style={{ fontSize:12 }}>{c.l}</span>
                <span className="t-num" style={{ fontSize:24, fontWeight:800, color:c.c }}>{c.v}</span>
              </div>
            ))}
          </div>

          <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Últimas remessas */}
            <div className="card a3" style={{ padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                <div>
                  <h2 className="t-h3" style={{ fontSize:14 }}>Feed de remessas</h2>
                  <p className="t-small">Tempo real · todas as operações</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {remessas.slice(0,12).map((r,i)=>{
                  const m   = metas.find(x=>x.id===r.meta_id)
                  const op  = operators.find(o=>o.id===m?.operator_id)
                  const pos = Number(r.resultado||0)>=0
                  const val = Math.abs(Number(r.resultado||0))
                  const rede = m?.rede
                  const isNew = (Date.now()-new Date(r.created_at).getTime())<300000
                  return (
                    <div key={r.id} className="a1" style={{
                      animationDelay:`${i*25}ms`,
                      padding:'12px 14px', borderRadius:12,
                      background:pos?'rgba(5,217,140,0.04)':'rgba(240,61,107,0.04)',
                      border:`1px solid ${pos?'rgba(5,217,140,0.1)':'rgba(240,61,107,0.1)'}`,
                      display:'flex', alignItems:'center', gap:12,
                      transition:'all 0.2s',
                    }}>
                      {/* Operator avatar */}
                      <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{getName(op)[0]?.toUpperCase()}</span>
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>{getName(op)}</span>
                          {rede && <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'rgba(79,110,247,0.12)', color:'var(--brand-bright)', border:'1px solid rgba(79,110,247,0.2)' }}>{rede}</span>}
                          {isNew && <span style={{ fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:6, background:'rgba(5,217,140,0.15)', color:'var(--profit)', border:'1px solid rgba(5,217,140,0.25)', animation:'breathe 2s ease-in-out infinite' }}>NOVO</span>}
                        </div>
                        <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{r.titulo||'Remessa'} · {new Date(r.created_at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                      {/* Value */}
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <p className="t-num" style={{ fontSize:16, fontWeight:800, color:pos?'var(--profit)':'var(--loss)', margin:0 }}>
                          {pos?'+':'-'}R$ {fmt(val)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Operadores */}
            <div className="card a4" style={{ padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div>
                  <h2 className="t-h3" style={{ fontSize:14 }}>Operadores ativos</h2>
                  <p className="t-small">Resultado acumulado por operador</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {operators.map((op,i)=>{
                  const ids = new Set(metas.filter(m=>m.operator_id===op.id).map(m=>m.id))
                  const opRem = remessas.filter(r=>ids.has(r.meta_id))
                  const liq = opRem.reduce((a,r)=>a+Number(r.lucro||0)-Number(r.prejuizo||0),0)
                  const ativas = metas.filter(m=>m.operator_id===op.id&&(m.status||'ativa')==='ativa').length
                  return (
                    <div key={op.id} className="data-row a1" style={{ animationDelay:`${i*50}ms` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{getName(op)[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ fontSize:13, fontWeight:600, color:'var(--t1)', margin:'0 0 2px' }}>{getName(op)}</p>
                          <p className="t-small">{ativas} ativa(s) · {opRem.length} remessas</p>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p className="t-num" style={{ fontSize:15, fontWeight:700, color:liq>=0?'var(--profit)':'var(--loss)' }}>{liq>=0?'+':''}R$ {fmt(liq)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>)}

        {/* OPERATIONS — PREMIUM REDESIGN */}
        {tab==='operations' && (()=>{
          const NET_COLORS={
            COROA:{h:'42,100%,50%',hex:'#d4a017',name:'Dourado'},VOY:{h:'220,90%,60%',hex:'#3b82f6',name:'Azul'},
            WE:{h:'270,70%,60%',hex:'#8b5cf6',name:'Roxo'},W1:{h:'200,80%,55%',hex:'#0ea5e9',name:'Cyan'},
            OKOK:{h:'160,70%,45%',hex:'#10b981',name:'Verde'},DZ:{h:'0,65%,55%',hex:'#ef4444',name:'Vermelho'},
            A8:{h:'30,90%,55%',hex:'#f59e0b',name:'Laranja'},ANJO:{h:'320,60%,55%',hex:'#d946ef',name:'Pink'},
            '91':{h:'180,60%,45%',hex:'#14b8a6',name:'Teal'},'777':{h:'50,80%,55%',hex:'#eab308',name:'Amarelo'},
            '888':{h:'280,55%,55%',hex:'#a855f7',name:'Violeta'},XW:{h:'340,65%,55%',hex:'#f43f5e',name:'Rose'},
            EK:{h:'210,70%,50%',hex:'#2563eb',name:'Royal'},DY:{h:'150,60%,50%',hex:'#22c55e',name:'Lime'},
            GAME:{h:'260,60%,55%',hex:'#7c3aed',name:'Indigo'},ALFA:{h:'10,80%,55%',hex:'#f97316',name:'Amber'},
            BRA:{h:'140,50%,45%',hex:'#059669',name:'Emerald'},WP:{h:'190,60%,50%',hex:'#0891b2',name:'Oceano'},
            KK:{h:'300,50%,50%',hex:'#c026d3',name:'Magenta'},MK:{h:'170,55%,45%',hex:'#0d9488',name:'Agua'},
            DEFAULT:{h:'220,60%,55%',hex:'#6366f1',name:'Indigo'},
          }
          function getNC(rede){return NET_COLORS[rede]||NET_COLORS.DEFAULT}
          return (
          <div key="operations" className="tab-content">
            {/* Filters */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24,flexWrap:'wrap'}}>
              <select className="input" value={selectedOp||''} onChange={e=>setSelectedOp(e.target.value||null)} style={{width:170,padding:'8px 14px',fontSize:12}}>
                <option value="">Todos operadores</option>
                {operators.map(op=><option key={op.id} value={op.id}>{getName(op)}</option>)}
              </select>
              {[['all','Todas'],['ativa','Ativas'],['finalizada','Finalizadas'],['fechada','Fechadas']].map(([k,l])=>(
                <button key={k} onClick={()=>setMetaStatus(k)} className={`btn btn-sm ${metaStatus===k?'btn-brand':'btn-ghost'}`}>{l}</button>
              ))}
              <div style={{display:'flex',gap:4,background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:10,padding:4,marginLeft:'auto'}}>
                {[['all','Tudo'],['today','Hoje'],['week','7 dias'],['month','30 dias']].map(([k,l])=>(
                  <button key={k} onClick={()=>setMetaPeriod(k)} style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,padding:'5px 12px',borderRadius:7,cursor:'pointer',transition:'all 0.15s',border:'none',background:metaPeriod===k?'var(--raised)':'transparent',color:metaPeriod===k?'var(--t1)':'var(--t3)'}}>{l}</button>
                ))}
              </div>
            </div>

            {/* Grid — Minimal Cards */}
            <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
              {filteredMetas.map((m,i)=>{
                const mRem=remessas.filter(r=>r.meta_id===m.id)
                const lucroR=mRem.reduce((a,r)=>a+Number(r.lucro||0),0)
                const prejR=mRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
                const liqR=lucroR-prejR
                const fechada=m.status_fechamento==='fechada'
                const nc=getNC(m.rede)
                const totalContas=m.quantidade_contas||0
                const remDone=mRem.length
                const depDone=fechada?totalContas:Math.min(remDone,totalContas)
                const progPct=fechada?100:(totalContas>0?Math.min(100,(depDone/totalContas)*100):0)
                const displayVal=fechada&&m.lucro_final!=null?Number(m.lucro_final):liqR
                const isPos=fechada||liqR>=0
                const metaDate=new Date(m.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})

                return (
                  <div key={m.id} className="meta-card" onClick={()=>openMetaDetail(m)} style={{
                    animationDelay:`${i*45}ms`,
                    borderRadius:18,overflow:'hidden',position:'relative',
                    background:`linear-gradient(160deg, hsla(${nc.h},0.32) 0%, hsla(${nc.h},0.15) 45%, #0a1220 100%)`,
                    border:`1px solid hsla(${nc.h},0.4)`,
                    boxShadow:`0 0 25px hsla(${nc.h},0.1), 0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 hsla(${nc.h},0.12)`,
                    transition:'all 0.3s cubic-bezier(0.33,1,0.68,1)',
                    cursor:'pointer',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px) scale(1.015)';e.currentTarget.style.boxShadow=`0 0 50px hsla(${nc.h},0.2), 0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 hsla(${nc.h},0.18)`;e.currentTarget.style.borderColor=`hsla(${nc.h},0.55)`}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`0 0 25px hsla(${nc.h},0.1), 0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 hsla(${nc.h},0.12)`;e.currentTarget.style.borderColor=`hsla(${nc.h},0.4)`}}
                  >
                    {/* Accent bar */}
                    <div style={{height:3,background:`linear-gradient(90deg, ${nc.hex}, ${nc.hex}88)`}}/>

                    <div style={{padding:'18px 20px 16px',position:'relative',zIndex:1}}>
                      {/* Row 1: DEP + Rede + Status */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:nc.hex,boxShadow:`0 0 8px ${nc.hex}88`}}/>
                          <span style={{fontSize:15,fontWeight:900,color:nc.hex,letterSpacing:'0.02em'}}>{totalContas} DEP {m.rede||'—'}</span>
                        </div>
                        <span style={{
                          fontSize:9,fontWeight:700,letterSpacing:'0.05em',
                          padding:'2px 8px',borderRadius:99,
                          background:fechada?'rgba(5,217,140,0.18)':'rgba(255,255,255,0.06)',
                          color:fechada?'#05d98c':'var(--t3)',
                          border:`1px solid ${fechada?'rgba(5,217,140,0.3)':'var(--b1)'}`,
                        }}>
                          {fechada?'Concluida':(m.status||'ativa')==='ativa'?'Ativa':'Finalizada'}
                        </span>
                      </div>

                      {/* Date */}
                      <p style={{fontSize:10,color:'var(--t4)',margin:'0 0 14px',paddingLeft:14}}>{metaDate}</p>

                      {/* Progress bar */}
                      <div style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:5}}>
                          <span style={{fontSize:11,fontWeight:600,color:fechada?'var(--t3)':nc.hex+'99',fontFamily:'var(--mono)'}}>{fechada?`${totalContas}/${totalContas}`:`${depDone}/${totalContas}`}</span>
                        </div>
                        <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
                          <div style={{
                            height:'100%',borderRadius:99,
                            width:`${progPct}%`,
                            background:fechada?'linear-gradient(90deg, #05d98c, #34d399)':`linear-gradient(90deg, ${nc.hex}, ${nc.hex}bb)`,
                            boxShadow:fechada?'0 0 10px rgba(5,217,140,0.3)':`0 0 6px ${nc.hex}30`,
                            transition:'width 1s cubic-bezier(0.4,0,0.2,1)',
                          }}/>
                        </div>
                      </div>

                      {/* Result — right aligned, sofisticado */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
                        <span style={{
                          fontFamily:'var(--mono)',fontSize:20,fontWeight:800,
                          color:isPos?'#05d98c':'#f03d6b',
                          opacity:0.9,
                        }}>
                          {isPos?'+':''}R$ {fmt(Math.abs(displayVal))}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {filteredMetas.length===0 && (
              <div style={{border:'1px dashed var(--b2)',borderRadius:16,padding:64,textAlign:'center'}}>
                <p className="t-small">Nenhuma meta encontrada.</p>
              </div>
            )}
          </div>
          )
        })()}

        {/* RANKING */}
        {tab==='ranking' && (
          <div key="ranking" className="tab-content">
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'var(--warn-dim)', border:'1px solid var(--warn-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.5" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2.34"/><path d="M14 14.66V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.34"/><path d="M6 4v10"/><path d="M18 4v10"/><path d="M12 1v3"/><path d="M9 4h6"/></svg>
              </div>
              <div>
                <h2 className="t-h2" style={{ margin:'0 0 3px' }}>Ranking de operadores</h2>
                <p className="t-small">Baseado no lucro final de metas fechadas pelo admin</p>
              </div>
            </div>

            {ranking.filter(o=>o.metasFechadas>0).length===0 ? (
              <div style={{ border:'1px dashed var(--b2)', borderRadius:16, padding:64, textAlign:'center' }}>
                <p style={{ color:'var(--t2)', fontSize:14, fontWeight:600, marginBottom:4 }}>Nenhuma meta fechada ainda</p>
                <p className="t-small">Feche metas na aba "Metas & Fechamento" para ver o ranking.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {ranking.map((op,i)=>{
                  const medals = ['#FFD700','#C0C0C0','#CD7F32']
                  const medal  = medals[i]
                  const isTop  = i < 3
                  const maxL   = ranking[0]?.lucroFinal||1
                  const barW   = Math.max(3,(op.lucroFinal/maxL)*100)
                  return (
                    <div key={op.id} className="card a1" style={{ animationDelay:`${i*55}ms`, padding:'22px 26px', border:isTop?`1px solid ${medal}22`:'1px solid var(--b1)', background:isTop?`rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.03)`:'var(--surface)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                        {/* Badge */}
                        <div style={{ width:54, height:54, borderRadius:15, background:isTop?`${medal}15`:'var(--raised)', border:`2px solid ${isTop?medal:' var(--b2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {isTop
                            ? <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={medal} strokeWidth="1.5" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2.34"/><path d="M14 14.66V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.34"/><path d="M6 4v10"/><path d="M18 4v10"/></svg>
                            : <span style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:20, color:'var(--t4)' }}>#{i+1}</span>
                          }
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <span style={{ fontSize:12, fontWeight:800, color:'white' }}>{getName(op)[0].toUpperCase()}</span>
                            </div>
                            <p style={{ fontSize:16, fontWeight:800, color:isTop?medal:'var(--t1)', margin:0, letterSpacing:'-0.02em' }}>{getName(op)}</p>
                            {i===0 && <span className="badge badge-warn">Líder</span>}
                          </div>
                          <p className="t-small" style={{ marginBottom:12 }}>{op.email}</p>
                          <div className="progress" style={{ height:4 }}>
                            <div className="progress-bar" style={{ width:`${barW}%`, background:isTop?`linear-gradient(90deg,${medal},${medal}88)`:'linear-gradient(90deg,var(--brand),var(--brand-bright))' }}/>
                          </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, flexShrink:0 }}>
                          {[
                            { l:'Metas fechadas', v:op.metasFechadas, c:'var(--info)' },
                            { l:'Remessas',       v:op.totalRem,      c:'var(--warn)' },
                            { l:'Lucro final',    v:`R$ ${fmt(op.lucroFinal)}`, c:isTop?medal:'var(--profit)' },
                          ].map(({l,v,c})=>(
                            <div key={l} style={{ background:'var(--raised)', border:'1px solid var(--b1)', borderRadius:10, padding:'11px 16px', textAlign:'center', minWidth:110 }}>
                              <p className="t-label" style={{ fontSize:9, marginBottom:5 }}>{l}</p>
                              <p className="t-num" style={{ fontSize:14, fontWeight:700, color:c }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {/* RANKING REDES */}
        {tab==='redes' && (
          <div key="redes" className="tab-content">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,rgba(5,217,140,0.15),rgba(79,110,247,0.12))', border:'1px solid var(--profit-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="1.5" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                </div>
                <div>
                  <h2 className="t-h2" style={{ margin:'0 0 3px' }}>Ranking de Redes</h2>
                  <p className="t-small">Performance financeira por rede de operacao</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:4, background:'var(--surface)', border:'1px solid var(--b1)', borderRadius:10, padding:4 }}>
                {[['all','Todos'],['today','Hoje'],['week','Semana'],['month','Mes']].map(([k,l])=>(
                  <button key={k} onClick={()=>setRedePeriodo(k)} style={{
                    fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, padding:'6px 14px', borderRadius:7, cursor:'pointer',
                    transition:'all 0.15s', border:'none',
                    background:redePeriodo===k?'var(--raised)':'transparent',
                    color:redePeriodo===k?'var(--t1)':'var(--t3)',
                    boxShadow:redePeriodo===k?'0 2px 8px rgba(0,0,0,0.3)':'',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {rankingRedes.length===0 ? (
              <div style={{ border:'1px dashed var(--b2)', borderRadius:16, padding:64, textAlign:'center' }}>
                <p style={{ color:'var(--t2)', fontSize:14, fontWeight:600, marginBottom:4 }}>Nenhuma rede encontrada</p>
                <p className="t-small">Crie metas com o campo "Rede" preenchido para ver o ranking.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {rankingRedes.map((r,i)=>{
                  const isTop1 = i===0
                  const isTop3 = i<3
                  const medals = ['#FFD700','#C0C0C0','#CD7F32']
                  const medal = medals[i]
                  const maxLiq = Math.max(Math.abs(rankingRedes[0]?.liq)||1, 1)
                  const barW = Math.max(3, (Math.abs(r.liq)/maxLiq)*100)
                  const pos = r.liq>=0

                  return (
                    <div key={r.rede} className="card a1" style={{
                      animationDelay:`${i*50}ms`,
                      padding: isTop1?'0':'22px 26px',
                      border: isTop1?'1px solid rgba(255,215,0,0.3)':isTop3?`1px solid ${medal}22`:'1px solid var(--b1)',
                      background: isTop1?'var(--surface)':'var(--surface)',
                      overflow:'hidden',
                    }}>
                      {/* TOP 1 glow header */}
                      {isTop1 && (
                        <div style={{
                          background:'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(5,217,140,0.08),rgba(79,110,247,0.06))',
                          borderBottom:'1px solid rgba(255,215,0,0.15)',
                          padding:'16px 26px',
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          position:'relative', overflow:'hidden',
                        }}>
                          <div style={{ position:'absolute', top:'-50%', left:'-20%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,215,0,0.08),transparent 70%)', pointerEvents:'none' }}/>
                          <div style={{ display:'flex', alignItems:'center', gap:12, position:'relative', zIndex:1 }}>
                            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2.34"/><path d="M14 14.66V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.34"/><path d="M6 4v10"/><path d="M18 4v10"/></svg>
                            <span style={{ fontSize:12, fontWeight:800, color:'#FFD700', letterSpacing:'0.08em' }}>REDE #1 — MELHOR PERFORMANCE</span>
                          </div>
                          <span className="badge badge-warn" style={{ animation:'cta-pulse 2.5s ease-in-out infinite' }}>TOP</span>
                        </div>
                      )}

                      <div style={{ padding:isTop1?'22px 26px':'0', display:'flex', alignItems:'center', gap:20 }}>
                        {/* Position */}
                        <div style={{
                          width:54, height:54, borderRadius:15, flexShrink:0,
                          background:isTop1?'linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,215,0,0.08))':isTop3?`${medal}15`:'var(--raised)',
                          border:`2px solid ${isTop3?medal:'var(--b2)'}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:isTop1?'0 0 30px rgba(255,215,0,0.2), 0 0 60px rgba(255,215,0,0.08)':'none',
                          animation:isTop1?'glow-brand 3s ease-in-out infinite':'none',
                        }}>
                          {isTop3 ? (
                            <span style={{ fontSize:20, fontWeight:900, color:medal, fontFamily:'Inter,sans-serif' }}>#{i+1}</span>
                          ) : (
                            <span style={{ fontSize:20, fontWeight:800, color:'var(--t4)', fontFamily:'Inter,sans-serif' }}>#{i+1}</span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                            <p style={{ fontSize:isTop1?22:16, fontWeight:900, color:isTop1?'#FFD700':isTop3?medal:'var(--t1)', margin:0, letterSpacing:'-0.02em' }}>{r.rede}</p>
                            {isTop1 && <span className="badge badge-warn" style={{ fontSize:10 }}>Lider</span>}
                          </div>
                          <p className="t-small" style={{ marginBottom:10 }}>{r.nMetas} meta(s) · {r.nRem} remessa(s)</p>
                          <div className="progress" style={{ height:5 }}>
                            <div className="progress-bar" style={{
                              width:`${barW}%`,
                              background:isTop1?'linear-gradient(90deg,#FFD700,#f5a623)':pos?'linear-gradient(90deg,var(--profit),#34d399)':'linear-gradient(90deg,var(--loss),#f87171)',
                            }}/>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, flexShrink:0 }}>
                          {[
                            { l:'Lucro', v:`R$ ${fmt(r.lucro)}`, c:'var(--profit)' },
                            { l:'Prejuizo', v:`R$ ${fmt(r.prej)}`, c:'var(--loss)' },
                            { l:'Resultado', v:`${r.liq>=0?'+':''}R$ ${fmt(Math.abs(r.liq))}`, c:isTop1&&pos?'#FFD700':pos?'var(--profit)':'var(--loss)' },
                          ].map(({l,v,c})=>(
                            <div key={l} style={{
                              background:isTop1&&l==='Resultado'?'rgba(255,215,0,0.06)':'var(--raised)',
                              border:`1px solid ${isTop1&&l==='Resultado'?'rgba(255,215,0,0.15)':'var(--b1)'}`,
                              borderRadius:10, padding:'11px 16px', textAlign:'center', minWidth:110,
                            }}>
                              <p className="t-label" style={{ fontSize:9, marginBottom:5 }}>{l}</p>
                              <p className="t-num" style={{ fontSize:isTop1&&l==='Resultado'?16:14, fontWeight:700, color:c }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TEAM */}
        {tab==='team' && (
          <div key="team" className="tab-content">
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'var(--brand-dim)', border:'1px solid var(--brand-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h2 className="t-h2" style={{ margin:'0 0 3px' }}>Equipe</h2>
                <p className="t-small">Gerencie operadores e convites do seu tenant</p>
              </div>
            </div>

            <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {/* Invite */}
              <div className="card" style={{ padding:24 }}>
                <h3 className="t-h3" style={{ fontSize:14, marginBottom:6 }}>Gerar link de convite</h3>
                <p className="t-small" style={{ marginBottom:16 }}>Envie o link para o operador. Ele cria a conta e aceita entrar na sua equipe.</p>
                <button onClick={sendInvite} className="btn btn-brand" disabled={invSaving} style={{ width:'100%', justifyContent:'center', marginBottom:12 }}>
                  {invSaving ? 'Gerando...' : <><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Gerar novo link</>}
                </button>
                {invMsg && <div className={invMsg.startsWith('Erro')?'alert-error':'alert-success'} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>{invMsg}</div>}

                {/* Pending invites */}
                {invites.filter(i=>i.status==='pending').length > 0 && (
                  <div style={{ marginTop:20 }}>
                    <p className="t-label" style={{ marginBottom:10 }}>Links ativos ({invites.filter(i=>i.status==='pending').length})</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {invites.filter(i=>i.status==='pending').map(inv=>(
                        <div key={inv.id} className="data-row" style={{ padding:'10px 14px' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--t2)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>/invite?token={inv.token.slice(0,12)}...</p>
                            <p className="t-small">{new Date(inv.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/invite?token=${inv.token}`);setInvMsg('Link copiado!')}} className="btn btn-ghost btn-sm" style={{ padding:'5px 8px' }}>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                            <button onClick={()=>deleteInvite(inv.id)} className="btn btn-danger btn-sm" style={{ padding:'5px 8px' }}>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Operators list */}
              <div className="card" style={{ padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <h3 className="t-h3" style={{ fontSize:14 }}>Operadores ({operators.length})</h3>
                  <span className="badge badge-profit">{operators.length} ativos</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {operators.length===0 ? (
                    <div style={{ border:'1px dashed var(--b2)', borderRadius:12, padding:40, textAlign:'center' }}>
                      <p className="t-small">Nenhum operador ainda. Envie um convite.</p>
                    </div>
                  ) : operators.map((op,i)=>(
                    <div key={op.id} className="data-row" style={{ animationDelay:`${i*30}ms` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:12, fontWeight:800, color:'white' }}>{getName(op)[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ fontSize:13, fontWeight:600, color:'var(--t1)', margin:0 }}>{getName(op)}</p>
                          <p className="t-small">{op.email}</p>
                        </div>
                      </div>
                      <span className="badge badge-brand" style={{ fontSize:9 }}>{op.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification toast */}
      {notification && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:10001,
          padding:'16px 20px', borderRadius:16, maxWidth:360,
          background:notification.pos?'rgba(5,217,140,0.12)':'rgba(240,61,107,0.12)',
          border:`1px solid ${notification.pos?'rgba(5,217,140,0.25)':'rgba(240,61,107,0.25)'}`,
          backdropFilter:'blur(20px)',
          boxShadow:`0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${notification.pos?'rgba(5,217,140,0.1)':'rgba(240,61,107,0.1)'}`,
          animation:'fade-up 0.3s cubic-bezier(0.33,1,0.68,1) both',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,rgba(79,110,247,0.3),rgba(124,92,252,0.2))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <span style={{fontSize:13,fontWeight:800,color:'white'}}>{notification.op[0]?.toUpperCase()}</span>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
              <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{notification.op}</span>
              {notification.rede && <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:5,background:'rgba(79,110,247,0.12)',color:'var(--brand-bright)'}}>{notification.rede}</span>}
            </div>
            <p style={{fontSize:11,color:'var(--t3)',margin:0}}>Nova remessa registrada</p>
          </div>
          <span className="t-num" style={{fontSize:16,fontWeight:800,color:notification.pos?'var(--profit)':'var(--loss)',flexShrink:0}}>
            {notification.pos?'+':'-'}R$ {fmt(notification.val)}
          </span>
        </div>
      )}
    </main>
  )
}

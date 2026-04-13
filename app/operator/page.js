'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { notifyMetaCreated } from '../../lib/notify'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

function CountUp({ value, prefix='', suffix='', duration=1200, isNegative=false, integer=false }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(null)
  useEffect(() => {
    const num = Math.abs(Number(value||0))
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now-start)/duration, 1)
      const ease = 1-Math.pow(1-progress,3)
      const current = num*ease
      setDisplay(integer ? String(Math.round(current)) : fmt(current))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return <span>{prefix}{isNegative?'-':''}{display}{suffix}</span>
}

function MetricIcon({ type, color, rgb, hovered }) {
  const icons = {
    profit: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    target: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    box:    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    bolt:   <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    chart:  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  }
  return (
    <div style={{
      width:44, height:44, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center',
      background:`radial-gradient(circle at 30% 30%, rgba(${rgb},0.13), rgba(${rgb},0.03))`,
      border:`1px solid rgba(${rgb},0.2)`,
      boxShadow: hovered ? `0 0 24px rgba(${rgb},0.18), 0 8px 32px rgba(${rgb},0.08), inset 0 1px 0 rgba(${rgb},0.1)` : `0 0 12px rgba(${rgb},0.06), inset 0 1px 0 rgba(${rgb},0.06)`,
      transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      transform: hovered ? 'scale(1.08) rotate(-3deg)' : 'scale(1) rotate(0deg)',
    }}>
      {icons[type]||icons.chart}
    </div>
  )
}

function MetricCard({ iconType, label, value, sub, color, badge, animClass='a1', onClick }) {
  const cfg = {
    profit: { card:'card-profit', text:'var(--profit)', rgb:'5,217,140', border:'var(--profit-border)', badge:'badge-profit' },
    loss:   { card:'card-loss',   text:'var(--loss)',   rgb:'240,61,107', border:'var(--loss-border)', badge:'badge-loss' },
    brand:  { card:'card-primary',text:'var(--brand-bright)', rgb:'79,110,247', border:'var(--brand-border)', badge:'badge-brand' },
    info:   { card:'card-info',   text:'var(--info)',   rgb:'56,182,255', border:'var(--info-border)', badge:'badge-info' },
    warn:   { card:'card-warn',   text:'var(--warn)',   rgb:'245,166,35', border:'var(--warn-border)', badge:'badge-warn' },
  }[color] || { card:'', text:'var(--t1)', rgb:'255,255,255', border:'var(--b1)', badge:'badge-neutral' }

  const [h, setH] = useState(false)
  const isNeg = String(value).includes('-')
  const num = parseFloat(String(value).replace(/[R$\s]/g,'').replace(/\./g,'').replace(',','.'))
  const hasCurrency = String(value).includes('R$')

  return (
    <div className={`card ${cfg.card} ${animClass} shine-card`} onClick={onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        padding:'26px', cursor:onClick?'pointer':'default',
        boxShadow: h ? `0 0 40px rgba(${cfg.rgb},0.18), 0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)` : `0 0 15px rgba(${cfg.rgb},0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: h ? 'translateY(-6px) scale(1.02)' : 'none',
        transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
      {/* Ambient light */}
      <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, rgba(${cfg.rgb},${h?0.12:0.05}), transparent 70%)`, transition:'all 0.4s', pointerEvents:'none' }}/>
      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
          <MetricIcon type={iconType} color={cfg.text} rgb={cfg.rgb} hovered={h}/>
          {badge && <span className={`badge ${cfg.badge}`}>{badge}</span>}
        </div>
        <p className="t-label" style={{ marginBottom:10 }}>{label}</p>
        <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:28, fontWeight:700, color:cfg.text, lineHeight:1, letterSpacing:'-0.02em', animation:h?'count-in 0.3s ease both':'', transition:'all 0.3s' }}>
          {hasCurrency ? <CountUp value={num} prefix={isNeg?'−R$ ':'R$ '} isNegative={false}/> : value}
        </p>
        {sub && <p style={{ fontSize:11, color:'var(--t3)', marginTop:8 }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function OperatorPage() {
  const router = useRouter()
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [metas,   setMetas]   = useState([])
  const [remessas,setRemessas]= useState([])
  const [loading, setLoading] = useState(true)
  const [titulo,  setTitulo]  = useState('')
  const [obs,     setObs]     = useState('')
  const [contas,  setContas]  = useState('10')
  const [plataforma,setPlataforma]=useState('')
  const [rede,    setRede]    = useState('')
  const [redeOpen,setRedeOpen]= useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [showForm,setShowForm]= useState(false)
  const redeRef = useRef(null)

  const REDES = ['WE','W1','VOY','91','DZ','A8','OKOK','ANJO','XW','EK','DY','777','888','WP','BRA','GAME','ALFA','KK','MK','M9','KF','PU','COROA','MANGA','AA','FP']

  useEffect(()=>{
    function handleClickOutside(e){ if(redeRef.current&&!redeRef.current.contains(e.target)) setRedeOpen(false) }
    document.addEventListener('mousedown',handleClickOutside)
    return()=>document.removeEventListener('mousedown',handleClickOutside)
  },[])

  useEffect(()=>{
    load()
    // Reload when tab gains focus (prevents stale data)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  },[])

  async function load() {
    setLoading(true)
    const { data:s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data:p } = await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle()
    setProfile(p)
    // Fetch metas first, then remessas only for operator's metas
    const { data:m } = await supabase.from('metas').select('*').eq('operator_id',u.id).order('created_at',{ascending:false})
    const activeMetas = (m||[]).filter(x=>!x.deleted_at)
    setMetas(activeMetas)
    const metaIds = activeMetas.map(x=>x.id)
    let allRem = []
    if (metaIds.length > 0) {
      const { data:r } = await supabase.from('remessas').select('lucro,prejuizo,resultado,meta_id,created_at').in('meta_id',metaIds).order('created_at',{ascending:false})
      allRem = r || []
    }
    setRemessas(allRem)
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!titulo.trim()||!plataforma.trim()||!rede) {
      setError(!plataforma.trim()?'Preencha a plataforma':!rede?'Selecione a rede':'Preencha o titulo')
      return
    }
    setSaving(true); setError('')
    const { data, error:err } = await supabase.from('metas').insert({
      operator_id:user.id, titulo:titulo.trim(),
      observacoes:obs.trim()||null,
      plataforma:plataforma.trim(),
      rede,
      quantidade_contas:Number(contas||10), status:'ativa',
      tenant_id:profile?.tenant_id,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    setTitulo(''); setObs(''); setContas('10'); setPlataforma(''); setRede(''); setShowForm(false)
    notifyMetaCreated(profile?.tenant_id, getName(profile), data.quantidade_contas, data.rede)
    router.push(`/meta/${data.id}`)
  }

  const stats = useMemo(()=>{
    const lucro = remessas.reduce((a,r)=>a+Number(r.lucro||0),0)
    const prej  = remessas.reduce((a,r)=>a+Number(r.prejuizo||0),0)
    const today = new Date().toISOString().slice(0,10) // YYYY-MM-DD
    const remHoje = remessas.filter(r=>(r.created_at||'').slice(0,10)===today)
    const lucroHoje = remHoje.reduce((a,r)=>{
      const res = r.resultado != null ? Number(r.resultado) : (Number(r.lucro||0) - Number(r.prejuizo||0))
      return a + res
    },0)
    const ativas = metas.filter(m=>(m.status||'ativa')==='ativa').length
    const positivas = remessas.filter(r=>{
      const res = r.resultado != null ? Number(r.resultado) : (Number(r.lucro||0) - Number(r.prejuizo||0))
      return res > 0
    }).length
    const taxa = remessas.length>0?Math.round((positivas/remessas.length)*100):0
    return { lucro, prej, liq:lucro-prej, lucroHoje, ativas, taxa, total:metas.length, nRem:remessas.length }
  },[metas,remessas])

  const liqColor = stats.liq>=0?'profit':'loss'
  const hojeColor = stats.lucroHoje>=0?'profit':'loss'

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role==='admin'} userId={user?.id} tenantId={profile?.tenant_id}>

      <div style={{ maxWidth:1380, margin:'0 auto', padding:'32px 28px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:'var(--t1)', margin:'0 0 4px' }}>
              Ola, {getName(profile)}
            </h1>
            <p style={{ fontSize:13, color:'var(--t3)', margin:0 }}>
              {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={load} className="btn btn-ghost btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              Atualizar
            </button>
            <button onClick={()=>setShowForm(!showForm)} className={`btn ${showForm?'btn-ghost':'btn-brand'}`} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {showForm?'Fechar':'Nova meta'}
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          {[
            { label:'Resultado hoje', value:Math.abs(stats.lucroHoje), prefix:`${stats.lucroHoje>=0?'+':'-'}R$ `, color:stats.lucroHoje>=0?'var(--profit)':'var(--loss)', sub:stats.lucroHoje>=0?'Lucro do dia':'Prejuizo do dia' },
            { label:'Metas ativas', value:stats.ativas, prefix:'', suffix:'', color:'var(--t1)', sub:`${stats.total} total`, int:true },
            { label:'Remessas', value:stats.nRem, prefix:'', suffix:'', color:'var(--t1)', sub:'Total registradas', int:true },
            { label:'Total de depositantes', value:metas.filter(m=>m.status_fechamento==='fechada').reduce((a,m)=>a+Number(m.quantidade_contas||0),0), prefix:'', suffix:'', color:'var(--t1)', sub:`${metas.filter(m=>m.status_fechamento==='fechada').length} metas fechadas`, int:true },
          ].map((k,i)=>(
            <motion.div key={i}
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.35, delay:i*0.06, ease:[0.33,1,0.68,1] }}
              whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(0,0,0,0.45)', transition:{duration:0.2} }}
              style={{
                padding:'24px 26px', borderRadius:14,
                background:'linear-gradient(145deg, var(--surface), var(--void))',
                border:'1px solid var(--b1)',
                boxShadow:'0 2px 12px rgba(0,0,0,0.25)',
                transition:'all 0.2s ease',
                cursor:'default',
              }}>
              <p style={{ fontSize:11, color:'var(--t3)', marginBottom:12, fontWeight:500 }}>{k.label}</p>
              <p style={{ fontFamily:'var(--mono)', fontSize:24, fontWeight:800, color:k.color, margin:0, lineHeight:1 }}>
                <CountUp value={k.value} prefix={k.prefix||''} suffix={k.suffix||''} integer={!!k.int}/>
              </p>
              <p style={{ fontSize:11, color:'var(--t4)', marginTop:10 }}>{k.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ padding:26, marginBottom:24, borderRadius:14, background:'var(--surface)', border:'1px solid var(--b1)' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:'0 0 4px' }}>Iniciar nova meta</h2>
            <p style={{ fontSize:12, color:'var(--t3)', margin:'0 0 20px' }}>Ao criar, voce vai direto para a pagina da meta</p>
            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Row 1 */}
              <div className="g-form" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Plataforma *</label>
                  <input className="input" value={plataforma} onChange={e=>setPlataforma(e.target.value)} placeholder="Nome da plataforma" required/>
                </div>
                <div ref={redeRef} style={{ position:'relative' }}>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Rede *</label>
                  <button type="button" onClick={()=>setRedeOpen(!redeOpen)}
                    style={{
                      width:'100%', background:'var(--void)', border:`1px solid ${redeOpen?'var(--brand)':'var(--b2)'}`,
                      borderRadius:11, color:rede?'var(--t1)':'var(--t4)', fontSize:14, fontWeight:500,
                      padding:'12px 16px', outline:'none', cursor:'pointer', textAlign:'left',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      transition:'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                      boxShadow:redeOpen?'0 0 0 3px rgba(59,130,246,0.1), 0 0 20px rgba(59,130,246,0.06)':'none',
                      background:redeOpen?'rgba(59,130,246,0.04)':'var(--void)',
                    }}>
                    <span>{rede||'Selecione a rede'}</span>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      style={{ transition:'transform 0.25s ease', transform:redeOpen?'rotate(180deg)':'rotate(0)' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {redeOpen && (
                    <div style={{
                      position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:100,
                      background:'var(--raised)', border:'1px solid var(--b2)', borderRadius:14,
                      boxShadow:'0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)',
                      maxHeight:260, overflowY:'auto', padding:6,
                      animation:'scale-in 0.2s cubic-bezier(0.4,0,0.2,1) both',
                    }}>
                      {REDES.map(r=>(
                        <button key={r} type="button"
                          onClick={()=>{setRede(r);setRedeOpen(false)}}
                          onMouseEnter={e=>{e.currentTarget.style.background=rede===r?'':'var(--overlay)'}}
                          onMouseLeave={e=>{e.currentTarget.style.background=rede===r?'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(59,130,246,0.18))':''}}
                          style={{
                            width:'100%', display:'block', padding:'9px 14px', border:'none', borderRadius:9,
                            textAlign:'left', cursor:'pointer', fontSize:13, fontWeight:rede===r?700:500,
                            color:rede===r?'white':'var(--t2)',
                            background:rede===r?'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(59,130,246,0.18))':'transparent',
                            transition:'background 0.12s, color 0.12s',
                          }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Row 2 */}
              <div className="g-form" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 130px', gap:14 }}>
                <div>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Titulo *</label>
                  <input className="input" value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex: Meta Abril — VOY 5543" required/>
                </div>
                <div>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Observacoes</label>
                  <input className="input" value={obs} onChange={e=>setObs(e.target.value)} placeholder="Detalhes opcionais..."/>
                </div>
                <div>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Qtd. Contas</label>
                  <input className="input" type="number" min="1" value={contas} onChange={e=>setContas(e.target.value)}/>
                </div>
              </div>
              {/* Submit */}
              <button type="submit" className="btn btn-brand btn-lg" disabled={saving||!titulo.trim()||!plataforma.trim()||!rede} style={{ width:'100%', justifyContent:'center' }}>
                {saving?<><div className="spinner" style={{ width:14,height:14,borderTopColor:'white' }}/> Criando...</>:<><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Iniciar meta</>}
              </button>
            </form>
            {error && <div className="alert-error" style={{ marginTop:14, display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
          </div>
        )}

        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
          {/* Metas */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <h2 className="t-h3">Centro de metas</h2>
                <p className="t-small" style={{ marginTop:2 }}>Performance individual em tempo real</p>
              </div>
              <span style={{ fontSize:11, color:'var(--t3)' }}>{stats.ativas} ativas</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {loading ? (
                <div style={{ padding:60, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <div className="spinner" style={{ borderTopColor:'var(--brand-bright)' }}/>
                  <p className="t-small">Carregando...</p>
                </div>
              ) : metas.length===0 ? (
                <div style={{ border:'1px dashed var(--b2)', borderRadius:16, padding:60, textAlign:'center' }}>
                  <div style={{ width:48,height:48,borderRadius:12,background:'var(--raised)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  </div>
                  <p style={{ color:'var(--t2)',fontSize:14,fontWeight:600,marginBottom:4 }}>Nenhuma meta criada</p>
                  <p className="t-small" style={{ marginBottom:20 }}>Inicie sua primeira operação agora.</p>
                  <button onClick={()=>setShowForm(true)} className="btn btn-brand">+ Criar primeira meta</button>
                </div>
              ) : metas.map((m,i)=>{
                const mRem  = remessas.filter(r=>r.meta_id===m.id)
                const lucro = mRem.reduce((a,r)=>a+Number(r.lucro||0),0)
                const prej  = mRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
                const liq   = lucro-prej
                const pct   = (lucro+prej)>0?Math.round((lucro/(lucro+prej))*100):0
                const fechada   = m.status_fechamento==='fechada'
                const finalizada = m.status==='finalizada'
                return (
                  <motion.div key={m.id}
                    initial={{ opacity:0, y:10 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.3, delay:i*0.04, ease:[0.33,1,0.68,1] }}
                    whileHover={{ y:-2, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', transition:{duration:0.15} }}
                    className="row-card" style={{ padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', transition:'all 0.2s ease' }}
                    onClick={()=>router.push(`/meta/${m.id}`)}>
                    <div className="accent" style={{ background:fechada?'var(--profit)':finalizada?'var(--loss)':'var(--t3)' }}/>
                    <div style={{ paddingLeft:14 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <h3 style={{ fontSize:14,fontWeight:700,color:'var(--t1)',margin:0,letterSpacing:'-0.01em' }}>{m.titulo}</h3>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:6, background:fechada?'var(--profit-dim)':finalizada?'var(--loss-dim)':'var(--raised)', color:fechada?'var(--profit)':finalizada?'var(--loss)':'var(--t2)', border:`1px solid ${fechada?'var(--profit-border)':finalizada?'var(--loss-border)':'var(--b1)'}` }}>
                            {fechada?'Fechada':finalizada?'Finalizada':'Ativa'}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span className="t-num" style={{ fontSize:16,fontWeight:700,color:liq>=0?'var(--profit)':'var(--loss)' }}>
                            {liq>=0?'+':''}R$ {fmt(liq)}
                          </span>
                          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                        {m.plataforma && <span className="badge badge-neutral" style={{ fontSize:9 }}>{m.plataforma}</span>}
                        {m.rede && <span style={{ fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:5, background:'var(--raised)', color:'var(--t2)', border:'1px solid var(--b1)' }}>{m.rede}</span>}
                        <span className="t-small">{m.quantidade_contas||0} contas · {mRem.length} remessas</span>
                      </div>
                      <p className="t-small" style={{ marginBottom:mRem.length>0?12:0 }}>
                        {m.observacoes||''}
                      </p>
                      {mRem.length>0 && (
                        <>
                          <div className="progress" style={{ height:3, marginBottom:5 }}>
                            <div className="progress-bar" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${pct>=50?'var(--profit)':'var(--loss)'},${pct>=50?'#4ADE80':'#f87171'})` }}/>
                          </div>
                          <p style={{ fontSize:10,color:'var(--t4)' }}>
                            {pct}% acerto · L: R$ {fmt(lucro)} · P: R$ {fmt(prej)}
                          </p>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* P&L */}
            <div style={{ padding:22, borderRadius:14, background:'var(--surface)', border:'1px solid var(--b1)' }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 16px' }}>Resultado acumulado</h3>
              {[
                { l:'Lucro bruto',     v:`R$ ${fmt(stats.lucro)}`,     c:'var(--profit)' },
                { l:'Prejuizo bruto',  v:`R$ ${fmt(stats.prej)}`,      c:'var(--loss)' },
                { l:'Resultado', v:`${stats.liq>=0?'+':''}R$ ${fmt(Math.abs(stats.liq))}`, c:stats.liq>=0?'var(--profit)':'var(--loss)' },
              ].map((s,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:i<2?'1px solid var(--b1)':'none' }}>
                  <span style={{ fontSize:12, color:'var(--t3)' }}>{s.l}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:700, color:s.c }}>{s.v}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ padding:22, borderRadius:14, background:'var(--surface)', border:'1px solid var(--b1)' }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 14px' }}>Metas</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {[
                  { l:'Total', v:stats.total },
                  { l:'Ativas', v:stats.ativas },
                  { l:'Fechadas', v:metas.filter(m=>m.status_fechamento==='fechada').length },
                ].map(({l,v})=>(
                  <div key={l} style={{ textAlign:'center', padding:'12px 8px', borderRadius:10, background:'var(--raised)' }}>
                    <p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--t1)', margin:'0 0 2px' }}>{v}</p>
                    <p style={{ fontSize:10, color:'var(--t3)' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ padding:22, borderRadius:14, background:'var(--surface)', border:'1px solid var(--b1)' }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 14px' }}>Acoes rapidas</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={()=>setShowForm(true)} className="btn btn-brand" style={{ width:'100%', justifyContent:'center' }}>
                  + Iniciar nova meta
                </button>
                {metas.find(m=>(m.status||'ativa')==='ativa') && (
                  <button onClick={()=>router.push(`/meta/${metas.find(m=>(m.status||'ativa')==='ativa').id}`)} className="btn btn-ghost" style={{ width:'100%', justifyContent:'center' }}>
                    Abrir meta ativa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </AppLayout>
    </main>
  )
}

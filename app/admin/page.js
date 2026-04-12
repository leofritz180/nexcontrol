'use client'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../../components/Header'
import TrialBanner, { ConversionModal } from '../../components/TrialBanner'
import AnimatedNumber from '../../components/ui/AnimatedNumber'
import { supabase } from '../../lib/supabase/client'
import { notifyMetaClosed } from '../../lib/notify'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtDate = d => d?new Date(d).toLocaleString('pt-BR'):'—'
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

/* ── Reusable motion presets ── */
const ease = [0.33, 1, 0.68, 1]
const stagger = (i, base = 0) => ({ duration: 0.4, delay: base + i * 0.07, ease })
const fadeUp = (i, base = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: stagger(i, base) })
const fadeSlideX = (i, base = 0) => ({ initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 }, transition: stagger(i, base) })

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
  const [taxa,   setTaxa]   =useState(String(meta.taxa_agente||''))
  const [saving, setSaving] =useState(false)
  const [error,  setError]  =useState('')

  const lucroFinal = useMemo(()=>liqRem+Number(salario||0)-Number(custo||0)-Number(taxa||0),[salario,custo,taxa,liqRem])

  async function save() {
    if (saving) return
    setSaving(true); setError('')
    const { data:updated, error:err } = await supabase.from('metas').update({
      salario:Number(salario||0), custo_fixo:Number(custo||0), taxa_agente:Number(taxa||0),
      lucro_final:lucroFinal, status:'finalizada',
      status_fechamento:'fechada', fechada_em:new Date().toISOString(),
    }).eq('id',meta.id).neq('status_fechamento','fechada').select()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (!updated||updated.length===0) { setError('Meta ja foi fechada por outro usuario.'); return }
    notifyMetaClosed(meta.tenant_id, meta.quantidade_contas, meta.rede, lucroFinal)
    onSaved(); onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position:'fixed',inset:0,background:'rgba(2,4,8,0.9)',backdropFilter:'blur(16px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="card" style={{ width:'100%',maxWidth:520,padding:32,boxShadow:'0 40px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.2)' }}>
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
          <motion.button onClick={onClose} className="btn btn-ghost btn-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </motion.button>
        </div>

        {/* Resumo */}
        <div style={{ background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:12,padding:18,marginBottom:22 }}>
          <p className="t-label" style={{ marginBottom:14 }}>Resultado das remessas</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
            {[
              {l:'Lucro bruto',v:`R$ ${fmt(lucroRem)}`,c:'var(--profit)'},
              {l:'Prejuizo',   v:`R$ ${fmt(prejRem)}`, c:'var(--loss)'},
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
            <label className="t-label" style={{ display:'block',marginBottom:8 }}>Meu salario nesta meta (R$)</label>
            <p className="t-small" style={{ margin:'0 0 8px' }}>Valor recebido por bater a meta — soma ao resultado (+)</p>
            <input className="input" type="number" step="0.01" min="0" value={salario} onChange={e=>setSalario(e.target.value)} placeholder="0,00"/>
          </div>
          <div>
            <label className="t-label" style={{ display:'block',marginBottom:8 }}>Custo fixo da operacao (R$)</label>
            <p className="t-small" style={{ margin:'0 0 8px' }}>Salario do operador + despesas — deduzido (-)</p>
            <input className="input" type="number" step="0.01" min="0" value={custo} onChange={e=>setCusto(e.target.value)} placeholder="0,00"/>
          </div>
          <div>
            <label className="t-label" style={{ display:'block',marginBottom:8 }}>Taxa agente/blogueira (R$)</label>
            <p className="t-small" style={{ margin:'0 0 8px' }}>Comissao paga ao agente, blogueira ou parceiro — deduzido (-)</p>
            <input className="input" type="number" step="0.01" min="0" value={taxa} onChange={e=>setTaxa(e.target.value)} placeholder="0,00"/>
          </div>

          <div style={{ background:lucroFinal>=0?'var(--profit-dim)':'var(--loss-dim)',border:`1px solid ${lucroFinal>=0?'var(--profit-border)':'var(--loss-border)'}`,borderRadius:12,padding:'18px 22px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div>
              <p className="t-label" style={{ marginBottom:4 }}>Lucro final da meta</p>
              <p className="t-small">Resultado + salario - custo - taxa agente</p>
            </div>
            <p className="t-num" style={{ fontSize:28,fontWeight:800,color:lucroFinal>=0?'var(--profit)':'var(--loss)' }}>
              {lucroFinal>=0?'+':''}R$ {fmt(lucroFinal)}
            </p>
          </div>

          {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

          <div style={{ display:'flex',gap:10 }}>
            <motion.button onClick={onClose} className="btn btn-ghost" style={{ flex:1 }} whileTap={{ scale: 0.96 }}>Cancelar</motion.button>
            <motion.button onClick={save} disabled={saving} className="btn btn-profit" style={{ flex:2 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
              {saving?<><div className="spinner" style={{ width:14,height:14,borderTopColor:'#012b1c' }}/> Salvando...</>:<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Confirmar fechamento</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Salary/costs panel (isolated from polling) ── */
function SalaryPanel({ meta, liqCalc, onSaved }) {
  const fechada = meta.status_fechamento === 'fechada'
  const isActive = !fechada && meta.status !== 'finalizada'
  const isFinalizedNotClosed = !fechada && meta.status === 'finalizada'

  const [salario, setSalario] = useState(String(meta.salario ?? ''))
  const [custo, setCusto]     = useState(String(meta.custo_fixo ?? ''))
  const [taxa, setTaxa]       = useState(String(meta.taxa_agente ?? ''))
  const [saving, setSaving]   = useState(false)

  // Sync only on meta id change (new meta opened) — NOT on every focusMeta update
  useEffect(() => {
    setSalario(String(meta.salario ?? ''))
    setCusto(String(meta.custo_fixo ?? ''))
    setTaxa(String(meta.taxa_agente ?? ''))
  }, [meta.id])

  const sal = Number(salario || 0)
  const cst = Number(custo || 0)
  const tax = Number(taxa || 0)
  const newLucro = liqCalc + sal - cst - tax

  async function save() {
    if (saving) return
    setSaving(true)
    const isClosed = fechada || isFinalizedNotClosed
    await fetch('/api/meta/update-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_id: meta.id, salario: sal, custo_fixo: cst, taxa_agente: tax,
        close: isClosed, lucro_final: isClosed ? newLucro : undefined,
      }),
    })
    setSaving(false)
    onSaved({ ...meta, salario: sal, custo_fixo: cst, taxa_agente: tax, lucro_final: isClosed ? newLucro : meta.lucro_final, status_fechamento: isClosed ? 'fechada' : meta.status_fechamento })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.33,1,0.68,1] }}
      style={{ marginTop: 20, padding: '20px 22px', background: 'var(--surface)', border: `1px solid ${fechada ? 'var(--b1)' : 'var(--brand-border)'}`, borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Salario e custos</span>
        {isActive && <span className="t-small" style={{ marginLeft: 4 }}>Pre-configure para fechamento automatico</span>}
        {isFinalizedNotClosed && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--warn)', marginLeft: 4 }}>Operador finalizou — defina valores e feche</span>}
        {fechada && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--profit)', marginLeft: 4 }}>Meta fechada — ajuste se necessario</span>}
      </div>
      <div className="g-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Salario (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={salario}
            onChange={e => setSalario(e.target.value)}
            placeholder="0,00" style={{ padding: '10px 12px', fontSize: 14 }}/>
        </div>
        <div>
          <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Custo fixo (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={custo}
            onChange={e => setCusto(e.target.value)}
            placeholder="0,00" style={{ padding: '10px 12px', fontSize: 14 }}/>
        </div>
        <div>
          <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Taxa agente (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={taxa}
            onChange={e => setTaxa(e.target.value)}
            placeholder="0,00" style={{ padding: '10px 12px', fontSize: 14 }}/>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, background: newLucro >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${newLucro >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)'}`, marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Lucro final</span>
          <p className="t-small" style={{ margin: '2px 0 0' }}>
            Resultado ({fmt(liqCalc)}) + Sal ({fmt(sal)}) - Custo ({fmt(cst)}) - Taxa ({fmt(tax)})
          </p>
        </div>
        <span className="t-num" style={{ fontSize: 22, fontWeight: 800, color: newLucro >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
          {newLucro >= 0 ? '+' : ''}R$ {fmt(newLucro)}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
        onClick={save} disabled={saving}
        className={`btn ${isFinalizedNotClosed ? 'btn-profit' : 'btn-brand'} btn-sm`}
        style={{ width: '100%', justifyContent: 'center' }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        {saving ? 'Salvando...' : isActive ? 'Salvar configuracao' : isFinalizedNotClosed ? 'Salvar e fechar meta' : 'Salvar ajustes'}
      </motion.button>

      {isActive && (sal > 0 || cst > 0 || tax > 0) && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--profit-dim)', border: '1px solid var(--profit-border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize: 12, color: 'var(--profit)' }}>Pre-configurado. Quando o operador finalizar, a meta fecha automaticamente.</span>
        </div>
      )}
    </motion.div>
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
  const [myMetas,setMyMetas]=useState([])
  const [myRem,setMyRem]=useState([])
  const [myShowForm,setMyShowForm]=useState(false)
  const [myTitulo,setMyTitulo]=useState('')
  const [myPlat,setMyPlat]=useState('')
  const [myRede,setMyRede]=useState('')
  const [myContas,setMyContas]=useState('10')
  const [mySaving,setMySaving]=useState(false)
  const REDES=['WE','W1','VOY','91','DZ','A8','OKOK','ANJO','XW','EK','DY','777','888','WP','BRA','GAME','ALFA','KK','MK','M9','KF','PU','COROA','MANGA','AA','FP']
  const [focusLoad, setFocusLoad] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [trashMetas, setTrashMetas] = useState([])
  const [heroPeriod, setHeroPeriod] = useState('all')
  const tabRef = useRef(null)
  const [tabLine, setTabLine] = useState({ left: 0, width: 0 })

  useEffect(()=>{ checkAndLoad() },[])
  useEffect(()=>{ const iv=setInterval(loadAll,30000); return()=>clearInterval(iv) },[])

  // Tab underline tracking
  const updateTabLine = useCallback(() => {
    if (!tabRef.current) return
    const active = tabRef.current.querySelector('[data-active="true"]')
    if (active) {
      const containerRect = tabRef.current.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      setTabLine({ left: activeRect.left - containerRect.left, width: activeRect.width })
    }
  }, [])
  useEffect(() => { updateTabLine() }, [tab, updateTabLine])
  useEffect(() => { const t = setTimeout(updateTabLine, 100); return () => clearTimeout(t) }, [loading])

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

    setOperators(ops||[]); setMetas((ms||[]).filter(m=>!m.deleted_at)); setTrashMetas((ms||[]).filter(m=>!!m.deleted_at)); setRemessas(newRs); setInvites(inv||[])
    if(t) setTenant(t); if(s2) setSub(s2)
    // Load admin own metas
    const adminId = profile?.id || user?.id
    if(adminId) {
      const [{data:mm},{data:mr}]=await Promise.all([
        supabase.from('metas').select('*').eq('operator_id',adminId).order('created_at',{ascending:false}),
        supabase.from('remessas').select('*').order('created_at',{ascending:false}),
      ])
      setMyMetas((mm||[]).filter(x=>!x.deleted_at))
      const myIds=new Set((mm||[]).filter(x=>!x.deleted_at).map(x=>x.id))
      setMyRem((mr||[]).filter(x=>myIds.has(x.meta_id)))
    }
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
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
    const totalDep = remessas.reduce((a,r)=>a+Number(r.deposito||0),0)
    const totalSaq = remessas.reduce((a,r)=>a+Number(r.saque||0),0)
    const today = new Date().toDateString()
    const lucroHoje = metas.filter(m=>m.status_fechamento==='fechada'&&m.fechada_em&&new Date(m.fechada_em).toDateString()===today).reduce((a,m)=>a+Number(m.lucro_final||0),0)
    const fechadas  = metas.filter(m=>m.status_fechamento==='fechada')
    const lucroFinalTotal = fechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
    return { lucro,prej,liq:lucro-prej,totalDep,totalSaq,lucroHoje,ativas:metas.filter(m=>(m.status||'ativa')==='ativa').length,fechadas:fechadas.length,lucroFinalTotal,ops:operators.length,totalMetas:metas.length,totalRem:remessas.length }
  },[operators,metas,remessas])

  // ── Hero card: lucro final por periodo selecionado ──
  const heroLucro = useMemo(()=>{
    const fechadas = metas.filter(m=>m.status_fechamento==='fechada'&&m.fechada_em)
    if(heroPeriod==='all') {
      return { value: fechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0), count: fechadas.length }
    }
    const now = new Date()
    let filtered = fechadas
    if(heroPeriod==='today') {
      const t = now.toDateString()
      filtered = fechadas.filter(m=>new Date(m.fechada_em).toDateString()===t)
    } else if(heroPeriod==='yesterday') {
      const y = new Date(now); y.setDate(y.getDate()-1)
      const yStr = y.toDateString()
      filtered = fechadas.filter(m=>new Date(m.fechada_em).toDateString()===yStr)
    } else if(heroPeriod==='7d') {
      const d = new Date(now); d.setDate(d.getDate()-7)
      filtered = fechadas.filter(m=>new Date(m.fechada_em)>=d)
    } else if(heroPeriod==='30d') {
      const d = new Date(now); d.setDate(d.getDate()-30)
      filtered = fechadas.filter(m=>new Date(m.fechada_em)>=d)
    }
    return { value: filtered.reduce((a,m)=>a+Number(m.lucro_final||0),0), count: filtered.length }
  },[metas,heroPeriod])

  const ranking = useMemo(()=>
    operators.map(op=>{
      const opMetas = metas.filter(m=>m.operator_id===op.id&&m.status_fechamento==='fechada')
      const ids = new Set(opMetas.map(m=>m.id))
      const opRem = remessas.filter(r=>ids.has(r.meta_id))
      const sparkData = opMetas.map(m=>Number(m.lucro_final||0))
      // Total de depositantes finalizados = soma do quantidade_contas de todas as metas fechadas
      const depositantesFinalizados = opMetas.reduce((a,m)=>a+Number(m.quantidade_contas||0),0)
      return { ...op, metasFechadas:opMetas.length, lucroFinal:opMetas.reduce((a,m)=>a+Number(m.lucro_final||0),0), totalRem:opRem.length, depositantesFinalizados, sparkData }
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
    const fechadas = metas.filter(m=>m.status_fechamento==='fechada'&&m.rede)
    const redeMap = {}
    fechadas.forEach(m=>{
      if (!redeMap[m.rede]) redeMap[m.rede]={rede:m.rede,lucroFinal:0,nMetas:0}
      redeMap[m.rede].lucroFinal += Number(m.lucro_final||0)
      redeMap[m.rede].nMetas++
    })
    return Object.values(redeMap).sort((a,b)=>b.lucroFinal-a.lucroFinal)
  },[metas])

  const convStats = useMemo(()=>({
    totalMoved: remessas.reduce((a,r)=>a+Number(r.deposito||0)+Number(r.saque||0),0),
    totalMetas: metas.length,
    totalRemessas: remessas.length,
  }),[remessas,metas])

  const kpis = [
    { label:'Lucro hoje', rawValue:Math.abs(global.lucroHoje), value:`R$ ${fmt(Math.abs(global.lucroHoje))}`, sub:global.lucroHoje>=0?'Fechamentos de hoje':'Resultado negativo', color:global.lucroHoje>=0?'var(--profit)':'var(--loss)', card:global.lucroHoje>=0?'card-profit':'card-loss', badge:'ao vivo', isLive: true },
    { label:'Lucro final total', rawValue:global.lucroFinalTotal, value:`R$ ${fmt(global.lucroFinalTotal)}`, sub:'Metas 100% fechadas', color:'var(--brand-bright)', card:'card-primary', badge:'fechado' },
    { label:'Total depositado', rawValue:global.totalDep, value:`R$ ${fmt(global.totalDep)}`, sub:'Admin + operadores', color:'var(--info)', card:'card-info', badge:'depositos' },
    { label:'Total sacado', rawValue:global.totalSaq, value:`R$ ${fmt(global.totalSaq)}`, sub:'Admin + operadores', color:'var(--warn)', card:'card-warn', badge:'saques' },
  ]

  const TABS = [['overview','Visao geral'],['myops','Minha operacao'],['operations','Metas & Fechamento'],['ranking','Ranking'],['redes','Redes'],['team','Equipe'],['trash','Lixeira']]

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <AnimatePresence>
        {modalMeta && (
          <ModalFechamento
            meta={modalMeta}
            remessas={remessas.filter(r=>r.meta_id===modalMeta.id)}
            operador={operators.find(o=>o.id===modalMeta.operator_id)}
            onClose={()=>setModalMeta(null)}
            onSaved={loadAll}
          />
        )}
      </AnimatePresence>

      {/* META DETAIL PANEL */}
      <AnimatePresence>
      {focusMeta && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(4,8,16,0.92)',backdropFilter:'blur(16px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'40px 24px',overflowY:'auto'}} onClick={()=>setFocusMeta(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.3, ease }}
            onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:900}}>
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
                    <span style={{padding:'4px 12px',borderRadius:99,fontSize:10,fontWeight:700,letterSpacing:'0.05em',background:fechada?'rgba(34,197,94,0.15)':finalizada?'rgba(239,68,68,0.1)':'rgba(59,130,246,0.1)',border:`1px solid ${fechada?'rgba(34,197,94,0.3)':finalizada?'rgba(239,68,68,0.2)':'rgba(59,130,246,0.2)'}`,color:fechada?'#22C55E':finalizada?'#EF4444':'#60A5FA'}}>
                      {fechada?'CONCLUIDA':finalizada?'Finalizada':'Ativa'}
                    </span>
                    {!fechada&&!finalizada&&(
                      <motion.span
                        style={{ width:7,height:7,borderRadius:'50%',background:'var(--profit)',flexShrink:0 }}
                        animate={{ boxShadow:['0 0 0 0 rgba(34,197,94,0.6)','0 0 0 7px rgba(34,197,94,0)','0 0 0 0 rgba(34,197,94,0)'] }}
                        transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                      />
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }} onClick={async()=>{
                      if(!confirm('Tem certeza que deseja EXCLUIR esta meta e todas as remessas? Esta acao nao pode ser desfeita.')) return
                      await fetch('/api/meta/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({meta_id:m.id})})
                      setFocusMeta(null); loadAll()
                    }} style={{width:36,height:36,borderRadius:10,border:'1px solid var(--loss-border)',background:'rgba(239,68,68,0.06)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.15)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.06)'}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </motion.button>
                    <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }} onClick={()=>setFocusMeta(null)} style={{width:36,height:36,borderRadius:10,border:'1px solid var(--b2)',background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </motion.button>
                  </div>
                </div>

                {/* Info cards */}
                <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
                  {[
                    {l:'Rede',v:m.rede||'—',c:'var(--brand-bright)'},
                    {l:'Plataforma',v:m.plataforma||'—',c:'var(--t1)'},
                    {l:'Operador',v:getName(op),c:'var(--info)'},
                    {l:'Contas',v:m.quantidade_contas||0,c:'var(--warn)'},
                  ].map(({l,v,c},i)=>(
                    <motion.div key={l} {...fadeUp(i, 0.1)} style={{background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:14,padding:'14px 16px'}}>
                      <p className="t-label" style={{marginBottom:5}}>{l}</p>
                      <p style={{fontSize:15,fontWeight:700,color:c,margin:0,fontFamily:typeof v==='number'?'var(--mono)':'inherit'}}>{v}</p>
                    </motion.div>
                  ))}
                </div>

                {/* KPIs */}
                <div className="g-5" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
                  {[
                    {l:'Remessas',v:focusRem.length,c:'var(--info)',isNum:true},
                    {l:'Lucro',v:`R$ ${fmt(lucroR)}`,c:'var(--profit)',raw:lucroR},
                    {l:'Prejuizo',v:`R$ ${fmt(prejR)}`,c:'var(--loss)',raw:prejR},
                    {l:'Acerto',v:`${pct}%`,c:pct>=50?'var(--profit)':'var(--warn)',raw:pct},
                    {l:fechada?'LUCRO FINAL':'Liquido',v:`${displayVal>=0?'+':'-'}R$ ${fmt(Math.abs(displayVal))}`,c:displayVal>=0?'#22C55E':'#EF4444',raw:Math.abs(displayVal)},
                  ].map(({l,v,c,raw,isNum},i)=>{
                    const isFinal = l.includes('FINAL')
                    const isLiq = l==='Liquido'
                    const highlightPos = (isFinal||isLiq) && displayVal>=0
                    const highlightNeg = (isFinal||isLiq) && displayVal<0
                    return (
                    <motion.div key={l} {...fadeUp(i, 0.15)}
                      whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                      style={{
                        background: highlightPos?'rgba(34,197,94,0.1)':highlightNeg?'rgba(239,68,68,0.1)':'var(--surface)',
                        border:`1px solid ${highlightPos?'rgba(34,197,94,0.2)':highlightNeg?'rgba(239,68,68,0.2)':'var(--b1)'}`,
                        borderRadius:14,padding:'14px 16px',textAlign:'center'
                      }}>
                      <p className="t-label" style={{marginBottom:5,color:highlightPos?'#22C55E':highlightNeg?'#EF4444':undefined}}>{l}</p>
                      <p className="t-num" style={{fontSize:isFinal?22:16,fontWeight:800,color:c,margin:0}}>{v}</p>
                    </motion.div>
                  )})}
                </div>

                {focusLoad ? (
                  <div style={{padding:40,textAlign:'center'}}><div className="spinner" style={{margin:'0 auto',borderTopColor:'var(--brand-bright)'}}/></div>
                ) : (
                <div className="g-side" style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
                  {/* Remessas */}
                  <div className="card" style={{padding:22}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                      <h3 className="t-h3" style={{fontSize:14}}>Remessas ({focusRem.length})</h3>
                      {!fechada&&(
                        <motion.span
                          style={{ width:6,height:6,borderRadius:'50%',background:'var(--profit)' }}
                          animate={{ boxShadow:['0 0 0 0 rgba(34,197,94,0.6)','0 0 0 6px rgba(34,197,94,0)','0 0 0 0 rgba(34,197,94,0)'] }}
                          transition={{ duration:2, repeat:Infinity }}
                        />
                      )}
                    </div>
                    {focusRem.length===0?(
                      <p className="t-small" style={{textAlign:'center',padding:24}}>Nenhuma remessa registrada.</p>
                    ):(
                      <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:400,overflowY:'auto'}}>
                        {[...focusRem].reverse().map((r,i)=>{
                          const pos=Number(r.resultado||0)>=0
                          const isLatest=i===0
                          return (
                            <motion.div key={r.id}
                              {...fadeSlideX(i)}
                              whileHover={{ x: 4, transition: { duration: 0.15 } }}
                              style={{
                              padding:'12px 14px',borderRadius:12,
                              background:isLatest?(pos?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)'):'var(--raised)',
                              border:`1px solid ${isLatest?(pos?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.12)'):'var(--b1)'}`,
                              display:'flex',alignItems:'center',gap:10,
                              transition:'background 0.2s, border-color 0.2s',
                              boxShadow:isLatest?`0 0 15px ${pos?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.04)'}`:'none',
                            }}>
                              <div style={{width:30,height:30,borderRadius:8,background:pos?'var(--profit-dim)':'var(--loss-dim)',border:`1px solid ${pos?'var(--profit-border)':'var(--loss-border)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={pos?'var(--profit)':'var(--loss)'} strokeWidth="3" strokeLinecap="round"><polyline points={pos?'18 15 12 9 6 15':'6 9 12 15 18 9'}/></svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                                  <p style={{fontSize:12,fontWeight:600,color:'var(--t1)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.titulo||`Remessa ${focusRem.length-i}`}</p>
                                  {isLatest&&<span style={{fontSize:8,fontWeight:700,padding:'1px 6px',borderRadius:4,background:pos?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.12)',color:pos?'var(--profit)':'var(--loss)'}}>{pos?'LUCRO':'PREJUIZO'}</span>}
                                </div>
                                <p className="t-small">{r.tipo} · D: R$ {fmt(r.deposito)} · S: R$ {fmt(r.saque)}</p>
                              </div>
                              <p className="t-num" style={{fontSize:isLatest?16:14,fontWeight:800,color:pos?'var(--profit)':'var(--loss)',flexShrink:0}}>
                                {pos?'+':'-'}R$ {fmt(Math.abs(Number(r.resultado||0)))}
                              </p>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={async(ev)=>{
                                ev.stopPropagation()
                                if(!confirm('Excluir esta remessa?')) return
                                await fetch('/api/remessa/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({remessa_id:r.id})})
                                openMetaDetail(m)
                              }} style={{width:26,height:26,borderRadius:6,border:'1px solid var(--loss-border)',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,opacity:0.5,transition:'opacity 0.15s'}}
                                onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.5'}>
                                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                              </motion.button>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="card" style={{padding:22}}>
                    <h3 className="t-h3" style={{fontSize:14,marginBottom:14}}>Timeline</h3>
                    {focusLogs.length===0?(
                      <div style={{textAlign:'center',padding:'32px 16px'}}>
                        <div style={{width:40,height:40,borderRadius:12,background:'var(--brand-dim)',border:'1px solid var(--brand-border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <p style={{fontSize:12,fontWeight:600,color:'var(--t2)',margin:'0 0 4px'}}>Sem eventos ainda</p>
                        <p className="t-small">As acoes do operador aparecerao aqui em tempo real</p>
                      </div>
                    ):(
                      <div style={{display:'flex',flexDirection:'column',gap:0,maxHeight:400,overflowY:'auto'}}>
                        {focusLogs.map((log,i)=>{
                          const logOp=operators.find(o=>o.id===log.operator_id)
                          const iconMap={meta_created:'plus',meta_finalized:'flag',meta_closed:'check',meta_status_changed:'refresh',meta_reactivated:'refresh',remessa_created:'dollar',remessa_edited:'flag'}
                          const colorMap={meta_created:'var(--brand-bright)',meta_finalized:'var(--warn)',meta_closed:'var(--profit)',remessa_created:'var(--info)',meta_status_changed:'var(--t2)',meta_reactivated:'var(--warn)',remessa_edited:'var(--warn)'}
                          const ic=iconMap[log.action]||'circle'
                          const lc=colorMap[log.action]||'var(--t2)'
                          return (
                            <motion.div key={log.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: i * 0.04, ease }}
                              style={{display:'flex',gap:12,paddingBottom:16,position:'relative'}}>
                              {i<focusLogs.length-1&&<div style={{position:'absolute',left:13,top:28,bottom:0,width:1,background:'var(--b1)'}}/>}
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
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* ── UNIFIED SALARY/COSTS PANEL ── */}
                <SalaryPanel
                  meta={m}
                  liqCalc={focusRem.reduce((a,r)=>a+Number(r.lucro||0)-Number(r.prejuizo||0),0)}
                  onSaved={(updated)=>{ openMetaDetail(updated); loadAll() }}
                />

                {/* Meta info footer */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:16,padding:'12px 0',borderTop:'1px solid var(--b1)'}}>
                  <p className="t-small">Criada em {fmtDate(m.created_at)}{m.fechada_em?` · Fechada em ${fmtDate(m.fechada_em)}`:''}{m.observacoes?` · ${m.observacoes}`:''}</p>
                </div>
              </>)
            })()}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}/>

      <div style={{ maxWidth:1380, margin:'0 auto', padding:'32px 28px' }}>
        {/* ── PAGE HEADER — clean ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease }}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease }}
              style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.03em', color:'var(--t1)', margin:'0 0 6px' }}>
              Painel executivo
            </motion.h1>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <motion.span
                style={{ width:6,height:6,borderRadius:'50%',background:'var(--profit)' }}
                animate={{ boxShadow:['0 0 0 0 rgba(34,197,94,0.6)','0 0 0 5px rgba(34,197,94,0)','0 0 0 0 rgba(34,197,94,0)'] }}
                transition={{ duration:2, repeat:Infinity }}
              />
              <span style={{ fontSize:12, color:'var(--t3)' }}>Atualiza a cada 30s</span>
            </div>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-brand btn-sm"
            whileTap={{ scale: 0.96 }}
            style={{ display:'flex', alignItems:'center', gap:6, opacity: refreshing ? 0.5 : 1 }}>
            {refreshing ? (
              <motion.div
                style={{ width:13,height:13,borderRadius:'50%',border:'2px solid var(--t4)',borderTopColor:'var(--t1)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            )}
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </motion.button>
        </motion.div>

        <TrialBanner tenant={tenant} subscription={sub} stats={convStats}/>
        <ConversionModal tenant={tenant} subscription={sub} stats={convStats}/>

        {/* ── PREMIUM TABS ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          ref={tabRef}
          className="tabs-scroll"
          style={{ display:'flex', gap:4, marginBottom:24, background:'var(--surface)', border:'1px solid var(--b1)', borderRadius:12, padding:5, width:'fit-content', position:'relative' }}>
          {/* Animated underline */}
          <motion.div
            layoutId="tab-indicator"
            animate={{ left: tabLine.left, width: tabLine.width }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{
              position:'absolute', bottom: 5, height: 2, borderRadius: 2,
              background: 'linear-gradient(90deg, var(--brand-bright), #3B82F6)',
              boxShadow: '0 0 8px rgba(59,130,246,0.4)',
              zIndex: 2,
            }}
          />
          {TABS.map(([k,l])=>{
            const active = tab===k
            return (
              <motion.button
                key={k}
                data-active={active ? 'true' : 'false'}
                onClick={()=>setTab(k)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, padding:'8px 18px',
                  borderRadius:9, cursor:'pointer', transition:'all 0.2s',
                  background:active?'var(--raised)':'transparent',
                  border:active?'1px solid var(--b2)':'1px solid transparent',
                  color:active?'var(--t1)':'var(--t3)',
                  boxShadow:active?'0 2px 8px rgba(0,0,0,0.3)':'',
                  position: 'relative', zIndex: 3,
                }}>
                {l}
              </motion.button>
            )
          })}
        </motion.div>

        {/* ═══ TAB CONTENT WITH ANIMATED TRANSITIONS ═══ */}
        <AnimatePresence mode="wait">

        {/* ═══ MY OPS ═══ */}
        {tab==='myops' && (
          <motion.div key="myops"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}>
            {(()=>{
              const myLucro=myRem.reduce((a,r)=>a+Number(r.lucro||0),0)
              const myPrej=myRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
              const myLiq=myLucro-myPrej
              async function createMyMeta(e){
                e.preventDefault()
                if(!myTitulo.trim()||!myPlat.trim()||!myRede){return}
                setMySaving(true)
                const {data,error:err}=await supabase.from('metas').insert({
                  operator_id:user.id,titulo:myTitulo.trim(),plataforma:myPlat.trim(),rede:myRede,
                  quantidade_contas:Number(myContas||10),status:'ativa',tenant_id:profile?.tenant_id,
                }).select().single()
                setMySaving(false)
                if(err){return}
                setMyTitulo('');setMyPlat('');setMyRede('');setMyContas('10');setMyShowForm(false)
                router.push(`/meta/${data.id}`)
              }
              return (<>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
                  <div>
                    <h2 className="t-h2">Minha operacao</h2>
                    <p className="t-small">Metas e remessas do admin</p>
                  </div>
                  <motion.button onClick={()=>setMyShowForm(!myShowForm)} className={`btn ${myShowForm?'btn-ghost':'btn-cta'}`} style={{display:'flex',alignItems:'center',gap:8}} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    {myShowForm?'Fechar':'Nova meta'}
                  </motion.button>
                </div>

                <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
                  {[
                    {l:'Minhas metas',v:myMetas.length,c:'var(--brand-bright)'},
                    {l:'Remessas',v:myRem.length,c:'var(--info)'},
                    {l:'Lucro',v:myLucro,c:'var(--profit)',isMoney:true},
                    {l:'Resultado',v:myLiq,c:myLiq>=0?'var(--profit)':'var(--loss)',isMoney:true,showSign:true},
                  ].map(({l,v,c,isMoney,showSign},i)=>(
                    <motion.div key={l} {...fadeUp(i)}
                      whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                      style={{background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:14,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span className="t-body" style={{fontSize:12}}>{l}</span>
                      {isMoney ? (
                        <AnimatedNumber value={Math.abs(v)} prefix={`${showSign?(v>=0?'+':'-'):''}R$ `} style={{fontFamily:'var(--mono)',fontSize:20,fontWeight:800,color:c}} />
                      ) : (
                        <AnimatedNumber value={v} decimals={0} style={{fontFamily:'var(--mono)',fontSize:20,fontWeight:800,color:c}} />
                      )}
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                {myShowForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="card card-primary" style={{ padding:24,marginBottom:20,overflow:'hidden' }}>
                    <h3 className="t-h3" style={{fontSize:14,marginBottom:14}}>Criar minha meta</h3>
                    <form onSubmit={createMyMeta} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div>
                        <label className="t-label" style={{display:'block',marginBottom:6}}>Plataforma *</label>
                        <input className="input" value={myPlat} onChange={e=>setMyPlat(e.target.value)} placeholder="Nome da plataforma" required/>
                      </div>
                      <div>
                        <label className="t-label" style={{display:'block',marginBottom:6}}>Rede *</label>
                        <select className="input" value={myRede} onChange={e=>setMyRede(e.target.value)} required>
                          <option value="">Selecione</option>
                          {REDES.map(r=><option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="t-label" style={{display:'block',marginBottom:6}}>Titulo *</label>
                        <input className="input" value={myTitulo} onChange={e=>setMyTitulo(e.target.value)} placeholder="Ex: Meta Abril" required/>
                      </div>
                      <div>
                        <label className="t-label" style={{display:'block',marginBottom:6}}>Depositantes</label>
                        <input className="input" type="number" min="1" value={myContas} onChange={e=>setMyContas(e.target.value)}/>
                      </div>
                      <div style={{gridColumn:'1/-1'}}>
                        <motion.button type="submit" className="btn btn-brand btn-lg" disabled={mySaving} style={{width:'100%',justifyContent:'center'}} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                          {mySaving?'Criando...':'Iniciar meta'}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
                </AnimatePresence>

                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {myMetas.length===0 ? (
                    <div style={{border:'1px dashed var(--b2)',borderRadius:16,padding:48,textAlign:'center'}}>
                      <p style={{color:'var(--t2)',fontSize:14,fontWeight:600,marginBottom:4}}>Nenhuma meta criada</p>
                      <p className="t-small" style={{marginBottom:16}}>Crie sua primeira meta de operacao.</p>
                      <button onClick={()=>setMyShowForm(true)} className="btn btn-cta">+ Criar meta</button>
                    </div>
                  ) : myMetas.map((m,i)=>{
                    const mRem=myRem.filter(r=>r.meta_id===m.id)
                    const lucro=mRem.reduce((a,r)=>a+Number(r.lucro||0),0)
                    const prej=mRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
                    const liq=lucro-prej
                    const fechada=m.status_fechamento==='fechada'
                    return (
                      <motion.div key={m.id} {...fadeUp(i)}
                        whileHover={{x:4, borderColor: 'var(--b3)', transition:{duration:0.15}}}
                        onClick={()=>router.push(`/meta/${m.id}`)}
                        className="row-card" style={{padding:'16px 20px',cursor:'pointer'}}>
                        <div className="accent" style={{background:fechada?'linear-gradient(180deg,var(--profit),#04b876)':'linear-gradient(180deg,var(--brand-bright),var(--brand))'}}/>
                        <div style={{paddingLeft:14,display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                              <h3 style={{fontSize:14,fontWeight:700,color:'var(--t1)',margin:0}}>{m.titulo}</h3>
                              <span className={`badge ${fechada?'badge-profit':'badge-brand'}`} style={{fontSize:9}}>
                                {fechada?'Fechada':(m.status||'ativa')==='ativa'?'Ativa':'Finalizada'}
                              </span>
                            </div>
                            <p className="t-small">{m.rede} · {m.plataforma} · {mRem.length} remessas</p>
                          </div>
                          <span className="t-num" style={{fontSize:16,fontWeight:700,color:liq>=0?'var(--profit)':'var(--loss)'}}>
                            {liq>=0?'+':''}R$ {fmt(liq)}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </>)
            })()}
          </motion.div>
        )}

        {/* ═══ OVERVIEW ═══ */}
        {tab==='overview' && (
          <motion.div key="overview"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease }}>

          {/* ── HERO + KPIs — side by side ── */}
          <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16, marginBottom:24 }}>

            {/* LEFT — Hero card */}
            <motion.div
              initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              transition={{duration:0.5,ease}}
              whileHover={{ y:-4, boxShadow:'0 24px 64px rgba(0,0,0,0.6)', transition:{duration:0.25} }}
              style={{
                position:'relative', overflow:'hidden',
                padding:'40px 40px 36px', borderRadius:18,
                background:'linear-gradient(145deg, #0c1424, #080e1a)',
                border:'1px solid rgba(255,255,255,0.06)',
                boxShadow:'0 8px 32px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}>
              {/* Ambient glow */}
              <div style={{
                position:'absolute', top:'10%', left:'5%', width:350, height:250, borderRadius:'50%',
                background: heroLucro.value>=0
                  ? 'radial-gradient(circle, rgba(34,197,94,0.06), transparent 65%)'
                  : 'radial-gradient(circle, rgba(239,68,68,0.06), transparent 65%)',
                filter:'blur(40px)', pointerEvents:'none',
              }}/>
              <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', pointerEvents:'none' }}/>

              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
                  <p style={{ fontSize:13, color:'var(--t3)', fontWeight:500, margin:0 }}>
                    {heroPeriod==='all'?'Lucro final acumulado':heroPeriod==='today'?'Lucro de hoje':heroPeriod==='yesterday'?'Lucro de ontem':heroPeriod==='7d'?'Ultimos 7 dias':'Ultimos 30 dias'}
                  </p>
                  <div style={{ display:'flex', gap:2, background:'rgba(0,0,0,0.3)', borderRadius:9, padding:3 }}>
                    {[['all','Tudo'],['today','Hoje'],['yesterday','Ontem'],['7d','7d'],['30d','30d']].map(([k,l])=>(
                      <button key={k} onClick={()=>setHeroPeriod(k)}
                        style={{
                          fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:7,
                          cursor:'pointer', border:'none',
                          background: heroPeriod===k ? 'rgba(255,255,255,0.08)' : 'transparent',
                          color: heroPeriod===k ? 'var(--t1)' : 'var(--t4)',
                          transition:'all 0.15s',
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatedNumber
                  value={Math.abs(heroLucro.value)}
                  key={heroPeriod}
                  prefix={`${heroLucro.value>=0?'+':'-'}R$ `}
                  style={{
                    fontFamily:'var(--mono)', fontSize:48, fontWeight:900,
                    color: heroLucro.value>=0 ? 'var(--profit)' : 'var(--loss)',
                    lineHeight:1, letterSpacing:'-0.03em', display:'block',
                    textShadow: heroLucro.value>=0 ? '0 0 60px rgba(34,197,94,0.15)' : '0 0 60px rgba(239,68,68,0.15)',
                  }}
                />

                <div style={{ display:'flex', alignItems:'center', gap:20, marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p style={{ fontSize:10, color:'var(--t4)', marginBottom:2, letterSpacing:'0.05em', textTransform:'uppercase' }}>Fechadas</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:'var(--t1)', margin:0 }}>{heroLucro.count}</p>
                  </div>
                  <div style={{ width:1, height:28, background:'rgba(255,255,255,0.05)' }}/>
                  <div>
                    <p style={{ fontSize:10, color:'var(--t4)', marginBottom:2, letterSpacing:'0.05em', textTransform:'uppercase' }}>Status</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:heroLucro.value>=0?'var(--profit)':'var(--loss)', margin:0 }}>
                      {heroLucro.value>=0?'Positivo':'Negativo'}
                    </p>
                  </div>
                  <div style={{ width:1, height:28, background:'rgba(255,255,255,0.05)' }}/>
                  <div>
                    <p style={{ fontSize:10, color:'var(--t4)', marginBottom:2, letterSpacing:'0.05em', textTransform:'uppercase' }}>Operadores</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:'var(--t1)', margin:0 }}>{global.ops}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT — 4 stacked KPI cards */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Total depositado', value:global.totalDep, prefix:'R$ ' },
                { label:'Total sacado', value:global.totalSaq, prefix:'R$ ' },
                { label:'Total de depositantes', value:metas.filter(m=>m.status_fechamento==='fechada').reduce((a,m)=>a+Number(m.quantidade_contas||0),0), prefix:'', decimals:0 },
                { label:'Total remessas', value:global.totalRem, prefix:'', decimals:0 },
              ].map((k,i)=>(
                <motion.div key={i}
                  initial={{opacity:0,x:12}} animate={{opacity:1,x:0}}
                  transition={{duration:0.3,delay:0.1+i*0.06,ease}}
                  whileHover={{ y:-2, boxShadow:'0 12px 36px rgba(0,0,0,0.5)', transition:{duration:0.2} }}
                  style={{
                    flex:1, padding:'16px 22px', borderRadius:14,
                    background:'linear-gradient(145deg, #0c1424, #080e1a)',
                    border:'1px solid rgba(255,255,255,0.05)',
                    boxShadow:'0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                    transition:'all 0.25s ease',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                  <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{k.label}</p>
                  <AnimatedNumber value={k.value} prefix={k.prefix} decimals={k.decimals ?? 2}
                    style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:800, color:'var(--t1)' }} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity — feed + operators */}
          <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20 }}>

            {/* Feed */}
            <motion.div
              initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
              transition={{duration:0.35,delay:0.3,ease}}
              style={{
                padding:'28px 28px', borderRadius:16,
                background:'linear-gradient(145deg, #0c1424, #080e1a)',
                border:'1px solid rgba(255,255,255,0.05)',
                boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:0 }}>Remessas recentes</h3>
                <span style={{ fontSize:11, color:'var(--t4)' }}>{remessas.length} total</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {remessas.slice(0,5).map((r,i)=>{
                  const m   = metas.find(x=>x.id===r.meta_id)
                  const op  = operators.find(o=>o.id===m?.operator_id)
                  const pos = Number(r.resultado||0)>=0
                  const val = Math.abs(Number(r.resultado||0))
                  return (
                    <motion.div key={r.id}
                      initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                      transition={{duration:0.25,delay:i*0.04}}
                      whileHover={{ background:'rgba(255,255,255,0.03)', transition:{duration:0.15} }}
                      style={{
                      padding:'12px 10px', display:'flex', alignItems:'center', gap:12,
                      borderBottom: i<4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      borderRadius:8, margin:'0 -10px', transition:'background 0.15s',
                    }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'var(--raised)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)' }}>{getName(op)[0]?.toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{getName(op)}</span>
                        <p style={{ fontSize:11, color:'var(--t3)', margin:'2px 0 0' }}>{r.titulo||'Remessa'} · {new Date(r.created_at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                      <span className="t-num" style={{ fontSize:15, fontWeight:800, color:pos?'var(--profit)':'var(--loss)', flexShrink:0 }}>
                        {pos?'+':'-'}R$ {fmt(val)}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Operadores — clean list */}
            <motion.div
              initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
              transition={{duration:0.35,delay:0.35,ease}}
              style={{
                padding:'28px 28px', borderRadius:16,
                background:'linear-gradient(145deg, #0c1424, #080e1a)',
                border:'1px solid rgba(255,255,255,0.05)',
                boxShadow:'0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t1)', margin:0 }}>Top operadores</h3>
                <span style={{ fontSize:11, color:'var(--t4)' }}>{operators.length} ativos</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {operators.map(op=>{
                  const opMetasFechadas = metas.filter(m=>m.operator_id===op.id&&m.status_fechamento==='fechada')
                  const lucroFinal = opMetasFechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
                  const ativas = metas.filter(m=>m.operator_id===op.id&&(m.status||'ativa')==='ativa').length
                  return { ...op, lucroFinal, ativas, fechadas: opMetasFechadas.length }
                }).sort((a,b)=>b.lucroFinal-a.lucroFinal).slice(0,5).map((op,i)=>(
                    <motion.div key={op.id}
                      initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                      transition={{duration:0.25,delay:i*0.04}}
                      whileHover={{ background:'rgba(255,255,255,0.03)', transition:{duration:0.15} }}
                      style={{
                        padding:'12px 10px', display:'flex', alignItems:'center', gap:10,
                        borderBottom: i<4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        borderRadius:8, margin:'0 -10px', transition:'background 0.15s',
                      }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'var(--raised)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)' }}>{getName(op)[0].toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'var(--t1)', margin:0 }}>{getName(op)}</p>
                        <p style={{ fontSize:11, color:'var(--t3)', margin:'2px 0 0' }}>{op.ativas} ativa{op.ativas!==1?'s':''} · {op.fechadas} fechada{op.fechadas!==1?'s':''}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span className="t-num" style={{ fontSize:14, fontWeight:700, color:op.lucroFinal>=0?'var(--profit)':'var(--loss)' }}>
                          {op.lucroFinal>=0?'+':'-'}R$ {fmt(Math.abs(op.lucroFinal))}
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          </div>
        </motion.div>)}

        {/* ═══ OPERATIONS ═══ */}
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
          <motion.div key="operations"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}>
            {/* Filters */}
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:24,flexWrap:'wrap'}}>
              <select className="input" value={selectedOp||''} onChange={e=>setSelectedOp(e.target.value||null)} style={{width:170,padding:'8px 14px',fontSize:12}}>
                <option value="">Todos operadores</option>
                {operators.map(op=><option key={op.id} value={op.id}>{getName(op)}</option>)}
              </select>
              {[['all','Todas'],['ativa','Ativas'],['finalizada','Finalizadas'],['fechada','Fechadas']].map(([k,l])=>(
                <motion.button key={k} onClick={()=>setMetaStatus(k)} className={`btn btn-sm ${metaStatus===k?'btn-brand':'btn-ghost'}`} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>{l}</motion.button>
              ))}
              <div style={{display:'flex',gap:4,background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:10,padding:4,marginLeft:'auto'}}>
                {[['all','Tudo'],['today','Hoje'],['week','7 dias'],['month','30 dias']].map(([k,l])=>(
                  <motion.button key={k} onClick={()=>setMetaPeriod(k)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,padding:'5px 12px',borderRadius:7,cursor:'pointer',transition:'all 0.15s',border:'none',background:metaPeriod===k?'var(--raised)':'transparent',color:metaPeriod===k?'var(--t1)':'var(--t3)'}}>{l}</motion.button>
                ))}
              </div>
            </div>

            {/* Grid */}
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
                  <motion.div key={m.id} onClick={()=>openMetaDetail(m)}
                    initial={{opacity:0,y:16,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
                    transition={{duration:0.35,delay:i*0.05,ease}}
                    whileHover={{
                      y:-4,scale:1.015,
                      boxShadow:`0 0 35px hsla(${nc.h},0.18), 0 12px 30px rgba(0,0,0,0.4)`,
                      borderColor:`hsla(${nc.h},0.55)`,
                      transition:{duration:0.2}
                    }}
                    style={{
                    borderRadius:18,overflow:'hidden',position:'relative',
                    background:`linear-gradient(160deg, hsla(${nc.h},0.32) 0%, hsla(${nc.h},0.15) 45%, #0a1220 100%)`,
                    border:`1px solid hsla(${nc.h},0.4)`,
                    boxShadow:`0 0 25px hsla(${nc.h},0.1), 0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 hsla(${nc.h},0.12)`,
                    cursor:'pointer',
                  }}>
                    <div style={{height:3,background:`linear-gradient(90deg, ${nc.hex}, ${nc.hex}88)`}}/>
                    <div style={{padding:'18px 20px 16px',position:'relative',zIndex:1}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:nc.hex,boxShadow:`0 0 8px ${nc.hex}88`}}/>
                          <span style={{fontSize:15,fontWeight:900,color:nc.hex,letterSpacing:'0.02em'}}>{totalContas} DEP {m.rede||'—'}</span>
                        </div>
                        <span style={{
                          fontSize:9,fontWeight:700,letterSpacing:'0.05em',
                          padding:'2px 8px',borderRadius:99,
                          background:fechada?'rgba(34,197,94,0.18)':'rgba(255,255,255,0.06)',
                          color:fechada?'#22C55E':'var(--t3)',
                          border:`1px solid ${fechada?'rgba(34,197,94,0.3)':'var(--b1)'}`,
                        }}>
                          {fechada?'Concluida':(m.status||'ativa')==='ativa'?'Ativa':'Finalizada'}
                        </span>
                      </div>
                      <p style={{fontSize:10,color:'var(--t4)',margin:'0 0 14px',paddingLeft:14}}>{metaDate}</p>
                      <div style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:5}}>
                          <span style={{fontSize:11,fontWeight:600,color:fechada?'var(--t3)':nc.hex+'99',fontFamily:'var(--mono)'}}>{fechada?`${totalContas}/${totalContas}`:`${depDone}/${totalContas}`}</span>
                        </div>
                        <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progPct}%` }}
                            transition={{ duration: 1, delay: i * 0.05 + 0.2, ease: [0.4,0,0.2,1] }}
                            style={{
                            height:'100%',borderRadius:99,
                            background:fechada?'linear-gradient(90deg, #22C55E, #4ADE80)':`linear-gradient(90deg, ${nc.hex}, ${nc.hex}bb)`,
                            boxShadow:fechada?'0 0 10px rgba(34,197,94,0.3)':`0 0 6px ${nc.hex}30`,
                          }}/>
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
                        <span style={{
                          fontFamily:'var(--mono)',fontSize:20,fontWeight:800,
                          color:isPos?'#22C55E':'#EF4444',
                          opacity:0.9,
                        }}>
                          {isPos?'+':''}R$ {fmt(Math.abs(displayVal))}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {filteredMetas.length===0 && (
              <div style={{border:'1px dashed var(--b2)',borderRadius:16,padding:64,textAlign:'center'}}>
                <p className="t-small">Nenhuma meta encontrada.</p>
              </div>
            )}
          </motion.div>
          )
        })()}

        {/* ═══ RANKING ═══ */}
        {tab==='ranking' && (
          <motion.div key="ranking"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}>
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
                    <motion.div key={op.id} className="card" style={{ padding:'22px 26px', border:isTop?`1px solid ${medal}22`:'1px solid var(--b1)', background:isTop?`rgba(${i===0?'255,215,0':i===1?'192,192,192':'205,127,50'},0.03)`:'var(--surface)' }}
                      {...fadeUp(i)}
                      whileHover={{ x: 4, borderColor: isTop ? `${medal}44` : 'var(--b2)', transition: { duration: 0.15 } }}>
                      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                        <div style={{ width:54, height:54, borderRadius:15, background:isTop?`${medal}15`:'var(--raised)', border:`2px solid ${isTop?medal:' var(--b2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {isTop
                            ? <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={medal} strokeWidth="1.5" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2.34"/><path d="M14 14.66V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.34"/><path d="M6 4v10"/><path d="M18 4v10"/></svg>
                            : <span style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:20, color:'var(--t4)' }}>#{i+1}</span>
                          }
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                            <motion.div
                              whileHover={{ scale: 1.1, boxShadow: '0 0 12px rgba(59,130,246,0.3)' }}
                              style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(59,130,246,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'box-shadow 0.2s' }}>
                              <span style={{ fontSize:12, fontWeight:800, color:'white' }}>{getName(op)[0].toUpperCase()}</span>
                            </motion.div>
                            <p style={{ fontSize:16, fontWeight:800, color:isTop?medal:'var(--t1)', margin:0, letterSpacing:'-0.02em' }}>{getName(op)}</p>
                            {i===0 && <span className="badge badge-warn">Lider</span>}
                          </div>
                          <p className="t-small" style={{ marginBottom:12 }}>{op.email}</p>
                          <div className="progress" style={{ height:4 }}>
                            <motion.div className="progress-bar"
                              initial={{ width: 0 }}
                              animate={{ width: `${barW}%` }}
                              transition={{ duration: 1, delay: i * 0.1, ease: [0.4,0,0.2,1] }}
                              style={{ background:isTop?`linear-gradient(90deg,${medal},${medal}88)`:'linear-gradient(90deg,var(--brand),var(--brand-bright))' }}/>
                          </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, flexShrink:0 }}>
                          {[
                            { l:'Metas fechadas', v:op.metasFechadas, c:'var(--info)' },
                            { l:'Depositantes', v:op.depositantesFinalizados, c:'var(--warn)' },
                            { l:'Lucro final',    v:`R$ ${fmt(op.lucroFinal)}`, c:isTop?medal:'var(--profit)' },
                          ].map(({l,v,c})=>(
                            <div key={l} style={{ background:'var(--raised)', border:'1px solid var(--b1)', borderRadius:10, padding:'11px 16px', textAlign:'center', minWidth:110 }}>
                              <p className="t-label" style={{ fontSize:9, marginBottom:5 }}>{l}</p>
                              <p className="t-num" style={{ fontSize:14, fontWeight:700, color:c }}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ REDES ═══ */}
        {tab==='redes' && (
          <motion.div key="redes"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(59,130,246,0.1))', border:'1px solid var(--profit-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="1.5" strokeLinecap="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              </div>
              <div>
                <h2 className="t-h2" style={{ margin:'0 0 3px' }}>Ranking de Redes</h2>
                <p className="t-small">Baseado no lucro final das metas fechadas</p>
              </div>
            </div>

            {rankingRedes.length===0 ? (
              <div style={{ border:'1px dashed var(--b2)', borderRadius:16, padding:64, textAlign:'center' }}>
                <p style={{ color:'var(--t2)', fontSize:14, fontWeight:600, marginBottom:4 }}>Nenhuma rede com metas fechadas</p>
                <p className="t-small">Feche metas para ver o ranking.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {rankingRedes.map((r,i)=>{
                  const isTop = i===0
                  const pos = r.lucroFinal >= 0
                  const maxVal = Math.max(Math.abs(rankingRedes[0]?.lucroFinal)||1, 1)
                  const barW = Math.max(3, (Math.abs(r.lucroFinal)/maxVal)*100)
                  return (
                    <motion.div key={r.rede}
                      {...fadeUp(i)}
                      whileHover={{ x: 4, borderColor: isTop ? 'rgba(255,215,0,0.35)' : 'var(--b2)', transition: { duration: 0.15 } }}
                      style={{
                      display:'flex', alignItems:'center', gap:16,
                      padding:'18px 22px', borderRadius:16,
                      background:isTop?'linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))':'var(--surface)',
                      border:isTop?'1px solid rgba(255,215,0,0.2)':'1px solid var(--b1)',
                      boxShadow:isTop?'0 0 30px rgba(255,215,0,0.06)':'none',
                    }}>
                      <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:isTop?'rgba(255,215,0,0.12)':'var(--raised)',border:`2px solid ${isTop?'#FFD700':'var(--b2)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{fontSize:17,fontWeight:900,color:isTop?'#FFD700':'var(--t3)',fontFamily:'var(--mono)'}}>#{i+1}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{fontSize:18,fontWeight:900,color:isTop?'#FFD700':'var(--t1)'}}>{r.rede}</span>
                          {isTop&&<span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:99,background:'rgba(255,215,0,0.15)',color:'#FFD700',border:'1px solid rgba(255,215,0,0.25)'}}>TOP</span>}
                          <span className="t-small">{r.nMetas} meta{r.nMetas!==1?'s':''}</span>
                        </div>
                        <div style={{height:4,background:'rgba(255,255,255,0.05)',borderRadius:99,overflow:'hidden'}}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barW}%` }}
                            transition={{ duration: 1, delay: i * 0.08, ease: [0.4,0,0.2,1] }}
                            style={{height:'100%',borderRadius:99,background:isTop?'linear-gradient(90deg,#FFD700,#f5a623)':pos?'linear-gradient(90deg,#22C55E,#4ADE80)':'linear-gradient(90deg,#EF4444,#f87171)'}}/>
                        </div>
                      </div>
                      <span className="t-num" style={{fontSize:isTop?24:20,fontWeight:900,flexShrink:0,color:isTop?'#FFD700':pos?'#22C55E':'#EF4444',textShadow:isTop?'0 0 15px rgba(255,215,0,0.2)':'none'}}>
                        {pos?'+':''}R$ {fmt(r.lucroFinal)}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ TEAM ═══ */}
        {tab==='team' && (
          <motion.div key="team"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}>
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
              <motion.div className="card" style={{ padding:24 }} {...fadeUp(0)}>
                <h3 className="t-h3" style={{ fontSize:14, marginBottom:6 }}>Gerar link de convite</h3>
                <p className="t-small" style={{ marginBottom:16 }}>Envie o link para o operador. Ele cria a conta e aceita entrar na sua equipe.</p>
                <motion.button onClick={sendInvite} className="btn btn-brand" disabled={invSaving} style={{ width:'100%', justifyContent:'center', marginBottom:12 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                  {invSaving ? 'Gerando...' : <><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Gerar novo link</>}
                </motion.button>
                {invMsg && <div className={invMsg.startsWith('Erro')?'alert-error':'alert-success'} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>{invMsg}</div>}

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
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/invite?token=${inv.token}`);setInvMsg('Link copiado!')}} className="btn btn-ghost btn-sm" style={{ padding:'5px 8px' }}>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={()=>deleteInvite(inv.id)} className="btn btn-danger btn-sm" style={{ padding:'5px 8px' }}>
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Operators list */}
              <motion.div className="card" style={{ padding:24 }} {...fadeUp(1)}>
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
                    <motion.div key={op.id} className="data-row"
                      {...fadeSlideX(i, 0.1)}
                      whileHover={{ x: 4, background: 'var(--overlay)', transition: { duration: 0.15 } }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <motion.div
                          whileHover={{ scale: 1.1, boxShadow: '0 0 12px rgba(59,130,246,0.3)' }}
                          style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(59,130,246,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'box-shadow 0.2s' }}>
                          <span style={{ fontSize:12, fontWeight:800, color:'white' }}>{getName(op)[0].toUpperCase()}</span>
                        </motion.div>
                        <div>
                          <p style={{ fontSize:13, fontWeight:600, color:'var(--t1)', margin:0 }}>{getName(op)}</p>
                          <p className="t-small">{op.email}</p>
                        </div>
                      </div>
                      <span className="badge badge-brand" style={{ fontSize:9 }}>{op.role}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ═══ TRASH ═══ */}
        {tab==='trash' && (
          <motion.div key="trash"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </div>
              <div>
                <h2 className="t-h2" style={{ margin:'0 0 3px' }}>Lixeira</h2>
                <p className="t-small">Metas excluidas podem ser restauradas ou removidas permanentemente</p>
              </div>
            </div>

            {trashMetas.length === 0 ? (
              <div style={{ border:'1px dashed var(--b2)', borderRadius:16, padding:64, textAlign:'center' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </div>
                <p style={{ color:'var(--t2)', fontSize:14, fontWeight:600, marginBottom:4 }}>Lixeira vazia</p>
                <p className="t-small">Metas excluidas aparecerao aqui para restauracao.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {trashMetas.map((m, i) => {
                  const op = operators.find(o => o.id === m.operator_id)
                  const mRem = remessas.filter(r => r.meta_id === m.id)
                  const liq = mRem.reduce((a, r) => a + Number(r.lucro || 0) - Number(r.prejuizo || 0), 0)
                  const deletedDate = m.deleted_at ? new Date(m.deleted_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : ''
                  return (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05, ease }}
                      style={{
                        padding:'18px 22px', borderRadius:16,
                        background:'var(--surface)', border:'1px solid var(--b1)',
                        display:'flex', alignItems:'center', gap:16,
                        transition:'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.background = 'var(--raised)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.background = 'var(--surface)' }}
                    >
                      {/* Icon */}
                      <div style={{ width:42, height:42, borderRadius:12, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:15, fontWeight:700, color:'var(--t1)' }}>{m.titulo}</span>
                          {m.rede && <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'rgba(59,130,246,0.1)', color:'var(--brand-bright)', border:'1px solid rgba(59,130,246,0.2)' }}>{m.rede}</span>}
                          <span style={{ fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:6, background:'rgba(239,68,68,0.08)', color:'var(--loss)', border:'1px solid rgba(239,68,68,0.15)' }}>Excluida</span>
                        </div>
                        <p className="t-small">
                          {getName(op)} · {mRem.length} remessas · Resultado: <span style={{ color: liq >= 0 ? 'var(--profit)' : 'var(--loss)', fontFamily:'var(--mono)', fontWeight:600 }}>{liq >= 0 ? '+' : ''}R$ {fmt(liq)}</span>
                        </p>
                        <p style={{ fontSize:10, color:'var(--t4)', marginTop:2 }}>Excluida em {deletedDate}</p>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <motion.button
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={async () => {
                            await fetch('/api/meta/restore', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ meta_id:m.id }) })
                            loadAll()
                          }}
                          className="btn btn-sm"
                          style={{ background:'rgba(34,197,94,0.08)', color:'var(--profit)', border:'1px solid rgba(34,197,94,0.2)', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}
                        >
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                          Restaurar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={async () => {
                            if (!confirm('Excluir PERMANENTEMENTE esta meta e todas as remessas? Esta acao nao pode ser desfeita.')) return
                            await fetch('/api/meta/purge', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ meta_id:m.id }) })
                            loadAll()
                          }}
                          className="btn btn-sm"
                          style={{ background:'rgba(239,68,68,0.08)', color:'var(--loss)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}
                        >
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Excluir
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        </AnimatePresence>
      </div>

      {/* ── Notification toast ── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease }}
            style={{
            position:'fixed', bottom:24, right:24, zIndex:10001,
            padding:'16px 20px', borderRadius:16, maxWidth:360,
            background:notification.pos?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)',
            border:`1px solid ${notification.pos?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)'}`,
            backdropFilter:'blur(20px)',
            boxShadow:`0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${notification.pos?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'}`,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(59,130,246,0.2))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:13,fontWeight:800,color:'white'}}>{notification.op[0]?.toUpperCase()}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{notification.op}</span>
                {notification.rede && <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:5,background:'rgba(59,130,246,0.12)',color:'var(--brand-bright)'}}>{notification.rede}</span>}
              </div>
              <p style={{fontSize:11,color:'var(--t3)',margin:0}}>Nova remessa registrada</p>
            </div>
            <span className="t-num" style={{fontSize:16,fontWeight:800,color:notification.pos?'var(--profit)':'var(--loss)',flexShrink:0}}>
              {notification.pos?'+':'-'}R$ {fmt(notification.val)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

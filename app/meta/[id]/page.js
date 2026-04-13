'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import Header from '../../../components/Header'
import { supabase } from '../../../lib/supabase/client'
import { notifyRemessaCreated } from '../../../lib/notify'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

function AdminCloseModal({ meta, lucroAcum, prejAcum, liqAcum, onClose, onSaved }) {
  const [salPlat, setSalPlat] = useState(String(meta.salario_plataforma||''))
  const [bau, setBau] = useState(String(meta.bau||''))
  const [gastos, setGastos] = useState(String(meta.gastos_operacionais||''))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const salP = Number(salPlat||0), bauV = Number(bau||0), gastosV = Number(gastos||0)
  const lucroFinal = lucroAcum + salP + bauV
  const prejFinal = prejAcum + gastosV
  const resultado = lucroFinal - prejFinal

  async function confirm() {
    if(saving) return
    setSaving(true); setErr('')
    const res = await fetch('/api/meta/update-costs', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        meta_id:meta.id, salario:salP, custo_fixo:gastosV, taxa_agente:0,
        close:true, lucro_final:resultado,
      }),
    })
    // Also save the new fields
    await supabase.from('metas').update({
      salario_plataforma:salP, bau:bauV, gastos_operacionais:gastosV,
    }).eq('id',meta.id)
    setSaving(false)
    const json = await res.json()
    if(json.error){setErr(json.error);return}
    onSaved()
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(4,8,16,0.92)',backdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,background:'var(--surface)',borderRadius:24,border:'1px solid rgba(59,130,246,0.2)',boxShadow:'0 40px 80px rgba(0,0,0,0.6)',animation:'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both',overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'24px 28px',background:'linear-gradient(135deg,rgba(59,130,246,0.1),transparent)',borderBottom:'1px solid var(--b1)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:'var(--profit-dim)',border:'1px solid var(--profit-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <h2 style={{fontSize:17,fontWeight:800,color:'var(--t1)',margin:'0 0 2px'}}>Fechamento da meta</h2>
                <p className="t-small">{meta.titulo} · {meta.rede}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{padding:'6px 8px'}}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div style={{padding:'24px 28px'}}>
          {/* Resultado acumulado */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:22}}>
            {[
              {l:'Lucro acumulado',v:`R$ ${fmt(lucroAcum)}`,c:'var(--profit)'},
              {l:'Prejuizo acumulado',v:`R$ ${fmt(prejAcum)}`,c:'var(--loss)'},
              {l:'Resultado',v:`${liqAcum>=0?'+':''}R$ ${fmt(liqAcum)}`,c:liqAcum>=0?'var(--profit)':'var(--loss)'},
            ].map(({l,v,c})=>(
              <div key={l} style={{textAlign:'center',background:'var(--raised)',borderRadius:10,padding:12,border:'1px solid var(--b1)'}}>
                <p className="t-label" style={{fontSize:9,marginBottom:4}}>{l}</p>
                <p className="t-num" style={{fontSize:14,fontWeight:700,color:c}}>{v}</p>
              </div>
            ))}
          </div>

          {/* Inputs */}
          <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:22}}>
            <div>
              <label className="t-label" style={{display:'block',marginBottom:6}}>Salario da plataforma (R$) <span style={{color:'var(--profit)',fontWeight:400}}>+ lucro</span></label>
              <input className="input" type="number" step="0.01" min="0" value={salPlat} onChange={e=>setSalPlat(e.target.value)} placeholder="0,00"/>
            </div>
            <div>
              <label className="t-label" style={{display:'block',marginBottom:6}}>BAU (R$) <span style={{color:'var(--profit)',fontWeight:400}}>+ lucro</span></label>
              <input className="input" type="number" step="0.01" min="0" value={bau} onChange={e=>setBau(e.target.value)} placeholder="0,00"/>
            </div>
            <div>
              <label className="t-label" style={{display:'block',marginBottom:6}}>Gastos operacionais (R$) <span style={{color:'var(--loss)',fontWeight:400}}>− prejuizo</span></label>
              <input className="input" type="number" step="0.01" min="0" value={gastos} onChange={e=>setGastos(e.target.value)} placeholder="0,00"/>
            </div>
          </div>

          {/* Resumo final */}
          <div style={{background:'var(--raised)',border:'1px solid var(--b1)',borderRadius:14,padding:16,marginBottom:20}}>
            {[
              {l:'Lucro final',v:`R$ ${fmt(lucroFinal)}`,c:'var(--profit)',d:'Acumulado + Salario + BAU'},
              {l:'Prejuizo final',v:`R$ ${fmt(prejFinal)}`,c:'var(--loss)',d:'Acumulado + Gastos'},
            ].map(({l,v,c,d})=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--b1)'}}>
                <div><span style={{fontSize:12,color:'var(--t2)'}}>{l}</span><p className="t-small" style={{margin:0}}>{d}</p></div>
                <span className="t-num" style={{fontSize:14,fontWeight:700,color:c}}>{v}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0'}}>
              <span style={{fontSize:15,fontWeight:800,color:'var(--t1)'}}>Resultado final</span>
              <span className="t-num" style={{fontSize:26,fontWeight:900,color:resultado>=0?'var(--profit)':'var(--loss)'}}>
                {resultado>=0?'+':''}R$ {fmt(resultado)}
              </span>
            </div>
          </div>

          {err && <div className="alert-error" style={{marginBottom:14,display:'flex',alignItems:'center',gap:8,fontSize:12}}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{err}</div>}

          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose} className="btn btn-ghost" style={{flex:1}}>Cancelar</button>
            <button onClick={confirm} disabled={saving} className="btn btn-profit" style={{flex:2}}>
              {saving?'Salvando...':<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Confirmar fechamento</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, color, small=false }) {
  return (
    <div style={{ background:'var(--raised)', border:'1px solid var(--b1)', borderRadius:12, padding:small?'12px 14px':'16px 18px', transition:'all 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--b2)';e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b1)';e.currentTarget.style.transform=''}}>
      <p className="t-label" style={{ marginBottom:6 }}>{label}</p>
      <p className="t-num" style={{ fontSize:small?16:20, fontWeight:700, color }}>{value}</p>
    </div>
  )
}

export default function MetaPage() {
  const router = useRouter()
  const { id } = useParams()
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [meta,    setMeta]    = useState(null)
  const [remessas,setRemessas]= useState([])
  const [loading, setLoading] = useState(true)
  const [salvando,setSalvando]= useState(false)
  const [error,   setError]   = useState('')
  const [tipo,    setTipo]    = useState('remessa')
  const [tituloR, setTituloR] = useState('')
  const [saldoIni,setSaldoIni]= useState('1500')
  const [dep,     setDep]     = useState('')
  const [showAdminClose, setShowAdminClose] = useState(false)
  const [saq,     setSaq]     = useState('')
  const [statusProb, setStatusProb] = useState('normal')
  const [editRem, setEditRem] = useState(null)
  const [editDep, setEditDep] = useState('')
  const [editSaq, setEditSaq] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [contasRemessa, setContasRemessa] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [tenantSlots, setTenantSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')

  useEffect(()=>{ if(id) fetchData() },[id])

  async function fetchData() {
    setLoading(true)
    const { data:s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const [{ data:p },{ data:m },{ data:r }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id',u.id).maybeSingle(),
      supabase.from('metas').select('*').eq('id',id).single(),
      supabase.from('remessas').select('*').eq('meta_id',id).order('created_at',{ascending:true}),
    ])
    setProfile(p)
    // Admin can view all metas in their tenant; operator only their own
    if (m && m.operator_id !== u.id && p?.role !== 'admin') { router.push('/operator'); return }
    setMeta(m||null); setRemessas(r||[])
    if (m?.tenant_id) {
      const { data: tenantData } = await supabase.from('tenants').select('favorite_slots').eq('id', m.tenant_id).maybeSingle()
      setTenantSlots(tenantData?.favorite_slots || [])
    }
    setLoading(false)
  }

  // ── Feedback operacional instantaneo ──
  function getOperationalFeedback(diff, statusProblema, nContasRemessa) {
    const perConta = nContasRemessa > 0 ? diff / nContasRemessa : diff
    const avgPrej = remessas.length > 0
      ? remessas.filter(r => Number(r.resultado || 0) < 0).reduce((a, r) => a + Math.abs(Number(r.resultado || 0)), 0) / Math.max(remessas.filter(r => Number(r.resultado || 0) < 0).length, 1)
      : 0

    // 1. Bloqueio
    if (statusProblema === 'conta_bloqueada') {
      return { type: 'critical', title: 'Bloqueio registrado', text: 'Avise o ADMIN para acompanhamento imediato.', icon: 'lock' }
    }

    // 2. Saque pendente
    if (statusProblema === 'saque_pendente') {
      return { type: 'warn', title: 'Saque pendente detectado', text: 'Lembrete: alinhe com o ADMIN sobre essa remessa.', icon: 'clock' }
    }

    // 3. Banco em analise
    if (statusProblema === 'banco_analise') {
      return { type: 'warn', title: 'Banco em analise', text: 'Informe o ADMIN. Aguarde confirmacao antes de prosseguir.', icon: 'alert' }
    }

    // Faixas por conta (valor absoluto do prejuizo):
    // Lucro ou prejuizo ate 3/conta: BOM
    // Prejuizo 4-8/conta: dentro do esperado
    // Prejuizo 9-12/conta: comecou ficar ruim
    // Prejuizo 13-16/conta: muito ruim
    // Prejuizo >16/conta: pessimo, alerta critico

    const absPer = Math.abs(perConta)

    if (diff < 0 && absPer > 16) {
      const msgs = [
        'Prejuizo critico. Pare e consulte o ADMIN imediatamente.',
        'Resultado pessimo — considere pausar a operacao agora.',
        'Alerta maximo. Nao continue sem alinhar com o ADMIN.',
      ]
      return { type: 'critical', title: `Prejuizo critico: R$ ${fmt(Math.abs(diff))} (R$ ${fmt(absPer)}/conta)`, text: msgs[Math.floor(Math.random() * msgs.length)], icon: 'x' }
    }

    if (diff < 0 && absPer > 12) {
      return { type: 'critical', title: `Prejuizo alto: R$ ${fmt(Math.abs(diff))} (R$ ${fmt(absPer)}/conta)`, text: 'Situacao muito ruim. Avise o ADMIN e avalie trocar de slot.', icon: 'x' }
    }

    if (diff < 0 && absPer > 8) {
      return { type: 'warn', title: `Atencao: R$ ${fmt(Math.abs(diff))} (R$ ${fmt(absPer)}/conta)`, text: 'Prejuizo acima do ideal. Fique atento nas proximas remessas.', icon: 'alert' }
    }

    if (diff < 0 && absPer > 3) {
      const msgs = [
        'Dentro do esperado. Segue operando normalmente.',
        'Prejuizo aceitavel, faz parte. Bora pra proxima!',
        'Normal na operacao. Continua firme.',
      ]
      return { type: 'good', title: `R$ ${fmt(Math.abs(diff))} (R$ ${fmt(absPer)}/conta)`, text: msgs[Math.floor(Math.random() * msgs.length)], icon: 'check' }
    }

    if (diff < 0 && absPer <= 3) {
      const msgs = [
        'Prejuizo minimo, ta de boa! Segue firme.',
        'Resultado controlado. Faz parte, bora pra proxima!',
        'Leve prejuizo, nada preocupante. Continua.',
      ]
      return { type: 'good', title: `R$ ${fmt(Math.abs(diff))} (R$ ${fmt(absPer)}/conta)`, text: msgs[Math.floor(Math.random() * msgs.length)], icon: 'check' }
    }

    // Lucro (qualquer valor ate 3/conta ou acima)
    if (diff >= 0) {
      const msgs = [
        'Mandou bem, continua assim!',
        'Ai sim, bora pra cima!',
        'Boa! Mantem esse ritmo.',
        'Ta no controle, segue firme!',
        'Show! Operacao no caminho certo.',
      ]
      return { type: 'good', title: `+R$ ${fmt(diff)}${nContas > 0 ? ` (R$ ${fmt(perConta)}/conta)` : ''}`, text: msgs[Math.floor(Math.random() * msgs.length)], icon: 'check' }
    }

    // Fallback
    if (diff > 0) {
      return { type: 'good', title: `Lucro: +R$ ${fmt(diff)}`, text: 'Excelente resultado! Mantem o foco.', icon: 'check' }
    }

    return null
  }

  function showFeedback(diff, statusProblema, nContasRem) {
    const fb = getOperationalFeedback(diff, statusProblema, nContasRem)
    if (fb) {
      setFeedback(fb)
      setTimeout(() => setFeedback(null), 6000)
    }
    // Push motivacional pro operador quando registra lucro
    if (diff >= 0) {
      const msgs = [
        'Mandou bem! Continua nesse ritmo.',
        'Boa remessa! Segue firme.',
        'Ai sim! Operacao no caminho certo.',
        'Show de bola! Bora pra cima.',
        'Ta voando! Mantem o foco.',
      ]
      const msg = msgs[Math.floor(Math.random() * msgs.length)]
      fetch('/api/push/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, title: 'Remessa registrada!', body: `+R$ ${fmt(diff)} — ${msg}`, url: `/meta/${id}` }),
      }).catch(() => {})
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!dep||!saq||salvando) return
    if (meta?.status==='finalizada'||meta?.status_fechamento==='fechada') { setError('Meta finalizada. Nao e possivel registrar.'); return }
    setSalvando(true); setError('')
    const d=Number(dep),s=Number(saq),si=Number(saldoIni||0),diff=s-d
    const { error:err } = await supabase.from('remessas').insert({
      meta_id:Number(id),
      titulo:tituloR.trim()||`${tipo==='redeposito'?'Redepósito':tipo==='ajuste'?'Ajuste':'Remessa'} ${remessas.length+1}`,
      tipo, saldo_inicial:si, deposito:d, saque:s,
      lucro:diff>0?diff:0, prejuizo:diff<0?Math.abs(diff):0, resultado:diff,
      resultado_por_conta: Number(contasRemessa||0) > 0 ? Number((diff / Number(contasRemessa)).toFixed(2)) : 0,
      tenant_id:profile?.tenant_id,
      status_problema:statusProb,
      contas_remessa: tipo === 'redeposito' ? 0 : Number(contasRemessa||0),
      slot_name: selectedSlot || null,
    })
    setSalvando(false)
    if (err) { setError(err.message); return }
    setTituloR(''); setTipo('remessa'); setSaldoIni('1500'); setDep(''); setSaq(''); setStatusProb('normal'); setContasRemessa(''); setSelectedSlot('')
    showFeedback(diff, statusProb, Number(contasRemessa||0))
    notifyRemessaCreated(meta?.tenant_id||profile?.tenant_id, getName(profile), meta?.rede||'', diff)
    fetchData()
  }

  async function toggleStatus() {
    if (!meta) return
    const isAdmin = profile?.role === 'admin'
    const isClosed = meta.status_fechamento === 'fechada'
    const isFinalize = meta.status !== 'finalizada' && !isClosed

    // Operators can reactivate too (logged)

    // Admin finalizing → open closing modal
    if (isAdmin && isFinalize) {
      setShowAdminClose(true)
      return
    }

    // Reactivate (admin can reactivate even closed metas)
    const action = (meta.status === 'finalizada' || isClosed) ? 'reactivate' : 'finalize'
    try {
      const res = await fetch('/api/meta/close', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ meta_id: meta.id, action }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      // Log action
      fetch('/api/meta/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        meta_id:meta.id,user_id:user?.id,tenant_id:meta?.tenant_id||profile?.tenant_id,
        action:action==='reactivate'?'meta_reactivated':'meta_status_changed',
        description:action==='reactivate'?`${getName(profile)} reativou a meta "${meta.titulo}"`:`${getName(profile)} alterou status da meta "${meta.titulo}"`,
      })}).catch(()=>{})
    } catch(e) { /* silent */ }
    fetchData()
  }

  async function saveEditRem() {
    if (!editRem||editSaving) return
    setEditSaving(true)
    const d=Number(editDep),s=Number(editSaq),diff=s-d
    await supabase.from('remessas').update({
      deposito:d, saque:s,
      lucro:diff>0?diff:0, prejuizo:diff<0?Math.abs(diff):0, resultado:diff,
      resultado_por_conta: Number(editRem.contas_remessa||0) > 0 ? Number((diff / Number(editRem.contas_remessa)).toFixed(2)) : 0,
    }).eq('id',editRem.id)
    setEditSaving(false)
    setEditRem(null)
    fetchData()
  }

  const totais = useMemo(()=>{
    let lucro=0,prej=0,d=0,s=0
    remessas.forEach(r=>{lucro+=Number(r.lucro||0);prej+=Number(r.prejuizo||0);d+=Number(r.deposito||0);s+=Number(r.saque||0)})
    return {lucro,prej,d,s,liq:lucro-prej}
  },[remessas])

  const prev = useMemo(()=>{ const diff=Number(saq||0)-Number(dep||0); return{diff,pos:diff>=0} },[dep,saq])

  const pctAcerto = remessas.length>0?Math.round((remessas.filter(r=>Number(r.resultado||0)>=0).length/remessas.length)*100):0

  const fbCfg = {
    good: { bg: 'linear-gradient(145deg, #0a1a12, #0c1424)', border: 'rgba(34,197,94,0.3)', color: '#22C55E', iconPath: 'M20 6L9 17l-5-5' },
    warn: { bg: 'linear-gradient(145deg, #1a1608, #14120a)', border: 'rgba(245,158,11,0.3)', color: '#F59E0B', iconPath: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
    critical: { bg: 'linear-gradient(145deg, #1a0a0a, #140c0c)', border: 'rgba(239,68,68,0.3)', color: '#EF4444', iconPath: 'M18 6L6 18M6 6l12 12' },
  }

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role==='admin'} userId={user?.id} tenantId={profile?.tenant_id}/>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (() => {
          const c = fbCfg[feedback.type]
          return (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
              style={{
                position: 'fixed', top: 20, right: 20, zIndex: 9999,
                maxWidth: 400, padding: '18px 22px', borderRadius: 16,
                background: c.bg, border: `1.5px solid ${c.border}`,
                boxShadow: '0 16px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                cursor: 'pointer',
              }}
              onClick={() => setFeedback(null)}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d={c.iconPath} />
              </svg>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: c.color, margin: '0 0 4px' }}>{feedback.title}</p>
                <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>{feedback.text}</p>
              </div>
              {/* Progress bar timer */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
                style={{ position: 'absolute', bottom: 0, left: 0, height: 3, borderRadius: '0 0 16px 16px', background: c.color, opacity: 0.5 }}
              />
            </motion.div>
          )
        })()}
      </AnimatePresence>

      <div style={{ maxWidth:1380, margin:'0 auto', padding:'32px 28px' }}>
        {/* Header */}
        <div className="a1" style={{ marginBottom:28 }}>
          <button onClick={()=>router.push(profile?.role==='admin'?'/admin':'/operator')} className="btn btn-ghost btn-sm" style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:16 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar ao painel
          </button>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <h1 className="t-h1">{loading?'Carregando...':meta?.titulo||'Meta'}</h1>
                <span className={`badge ${meta?.status_fechamento==='fechada'?'badge-profit':meta?.status==='finalizada'?'badge-loss':'badge-brand'}`}>
                  {meta?.status_fechamento==='fechada'?'Fechada':meta?.status||'Ativa'}
                </span>
              </div>
              {meta?.observacoes && <p className="t-body" style={{ marginBottom:4 }}>{meta.observacoes}</p>}
              <p className="t-small">{meta?.quantidade_contas||0} contas · {remessas.length} remessas · {pctAcerto}% de acerto</p>
            </div>
            <button onClick={toggleStatus} className={`btn ${meta?.status==='finalizada'?'btn-profit':'btn-danger'}`}>
              {meta?.status==='finalizada'?<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg> Reativar meta</>:<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Finalizar meta</>}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="g-5" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:28 }}>
          <KPI label="Depósito total"    value={`R$ ${fmt(totais.d)}`}   color="var(--t2)"/>
          <KPI label="Saque total"       value={`R$ ${fmt(totais.s)}`}   color="var(--t2)"/>
          <KPI label="Lucro acumulado"   value={`R$ ${fmt(totais.lucro)}`} color="var(--profit)"/>
          <KPI label="Prejuízo acum."    value={`R$ ${fmt(totais.prej)}`}  color="var(--loss)"/>
          <div style={{ background:totais.liq>=0?'var(--profit-dim)':'var(--loss-dim)', border:`1px solid ${totais.liq>=0?'var(--profit-border)':'var(--loss-border)'}`, borderRadius:12, padding:'16px 18px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <p className="t-label" style={{ marginBottom:8 }}>Resultado líquido</p>
            <p className="t-num" style={{ fontSize:22, fontWeight:800, color:totais.liq>=0?'var(--profit)':'var(--loss)' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points={totais.liq>=0?'18 15 12 9 6 15':'6 9 12 15 18 9'}/></svg>{totais.liq>=0?'+':''}</span>R$ {fmt(Math.abs(totais.liq))}
            </p>
          </div>
        </div>

        {/* Insights + Previsao + Score */}
        {remessas.length >= 2 && (() => {
          const insights = []
          const ordered = [...remessas].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          const nContas = Number(meta?.quantidade_contas || 0)
          const avgPerConta = nContas > 0 ? totais.liq / nContas : 0
          const avgPerRemessa = remessas.length > 0 ? totais.liq / remessas.length : 0

          // Calcular prejuizo medio por conta das remessas (pra contexto)
          const remsComContas = remessas.filter(r => Number(r.contas_remessa || 0) > 0)
          const avgPrejPerConta = remsComContas.length > 0
            ? remsComContas.filter(r => Number(r.resultado || 0) < 0).reduce((a, r) => a + Math.abs(Number(r.resultado || 0)) / Number(r.contas_remessa), 0) / Math.max(remsComContas.filter(r => Number(r.resultado || 0) < 0).length, 1)
            : 0

          // A) Sequencia — so alerta se prejuizo por conta for alto
          let streak = 0
          let streakTotal = 0
          for (let i = ordered.length - 1; i >= 0; i--) {
            const res = Number(ordered[i].resultado || 0)
            if (res < 0) { streak++; streakTotal += res }
            else break
          }
          // Sequencia so e preocupante se > 4 seguidas OU se media da sequencia > R$8/conta
          const streakPerConta = streak > 0 && nContas > 0 ? Math.abs(streakTotal) / nContas : 0
          if (streak >= 5 || (streak >= 3 && streakPerConta > 12)) {
            insights.push({ text: `${streak} remessas seguidas negativas com media de R$ ${fmt(streakPerConta)}/conta`, type: 'critical', action: 'Avaliar trocar de slot ou pausar operacao' })
          } else if (streak >= 4 || (streak >= 3 && streakPerConta > 8)) {
            insights.push({ text: `${streak} remessas seguidas com prejuizo — fique atento`, type: 'warn', action: 'Normal na operacao, mas observe as proximas' })
          }
          // Sequencia de 2-3 com prejuizo leve NAO gera alerta (e normal)

          // B) Media por conta — calibrada pro modelo real
          // Prejuizo ate R$8/conta e NORMAL na operacao (salario compensa)
          if (nContas > 0) {
            if (avgPerConta > 2) insights.push({ text: `Operacao positiva: R$ ${fmt(avgPerConta)}/conta em ${remessas.length} remessas`, type: 'good', action: 'Continuar no ritmo atual' })
            else if (avgPerConta >= -8) insights.push({ text: `Operacao dentro do esperado: R$ ${fmt(avgPerConta)}/conta`, type: 'good', action: 'Prejuizo controlado — faz parte da operacao' })
            else if (avgPerConta >= -12) insights.push({ text: `Atencao: media de R$ ${fmt(avgPerConta)}/conta — acima do ideal`, type: 'warn', action: 'Monitorar proximas remessas com cuidado' })
            else insights.push({ text: `Media alta de prejuizo: R$ ${fmt(avgPerConta)}/conta`, type: 'critical', action: 'Considerar trocar rede ou reduzir volume' })
          }

          // C) Pendencias — informativo, nao alarmista
          const probs = remessas.filter(r => r.status_problema && r.status_problema !== 'normal')
          if (probs.length > 0) {
            const sp = probs.filter(r => r.status_problema === 'saque_pendente').length
            const cb = probs.filter(r => r.status_problema === 'conta_bloqueada').length
            const ba = probs.filter(r => r.status_problema === 'banco_analise').length
            const parts = []
            if (sp) parts.push(`${sp} saque${sp > 1 ? 's' : ''} pendente${sp > 1 ? 's' : ''}`)
            if (cb) parts.push(`${cb} conta${cb > 1 ? 's' : ''} bloqueada${cb > 1 ? 's' : ''}`)
            if (ba) parts.push(`${ba} em analise bancaria`)
            // Bloqueios e saques pendentes sao comuns — so warn, nao critical
            insights.push({ text: `Pendencias: ${parts.join(', ')}`, type: 'warn', action: 'Resolver quando possivel — nao impede operacao' })
          }

          // D) Tendencia — so alerta se queda for significativa
          if (ordered.length >= 6) {
            const half = Math.floor(ordered.length / 2)
            const first = ordered.slice(0, half).reduce((a, r) => a + Number(r.resultado || 0), 0) / half
            const second = ordered.slice(half).reduce((a, r) => a + Number(r.resultado || 0), 0) / (ordered.length - half)
            if (second > first && second > 0) insights.push({ text: `Tendencia positiva: resultados melhorando`, type: 'good', action: 'Manter ritmo' })
            // So alerta queda se for muito significativa (>50% piora)
            else if (second < first * 0.3 && Math.abs(second) > 5) insights.push({ text: `Queda significativa nos resultados`, type: 'warn', action: 'Observar proximas remessas' })
          }

          if (insights.length === 0) insights.push({ text: `Operacao estavel — ${remessas.length} remessas registradas`, type: 'good', action: 'Tudo dentro do esperado. Continuar normalmente.' })

          // Score (0-100) — calibrado: prejuizo leve nao penaliza
          let score = 65 // Base mais alta (operacao normal comeca em 65)
          if (avgPerConta > 2) score += 20
          else if (avgPerConta >= -3) score += 10 // Prejuizo leve = ainda bom
          else if (avgPerConta >= -8) score += 0 // Esperado = neutro
          else if (avgPerConta >= -12) score -= 10 // Atencao
          else score -= 25 // Critico
          if (streak >= 5) score -= 15; else if (streak >= 3 && streakPerConta > 8) score -= 8
          if (probs.length > 3) score -= 5 // Muitas pendencias
          const pctDone = nContas > 0 ? (remessas.filter(r => r.tipo !== 'redeposito').reduce((a, r) => a + Number(r.contas_remessa || 0), 0) / nContas) : 0
          score += Math.round(pctDone * 15) // Progresso bonus
          score = Math.max(0, Math.min(100, score))
          const scoreColor = score >= 70 ? 'var(--profit)' : score >= 40 ? 'var(--warn)' : 'var(--loss)'

          // Previsao
          const contasRestantes = nContas - remessas.filter(r => r.tipo !== 'redeposito').reduce((a, r) => a + Number(r.contas_remessa || 0), 0)
          const previsaoFinal = nContas > 0 ? avgPerConta * nContas : 0

          const cfg = { good: { bg: 'var(--profit-dim)', border: 'var(--profit-border)', color: 'var(--profit)', icon: 'M20 6L9 17l-5-5' }, warn: { bg: 'var(--warn-dim)', border: 'var(--warn-border)', color: 'var(--warn)', icon: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' }, critical: { bg: 'var(--loss-dim)', border: 'var(--loss-border)', color: 'var(--loss)', icon: 'M18 6L6 18M6 6l12 12' } }

          return (
            <div style={{ marginBottom: 24 }}>
              {/* Score + Previsao row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {/* Score */}
                <div style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--surface)', border: `1px solid ${score >= 70 ? 'var(--profit-border)' : score >= 40 ? 'var(--warn-border)' : 'var(--loss-border)'}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${scoreColor}15`, border: `2px solid ${scoreColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor, fontFamily: 'var(--mono, monospace)' }}>{score}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: '0 0 3px' }}>Score da operacao</p>
                    <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{score >= 70 ? 'Operacao saudavel' : score >= 40 ? 'Requer atencao' : 'Situacao critica'}</p>
                  </div>
                </div>

                {/* Previsao */}
                <div style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--surface)', border: `1px solid ${previsaoFinal >= 0 ? 'var(--profit-border)' : 'var(--loss-border)'}` }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Previsao da meta</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: previsaoFinal >= 0 ? 'var(--profit)' : 'var(--loss)', margin: '0 0 4px', fontFamily: 'var(--mono, monospace)' }}>
                    {previsaoFinal >= 0 ? '+' : ''}R$ {fmt(previsaoFinal)}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--t4)', margin: 0 }}>
                    {nContas} contas × R$ {fmt(avgPerConta)}/conta
                    {contasRestantes > 0 ? ` · ${contasRestantes} restantes` : ''}
                  </p>
                </div>
              </div>

              {/* Insights */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Insights da operacao</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '2px 7px', borderRadius: 5 }}>AI</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((ins, i) => {
                  const c = cfg[ins.type]
                  return (
                    <div key={i} style={{ padding: '14px 18px', borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d={c.icon}/></svg>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: c.color, margin: '0 0 4px' }}>{ins.text}</p>
                        <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{ins.action}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Progress bar - contas processadas */}
        {meta && (() => {
          const target = Number(meta.quantidade_contas || 0)
          const done = remessas.reduce((sum, r) => sum + Number(r.contas_remessa || 0), 0)
          const pct = target > 0 ? Math.min(Math.round((done / target) * 100), 100) : 0
          return target > 0 ? (
            <div style={{ marginBottom: 22, background: 'var(--raised)', border: '1px solid var(--b1)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Progresso: {done}/{target} contas</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? 'var(--profit)' : 'var(--brand-bright)' }}>{pct}%</span>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: pct >= 100 ? 'var(--profit)' : 'linear-gradient(90deg, #22c55e, #16a34a)', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ) : null
        })()}

        <div className="g-side" style={{ display:'grid', gridTemplateColumns:'420px 1fr', gap:22 }}>
          {/* Form */}
          <div className="card a2" style={{ padding:26, height:'fit-content', position:'sticky', top:78 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
              <div style={{ width:34,height:34,borderRadius:9,background:'var(--brand-dim)',border:'1px solid var(--brand-border)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <h2 className="t-h3">Registrar remessa</h2>
                <p className="t-small">Cada registro é calculado individualmente</p>
              </div>
            </div>

            <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:15 }}>
              <div>
                <label className="t-label" style={{ display:'block', marginBottom:8 }}>Título <span style={{ color:'var(--t4)' }}>(opcional)</span></label>
                <input className="input" value={tituloR} onChange={e=>setTituloR(e.target.value)} placeholder="Ex: 1ª remessa, 2º redepósito..."/>
              </div>
              <div>
                <label className="t-label" style={{ display:'block', marginBottom:8 }}>Tipo</label>
                <select className="input" value={tipo} onChange={e=>setTipo(e.target.value)}>
                  <option value="remessa">Remessa</option>
                  <option value="redeposito">Redepósito</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="t-label" style={{ display:'block', marginBottom:8 }}>Saldo inicial (R$)</label>
                <input className="input" type="number" step="0.01" value={saldoIni} onChange={e=>setSaldoIni(e.target.value)}/>
              </div>
              <div>
                <label className="t-label" style={{ display:'block', marginBottom:8 }}>Contas nesta remessa</label>
                <input className="input" type="number" min="0" step="1" value={contasRemessa} onChange={e=>setContasRemessa(e.target.value)} placeholder="Ex: 5"/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Depósito *</label>
                  <input className="input" type="number" step="0.01" value={dep} onChange={e=>setDep(e.target.value)} required placeholder="0,00"/>
                </div>
                <div>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Saque *</label>
                  <input className="input" type="number" step="0.01" value={saq} onChange={e=>setSaq(e.target.value)} required placeholder="0,00"/>
                </div>
              </div>

              <div>
                <label className="t-label" style={{ display:'block', marginBottom:8 }}>Status</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[
                    { k:'normal', l:'Normal', c:'var(--profit)', bg:'var(--profit-dim)', b:'var(--profit-border)' },
                    { k:'saque_pendente', l:'Saque pendente', c:'var(--warn)', bg:'var(--warn-dim)', b:'var(--warn-border)' },
                    { k:'conta_bloqueada', l:'Conta bloqueada', c:'var(--loss)', bg:'var(--loss-dim)', b:'var(--loss-border)' },
                    { k:'banco_analise', l:'Banco em analise', c:'var(--info)', bg:'var(--info-dim)', b:'var(--info-border)' },
                  ].map(s=>(
                    <button key={s.k} type="button" onClick={()=>setStatusProb(s.k)} style={{
                      padding:'6px 12px', borderRadius:8, fontSize:11, fontWeight:600, border:'none', cursor:'pointer',
                      background: statusProb===s.k ? s.bg : 'rgba(255,255,255,0.02)',
                      color: statusProb===s.k ? s.c : 'var(--t4)',
                      border: `1px solid ${statusProb===s.k ? s.b : 'var(--b1)'}`,
                      transition:'all 0.2s',
                    }}>{s.l}</button>
                  ))}
                </div>
              </div>

              {tenantSlots.length > 0 && (
                <div>
                  <label className="t-label" style={{ display:'block', marginBottom:8 }}>Slot <span style={{ color:'var(--t4)' }}>(opcional)</span></label>
                  <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4 }}>
                    {tenantSlots.map(name => {
                      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                      const active = selectedSlot === name
                      return (
                        <div key={name} onClick={() => setSelectedSlot(active ? '' : name)} style={{
                          minWidth:80, maxWidth:80, cursor:'pointer', borderRadius:10, padding:6, textAlign:'center',
                          border: active ? '2px solid var(--profit)' : '1px solid var(--b2)',
                          background: active ? 'var(--profit-dim)' : 'var(--raised)',
                          transition:'all 0.2s', flexShrink:0,
                        }}>
                          <img src={`/slots/${slug}.webp`} alt={name} style={{ width:'100%', height:60, objectFit:'contain', borderRadius:6, marginBottom:4 }} onError={e => { e.currentTarget.style.display='none' }}/>
                          <p style={{ fontSize:10, fontWeight:600, color: active ? 'var(--profit)' : 'var(--t2)', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {(dep||saq) && (
                <div style={{ background:prev.pos?'var(--profit-dim)':'var(--loss-dim)', border:`1px solid ${prev.pos?'var(--profit-border)':'var(--loss-border)'}`, borderRadius:12, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.3s' }}>
                  <div>
                    <p className="t-label" style={{ color:prev.pos?'var(--profit)':'var(--loss)', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points={prev.pos?'18 15 12 9 6 15':'6 9 12 15 18 9'}/></svg>{prev.pos?'Lucro estimado':'Prejuizo estimado'}</p>
                    {meta?.quantidade_contas&&Number(meta.quantidade_contas)>0 && <p className="t-small">R$ {fmt(Math.abs(prev.diff)/Number(meta.quantidade_contas))} / conta</p>}
                  </div>
                  <p className="t-num" style={{ fontSize:24, fontWeight:800, color:prev.pos?'var(--profit)':'var(--loss)' }}>
                    {prev.pos?'+':'−'}R$ {fmt(Math.abs(prev.diff))}
                  </p>
                </div>
              )}

              {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:8 }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

              <button type="submit" className="btn btn-profit" disabled={salvando||!dep||!saq} style={{ width:'100%', padding:'13px', fontSize:14 }}>
                {salvando?<><div className="spinner" style={{ width:14,height:14,borderTopColor:'#012b1c' }}/> Registrando...</>:<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Registrar remessa</>}
              </button>
            </form>
          </div>

          {/* Alertas de problemas */}
          {(()=>{
            const probs = remessas.filter(r=>r.status_problema && r.status_problema !== 'normal')
            const sp = probs.filter(r=>r.status_problema==='saque_pendente').length
            const cb = probs.filter(r=>r.status_problema==='conta_bloqueada').length
            const ba = probs.filter(r=>r.status_problema==='banco_analise').length
            if (probs.length === 0) return null
            return (
              <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {sp > 0 && <div style={{ padding:'8px 14px', borderRadius:10, background:'var(--warn-dim)', border:'1px solid var(--warn-border)', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--warn)' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {sp} saque{sp>1?'s':''} pendente{sp>1?'s':''}
                </div>}
                {cb > 0 && <div style={{ padding:'8px 14px', borderRadius:10, background:'var(--loss-dim)', border:'1px solid var(--loss-border)', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--loss)' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {cb} conta{cb>1?'s':''} bloqueada{cb>1?'s':''}
                </div>}
                {ba > 0 && <div style={{ padding:'8px 14px', borderRadius:10, background:'var(--info-dim)', border:'1px solid var(--info-border)', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--info)' }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {ba} banco{ba>1?'s':''} em analise
                </div>}
              </div>
            )
          })()}

          {/* Histórico */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <h2 className="t-h3">Histórico</h2>
                <p className="t-small" style={{ marginTop:2 }}>{remessas.length} remessas · mais recentes primeiro</p>
              </div>
              <button onClick={fetchData} className="btn btn-ghost btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                Sync
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {loading ? (
                <div style={{ padding:40, textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto', borderTopColor:'var(--brand-bright)' }}/></div>
              ) : remessas.length===0 ? (
                <div style={{ border:'1px dashed var(--b2)', borderRadius:14, padding:48, textAlign:'center' }}>
                  <p className="t-small">Nenhuma remessa registrada. Use o formulário ao lado.</p>
                </div>
              ) : [...remessas].reverse().map((r,i)=>{
                const pos = Number(r.resultado||0)>=0
                return (
                  <div key={r.id} className="row-card a1" style={{ animationDelay:`${i*30}ms`, padding:'16px 20px', cursor:'default' }}>
                    <div className="accent" style={{ background:pos?'linear-gradient(180deg,var(--profit),#04b876)':'linear-gradient(180deg,var(--loss),#c0294e)' }}/>
                    <div style={{ paddingLeft:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            <h4 style={{ fontSize:13,fontWeight:700,color:'var(--t1)',margin:0 }}>{r.titulo||`Registro ${remessas.length-i}`}</h4>
                            <span className={`badge ${pos?'badge-profit':'badge-loss'}`} style={{ fontSize:9, display:'inline-flex', alignItems:'center', gap:3 }}><svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points={pos?'18 15 12 9 6 15':'6 9 12 15 18 9'}/></svg>{pos?'Lucro':'Prejuizo'}</span>
                            {r.status_problema && r.status_problema !== 'normal' && (
                              <span className={`badge ${r.status_problema==='saque_pendente'?'badge-warn':r.status_problema==='conta_bloqueada'?'badge-loss':'badge-info'}`} style={{ fontSize:9 }}>
                                {r.status_problema==='saque_pendente'?'Saque pendente':r.status_problema==='conta_bloqueada'?'Conta bloqueada':'Banco em analise'}
                              </span>
                            )}
                          </div>
                          <p className="t-small">{r.tipo} · {new Date(r.created_at).toLocaleString('pt-BR')}</p>
                          {r.slot_name && <span style={{ display:'inline-block', marginTop:3, padding:'2px 8px', borderRadius:6, fontSize:9, fontWeight:600, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', color:'var(--info)' }}>{r.slot_name}</span>}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ textAlign:'right' }}>
                            <p className="t-num" style={{ fontSize:20,fontWeight:800,color:pos?'var(--profit)':'var(--loss)' }}>
                              {pos?'+':'−'}R$ {fmt(Math.abs(Number(r.resultado||0)))}
                            </p>
                            <p className="t-small">R$ {fmt(r.resultado_por_conta)} / conta</p>
                          </div>
                          <button onClick={()=>{setEditRem(r);setEditDep(String(r.deposito||''));setEditSaq(String(r.saque||''))}} style={{width:28,height:28,borderRadius:7,border:'1px solid var(--b2)',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:0.4,transition:'opacity 0.15s',flexShrink:0}}
                            onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.4'}>
                            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                        {[
                          { l:'Saldo ini.',  v:r.saldo_inicial, c:'var(--t2)' },
                          { l:'Depósito',    v:r.deposito,      c:'var(--t2)' },
                          { l:'Saque',       v:r.saque,         c:'var(--t2)' },
                          { l:'Por conta',   v:r.resultado_por_conta, c:pos?'var(--profit)':'var(--loss)' },
                        ].map(({l,v,c})=>(
                          <div key={l} style={{ background:'var(--void)', border:'1px solid var(--b1)', borderRadius:8, padding:'8px 12px' }}>
                            <p className="t-label" style={{ fontSize:9, marginBottom:4 }}>{l}</p>
                            <p className="t-num" style={{ fontSize:12, color:c }}>R$ {fmt(v)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Remessa Modal */}
      {editRem && (
        <div style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(4,8,16,0.9)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={()=>setEditRem(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:400,background:'var(--surface)',borderRadius:20,border:'1px solid var(--b2)',boxShadow:'0 40px 80px rgba(0,0,0,0.5)',animation:'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both',padding:28}}>
            <h3 style={{fontSize:16,fontWeight:800,color:'var(--t1)',margin:'0 0 4px'}}>Editar remessa</h3>
            <p className="t-small" style={{marginBottom:20}}>{editRem.titulo} · Anterior: D: R$ {fmt(editRem.deposito)} / S: R$ {fmt(editRem.saque)}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div>
                <label className="t-label" style={{display:'block',marginBottom:6}}>Deposito *</label>
                <input className="input" type="number" step="0.01" value={editDep} onChange={e=>setEditDep(e.target.value)} placeholder="0,00"/>
              </div>
              <div>
                <label className="t-label" style={{display:'block',marginBottom:6}}>Saque *</label>
                <input className="input" type="number" step="0.01" value={editSaq} onChange={e=>setEditSaq(e.target.value)} placeholder="0,00"/>
              </div>
            </div>
            {(editDep||editSaq) && (()=>{
              const d=Number(editDep||0),s=Number(editSaq||0),diff=s-d
              return (
                <div style={{padding:'12px 14px',borderRadius:12,background:diff>=0?'rgba(34,197,94,0.06)':'rgba(239,68,68,0.06)',border:`1px solid ${diff>=0?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'}`,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12,color:'var(--t2)'}}>Novo resultado</span>
                  <span className="t-num" style={{fontSize:18,fontWeight:800,color:diff>=0?'var(--profit)':'var(--loss)'}}>{diff>=0?'+':''}R$ {fmt(diff)}</span>
                </div>
              )
            })()}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setEditRem(null)} className="btn btn-ghost" style={{flex:1}}>Cancelar</button>
              <button onClick={saveEditRem} disabled={editSaving||!editDep||!editSaq} className="btn btn-brand" style={{flex:2}}>
                {editSaving?'Salvando...':'Salvar alteracao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Closing Modal */}
      {showAdminClose && (()=>{
        const lucroAcum = remessas.reduce((a,r)=>a+Number(r.lucro||0),0)
        const prejAcum = remessas.reduce((a,r)=>a+Number(r.prejuizo||0),0)
        const liqAcum = lucroAcum - prejAcum
        return (
        <AdminCloseModal
          meta={meta} lucroAcum={lucroAcum} prejAcum={prejAcum} liqAcum={liqAcum}
          onClose={()=>setShowAdminClose(false)}
          onSaved={()=>{setShowAdminClose(false);fetchData()}}
        />
        )
      })()}
    </main>
  )
}

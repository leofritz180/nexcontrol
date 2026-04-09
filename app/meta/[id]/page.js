'use client'
import { useEffect, useMemo, useState } from 'react'
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
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,background:'var(--surface)',borderRadius:24,border:'1px solid rgba(79,110,247,0.2)',boxShadow:'0 40px 80px rgba(0,0,0,0.6)',animation:'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both',overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'24px 28px',background:'linear-gradient(135deg,rgba(79,110,247,0.1),transparent)',borderBottom:'1px solid var(--b1)'}}>
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
    if (m && m.operator_id !== u.id) { router.push('/operator'); return }
    setMeta(m||null); setRemessas(r||[])
    setLoading(false)
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
      resultado_por_conta:meta?.quantidade_contas&&Number(meta.quantidade_contas)>0?Number((Math.abs(diff)/Number(meta.quantidade_contas)).toFixed(2)):0,
      tenant_id:profile?.tenant_id,
    })
    setSalvando(false)
    if (err) { setError(err.message); return }
    setTituloR(''); setTipo('remessa'); setSaldoIni('1500'); setDep(''); setSaq('')
    notifyRemessaCreated(meta?.tenant_id||profile?.tenant_id, getName(profile), meta?.rede||'', diff)
    fetchData()
  }

  async function toggleStatus() {
    if (!meta || meta.status_fechamento==='fechada') return
    const isAdmin = profile?.role === 'admin'
    const isFinalize = meta.status !== 'finalizada'

    // Admin finalizing any meta → open closing modal
    if (isAdmin && isFinalize) {
      setShowAdminClose(true)
      return
    }

    const action = meta.status==='finalizada' ? 'reactivate' : 'finalize'
    try {
      const res = await fetch('/api/meta/close', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ meta_id: meta.id, action }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
    } catch(e) { /* silent */ }
    fetchData()
  }

  const totais = useMemo(()=>{
    let lucro=0,prej=0,d=0,s=0
    remessas.forEach(r=>{lucro+=Number(r.lucro||0);prej+=Number(r.prejuizo||0);d+=Number(r.deposito||0);s+=Number(r.saque||0)})
    return {lucro,prej,d,s,liq:lucro-prej}
  },[remessas])

  const prev = useMemo(()=>{ const diff=Number(saq||0)-Number(dep||0); return{diff,pos:diff>=0} },[dep,saq])

  const pctAcerto = remessas.length>0?Math.round((remessas.filter(r=>Number(r.resultado||0)>=0).length/remessas.length)*100):0

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <Header userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role==='admin'} userId={user?.id} tenantId={profile?.tenant_id}/>

      <div style={{ maxWidth:1380, margin:'0 auto', padding:'32px 28px' }}>
        {/* Header */}
        <div className="a1" style={{ marginBottom:28 }}>
          <button onClick={()=>router.push('/operator')} className="btn btn-ghost btn-sm" style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:16 }}>
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
                          </div>
                          <p className="t-small">{r.tipo} · {new Date(r.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p className="t-num" style={{ fontSize:20,fontWeight:800,color:pos?'var(--profit)':'var(--loss)' }}>
                            {pos?'+':'−'}R$ {fmt(Math.abs(Number(r.resultado||0)))}
                          </p>
                          <p className="t-small">R$ {fmt(r.resultado_por_conta)} / conta</p>
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

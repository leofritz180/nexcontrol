'use client'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import TrialBanner, { ConversionModal } from '../../components/TrialBanner'
import AnimatedNumber from '../../components/ui/AnimatedNumber'
import { supabase } from '../../lib/supabase/client'
import { notifyMetaClosed } from '../../lib/notify'
import { ProLockedCard } from '../../components/pro/ProGate'
import ProBanner from '../../components/pro/ProBanner'
import dynamic from 'next/dynamic'
const Onboarding = dynamic(() => import('../../components/Onboarding'), { ssr: false })
import { DEMO_METAS, DEMO_REMESSAS, DEMO_INSIGHTS, DEMO_ACTIVITY, DEMO_OPERATORS, DEMO_OPERATOR_RANKING, DEMO_REDES_RANKING, DEMO_GLOBAL, DEMO_BANNER_TEXT, shouldShowDemo } from '../../lib/demo-data'

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

function ModalFechamento({ meta, remessas, operador, tenantOpModel, payModel, payValue, onClose, onSaved }) {
  const apenasBau = (meta.operation_model || tenantOpModel || 'salario_bau') === 'apenas_bau'
  const lucroRem = remessas.reduce((a,r)=>a+Number(r.lucro||0),0)
  const prejRem  = remessas.reduce((a,r)=>a+Number(r.prejuizo||0),0)
  const liqRem   = lucroRem-prejRem
  const [salario,setSalario]=useState(String(meta.salario||''))
  const [bau,    setBau]    =useState(String(meta.bau||''))
  const [custo,  setCusto]  =useState(String(meta.custo_fixo||''))
  const [taxa,   setTaxa]   =useState(String(meta.taxa_agente||''))
  const [saving, setSaving] =useState(false)
  const [error,  setError]  =useState('')

  const lucroFinal = useMemo(()=>Number((liqRem+Number(salario||0)+Number(bau||0)-Number(custo||0)-Number(taxa||0)).toFixed(2)),[salario,bau,custo,taxa,liqRem])

  // Calculo automatico pagamento operador
  const deps = Number(meta.quantidade_contas || 0)
  const isDivisao = payModel === 'divisao_resultado'
  const splitPct = isDivisao ? (payValue || 50) : 0

  const pgtoOp = useMemo(() => {
    if (!operador || meta.operator_id === meta.admin_id) return 0
    if (isDivisao) return lucroFinal * (splitPct / 100) // both profit AND loss
    if (payModel === 'percentual') return lucroFinal > 0 ? lucroFinal * (payValue / 100) : 0
    return deps * payValue // fixo por dep
  }, [payModel, payValue, lucroFinal, deps, operador, isDivisao, splitPct])

  const resultadoAdmin = isDivisao ? lucroFinal - pgtoOp : lucroFinal
  const resultadoOperador = isDivisao ? pgtoOp : 0

  async function save() {
    if (saving) return
    setSaving(true); setError('')
    const updateData = {
      salario:Number(salario||0), bau:Number(bau||0), custo_fixo:Number(custo||0), taxa_agente:Number(taxa||0),
      pagamento_operador: isDivisao ? Math.abs(pgtoOp) : pgtoOp,
      lucro_final:lucroFinal, status:'finalizada',
      status_fechamento:'fechada', fechada_em:new Date().toISOString(),
    }
    // Save split data if divisao model
    if (isDivisao) {
      updateData.resultado_operador = resultadoOperador
      updateData.resultado_admin = resultadoAdmin
      updateData.percentual_operador = splitPct
      updateData.modelo_remuneracao = 'divisao_resultado'
    }
    const { data:updated, error:err } = await supabase.from('metas').update(updateData).eq('id',meta.id).neq('status_fechamento','fechada').select()
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
        className="card" style={{ width:'100%',maxWidth:520,padding:32,boxShadow:'0 40px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.2)' }}>
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
          <div style={{ display:'grid', gridTemplateColumns: apenasBau ? '1fr' : '1fr 1fr', gap:12 }}>
            {!apenasBau && (
              <div>
                <label className="t-label" style={{ display:'block',marginBottom:8 }}>Salario da meta (R$)</label>
                <p className="t-small" style={{ margin:'0 0 8px' }}>Valor recebido por bater a meta (+)</p>
                <input className="input" type="number" step="0.01" min="0" value={salario} onChange={e=>setSalario(e.target.value)} placeholder="0,00"/>
              </div>
            )}
            <div>
              <label className="t-label" style={{ display:'block',marginBottom:8 }}>Bau (R$)</label>
              <p className="t-small" style={{ margin:'0 0 8px' }}>Bonus coletado nas contas (+)</p>
              <input className="input" type="number" step="0.01" min="0" value={bau} onChange={e=>setBau(e.target.value)} placeholder="0,00"/>
            </div>
          </div>
          {/* Taxa agente — sempre visivel */}
          <div>
            <label className="t-label" style={{ display:'block',marginBottom:8 }}>Taxa agente/blogueira (R$) <span style={{color:'var(--loss)',fontWeight:700}}>- PREJUIZO</span></label>
            <p className="t-small" style={{ margin:'0 0 8px' }}>Comissao paga ao agente ou blogueira</p>
            <input className="input" type="number" step="0.01" min="0" value={taxa} onChange={e=>setTaxa(e.target.value)} placeholder="0,00"/>
          </div>

          {/* Gastos operacionais detalhados */}
          <div>
            <label className="t-label" style={{ display:'block',marginBottom:8 }}>Gastos operacionais (R$) <span style={{color:'var(--loss)',fontWeight:700}}>- PREJUIZO</span></label>
            <p className="t-small" style={{ margin:'0 0 8px' }}>Selecione o tipo de gasto e informe o valor total</p>
            <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
              {['Proxy','SMS','Outros gastos'].map(tipo => (
                <button key={tipo} type="button" onClick={() => {}} style={{
                  padding:'6px 14px', borderRadius:8, fontSize:11, fontWeight:600, border:'none', cursor:'default',
                  background:'rgba(255,255,255,0.04)', color:'var(--t3)',
                  border:'1px solid rgba(255,255,255,0.06)',
                }}>{tipo}</button>
              ))}
            </div>
            <input className="input" type="number" step="0.01" min="0" value={custo} onChange={e=>setCusto(e.target.value)} placeholder="0,00"/>
          </div>

          {/* Resultado final */}
          <div style={{ background:lucroFinal>=0?'var(--profit-dim)':'var(--loss-dim)',border:`1px solid ${lucroFinal>=0?'var(--profit-border)':'var(--loss-border)'}`,borderRadius:12,padding:'18px 22px' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:8 }}>
              <div>
                <p style={{ fontSize:12,fontWeight:600,color:'var(--t2)',margin:0 }}>Lucro final</p>
                <p className="t-small" style={{ margin:'2px 0 0' }}>Acumulado + Salario + BAU</p>
              </div>
              <p className="t-num" style={{ fontSize:20,fontWeight:800,color:'var(--profit)',margin:0 }}>R$ {fmt(liqRem + Number(salario||0) + Number(bau||0))}</p>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8 }}>
              <div>
                <p style={{ fontSize:12,fontWeight:600,color:'var(--t2)',margin:0 }}>Prejuizo final</p>
                <p className="t-small" style={{ margin:'2px 0 0' }}>Acumulado + Gastos</p>
              </div>
              <p className="t-num" style={{ fontSize:20,fontWeight:800,color:'var(--loss)',margin:0 }}>R$ {fmt(Number(custo||0) + Number(taxa||0))}</p>
            </div>
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8 }}>
              <p style={{ fontSize:14,fontWeight:800,color:'var(--t1)',margin:0 }}>Resultado final</p>
              <p className="t-num" style={{ fontSize:28,fontWeight:800,color:lucroFinal>=0?'var(--profit)':'var(--loss)',margin:0 }}>
                {lucroFinal>=0?'+':''}R$ {fmt(lucroFinal)}
              </p>
            </div>
          </div>

          {/* Pagamento do operador / Divisao de resultado */}
          {isDivisao && operador ? (
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'18px 22px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:5, background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.78)', border:'1px solid rgba(255,255,255,0.25)' }}>SPLIT {splitPct}%</span>
                <span style={{ fontSize:11, color:'#94A3B8' }}>Divisao de resultado com {getName(operador)}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ padding:'12px 14px', borderRadius:10, background: resultadoOperador >= 0 ? 'rgba(0,140,94,0.06)' : 'rgba(239,68,68,0.06)', border:`1px solid ${resultadoOperador >= 0 ? 'rgba(0,140,94,0.12)' : 'rgba(239,68,68,0.12)'}`, textAlign:'center' }}>
                  <p style={{ fontSize:10, color:'#94A3B8', margin:'0 0 6px', fontWeight:600 }}>Operador ({splitPct}%)</p>
                  <p className="t-num" style={{ fontSize:18, fontWeight:800, color: resultadoOperador >= 0 ? 'var(--profit)' : 'var(--loss)', margin:0 }}>
                    {resultadoOperador >= 0 ? '+' : ''}R$ {fmt(resultadoOperador)}
                  </p>
                </div>
                <div style={{ padding:'12px 14px', borderRadius:10, background: resultadoAdmin >= 0 ? 'rgba(0,140,94,0.06)' : 'rgba(239,68,68,0.06)', border:`1px solid ${resultadoAdmin >= 0 ? 'rgba(0,140,94,0.12)' : 'rgba(239,68,68,0.12)'}`, textAlign:'center' }}>
                  <p style={{ fontSize:10, color:'#94A3B8', margin:'0 0 6px', fontWeight:600 }}>Admin ({100 - splitPct}%)</p>
                  <p className="t-num" style={{ fontSize:18, fontWeight:800, color: resultadoAdmin >= 0 ? 'var(--profit)' : 'var(--loss)', margin:0 }}>
                    {resultadoAdmin >= 0 ? '+' : ''}R$ {fmt(resultadoAdmin)}
                  </p>
                </div>
              </div>
            </div>
          ) : pgtoOp > 0 && operador ? (
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <div>
                <p className="t-label" style={{ marginBottom:2 }}>Pagar a {getName(operador)}</p>
                <p className="t-small">{payModel === 'percentual' ? `${payValue}% do lucro` : `${deps} deps × R$ ${fmt(payValue)}`}</p>
              </div>
              <p className="t-num" style={{ fontSize:18, fontWeight:700, color:'#60a5fa' }}>R$ {fmt(pgtoOp)}</p>
            </div>
          ) : null}

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
function SalaryPanel({ meta, liqCalc, tenantOpModel, onSaved }) {
  const apenasBau = (meta.operation_model || tenantOpModel || 'salario_bau') === 'apenas_bau'
  const fechada = meta.status_fechamento === 'fechada'
  const isActive = !fechada && meta.status !== 'finalizada'
  const isFinalizedNotClosed = !fechada && meta.status === 'finalizada'

  const [salario, setSalario] = useState(String(meta.salario ?? ''))
  const [bauVal, setBauVal]   = useState(String(meta.bau ?? ''))
  const [custo, setCusto]     = useState(String(meta.custo_fixo ?? ''))
  const [taxa, setTaxa]       = useState(String(meta.taxa_agente ?? ''))
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    setSalario(String(meta.salario ?? ''))
    setBauVal(String(meta.bau ?? ''))
    setCusto(String(meta.custo_fixo ?? ''))
    setTaxa(String(meta.taxa_agente ?? ''))
  }, [meta.id])

  const sal = Number(salario || 0)
  const bv  = Number(bauVal || 0)
  const cst = Number(custo || 0)
  const tax = Number(taxa || 0)
  const newLucro = liqCalc + sal + bv - cst - tax

  async function save() {
    if (saving) return
    setSaving(true)
    // Only close if not already closed (isFinalizedNotClosed = needs closing)
    // If already fechada, just update costs + recalc lucro_final without re-closing
    const needsClose = isFinalizedNotClosed && !fechada
    const newLucroRounded = Number(newLucro.toFixed(2))
    await fetch('/api/meta/update-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_id: meta.id, salario: sal, bau: bv, custo_fixo: cst, taxa_agente: tax,
        close: needsClose, lucro_final: (needsClose || fechada) ? newLucroRounded : undefined,
        update_lucro_only: fechada, // flag to update lucro without re-closing
      }),
    })
    setSaving(false)
    onSaved({ ...meta, salario: sal, bau: bv, custo_fixo: cst, taxa_agente: tax, lucro_final: (needsClose || fechada) ? newLucroRounded : meta.lucro_final, status_fechamento: needsClose ? 'fechada' : meta.status_fechamento })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.33,1,0.68,1] }}
      style={{ marginTop: 20, padding: '20px 22px', background: 'var(--surface)', border: `1px solid ${fechada ? 'var(--b1)' : 'var(--brand-border)'}`, borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{apenasBau ? 'Bau e custos' : 'Salario e custos'}</span>
        {isActive && <span className="t-small" style={{ marginLeft: 4 }}>Pre-configure para fechamento automatico</span>}
        {isFinalizedNotClosed && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--warn)', marginLeft: 4 }}>Operador finalizou — defina valores e feche</span>}
        {fechada && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--profit)', marginLeft: 4 }}>Meta fechada — ajuste se necessario</span>}
      </div>
      <div className="g-form" style={{ display: 'grid', gridTemplateColumns: apenasBau ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        {!apenasBau && (
          <div>
            <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Salario (R$)</label>
            <input className="input" type="number" step="0.01" min="0" value={salario}
              onChange={e => setSalario(e.target.value)}
              placeholder="0,00" style={{ padding: '10px 12px', fontSize: 14 }}/>
          </div>
        )}
        <div>
          <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Bau (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={bauVal}
            onChange={e => setBauVal(e.target.value)}
            placeholder="0,00" style={{ padding: '10px 12px', fontSize: 14 }}/>
        </div>
        <div>
          <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Custo fixo (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={custo}
            onChange={e => setCusto(e.target.value)}
            placeholder="0,00" style={{ padding: '10px 12px', fontSize: 14 }}/>
        </div>
        {!apenasBau && (
          <div>
            <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Taxa agente (R$)</label>
            <input className="input" type="number" step="0.01" min="0" value={taxa}
              onChange={e => setTaxa(e.target.value)}
              placeholder="0,00" style={{ padding: '10px 12px', fontSize: 14 }}/>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '14px 16px', borderRadius: 12, background: newLucro >= 0 ? 'rgba(0,140,94,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${newLucro >= 0 ? 'rgba(0,140,94,0.15)' : 'rgba(239,68,68,0.12)'}`, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Lucro final</span>
          <p className="t-small" style={{ margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {apenasBau ? `Resultado (${fmt(liqCalc)}) + Bau (${fmt(bv)}) - Custo (${fmt(cst)})` : `Resultado (${fmt(liqCalc)}) + Sal (${fmt(sal)}) + Bau (${fmt(bv)}) - Custo (${fmt(cst)}) - Taxa (${fmt(tax)})`}
          </p>
        </div>
        <span className="t-num" style={{ fontSize: 22, fontWeight: 800, color: newLucro >= 0 ? 'var(--profit)' : 'var(--loss)', flexShrink: 0 }}>
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

/* ═══════════════════════════════════════════════════
   DEMO ADMIN DASHBOARD — onboarding visual premium
   ═══════════════════════════════════════════════════ */
function DemoAdminDashboard({ onCreateMeta, userName }) {
  const [insightIdx, setInsightIdx] = useState(0)
  const [activityIdx, setActivityIdx] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setInsightIdx(p => (p + 1) % DEMO_INSIGHTS.length), 6000)
    return () => clearInterval(iv)
  }, [])
  useEffect(() => {
    const iv = setInterval(() => setActivityIdx(p => (p + 1) % DEMO_ACTIVITY.length), 3000)
    return () => clearInterval(iv)
  }, [])

  const insight = DEMO_INSIGHTS[insightIdx]
  const insightColors = { profit:{ bg:'rgba(0,140,94,0.06)', border:'rgba(0,140,94,0.12)', color:'#008C5E' }, loss:{ bg:'rgba(239,68,68,0.06)', border:'rgba(239,68,68,0.12)', color:'#EF4444' }, warn:{ bg:'rgba(255,255,255,0.06)', border:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.78)' }, info:{ bg:'rgba(229,57,53,0.06)', border:'rgba(229,57,53,0.12)', color:'#e53935' } }
  const ic = insightColors[insight.type]
  const g = DEMO_GLOBAL

  return (
    <div>
      {/* Demo banner */}
      <motion.div className="demo-banner" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
        style={{ padding:'12px 20px', borderRadius:12, marginBottom:24, background:'linear-gradient(135deg, rgba(229,57,53,0.08), rgba(229,57,53,0.03))', border:'1px solid rgba(229,57,53,0.15)', display:'flex', alignItems:'center', gap:10 }}>
        <div className="demo-banner-dot" style={{ width:8, height:8, borderRadius:'50%', background:'#e53935', flexShrink:0 }} />
        <span style={{ fontSize:13, color:'var(--t2)', fontWeight:500 }}>{DEMO_BANNER_TEXT}</span>
      </motion.div>

      {/* Insight rotativo */}
      <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.1 }}
        style={{ padding:'12px 18px', borderRadius:12, marginBottom:20, background:ic.bg, border:`1px solid ${ic.border}`, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:ic.color, flexShrink:0 }} />
        <AnimatePresence mode="wait">
          <motion.p key={insightIdx} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} style={{ margin:0, fontSize:13, fontWeight:500, color:ic.color }}>{insight.text}</motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Hero + KPIs */}
      <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:24, marginBottom:28 }}>
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease }}
          style={{ position:'relative', overflow:'hidden', padding:'40px 40px 36px', borderRadius:18, background:'linear-gradient(145deg, #000000, #000000)', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 8px 32px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ position:'absolute', top:'5%', left:'0%', width:450, height:350, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,140,94,0.08), transparent 60%)', filter:'blur(50px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <p style={{ fontSize:13, color:'var(--t3)', fontWeight:500, margin:'0 0 28px' }}>Lucro final acumulado</p>
            <motion.div animate={{ textShadow:['0 0 40px rgba(0,140,94,0.15)','0 0 80px rgba(0,140,94,0.25)','0 0 40px rgba(0,140,94,0.15)'] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
              <AnimatedNumber value={g.lucroFinalTotal} prefix="+R$ " style={{ fontFamily:'var(--mono)', fontSize:52, fontWeight:900, color:'var(--profit)', lineHeight:1, letterSpacing:'-0.03em', display:'block' }} />
            </motion.div>
            <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:20, marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              {[
                { l:'Fechadas', v:g.fechadas },
                { l:'Status', v:'Positivo', c:'var(--profit)' },
                { l:'Operadores', v:g.ops },
                { l:'R$/conta', v:`R$ ${fmt(g.lucroPerConta)}`, c:'var(--profit)' },
              ].map((s,i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column' }}>
                  <p style={{ fontSize:10, color:'var(--t4)', marginBottom:2, letterSpacing:'0.05em', textTransform:'uppercase' }}>{s.l}</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:s.c||'var(--t1)', margin:0 }}>{s.v}</p>
                  {i < 3 && <div style={{ display:'none' }} />}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { l:'Total depositado', v:`R$ ${fmt(g.totalDep)}` },
            { l:'Total sacado', v:`R$ ${fmt(g.totalSaq)}` },
            { l:'Total metas', v:String(g.totalMetas) },
            { l:'Depositantes totais', v:String(g.totalContas) },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.35, delay:0.15+i*0.07, ease }}
              style={{ flex:1, padding:'16px 20px', borderRadius:14, background:'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'var(--t3)', fontWeight:500 }}>{kpi.l}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:'var(--t1)' }}>{kpi.v}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Previsao + Break-even */}
      <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay:0.2 }}
          style={{ padding:22, borderRadius:16, background:'rgba(0,140,94,0.04)', border:'1px solid rgba(0,140,94,0.1)' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--t3)', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'0.04em' }}>Previsao inteligente</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:12, color:'var(--t3)' }}>Lucro medio/meta</span><span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--profit)' }}>R$ {fmt(g.lucroPerMeta)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:12, color:'var(--t3)' }}>Lucro medio/conta</span><span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--profit)' }}>R$ {fmt(g.lucroPerConta)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:12, color:'var(--t3)' }}>Proximas 50 contas (estimativa)</span><span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--profit)' }}>+R$ {fmt(g.lucroPerConta * 50)}</span></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay:0.25 }}
          style={{ padding:22, borderRadius:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'var(--t3)', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'0.04em' }}>Custos e break-even</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:12, color:'var(--t3)' }}>Custos totais</span><span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--loss)' }}>R$ {fmt(g.custosTotal)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:12, color:'var(--t3)' }}>Custos hoje</span><span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--t2)' }}>R$ {fmt(g.custosHoje)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:12, color:'var(--t3)' }}>Lucro liquido (- custos)</span><span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--profit)' }}>R$ {fmt(g.lucroFinalTotal - g.custosTotal)}</span></div>
          </div>
        </motion.div>
      </div>

      {/* Ranking operadores + Redes + Activity */}
      <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:28 }}>
        {/* Ranking operadores */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.25, ease }}
          style={{ padding:22, borderRadius:16, background:'var(--surface)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'0.04em' }}>Top operadores</h3>
          {DEMO_OPERATOR_RANKING.map((op, i) => (
            <div key={op.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:i<DEMO_OPERATOR_RANKING.length-1?'1px solid var(--b1)':'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:26, height:26, borderRadius:8, background:op.lucroFinal>=0?'rgba(0,140,94,0.1)':'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:op.lucroFinal>=0?'#008C5E':'#EF4444' }}>{i+1}</div>
                <div>
                  <p style={{ fontSize:12, fontWeight:600, color:'var(--t1)', margin:0 }}>{op.nome}</p>
                  <p style={{ fontSize:10, color:'var(--t4)', margin:0 }}>{op.metasFechadas} metas · {op.totalDeposit} deps</p>
                </div>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:op.lucroFinal>=0?'var(--profit)':'var(--loss)' }}>{op.lucroFinal>=0?'+':''}R$ {fmt(op.lucroFinal)}</span>
            </div>
          ))}
        </motion.div>

        {/* Ranking redes */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.3, ease }}
          style={{ padding:22, borderRadius:16, background:'var(--surface)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'0.04em' }}>Redes mais lucrativas</h3>
          {DEMO_REDES_RANKING.map((r, i) => (
            <div key={r.rede} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:i<DEMO_REDES_RANKING.length-1?'1px solid var(--b1)':'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:26, height:26, borderRadius:8, background:'rgba(229,57,53,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#e53935' }}>{r.rede}</div>
                <div>
                  <p style={{ fontSize:12, fontWeight:600, color:'var(--t1)', margin:0 }}>{r.metas} metas · {r.contas} contas</p>
                  <p style={{ fontSize:10, color:'var(--t4)', margin:0 }}>R$ {fmt(r.lucroPerConta)}/conta · {r.winRate}% acerto</p>
                </div>
              </div>
              <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:r.lucroFinal>=0?'var(--profit)':'var(--loss)' }}>{r.lucroFinal>=0?'+':''}R$ {fmt(r.lucroFinal)}</span>
            </div>
          ))}
        </motion.div>

        {/* Activity feed */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.35, ease }}
          style={{ padding:22, borderRadius:16, background:'var(--surface)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14 }}>
            <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }} style={{ width:6, height:6, borderRadius:'50%', background:'#008C5E' }} />
            <h3 style={{ fontSize:13, fontWeight:700, color:'var(--t1)', margin:0 }}>Atividade ao vivo</h3>
          </div>
          <div style={{ minHeight:40 }}>
            <AnimatePresence mode="wait">
              <motion.div key={activityIdx} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.3 }}
                style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', marginTop:6, background:DEMO_ACTIVITY[activityIdx].color, flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:12, color:'var(--t2)', margin:'0 0 2px', fontWeight:500 }}>{DEMO_ACTIVITY[activityIdx].text}</p>
                  <p style={{ fontSize:10, color:'var(--t4)', margin:0 }}>agora</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          {/* Metas ativas */}
          <div style={{ borderTop:'1px solid var(--b1)', paddingTop:14, marginTop:14 }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--t3)', margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'0.04em' }}>{g.ativas} metas ativas</p>
            {DEMO_METAS.filter(m=>!m.status_fechamento).map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0' }}>
                <span style={{ fontSize:11, color:'var(--t3)' }}>{m.quantidade_contas} DEP {m.rede}</span>
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:5, background:'rgba(0,140,94,0.08)', color:'#008C5E' }}>Ativa</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.4, ease }}
        style={{ padding:'32px 40px', borderRadius:18, textAlign:'center', background:'linear-gradient(145deg, rgba(229,57,53,0.06), rgba(229,57,53,0.02))', border:'1px solid rgba(229,57,53,0.12)' }}>
        <h3 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', margin:'0 0 8px', letterSpacing:'-0.02em' }}>Pronto para comecar sua operacao?</h3>
        <p style={{ fontSize:14, color:'var(--t3)', margin:'0 0 24px' }}>Crie sua primeira meta e veja seus dados reais neste painel.</p>
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={onCreateMeta}
          style={{ padding:'16px 40px', fontSize:15, fontWeight:700, color:'#fff', background:'linear-gradient(135deg, #e53935, #c62828)', border:'none', borderRadius:14, cursor:'pointer', boxShadow:'0 4px 24px rgba(229,57,53,0.3)', display:'inline-flex', alignItems:'center', gap:8 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Criar minha primeira meta
        </motion.button>
      </motion.div>
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
  const [myMetas,setMyMetas]=useState([])
  const [myRem,setMyRem]=useState([])
  const [myShowForm,setMyShowForm]=useState(false)
  const [myTitulo,setMyTitulo]=useState('')
  const [myPlat,setMyPlat]=useState('')
  const [myRede,setMyRede]=useState('')
  const [myContas,setMyContas]=useState('10')
  const [myOpModel,setMyOpModel]=useState('salario_bau')
  const [mySaving,setMySaving]=useState(false)
  const REDES=['WE','W1','VOY','91','DZ','A8','OKOK','ANJO','XW','EK','DY','777','888','WP','BRA','GAME','ALFA','KK','MK','M9','KF','PU','COROA','MANGA','AA','FP']
  const [focusLoad, setFocusLoad] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [trashMetas, setTrashMetas] = useState([])
  const [heroPeriod, setHeroPeriod] = useState('all')
  const [costs, setCosts] = useState([])
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
    loadAll(u.id, p.tenant_id)
  }

  async function loadAll(forceUserId, forceTenantId) {
    setLoading(true)
    const [{ data:ops },{ data:ms },{ data:rs },{ data:inv },{ data:t },{ data:s2 },{ data:costsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role','operator').order('created_at',{ascending:false}),
      supabase.from('metas').select('*').order('created_at',{ascending:false}),
      supabase.from('remessas').select('*').order('created_at',{ascending:false}),
      supabase.from('invites').select('*').order('created_at',{ascending:false}),
      supabase.from('tenants').select('*').eq('id',forceTenantId||profile?.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id',forceTenantId||profile?.tenant_id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('costs').select('amount,date').eq('tenant_id',forceTenantId||profile?.tenant_id),
    ])
    setCosts(costsData||[])
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

    const activeMetas = (ms||[]).filter(m=>!m.deleted_at)
    const activeMetaIds = new Set(activeMetas.map(m=>m.id))
    const activeRems = newRs.filter(r=>activeMetaIds.has(r.meta_id))
    setOperators(ops||[]); setMetas(activeMetas); setTrashMetas((ms||[]).filter(m=>!!m.deleted_at)); setRemessas(activeRems); setInvites(inv||[])
    if(t) setTenant(t); if(s2) setSub(s2)
    // Load admin own metas
    const adminId = forceUserId || profile?.id || user?.id
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
      if(r) setFocusRem(r); if(l) setFocusLogs(l)
      // Only update meta data, never clear focusMeta
      if(m) setFocusMeta(prev => prev ? {...prev, ...m} : prev)
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
    const totalContasFechadas = fechadas.reduce((a,m)=>a+Number(m.quantidade_contas||0),0)
    const lucroPerConta = totalContasFechadas>0 ? lucroFinalTotal/totalContasFechadas : 0
    const lucroPerMeta = fechadas.length>0 ? lucroFinalTotal/fechadas.length : 0
    // Break-even calculation
    const totalBauFechadas = fechadas.reduce((a,m)=>a+Number(m.bau||0),0)
    const totalCustosFechadas = fechadas.reduce((a,m)=>a+Number(m.custo_fixo||0)+Number(m.taxa_agente||0)+Number(m.salario||0),0)
    const avgBauPerConta = totalContasFechadas>0 ? totalBauFechadas/totalContasFechadas : 0
    const avgCustoPorMeta = fechadas.length>0 ? totalCustosFechadas/fechadas.length : 0
    const avgPrejPerConta = totalContasFechadas>0 ? prej/totalContasFechadas : 0
    const breakEvenContas = avgBauPerConta>avgPrejPerConta ? Math.ceil(avgCustoPorMeta/(avgBauPerConta-avgPrejPerConta)) : 0
    // Costs — stored separately, subtracted ONCE at display time
    const todayISO = new Date().toISOString().slice(0,10)
    const custosHoje = Number(costs.filter(c=>c.date===todayISO).reduce((a,c)=>a+Number(c.amount||0),0).toFixed(2))
    const custosTotal = Number(costs.reduce((a,c)=>a+Number(c.amount||0),0).toFixed(2))
    // ALL values returned BRUTO (without costs subtracted)
    // Costs subtraction happens ONCE in the UI, not here
    return { lucro:Number(lucro.toFixed(2)),prej:Number(prej.toFixed(2)),liq:Number((lucro-prej).toFixed(2)),totalDep:Number(totalDep.toFixed(2)),totalSaq:Number(totalSaq.toFixed(2)),lucroHoje:Number(lucroHoje.toFixed(2)),custosHoje,ativas:metas.filter(m=>(m.status||'ativa')==='ativa').length,fechadas:fechadas.length,lucroFinalTotal:Number(lucroFinalTotal.toFixed(2)),custosTotal,lucroPerConta:Number(lucroPerConta.toFixed(2)),lucroPerMeta:Number(lucroPerMeta.toFixed(2)),ops:operators.length,totalMetas:metas.length,totalRem:remessas.length,avgBauPerConta,breakEvenContas }
  },[operators,metas,remessas,costs])

  // Hero card: lucro final por periodo — BRUTO por periodo, custos TOTAIS fixos
  const heroLucro = useMemo(()=>{
    const fechadas = metas.filter(m=>m.status_fechamento==='fechada'&&m.fechada_em)
    const custosTotalFixo = Number(costs.reduce((a,c)=>a+Number(c.amount||0),0).toFixed(2))
    let filtered = fechadas
    if(heroPeriod!=='all') {
      const now = new Date()
      if(heroPeriod==='today') {
        const t = now.toDateString()
        filtered = fechadas.filter(m=>new Date(m.fechada_em).toDateString()===t)
      } else if(heroPeriod==='yesterday') {
        const y = new Date(now); y.setDate(y.getDate()-1)
        filtered = fechadas.filter(m=>new Date(m.fechada_em).toDateString()===y.toDateString())
      } else if(heroPeriod==='7d') {
        const d = new Date(now); d.setDate(d.getDate()-7)
        filtered = fechadas.filter(m=>new Date(m.fechada_em)>=d)
      } else if(heroPeriod==='30d') {
        const d = new Date(now); d.setDate(d.getDate()-30)
        filtered = fechadas.filter(m=>new Date(m.fechada_em)>=d)
      }
    }
    const lucro = Number(filtered.reduce((a,m)=>a+Number(m.lucro_final||0),0).toFixed(2))
    // Custos so subtraidos no periodo "Tudo" — periodos parciais mostram lucro bruto do periodo
    const custos = heroPeriod === 'all' ? custosTotalFixo : 0
    return { value: lucro, count: filtered.length, custos }
  },[metas,heroPeriod,costs])

  // Resumo estrategico — detecta melhor rede, principal risco e oportunidade
  const strategicSummary = useMemo(() => {
    const fechadas = metas.filter(m => m.status_fechamento === 'fechada')
    if (fechadas.length === 0) return null

    // Por rede
    const redeMap = {}
    fechadas.forEach(m => {
      const r = m.rede || 'Outros'
      if (!redeMap[r]) redeMap[r] = { rede: r, lucro: 0, metas: 0, contas: 0 }
      redeMap[r].lucro += Number(m.lucro_final || 0)
      redeMap[r].metas++
      redeMap[r].contas += Number(m.quantidade_contas || 0)
    })
    const redesArr = Object.values(redeMap).map(r => ({
      ...r,
      lucroPorMeta: r.metas > 0 ? r.lucro / r.metas : 0,
    }))
    const bestRede = redesArr.filter(r => r.lucro > 0).sort((a, b) => b.lucroPorMeta - a.lucroPorMeta)[0]
    const worstRede = redesArr.filter(r => r.lucro < 0).sort((a, b) => a.lucro - b.lucro)[0]

    // Operador acelerando (maior lucro + ativas em andamento)
    const opMap = operators.map(op => {
      const opFechadas = fechadas.filter(m => m.operator_id === op.id)
      const lucroOp = opFechadas.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const ativas = metas.filter(m => m.operator_id === op.id && (m.status || 'ativa') === 'ativa').length
      return { op, lucro: lucroOp, ativas, fechadas: opFechadas.length }
    })
    const topOp = opMap.filter(x => x.lucro > 0 && x.ativas > 0).sort((a, b) => b.lucro - a.lucro)[0]

    return {
      bestRede: bestRede ? { rede: bestRede.rede, lucroPorMeta: bestRede.lucroPorMeta, metas: bestRede.metas } : null,
      worstRede: worstRede ? { rede: worstRede.rede, lucro: worstRede.lucro, metas: worstRede.metas } : null,
      topOp: topOp ? { nome: topOp.op?.nome || topOp.op?.email?.split('@')[0] || 'Operador', lucro: topOp.lucro, ativas: topOp.ativas } : null,
    }
  }, [metas, operators])

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
        if(metaPeriod==='yesterday'){const y=new Date(now);y.setDate(y.getDate()-1);return d.toDateString()===y.toDateString()}
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

  const rentabilidadeRedes = useMemo(()=>{
    const fechadas = metas.filter(m=>m.status_fechamento==='fechada'&&m.rede)
    const map = {}
    fechadas.forEach(m=>{
      if(!map[m.rede]) map[m.rede]={rede:m.rede,lucro:0,contas:0}
      map[m.rede].lucro += Number(m.lucro_final||0)
      map[m.rede].contas += Number(m.quantidade_contas||0)
    })
    return Object.values(map).filter(r=>r.contas>0).map(r=>({...r,lucroPorConta:r.lucro/r.contas})).sort((a,b)=>b.lucroPorConta-a.lucroPorConta).slice(0,5)
  },[metas])

  const convStats = useMemo(()=>({
    totalMoved: remessas.reduce((a,r)=>a+Number(r.deposito||0)+Number(r.saque||0),0),
    totalMetas: metas.length,
    totalRemessas: remessas.length,
  }),[remessas,metas])

  // ── Alerta de prejuizo anormal ──
  const abnormalLossAlert = useMemo(() => {
    const remsWithLoss = remessas.filter(r => Number(r.prejuizo || 0) > 0)
    if (remsWithLoss.length < 2) return null
    const totalPrej = remsWithLoss.reduce((a, r) => a + Number(r.prejuizo || 0), 0)
    const avgLoss = totalPrej / remsWithLoss.length
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recent = remsWithLoss.filter(r => {
      const d = new Date(r.created_at)
      return d >= cutoff24h && Number(r.prejuizo || 0) > 2 * avgLoss
    })
    if (recent.length === 0) return null
    const worst = recent.reduce((a, r) => Number(r.prejuizo || 0) > Number(a.prejuizo || 0) ? r : a, recent[0])
    return { value: Number(worst.prejuizo), avg: avgLoss }
  }, [remessas])

  const slotRanking = useMemo(() => {
    const groups = {}
    remessas.forEach(r => {
      if (!r.slot_name) return
      if (!groups[r.slot_name]) groups[r.slot_name] = { name: r.slot_name, total: 0, count: 0, contas: 0 }
      groups[r.slot_name].total += Number(r.resultado || 0)
      groups[r.slot_name].count++
      groups[r.slot_name].contas += Number(r.contas_remessa || 0)
    })
    return Object.values(groups)
      .filter(s => s.count >= 2)
      .map(s => ({ ...s, perConta: s.contas > 0 ? s.total / s.contas : 0, avg: s.total / s.count }))
      .sort((a, b) => b.perConta - a.perConta)
      .slice(0, 8)
  }, [remessas])

  const kpis = [
    { label:'Lucro hoje', rawValue:Math.abs(global.lucroHoje - global.custosHoje), value:`R$ ${fmt(Math.abs(global.lucroHoje - global.custosHoje))}`, sub:global.custosHoje>0?`Bruto: R$ ${fmt(global.lucroHoje)} · Custos: -R$ ${fmt(global.custosHoje)}`:(global.lucroHoje>=0?'Fechamentos de hoje':'Resultado negativo'), color:(global.lucroHoje - global.custosHoje)>=0?'var(--profit)':'var(--loss)', card:(global.lucroHoje - global.custosHoje)>=0?'card-profit':'card-loss', badge:'ao vivo', isLive: true },
    { label:'Lucro final total', rawValue:global.lucroFinalTotal - global.custosTotal, value:`R$ ${fmt(global.lucroFinalTotal - global.custosTotal)}`, sub:global.custosTotal>0?`Bruto: R$ ${fmt(global.lucroFinalTotal)} · Custos: -R$ ${fmt(global.custosTotal)}`:'Metas 100% fechadas', color:'var(--brand-bright)', card:'card-primary', badge:'fechado' },
    { label:'Total depositado', rawValue:global.totalDep, value:`R$ ${fmt(global.totalDep)}`, sub:'Admin + operadores', color:'var(--info)', card:'card-info', badge:'depositos' },
    { label:'Total sacado', rawValue:global.totalSaq, value:`R$ ${fmt(global.totalSaq)}`, sub:'Admin + operadores', color:'var(--warn)', card:'card-warn', badge:'saques' },
    { label:'Lucro/conta', rawValue:Math.abs(global.lucroPerConta), value:`R$ ${fmt(Math.abs(global.lucroPerConta))}`, sub:'Media por depositante', color:global.lucroPerConta>=0?'var(--profit)':'var(--loss)', card:global.lucroPerConta>=0?'card-profit':'card-loss', badge:'rentabilidade' },
  ]

  const TABS = [['overview','Visao geral'],['myops','Minha operacao'],['operations','Metas & Fechamento'],['trash','Lixeira']]

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <AnimatePresence>
        {modalMeta && (
          <ModalFechamento
            meta={modalMeta}
            remessas={remessas.filter(r=>r.meta_id===modalMeta.id)}
            operador={operators.find(o=>o.id===modalMeta.operator_id)}
            tenantOpModel={tenant?.operation_model || 'salario_bau'}
            payModel={tenant?.operator_payment_model || 'fixo_dep'}
            payValue={Number(tenant?.operator_payment_value ?? 2)}
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
          style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(4,8,16,0.92)',backdropFilter:'blur(16px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'40px 24px',overflowY:'auto'}}>
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
              const depR =focusRem.reduce((a,r)=>a+Number(r.deposito||0),0)
              const saqR =focusRem.reduce((a,r)=>a+Number(r.saque||0),0)
              const liqR=lucroR-prejR
              const pct=focusRem.length>0?Math.round((focusRem.filter(r=>Number(r.resultado||0)>=0).length/focusRem.length)*100):0
              const displayVal=fechada&&m.lucro_final!=null?Number(m.lucro_final):liqR
              return (<>
                {/* Header */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:20}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',minWidth:0}}>
                    <h2 style={{fontSize:22,fontWeight:900,color:'var(--t1)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'60vw'}}>{m.titulo}</h2>
                    <span style={{padding:'4px 12px',borderRadius:99,fontSize:10,fontWeight:700,letterSpacing:'0.05em',background:fechada?'rgba(0,140,94,0.15)':finalizada?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.1)',border:`1px solid ${fechada?'rgba(0,140,94,0.3)':finalizada?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.2)'}`,color:fechada?'#008C5E':finalizada?'#EF4444':'#60A5FA'}}>
                      {fechada?'CONCLUIDA':finalizada?'Finalizada':'Ativa'}
                    </span>
                    {!fechada&&!finalizada&&(
                      <motion.span
                        style={{ width:7,height:7,borderRadius:'50%',background:'var(--profit)',flexShrink:0 }}
                        animate={{ boxShadow:['0 0 0 0 rgba(0,140,94,0.6)','0 0 0 7px rgba(0,140,94,0)','0 0 0 0 rgba(0,140,94,0)'] }}
                        transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                      />
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {!fechada && (
                      <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }} onClick={()=>router.push(`/meta/${m.id}`)} title="Editar meta"
                        style={{width:36,height:36,borderRadius:10,border:'1px solid rgba(255,255,255,0.22)',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </motion.button>
                    )}
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
                <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:20}}>
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
                <div className="g-5" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
                  {[
                    {l:'Remessas',v:focusRem.length,c:'var(--info)',isNum:true},
                    {l:'Deposito total',v:`R$ ${fmt(depR)}`,c:'rgba(255,255,255,0.78)',raw:depR},
                    {l:'Saque total',v:`R$ ${fmt(saqR)}`,c:'rgba(255,255,255,0.78)',raw:saqR},
                    {l:'Lucro',v:`R$ ${fmt(lucroR)}`,c:'var(--profit)',raw:lucroR},
                    {l:'Prejuizo',v:`R$ ${fmt(prejR)}`,c:'var(--loss)',raw:prejR},
                    {l:'Acerto',v:`${pct}%`,c:pct>=50?'var(--profit)':'var(--warn)',raw:pct},
                    {l:fechada?'LUCRO FINAL':'Liquido',v:`${displayVal>=0?'+':'-'}R$ ${fmt(Math.abs(displayVal))}`,c:displayVal>=0?'#008C5E':'#EF4444',raw:Math.abs(displayVal)},
                  ].map(({l,v,c,raw,isNum},i)=>{
                    const isFinal = l.includes('FINAL')
                    const isLiq = l==='Liquido'
                    const highlightPos = (isFinal||isLiq) && displayVal>=0
                    const highlightNeg = (isFinal||isLiq) && displayVal<0
                    return (
                    <motion.div key={l} {...fadeUp(i, 0.15)}
                      whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                      style={{
                        background: highlightPos?'rgba(0,140,94,0.1)':highlightNeg?'rgba(239,68,68,0.1)':'var(--surface)',
                        border:`1px solid ${highlightPos?'rgba(0,140,94,0.2)':highlightNeg?'rgba(239,68,68,0.2)':'var(--b1)'}`,
                        borderRadius:14,padding:'14px 16px',textAlign:'center'
                      }}>
                      <p className="t-label" style={{marginBottom:5,color:highlightPos?'#008C5E':highlightNeg?'#EF4444':undefined}}>{l}</p>
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
                          animate={{ boxShadow:['0 0 0 0 rgba(0,140,94,0.6)','0 0 0 6px rgba(0,140,94,0)','0 0 0 0 rgba(0,140,94,0)'] }}
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
                              background:isLatest?(pos?'rgba(0,140,94,0.06)':'rgba(239,68,68,0.06)'):'var(--raised)',
                              border:`1px solid ${isLatest?(pos?'rgba(0,140,94,0.15)':'rgba(239,68,68,0.12)'):'var(--b1)'}`,
                              display:'flex',alignItems:'center',gap:10,
                              transition:'background 0.2s, border-color 0.2s',
                              boxShadow:isLatest?`0 0 15px ${pos?'rgba(0,140,94,0.06)':'rgba(239,68,68,0.04)'}`:'none',
                            }}>
                              <div style={{width:30,height:30,borderRadius:8,background:pos?'var(--profit-dim)':'var(--loss-dim)',border:`1px solid ${pos?'var(--profit-border)':'var(--loss-border)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={pos?'var(--profit)':'var(--loss)'} strokeWidth="3" strokeLinecap="round"><polyline points={pos?'18 15 12 9 6 15':'6 9 12 15 18 9'}/></svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2,flexWrap:'wrap'}}>
                                  <p style={{fontSize:12,fontWeight:600,color:'var(--t1)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.titulo||`Remessa ${focusRem.length-i}`}</p>
                                  {isLatest&&<span style={{fontSize:8,fontWeight:700,padding:'1px 6px',borderRadius:4,background:pos?'rgba(0,140,94,0.15)':'rgba(239,68,68,0.12)',color:pos?'var(--profit)':'var(--loss)'}}>{pos?'LUCRO':'PREJUIZO'}</span>}
                                  {r.slot_name && (
                                    <span title={`Slot: ${r.slot_name}`} style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:600,padding:'1px 6px',borderRadius:4,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'var(--info)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                      <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                      {r.slot_name}
                                    </span>
                                  )}
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
                  tenantOpModel={tenant?.operation_model || 'salario_bau'}
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

      <Onboarding/>
      {!(sub?.status === 'active' && new Date(sub.expires_at) > new Date()) && <ProBanner blockedCount={6}/>}
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={true} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>

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
              Central de operacoes
            </motion.h1>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <motion.span
                style={{ width:6,height:6,borderRadius:'50%',background:'var(--profit)' }}
                animate={{ boxShadow:['0 0 0 0 rgba(0,140,94,0.6)','0 0 0 5px rgba(0,140,94,0)','0 0 0 0 rgba(0,140,94,0)'] }}
                transition={{ duration:2, repeat:Infinity }}
              />
              <span style={{ fontSize:12, color:'var(--t3)' }}>Dados em tempo real</span>
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
              background: 'linear-gradient(90deg, var(--brand-bright), rgba(255,255,255,0.78))',
              boxShadow: '0 0 8px rgba(255,255,255,0.4)',
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
                  operation_model:myOpModel,
                }).select().single()
                setMySaving(false)
                if(err){return}
                setMyTitulo('');setMyPlat('');setMyRede('');setMyContas('10');setMyShowForm(false)
                router.push(`/meta/${data.id}`)
              }
              return (<>
                {/* Hero da aba — header executivo */}
                <motion.div
                  initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
                  transition={{duration:0.4, ease}}
                  style={{
                    position:'relative', overflow:'hidden',
                    padding:'22px 24px', borderRadius:18, marginBottom:18,
                    background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
                    backdropFilter:'blur(20px) saturate(150%)', WebkitBackdropFilter:'blur(20px) saturate(150%)',
                    border:`1px solid ${myLiq>=0?'rgba(0,140,94,0.14)':'rgba(239,68,68,0.14)'}`,
                    boxShadow:`0 8px 28px rgba(0,0,0,0.45), 0 0 40px ${myLiq>=0?'rgba(0,140,94,0.05)':'rgba(239,68,68,0.05)'}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}>
                  {/* Top highlight */}
                  <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:1, background:`linear-gradient(90deg, transparent, ${myLiq>=0?'rgba(0,140,94,0.4)':'rgba(239,68,68,0.4)'}, transparent)`, pointerEvents:'none' }}/>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{
                        width:42, height:42, borderRadius:12,
                        background: myLiq>=0 ? 'rgba(0,140,94,0.12)' : 'rgba(239,68,68,0.12)',
                        border: `1px solid ${myLiq>=0 ? 'rgba(0,140,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow: `0 0 20px ${myLiq>=0?'rgba(0,140,94,0.18)':'rgba(239,68,68,0.18)'}`,
                      }}>
                        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={myLiq>=0?'var(--profit)':'var(--loss)'} strokeWidth="2" strokeLinecap="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v12a2 2 0 0 1-2 2H9z"/><path d="M3 15h6"/><path d="M3 18h6"/><path d="M3 21h6"/></svg>
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.02em' }}>Minha operacao</h2>
                          <span style={{ fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:5, background:'rgba(229,57,53,0.1)', color:'#e53935', border:'1px solid rgba(229,57,53,0.2)', letterSpacing:'0.08em' }}>ADMIN</span>
                        </div>
                        <p style={{ fontSize:12, color:'var(--t3)', margin:0, fontWeight:500 }}>Suas metas e remessas pessoais · gestao direta</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={()=>setMyShowForm(!myShowForm)}
                      whileHover={{ scale: 1.03, boxShadow: myShowForm ? 'none' : '0 10px 32px rgba(229,57,53,0.55), 0 0 50px rgba(229,57,53,0.2)' }}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        padding:'12px 22px', borderRadius:12, border:'none', cursor:'pointer',
                        fontSize:13, fontWeight:700, fontFamily:'inherit',
                        display:'flex', alignItems:'center', gap:8,
                        background: myShowForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(145deg, #e53935, #c62828)',
                        color: myShowForm ? 'var(--t2)' : '#fff',
                        border: myShowForm ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        boxShadow: myShowForm ? 'none' : '0 6px 20px rgba(229,57,53,0.4), 0 0 30px rgba(229,57,53,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
                        transition: 'all 0.25s ease',
                      }}>
                      {myShowForm ? (
                        <>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Fechar
                        </>
                      ) : (
                        <>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Nova meta
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {/* KPIs premium */}
                <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20}}>
                  {[
                    {l:'Minhas metas', sub:'Total criadas', v:myMetas.length, c:'#e53935', iconPath:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'},
                    {l:'Remessas', sub:'Registros lancados', v:myRem.length, c:'rgba(255,255,255,0.78)', iconPath:'M13 2L3 14h9l-1 8 10-12h-9l1-8z'},
                    {l:'Lucro bruto', sub:'Soma de entradas', v:myLucro, c:'#008C5E', isMoney:true, iconPath:'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'},
                    {l:'Resultado liquido', sub: myLiq>=0 ? 'Operacao positiva' : 'Operacao negativa', v:myLiq, c:myLiq>=0?'#008C5E':'#EF4444', isMoney:true, showSign:true, iconPath: myLiq>=0 ? 'M23 6 13.5 15.5 8.5 10.5 1 18' : 'M1 18 10.5 8.5 15.5 13.5 23 6'},
                  ].map(({l,sub,v,c,isMoney,showSign,iconPath},i)=>(
                    <motion.div key={l} {...fadeUp(i)}
                      whileHover={{ y:-3, boxShadow:`0 14px 36px rgba(0,0,0,0.5), 0 0 24px ${c}15`, borderColor:`${c}30`, transition: { duration: 0.2 } }}
                      style={{
                        position:'relative', overflow:'hidden',
                        background:'linear-gradient(145deg, rgba(14,22,38,0.7), rgba(8,14,26,0.7))',
                        backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
                        border:'1px solid rgba(255,255,255,0.06)',
                        borderRadius:14, padding:'16px 18px',
                        boxShadow:'0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
                        transition: 'all 0.25s ease',
                      }}>
                      {/* Accent line esquerdo */}
                      <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:2, borderRadius:'0 2px 2px 0', background:c, boxShadow:`0 0 8px ${c}` }}/>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:10, color:'var(--t4)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>{l}</span>
                        <div style={{ width:22, height:22, borderRadius:6, background:`${c}14`, border:`1px solid ${c}26`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
                            {iconPath.startsWith('M') ? <path d={iconPath}/> : <polyline points={iconPath}/>}
                          </svg>
                        </div>
                      </div>
                      {isMoney ? (
                        <AnimatedNumber value={Math.abs(v)} prefix={`${showSign?(v>=0?'+':'-'):''}R$ `} style={{fontFamily:'var(--mono)',fontSize:22, fontWeight:900, color:c, letterSpacing:'-0.02em', display:'block'}} />
                      ) : (
                        <AnimatedNumber value={v} decimals={0} style={{fontFamily:'var(--mono)',fontSize:22, fontWeight:900, color:c, letterSpacing:'-0.02em', display:'block'}} />
                      )}
                      <p style={{ fontSize:10, color:'var(--t4)', margin:'4px 0 0', fontWeight:500 }}>{sub}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Modal Modo Operacao Admin */}
                <AnimatePresence>
                {myShowForm && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(2,4,8,0.85)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
                    onClick={e => { if (e.target === e.currentTarget) setMyShowForm(false) }}
                  >
                  <motion.div
                    initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
                    transition={{ duration:0.35, ease }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position:'relative', overflow:'hidden',
                      width:'100%', maxWidth:580, maxHeight:'calc(100dvh - 40px)', overflowY:'auto',
                      padding:32, borderRadius:22,
                      background:'linear-gradient(160deg, rgba(16,20,30,0.95), rgba(8,11,20,0.98))',
                      backdropFilter:'blur(30px) saturate(160%)', WebkitBackdropFilter:'blur(30px) saturate(160%)',
                      border:'1px solid rgba(229,57,53,0.1)',
                      boxShadow:'0 40px 100px rgba(0,0,0,0.75), 0 0 60px rgba(229,57,53,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Top highlight glow */}
                    <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(229,57,53,0.45), transparent)', pointerEvents:'none' }}/>
                    {/* Ambient orb */}
                    <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(229,57,53,0.08), transparent 60%)', filter:'blur(40px)', pointerEvents:'none' }}/>

                    {/* Header */}
                    <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                          width:40, height:40, borderRadius:11,
                          background:'rgba(229,57,53,0.12)', border:'1px solid rgba(229,57,53,0.28)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:'0 0 20px rgba(229,57,53,0.2)',
                        }}>
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        </div>
                        <div>
                          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', margin:'0 0 3px', letterSpacing:'-0.02em' }}>Nova operacao</h2>
                          <p style={{ fontSize:11, color:'var(--t3)', margin:0, fontWeight:500 }}>Configure a meta e inicie em segundos</p>
                        </div>
                      </div>
                      <button onClick={() => setMyShowForm(false)} style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t3)', transition:'all 0.2s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(229,57,53,0.1)'; e.currentTarget.style.color='#e53935' }}
                        onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.color='var(--t3)' }}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>

                    <form onSubmit={createMyMeta} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                      {/* Plataforma + Rede */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
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
                      </div>

                      {/* Titulo + Contas */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:12 }}>
                        <div>
                          <label className="t-label" style={{display:'block',marginBottom:6}}>Titulo *</label>
                          <input className="input" value={myTitulo} onChange={e=>setMyTitulo(e.target.value)} placeholder="Ex: Meta Abril" required/>
                        </div>
                        <div>
                          <label className="t-label" style={{display:'block',marginBottom:6}}>Contas</label>
                          <input className="input" type="number" min="1" value={myContas} onChange={e=>setMyContas(e.target.value)} style={{fontFamily:'var(--mono)'}}/>
                        </div>
                      </div>

                      {/* Selecao rapida contas */}
                      <div>
                        <label className="t-label" style={{display:'block',marginBottom:6}}>Selecao rapida</label>
                        <div style={{display:'flex',gap:8}}>
                          {[20,30,50,60].map(n=>(
                            <button key={n} type="button" onClick={()=>setMyContas(String(n))} style={{
                              flex:1, padding:'9px 0', borderRadius:10, fontSize:13, fontWeight:700,
                              fontFamily:'var(--mono)', border:'none', cursor:'pointer',
                              background: Number(myContas)===n ? 'rgba(229,57,53,0.12)' : 'var(--raised)',
                              color: Number(myContas)===n ? '#e53935' : 'var(--t3)',
                              border:`1px solid ${Number(myContas)===n ? 'rgba(229,57,53,0.25)' : 'var(--b1)'}`,
                              transition:'all 0.2s',
                            }}>{n}</button>
                          ))}
                        </div>
                      </div>

                      {/* Modelo — escolha estrategica */}
                      <div>
                        <label className="t-label" style={{display:'block',marginBottom:8}}>Modelo da meta</label>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                          {[
                            {k:'salario_bau', l:'Salario + Bau', desc:'Recebe salario fixo + bonus', icon:<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>},
                            {k:'apenas_bau', l:'Apenas Bau', desc:'So bonus das contas',        icon:<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>},
                          ].map(o=>{
                            const selected = myOpModel===o.k
                            return (
                              <motion.button
                                key={o.k} type="button"
                                onClick={()=>setMyOpModel(o.k)}
                                whileHover={{ y:-2, transition:{duration:0.15} }}
                                whileTap={{ scale:0.98 }}
                                style={{
                                  padding:'14px 14px', borderRadius:12, cursor:'pointer',
                                  background: selected ? 'linear-gradient(145deg, rgba(229,57,53,0.12), rgba(229,57,53,0.04))' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${selected ? 'rgba(229,57,53,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                  boxShadow: selected ? '0 4px 20px rgba(229,57,53,0.2), inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                                  textAlign:'left', fontFamily:'inherit',
                                  transition:'all 0.2s ease', position:'relative',
                                }}>
                                {selected && (
                                  <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', background:'#e53935', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 10px rgba(229,57,53,0.6)' }}>
                                    <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  </div>
                                )}
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, color: selected ? '#e53935' : 'var(--t2)' }}>
                                  {o.icon}
                                  <span style={{ fontSize:13, fontWeight:800 }}>{o.l}</span>
                                </div>
                                <p style={{ fontSize:10, color: selected ? 'rgba(229,57,53,0.75)' : 'var(--t4)', margin:0, fontWeight:500, lineHeight:1.4 }}>
                                  {o.desc}
                                </p>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Insights do admin — premium */}
                      {myMetas.length > 0 && (
                        <motion.div
                          initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} transition={{duration:0.3, delay:0.1}}
                          style={{
                            position:'relative', overflow:'hidden',
                            padding:'16px 18px', borderRadius:13,
                            background:'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                            border:'1px solid rgba(255,255,255,0.18)',
                            boxShadow:'0 4px 16px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.04)',
                          }}>
                          <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}/>
                          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                            <div style={{ width:26, height:26, borderRadius:8, background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                            </div>
                            <div>
                              <p style={{fontSize:12, fontWeight:700, color:'var(--t1)', margin:0, letterSpacing:'-0.01em'}}>Insights da sua operacao</p>
                              <p style={{fontSize:10, color:'var(--t4)', margin:'2px 0 0', fontWeight:500}}>Analise das metas anteriores</p>
                            </div>
                          </div>
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            {(() => {
                              const tips = []
                              const fechadas = myMetas.filter(m=>m.status_fechamento==='fechada')
                              const totalContas = fechadas.reduce((a,m)=>a+Number(m.quantidade_contas||0),0)
                              const totalLucro = fechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
                              if (fechadas.length > 0 && totalContas > 0) {
                                const avg = totalLucro / totalContas
                                tips.push({t:`Media geral: R$ ${fmt(Math.abs(avg))}/conta ${avg>=0?'(lucro)':'(prejuizo)'}`, dot:avg>=0?'#008C5E':'#EF4444'})
                              }
                              if (fechadas.length > 0) tips.push({t:`${fechadas.length} meta${fechadas.length>1?'s':''} fechada${fechadas.length>1?'s':''} · ${totalContas} depositantes processados`, dot:'rgba(255,255,255,0.78)'})
                              const lastMeta = myMetas[0]
                              if (lastMeta && lastMeta.rede) tips.push({t:`Ultima rede operada: ${lastMeta.rede}`, dot:'rgba(255,255,255,0.78)'})
                              return tips.map((tip,i) => (
                                <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                                  <div style={{width:5, height:5, borderRadius:'50%', background:tip.dot, flexShrink:0, boxShadow:`0 0 6px ${tip.dot}`}}/>
                                  <span style={{fontSize:11, color:'#CBD5E1', lineHeight:1.45}}>{tip.t}</span>
                                </div>
                              ))
                            })()}
                          </div>
                        </motion.div>
                      )}

                      {/* Resumo */}
                      {myPlat && myRede && (
                        <motion.div
                          initial={{opacity:0, y:4}} animate={{opacity:1, y:0}}
                          style={{
                            padding:'14px 16px', borderRadius:13,
                            background:'rgba(0,140,94,0.04)',
                            border:'1px solid rgba(0,140,94,0.15)',
                            boxShadow:'0 0 16px rgba(0,140,94,0.04)',
                          }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#008C5E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            <p style={{fontSize:10, fontWeight:800, color:'#008C5E', textTransform:'uppercase', letterSpacing:'0.1em', margin:0}}>Pronto para iniciar</p>
                          </div>
                          <div style={{display:'flex',gap:10, flexWrap:'wrap'}}>
                            <span style={{fontSize:12, color:'var(--t1)', fontWeight:700}}>{myPlat}</span>
                            <span style={{fontSize:11, color:'var(--t4)'}}>·</span>
                            <span style={{fontSize:12, color:'var(--t2)', fontFamily:'var(--mono)'}}>{myRede}</span>
                            <span style={{fontSize:11, color:'var(--t4)'}}>·</span>
                            <span style={{fontSize:12, color:'var(--t2)', fontFamily:'var(--mono)'}}>{myContas} contas</span>
                            <span style={{fontSize:11, color:'var(--t4)'}}>·</span>
                            <span style={{fontSize:11, color:'var(--t3)'}}>{myOpModel==='apenas_bau'?'Apenas Bau':'Salario + Bau'}</span>
                          </div>
                        </motion.div>
                      )}

                      {/* CTA FINAL — premium */}
                      <motion.button
                        type="submit"
                        disabled={mySaving||!myTitulo.trim()||!myPlat.trim()||!myRede}
                        whileHover={mySaving||!myTitulo.trim()||!myPlat.trim()||!myRede ? {} : {scale:1.015, boxShadow:'0 12px 40px rgba(229,57,53,0.55), 0 0 60px rgba(229,57,53,0.2)'}}
                        whileTap={mySaving||!myTitulo.trim()||!myPlat.trim()||!myRede ? {} : {scale:0.97}}
                        style={{
                          width:'100%', padding:'16px 24px', borderRadius:14, border:'none', cursor:(mySaving||!myTitulo.trim()||!myPlat.trim()||!myRede)?'not-allowed':'pointer',
                          fontSize:15, fontWeight:800, color:'#fff', fontFamily:'inherit',
                          background:(mySaving||!myTitulo.trim()||!myPlat.trim()||!myRede)?'rgba(229,57,53,0.35)':'linear-gradient(145deg, #e53935, #c62828)',
                          boxShadow:(mySaving||!myTitulo.trim()||!myPlat.trim()||!myRede)?'none':'0 8px 28px rgba(229,57,53,0.45), 0 0 40px rgba(229,57,53,0.15), inset 0 1px 0 rgba(255,255,255,0.18)',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                          opacity:(mySaving||!myTitulo.trim()||!myPlat.trim()||!myRede)?0.75:1,
                          letterSpacing:'-0.01em',
                          transition:'all 0.2s ease',
                          position:'relative', overflow:'hidden',
                        }}>
                        {mySaving ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                              style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.25)', borderTopColor:'#fff' }}
                            />
                            <span>Criando meta...</span>
                          </>
                        ) : (
                          <>
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            <span>Iniciar operacao agora</span>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft:4 }}><polyline points="9 18 15 12 9 6"/></svg>
                          </>
                        )}
                      </motion.button>
                    </form>
                  </motion.div>
                  </motion.div>
                )}
                </AnimatePresence>

                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {myMetas.length===0 ? (
                    <motion.div
                      initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}}
                      transition={{duration:0.4, ease}}
                      style={{
                        borderRadius:18, padding:'48px 32px', textAlign:'center',
                        background:'linear-gradient(145deg, rgba(14,22,38,0.5), rgba(8,14,26,0.5))',
                        backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                        border:'1px dashed rgba(229,57,53,0.2)',
                      }}>
                      <div style={{
                        width:56, height:56, borderRadius:16, margin:'0 auto 16px',
                        background:'rgba(229,57,53,0.08)', border:'1px solid rgba(229,57,53,0.2)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      </div>
                      <p style={{color:'var(--t1)', fontSize:16, fontWeight:700, marginBottom:6}}>Nenhuma meta criada ainda</p>
                      <p style={{color:'var(--t3)', fontSize:13, marginBottom:20}}>Crie sua primeira operacao e comece a registrar remessas.</p>
                      <motion.button
                        onClick={()=>setMyShowForm(true)}
                        whileHover={{scale:1.03, boxShadow:'0 8px 28px rgba(229,57,53,0.5)'}}
                        whileTap={{scale:0.97}}
                        style={{
                          padding:'12px 26px', borderRadius:12, border:'none', cursor:'pointer',
                          fontSize:14, fontWeight:700, color:'#fff', fontFamily:'inherit',
                          background:'linear-gradient(145deg, #e53935, #c62828)',
                          boxShadow:'0 6px 20px rgba(229,57,53,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                          display:'inline-flex', alignItems:'center', gap:8,
                        }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Criar primeira meta
                      </motion.button>
                    </motion.div>
                  ) : myMetas.map((m,i)=>{
                    const mRem=myRem.filter(r=>r.meta_id===m.id)
                    const lucro=mRem.reduce((a,r)=>a+Number(r.lucro||0),0)
                    const prej=mRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
                    const liq=lucro-prej
                    const fechada=m.status_fechamento==='fechada'
                    const accentC = fechada ? '#008C5E' : '#e53935'
                    return (
                      <motion.div key={m.id} {...fadeUp(i)}
                        whileHover={{ x:4, borderColor:`${accentC}35`, boxShadow:`0 10px 32px rgba(0,0,0,0.45), 0 0 30px ${accentC}10`, transition:{duration:0.2} }}
                        onClick={()=>router.push(`/meta/${m.id}`)}
                        style={{
                          position:'relative', overflow:'hidden', cursor:'pointer',
                          padding:'18px 22px', borderRadius:14,
                          background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
                          backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
                          border:'1px solid rgba(255,255,255,0.06)',
                          boxShadow:'0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
                          display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
                        }}>
                        {/* Accent bar esquerdo */}
                        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:`linear-gradient(180deg, ${accentC}, ${accentC}60)`, boxShadow:`0 0 12px ${accentC}80` }}/>

                        {/* Avatar da rede */}
                        <div style={{
                          width:44, height:44, borderRadius:12, flexShrink:0,
                          background:`${accentC}14`, border:`1px solid ${accentC}30`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontFamily:'var(--mono)', fontSize:11, fontWeight:800, color:accentC,
                        }}>
                          {(m.rede || '—').toString().slice(0,4)}
                        </div>

                        {/* Info principal */}
                        <div style={{ flex:1, minWidth:160 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.01em' }}>{m.titulo}</h3>
                            <span style={{
                              fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:5,
                              background: fechada ? 'rgba(0,140,94,0.12)' : 'rgba(229,57,53,0.1)',
                              color: fechada ? '#008C5E' : '#e53935',
                              border: `1px solid ${fechada ? 'rgba(0,140,94,0.25)' : 'rgba(229,57,53,0.2)'}`,
                              letterSpacing:'0.08em', textTransform:'uppercase',
                            }}>
                              {fechada?'Fechada':(m.status||'ativa')==='ativa'?'Ativa':'Finalizada'}
                            </span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, color:'var(--t3)', fontWeight:600 }}>{m.plataforma || '—'}</span>
                            <span style={{ fontSize:10, color:'var(--t4)' }}>·</span>
                            <span style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--mono)' }}>{mRem.length} remessa{mRem.length!==1?'s':''}</span>
                            {m.quantidade_contas && (<>
                              <span style={{ fontSize:10, color:'var(--t4)' }}>·</span>
                              <span style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--mono)' }}>{m.quantidade_contas} contas</span>
                            </>)}
                          </div>
                        </div>

                        {/* Resultado destacado */}
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <p style={{ fontSize:9, color:'var(--t4)', margin:'0 0 3px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                            {fechada ? 'Lucro final' : 'Resultado parcial'}
                          </p>
                          <span style={{
                            fontSize:18, fontWeight:900,
                            color: fechada ? (Number(m.lucro_final||0)>=0?'#008C5E':'#EF4444') : (liq>=0?'#008C5E':'#EF4444'),
                            fontFamily:'var(--mono)', letterSpacing:'-0.02em',
                            textShadow: `0 0 18px ${(fechada?Number(m.lucro_final||0):liq)>=0 ? 'rgba(0,140,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                          }}>
                            {(fechada?Number(m.lucro_final||0):liq)>=0?'+':''}R$ {fmt(fechada?Number(m.lucro_final||0):liq)}
                          </span>
                        </div>

                        {/* Chevron */}
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
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

          {/* ── DEMO MODE FOR NEW ADMINS ── */}
          {!loading && shouldShowDemo(metas) ? (
            <DemoAdminDashboard
              onCreateMeta={() => { setTab('myops'); setTimeout(() => setMyShowForm(true), 300) }}
              userName={getName(profile)}
            />
          ) : (<>

          {/* ── Status global da operacao ── */}
          {(() => {
            const liq = global.lucroFinalTotal - global.custosTotal
            const ativas = global.ativas
            const remsHoje = remessas.filter(r=>new Date(r.created_at).toDateString()===new Date().toDateString())
            const negHoje = remsHoje.filter(r=>Number(r.resultado||0)<0).length
            const posHoje = remsHoje.filter(r=>Number(r.resultado||0)>=0).length
            let opStatus, opColor, opText
            if (liq > 0 && negHoje <= posHoje) { opStatus='Saudavel'; opColor='#008C5E'; opText='Operacao acelerando — resultado consistente' }
            else if (liq >= 0 && negHoje > posHoje) { opStatus='Oscilando'; opColor='rgba(255,255,255,0.78)'; opText='Oscilacao detectada — resultados variando' }
            else if (liq < 0) { opStatus='Atencao'; opColor='#EF4444'; opText='Resultado acumulado negativo — fique atento' }
            else { opStatus='Estavel'; opColor='rgba(255,255,255,0.78)'; opText='Operacao estavel — aguardando mais dados' }
            return (
              <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
                style={{ padding:'12px 18px', borderRadius:12, marginBottom:16, background:`${opColor}06`, border:`1px solid ${opColor}18`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <motion.div animate={{ boxShadow:[`0 0 0 0 ${opColor}00`,`0 0 0 6px ${opColor}20`,`0 0 0 0 ${opColor}00`] }} transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
                    style={{ width:10, height:10, borderRadius:'50%', background:opColor, flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:opColor, margin:0 }}>Status: {opStatus}</p>
                    <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{opText}</p>
                  </div>
                </div>
                <span style={{ fontSize:9, color:'var(--t4)', fontWeight:500 }}>Atualizado agora</span>
              </motion.div>
            )
          })()}

          {/* ── Insights rotativos ── */}
          {(() => {
            const tips = []
            // Alerta prejuizo anormal
            if (abnormalLossAlert) tips.push({ text: `Remessa com prejuizo anormal: R$ ${fmt(abnormalLossAlert.value)} (media: R$ ${fmt(abnormalLossAlert.avg)})`, type: 'loss' })
            // Positivos
            const lucroHojeNet = global.lucroHoje - global.custosHoje
            const lucroTotalNet = global.lucroFinalTotal - global.custosTotal
            if (lucroHojeNet > 0) tips.push({ text: `Lucro do dia: +R$ ${fmt(lucroHojeNet)} — operacao no positivo`, type: 'profit' })
            if (lucroTotalNet > 0) tips.push({ text: `Lucro total acumulado: +R$ ${fmt(lucroTotalNet)}`, type: 'profit' })
            if (global.lucroPerConta > 0) tips.push({ text: `Media de R$ ${fmt(global.lucroPerConta)}/conta — rentabilidade positiva`, type: 'profit' })
            // Negativos
            if (lucroHojeNet < 0) tips.push({ text: `Resultado do dia negativo: R$ ${fmt(Math.abs(lucroHojeNet))} de prejuizo`, type: 'loss' })
            if (global.custosHoje > 0) tips.push({ text: `Custos hoje: R$ ${fmt(global.custosHoje)}`, type: 'warn' })
            // Dicas
            tips.push({ text: `${global.ativas} meta${global.ativas!==1?'s':''} ativa${global.ativas!==1?'s':''} e ${global.fechadas} fechada${global.fechadas!==1?'s':''}`, type: 'info' })
            if (global.ops > 0) tips.push({ text: `${global.ops} operadores na equipe — ${global.totalRem} remessas registradas`, type: 'info' })
            if (global.breakEvenContas > 0) tips.push({ text: `Break-even: ${global.breakEvenContas} contas com bau por meta pra cobrir custos`, type: 'info' })
            if (tips.length === 0) return null
            const cfgT = { profit: { bg:'var(--profit-dim)', border:'var(--profit-border)', color:'var(--profit)' }, loss: { bg:'var(--loss-dim)', border:'var(--loss-border)', color:'var(--loss)' }, warn: { bg:'var(--warn-dim)', border:'var(--warn-border)', color:'var(--warn)' }, info: { bg:'rgba(255,255,255,0.06)', border:'rgba(255,255,255,0.12)', color:'var(--info)' } }
            const idx = Math.floor(Date.now() / 8000) % tips.length
            const tip = tips[idx]
            const c = cfgT[tip.type]
            return (
              <motion.div
                key={tip.text}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3 }}
                style={{ padding:'12px 18px', borderRadius:12, marginBottom:20, background:c.bg, border:`1px solid ${c.border}`, display:'flex', alignItems:'center', gap:10 }}
              >
                <div style={{ width:6, height:6, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                <p style={{ margin:0, fontSize:13, fontWeight:500, color:c.color }}>{tip.text}</p>
              </motion.div>
            )
          })()}

          {/* ── HERO + KPIs — side by side ── */}
          {(() => {
            // Compute NET hero value ONCE (bruto - custos do periodo)
            const heroNet = Number((heroLucro.value - heroLucro.custos).toFixed(2))
            return (
          <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:32, marginBottom:40 }}>

            {/* LEFT — Hero ultra clean */}
            <motion.div
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              transition={{duration:0.4,ease}}
              style={{
                padding:'40px 36px',
                background:'var(--surface)',
                border:'1px solid var(--b1)',
                borderRadius:14,
              }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}>
                <p style={{ fontSize:12, color:'var(--t3)', fontWeight:500, margin:0, letterSpacing:'0' }}>
                  {heroPeriod==='all'?'Lucro consolidado · desde o inicio':heroPeriod==='today'?'Lucro de hoje':heroPeriod==='yesterday'?'Lucro de ontem':heroPeriod==='7d'?'Lucro · ultimos 7 dias':'Lucro · ultimos 30 dias'}
                </p>
                <div style={{ display:'flex', gap:0 }}>
                  {[['all','Tudo'],['today','Hoje'],['yesterday','Ontem'],['7d','7d'],['30d','30d']].map(([k,l])=>(
                    <button key={k} onClick={()=>setHeroPeriod(k)}
                      style={{
                        fontSize:11, fontWeight:500, padding:'6px 12px',
                        cursor:'pointer', border:'none', background:'transparent',
                        color: heroPeriod===k ? 'var(--t1)' : 'var(--t3)',
                        borderBottom: heroPeriod===k ? '1px solid var(--t1)' : '1px solid transparent',
                        transition:'all 0.15s', fontFamily:'inherit',
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatedNumber
                value={Math.abs(heroNet)}
                key={heroPeriod}
                prefix={`${heroNet>=0?'+':'-'}R$ `}
                className="hero-value"
                style={{
                  fontFamily:'var(--mono)', fontSize:60, fontWeight:700,
                  color: heroNet>=0 ? 'var(--profit)' : 'var(--loss)',
                  lineHeight:1, letterSpacing:'-0.04em', display:'block',
                }}
              />
              <style>{`
                @media (max-width: 768px) { .hero-value { font-size: 44px !important; } }
                @media (max-width: 480px) { .hero-value { font-size: 36px !important; } }
              `}</style>

              {heroLucro.custos > 0 && (
                <p style={{ fontSize:12, color:'var(--t3)', margin:'10px 0 0', fontFamily:'var(--mono)', fontWeight:400 }}>
                  apos R$ {fmt(heroLucro.custos)} em custos
                </p>
              )}

              <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:32, marginTop:36, paddingTop:24, borderTop:'1px solid var(--b1)' }}>
                <div>
                  <p style={{ fontSize:11, color:'var(--t3)', marginBottom:4, fontWeight:400 }}>Metas fechadas</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:600, color:'var(--t1)', margin:0 }}>{heroLucro.count}</p>
                </div>
                <div>
                  <p style={{ fontSize:11, color:'var(--t3)', marginBottom:4, fontWeight:400 }}>Operadores</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:600, color:'var(--t1)', margin:0 }}>{global.ops}</p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT — KPIs em lista clean */}
            <motion.div
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              transition={{duration:0.4,delay:0.1,ease}}
              style={{
                padding:'24px 28px',
                background:'var(--surface)',
                border:'1px solid var(--b1)',
                borderRadius:14,
                display:'flex', flexDirection:'column', justifyContent:'center',
              }}>
              {[
                { label:'Total depositado', value:global.totalDep, prefix:'R$ ' },
                { label:'Total sacado', value:global.totalSaq, prefix:'R$ ' },
                { label:'Metas', value:global.totalMetas, decimals:0 },
                { label:'Depositantes', value:metas.filter(m=>m.status_fechamento==='fechada').reduce((a,m)=>a+Number(m.quantidade_contas||0),0), decimals:0 },
              ].map((k,i,arr)=>(
                <div key={i} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
                  padding:'14px 0',
                  borderBottom: i<arr.length-1 ? '1px solid var(--b1)' : 'none',
                }}>
                  <span style={{ fontSize:13, color:'var(--t2)', fontWeight:400 }}>{k.label}</span>
                  <AnimatedNumber value={k.value} prefix={k.prefix||''} decimals={k.decimals ?? 2}
                    style={{
                      fontFamily:'var(--mono)',
                      fontSize:15, fontWeight:600,
                      color:'var(--t1)',
                      letterSpacing:'-0.01em',
                    }} />
                </div>
              ))}
            </motion.div>
          </div>
            )
          })()}

          {/* Resumo estrategico — clean, sem orb e sem badges pesados */}
          {strategicSummary && (strategicSummary.bestRede || strategicSummary.worstRede || strategicSummary.topOp) && (
            <motion.div
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              transition={{duration:0.4,delay:0.15,ease}}
              style={{
                padding:'24px 28px', borderRadius:14, marginBottom:32,
                background:'var(--surface)',
                border:'1px solid var(--b1)',
              }}>
              <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 18px', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                Leitura da operacao
              </p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:32 }}>
                {strategicSummary.bestRede && (
                  <div>
                    <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Melhor rede</p>
                    <p style={{ fontSize:18, fontWeight:600, color:'var(--t1)', margin:'0 0 4px', fontFamily:'var(--mono)' }}>
                      {strategicSummary.bestRede.rede}
                    </p>
                    <p style={{ fontSize:12, color:'var(--profit)', margin:0, fontWeight:500, fontFamily:'var(--mono)' }}>
                      +R$ {fmt(strategicSummary.bestRede.lucroPorMeta)}/meta
                    </p>
                  </div>
                )}

                {strategicSummary.worstRede ? (
                  <div>
                    <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Principal risco</p>
                    <p style={{ fontSize:18, fontWeight:600, color:'var(--t1)', margin:'0 0 4px', fontFamily:'var(--mono)' }}>
                      {strategicSummary.worstRede.rede}
                    </p>
                    <p style={{ fontSize:12, color:'var(--loss)', margin:0, fontWeight:500, fontFamily:'var(--mono)' }}>
                      −R$ {fmt(Math.abs(strategicSummary.worstRede.lucro))} em {strategicSummary.worstRede.metas} meta{strategicSummary.worstRede.metas>1?'s':''}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Risco operacional</p>
                    <p style={{ fontSize:18, fontWeight:600, color:'var(--t1)', margin:'0 0 4px' }}>Nenhum</p>
                    <p style={{ fontSize:12, color:'var(--t3)', margin:0, fontWeight:400 }}>Todas as redes positivas</p>
                  </div>
                )}

                {strategicSummary.topOp && (
                  <div>
                    <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Operador em alta</p>
                    <p style={{ fontSize:18, fontWeight:600, color:'var(--t1)', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {strategicSummary.topOp.nome}
                    </p>
                    <p style={{ fontSize:12, color:'var(--profit)', margin:0, fontWeight:500, fontFamily:'var(--mono)' }}>
                      +R$ {fmt(strategicSummary.topOp.lucro)} · {strategicSummary.topOp.ativas} ativa{strategicSummary.topOp.ativas>1?'s':''}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Previsao + Break-even — bloco unico clean */}
          {global.fechadas > 0 && (
            <motion.div
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              transition={{duration:0.4,delay:0.2,ease}}
              style={{
                padding:'24px 28px', borderRadius:14, marginBottom:32,
                background:'var(--surface)',
                border:'1px solid var(--b1)',
              }}>
              <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 18px', fontWeight:500, letterSpacing:'0.04em', textTransform:'uppercase' }}>
                Previsao
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:32 }}>
                <div>
                  <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Media por meta</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:600, color:global.lucroPerMeta>=0?'var(--profit)':'var(--loss)', margin:0, letterSpacing:'-0.02em' }}>
                    {global.lucroPerMeta>=0?'+':''}R$ {fmt(global.lucroPerMeta)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Media por conta</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:600, color:global.lucroPerConta>=0?'var(--profit)':'var(--loss)', margin:0, letterSpacing:'-0.02em' }}>
                    {global.lucroPerConta>=0?'+':''}R$ {fmt(global.lucroPerConta)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Projecao · 50 contas</p>
                  <p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:600, color:global.lucroPerConta*50>=0?'var(--profit)':'var(--loss)', margin:0, letterSpacing:'-0.02em' }}>
                    {global.lucroPerConta*50>=0?'+':''}R$ {fmt(global.lucroPerConta*50)}
                  </p>
                </div>
                {global.breakEvenContas > 0 && (
                  <div>
                    <p style={{ fontSize:11, color:'var(--t3)', margin:'0 0 6px', fontWeight:400 }}>Break-even</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:20, fontWeight:600, color:'var(--t1)', margin:0, letterSpacing:'-0.02em' }}>
                      {global.breakEvenContas} contas
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Activity — feed + operators (clean) */}
          <div className="g-side" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:20 }}>

            {/* Feed — lista clean */}
            <motion.div
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              transition={{duration:0.4,delay:0.25,ease}}
              style={{
                padding:'24px 28px', borderRadius:14,
                background:'var(--surface)',
                border:'1px solid var(--b1)',
              }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)', margin:0, letterSpacing:'-0.01em' }}>Atividade recente</h3>
                <span style={{ fontSize:11, color:'var(--t3)', fontWeight:400 }}>{remessas.length} remessas</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {remessas.slice(0,6).map((r,i)=>{
                  const m   = metas.find(x=>x.id===r.meta_id)
                  const op  = operators.find(o=>o.id===m?.operator_id)
                  const pos = Number(r.resultado||0)>=0
                  const val = Math.abs(Number(r.resultado||0))
                  const valColor = pos ? 'var(--profit)' : 'var(--loss)'
                  const diffMs = Date.now() - new Date(r.created_at).getTime()
                  const diffMin = Math.floor(diffMs/60000)
                  const diffH = Math.floor(diffMs/3600000)
                  const diffD = Math.floor(diffMs/86400000)
                  const timeLabel = diffMin < 1 ? 'agora' : diffMin < 60 ? `${diffMin}min` : diffH < 24 ? `${diffH}h` : `${diffD}d`
                  return (
                    <div key={r.id}
                      style={{
                        padding:'14px 0', display:'flex', alignItems:'center', gap:14,
                        borderBottom: i<5 ? '1px solid var(--b1)' : 'none',
                      }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--raised)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--t2)' }}>{getName(op)[0]?.toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:500, color:'var(--t1)', margin:0 }}>{getName(op)}</p>
                        <p style={{ fontSize:11, color:'var(--t3)', margin:'2px 0 0' }}>
                          {m?.rede||'—'} · {timeLabel}
                        </p>
                      </div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:600, color:valColor, flexShrink:0 }}>
                        {pos?'+':'-'}R$ {fmt(val)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Operadores — lista clean */}
            <motion.div
              initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              transition={{duration:0.4,delay:0.3,ease}}
              style={{
                padding:'24px 28px', borderRadius:14,
                background:'var(--surface)',
                border:'1px solid var(--b1)',
              }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <h3 style={{ fontSize:13, fontWeight:600, color:'var(--t1)', margin:0, letterSpacing:'-0.01em' }}>Top operadores</h3>
                <span style={{ fontSize:11, color:'var(--t3)', fontWeight:400 }}>{operators.length} na equipe</span>
              </div>
              {(() => {
                const ranked = operators.map(op => {
                  const opMetasFechadas = metas.filter(m=>m.operator_id===op.id&&m.status_fechamento==='fechada')
                  const lucroFinal = opMetasFechadas.reduce((a,m)=>a+Number(m.lucro_final||0),0)
                  const ativas = metas.filter(m=>m.operator_id===op.id&&(m.status||'ativa')==='ativa').length
                  const totalRem = remessas.filter(r=>metas.some(m=>m.id===r.meta_id&&m.operator_id===op.id)).length
                  return { ...op, lucroFinal, ativas, fechadas: opMetasFechadas.length, totalRem }
                }).sort((a,b)=>b.lucroFinal-a.lucroFinal).slice(0,5)
                return (
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    {ranked.map((op,i) => {
                      const isPos = op.lucroFinal >= 0
                      return (
                        <div key={op.id}
                          style={{
                            padding:'14px 0', display:'flex', alignItems:'center', gap:14,
                            borderBottom: i<ranked.length-1 ? '1px solid var(--b1)' : 'none',
                          }}>
                          <span style={{ fontSize:12, fontWeight:500, color:'var(--t3)', minWidth:18, fontFamily:'var(--mono)' }}>{i+1}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:500, color:'var(--t1)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{getName(op)}</p>
                            <p style={{ fontSize:11, color:'var(--t3)', margin:'2px 0 0' }}>{op.fechadas} fechadas · {op.totalRem} remessas</p>
                          </div>
                          <span style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:600, color:isPos?'var(--profit)':'var(--loss)', flexShrink:0 }}>
                            {isPos?'+':'-'}R$ {fmt(Math.abs(op.lucroFinal))}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </motion.div>
          </div>

          {/* PRO locked cards — only show if NOT PRO active */}
          {!(sub?.status === 'active' && new Date(sub.expires_at) > new Date()) && <div className="g-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginTop:24 }}>
            <ProLockedCard title="Previsao inteligente" description="Previsoes que aumentam seu lucro. Pare de operar no escuro — saiba quanto voce vai faturar nos proximos 30 dias." icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z">
              <div><div style={{height:14,width:'60%',background:'rgba(0,140,94,0.1)',borderRadius:3,marginBottom:6}}/><div style={{height:20,width:'45%',background:'rgba(0,140,94,0.08)',borderRadius:3}}/></div>
            </ProLockedCard>
            <ProLockedCard title="Ranking de redes" description="Descubra as redes mais lucrativas. Veja onde voce esta perdendo dinheiro e onde concentrar pra maximizar performance." icon="M3 4h18M3 8h12M3 12h18M3 16h8M3 20h14">
              <div>{[1,2,3].map(i=>(<div key={i} style={{height:10,width:`${80-i*15}%`,background:'rgba(255,255,255,0.04)',borderRadius:3,marginBottom:4}}/>))}</div>
            </ProLockedCard>
            <ProLockedCard title="Alertas estrategicos" description="Decisoes baseadas em dados reais. Detecte queda de performance, operadores inativos e metas em risco antes que virem prejuizo." icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5">
              <div>{[1,2,3].map(i=>(<div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0'}}><div style={{width:4,height:4,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/><div style={{height:8,width:`${60+i*10}%`,background:'rgba(255,255,255,0.03)',borderRadius:2}}/></div>))}</div>
            </ProLockedCard>
          </div>}
        </>)}
        </motion.div>)}

        {/* ═══ OPERATIONS ═══ */}
        {tab==='operations' && (()=>{
          const NET_COLORS={
            COROA:{h:'42,100%,50%',hex:'#d4a017',name:'Dourado'},VOY:{h:'220,90%,60%',hex:'rgba(255,255,255,0.78)',name:'Azul'},
            WE:{h:'270,70%,60%',hex:'rgba(255,255,255,0.78)',name:'Roxo'},W1:{h:'200,80%,55%',hex:'#0ea5e9',name:'Cyan'},
            OKOK:{h:'160,70%,45%',hex:'#008c5e',name:'Verde'},DZ:{h:'0,65%,55%',hex:'#ef4444',name:'Vermelho'},
            A8:{h:'30,90%,55%',hex:'rgba(255,255,255,0.78)',name:'Laranja'},ANJO:{h:'320,60%,55%',hex:'#d946ef',name:'Pink'},
            '91':{h:'180,60%,45%',hex:'#14b8a6',name:'Teal'},'777':{h:'50,80%,55%',hex:'#eab308',name:'Amarelo'},
            '888':{h:'280,55%,55%',hex:'rgba(255,255,255,0.78)',name:'Violeta'},XW:{h:'340,65%,55%',hex:'#f43f5e',name:'Rose'},
            EK:{h:'210,70%,50%',hex:'#2563eb',name:'Royal'},DY:{h:'150,60%,50%',hex:'#008c5e',name:'Lime'},
            GAME:{h:'260,60%,55%',hex:'rgba(255,255,255,0.78)',name:'Indigo'},ALFA:{h:'10,80%,55%',hex:'#f97316',name:'Amber'},
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
                {[['all','Tudo'],['today','Hoje'],['yesterday','Ontem'],['week','7 dias'],['month','30 dias']].map(([k,l])=>(
                  <motion.button key={k} onClick={()=>setMetaPeriod(k)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{fontFamily:'Inter,sans-serif',fontSize:11,fontWeight:600,padding:'5px 12px',borderRadius:7,cursor:'pointer',transition:'all 0.15s',border:'none',background:metaPeriod===k?'var(--raised)':'transparent',color:metaPeriod===k?'var(--t1)':'var(--t3)'}}>{l}</motion.button>
                ))}
              </div>
            </div>

            {/* Shimmer + breathing keyframes */}
            <style>{`
              @keyframes metaBreath { 0%,100% { transform:scale(1); box-shadow:0 0 20px rgba(239,68,68,0.06); } 50% { transform:scale(1.008); box-shadow:0 0 30px rgba(239,68,68,0.12); } }
              @keyframes progShimmer { 0% { left:-100%; } 100% { left:200%; } }
            `}</style>

            {/* Leitura da operacao (AI insight) */}
            {filteredMetas.length >= 2 && (() => {
              const aiInsights = []
              // Analyze redes
              const redePerf = {}
              filteredMetas.filter(m=>m.status_fechamento!=='fechada').forEach(m => {
                const r = m.rede || 'Outros'
                const mRem = remessas.filter(rm=>rm.meta_id===m.id)
                const liq = mRem.reduce((a,rm)=>a+Number(rm.lucro||0),0) - mRem.reduce((a,rm)=>a+Number(rm.prejuizo||0),0)
                if (!redePerf[r]) redePerf[r] = { total:0, count:0 }
                redePerf[r].total += liq; redePerf[r].count++
              })
              const worstRede = Object.entries(redePerf).filter(([,v])=>v.total<0).sort((a,b)=>a[1].total-b[1].total)[0]
              if (worstRede) aiInsights.push({ text:`Maioria dos prejuizos vem da rede ${worstRede[0]}`, type:'warn' })
              // Sequence check
              const ativas = filteredMetas.filter(m=>m.status_fechamento!=='fechada')
              const emSeqNeg = ativas.filter(m=>{
                const mRem=[...remessas.filter(r=>r.meta_id===m.id)].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,2)
                return mRem.length>=2 && mRem.every(r=>Number(r.resultado||0)<0)
              }).length
              if (emSeqNeg>0) aiInsights.push({ text:`${emSeqNeg} meta${emSeqNeg>1?'s':''} em sequencia negativa`, type:'critical' })
              // Best performing contas size
              const fechadasPos = filteredMetas.filter(m=>m.status_fechamento==='fechada'&&Number(m.lucro_final||0)>0)
              if (fechadasPos.length >= 2) {
                const avg = fechadasPos.reduce((a,m)=>a+Number(m.quantidade_contas||0),0)/fechadasPos.length
                aiInsights.push({ text:`Metas com ~${Math.round(avg)} contas estao performando melhor`, type:'profit' })
              }
              // Positive
              const posCount = ativas.filter(m=>{
                const mRem=remessas.filter(r=>r.meta_id===m.id)
                return mRem.reduce((a,r)=>a+Number(r.lucro||0),0)-mRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)>0
              }).length
              if (posCount > ativas.length * 0.6 && ativas.length >= 2) aiInsights.push({ text:`${posCount} de ${ativas.length} metas ativas no positivo`, type:'profit' })
              if (aiInsights.length === 0) return null
              const colors = { profit:'#008C5E', warn:'rgba(255,255,255,0.78)', critical:'#EF4444' }
              return (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
                  style={{
                    position:'relative', overflow:'hidden',
                    padding:'18px 22px', borderRadius:16, marginBottom:18,
                    background:'linear-gradient(145deg, rgba(14,22,38,0.75), rgba(8,14,26,0.75))',
                    backdropFilter:'blur(22px) saturate(160%)', WebkitBackdropFilter:'blur(22px) saturate(160%)',
                    border:'1px solid rgba(255,255,255,0.18)',
                    boxShadow:'0 10px 36px rgba(0,0,0,0.45), 0 0 40px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}>
                  <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', pointerEvents:'none' }}/>
                  <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.12), transparent 60%)', filter:'blur(24px)', pointerEvents:'none' }}/>

                  <div style={{ position:'relative', display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                    <div style={{
                      width:34, height:34, borderRadius:10,
                      background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.32)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 0 16px rgba(255,255,255,0.2)',
                    }}>
                      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.01em' }}>Leitura da operacao</p>
                      <p style={{ fontSize:10, color:'var(--t4)', margin:'2px 0 0', fontWeight:500 }}>Analise automatica em tempo real</p>
                    </div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, background:'rgba(0,140,94,0.08)', border:'1px solid rgba(0,140,94,0.18)' }}>
                      <motion.div
                        animate={{ boxShadow:['0 0 0 0 rgba(0,140,94,0.6)','0 0 0 5px rgba(0,140,94,0)','0 0 0 0 rgba(0,140,94,0)'] }}
                        transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                        style={{ width:5, height:5, borderRadius:'50%', background:'#008C5E' }}
                      />
                      <span style={{ fontSize:9, color:'#008C5E', fontWeight:800, letterSpacing:'0.08em' }}>AO VIVO</span>
                    </div>
                  </div>

                  <div style={{ position:'relative', display:'flex', flexDirection:'column', gap:8 }}>
                    {aiInsights.slice(0,4).map((ins,j) => {
                      const c = colors[ins.type]||'rgba(255,255,255,0.78)'
                      return (
                        <motion.div key={j} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.35, delay:0.1+j*0.08, ease:[0.33,1,0.68,1] }}
                          style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'9px 12px', borderRadius:10,
                            background:`${c}08`, border:`1px solid ${c}14`,
                          }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0, boxShadow:`0 0 8px ${c}` }}/>
                          <span style={{ fontSize:12, color:'#E2E8F0', lineHeight:1.45, fontWeight:600 }}>{ins.text}</span>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })()}

            {/* Resumo inteligente */}
            {filteredMetas.length > 0 && (() => {
              const metaStats = filteredMetas.map(m => {
                const mRem = remessas.filter(r => r.meta_id === m.id)
                const liq = mRem.reduce((a,r)=>a+Number(r.lucro||0),0) - mRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
                const val = m.status_fechamento === 'fechada' && m.lucro_final != null ? Number(m.lucro_final) : liq
                return val
              })
              const emPrej = metaStats.filter(v => v < 0).length
              const emLucro = metaStats.filter(v => v > 0).length
              const neutras = metaStats.filter(v => v === 0).length
              const fechadas = filteredMetas.filter(m => m.status_fechamento === 'fechada').length
              const items = [
                emLucro > 0 && { label:'em lucro', count:emLucro, c:'#008C5E', bg:'rgba(0,140,94,0.08)', border:'rgba(0,140,94,0.22)' },
                emPrej > 0 && { label:'em prejuizo', count:emPrej, c:'#EF4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.24)', pulse:true },
                neutras > 0 && { label:'neutras', count:neutras, c:'rgba(255,255,255,0.78)', bg:'rgba(255,255,255,0.08)', border:'rgba(255,255,255,0.22)' },
                fechadas > 0 && { label:'concluidas', count:fechadas, c:'#94A3B8', bg:'rgba(148,163,184,0.06)', border:'rgba(148,163,184,0.16)' },
              ].filter(Boolean)
              return (
                <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}
                  style={{ display:'grid', gridTemplateColumns:`repeat(auto-fit, minmax(160px, 1fr))`, gap:10, marginBottom:20 }}>
                  {items.map((it, idx) => (
                    <motion.div key={it.label}
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                      transition={{ duration:0.3, delay:idx*0.06 }}
                      whileHover={{ y:-2, transition:{ duration:0.15 } }}
                      style={{
                        position:'relative', overflow:'hidden',
                        padding:'12px 16px', borderRadius:12,
                        background: it.bg,
                        border: `1px solid ${it.border}`,
                        boxShadow: `0 4px 16px rgba(0,0,0,0.25), 0 0 16px ${it.c}08`,
                        display:'flex', alignItems:'center', gap:12,
                        animation: it.pulse ? 'metaResumoBreath 3s ease-in-out infinite' : 'none',
                      }}>
                      {/* Accent line */}
                      <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:2, borderRadius:'0 2px 2px 0', background:it.c, boxShadow:`0 0 8px ${it.c}` }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                          <span style={{ fontSize:22, fontWeight:900, color:it.c, fontFamily:'var(--mono)', letterSpacing:'-0.02em', lineHeight:1 }}>{it.count}</span>
                          <span style={{ fontSize:10, color:it.c, fontWeight:700, letterSpacing:'0.04em' }}>meta{it.count>1?'s':''}</span>
                        </div>
                        <p style={{ fontSize:10, color:'var(--t3)', margin:'4px 0 0', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{it.label}</p>
                      </div>
                      {it.pulse && (
                        <motion.div
                          animate={{ boxShadow:[`0 0 0 0 ${it.c}80`,`0 0 0 6px ${it.c}00`,`0 0 0 0 ${it.c}00`] }}
                          transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                          style={{ width:7, height:7, borderRadius:'50%', background:it.c, flexShrink:0 }}
                        />
                      )}
                    </motion.div>
                  ))}
                  <style>{`@keyframes metaResumoBreath { 0%,100% { box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 0 16px rgba(239,68,68,0.08) } 50% { box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 0 28px rgba(239,68,68,0.18) } }`}</style>
                </motion.div>
              )
            })()}

            {/* Grid */}
            <div className="g-4" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
              {[...filteredMetas].sort((a,b) => {
                // When filtering by fechadas: most recent first
                if (metaStatus === 'fechada') {
                  return new Date(b.fechada_em || b.created_at) - new Date(a.fechada_em || a.created_at)
                }
                // Default: prejuizo first, then neutro, then lucro, then fechada
                const getVal = m => {
                  const mRem = remessas.filter(r => r.meta_id === m.id)
                  const liq = mRem.reduce((s,r)=>s+Number(r.lucro||0),0) - mRem.reduce((s,r)=>s+Number(r.prejuizo||0),0)
                  return m.status_fechamento === 'fechada' ? 99999 + (Number(m.lucro_final||0)) : liq
                }
                return getVal(a) - getVal(b)
              }).map((m,i)=>{
                const mRem=remessas.filter(r=>r.meta_id===m.id)
                const lucroR=mRem.reduce((a,r)=>a+Number(r.lucro||0),0)
                const prejR=mRem.reduce((a,r)=>a+Number(r.prejuizo||0),0)
                const liqR=lucroR-prejR
                const fechada=m.status_fechamento==='fechada'
                const nc=getNC(m.rede)
                const totalContas=m.quantidade_contas||0
                const remDone=mRem.length
                // Progresso por DEPOSITANTES (contas processadas), nao por numero de remessas
                // Redeposito nao conta na progressao (regra do projeto)
                const contasFeitas = mRem.filter(r => r.tipo !== 'redeposito').reduce((s,r)=>s+Number(r.contas_remessa||0),0)
                const depDone=fechada?totalContas:Math.min(contasFeitas,totalContas)
                const progPct=fechada?100:(totalContas>0?Math.min(100,(depDone/totalContas)*100):0)
                const displayVal=fechada&&m.lucro_final!=null?Number(m.lucro_final):liqR
                const isPos=displayVal>=0
                const metaDate=new Date(m.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})
                const isAtiva = !fechada && (m.status||'ativa')==='ativa'

                // Insight per card
                const last3 = [...mRem].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,3)
                const negSeq = last3.filter(r=>Number(r.resultado||0)<0).length
                const posSeq = last3.filter(r=>Number(r.resultado||0)>=0).length
                const acerto = mRem.length > 0 ? Math.round(mRem.filter(r=>Number(r.resultado||0)>=0).length/mRem.length*100) : 0
                let insightText = '', insightColor = ''
                if (fechada) { insightText = ''; insightColor = '' }
                else if (displayVal < 0 && negSeq >= 2) { insightText = `${negSeq} perdas seguidas`; insightColor = '#EF4444' }
                else if (acerto < 40 && mRem.length >= 3) { insightText = 'Baixo acerto'; insightColor = 'rgba(255,255,255,0.78)' }
                else if (displayVal < 0) { insightText = 'Em prejuizo'; insightColor = '#EF4444' }
                else if (posSeq >= 2 && displayVal > 0) { insightText = 'Boa consistencia'; insightColor = '#008C5E' }
                else if (mRem.length > 0) { insightText = 'Oscilando'; insightColor = 'rgba(255,255,255,0.78)' }

                // Status badge
                const statusLabel = fechada ? 'CONCLUIDA' : displayVal < 0 ? 'EM PREJUIZO' : displayVal > 0 ? 'EM LUCRO' : 'EM RISCO'
                const statusColor = fechada ? '#94A3B8' : displayVal < 0 ? '#EF4444' : displayVal > 0 ? '#008C5E' : 'rgba(255,255,255,0.78)'

                // Progress bar color based on result
                const progColor = fechada ? 'linear-gradient(90deg, #008C5E, #4ADE80)' : displayVal >= 0 ? `linear-gradient(90deg, #008C5E, #4ADE80)` : `linear-gradient(90deg, #EF4444, #F87171)`

                return (
                  <motion.div key={m.id} onClick={()=>openMetaDetail(m)}
                    initial={{opacity:0,y:16,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
                    transition={{duration:0.35,delay:Math.min(i*0.04,0.5),ease}}
                    whileHover={{
                      y:-5,scale:1.025,
                      boxShadow:`0 0 30px ${statusColor}18, 0 16px 40px rgba(0,0,0,0.45)`,
                      borderColor:`${statusColor}55`,
                      transition:{duration:0.2}
                    }}
                    whileTap={{ scale:0.98 }}
                    style={{
                    borderRadius:18,overflow:'hidden',position:'relative',
                    background:`linear-gradient(160deg, ${statusColor}${!isPos&&!fechada?'18':'0e'} 0%, ${statusColor}05 40%, rgba(10,18,32,0.92) 100%)`,
                    backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
                    border:`1px solid ${statusColor}${!isPos&&!fechada?'55':'30'}`,
                    boxShadow:`0 0 ${!isPos&&!fechada?'32':'20'}px ${statusColor}${!isPos&&!fechada?'18':'08'}, 0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    cursor:'pointer',
                    animation: !isPos && !fechada ? 'metaBreath 3s ease-in-out infinite' : 'none',
                  }}>
                    {/* Top accent — mais grosso e com glow */}
                    <div style={{height:4,background:`linear-gradient(90deg, ${nc.hex}, ${nc.hex}88, ${nc.hex})`, boxShadow:`0 0 12px ${nc.hex}80`}}/>
                    {/* Ambient orb no canto pra metas em prejuizo */}
                    {!isPos && !fechada && (
                      <div style={{ position:'absolute', top:-20, right:-20, width:90, height:90, borderRadius:'50%', background:'radial-gradient(circle, rgba(239,68,68,0.14), transparent 65%)', filter:'blur(14px)', pointerEvents:'none' }}/>
                    )}
                    <div style={{padding:'16px 18px 14px',position:'relative',zIndex:1}}>
                      {/* Status badge */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{
                            fontSize:9, fontWeight:900, letterSpacing:'0.1em',
                            padding:'3px 9px', borderRadius:5,
                            background:`${statusColor}18`, color:statusColor,
                            border:`1px solid ${statusColor}38`,
                            boxShadow: !isPos && !fechada ? `0 0 10px ${statusColor}40` : 'none',
                          }}>
                            {statusLabel}
                          </span>
                          {!isPos && !fechada && (
                            <motion.div
                              animate={{ opacity:[0.5, 1, 0.5] }}
                              transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
                              style={{ fontSize:11, lineHeight:1 }}
                            >
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            </motion.div>
                          )}
                        </div>
                        {isAtiva && (
                          <div style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                            <motion.div
                              animate={{ boxShadow:['0 0 0 0 rgba(0,140,94,0)','0 0 0 5px rgba(0,140,94,0.2)','0 0 0 0 rgba(0,140,94,0)'] }}
                              transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
                              style={{ width:6, height:6, borderRadius:'50%', background:'#008C5E' }}
                            />
                            <span style={{ fontSize:8, color:'#008C5E', fontWeight:700, letterSpacing:'0.06em' }}>LIVE</span>
                          </div>
                        )}
                      </div>
                      {/* Title + rede chip */}
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:nc.hex,boxShadow:`0 0 8px ${nc.hex}90, 0 0 2px ${nc.hex}`,flexShrink:0}}/>
                        <span style={{fontSize:15,fontWeight:900,color:'var(--t1)',letterSpacing:'-0.01em'}}>{totalContas} DEP {m.rede||'—'}</span>
                      </div>
                      {/* Insight */}
                      {insightText && (
                        <p style={{
                          fontSize:10, fontWeight:700, color:insightColor, margin:'3px 0 0', paddingLeft:15,
                          textShadow:`0 0 8px ${insightColor}30`,
                        }}>{insightText}</p>
                      )}
                      <p style={{fontSize:10, color:'var(--t4)', margin:'5px 0 14px', paddingLeft:15, fontFamily:'var(--mono)'}}>{metaDate} · {remDone} remessa{remDone!==1?'s':''}</p>
                      {/* Progress */}
                      <div style={{marginBottom:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                          <span style={{fontSize:9, color:'var(--t4)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase'}}>Progresso</span>
                          <span style={{fontSize:10, fontWeight:700, color:'var(--t2)', fontFamily:'var(--mono)'}}>{depDone}/{totalContas}</span>
                        </div>
                        <div style={{height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(255,255,255,0.04)'}}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${progPct}%` }}
                            transition={{ duration:1, delay:Math.min(i*0.04,0.5)+0.2, ease:[0.4,0,0.2,1] }}
                            style={{ height:'100%', borderRadius:99, background:progColor, boxShadow:`0 0 10px ${statusColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`, position:'relative', overflow:'hidden' }}
                          >
                            {!fechada && <div style={{ position:'absolute',top:0,bottom:0,width:'40%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)',animation:'progShimmer 2s ease-in-out infinite' }}/>}
                          </motion.div>
                        </div>
                      </div>
                      {/* Value — mais dominante pra prejuizo */}
                      <div style={{display:'flex',alignItems:'baseline', justifyContent:'space-between', gap:8}}>
                        <span style={{ fontSize:9, color:'var(--t4)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                          {fechada ? 'Lucro final' : 'Resultado'}
                        </span>
                        <motion.span
                          animate={!isPos && !fechada ? { textShadow:[`0 0 12px rgba(239,68,68,0.25)`, `0 0 24px rgba(239,68,68,0.45)`, `0 0 12px rgba(239,68,68,0.25)`] } : {}}
                          transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
                          style={{
                            fontFamily:'var(--mono)', fontSize:22, fontWeight:900,
                            color:isPos?'#008C5E':'#EF4444',
                            textShadow: isPos ? `0 0 12px rgba(0,140,94,0.2)` : `0 0 16px rgba(239,68,68,0.3)`,
                            letterSpacing:'-0.02em', lineHeight:1,
                          }}>
                          {isPos?'+':'-'}R$ {fmt(Math.abs(displayVal))}
                        </motion.span>
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
                              whileHover={{ scale: 1.1, boxShadow: '0 0 12px rgba(255,255,255,0.3)' }}
                              style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'box-shadow 0.2s' }}>
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
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,rgba(0,140,94,0.15),rgba(255,255,255,0.1))', border:'1px solid var(--profit-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
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
                      display:'flex', alignItems:'center', flexWrap:'wrap', gap:16,
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
                            style={{height:'100%',borderRadius:99,background:isTop?'linear-gradient(90deg,#FFD700,#f5a623)':pos?'linear-gradient(90deg,#008C5E,#4ADE80)':'linear-gradient(90deg,#EF4444,#f87171)'}}/>
                        </div>
                      </div>
                      <span className="t-num" style={{fontSize:isTop?24:20,fontWeight:900,flexShrink:0,color:isTop?'#FFD700':pos?'#008C5E':'#EF4444',textShadow:isTop?'0 0 15px rgba(255,215,0,0.2)':'none'}}>
                        {pos?'+':''}R$ {fmt(r.lucroFinal)}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* ── Rentabilidade por Rede ── */}
            {rentabilidadeRedes.length>0 && (
              <div style={{marginTop:32}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span style={{fontSize:15,fontWeight:800,color:'var(--t1)'}}>Rentabilidade por Rede</span>
                  <span className="t-small" style={{marginLeft:4}}>Lucro por conta (metas fechadas)</span>
                </div>
                <div style={{background:'var(--surface)',border:'1px solid var(--b1)',borderRadius:14,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,fontFamily:'var(--mono)'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid var(--b1)'}}>
                        <th style={{textAlign:'left',padding:'10px 16px',fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>#</th>
                        <th style={{textAlign:'left',padding:'10px 16px',fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Rede</th>
                        <th style={{textAlign:'right',padding:'10px 16px',fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Lucro/conta</th>
                        <th style={{textAlign:'right',padding:'10px 16px',fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentabilidadeRedes.map((r,i)=>{
                        const pos=r.lucroPorConta>=0
                        return(
                          <tr key={r.rede} style={{borderBottom:i<rentabilidadeRedes.length-1?'1px solid var(--b1)':'none'}}>
                            <td style={{padding:'9px 16px',fontWeight:800,color:i===0?'#FFD700':'var(--t3)'}}>{i+1}</td>
                            <td style={{padding:'9px 16px',fontWeight:700,color:'var(--t1)'}}>{r.rede}</td>
                            <td style={{padding:'9px 16px',textAlign:'right',fontWeight:800,color:pos?'#008C5E':'#EF4444'}}>{pos?'+':''}R$ {fmt(r.lucroPorConta)}</td>
                            <td style={{padding:'9px 16px',textAlign:'right',fontWeight:700,color:pos?'var(--profit)':'#EF4444'}}>{pos?'+':''}R$ {fmt(r.lucro)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Performance por Slot ── */}
            {slotRanking.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>Performance por Slot</span>
                  <span className="t-small" style={{ marginLeft: 4 }}>Resultado por conta (min. 2 remessas)</span>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--mono)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--b1)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slot</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remessas</th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Res/conta</th>
                        <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slotRanking.map((s, i) => {
                        const pos = s.perConta >= 0
                        return (
                          <tr key={s.name} style={{ borderBottom: i < slotRanking.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                            <td style={{ padding: '9px 16px', fontWeight: 800, color: i === 0 ? '#FFD700' : 'var(--t3)' }}>{i + 1}</td>
                            <td style={{ padding: '9px 16px', fontWeight: 700, color: 'var(--t1)' }}>{s.name}</td>
                            <td style={{ padding: '9px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--t3)' }}>{s.count}</td>
                            <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 800, color: pos ? '#008C5E' : '#EF4444' }}>{pos ? '+' : ''}R$ {fmt(s.perConta)}</td>
                            <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 700, color: pos ? 'var(--profit)' : '#EF4444' }}>{s.total >= 0 ? '+' : ''}R$ {fmt(s.total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
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
                <h2 className="t-h2" style={{ margin:'0 0 3px' }}>Equipe e Configuracoes</h2>
                <p className="t-small">Operadores, convites e modelo de operacao</p>
              </div>
            </div>

            {/* Operation model selector */}
            <motion.div className="card" style={{ padding: 20, marginBottom: 20 }} {...fadeUp(0)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Modelo de operacao</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'salario_bau', label: 'Salario + Bau', desc: 'Com contrato de plataforma' },
                  { key: 'apenas_bau', label: 'Apenas Bau', desc: 'Sem contrato, lucro so do bau' },
                ].map(opt => {
                  const active = (tenant?.operation_model || 'salario_bau') === opt.key
                  return (
                    <button key={opt.key} onClick={async () => {
                      await supabase.from('tenants').update({ operation_model: opt.key }).eq('id', profile.tenant_id)
                      setTenant(prev => ({ ...prev, operation_model: opt.key }))
                    }} style={{
                      flex: 1, padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(229,57,53,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.05)'}`,
                      textAlign: 'left', transition: 'all 0.2s',
                    }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: active ? '#e53935' : 'var(--t2)', margin: '0 0 3px' }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: active ? 'rgba(229,57,53,0.6)' : 'var(--t4)', margin: 0 }}>{opt.desc}</p>
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {/* Operator payment config */}
            <motion.div className="card" style={{ padding: 20, marginBottom: 20 }} {...fadeUp(0.1)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#008c5e" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Pagamento de operadores</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {[
                  { key: 'fixo_dep', label: 'Fixo por depositante', desc: 'Ex: R$ 2,00 por dep' },
                  { key: 'percentual', label: '% do lucro final', desc: 'Ex: 15% do lucro' },
                ].map(opt => {
                  const active = (tenant?.operator_payment_model || 'fixo_dep') === opt.key
                  return (
                    <button key={opt.key} onClick={async () => {
                      await supabase.from('tenants').update({ operator_payment_model: opt.key }).eq('id', profile.tenant_id)
                      setTenant(prev => ({ ...prev, operator_payment_model: opt.key }))
                    }} style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(0,140,94,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? 'rgba(0,140,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      textAlign: 'left', transition: 'all 0.2s',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: active ? '#008c5e' : 'var(--t2)', margin: '0 0 2px' }}>{opt.label}</p>
                      <p style={{ fontSize: 10, color: active ? 'rgba(0,140,94,0.6)' : 'var(--t4)', margin: 0 }}>{opt.desc}</p>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label className="t-label" style={{ flexShrink: 0 }}>
                  {(tenant?.operator_payment_model || 'fixo_dep') === 'fixo_dep' ? 'Valor por depositante (R$)' : 'Percentual do lucro (%)'}
                </label>
                <input className="input" type="number" step="0.01" min="0"
                  value={tenant?.operator_payment_value ?? 2}
                  onChange={async (e) => {
                    const val = Number(e.target.value)
                    await supabase.from('tenants').update({ operator_payment_value: val }).eq('id', profile.tenant_id)
                    setTenant(prev => ({ ...prev, operator_payment_value: val }))
                  }}
                  style={{ padding: '8px 12px', fontSize: 14, maxWidth: 120 }}
                />
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                  {(tenant?.operator_payment_model || 'fixo_dep') === 'fixo_dep' ? 'por depositante' : '% do lucro'}
                </span>
              </div>
            </motion.div>

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
                          whileHover={{ scale: 1.1, boxShadow: '0 0 12px rgba(255,255,255,0.3)' }}
                          style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'box-shadow 0.2s' }}>
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

            {/* Header da lixeira — area secundaria organizada */}
            <motion.div
              initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
              transition={{duration:0.4}}
              style={{
                position:'relative', overflow:'hidden',
                padding:'20px 24px', borderRadius:16, marginBottom:22,
                background:'linear-gradient(145deg, rgba(14,22,38,0.7), rgba(8,14,26,0.7))',
                backdropFilter:'blur(18px) saturate(150%)', WebkitBackdropFilter:'blur(18px) saturate(150%)',
                border:'1px solid rgba(148,163,184,0.14)',
                boxShadow:'0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}>
              <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)', pointerEvents:'none' }}/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{
                    width:42, height:42, borderRadius:12,
                    background:'rgba(148,163,184,0.08)', border:'1px solid rgba(148,163,184,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.02em' }}>Lixeira</h2>
                      <span style={{ fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:5, background:'rgba(148,163,184,0.1)', color:'#94A3B8', border:'1px solid rgba(148,163,184,0.2)', letterSpacing:'0.08em' }}>AREA SECUNDARIA</span>
                    </div>
                    <p style={{ fontSize:12, color:'var(--t3)', margin:'3px 0 0', fontWeight:500 }}>Metas excluidas · restaurar ou remover permanentemente</p>
                  </div>
                </div>
                {trashMetas.length > 0 && (
                  <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
                    <span style={{ fontSize:24, fontWeight:900, color:'var(--t1)', fontFamily:'var(--mono)', letterSpacing:'-0.02em' }}>{trashMetas.length}</span>
                    <span style={{ fontSize:11, color:'var(--t4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>item{trashMetas.length>1?'s':''}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {trashMetas.length === 0 ? (
              <motion.div
                initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}}
                transition={{duration:0.4}}
                style={{
                  borderRadius:18, padding:'56px 32px', textAlign:'center',
                  background:'linear-gradient(145deg, rgba(14,22,38,0.4), rgba(8,14,26,0.4))',
                  backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
                  border:'1px dashed rgba(148,163,184,0.18)',
                }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'rgba(148,163,184,0.06)', border:'1px solid rgba(148,163,184,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ color:'var(--t1)', fontSize:15, fontWeight:700, marginBottom:5 }}>Lixeira vazia</p>
                <p style={{ color:'var(--t3)', fontSize:12 }}>Nenhuma meta excluida no momento.</p>
              </motion.div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {trashMetas.map((m, i) => {
                  const op = operators.find(o => o.id === m.operator_id)
                  const mRem = remessas.filter(r => r.meta_id === m.id)
                  const liq = mRem.reduce((a, r) => a + Number(r.lucro || 0) - Number(r.prejuizo || 0), 0)
                  const deletedDate = m.deleted_at ? new Date(m.deleted_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : ''
                  return (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease }}
                      whileHover={{ x:4, borderColor:'rgba(148,163,184,0.25)', transition:{duration:0.2} }}
                      style={{
                        position:'relative', overflow:'hidden',
                        padding:'16px 20px', borderRadius:14,
                        background:'linear-gradient(145deg, rgba(14,22,38,0.55), rgba(8,14,26,0.55))',
                        backdropFilter:'blur(14px) saturate(140%)', WebkitBackdropFilter:'blur(14px) saturate(140%)',
                        border:'1px solid rgba(148,163,184,0.12)',
                        display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
                        boxShadow:'0 3px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.02)',
                      }}
                    >
                      {/* Accent bar esquerdo cinza */}
                      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:'rgba(148,163,184,0.3)' }}/>

                      {/* Icon com iniciais da rede */}
                      <div style={{
                        width:40, height:40, borderRadius:11, flexShrink:0,
                        background:'rgba(148,163,184,0.08)', border:'1px solid rgba(148,163,184,0.18)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--mono)', fontSize:10, fontWeight:800, color:'#94A3B8',
                      }}>
                        {(m.rede || '—').toString().slice(0,4)}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:180 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                          <span style={{ fontSize:14, fontWeight:800, color:'var(--t2)', letterSpacing:'-0.01em' }}>{m.titulo}</span>
                          <span style={{ fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:5, background:'rgba(239,68,68,0.08)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.18)', letterSpacing:'0.06em', textTransform:'uppercase' }}>Excluida</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                          <span style={{ fontSize:11, color:'var(--t3)', fontWeight:600 }}>{getName(op)}</span>
                          <span style={{ fontSize:10, color:'var(--t4)' }}>·</span>
                          <span style={{ fontSize:11, color:'var(--t4)', fontFamily:'var(--mono)' }}>{mRem.length} remessa{mRem.length!==1?'s':''}</span>
                          <span style={{ fontSize:10, color:'var(--t4)' }}>·</span>
                          <span style={{ fontSize:11, color: liq >= 0 ? '#008C5E' : '#EF4444', fontFamily:'var(--mono)', fontWeight:700 }}>
                            {liq >= 0 ? '+' : ''}R$ {fmt(liq)}
                          </span>
                        </div>
                        <p style={{ fontSize:10, color:'var(--t4)', margin:'4px 0 0', fontFamily:'var(--mono)' }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ display:'inline', verticalAlign:'middle', marginRight:4, marginTop:-2 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Excluida em {deletedDate}
                        </p>
                      </div>

                      {/* Actions — contraste claro entre Restaurar (primario verde) e Excluir (secundario perigo) */}
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <motion.button
                          whileHover={{ scale:1.04, boxShadow:'0 6px 18px rgba(0,140,94,0.35)' }}
                          whileTap={{ scale:0.95 }}
                          onClick={async () => {
                            await fetch('/api/meta/restore', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ meta_id:m.id }) })
                            loadAll()
                          }}
                          style={{
                            padding:'9px 16px', borderRadius:10, border:'none', cursor:'pointer',
                            fontSize:12, fontWeight:800, fontFamily:'inherit', color:'#fff',
                            background:'linear-gradient(145deg, #008C5E, #00a06d)',
                            boxShadow:'0 4px 14px rgba(0,140,94,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
                            display:'flex', alignItems:'center', gap:6,
                          }}
                        >
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                          Restaurar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale:1.04, background:'rgba(239,68,68,0.14)', borderColor:'rgba(239,68,68,0.4)' }}
                          whileTap={{ scale:0.95 }}
                          onClick={async () => {
                            if (!confirm('Excluir PERMANENTEMENTE esta meta e todas as remessas? Esta acao nao pode ser desfeita.')) return
                            await fetch('/api/meta/purge', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ meta_id:m.id }) })
                            loadAll()
                          }}
                          style={{
                            padding:'9px 14px', borderRadius:10, cursor:'pointer',
                            fontSize:12, fontWeight:700, fontFamily:'inherit', color:'#EF4444',
                            background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.22)',
                            display:'flex', alignItems:'center', gap:6,
                            transition:'all 0.2s',
                          }}
                          title="Excluir permanentemente"
                        >
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
            background:notification.pos?'rgba(0,140,94,0.12)':'rgba(239,68,68,0.12)',
            border:`1px solid ${notification.pos?'rgba(0,140,94,0.25)':'rgba(239,68,68,0.25)'}`,
            backdropFilter:'blur(20px)',
            boxShadow:`0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${notification.pos?'rgba(0,140,94,0.1)':'rgba(239,68,68,0.1)'}`,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.2))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:13,fontWeight:800,color:'white'}}>{notification.op[0]?.toUpperCase()}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{notification.op}</span>
                {notification.rede && <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:5,background:'rgba(255,255,255,0.12)',color:'var(--brand-bright)'}}>{notification.rede}</span>}
              </div>
              <p style={{fontSize:11,color:'var(--t3)',margin:0}}>Nova remessa registrada</p>
            </div>
            <span className="t-num" style={{fontSize:16,fontWeight:800,color:notification.pos?'var(--profit)':'var(--loss)',flexShrink:0}}>
              {notification.pos?'+':'-'}R$ {fmt(notification.val)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      </AppLayout>
    </main>
  )
}

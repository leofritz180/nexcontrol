'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
// Modal de detalhe da meta — réplica do modal de gestão do /admin
// (info, KPIs, remessas, timeline, salário/custos). Usado no painel
// do operador líder (/equipe). Fechamento via /api/meta/update-costs.
// ─────────────────────────────────────────────────────────────

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const fmtDate = d => d ? new Date(d).toLocaleString('pt-BR') : '—'
const ease = [0.33,1,0.68,1]

function SalaryPanel({ meta, liqCalc, tenantOpModel, leaderId, onSaved }) {
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
    setSalario(String(meta.salario ?? '')); setBauVal(String(meta.bau ?? ''))
    setCusto(String(meta.custo_fixo ?? '')); setTaxa(String(meta.taxa_agente ?? ''))
  }, [meta.id])

  const sal = Number(salario || 0), bv = Number(bauVal || 0), cst = Number(custo || 0), tax = Number(taxa || 0)
  const newLucro = liqCalc + sal + bv - cst - tax

  async function save() {
    if (saving) return
    setSaving(true)
    const needsClose = isFinalizedNotClosed && !fechada
    const newLucroRounded = Number(newLucro.toFixed(2))
    await fetch('/api/meta/update-costs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_id: meta.id, salario: sal, bau: bv, custo_fixo: cst, taxa_agente: tax,
        close: needsClose, lucro_final: (needsClose || fechada) ? newLucroRounded : undefined,
        update_lucro_only: fechada,
      }),
    })
    setSaving(false)
    onSaved()
  }

  const lbl = { display: 'block', marginBottom: 6, fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em' }
  const inp = { width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontFamily: 'inherit' }

  return (
    <div style={{ marginTop: 20, padding: '20px 22px', background: 'var(--surface, #0c1322)', border: `1px solid ${fechada ? 'var(--b1)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{apenasBau ? 'Baú e custos' : 'Salário e custos'}</span>
        {isActive && <span style={{ fontSize: 11, color: 'var(--t4)', marginLeft: 4 }}>Pré-configure para fechamento automático</span>}
        {isFinalizedNotClosed && <span style={{ fontSize: 10, fontWeight: 600, color: '#ffd166', marginLeft: 4 }}>Operador finalizou — defina valores e feche</span>}
        {fechada && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--profit, #10b981)', marginLeft: 4 }}>Meta fechada — ajuste se necessário</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: apenasBau ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        {!apenasBau && (<div><label style={lbl}>Salário (R$)</label><input type="number" step="0.01" min="0" value={salario} onChange={e => setSalario(e.target.value)} placeholder="0,00" style={inp}/></div>)}
        <div><label style={lbl}>Baú (R$)</label><input type="number" step="0.01" min="0" value={bauVal} onChange={e => setBauVal(e.target.value)} placeholder="0,00" style={inp}/></div>
        <div><label style={lbl}>Custo fixo (R$)</label><input type="number" step="0.01" min="0" value={custo} onChange={e => setCusto(e.target.value)} placeholder="0,00" style={inp}/></div>
        {!apenasBau && (<div><label style={lbl}>Taxa agente (R$)</label><input type="number" step="0.01" min="0" value={taxa} onChange={e => setTaxa(e.target.value)} placeholder="0,00" style={inp}/></div>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '14px 16px', borderRadius: 12, background: newLucro >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${newLucro >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Lucro final</span>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--t4)' }}>
            {apenasBau ? `Resultado (${fmt(liqCalc)}) + Baú (${fmt(bv)}) - Custo (${fmt(cst)})` : `Resultado (${fmt(liqCalc)}) + Sal (${fmt(sal)}) + Baú (${fmt(bv)}) - Custo (${fmt(cst)}) - Taxa (${fmt(tax)})`}
          </p>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: newLucro >= 0 ? 'var(--profit, #10b981)' : 'var(--loss, #ef4444)', flexShrink: 0, fontFamily: 'var(--mono, monospace)' }}>
          {newLucro >= 0 ? '+' : ''}R$ {fmt(newLucro)}
        </span>
      </div>
      <button type="button" onClick={save} disabled={saving}
        style={{ width: '100%', padding: '12px', borderRadius: 11, border: 'none', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff', background: isFinalizedNotClosed ? 'linear-gradient(180deg, var(--profit, #10b981), #00a06d)' : 'linear-gradient(180deg, #ef4444, #c62828)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        {saving ? 'Salvando...' : isActive ? 'Salvar configuração' : isFinalizedNotClosed ? 'Salvar e fechar meta' : 'Salvar ajustes'}
      </button>
    </div>
  )
}

export default function MetaDetailModal({ meta, remessas = [], logs = [], operators = [], tenantOpModel, leaderId, loading, isOwnMeta, onClose, onRefresh, onDeleted, onOperate }) {
  if (!meta) return null
  const op = operators.find(o => o.id === meta.operator_id)
  const fechada = meta.status_fechamento === 'fechada'
  const finalizada = meta.status === 'finalizada'
  const lucroR = remessas.reduce((a,r)=>a+Number(r.lucro||0),0)
  const prejR = remessas.reduce((a,r)=>a+Number(r.prejuizo||0),0)
  const depR = remessas.reduce((a,r)=>a+Number(r.deposito||0),0)
  const saqR = remessas.reduce((a,r)=>a+Number(r.saque||0),0)
  const liqR = lucroR - prejR
  const pct = remessas.length > 0 ? Math.round((remessas.filter(r=>Number(r.resultado||0)>=0).length/remessas.length)*100) : 0
  const displayVal = fechada && meta.lucro_final != null ? Number(meta.lucro_final) : liqR

  async function delMeta() {
    if (!confirm('Tem certeza que deseja EXCLUIR esta meta e todas as remessas? Esta ação não pode ser desfeita.')) return
    await fetch('/api/meta/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meta_id: meta.id }) })
    if (onDeleted) onDeleted()
  }
  async function delRemessa(rid) {
    if (!confirm('Excluir esta remessa?')) return
    await fetch('/api/remessa/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remessa_id: rid }) })
    if (onRefresh) onRefresh()
  }

  const card = { background: 'var(--surface, #0c1322)', border: '1px solid var(--b1)', borderRadius: 14 }
  const infoCards = [
    { l: 'Rede', v: meta.rede || '—', c: '#ff6b6b' },
    { l: 'Plataforma', v: meta.plataforma || '—', c: 'var(--t1)' },
    { l: 'Operador', v: getName(op), c: '#7aa2ff' },
    { l: 'Contas', v: meta.quantidade_contas || 0, c: '#ffd166' },
  ]
  const kpis = [
    { l: 'Remessas', v: remessas.length, c: '#7aa2ff' },
    { l: 'Depósito total', v: `R$ ${fmt(depR)}`, c: 'rgba(255,255,255,0.78)' },
    { l: 'Saque total', v: `R$ ${fmt(saqR)}`, c: 'rgba(255,255,255,0.78)' },
    { l: 'Lucro', v: `R$ ${fmt(lucroR)}`, c: 'var(--profit, #10b981)' },
    { l: 'Prejuízo', v: `R$ ${fmt(prejR)}`, c: 'var(--loss, #ef4444)' },
    { l: 'Acerto', v: `${pct}%`, c: pct >= 50 ? 'var(--profit, #10b981)' : '#ffd166' },
    { l: fechada ? 'LUCRO FINAL' : 'Líquido', v: `${displayVal>=0?'+':'-'}R$ ${fmt(Math.abs(displayVal))}`, c: displayVal>=0?'var(--profit, #10b981)':'var(--loss, #ef4444)', big: true },
  ]
  const iconMap = { meta_created:'plus', meta_finalized:'flag', meta_closed:'check', meta_status_changed:'refresh', meta_reactivated:'refresh', remessa_created:'dollar', remessa_edited:'flag' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(4,8,16,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3, ease }} style={{ width: '100%', maxWidth: 900 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>{meta.titulo}</h2>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', background: fechada?'rgba(16,185,129,0.15)':finalizada?'rgba(239,68,68,0.1)':'rgba(255,255,255,0.1)', border: `1px solid ${fechada?'rgba(16,185,129,0.3)':finalizada?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.2)'}`, color: fechada?'var(--profit, #10b981)':finalizada?'var(--loss, #ef4444)':'#7aa2ff' }}>
              {fechada?'CONCLUÍDA':finalizada?'Finalizada':'Ativa'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isOwnMeta && onOperate && !fechada && (
              <button type="button" onClick={onOperate} title="Operar (lançar remessa)" style={{ padding: '0 14px', height: 36, borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.12)', color: '#ffb3b3', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}>Operar</button>
            )}
            <button type="button" onClick={delMeta} title="Excluir meta" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--loss, #ef4444)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--b2, rgba(255,255,255,0.14))', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 18 }}>
          {infoCards.map(({l,v,c}) => (
            <div key={l} style={{ ...card, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: c, margin: 0, fontFamily: typeof v === 'number' ? 'var(--mono, monospace)' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</p>
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 18 }}>
          {kpis.map(({l,v,c,big}) => (
            <div key={l} style={{ ...card, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</p>
              <p style={{ fontSize: big ? 22 : 16, fontWeight: 800, color: c, margin: 0, fontFamily: 'var(--mono, monospace)' }}>{v}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            {/* Remessas */}
            <div style={{ ...card, padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: '0 0 14px' }}>Remessas ({remessas.length})</h3>
              {remessas.length === 0 ? (
                <p style={{ textAlign: 'center', padding: 24, fontSize: 12.5, color: 'var(--t3)' }}>Nenhuma remessa registrada.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                  {[...remessas].reverse().map((r, i) => {
                    const pos = Number(r.resultado||0) >= 0
                    const isLatest = i === 0
                    return (
                      <div key={r.id} style={{ padding: '12px 14px', borderRadius: 12, background: isLatest?(pos?'rgba(16,185,129,0.06)':'rgba(239,68,68,0.06)'):'rgba(255,255,255,0.03)', border: `1px solid ${isLatest?(pos?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.12)'):'var(--b1)'}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: pos?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', border: `1px solid ${pos?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={pos?'var(--profit, #10b981)':'var(--loss, #ef4444)'} strokeWidth="3" strokeLinecap="round"><polyline points={pos?'18 15 12 9 6 15':'6 9 12 15 18 9'}/></svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titulo || `Remessa ${remessas.length-i}`}</p>
                            {isLatest && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: pos?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.12)', color: pos?'var(--profit, #10b981)':'var(--loss, #ef4444)' }}>{pos?'LUCRO':'PREJUÍZO'}</span>}
                            {r.slot_name && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#7aa2ff' }}>{r.slot_name}</span>}
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{r.tipo} · D: R$ {fmt(r.deposito)} · S: R$ {fmt(r.saque)}</p>
                        </div>
                        <p style={{ fontSize: isLatest?16:14, fontWeight: 800, color: pos?'var(--profit, #10b981)':'var(--loss, #ef4444)', flexShrink: 0, fontFamily: 'var(--mono, monospace)' }}>{pos?'+':'-'}R$ {fmt(Math.abs(Number(r.resultado||0)))}</p>
                        <button type="button" onClick={() => delRemessa(r.id)} title="Excluir remessa" style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: 0.6 }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--loss, #ef4444)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                        </button>
                        </div>
                        {(() => {
                          const fotos = (Array.isArray(r.comprovantes) && r.comprovantes.length) ? r.comprovantes : (r.comprovante_url ? [r.comprovante_url] : [])
                          if (!fotos.length) return null
                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 40 }}>
                              {fotos.map((url, fi) => (
                                <a key={fi} href={url} target="_blank" rel="noreferrer" title={`Comprovante ${fi+1}`}>
                                  <img src={url} alt={`comprovante ${fi+1}`} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--b2, rgba(255,255,255,0.14))', display: 'block' }}/>
                                </a>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ ...card, padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: '0 0 14px' }}>Timeline</h3>
              {logs.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px 16px', fontSize: 12, color: 'var(--t3)' }}>Sem eventos ainda. As ações do operador aparecem aqui.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 400, overflowY: 'auto' }}>
                  {logs.map((log, i) => {
                    const logOp = operators.find(o => o.id === log.operator_id)
                    const ic = iconMap[log.action] || 'circle'
                    const lc = log.action==='meta_closed'?'var(--profit, #10b981)':log.action==='remessa_created'?'#7aa2ff':log.action==='meta_created'?'#ff6b6b':'#ffd166'
                    return (
                      <div key={log.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
                        {i < logs.length-1 && <div style={{ position: 'absolute', left: 13, top: 28, bottom: 0, width: 1, background: 'var(--b1)' }}/>}
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${lc}22`, border: `1px solid ${lc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={lc} strokeWidth="2.5" strokeLinecap="round">
                            {ic==='plus'?<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>:ic==='check'?<polyline points="20 6 9 17 4 12"/>:ic==='dollar'?<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>:ic==='flag'?<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>:<circle cx="12" cy="12" r="4"/>}
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', margin: '0 0 2px' }}>{log.description}</p>
                          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>{getName(logOp)} · {fmtDate(log.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Salário/custos */}
        <SalaryPanel meta={meta} liqCalc={liqR} tenantOpModel={tenantOpModel} leaderId={leaderId} onSaved={onRefresh} />

        {/* Footer */}
        <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--b1)' }}>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>Criada em {fmtDate(meta.created_at)}{meta.fechada_em ? ` · Fechada em ${fmtDate(meta.fechada_em)}` : ''}{meta.observacoes ? ` · ${meta.observacoes}` : ''}</p>
        </div>
      </motion.div>
    </div>
  )
}

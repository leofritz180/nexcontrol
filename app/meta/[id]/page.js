'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '../../../components/AppLayout'
import BettifySponsor from '../../../components/BettifySponsor'
import { supabase } from '../../../lib/supabase/client'
import { notifyRemessaCreated } from '../../../lib/notify'
import { evaluateAfterRemessa, evaluateOnLoad } from '../../../lib/insights-engine'
import { ContaMaeView } from '../../../components/ContaMaeCard'
import { SLOTS } from '../../../lib/slots-data'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'

// EQUIPES / OPERADOR LÍDER — exclusivo DS MENTORIA 2.0
const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'

// Comprovante: normaliza (string antiga OU objeto {url,ts,burned}) e formata data/hora BRT
const normFoto = it => (typeof it === 'string' ? { url: it, ts: null } : (it || {}))
const fmtFotoTs = ts => { try { return new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) } catch { return '' } }

// Desenha a data/hora (vermelho, canto inferior esquerdo) DENTRO da imagem,
// no NAVEGADOR (canvas) — fonte sempre disponível, tamanho controlado.
// Retorna { file, ts, burned }. Em falha, devolve o arquivo original.
function rRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
async function burnTimestamp(file) {
  const tsIso = new Date().toISOString()
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file) })
    const maxDim = 1600
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(img.src)
    const label = new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })
    const fs = Math.max(13, Math.round(Math.min(w, h) * 0.04))
    ctx.font = `700 ${fs}px Arial, sans-serif`
    const tw = ctx.measureText(label).width
    const padX = Math.round(fs * 0.5), padY = Math.round(fs * 0.4)
    const bw = Math.round(tw + padX * 2), bh = Math.round(fs + padY * 2)
    const margin = Math.max(8, Math.round(w * 0.015))
    const bx = margin, by = h - bh - margin
    ctx.fillStyle = 'rgba(229,57,53,0.92)'
    rRect(ctx, bx, by, bw, bh, Math.round(fs * 0.3)); ctx.fill()
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'
    ctx.fillText(label, bx + padX, by + bh / 2 + 1)
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9))
    if (!blob) return { file, ts: tsIso, burned: false }
    return { file: new File([blob], 'comprovante.jpg', { type: 'image/jpeg' }), ts: tsIso, burned: true }
  } catch { return { file, ts: tsIso, burned: false } }
}
// Líder só gerencia metas criadas a partir da CRIAÇÃO DA CONTA dele (por líder)

// Slug do slot p/ a imagem em /slots/{slug}.webp
const slotSlug = name => String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/&/g,'e').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
// Jogos preferidos (aparecem primeiro quando o tenant nao tem favoritos)
const SLOT_PREFERRED = ['Gem Saviour', 'Piggy Gold', 'Fortune Dragon', 'Mr Hallow']
// Catalogo completo ordenado: preferidos primeiro, depois o resto
const SLOT_CATALOG = (() => {
  const byName = {}
  SLOTS.forEach(s => { byName[s.name] = { name: s.name, image: s.image, provider: s.provider, performance: s.performance } })
  const names = SLOTS.map(s => s.name)
  const ordered = [...SLOT_PREFERRED.filter(n => byName[n]), ...names.filter(n => !SLOT_PREFERRED.includes(n))]
  return ordered.map(n => byName[n]).filter(Boolean)
})()

function AdminCloseModal({ meta, lucroAcum, prejAcum, liqAcum, bauAcumRemessas = 0, tenantOpModel = 'salario_bau', onClose, onSaved }) {
  // Em metas apenas_bau o BAU ja foi registrado por remessa (entrou em lucro/prejuizo).
  // Hide o campo BAU no fechamento pra nao contar duas vezes.
  const isApenasBau = (meta?.operation_model||tenantOpModel||'salario_bau') === 'apenas_bau'
  const [salPlat, setSalPlat] = useState(String(meta.salario_plataforma||''))
  const [bau, setBau] = useState(isApenasBau ? '0' : String(meta.bau||''))
  const [gastos, setGastos] = useState(String(meta.gastos_operacionais||''))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const salP = Number(salPlat||0), bauV = isApenasBau ? 0 : Number(bau||0), gastosV = Number(gastos||0)
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
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,background:'var(--surface)',borderRadius:24,border:'1px solid rgba(255,255,255,0.2)',boxShadow:'0 40px 80px rgba(0,0,0,0.6)',animation:'scale-in 0.3s cubic-bezier(0.33,1,0.68,1) both',overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'24px 28px',background:'linear-gradient(135deg,rgba(255,255,255,0.1),transparent)',borderBottom:'1px solid var(--b1)'}}>
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
            {isApenasBau ? (
              <div style={{padding:'10px 12px',borderRadius:10,background:'rgba(209,250,229,0.06)',border:'1px solid rgba(209,250,229,0.18)'}}>
                <p className="t-label" style={{display:'block',marginBottom:4,color:'var(--profit)'}}>BAU acumulado nas remessas</p>
                <p className="t-num" style={{fontSize:14,fontWeight:700,color:'var(--profit)',margin:0}}>R$ {fmt(bauAcumRemessas)} <span style={{fontSize:10,fontWeight:500,color:'var(--t4)',marginLeft:6}}>ja contabilizado em lucro/prejuizo por remessa</span></p>
              </div>
            ) : (
              <div>
                <label className="t-label" style={{display:'block',marginBottom:6}}>BAU (R$) <span style={{color:'var(--profit)',fontWeight:400}}>+ lucro</span></label>
                <input className="input" type="number" step="0.01" min="0" value={bau} onChange={e=>setBau(e.target.value)} placeholder="0,00"/>
              </div>
            )}
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

const REDES_LIST = ['WE','W1','VOY','91','DZ','A8','OKOK','ANJO','XW','EK','DY','777','888','WP','BRA','GAME','ALFA','KK','MK','M9','KF','PU','COROA','MANGA','AA','FP']

function EditMetaModal({ meta, userId, onClose, onSaved, contasMinimo }) {
  const [titulo, setTitulo] = useState(meta.titulo || '')
  const [rede, setRede] = useState(meta.rede || '')
  const [plataforma, setPlataforma] = useState(meta.plataforma || '')
  const [contas, setContas] = useState(String(meta.quantidade_contas || ''))
  const [obs, setObs] = useState(meta.observacoes || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Valida e pede confirmacao antes de gravar (deseja confirmar essa operacao?)
  function requestSave() {
    const nContas = Math.floor(Number(contas || 0))
    if (!titulo.trim()) { setErr('Titulo obrigatorio'); return }
    if (!rede.trim()) { setErr('Rede obrigatoria'); return }
    if (!Number.isFinite(nContas) || nContas < 1) { setErr('Quantidade de contas invalida'); return }
    if (contasMinimo != null && nContas < contasMinimo) {
      setErr(`Ja existem ${contasMinimo} contas processadas — nao e possivel reduzir abaixo disso`)
      return
    }
    setErr(''); setConfirming(true)
  }

  async function save() {
    if (saving) return
    const nContas = Math.floor(Number(contas || 0))
    if (!titulo.trim()) { setErr('Titulo obrigatorio'); return }
    if (!rede.trim()) { setErr('Rede obrigatoria'); return }
    if (!Number.isFinite(nContas) || nContas < 1) { setErr('Quantidade de contas invalida'); return }
    if (contasMinimo != null && nContas < contasMinimo) {
      setErr(`Ja existem ${contasMinimo} contas processadas — nao e possivel reduzir abaixo disso`)
      return
    }
    setSaving(true); setErr('')
    const res = await fetch('/api/meta/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta_id: meta.id, user_id: userId,
        titulo: titulo.trim(), rede: rede.trim().toUpperCase(),
        plataforma: plataforma.trim(), quantidade_contas: nContas,
        observacoes: obs.trim() || null,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || json.error) { setErr(json.error || 'Falha ao salvar'); return }
    onSaved(json.meta || null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(4,8,16,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.28, ease: [0.33,1,0.68,1] }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}
      >
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: '0 0 2px' }}>Editar meta</h3>
              <p className="t-small" style={{ margin: 0 }}>Alteracoes aparecem em todos os calculos e no histórico</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Titulo</label>
            <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: 30 DEP W1" />
          </div>
          <div className="g-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Rede</label>
              <select className="input" value={rede} onChange={e => setRede(e.target.value)}>
                <option value="">Selecione...</option>
                {REDES_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Quantidade de contas</label>
              <input className="input" type="number" min="1" step="1" value={contas} onChange={e => setContas(e.target.value)} />
              {contasMinimo > 0 && (
                <p className="t-small" style={{ margin: '4px 0 0', color: 'var(--t4)', fontSize: 10 }}>Minimo permitido: {contasMinimo} (ja processadas)</p>
              )}
            </div>
          </div>
          <div>
            <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Plataforma</label>
            <input className="input" value={plataforma} onChange={e => setPlataforma(e.target.value)} placeholder="Ex: BetFury" />
          </div>
          <div>
            <label className="t-label" style={{ display: 'block', marginBottom: 6 }}>Observacoes</label>
            <textarea className="input" value={obs} onChange={e => setObs(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
          </div>

          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#fca5a5' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {err}
            </div>
          )}

          {!confirming ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
              <motion.button
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                onClick={requestSave} className="btn btn-profit" style={{ flex: 2 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Salvar alteracoes
              </motion.button>
            </div>
          ) : (
            <div style={{ marginTop: 4, padding: '14px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.28)' }}>
              <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 4px' }}>Deseja confirmar essa operacao?</p>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '0 0 12px', lineHeight: 1.5 }}>As alteracoes de <b style={{ color: 'var(--t2)' }}>titulo</b> e <b style={{ color: 'var(--t2)' }}>numero de contas</b> entram em todos os calculos e no historico da meta.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirming(false)} disabled={saving} className="btn btn-ghost" style={{ flex: 1 }}>Voltar</button>
                <motion.button
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  onClick={save} disabled={saving} className="btn btn-profit" style={{ flex: 2 }}>
                  {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#012b1c' }}/> Salvando...</> : (<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Confirmar operacao</>)}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function KPI({ label, value, color, small=false, accent }) {
  const accentC = accent || color
  return (
    <motion.div
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.35, ease:[0.33,1,0.68,1] }}
      whileHover={{ y:-3, boxShadow:`0 10px 28px rgba(0,0,0,0.4), 0 0 20px ${accentC}15`, borderColor:`${accentC}30`, transition:{ duration:0.15 } }}
      style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(180deg, var(--raised), var(--surface))',
        backdropFilter:'blur(16px) saturate(150%)', WebkitBackdropFilter:'blur(16px) saturate(150%)',
        border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:14, padding:small?'12px 14px':'18px 20px',
        boxShadow:'0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
        cursor:'default', transition:'all 0.25s ease',
      }}>
      {/* Accent line */}
      <div style={{ position:'absolute', left:0, top:'22%', bottom:'22%', width:2, borderRadius:'0 2px 2px 0', background:accentC, boxShadow:`0 0 8px ${accentC}` }}/>
      <p className="t-label" style={{ marginBottom:8 }}>{label}</p>
      <p className="t-num" style={{ fontSize:small?16:22, fontWeight:800, color, letterSpacing:'-0.02em', margin:0 }}>{value}</p>
    </motion.div>
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
  const [bauR,    setBauR]    = useState('')
  const [showAdminClose, setShowAdminClose] = useState(false)
  // EQUIPES: líder da DS MENTORIA agindo como admin nas metas da SUA equipe
  const [leaderAllowed, setLeaderAllowed] = useState(false)
  const [showFinalePopup, setShowFinalePopup] = useState(false)
  const [netShareState, setNetShareState] = useState('idle') // idle | sharing | done — compartilhar resultado no Network
  const [saq,     setSaq]     = useState('')
  const [statusProb, setStatusProb] = useState('normal')
  const [editRem, setEditRem] = useState(null)
  const [editDep, setEditDep] = useState('')
  const [editSaq, setEditSaq] = useState('')
  const [editBau, setEditBau] = useState('')
  const [editContas, setEditContas] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [contasRemessa, setContasRemessa] = useState('')
  const [obsRemessa, setObsRemessa] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [tenantSlots, setTenantSlots] = useState([])
  const [tenantOpModel, setTenantOpModel] = useState('salario_bau')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  // Comprovantes (fotos dos saques) da remessa — VÁRIOS por remessa
  const [comprovantes, setComprovantes] = useState([])
  const [comprovanteUp, setComprovanteUp] = useState(false)
  const [comprovanteErr, setComprovanteErr] = useState('')

  async function uploadComprovante(file) {
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) { setComprovanteErr('Selecione uma imagem.'); return }
    setComprovanteUp(true); setComprovanteErr('')
    try {
      const stamped = await burnTimestamp(file) // grava data/hora dentro da imagem (canvas)
      const fd = new FormData()
      fd.append('foto', stamped.file)
      fd.append('meta_id', String(id))
      const res = await fetch('/api/remessa/upload-comprovante', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.url) { setComprovanteErr(json.error || 'Falha no upload'); setComprovanteUp(false); return }
      setComprovantes(prev => [...prev, { url: json.url, ts: stamped.ts, burned: stamped.burned }]) // ANEXA (vários); carimbo já está na imagem
    } catch (e) { setComprovanteErr(e.message) }
    setComprovanteUp(false)
  }
  // Colar (Ctrl+V) — anexa cada imagem colada
  function onPasteComprovante(e) {
    const items = e.clipboardData?.items || []
    for (const it of items) {
      if (it.type && it.type.startsWith('image/')) {
        const f = it.getAsFile()
        if (f) { e.preventDefault(); uploadComprovante(f) }
      }
    }
  }

  useEffect(()=>{ if(id) fetchData() },[id])

  async function fetchData() {
    setLoading(true)
    const { data:s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data:p } = await supabase.from('profiles').select('*').eq('id',u.id).maybeSingle()
    setProfile(p)
    const tid = p?.tenant_id
    const [{ data:m },{ data:r },{ data:tenantData }] = await Promise.all([
      supabase.from('metas').select('*').eq('id',id).single(),
      supabase.from('remessas').select('*').eq('meta_id',id).order('created_at',{ascending:true}),
      tid ? supabase.from('tenants').select('*').eq('id', tid).maybeSingle() : Promise.resolve({ data: null }),
    ])
    // EQUIPES (DS MENTORIA): líder pode agir como admin nas metas dos operadores
    // da SUA equipe (ou nas próprias). Gate triplo: flag líder + tenant DS + mesma equipe.
    let leaderOk = false
    const metaRecente = m && m.created_at && p?.created_at && new Date(m.created_at) >= new Date(p.created_at)
    if (p?.is_team_leader === true && p?.tenant_id === DS_MENTORIA_TENANT && p?.team && m && m.tenant_id === p.tenant_id && metaRecente) {
      if (m.operator_id === u.id) {
        leaderOk = true
      } else {
        const { data: opProf } = await supabase.from('profiles').select('team').eq('id', m.operator_id).maybeSingle()
        leaderOk = !!opProf && opProf.team === p.team
      }
    }
    setLeaderAllowed(leaderOk)

    // Admin vê todas as metas do tenant; operador só as próprias; líder só as da equipe
    if (m && m.operator_id !== u.id && p?.role !== 'admin' && !leaderOk) {
      const home = (p?.is_team_leader && p?.tenant_id === DS_MENTORIA_TENANT) ? '/equipe' : '/operator'
      router.push(home); return
    }
    setMeta(m||null); setRemessas(r||[])
    const slots = tenantData?.favorite_slots
    setTenantSlots(Array.isArray(slots) ? slots : [])
    setTenantOpModel(tenantData?.operation_model || 'salario_bau')
    setLoading(false)
    // Insight: meta parada
    if (m && r && u) evaluateOnLoad({ remessas: r, meta: m, userId: u.id })
  }

  // Refresh rapido — so recarrega remessas (sem auth/profile)
  async function refreshRemessas() {
    const { data: r } = await supabase.from('remessas').select('*').eq('meta_id', id).order('created_at', { ascending: true })
    if (r) setRemessas(r)
  }

  // ── Deletar remessa ──
  async function deleteRemessa(remId) {
    if (!confirm('Tem certeza que deseja excluir esta remessa?')) return
    const rem = remessas.find(r => r.id === remId)
    await supabase.from('remessas').delete().eq('id', remId)
    // Log
    fetch('/api/meta/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      meta_id: meta?.id, user_id: user?.id, tenant_id: meta?.tenant_id || profile?.tenant_id,
      action: 'remessa_deleted',
      description: `${getName(profile)} excluiu remessa "${rem?.titulo || 'Remessa'}" (R$ ${fmt(Math.abs(Number(rem?.resultado || 0)))})`,
    })}).catch(() => {})
    await refreshRemessas()
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

    // Faixas por RESULTADO POR CONTA (definidas pelo dono):
    //   lucro            -> muito bom, parabens
    //   preju ate 2/c    -> mandou bem, prejuizo baixo
    //   preju 2-4/c      -> leve oscilada, dentro do esperado
    //   preju 4-6/c      -> comecando a oscilar demais, analisar
    //   preju 6-8/c      -> oscilando demais, atencao redobrada
    //   preju 8-10/c     -> ruim, ja comeca a levar pro prejuizo
    //   preju > 10/c     -> ja e prejuizo
    const absPer = Math.abs(perConta)
    const rnd = a => a[Math.floor(Math.random() * a.length)]
    const tag = `R$ ${fmt(Math.abs(diff))} (R$ ${fmt(absPer)}/conta)`
    // Admin que opera nao deve ler "avise o ADMIN" — recebe versao auto-dirigida.
    const isAdmin = profile?.role === 'admin' || leaderAllowed

    // LUCRO
    if (diff >= 0) {
      const titles = ['Muito bom! +1 remessa!', 'Show! Lucro registrado!', 'Parabéns! Remessa no lucro!', 'Boaa! Mais uma no positivo!', 'Excelente! Bora pra cima!']
      const msgs = ['Muito bom, parabéns! Continua assim!', 'Ai sim! Lucro na remessa, mandou bem demais!', 'Show de bola, mantém esse ritmo!', 'Excelente resultado, operação voando!', 'Lucro garantido, bora pra próxima!']
      return { type: 'good', title: rnd(titles), text: `+R$ ${fmt(diff)}${nContasRemessa > 0 ? ` (R$ ${fmt(perConta)}/conta)` : ''} — ${rnd(msgs)}`, icon: 'check' }
    }

    // PREJUIZO ate 2/conta — baixo, tranquilo
    if (absPer <= 2) {
      const titles = ['Boa! Prejuízo baixo', 'Mandou bem!', 'Tranquilo, +1 remessa']
      const msgs = ['Prejuízo baixo, mandou bem! O salário compensa fácil.', 'Resultado controlado, tá de boa. Segue firme!', 'Prejuízo mínimo, nada preocupante. Bora pra próxima!']
      return { type: 'good', title: rnd(titles), text: `-${tag} — ${rnd(msgs)}`, icon: 'check' }
    }

    // 2-4/conta — leve oscilada, dentro do esperado
    if (absPer <= 4) {
      const titles = ['Registrado!', 'Dentro do esperado', '+1 remessa salva']
      const msgs = ['Leve oscilada, mas dentro do esperado. Segue normal.', 'Oscilou um pouco, faz parte da operação. Continua!', 'Nada fora do comum, tá no esperado. Bora!']
      return { type: 'good', title: rnd(titles), text: `-${tag} — ${rnd(msgs)}`, icon: 'check' }
    }

    // 4-6/conta — comecando a oscilar, fique de olho
    if (absPer <= 6) {
      const msgs = ['Começando a oscilar, fique de olho!', 'Tá oscilando um pouco — fica de olho nas próximas.', 'Leve oscilação subindo. Fica esperto!']
      return { type: 'warn', title: `Atenção: ${tag}`, text: rnd(msgs), icon: 'alert' }
    }

    // 6-8/conta — oscilada maior, avalie o slot
    if (absPer <= 8) {
      const msgs = ['Oscilada maior. Fique atento nas próximas remessas e avalie trocar o slot.', 'Oscilação aumentando — acompanha de perto e pensa em trocar o slot.', 'Tá oscilando mais forte. Atenção nas próximas e considere outro slot.']
      return { type: 'warn', title: `Atenção redobrada: ${tag}`, text: rnd(msgs), icon: 'alert' }
    }

    // 8-10/conta — ruim. Operador consulta o ADMIN; admin reavalia sozinho.
    if (absPer <= 10) {
      const msgs = isAdmin
        ? ['Resultado ruim — já começa a levar pro prejuízo. Reavalie a estratégia da meta.', 'Tá pesado. Considere pausar e revisar o slot e as contas.', 'Prejuízo subindo. Vale repensar essa operação.']
        : ['Resultado ruim — já começa a levar pro prejuízo. Pense em consultar o ADMIN.', 'Tá pesado. Vale conversar com o ADMIN sobre essa meta.', 'Prejuízo subindo. Considere alinhar com o ADMIN.']
      return { type: 'critical', title: `Ruim: ${tag}`, text: rnd(msgs), icon: 'x' }
    }

    // > 10/conta — resultado negativo, procure outros caminhos
    const msgsC = isAdmin
      ? ['Resultado negativo. Procure outros caminhos.', 'Já é prejuízo — hora de buscar outra estratégia.', 'No vermelho. Pausa e procura um caminho diferente.']
      : ['Resultado negativo. Procure outros caminhos.', 'Já é prejuízo — vale buscar outra estratégia com o ADMIN.', 'No vermelho. Mude o caminho e alinhe com o ADMIN.']
    return { type: 'critical', title: `Prejuízo: ${tag}`, text: rnd(msgsC), icon: 'x' }
  }

  function showFeedback(diff, statusProblema, nContasRem, slotUsed) {
    const fb = getOperationalFeedback(diff, statusProblema, nContasRem)
    if (fb) {
      // Add slot insight if available
      if (slotUsed && remessas.length >= 2) {
        const slotRems = remessas.filter(r => r.slot_name === slotUsed)
        if (slotRems.length >= 1) {
          const slotContas = slotRems.filter(r=>r.tipo!=='redeposito').reduce((a,r)=>a+Number(r.contas_remessa||0),0)
          const slotLiq = slotRems.reduce((a,r)=>a+Number(r.resultado||0),0) + diff
          const slotAvg = (slotContas + nContasRem) > 0 ? slotLiq / (slotContas + nContasRem) : 0
          const negStreak = [...slotRems].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
            .filter(r=>Number(r.resultado||0)<0).length
          if (negStreak >= 2 && diff < 0) {
            fb.insight = `${slotUsed}: ${negStreak+1} remessas negativas seguidas — considere trocar`
          } else if (slotAvg < -10) {
            fb.insight = `${slotUsed}: media de R$ ${fmt(slotAvg)}/conta — performance baixa`
          } else if (slotAvg >= 0) {
            fb.insight = `${slotUsed}: media positiva de R$ ${fmt(slotAvg)}/conta`
          }
        }
      }
      setFeedback(fb)
      setTimeout(() => setFeedback(null), 8000)
    }
    // Push pro operador em toda remessa
    const perConta = nContasRem > 0 ? Math.abs(diff) / nContasRem : Math.abs(diff)
    let pushTitle, pushBody
    const perTag = `R$ ${fmt(Math.abs(diff))} (R$ ${fmt(perConta)}/conta)`
    const isAdmin = profile?.role === 'admin' || leaderAllowed
    const pick = a => a[Math.floor(Math.random() * a.length)]
    if (diff >= 0) {
      const msgs = ['Muito bom, parabéns! Continua assim.', 'Lucro na remessa, mandou bem demais!', 'Show! Mantém esse ritmo.', 'Ai sim! Operação voando.']
      pushTitle = 'Remessa no lucro!'
      pushBody = `+R$ ${fmt(diff)} — ${msgs[Math.floor(Math.random() * msgs.length)]}`
    } else if (perConta <= 2) {
      pushTitle = 'Remessa registrada'
      pushBody = `${perTag} — Prejuízo baixo, mandou bem! Salário compensa.`
    } else if (perConta <= 4) {
      pushTitle = 'Remessa registrada'
      pushBody = `${perTag} — Leve oscilada, dentro do esperado. Segue firme.`
    } else if (perConta <= 6) {
      pushTitle = 'Atenção na operação'
      pushBody = `${perTag} — ${pick(['Começando a oscilar, fique de olho!', 'Tá oscilando um pouco, fica de olho nas próximas.', 'Leve oscilação subindo, fica esperto!'])}`
    } else if (perConta <= 8) {
      pushTitle = 'Atenção redobrada'
      pushBody = `${perTag} — ${pick(['Oscilada maior. Avalie trocar o slot.', 'Oscilação aumentando, pensa em trocar o slot.', 'Tá oscilando mais forte, considere outro slot.'])}`
    } else if (perConta <= 10) {
      pushTitle = 'Resultado ruim'
      pushBody = `${perTag} — ${pick(isAdmin ? ['Já leva pro prejuízo. Reavalie a estratégia.', 'Tá pesado, considere pausar e revisar.', 'Prejuízo subindo, repense a operação.'] : ['Já leva pro prejuízo. Pense em consultar o ADMIN.', 'Tá pesado, vale falar com o ADMIN.', 'Prejuízo subindo, alinhe com o ADMIN.'])}`
    } else {
      pushTitle = 'Resultado negativo'
      pushBody = `${perTag} — ${pick(isAdmin ? ['Resultado negativo. Procure outros caminhos.', 'Já é prejuízo, busque outra estratégia.', 'No vermelho, mude o caminho.'] : ['Resultado negativo. Procure outros caminhos.', 'Já é prejuízo, alinhe com o ADMIN.', 'No vermelho, fale com o ADMIN.'])}`
    }
    fetch('/api/push/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user?.id, title: pushTitle, body: pushBody, url: `/meta/${id}` }),
    }).catch(() => {})
  }

  async function handleAdd(e) {
    e.preventDefault()
    // BONUS: só registra o saque (valor do bônus), NÃO mexe nas contas nem exige depósito
    const isBonus = tipo === 'bonus'
    // CONTA MÃE: registra depósito+saque (lucro/prejuízo), NÃO exige nem afeta contas
    const semContasTipo = tipo === 'redeposito' || tipo === 'conta_mae'
    if ((!dep && !isBonus)||!saq||salvando) return
    if (!semContasTipo && !isBonus && (!contasRemessa || Number(contasRemessa) <= 0)) { setError('Informe o numero de contas nesta remessa.'); return }
    if (meta?.status==='finalizada'||meta?.status_fechamento==='fechada') { setError('Meta finalizada. Nao e possivel registrar.'); return }
    setSalvando(true); setError('')
    const d=isBonus?0:Number(parseVal(dep).toFixed(2)),s=Number(parseVal(saq).toFixed(2)),si=Number(parseVal(saldoIni).toFixed(2))
    // BAU da remessa (so usado em metas apenas_bau). Soma ao resultado pra entrar como lucro em tempo real.
    const isApenasBau = (meta?.operation_model || tenantOpModel || 'salario_bau') === 'apenas_bau'
    const bauVal = isApenasBau ? Number(parseVal(bauR || '0').toFixed(2)) : 0
    const diffBase = s - d
    const resultadoTotal = Number((diffBase + bauVal).toFixed(2))
    const lucroVal = resultadoTotal > 0 ? resultadoTotal : 0
    const prejVal  = resultadoTotal < 0 ? Math.abs(resultadoTotal) : 0
    const diff = resultadoTotal  // pra showFeedback continuar funcionando igual
    const { data:insRows, error:err } = await supabase.from('remessas').insert({
      meta_id:Number(id),
      titulo:tituloR.trim()||`${tipo==='redeposito'?'Redepósito':tipo==='bonus'?'Bônus':tipo==='conta_mae'?'Conta Mãe':tipo==='ajuste'?'Ajuste':'Remessa'} ${remessas.length+1}`,
      tipo, saldo_inicial:si, deposito:d, saque:s, bau:bauVal,
      lucro:lucroVal, prejuizo:prejVal, resultado:resultadoTotal,
      resultado_por_conta: Number(contasRemessa||0) > 0 ? Number((resultadoTotal / Number(contasRemessa)).toFixed(2)) : 0,
      tenant_id:profile?.tenant_id,
      status_problema:statusProb,
      contas_remessa: (tipo === 'redeposito' || tipo === 'bonus' || tipo === 'conta_mae') ? 0 : Number(contasRemessa||0),
      slot_name: selectedSlot || null,
      observacoes: obsRemessa.trim() || null,
    }).select('id')
    if (err) { setSalvando(false); setError(err.message); return }
    // Comprovantes (fotos): salva de forma resiliente. comprovante_url (1ª foto)
    // já existe; comprovantes (lista) entra após o SQL — cada update é
    // independente, então não quebra a remessa se a coluna ainda não existir.
    const savedComprovantes = comprovantes // [{url, ts}, ...]
    const firstUrl = savedComprovantes[0]?.url || null
    const newRemId = insRows?.[0]?.id
    if (savedComprovantes.length && newRemId) {
      supabase.from('remessas').update({ comprovante_url: firstUrl }).eq('id', newRemId).then(()=>{}, ()=>{})
      supabase.from('remessas').update({ comprovantes: savedComprovantes }).eq('id', newRemId).then(()=>{}, ()=>{})
    }
    // Limpar form e desbloquear IMEDIATAMENTE
    const formContas = Number(contasRemessa||0)
    setTituloR(''); setTipo('remessa'); setSaldoIni('1500'); setDep(''); setSaq(''); setBauR(''); setStatusProb('normal'); setContasRemessa(''); setSelectedSlot(''); setObsRemessa(''); setComprovantes([]); setComprovanteErr('')
    const formSlot = selectedSlot || ''
    setSalvando(false)
    showFeedback(diff, statusProb, formContas, formSlot)
    // Adicionar remessa otimisticamente no state local (aparece instantaneo no historico)
    const optimistic = {
      id: `temp-${Date.now()}`, meta_id: Number(id),
      titulo: tituloR.trim() || `${tipo==='redeposito'?'Redepósito':tipo==='bonus'?'Bônus':tipo==='conta_mae'?'Conta Mãe':'Remessa'} ${remessas.length+1}`,
      tipo, deposito: d, saque: s, bau: bauVal, lucro: lucroVal, prejuizo: prejVal, resultado: resultadoTotal,
      contas_remessa: (tipo === 'redeposito' || tipo === 'bonus' || tipo === 'conta_mae') ? 0 : formContas,
      slot_name: selectedSlot || null, status_problema: statusProb,
      observacoes: obsRemessa.trim() || null,
      comprovante_url: firstUrl,
      comprovantes: savedComprovantes,
      created_at: new Date().toISOString(),
    }
    setRemessas(prev => [...prev, optimistic])
    // Notificacao e refresh em paralelo (nao bloqueia)
    notifyRemessaCreated(meta?.tenant_id||profile?.tenant_id, getName(profile), meta?.rede||'', diff, tipo)
    evaluateAfterRemessa({
      remessas: [...remessas, optimistic], meta,
      novaRemessa: { resultado: diff, contas_remessa: formContas },
      userId: user?.id,
    })
    // Refresh real em background (substitui o optimistic pelo dado real)
    refreshRemessas().catch(() => {})
  }

  async function toggleStatus() {
    if (!meta) return
    const isAdmin = profile?.role === 'admin' || leaderAllowed
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
    await fetchData()
    // Popup de finalizacao — apenas operador (líder age como admin)
    if (action === 'finalize' && profile?.role !== 'admin' && !leaderAllowed) {
      setShowFinalePopup(true)
    }
  }

  async function saveEditRem() {
    if (!editRem||editSaving) return
    // Contas editaveis (redeposito sempre 0). VALIDACAO automatica: minimo 1 na
    // remessa normal — nao deixa salvar contagem invalida.
    const isRedep = editRem.tipo === 'redeposito'
    const isBonus = editRem.tipo === 'bonus'
    const isContaMae = editRem.tipo === 'conta_mae'
    const semContas = isRedep || isBonus || isContaMae
    const contas = semContas ? 0 : Math.floor(Number(editContas || 0))
    if (!semContas && (!Number.isFinite(contas) || contas < 1)) return
    setEditSaving(true)
    // MESMA logica do cadastro (handleAdd): usa parseVal (numero BR) e, em metas
    // apenas_bau, SOMA o bau ao resultado. Bônus: depósito sempre 0 (só saque).
    const d=isBonus?0:Number(parseVal(editDep).toFixed(2)), s=Number(parseVal(editSaq).toFixed(2))
    const isApenasBau = (meta?.operation_model || tenantOpModel || 'salario_bau') === 'apenas_bau'
    const bauVal = isApenasBau ? Number(parseVal(editBau || '0').toFixed(2)) : 0
    const resultadoTotal = Number(((s - d) + bauVal).toFixed(2))
    const lucroVal = resultadoTotal > 0 ? resultadoTotal : 0
    const prejVal  = resultadoTotal < 0 ? Math.abs(resultadoTotal) : 0
    await supabase.from('remessas').update({
      deposito:d, saque:s, bau:bauVal, contas_remessa: contas,
      lucro:lucroVal, prejuizo:prejVal, resultado:resultadoTotal,
      resultado_por_conta: contas > 0 ? Number((resultadoTotal / contas).toFixed(2)) : 0,
    }).eq('id',editRem.id)
    setEditSaving(false)
    setEditRem(null)
    fetchData()
  }

  const isApenasBauMeta = useMemo(() => (meta?.operation_model || tenantOpModel || 'salario_bau') === 'apenas_bau', [meta?.operation_model, tenantOpModel])

  const totais = useMemo(()=>{
    let lucro=0,prej=0,d=0,s=0,bauTotal=0
    remessas.forEach(r=>{
      lucro+=Number(r.lucro||0)
      prej+=Number(r.prejuizo||0)
      d+=Number(r.deposito||0)
      s+=Number(r.saque||0)
      bauTotal+=Number(r.bau||0)
    })
    return {
      lucro:Number(lucro.toFixed(2)),
      prej:Number(prej.toFixed(2)),
      d:Number(d.toFixed(2)),
      s:Number(s.toFixed(2)),
      bau:Number(bauTotal.toFixed(2)),
      liq:Number((lucro-prej).toFixed(2)),
    }
  },[remessas])

  // Parse value: handle Brazilian format (1.055 = 1055, 1.055,00 = 1055)
  const parseVal = v => { const s = String(v||'0'); if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); return Number(s) }
  const prev = useMemo(()=>{
    const base = parseVal(saq)-parseVal(dep)
    const bauAdd = (meta?.operation_model||tenantOpModel||'salario_bau')==='apenas_bau' ? parseVal(bauR||'0') : 0
    const diff = base + bauAdd
    return { diff, pos: diff>=0, base, bauAdd }
  },[dep,saq,bauR,meta?.operation_model,tenantOpModel])

  const pctAcerto = remessas.length>0?Math.round((remessas.filter(r=>Number(r.resultado||0)>=0).length/remessas.length)*100):0

  const fbCfg = {
    good: { bg: 'linear-gradient(145deg, #0a1a12, var(--surface))', border: 'rgba(209,250,229,0.3)', color: 'var(--profit)', iconPath: 'M20 6L9 17l-5-5' },
    warn: { bg: 'linear-gradient(145deg, #1a1608, #14120a)', border: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.78)', iconPath: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
    critical: { bg: 'linear-gradient(145deg, #1a0a0a, #140c0c)', border: 'rgba(239,68,68,0.3)', color: 'var(--loss)', iconPath: 'M18 6L6 18M6 6l12 12' },
  }

  // EXPERIENCIA PREMIUM — dois niveis de liberacao:
  //  • isV2 (central de remessa premium + slots Netflix): TODOS (admin E
  //    operador). So tem campos de remessa (deposito/saque/contas/slot/
  //    resultado parcial) — nenhum dado financeiro de admin.
  //  • isAdminV2 (modal de finalizacao premium + certificado/baixar imagem):
  //    SO ADMIN — expoe salario/bau/custos, que operador NAO pode ver.
  const isV2 = true
  const isAdminV2 = profile?.role === 'admin' || leaderAllowed
  // Líder GERENCIANDO a meta de um operador da equipe (não a própria): vê como
  // admin (gestão), sem o formulário de operar — quem opera é o operador dono.
  const isLeaderManaging = leaderAllowed && !!meta && !!user && meta.operator_id !== user.id
  // Para onde o botão "voltar" leva conforme o tipo de conta
  const homePath = profile?.role === 'admin' ? '/admin' : ((profile?.is_team_leader && profile?.tenant_id === DS_MENTORIA_TENANT) ? '/equipe' : '/operator')

  return (
    <main style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role==='admin'} userId={user?.id} tenantId={profile?.tenant_id}>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (() => {
          const c = fbCfg[feedback.type]
          return (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
              style={{
                position: 'fixed', bottom: 24, right: 20, zIndex: 9999,
                maxWidth: 420, padding: '18px 22px', borderRadius: 16,
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
              <div style={{ flex:1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: c.color, margin: '0 0 4px' }}>{feedback.title}</p>
                <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>{feedback.text}</p>
                {feedback.insight && (
                  <div style={{ marginTop:8, padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', gap:6 }}>
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>
                    <span style={{ fontSize:10, color:'#c4b5fd', fontWeight:500 }}>{feedback.insight}</span>
                  </div>
                )}
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
        {/* Header — cabine de controle */}
        <div className="a1" style={{ marginBottom:24 }}>
          <button onClick={()=>router.push(homePath)} className="btn btn-ghost btn-sm" style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:14 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar ao painel
          </button>
          {(() => {
            const isFechada = meta?.status_fechamento==='fechada'
            const isFinalizada = meta?.status==='finalizada' && !isFechada
            // canReactivate: tanto meta finalizada quanto fechada podem ser reabertas
            const canReactivate = isFinalizada || isFechada
            const isAdminUser = profile?.role === 'admin' || leaderAllowed
            const statusC = isFechada ? 'var(--profit)' : isFinalizada ? 'rgba(255,255,255,0.78)' : '#e53935'
            const statusL = isFechada ? 'FECHADA' : isFinalizada ? 'FINALIZADA' : 'AO VIVO'
            return (
              <motion.div
                initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
                transition={{duration:0.45, ease:[0.33,1,0.68,1]}}
                style={{
                  position:'relative', overflow:'hidden',
                  padding:'22px 24px', borderRadius:18,
                  background:'linear-gradient(180deg, var(--raised), var(--surface))',
                  backdropFilter:'blur(24px) saturate(160%)', WebkitBackdropFilter:'blur(24px) saturate(160%)',
                  border:`1px solid ${statusC}22`,
                  boxShadow:`0 10px 40px rgba(0,0,0,0.5), 0 0 48px ${statusC}0f, inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}>
                {/* Top glow line */}
                <div style={{ position:'absolute', top:0, left:'12%', right:'12%', height:1, background:`linear-gradient(90deg, transparent, ${statusC}80, transparent)`, pointerEvents:'none' }}/>
                {/* Ambient orb */}
                <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle, ${statusC}18, transparent 60%)`, filter:'blur(30px)', pointerEvents:'none' }}/>

                <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
                  <div style={{ flex:1, minWidth:220 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                      <h1 style={{ fontSize:28, fontWeight:900, color:'var(--t1)', margin:0, letterSpacing:'-0.025em', lineHeight:1.1 }}>
                        {loading?'Carregando...':meta?.titulo||'Meta'}
                      </h1>
                      <div style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        padding:'4px 10px', borderRadius:7,
                        background:`${statusC}14`, border:`1px solid ${statusC}40`,
                        boxShadow:!isFechada && !isFinalizada ? `0 0 12px ${statusC}30` : 'none',
                      }}>
                        {!isFechada && !isFinalizada && (
                          <motion.div
                            animate={{ boxShadow:[`0 0 0 0 ${statusC}90`, `0 0 0 5px ${statusC}00`, `0 0 0 0 ${statusC}00`] }}
                            transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }}
                            style={{ width:6, height:6, borderRadius:'50%', background:statusC }}
                          />
                        )}
                        <span style={{ fontSize:9, fontWeight:800, color:statusC, letterSpacing:'0.1em' }}>{statusL}</span>
                      </div>
                    </div>
                    {meta?.observacoes && <p style={{ fontSize:13, color:'var(--t2)', margin:'0 0 10px', fontWeight:500 }}>{meta.observacoes}</p>}

                    {/* Indicadores principais em linha */}
                    <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--mono)', fontWeight:600 }}>{meta?.quantidade_contas||0} contas</span>
                      </div>
                      <div style={{ width:1, height:10, background:'rgba(255,255,255,0.08)' }}/>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--mono)', fontWeight:600 }}>{remessas.length} remessas</span>
                      </div>
                      <div style={{ width:1, height:10, background:'rgba(255,255,255,0.08)' }}/>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={pctAcerto>=70?'var(--profit)':pctAcerto>=50?'rgba(255,255,255,0.78)':'var(--loss)'} strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize:11, color: pctAcerto>=70?'var(--profit)':pctAcerto>=50?'rgba(255,255,255,0.78)':'var(--loss)', fontFamily:'var(--mono)', fontWeight:700 }}>{pctAcerto}% acerto</span>
                      </div>
                      {meta?.rede && (<>
                        <div style={{ width:1, height:10, background:'rgba(255,255,255,0.08)' }}/>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:5, background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.78)', border:'1px solid rgba(255,255,255,0.22)', fontWeight:700, letterSpacing:'0.05em', fontFamily:'var(--mono)' }}>{meta.rede}</span>
                      </>)}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {/* Editar: aparece em meta nao-fechada (todos) OU em meta fechada se for admin (com flag update_lucro_only) */}
                    {meta && (meta.status_fechamento !== 'fechada' || isAdminUser) && (
                      <motion.button
                        onClick={()=>setShowEdit(true)}
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        style={{
                          padding:'10px 16px', borderRadius:11, border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer',
                          fontSize:12, fontWeight:700, fontFamily:'inherit',
                          background:'rgba(255,255,255,0.03)', color:'var(--t2)',
                          display:'flex', alignItems:'center', gap:7,
                        }} title={isFechada ? 'Editar lucro/ajustes (admin)' : 'Editar meta'}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editar
                      </motion.button>
                    )}
                    <motion.button
                      onClick={toggleStatus}
                      whileHover={{ scale:1.03, boxShadow: canReactivate ? '0 8px 24px rgba(209,250,229,0.45)' : '0 8px 24px rgba(229,57,53,0.45)' }}
                      whileTap={{ scale:0.97 }}
                      style={{
                        padding:'10px 18px', borderRadius:11, border:'none', cursor:'pointer',
                        fontSize:12, fontWeight:800, fontFamily:'inherit', color:'#fff',
                        background: canReactivate
                          ? 'linear-gradient(145deg, var(--profit), #00a06d)'
                          : 'linear-gradient(145deg, #e53935, #c62828)',
                        boxShadow: canReactivate
                          ? '0 6px 20px rgba(209,250,229,0.35), inset 0 1px 0 rgba(255,255,255,0.18)'
                          : '0 6px 20px rgba(229,57,53,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
                        display:'flex', alignItems:'center', gap:7,
                      }}>
                      {canReactivate?<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg> Reativar meta</>:<><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Finalizar meta</>}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })()}
        </div>

        {/* ── Conta mae (credenciais salvas) ── */}
        {meta && (meta.conta_link || meta.conta_login || meta.conta_senha) && (
          <div style={{ marginBottom: 18 }}>
            <ContaMaeView
              link={meta.conta_link}
              login={meta.conta_login}
              senha={meta.conta_senha}
            />
          </div>
        )}

        {/* ── Edit meta modal ── */}
        <AnimatePresence>
          {showEdit && meta && (
            <EditMetaModal
              meta={meta}
              userId={user?.id}
              contasMinimo={remessas.filter(r=>r.tipo!=='redeposito').reduce((s,r)=>s+Number(r.contas_remessa||0),0)}
              onClose={()=>setShowEdit(false)}
              onSaved={(updated)=>{
                setShowEdit(false)
                if (updated) setMeta(prev => ({...prev, ...updated}))
                else fetchData()
              }}
            />
          )}
        </AnimatePresence>

        {/* Insight da operacao */}
        {!loading && remessas.length > 0 && (() => {
          const last3 = [...remessas].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,3)
          const negSeq = last3.filter(r => Number(r.resultado||0) < 0).length
          const posSeq = last3.filter(r => Number(r.resultado||0) >= 0).length
          const liq = totais.liq
          let insightStatus, insightColor, insightText, insightSub
          if (liq < 0 && negSeq >= 2) {
            insightStatus = 'Critica'; insightColor = 'var(--loss)'
            insightText = 'Meta em prejuizo com sequencia negativa'
            insightSub = `${negSeq} das ultimas 3 remessas negativas`
          } else if (liq < 0) {
            insightStatus = 'Atencao'; insightColor = 'rgba(255,255,255,0.78)'
            insightText = 'Meta em prejuizo — fique atento'
            insightSub = 'Resultado acumulado negativo'
          } else if (negSeq >= 2) {
            insightStatus = 'Atencao'; insightColor = 'rgba(255,255,255,0.78)'
            insightText = 'Oscilacao detectada, atencao'
            insightSub = `${negSeq} remessas negativas recentes apesar de lucro geral`
          } else if (posSeq >= 2 && liq > 0) {
            insightStatus = 'Saudavel'; insightColor = 'var(--profit)'
            insightText = 'Meta saudavel com boa consistencia'
            insightSub = `${posSeq} remessas positivas consecutivas`
          } else {
            insightStatus = 'Normal'; insightColor = 'rgba(255,255,255,0.78)'
            insightText = 'Operacao em andamento'
            insightSub = `${remessas.length} remessas registradas`
          }
          return (
            <motion.div
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.35, delay:0.1 }}
              style={{
                padding:'14px 20px', borderRadius:14, marginBottom:20,
                background:`${insightColor}08`, border:`1px solid ${insightColor}20`,
                display:'flex', alignItems:'center', gap:12,
                boxShadow:`0 0 20px ${insightColor}06`,
              }}
            >
              <motion.div
                animate={{ boxShadow:[`0 0 0 0 ${insightColor}00`, `0 0 0 6px ${insightColor}20`, `0 0 0 0 ${insightColor}00`] }}
                transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut' }}
                style={{ width:10, height:10, borderRadius:'50%', background:insightColor, flexShrink:0 }}
              />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:insightColor, margin:'0 0 2px' }}>{insightText}</p>
                <p style={{ fontSize:11, color:'var(--t3)', margin:0 }}>{insightSub}</p>
              </div>
              <span style={{ fontSize:9, fontWeight:700, padding:'3px 10px', borderRadius:6, background:`${insightColor}12`, color:insightColor, border:`1px solid ${insightColor}22`, textTransform:'uppercase', letterSpacing:'0.04em' }}>{insightStatus}</span>
            </motion.div>
          )
        })()}

        {/* KPIs */}
        <div className="g-5" style={{ display:'grid', gridTemplateColumns:`repeat(${isApenasBauMeta ? 6 : 5},1fr)`, gap:14, marginBottom:28 }}>
          <KPI label="Deposito total"    value={`R$ ${fmt(totais.d)}`}   color="var(--t1)" accent="rgba(255,255,255,0.78)"/>
          <KPI label="Saque total"       value={`R$ ${fmt(totais.s)}`}   color="var(--t1)" accent="rgba(255,255,255,0.78)"/>
          {isApenasBauMeta && (
            <KPI label="BAU acumulado"   value={`R$ ${fmt(totais.bau)}`}  color="var(--profit)" accent="var(--profit)"/>
          )}
          <KPI label="Lucro acumulado"   value={`R$ ${fmt(totais.lucro)}`} color="var(--profit)" accent="var(--profit)"/>
          <KPI label="Prejuizo acum."    value={`R$ ${fmt(totais.prej)}`}  color="var(--loss)" accent="var(--loss)"/>
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4 }}
            whileHover={{ y:-3, boxShadow:`0 14px 40px rgba(0,0,0,0.5), 0 0 40px ${totais.liq>=0?'rgba(209,250,229,0.18)':'rgba(239,68,68,0.18)'}`, transition:{ duration:0.2 } }}
            style={{
              position:'relative', overflow:'hidden',
              background: totais.liq>=0
                ? 'linear-gradient(145deg, rgba(209,250,229,0.14), rgba(209,250,229,0.02))'
                : 'linear-gradient(145deg, rgba(239,68,68,0.14), rgba(239,68,68,0.02))',
              backdropFilter:'blur(20px) saturate(160%)', WebkitBackdropFilter:'blur(20px) saturate(160%)',
              border:`1px solid ${totais.liq>=0?'rgba(209,250,229,0.3)':'rgba(239,68,68,0.3)'}`,
              borderRadius:14, padding:'16px 20px', display:'flex', flexDirection:'column', justifyContent:'space-between',
              boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 32px ${totais.liq>=0?'rgba(209,250,229,0.12)':'rgba(239,68,68,0.12)'}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              cursor:'default',
            }}>
            <div style={{ position:'absolute', top:'-30%', right:'-10%', width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, ${totais.liq>=0?'rgba(209,250,229,0.18)':'rgba(239,68,68,0.18)'}, transparent 70%)`, pointerEvents:'none', filter:'blur(10px)' }} />
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:`linear-gradient(90deg, transparent, ${totais.liq>=0?'rgba(209,250,229,0.5)':'rgba(239,68,68,0.5)'}, transparent)`, pointerEvents:'none' }}/>

            <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
              <div style={{ width:3, height:11, borderRadius:2, background: totais.liq>=0?'var(--profit)':'var(--loss)', boxShadow:`0 0 8px ${totais.liq>=0?'var(--profit)':'var(--loss)'}` }}/>
              <p style={{ fontSize:10, color: totais.liq>=0?'#4ade80':'#fca5a5', fontWeight:800, margin:0, letterSpacing:'0.1em', textTransform:'uppercase' }}>Resultado liquido</p>
            </div>
            <motion.p
              animate={{ textShadow:[`0 0 12px ${totais.liq>=0?'rgba(209,250,229,0.25)':'rgba(239,68,68,0.25)'}`, `0 0 28px ${totais.liq>=0?'rgba(209,250,229,0.45)':'rgba(239,68,68,0.45)'}`, `0 0 12px ${totais.liq>=0?'rgba(209,250,229,0.25)':'rgba(239,68,68,0.25)'}`] }}
              transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              className="t-num" style={{ fontSize:26, fontWeight:900, color:totais.liq>=0?'var(--profit)':'var(--loss)', position:'relative', zIndex:1, margin:0, letterSpacing:'-0.025em', lineHeight:1 }}>
              {totais.liq>=0?'+':'-'}R$ {fmt(Math.abs(totais.liq))}
            </motion.p>
            <p style={{ fontSize:10, color:'var(--t4)', margin:'4px 0 0', fontWeight:500, position:'relative', zIndex:1 }}>
              {totais.liq>=0 ? 'Operacao em lucro' : 'Operacao em prejuizo'}
            </p>
          </motion.div>
        </div>

        {/* Insights + Previsao + Score */}
        {remessas.length >= 2 && (() => {
          const insights = []
          const ordered = [...remessas].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          // Contas JA FEITAS (soma de contas_remessa, excluindo redeposito)
          const contasFeitas = remessas.filter(r => r.tipo !== 'redeposito').reduce((a, r) => a + Number(r.contas_remessa || 0), 0)
          const nContas = contasFeitas || 0
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
          // Lucro nas remessas e RARO e deve ser elogiado
          // Prejuizo ate R$8/conta e NORMAL (salario compensa)
          if (nContas > 0) {
            if (totais.liq > 0 && avgPerConta > 0) {
              const msgs = [
                `Operacao no lucro! +R$ ${fmt(totais.liq)} com media de R$ ${fmt(avgPerConta)}/conta — resultado excelente!`,
                `Impressionante! Lucro de R$ ${fmt(totais.liq)} em ${remessas.length} remessas — voce ta voando!`,
                `Meta no positivo! R$ ${fmt(avgPerConta)}/conta de lucro — muito acima da media!`,
              ]
              insights.push({ text: msgs[Math.floor(Math.random() * msgs.length)], type: 'good', action: 'Resultado raro e excelente. Mantem esse ritmo!' })
            }
            else if (avgPerConta > -3) insights.push({ text: `Resultado otimo: R$ ${fmt(avgPerConta)}/conta — quase no lucro`, type: 'good', action: 'Excelente controle. Continua assim!' })
            else if (avgPerConta >= -8) insights.push({ text: `Operacao dentro do esperado: R$ ${fmt(avgPerConta)}/conta em ${remessas.length} remessas`, type: 'good', action: 'Prejuizo controlado — faz parte da operacao' })
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

          // E) Slot-based insights
          const slotGroups = {}
          remessas.forEach(r => {
            if (!r.slot_name) return
            if (!slotGroups[r.slot_name]) slotGroups[r.slot_name] = []
            slotGroups[r.slot_name].push(r)
          })

          const slotStats = Object.entries(slotGroups)
            .filter(([_, rems]) => rems.length >= 2)
            .map(([name, rems]) => {
              const totalRes = rems.reduce((a, r) => a + Number(r.resultado || 0), 0)
              const totalContas = rems.reduce((a, r) => a + Number(r.contas_remessa || 0), 0)
              return { name, avg: totalRes / rems.length, perConta: totalContas > 0 ? totalRes / totalContas : 0, count: rems.length }
            })
            .sort((a, b) => b.perConta - a.perConta)

          if (slotStats.length > 0) {
            const best = slotStats[0]
            const worst = slotStats[slotStats.length - 1]
            const allNeg = slotStats.every(s => s.perConta < 0)

            if (allNeg && slotStats.length >= 2) {
              // Todos os slots estao negativos — contextualizar
              const diff = Math.abs(worst.perConta) - Math.abs(best.perConta)
              if (diff > 1) {
                insights.push({
                  text: `${best.name} teve menor prejuizo (R$ ${fmt(best.perConta)}/conta) vs ${worst.name} (R$ ${fmt(worst.perConta)}/conta)`,
                  type: 'warn',
                  action: `Diferenca de R$ ${fmt(diff)}/conta entre slots — ${best.name} perdeu menos`
                })
              } else {
                insights.push({
                  text: `Todos os slots com prejuizo similar — nenhum se destaca positivamente`,
                  type: 'warn',
                  action: 'Considere testar outros slots ou ajustar a estrategia'
                })
              }
            } else if (best.perConta >= 0) {
              // Melhor slot no positivo — elogio real
              insights.push({
                text: `${best.name} no positivo: R$ ${fmt(best.perConta)}/conta em ${best.count} remessas`,
                type: 'good',
                action: 'Priorizar esse slot nas proximas remessas'
              })
            } else {
              // Melhor slot negativo mas outros piores — contextualizar
              insights.push({
                text: `${best.name} com menor prejuizo: R$ ${fmt(best.perConta)}/conta (${best.count} remessas)`,
                type: 'warn',
                action: 'Menos pior entre os slots usados — ainda no negativo'
              })
            }

            // Pior slot com destaque se muito ruim
            if (worst.perConta < -8 && worst.name !== best.name) {
              insights.push({
                text: `${worst.name}: R$ ${fmt(worst.perConta)}/conta de prejuizo — pior desempenho`,
                type: worst.perConta < -12 ? 'critical' : 'warn',
                action: 'Considere trocar esse slot'
              })
            }
          }

          // Repeated negative slot: last 2+ remessas same slot and all negative
          const recentWithSlot = ordered.filter(r => r.slot_name).slice(-2)
          if (recentWithSlot.length >= 2 && recentWithSlot[0].slot_name === recentWithSlot[1].slot_name && recentWithSlot.every(r => Number(r.resultado || 0) < 0)) {
            insights.push({ text: `2 remessas negativas seguidas no ${recentWithSlot[0].slot_name} — teste outro slot`, type: 'warn', action: 'Trocar de slot pode quebrar a sequencia negativa' })
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
          const metaTotalContas = Number(meta?.quantidade_contas || 0)
          const pctDone = metaTotalContas > 0 ? (nContas / metaTotalContas) : 0
          score += Math.round(pctDone * 15) // Progresso bonus
          score = Math.max(0, Math.min(100, score))
          const scoreColor = score >= 70 ? 'var(--profit)' : score >= 40 ? 'var(--warn)' : 'var(--loss)'

          // Previsao (projecao pra meta inteira baseado no avg real por conta feita)
          const contasRestantes = metaTotalContas - nContas
          const previsaoFinal = metaTotalContas > 0 ? avgPerConta * metaTotalContas : 0

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

                {/* Previsao — apenas para metas ativas (nao fechadas) */}
                {meta?.status_fechamento !== 'fechada' && contasRestantes > 0 ? (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--t4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimativa final</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: previsaoFinal >= 0 ? 'var(--profit)' : 'var(--loss)', margin: '0 0 4px', fontFamily: 'var(--mono, monospace)', opacity: 0.7 }}>
                      {previsaoFinal >= 0 ? '+' : ''}R$ {fmt(previsaoFinal)}
                    </p>
                    <p style={{ fontSize: 9, color: 'var(--t4)', margin: 0 }}>
                      {nContas}/{metaTotalContas} contas · R$ {fmt(avgPerConta)}/conta · {contasRestantes} restantes
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--t4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Media por conta</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: avgPerConta >= 0 ? 'var(--profit)' : 'var(--loss)', margin: '0 0 4px', fontFamily: 'var(--mono, monospace)' }}>
                      R$ {fmt(avgPerConta)}
                    </p>
                    <p style={{ fontSize: 9, color: 'var(--t4)', margin: 0 }}>
                      {nContas} contas processadas
                    </p>
                  </div>
                )}
              </div>

              {/* Insights */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Insights da operacao</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.78)', background: 'rgba(255,255,255,0.1)', padding: '2px 7px', borderRadius: 5 }}>AI</span>
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

        {/* Progress bar — premium */}
        {meta && (() => {
          const target = Number(meta.quantidade_contas || 0)
          const done = remessas.reduce((sum, r) => sum + Number(r.contas_remessa || 0), 0)
          const pct = target > 0 ? Math.min(Math.round((done / target) * 100), 100) : 0
          const pctExact = target > 0 ? (done / target) * 100 : 0
          const remaining = Math.max(0, target - done)
          const isDone = pct >= 100
          const barC = isDone ? 'var(--profit)' : pct >= 70 ? 'var(--profit)' : pct >= 40 ? 'rgba(255,255,255,0.78)' : '#e53935'
          return target > 0 ? (
            <motion.div
              initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
              transition={{duration:0.4, ease:[0.33,1,0.68,1]}}
              style={{
                position:'relative', overflow:'hidden',
                marginBottom: 22,
                padding: '18px 22px', borderRadius: 14,
                background:'linear-gradient(180deg, var(--raised), var(--surface))',
                backdropFilter:'blur(18px) saturate(150%)', WebkitBackdropFilter:'blur(18px) saturate(150%)',
                border:`1px solid ${isDone ? 'rgba(209,250,229,0.22)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isDone
                  ? '0 6px 24px rgba(0,0,0,0.4), 0 0 32px rgba(209,250,229,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
                  : '0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}>
              {/* Top highlight */}
              <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:`linear-gradient(90deg, transparent, ${barC}50, transparent)`, pointerEvents:'none' }}/>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:30, height:30, borderRadius:9,
                    background:`${barC}14`, border:`1px solid ${barC}30`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:`0 0 12px ${barC}25`,
                  }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={barC} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.01em' }}>
                      Progresso da meta
                    </p>
                    <p style={{ fontSize:10, color:'var(--t4)', margin:'2px 0 0', fontWeight:500, fontFamily:'var(--mono)' }}>
                      {done} de {target} contas · {remaining > 0 ? `faltam ${remaining}` : 'concluido'}
                    </p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                  <motion.span
                    key={pct}
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.33,1.4,0.68,1] }}
                    style={{ fontSize:26, fontWeight:900, color:barC, fontFamily:'var(--mono)', letterSpacing:'-0.03em', lineHeight:1, textShadow:`0 0 16px ${barC}40` }}
                  >
                    {pct}
                  </motion.span>
                  <span style={{ fontSize:14, fontWeight:700, color:barC, fontFamily:'var(--mono)' }}>%</span>
                </div>
              </div>

              {/* Progress bar — mais espessa com gradient + shimmer */}
              <div style={{ position:'relative', width:'100%', height:10, borderRadius:5, background:'rgba(255,255,255,0.05)', overflow:'hidden', border:'1px solid rgba(255,255,255,0.04)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pctExact}%` }}
                  transition={{ duration: 0.9, ease: [0.33,1,0.68,1] }}
                  style={{
                    position:'relative',
                    height: '100%', borderRadius: 5,
                    background: isDone
                      ? 'linear-gradient(90deg, var(--profit), #00a06d, var(--profit))'
                      : pct >= 70
                      ? 'linear-gradient(90deg, var(--profit), #00a06d)'
                      : pct >= 40
                      ? 'linear-gradient(90deg, rgba(255,255,255,0.78), #1d4ed8)'
                      : 'linear-gradient(90deg, #e53935, #c62828)',
                    boxShadow: `0 0 12px ${barC}70, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    overflow:'hidden',
                  }}
                >
                  {/* Shimmer overlay */}
                  <div style={{
                    position:'absolute', inset:0,
                    background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                    animation:'metaProgShimmer 2.2s ease-in-out infinite',
                    backgroundSize:'200% 100%',
                  }}/>
                </motion.div>
                <style>{`@keyframes metaProgShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
              </div>

              {/* Marker dots a cada 25% */}
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, padding:'0 1px' }}>
                {[0,25,50,75,100].map(mark => (
                  <div key={mark} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <div style={{
                      width:4, height:4, borderRadius:'50%',
                      background: pct >= mark ? barC : 'rgba(255,255,255,0.12)',
                      boxShadow: pct >= mark ? `0 0 6px ${barC}` : 'none',
                      transition:'all 0.3s',
                    }}/>
                    <span style={{ fontSize:8, color: pct >= mark ? 'var(--t3)' : 'var(--t4)', fontFamily:'var(--mono)', fontWeight:600 }}>
                      {mark}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null
        })()}

        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
          {/* ══ REGISTRAR REMESSA ══ (escondido p/ líder gerenciando meta de operador) */}
          {isLeaderManaging ? null : isV2 ? (() => {
            const colTitle = { fontFamily:'var(--mono)', fontSize:9, fontWeight:800, color:'#e53935', letterSpacing:'0.14em', textTransform:'uppercase', margin:'0 0 12px' }
            const inp = { fontSize:13, padding:'9px 11px' }
            const field = (label, children) => (<div style={{ marginBottom:11 }}><label className="t-label" style={{ display:'block', marginBottom:5, fontSize:8.5 }}>{label}</label>{children}</div>)
            const contasN = Number(contasRemessa||0)
            const depN = parseVal(dep)
            const porConta = contasN>0 ? prev.diff/contasN : 0
            const roi = depN>0 ? (prev.diff/depN)*100 : 0
            const hasInput = !!(dep || saq || (isApenasBauMeta && bauR))
            const col = prev.diff>0 ? 'var(--profit)' : prev.diff<0 ? 'var(--loss)' : '#FCD34D'
            // Slots: usa os favoritos do tenant (na ordem dele) OU o catalogo completo
            // (preferidos primeiro) — sempre visivel, sem precisar pre-selecionar.
            const slotList = (tenantSlots && tenantSlots.length > 0)
              ? tenantSlots.map(n => SLOT_CATALOG.find(x => x.name === n) || { name:n, image:`/slots/${slotSlug(n)}.webp` })
              : SLOT_CATALOG
            return (
            <div className="card a2" style={{ padding:0, overflow:'hidden', borderRadius:18, border:'1px solid var(--b2)', background:'linear-gradient(180deg, var(--raised), var(--surface))', boxShadow:'0 24px 60px rgba(0,0,0,0.45)' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--b1)', background:'linear-gradient(90deg, rgba(229,57,53,0.07), transparent 60%)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:'rgba(229,57,53,0.12)', border:'1px solid rgba(229,57,53,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div>
                    <p style={{ fontSize:13.5, fontWeight:800, color:'var(--t1)', margin:0, letterSpacing:'-0.01em' }}>Central de Remessa</p>
                    <p style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--t4)', margin:'1px 0 0', letterSpacing:'0.04em' }}>Remessa #{remessas.length + 1}</p>
                  </div>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:99, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.28)' }}>
                  <motion.span animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.6, repeat:Infinity }} style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E' }}/>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:800, color:'#22C55E', letterSpacing:'0.12em' }}>AO VIVO</span>
                </div>
              </div>

              <form onSubmit={handleAdd} onPaste={onPasteComprovante}>
                {/* SLOTS — Netflix, sempre visivel (catalogo completo ou favoritos do tenant) */}
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <p style={{ ...colTitle, margin:0 }}>Slot utilizado</p>
                    {selectedSlot
                      ? <span style={{ fontSize:11, color:'var(--profit)', fontWeight:700 }}>{selectedSlot}</span>
                      : <span style={{ fontSize:10, color:'var(--t4)' }}>opcional · toque para escolher</span>}
                  </div>
                  <div style={{ position:'relative' }}>
                    <button type="button" onClick={()=>{const el=document.getElementById('slot-nf');if(el)el.scrollBy({left:-280,behavior:'smooth'})}} style={{ position:'absolute', left:-6, top:'42%', transform:'translateY(-50%)', zIndex:3, width:32, height:32, borderRadius:'50%', border:'1px solid var(--b2)', background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#e53935' }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
                    <button type="button" onClick={()=>{const el=document.getElementById('slot-nf');if(el)el.scrollBy({left:280,behavior:'smooth'})}} style={{ position:'absolute', right:-6, top:'42%', transform:'translateY(-50%)', zIndex:3, width:32, height:32, borderRadius:'50%', border:'1px solid var(--b2)', background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#e53935' }}><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>
                  <div id="slot-nf" style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:6, scrollbarWidth:'none', padding:'0 6px 6px' }}>
                    <style>{`#slot-nf::-webkit-scrollbar{display:none}`}</style>
                    {slotList.map(s => {
                      const active = selectedSlot === s.name
                      return (
                        <div key={s.name} onClick={()=>setSelectedSlot(active?'':s.name)} style={{
                          minWidth:112, maxWidth:112, cursor:'pointer', borderRadius:12, overflow:'hidden', flexShrink:0,
                          border: active ? '2px solid var(--profit)' : '1px solid var(--b2)',
                          background:'var(--raised)', boxShadow: active ? '0 0 18px rgba(34,197,94,0.25)' : 'none', transition:'all 0.15s',
                        }}>
                          <div style={{ position:'relative', height:84 }}>
                            <img src={s.image} alt={s.name} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e=>{ e.currentTarget.style.opacity=0 }}/>
                            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))', pointerEvents:'none' }}/>
                            {s.provider && <span style={{ position:'absolute', top:6, left:6, fontSize:7.5, fontWeight:800, padding:'2px 5px', borderRadius:4, background:'rgba(0,0,0,0.55)', color:'#fff', textTransform:'uppercase', letterSpacing:'0.04em' }}>{s.provider}</span>}
                            {active && <div style={{ position:'absolute', top:6, right:6, width:20, height:20, borderRadius:'50%', background:'var(--profit)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#012b1c" strokeWidth="3.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
                          </div>
                          <div style={{ padding:'7px 8px' }}>
                            <p style={{ fontSize:10.5, fontWeight:700, color:active?'var(--profit)':'var(--t1)', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</p>
                            {s.performance && <p style={{ fontSize:8.5, color:'var(--t4)', margin:'2px 0 0', textTransform:'capitalize' }}>{s.performance}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(215px, 1fr))', gap:1, background:'var(--b1)' }}>

                  {/* COL 1 — DADOS */}
                  <div style={{ background:'var(--surface)', padding:'16px 18px' }}>
                    <p style={colTitle}>1 · Dados</p>
                    {field('TITULO', <input className="input" value={tituloR} onChange={e=>setTituloR(e.target.value)} placeholder="1a remessa..." style={inp}/>)}
                    {field('TIPO', <select className="input" value={tipo} onChange={e=>setTipo(e.target.value)} style={inp}><option value="remessa">Remessa</option><option value="redeposito">Redeposito</option><option value="bonus">Bônus</option><option value="conta_mae">Conta Mãe</option><option value="ajuste">Ajuste</option></select>)}
                    {field('SALDO INICIAL', <input className="input" type="number" step="0.01" value={saldoIni} onChange={e=>setSaldoIni(e.target.value)} style={inp}/>)}
                    {(tipo==='bonus' || tipo==='conta_mae')
                      ? <p style={{ fontSize:10.5, color:'var(--t4)', margin:'2px 0 0', lineHeight:1.4 }}>{tipo==='bonus' ? 'Bônus não altera o número de contas — registre só o valor do saque.' : 'Conta mãe registra só depósito e saque (lucro/prejuízo) — não altera o número de contas.'}</p>
                      : field(<>CONTAS {tipo!=='redeposito' && <span style={{color:'var(--loss)'}}>*</span>}</>, <>
                      <input className="input" type="number" min="1" step="1" value={contasRemessa} onChange={e=>setContasRemessa(e.target.value)} placeholder="5" required={tipo!=='redeposito'} style={inp}/>
                      <div style={{ display:'flex', gap:4, marginTop:5 }}>
                        {[3,5,10,15,20].map(n=>(<button key={n} type="button" onClick={()=>setContasRemessa(String(n))} style={{ flex:1, padding:'4px 0', borderRadius:6, fontSize:10, fontWeight:700, cursor:'pointer', background:Number(contasRemessa)===n?'rgba(229,57,53,0.14)':'var(--fill-1)', color:Number(contasRemessa)===n?'#e53935':'var(--t4)', border:`1px solid ${Number(contasRemessa)===n?'rgba(229,57,53,0.3)':'var(--b1)'}` }}>{n}</button>))}
                      </div>
                    </>)}
                  </div>

                  {/* COL 2 — RESULTADOS */}
                  <div style={{ background:'var(--surface)', padding:'16px 18px' }}>
                    <p style={colTitle}>2 · Resultados</p>
                    {tipo!=='bonus' && field('DEPOSITO *', <input className="input" type="text" inputMode="decimal" value={dep} onChange={e=>setDep(e.target.value)} required placeholder="Ex: 1055" style={{...inp, fontWeight:700}}/>)}
                    {field(tipo==='bonus'?<span style={{color:'var(--profit)'}}>VALOR DO BÔNUS (SAQUE) *</span>:'SAQUE *', <input className="input" type="text" inputMode="decimal" value={saq} onChange={e=>setSaq(e.target.value)} required placeholder={tipo==='bonus'?'Ex: 200':'Ex: 941'} style={{...inp, fontWeight:700}}/>)}
                    {field(<>COMPROVANTES <span style={{ color:'var(--t4)', fontWeight:400, textTransform:'none' }}>(fotos dos saques — pode vários)</span></>, (
                      <div onPaste={onPasteComprovante}>
                        {comprovantes.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:7 }}>
                            {comprovantes.map((item, ci) => { const f = normFoto(item); return (
                              <div key={ci} style={{ position:'relative' }}>
                                <a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={`comprovante ${ci+1}`} style={{ width:64, height:64, objectFit:'cover', borderRadius:6, border:'1px solid var(--b2)', display:'block' }}/></a>
                                {f.ts && !f.burned && <span style={{ position:'absolute', bottom:2, left:2, padding:'1px 4px', borderRadius:4, background:'rgba(229,57,53,0.92)', color:'#fff', fontSize:7.5, fontWeight:800, fontFamily:'var(--mono, monospace)', lineHeight:1.2, letterSpacing:'-0.02em' }}>{fmtFotoTs(f.ts)}</span>}
                                <button type="button" onClick={()=>setComprovantes(prev=>prev.filter((_,i)=>i!==ci))} title="Remover"
                                  style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', border:'1px solid var(--b2)', background:'#1a1a1a', color:'var(--loss)', cursor:'pointer', fontSize:11, lineHeight:'1', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>×</button>
                              </div>
                            )})}
                          </div>
                        )}
                        <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px 11px', borderRadius:8, border:'1px dashed var(--b2)', background:'var(--fill-1)', cursor: comprovanteUp?'wait':'pointer', fontSize:11.5, fontWeight:600, color:'var(--t3)' }}>
                          {comprovanteUp ? (<><div className="spinner" style={{ width:12, height:12 }}/> Enviando...</>) : (<>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            {comprovantes.length > 0 ? 'Adicionar outra foto' : 'Anexar ou colar foto'}
                          </>)}
                          <input type="file" accept="image/*" multiple onChange={e=>{ const fs=Array.from(e.target.files||[]); fs.forEach(f=>uploadComprovante(f)) }} style={{ display:'none' }}/>
                        </label>
                        {comprovanteErr && <span style={{ display:'block', fontSize:10, color:'var(--loss)', marginTop:4 }}>{comprovanteErr}</span>}
                      </div>
                    ))}
                    {isApenasBauMeta && field(<span style={{color:'var(--profit)'}}>BAU</span>, <input className="input" type="text" inputMode="decimal" value={bauR} onChange={e=>setBauR(e.target.value)} placeholder="Ex: 50" style={{...inp, borderColor:'rgba(34,197,94,0.3)'}}/>)}
                    {field('STATUS', <div style={{ display:'flex', gap:2, background:'var(--fill-1)', borderRadius:8, padding:2, border:'1px solid var(--b1)' }}>
                      {[{k:'normal',l:'Normal',c:'var(--profit)'},{k:'saque_pendente',l:'Pend.',c:'rgba(255,255,255,0.78)'},{k:'conta_bloqueada',l:'Bloq.',c:'var(--loss)'},{k:'banco_analise',l:'Anál.',c:'rgba(255,255,255,0.78)'}].map(s=>(
                        <button key={s.k} type="button" onClick={()=>setStatusProb(s.k)} style={{ flex:1, padding:'5px 2px', borderRadius:6, fontSize:9, fontWeight:600, cursor:'pointer', background:statusProb===s.k?`${s.c}1f`:'transparent', color:statusProb===s.k?s.c:'var(--t4)', border:'none' }}>{s.l}</button>
                      ))}
                    </div>)}
                    {field('NOTAS', <input className="input" value={obsRemessa} onChange={e=>setObsRemessa(e.target.value)} placeholder="Opcional..." style={inp}/>)}
                  </div>

                  {/* COL 3 — RESUMO AO VIVO */}
                  <div style={{ background:'rgba(0,0,0,0.22)', padding:'16px 18px', display:'flex', flexDirection:'column' }}>
                    <p style={colTitle}>3 · Resumo ao vivo</p>
                    <div style={{ textAlign:'center', padding:'14px 0 10px' }}>
                      <p style={{ fontSize:9, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 6px', fontWeight:700 }}>Resultado parcial</p>
                      <p style={{ fontFamily:'var(--mono)', fontSize:34, fontWeight:900, color: hasInput?col:'var(--t4)', margin:0, letterSpacing:'-0.03em', lineHeight:1 }}>
                        {hasInput ? `${prev.diff>=0?'+':'−'}R$ ${fmt(Math.abs(prev.diff))}` : '—'}
                      </p>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1, background:'var(--b1)', borderRadius:10, overflow:'hidden', border:'1px solid var(--b1)', marginBottom:12 }}>
                      {[
                        { l:'Por conta', v: hasInput&&contasN>0?`${porConta>=0?'+':'−'}${fmt(Math.abs(porConta))}`:'—' },
                        { l:'ROI', v: hasInput&&depN>0?`${roi>=0?'+':'−'}${Math.abs(roi).toFixed(0)}%`:'—' },
                        { l:'Contas', v: contasN||'—' },
                      ].map((s,i)=>(<div key={i} style={{ background:'var(--surface)', padding:'10px 6px', textAlign:'center' }}><p style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:800, color:'var(--t1)', margin:0 }}>{s.v}</p><p style={{ fontSize:8, color:'var(--t4)', margin:'3px 0 0', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.l}</p></div>))}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'9px', borderRadius:10, marginBottom:14, background: hasInput?`${col}14`:'var(--fill-1)', border:`1px solid ${hasInput?col+'40':'var(--b1)'}` }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background: hasInput?col:'var(--t4)' }}/>
                      <span style={{ fontSize:11.5, fontWeight:700, color: hasInput?col:'var(--t4)' }}>{!hasInput?'Aguardando dados':prev.diff>0?'Operação positiva':prev.diff<0?'Operação negativa':'Operação neutra'}</span>
                    </div>
                    {error && <div className="alert-error" style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, marginBottom:10 }}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
                    <button type="submit" className="btn btn-profit" disabled={salvando||!saq||(tipo!=='bonus'&&!dep)||(tipo!=='redeposito'&&tipo!=='bonus'&&tipo!=='conta_mae'&&(!contasRemessa||Number(contasRemessa)<=0))} style={{ width:'100%', padding:'13px', fontSize:13.5, fontWeight:800, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', gap:7, marginTop:'auto' }}>
                      {salvando ? (<><div className="spinner" style={{ width:13, height:13, borderTopColor:'#012b1c' }}/> Registrando...</>) : (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> {tipo==='bonus'?'Registrar bônus':'Registrar remessa'}</>)}
                    </button>
                  </div>

                </div>
              </form>
            </div>
            )
          })() : (
          <div className="card a2" style={{ padding:0, overflow:'hidden' }}>
            {/* Header compacto */}
            <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>Registrar remessa</span>
              </div>
              <span style={{ fontSize:9, color:'var(--t4)' }}>Remessa #{remessas.length + 1}</span>
            </div>

            <form onSubmit={handleAdd}>
              {/* BLOCO 1 — Dados */}
              <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--b1)' }}>
                <div className="g-form" style={{ display:'grid', gridTemplateColumns:'1.5fr 0.8fr 0.8fr 1fr', gap:8 }}>
                  <div>
                    <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>TITULO</label>
                    <input className="input" value={tituloR} onChange={e=>setTituloR(e.target.value)} placeholder="1a remessa..." style={{ fontSize:12, padding:'8px 10px' }}/>
                  </div>
                  <div>
                    <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>TIPO</label>
                    <select className="input" value={tipo} onChange={e=>setTipo(e.target.value)} style={{ fontSize:12, padding:'8px 10px' }}>
                      <option value="remessa">Remessa</option>
                      <option value="redeposito">Redeposito</option>
                      <option value="conta_mae">Conta Mãe</option>
                      <option value="ajuste">Ajuste</option>
                    </select>
                  </div>
                  <div>
                    <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>SALDO INI.</label>
                    <input className="input" type="number" step="0.01" value={saldoIni} onChange={e=>setSaldoIni(e.target.value)} style={{ fontSize:12, padding:'8px 10px' }}/>
                  </div>
                  <div>
                    <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>CONTAS {tipo !== 'redeposito' && tipo !== 'conta_mae' && <span style={{color:'var(--loss)'}}>*</span>}</label>
                    <input className="input" type="number" min="1" step="1" value={contasRemessa} onChange={e=>setContasRemessa(e.target.value)} placeholder={tipo==='conta_mae'?'—':'5'} required={tipo !== 'redeposito' && tipo !== 'conta_mae'} style={{ fontSize:12, padding:'8px 10px' }}/>
                    <div style={{ display:'flex', gap:3, marginTop:4 }}>
                      {[3,5,10,15,20].map(n=>(
                        <button key={n} type="button" onClick={()=>setContasRemessa(String(n))} style={{
                          flex:1, padding:'3px 0', borderRadius:5, fontSize:9, fontWeight:700, cursor:'pointer',
                          background: Number(contasRemessa)===n ? 'rgba(229,57,53,0.12)' : 'rgba(255,255,255,0.03)',
                          color: Number(contasRemessa)===n ? '#e53935' : 'var(--t4)',
                          border: `1px solid ${Number(contasRemessa)===n ? 'rgba(229,57,53,0.25)' : 'var(--b1)'}`,
                          transition:'all 0.15s',
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCO 2 — Valores + Resultado */}
              <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--b1)' }}>
                <div className="g-form" style={{ display:'grid', gridTemplateColumns: isApenasBauMeta ? '1fr 1fr 1fr 1.3fr' : '1fr 1fr 1.3fr', gap:8, alignItems:'end' }}>
                  <div>
                    <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>DEPOSITO *</label>
                    <input className="input" type="text" inputMode="decimal" value={dep} onChange={e=>setDep(e.target.value)} required placeholder="Ex: 1055" style={{ fontSize:13, fontWeight:600, padding:'8px 10px' }}/>
                  </div>
                  <div>
                    <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>SAQUE *</label>
                    <input className="input" type="text" inputMode="decimal" value={saq} onChange={e=>setSaq(e.target.value)} required placeholder="Ex: 941" style={{ fontSize:13, fontWeight:600, padding:'8px 10px' }}/>
                  </div>
                  {isApenasBauMeta && (
                    <div>
                      <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8, color:'var(--profit)' }}>BAU</label>
                      <input className="input" type="text" inputMode="decimal" value={bauR} onChange={e=>setBauR(e.target.value)} placeholder="Ex: 50" style={{ fontSize:13, fontWeight:600, padding:'8px 10px', borderColor:'rgba(209,250,229,0.25)' }}/>
                    </div>
                  )}
                  {(dep||saq||(isApenasBauMeta && bauR)) ? (
                    <div style={{
                      padding:'8px 14px', borderRadius:8,
                      background:prev.pos?'rgba(209,250,229,0.06)':'rgba(239,68,68,0.06)',
                      border:`1px solid ${prev.pos?'rgba(209,250,229,0.12)':'rgba(239,68,68,0.12)'}`,
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                    }}>
                      <div>
                        <p style={{ fontSize:8, fontWeight:700, color:prev.pos?'var(--profit)':'var(--loss)', margin:0, textTransform:'uppercase' }}>{prev.pos?'Lucro':'Prejuizo'}</p>
                        {isApenasBauMeta && prev.bauAdd > 0 && (
                          <p style={{ fontSize:8, color:'var(--profit)', margin:'1px 0 0' }}>inclui BAU +R$ {fmt(prev.bauAdd)}</p>
                        )}
                        {Number(contasRemessa||0) > 0 && <p style={{ fontSize:8, color:'var(--t4)', margin:'1px 0 0' }}>R$ {fmt(Math.abs(prev.diff)/Number(contasRemessa))}/conta</p>}
                      </div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:18, fontWeight:900, color:prev.pos?'var(--profit)':'var(--loss)' }}>
                        {prev.pos?'+':'\u2212'}R$ {fmt(Math.abs(prev.diff))}
                      </span>
                    </div>
                  ) : (
                    <div style={{ padding:'8px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', minHeight:38 }}>
                      <span style={{ fontSize:10, color:'var(--t4)' }}>Resultado</span>
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 3 — Status + Obs + Slot + Botao */}
              <div style={{ padding:'12px 20px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div className="g-form" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>STATUS</label>
                      <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.02)', borderRadius:7, padding:2, border:'1px solid var(--b1)' }}>
                        {[
                          { k:'normal', l:'Normal', c:'var(--profit)' },
                          { k:'saque_pendente', l:'Pendente', c:'rgba(255,255,255,0.78)' },
                          { k:'conta_bloqueada', l:'Bloqueada', c:'var(--loss)' },
                          { k:'banco_analise', l:'Analise', c:'rgba(255,255,255,0.78)' },
                        ].map(s=>(
                          <button key={s.k} type="button" onClick={()=>setStatusProb(s.k)} style={{
                            flex:1, padding:'5px 2px', borderRadius:5, fontSize:8, fontWeight:600, cursor:'pointer',
                            background: statusProb===s.k ? `${s.c}15` : 'transparent',
                            color: statusProb===s.k ? s.c : 'var(--t4)',
                            border:'none', transition:'all 0.15s',
                          }}>{s.l}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>NOTAS</label>
                      <input className="input" value={obsRemessa} onChange={e=>setObsRemessa(e.target.value)} placeholder="Opcional..." style={{ fontSize:11, padding:'8px 10px' }}/>
                    </div>
                  </div>

                  {/* Slots compacto */}
                  {tenantSlots.length > 0 && (
                    <div>
                      <label className="t-label" style={{ display:'block', marginBottom:4, fontSize:8 }}>SLOT</label>
                      <div style={{ position:'relative' }}>
                        <button type="button" onClick={()=>{const el=document.getElementById('slot-scroll');if(el)el.scrollBy({left:-160,behavior:'smooth'})}}
                          style={{ position:'absolute',left:-2,top:'50%',transform:'translateY(-50%)',zIndex:2,width:24,height:24,borderRadius:6,border:'1px solid rgba(229,57,53,0.2)',background:'rgba(229,57,53,0.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#e53935' }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button type="button" onClick={()=>{const el=document.getElementById('slot-scroll');if(el)el.scrollBy({left:160,behavior:'smooth'})}}
                          style={{ position:'absolute',right:-2,top:'50%',transform:'translateY(-50%)',zIndex:2,width:24,height:24,borderRadius:6,border:'1px solid rgba(229,57,53,0.2)',background:'rgba(229,57,53,0.06)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#e53935' }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                        <div id="slot-scroll" style={{ display:'flex',gap:6,overflowX:'auto',scrollbarWidth:'none',padding:'0 24px',scrollSnapType:'x mandatory' }}>
                          <style>{`#slot-scroll::-webkit-scrollbar{display:none}`}</style>
                          {tenantSlots.map(name=>{
                            const slug=name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'e').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
                            const active=selectedSlot===name
                            return (
                              <div key={name} onClick={()=>setSelectedSlot(active?'':name)} style={{
                                minWidth:76,maxWidth:76,cursor:'pointer',borderRadius:8,padding:5,textAlign:'center',
                                border:active?'2px solid var(--profit)':'1px solid var(--b2)',
                                background:active?'var(--profit-dim)':'var(--raised)',
                                transition:'all 0.15s',flexShrink:0,scrollSnapAlign:'start',
                              }}>
                                <img src={`/slots/${slug}.webp`} alt={name} style={{width:'100%',height:52,objectFit:'cover',borderRadius:6,marginBottom:3}} onError={e=>{e.currentTarget.style.display='none'}}/>
                                <p style={{fontSize:8,fontWeight:600,color:active?'var(--profit)':'var(--t4)',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <div className="alert-error" style={{display:'flex',alignItems:'center',gap:6,fontSize:11}}><svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

                  {/* Botao registrar */}
                  <button type="submit" className="btn btn-profit" disabled={salvando||!dep||!saq||(tipo!=='redeposito'&&tipo!=='conta_mae'&&(!contasRemessa||Number(contasRemessa)<=0))}
                    style={{ width:'100%',padding:'12px',fontSize:13,fontWeight:700,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                    {salvando ? (
                      <><div className="spinner" style={{width:12,height:12,borderTopColor:'#012b1c'}}/> Registrando...</>
                    ) : (
                      <><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Registrar remessa</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
          )}

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

          <BettifySponsor pitch="Proxy acabando trava a operação — garanta GB na Bettify." style={{ marginBottom: 18 }} />

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
                  <motion.div key={r.id}
                    initial={{ opacity:0, x:-12 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ duration:0.3, delay:i*0.04, ease:[0.33,1,0.68,1] }}
                    whileHover={{ x:4, boxShadow:`0 4px 20px ${pos?'rgba(209,250,229,0.08)':'rgba(239,68,68,0.08)'}`, borderColor:pos?'rgba(209,250,229,0.2)':'rgba(239,68,68,0.2)', transition:{duration:0.15} }}
                    className="row-card" style={{ padding:'16px 20px', cursor:'default' }}>
                    <div className="accent" style={{ background:pos?'linear-gradient(180deg,var(--profit),#04b876)':'linear-gradient(180deg,var(--loss),#c0294e)', boxShadow:pos?'0 0 8px rgba(209,250,229,0.15)':'0 0 8px rgba(239,68,68,0.15)' }}/>
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
                          <p className="t-small">{r.tipo==='conta_mae'?'Conta Mãe':r.tipo==='redeposito'?'Redepósito':r.tipo==='bonus'?'Bônus':r.tipo} · {new Date(r.created_at).toLocaleString('pt-BR')}</p>
                          {r.slot_name && <span style={{ display:'inline-block', marginTop:3, padding:'2px 8px', borderRadius:6, fontSize:9, fontWeight:600, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'var(--info)' }}>{r.slot_name}</span>}
                          {r.observacoes && <p style={{ fontSize:11, color:'var(--t4)', margin:'4px 0 0', fontStyle:'italic' }}>{r.observacoes}</p>}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ textAlign:'right' }}>
                            <p className="t-num" style={{ fontSize:20,fontWeight:800,color:pos?'var(--profit)':'var(--loss)' }}>
                              {pos?'+':'−'}R$ {fmt(Math.abs(Number(r.resultado||0)))}
                            </p>
                            <p className="t-small">R$ {fmt(r.resultado_por_conta)} / conta</p>
                          </div>
                          <button onClick={()=>{setEditRem(r);setEditDep(String(r.deposito||''));setEditSaq(String(r.saque||''));setEditBau(String(r.bau||''));setEditContas(String(r.contas_remessa||''))}} style={{width:28,height:28,borderRadius:7,border:'1px solid var(--b2)',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:0.4,transition:'opacity 0.15s',flexShrink:0}}
                            onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.4'}>
                            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--t2)" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={()=>deleteRemessa(r.id)} style={{width:28,height:28,borderRadius:7,border:'1px solid rgba(239,68,68,0.15)',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:0.4,transition:'opacity 0.15s',flexShrink:0}}
                            onMouseEnter={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.background='rgba(239,68,68,0.08)'}} onMouseLeave={e=>{e.currentTarget.style.opacity='0.4';e.currentTarget.style.background='transparent'}}>
                            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:`repeat(${isApenasBauMeta ? 5 : 4},1fr)`, gap:8 }}>
                        {[
                          { l:'Saldo ini.',  v:r.saldo_inicial, c:'var(--t2)' },
                          { l:'Depósito',    v:r.deposito,      c:'var(--t2)' },
                          { l:'Saque',       v:r.saque,         c:'var(--t2)' },
                          ...(isApenasBauMeta ? [{ l:'BAU', v:r.bau, c:'var(--profit)' }] : []),
                          { l:'Por conta',   v:r.resultado_por_conta, c:pos?'var(--profit)':'var(--loss)' },
                        ].map(({l,v,c})=>(
                          <div key={l} style={{ background:'var(--void)', border:'1px solid var(--b1)', borderRadius:8, padding:'8px 12px' }}>
                            <p className="t-label" style={{ fontSize:9, marginBottom:4 }}>{l}</p>
                            <p className="t-num" style={{ fontSize:12, color:c }}>R$ {fmt(v)}</p>
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const fotos = (Array.isArray(r.comprovantes) && r.comprovantes.length) ? r.comprovantes : (r.comprovante_url ? [r.comprovante_url] : [])
                        if (!fotos.length) return null
                        return (
                          <div style={{ marginTop:10 }}>
                            <p style={{ fontSize:9, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700, margin:'0 0 5px' }}>Comprovante{fotos.length>1?`s (${fotos.length})`:''} dos saques</p>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                              {fotos.map((item, fi) => { const f = normFoto(item); const ts = f.ts || r.created_at; return (
                                <a key={fi} href={f.url} target="_blank" rel="noreferrer" title={`Comprovante ${fi+1}`} style={{ position:'relative', display:'block' }}>
                                  <img src={f.url} alt={`comprovante ${fi+1}`} style={{ width:72, height:72, objectFit:'cover', borderRadius:6, border:'1px solid var(--b2)', display:'block' }}/>
                                  {ts && !f.burned && <span style={{ position:'absolute', bottom:2, left:2, padding:'1px 4px', borderRadius:4, background:'rgba(229,57,53,0.92)', color:'#fff', fontSize:8, fontWeight:800, fontFamily:'var(--mono, monospace)', lineHeight:1.2 }}>{fmtFotoTs(ts)}</span>}
                                </a>
                              )})}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </motion.div>
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
            <p className="t-small" style={{marginBottom:20}}>{editRem.titulo} · Anterior: D: R$ {fmt(editRem.deposito)} / S: R$ {fmt(editRem.saque)} / BAU: R$ {fmt(editRem.bau)}</p>
            <div style={{display:'grid',gridTemplateColumns: editRem.tipo === 'bonus' ? '1fr' : '1fr 1fr',gap:12,marginBottom:12}}>
              {editRem.tipo !== 'bonus' && (
                <div>
                  <label className="t-label" style={{display:'block',marginBottom:6}}>Deposito *</label>
                  <input className="input" type="number" step="0.01" value={editDep} onChange={e=>setEditDep(e.target.value)} placeholder="0,00"/>
                </div>
              )}
              <div>
                <label className="t-label" style={{display:'block',marginBottom:6}}>{editRem.tipo === 'bonus' ? 'Valor do bônus (saque) *' : 'Saque *'}</label>
                <input className="input" type="number" step="0.01" value={editSaq} onChange={e=>setEditSaq(e.target.value)} placeholder="0,00"/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns: (editRem.tipo === 'redeposito' || editRem.tipo === 'bonus' || editRem.tipo === 'conta_mae') ? '1fr' : '1fr 1fr',gap:12,marginBottom:16}}>
              <div>
                <label className="t-label" style={{display:'block',marginBottom:6}}>BAU</label>
                <input className="input" type="number" step="0.01" value={editBau} onChange={e=>setEditBau(e.target.value)} placeholder="0,00"/>
              </div>
              {editRem.tipo !== 'redeposito' && editRem.tipo !== 'bonus' && editRem.tipo !== 'conta_mae' && (
                <div>
                  <label className="t-label" style={{display:'block',marginBottom:6}}>Contas *</label>
                  <input className="input" type="number" min="1" step="1" value={editContas} onChange={e=>setEditContas(e.target.value)} placeholder="Ex: 5"/>
                </div>
              )}
            </div>
            {(editDep||editSaq) && (()=>{
              const d=Number(editDep||0),s=Number(editSaq||0),diff=s-d
              return (
                <div style={{padding:'12px 14px',borderRadius:12,background:diff>=0?'rgba(209,250,229,0.06)':'rgba(239,68,68,0.06)',border:`1px solid ${diff>=0?'rgba(209,250,229,0.12)':'rgba(239,68,68,0.12)'}`,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12,color:'var(--t2)'}}>Novo resultado</span>
                  <span className="t-num" style={{fontSize:18,fontWeight:800,color:diff>=0?'var(--profit)':'var(--loss)'}}>{diff>=0?'+':''}R$ {fmt(diff)}</span>
                </div>
              )
            })()}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setEditRem(null)} className="btn btn-ghost" style={{flex:1}}>Cancelar</button>
              <button onClick={saveEditRem} disabled={editSaving||!editSaq||(editRem.tipo!=='bonus'&&!editDep)||(editRem.tipo!=='redeposito'&&editRem.tipo!=='bonus'&&editRem.tipo!=='conta_mae'&&(!editContas||Number(editContas)<1))} className="btn btn-brand" style={{flex:2}}>
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
        const bauAcumRemessas = remessas.reduce((a,r)=>a+Number(r.bau||0),0)
        return (
        <AdminCloseModal
          meta={meta} lucroAcum={lucroAcum} prejAcum={prejAcum} liqAcum={liqAcum}
          bauAcumRemessas={bauAcumRemessas}
          tenantOpModel={tenantOpModel}
          onClose={()=>setShowAdminClose(false)}
          onSaved={async ()=>{ setShowAdminClose(false); setNetShareState('idle'); await fetchData(); if (isAdminV2) setShowFinalePopup(true) }}
        />
        )
      })()}

      {/* ═══ POPUP FINALIZACAO — APENAS OPERADOR ═══ */}
      <AnimatePresence>
        {showFinalePopup && meta && (() => {
          const totalDep = remessas.reduce((a,r) => a + Number(r.deposito||0), 0)
          const totalSaq = remessas.reduce((a,r) => a + Number(r.saque||0), 0)
          const totalLucro = remessas.reduce((a,r) => a + Number(r.lucro||0), 0)
          const totalPrej = remessas.reduce((a,r) => a + Number(r.prejuizo||0), 0)
          const liq = totalLucro - totalPrej
          const contasDone = remessas.filter(r=>r.tipo!=='redeposito').reduce((a,r)=>a+Number(r.contas_remessa||0),0)
          const nContas = Number(meta.quantidade_contas||0)
          const avgPerRemessa = remessas.length > 0 ? liq / remessas.length : 0
          const avgPerConta = contasDone > 0 ? liq / contasDone : 0
          const pctConclusao = nContas > 0 ? Math.min(Math.round((contasDone/nContas)*100),100) : 0
          const positivas = remessas.filter(r=>Number(r.resultado||0)>=0).length
          const taxaAcerto = remessas.length > 0 ? Math.round((positivas/remessas.length)*100) : 0

          // Insights — linguagem natural, contextual
          const insights = []
          let streak = 0
          const ord = [...remessas].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))
          for (let i = ord.length-1; i >= 0; i--) { if (Number(ord[i].resultado||0)<0) streak++; else break }

          if (liq > 0) insights.push({ text: `Resultado acima do padrao — meta encerrou no positivo com R$ ${fmt(liq)}`, type: 'good' })
          else if (avgPerConta >= -5) insights.push({ text: `Desempenho solido: R$ ${fmt(Math.abs(avgPerConta))}/conta — resultado dentro do aceitavel`, type: 'good' })
          else if (avgPerConta >= -10) insights.push({ text: `Resultado abaixo do ideal: R$ ${fmt(Math.abs(avgPerConta))}/conta de media`, type: 'warn' })
          else insights.push({ text: `Media de R$ ${fmt(Math.abs(avgPerConta))}/conta — acima do limite recomendado`, type: 'critical' })

          if (taxaAcerto >= 60) insights.push({ text: `Consistencia alta — ${taxaAcerto}% das remessas com resultado positivo`, type: 'good' })
          else if (taxaAcerto >= 40) insights.push({ text: `Resultados variaram — ${taxaAcerto}% de aproveitamento nas remessas`, type: 'warn' })
          else if (remessas.length >= 3) insights.push({ text: `Aproveitamento baixo — apenas ${taxaAcerto}% das remessas positivas`, type: 'critical' })

          if (streak >= 3) insights.push({ text: `Encerrou com sequencia negativa de ${streak} remessas — padrão a observar`, type: 'warn' })
          else if (streak === 0 && remessas.length >= 3) insights.push({ text: 'Ultima remessa foi positiva — bom fechamento', type: 'good' })

          if (pctConclusao >= 100) insights.push({ text: `Execucao completa — ${contasDone} de ${nContas} contas processadas`, type: 'good' })
          else if (pctConclusao >= 70) insights.push({ text: `${pctConclusao}% executado — ${nContas - contasDone} contas restantes`, type: 'good' })
          else if (pctConclusao > 0) insights.push({ text: `Meta parcial — ${contasDone} de ${nContas} contas (${pctConclusao}%)`, type: 'warn' })

          // Melhorias — contextuais e praticas
          const melhorias = []
          if (avgPerConta < -8) melhorias.push('Reduzir variacao de resultado por conta nas proximas metas')
          if (streak >= 2) melhorias.push('Diversificar slots quando identificar sequencia negativa')
          if (pctConclusao < 80 && pctConclusao > 0) melhorias.push('Aumentar volume de contas processadas por meta')
          if (remessas.length > 0) {
            const tempos = ord.map(r=>new Date(r.created_at).getTime())
            if (tempos.length >= 2) {
              const gaps = tempos.slice(1).map((t,i)=>t-tempos[i])
              const avgGap = gaps.reduce((a,g)=>a+g,0)/gaps.length
              if (avgGap > 4*60*60*1000) melhorias.push('Aumentar ritmo — intervalos longos entre remessas')
              else if (avgGap < 0.5*60*60*1000 && taxaAcerto < 50) melhorias.push('Desacelerar — ritmo rapido com baixo aproveitamento')
            }
          }
          if (taxaAcerto < 50 && taxaAcerto > 0) melhorias.push('Manter consistencia entre remessas na proxima meta')
          if (melhorias.length === 0) melhorias.push('Operacao dentro do padrao — manter estrategia atual')

          const cfgI = { good:'var(--profit)', warn:'var(--warn)', critical:'var(--loss)' }

          // Timing sequence: 0→150→300→400→700→900→1100→1300ms
          const T = { overlay:0, card:0.15, header:0.3, result:0.5, metrics:0.6, insights:0.9, improve:1.1, cta:1.3 }
          const glowColor = liq >= 0 ? '34,197,94' : '239,68,68'

          // ══ PREMIUM (SO ADMIN) — modal de resultado + certificado/baixar imagem.
          //    Operador cai no modal original abaixo (sem salario/bau/custos). ══
          if (isAdminV2) {
            // Resultado FINAL real: usa meta.lucro_final (inclui salario/bau/custos)
            // quando a meta esta fechada; senao o resultado das remessas.
            const liqFinal = (meta.lucro_final != null && meta.status_fechamento === 'fechada') ? Number(meta.lucro_final) : liq
            const isLucro = liqFinal >= 0
            const roi = totalDep > 0 ? (liqFinal / totalDep) * 100 : 0
            const avgFinal = contasDone > 0 ? liqFinal / contasDone : 0
            const glowF = isLucro ? '34,197,94' : '229,57,53'
            const dataStr = new Date().toLocaleDateString('pt-BR')
            const salario = Number(meta.salario_plataforma || 0)
            const custos = Number(meta.gastos_operacionais || 0)
            const bauMeta = Number(meta.bau || totais.bau || 0)
            const goPanel = () => { setShowFinalePopup(false); router.push(homePath) }
            const redeStr = (meta.rede || meta.plataforma || 'OPERAÇÃO').toString()

            // Gera o certificado (canvas) e devolve via callback — reusado pelo "Baixar imagem"
            // e pelo "Compartilhar no Network" (posta a imagem no canal Resultados).
            const renderCert = (done) => {
              try {
                const W = 1080, H = 1350
                const c = document.createElement('canvas'); c.width = W; c.height = H
                const x = c.getContext('2d')
                const RED = '#e53935'
                const accent = isLucro ? '34,197,94' : '229,57,53'      // verde lucro / vermelho perda
                const accentHex = isLucro ? '#22C55E' : '#ef4444'
                const rede = redeStr.toUpperCase()
                const money = (n) => `R$ ${fmt(Math.abs(n))}`
                const signed = (n) => `${n >= 0 ? '+' : '−'}${money(n)}`
                // helper rounded-rect
                const rr = (x0, y0, w, h, r) => { x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath() }

                const draw = (logo) => {
                  // ---- fundo profundo NexControl ----
                  x.fillStyle = '#06080c'; x.fillRect(0, 0, W, H)
                  // vinheta radial sutil
                  const vg = x.createRadialGradient(W / 2, 560, 80, W / 2, 560, 820)
                  vg.addColorStop(0, `rgba(${accent},0.16)`); vg.addColorStop(0.55, `rgba(${accent},0.04)`); vg.addColorStop(1, 'rgba(0,0,0,0)')
                  x.fillStyle = vg; x.fillRect(0, 0, W, H)
                  // grão de escurecimento nas bordas
                  const eg = x.createRadialGradient(W / 2, H / 2, 360, W / 2, H / 2, 820)
                  eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,0.55)')
                  x.fillStyle = eg; x.fillRect(0, 0, W, H)

                  // ---- moldura premium ----
                  const M = 48
                  rr(M, M, W - M * 2, H - M * 2, 34)
                  const fg = x.createLinearGradient(0, M, 0, H - M)
                  fg.addColorStop(0, `rgba(${accent},0.45)`); fg.addColorStop(0.5, 'rgba(255,255,255,0.08)'); fg.addColorStop(1, `rgba(${accent},0.18)`)
                  x.strokeStyle = fg; x.lineWidth = 1.5; x.stroke()
                  // realce superior interno
                  x.strokeStyle = 'rgba(255,255,255,0.06)'; x.lineWidth = 1
                  rr(M + 7, M + 7, W - (M + 7) * 2, H - (M + 7) * 2, 28); x.stroke()

                  x.textAlign = 'center'

                  // ---- logo oficial (icon + wordmark NexControl) ----
                  const logoY = 150, iconSz = 52, gap = 15
                  x.font = '800 38px Inter, sans-serif'
                  const w1 = x.measureText('Nex').width, w2 = x.measureText('Control').width
                  const hasIcon = !!logo
                  const groupW = (hasIcon ? iconSz + gap : 0) + w1 + w2
                  let cur = (W - groupW) / 2
                  if (hasIcon) { x.drawImage(logo, cur, logoY - iconSz / 2, iconSz, iconSz); cur += iconSz + gap }
                  x.textAlign = 'left'; x.textBaseline = 'middle'
                  x.fillStyle = '#fff'; x.fillText('Nex', cur, logoY + 1)
                  x.fillStyle = RED; x.fillText('Control', cur + w1, logoY + 1)
                  x.textBaseline = 'alphabetic'; x.textAlign = 'center'

                  // ---- pill META FINALIZADA · REDE ----
                  x.font = '700 17px Inter, sans-serif'
                  const tag = `META FINALIZADA · ${rede}`
                  const tagW = x.measureText(tag).width
                  const ph = 38, pw = tagW + 60, px = (W - pw) / 2, py = 198
                  rr(px, py, pw, ph, ph / 2)
                  x.fillStyle = `rgba(${accent},0.10)`; x.fill()
                  x.strokeStyle = `rgba(${accent},0.32)`; x.lineWidth = 1; x.stroke()
                  // dot
                  x.beginPath(); x.arc(px + 26, py + ph / 2, 4.5, 0, Math.PI * 2); x.fillStyle = accentHex; x.fill()
                  x.fillStyle = 'rgba(255,255,255,0.82)'; x.fillText(tag, (W / 2) + 11, py + ph / 2 + 6)

                  // ---- HERO: resultado gigante ----
                  x.fillStyle = 'rgba(255,255,255,0.46)'; x.font = '600 26px Inter, sans-serif'
                  x.fillText(isLucro ? 'LUCRO LÍQUIDO' : 'PREJUÍZO', W / 2, 372)
                  // glow do número
                  x.save()
                  x.shadowColor = `rgba(${accent},0.55)`; x.shadowBlur = 60
                  x.fillStyle = accentHex; x.font = '900 132px Inter, sans-serif'
                  x.fillText(signed(liqFinal), W / 2, 512)
                  x.restore()
                  x.fillStyle = 'rgba(255,255,255,0.4)'; x.font = '500 24px Inter, sans-serif'
                  x.fillText('Resultado líquido da operação', W / 2, 568)

                  // ---- painel de métricas em glass ----
                  const panX = 96, panY = 640, panW = W - panX * 2, panH = 318
                  rr(panX, panY, panW, panH, 24)
                  const pgrad = x.createLinearGradient(0, panY, 0, panY + panH)
                  pgrad.addColorStop(0, 'rgba(255,255,255,0.045)'); pgrad.addColorStop(1, 'rgba(255,255,255,0.015)')
                  x.fillStyle = pgrad; x.fill()
                  x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1; x.stroke()

                  const cellMetric = (cx, cy, label, value, vcolor) => {
                    x.fillStyle = vcolor || '#fff'; x.font = '800 40px Inter, sans-serif'; x.fillText(value, cx, cy)
                    x.fillStyle = 'rgba(255,255,255,0.38)'; x.font = '600 17px Inter, sans-serif'; x.fillText(label, cx, cy + 36)
                  }
                  const colX = [panX + panW * 0.1665, panX + panW * 0.5, panX + panW * 0.8335]
                  // divisores verticais
                  x.strokeStyle = 'rgba(255,255,255,0.06)'; x.lineWidth = 1
                  ;[panX + panW / 3, panX + (panW / 3) * 2].forEach(vx => { x.beginPath(); x.moveTo(vx, panY + 36); x.lineTo(vx, panY + panH / 2 - 24); x.stroke() })
                  // divisor horizontal
                  x.beginPath(); x.moveTo(panX + 40, panY + panH / 2); x.lineTo(panX + panW - 40, panY + panH / 2); x.stroke()
                  ;[panX + panW / 3, panX + (panW / 3) * 2].forEach(vx => { x.beginPath(); x.moveTo(vx, panY + panH / 2 + 24); x.lineTo(vx, panY + panH - 36); x.stroke() })
                  // linha 1
                  const r1y = panY + 88
                  cellMetric(colX[0], r1y, 'CONTAS', String(contasDone))
                  cellMetric(colX[1], r1y, 'REMESSAS', String(remessas.length))
                  cellMetric(colX[2], r1y, 'LUCRO / CONTA', signed(avgFinal), accentHex)
                  // linha 2
                  const r2y = panY + panH / 2 + 88
                  cellMetric(colX[0], r2y, 'DEPOSITADO', money(totalDep))
                  cellMetric(colX[1], r2y, 'ROI', `${roi >= 0 ? '+' : '−'}${Math.abs(roi).toFixed(0)}%`, roi >= 0 ? accentHex : '#ef4444')
                  cellMetric(colX[2], r2y, 'TAXA DE ACERTO', `${Math.round(taxaAcerto)}%`)

                  // ---- data ----
                  x.fillStyle = 'rgba(255,255,255,0.32)'; x.font = '600 18px Inter, sans-serif'
                  x.fillText(`EMITIDO EM ${dataStr}`, W / 2, 1040)

                  // ---- assinatura / tagline ----
                  x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 1
                  x.beginPath(); x.moveTo(W / 2 - 150, 1098); x.lineTo(W / 2 + 150, 1098); x.stroke()
                  x.save()
                  x.shadowColor = `rgba(${accent},0.4)`; x.shadowBlur = 22
                  x.fillStyle = '#fff'; x.font = '800 30px Inter, sans-serif'
                  x.fillText('Controle. Precisão. Resultado.', W / 2, 1162)
                  x.restore()
                  x.fillStyle = 'rgba(255,255,255,0.3)'; x.font = '600 18px Inter, sans-serif'
                  x.fillText('nexcpa.com.br', W / 2, 1208)

                  done(c)
                }

                const img = new Image()
                img.onload = () => draw(img)
                img.onerror = () => draw(null)
                img.src = '/icons/nexcontrol-icon-clean.png'
              } catch {}
            }

            const baixarCertificado = () => renderCert(c => {
              c.toBlob(b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `nexcontrol-${redeStr.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${dataStr.replace(/\//g, '-')}.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u) })
            })

            // Compartilha o card do resultado no canal Resultados do Network (imagem + legenda).
            const compartilharNoNetwork = () => {
              if (netShareState !== 'idle') return
              setNetShareState('sharing')
              renderCert(c => {
                let dataUrl
                try { dataUrl = c.toDataURL('image/jpeg', 0.9) } catch { setNetShareState('idle'); return }
                ;(async () => {
                  try {
                    const { data: s } = await supabase.auth.getSession()
                    const token = s?.session?.access_token
                    if (!token) { setNetShareState('idle'); return }
                    const caption = `${isLucro ? '🚀 Fechei mais uma' : '📊 Operação encerrada'}${meta.rede ? ' · ' + meta.rede : ''} — ${isLucro ? '+' : '−'}R$ ${fmt(Math.abs(liqFinal))}`
                    const res = await fetch('/api/network/message', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ action: 'send', channel: 'resultados', text: caption, image: dataUrl }) })
                    if (res.ok) { setNetShareState('done') }
                    else if (res.status === 403) { setNetShareState('idle'); if (confirm('Compartilhar resultados é um recurso do Network (PRO). Assinar agora?')) router.push('/billing-mp?renewal=1') }
                    else { const e = await res.json().catch(() => ({})); alert(e.error || 'Não consegui compartilhar agora.'); setNetShareState('idle') }
                  } catch { setNetShareState('idle') }
                })()
              })
            }

            const sumItems = [
              { l: 'Contas', v: String(contasDone) },
              { l: 'Remessas', v: String(remessas.length) },
              { l: 'Depositado', v: `R$ ${fmt(totalDep)}` },
              { l: 'Sacado', v: `R$ ${fmt(totalSaq)}` },
              { l: 'Baú', v: `R$ ${fmt(bauMeta)}` },
              { l: 'Custos', v: `R$ ${fmt(custos)}` },
              { l: 'Salário', v: `R$ ${fmt(salario)}` },
            ]
            const cFinal = isLucro ? 'var(--profit)' : 'var(--loss)'

            return (
              <motion.div key="finale-v2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                onClick={e => { if (e.target === e.currentTarget) goPanel() }}>
                <div style={{ position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', width: 620, height: 420, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(${glowF},0.16), transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
                  onClick={e => e.stopPropagation()}
                  style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', borderRadius: 26, background: 'linear-gradient(180deg, var(--raised), var(--surface))', border: `1px solid rgba(${glowF},0.28)`, boxShadow: `0 50px 120px rgba(0,0,0,0.8), 0 0 70px rgba(${glowF},0.1)`, padding: '34px 28px 28px', textAlign: 'center' }}>
                  <button type="button" onClick={goPanel} aria-label="Fechar" style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--fill-1)', color: 'var(--t3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>

                  <p style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.22em', color: '#e53935', margin: '0 0 14px', textTransform: 'uppercase' }}>NexControl{meta.rede ? ` · ${meta.rede}` : ''}</p>
                  <h2 style={{ fontSize: 27, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', margin: '0 0 22px' }}>Operação finalizada</h2>

                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 6px' }}>Resultado líquido da operação</p>
                  <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                    style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(44px, 13vw, 60px)', fontWeight: 900, color: cFinal, letterSpacing: '-0.04em', margin: 0, lineHeight: 1, textShadow: `0 0 50px rgba(${glowF},0.35)` }}>
                    {isLucro ? '+' : '−'}R$ {fmt(Math.abs(liqFinal))}
                  </motion.p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 1, background: 'var(--b1)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--b1)', margin: '26px 0 14px' }}>
                    {sumItems.map((s, i) => (
                      <div key={i} style={{ background: 'var(--surface)', padding: '12px 8px' }}>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{s.v}</p>
                        <p style={{ fontSize: 9, color: 'var(--t4)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'var(--b1)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--b1)', marginBottom: 18 }}>
                    {[
                      { l: 'Lucro/conta', v: `${avgFinal >= 0 ? '+' : '−'}R$ ${fmt(Math.abs(avgFinal))}`, c: avgFinal >= 0 ? 'var(--profit)' : 'var(--loss)' },
                      { l: 'ROI', v: `${roi >= 0 ? '+' : '−'}${Math.abs(roi).toFixed(0)}%`, c: roi >= 0 ? 'var(--profit)' : 'var(--loss)' },
                      { l: 'Taxa de acerto', v: `${taxaAcerto}%`, c: taxaAcerto >= 60 ? 'var(--profit)' : taxaAcerto >= 40 ? '#FCD34D' : 'var(--loss)' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'var(--surface)', padding: '12px 6px' }}>
                        <p style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 800, color: s.c, margin: 0 }}>{s.v}</p>
                        <p style={{ fontSize: 8.5, color: 'var(--t4)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, margin: '0 0 24px' }}>
                    {isLucro ? 'Operação encerrada com lucro. Mais uma meta registrada na NexControl.' : 'Operação encerrada. Todos os dados foram registrados para análise futura.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <button type="button" onClick={baixarCertificado}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', padding: '14px', borderRadius: 13, border: 'none', cursor: 'pointer', fontSize: 14.5, fontWeight: 800, fontFamily: 'inherit', color: '#fff', background: '#e53935', boxShadow: '0 10px 28px rgba(229,57,53,0.32)' }}>
                      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                      Baixar imagem
                    </button>
                    {/* Compartilhar o resultado no Network (posta o card no canal Resultados) */}
                    <button type="button" onClick={netShareState === 'idle' ? compartilharNoNetwork : (netShareState === 'done' ? () => { setShowFinalePopup(false); router.push('/network?c=resultados') } : undefined)} disabled={netShareState === 'sharing'}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', padding: '13px', borderRadius: 13, cursor: netShareState === 'sharing' ? 'default' : 'pointer', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', color: netShareState === 'done' ? '#4ade80' : '#fff', background: netShareState === 'done' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${netShareState === 'done' ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.14)'}` }}>
                      {netShareState === 'sharing' ? (
                        <><span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> Compartilhando…</>
                      ) : netShareState === 'done' ? (
                        <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Compartilhado — ver no Network</>
                      ) : (
                        <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg> Compartilhar no Network</>
                      )}
                    </button>
                    <div style={{ display: 'flex', gap: 9 }}>
                      <button type="button" onClick={goPanel} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t1)', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit' }}>Voltar para metas</button>
                      <button type="button" onClick={() => { setShowFinalePopup(false); router.push(homePath) }} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--b2)', background: 'transparent', color: 'var(--t1)', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit' }}>Nova meta</button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )
          }

          return (
            <motion.div
              key="finale"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ position:'fixed', inset:0, zIndex:10000, background:'radial-gradient(ellipse at 50% 40%, rgba(2,4,8,0.88), rgba(2,4,8,0.95))', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
              onClick={e => { if (e.target === e.currentTarget) { setShowFinalePopup(false); router.push('/operator') } }}
            >
              {/* Ambient glow */}
              <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} transition={{duration:1,delay:0.2}}
                style={{ position:'absolute', top:'25%', left:'50%', width:500, height:500, marginLeft:-250, borderRadius:'50%', background:`radial-gradient(circle, rgba(${glowColor},0.04), transparent 65%)`, pointerEvents:'none' }} />

              <motion.div
                initial={{ opacity:0, scale:0.96, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.97 }}
                transition={{ duration:0.5, delay:T.card, ease:[0.33,1,0.68,1] }}
                onClick={e => e.stopPropagation()}
                style={{ width:'100%', maxWidth:580, maxHeight:'calc(100dvh - 32px)', overflowY:'auto', borderRadius:28, background:'linear-gradient(160deg, var(--surface), var(--surface))', border:'1px solid rgba(255,255,255,0.06)', boxShadow:`0 50px 120px rgba(0,0,0,0.8), 0 0 80px rgba(${glowColor},0.04), inset 0 1px 0 rgba(255,255,255,0.03)` }}
              >
                {/* Header */}
                <div style={{ padding:'40px 32px 28px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.04)', background:`linear-gradient(180deg, rgba(${glowColor},0.05), transparent)`, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:-50, left:'50%', marginLeft:-120, width:240, height:140, borderRadius:'50%', background:`radial-gradient(circle, rgba(${glowColor},0.1), transparent 70%)`, pointerEvents:'none' }} />

                  {/* Check icon with pulse */}
                  <motion.div
                    initial={{scale:0, rotate:-15}} animate={{scale:1, rotate:0}} transition={{delay:T.header, type:'spring', stiffness:160, damping:10}}
                    style={{ width:68, height:68, borderRadius:20, background:`linear-gradient(135deg, rgba(${glowColor},0.18), rgba(${glowColor},0.06))`, border:`1.5px solid rgba(${glowColor},0.3)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', position:'relative' }}
                  >
                    <motion.div
                      initial={{opacity:0.6,scale:1}} animate={{opacity:0,scale:1.8}}
                      transition={{delay:T.header+0.2, duration:0.8, ease:'easeOut'}}
                      style={{ position:'absolute', inset:-8, borderRadius:24, border:`2px solid rgba(${glowColor},0.2)`, pointerEvents:'none' }}
                    />
                    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={liq>=0?'var(--profit)':'var(--loss)'} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <motion.div
                      initial={{opacity:0}} animate={{opacity:[0,0.3,0]}} transition={{delay:T.header+0.1, duration:1.2}}
                      style={{ position:'absolute', inset:0, borderRadius:20, boxShadow:`0 0 40px rgba(${glowColor},0.25)`, pointerEvents:'none' }}
                    />
                  </motion.div>

                  <motion.h2 initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:T.header+0.1, duration:0.45, ease:[0.33,1,0.68,1]}} style={{ fontSize:26, fontWeight:900, color:'#fff', margin:'0 0 8px', letterSpacing:'-0.03em' }}>
                    Operacao concluida
                  </motion.h2>
                  <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:T.header+0.2, duration:0.4}} style={{ fontSize:14, color:'var(--t3)', margin:0 }}>
                    {nContas} DEP · {meta.rede || ''} · {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
                  </motion.p>
                </div>

                <div style={{ padding:'28px 32px 32px' }}>
                  {/* Resultado — CLIMAX */}
                  <motion.div
                    initial={{opacity:0,scale:0.93}} animate={{opacity:1,scale:1}}
                    transition={{delay:T.result, duration:0.5, ease:[0.33,1,0.68,1]}}
                    style={{
                      padding:'24px 28px', borderRadius:18, marginBottom:28, textAlign:'center', position:'relative', overflow:'hidden',
                      background: `linear-gradient(135deg, rgba(${glowColor},0.08), rgba(${glowColor},0.02))`,
                      border: `1px solid rgba(${glowColor},0.2)`,
                      boxShadow: `0 0 40px rgba(${glowColor},0.06)`,
                    }}
                  >
                    {/* Shine pass — once */}
                    <motion.div
                      initial={{left:'-100%'}} animate={{left:'200%'}}
                      transition={{delay:T.result+0.3, duration:0.8, ease:'easeInOut'}}
                      style={{ position:'absolute', top:0, width:'40%', height:'100%', background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', pointerEvents:'none' }}
                    />
                    <p style={{ fontSize:10, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 10px', fontWeight:600 }}>Resultado da meta</p>
                    <motion.p
                      initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
                      transition={{delay:T.result+0.15, duration:0.4, type:'spring', stiffness:200}}
                      style={{ fontSize:36, fontWeight:900, color:liq>=0?'var(--profit)':'var(--loss)', margin:0, fontFamily:'var(--mono)', letterSpacing:'-0.03em', textShadow:`0 0 40px rgba(${glowColor},0.25)` }}
                    >
                      {liq>=0?'+':''}R$ {fmt(liq)}
                    </motion.p>
                    <p style={{ fontSize:12, color:'var(--t4)', margin:'8px 0 0' }}>R$ {fmt(Math.abs(avgPerConta))}/conta · {taxaAcerto}% de acerto</p>
                  </motion.div>

                  {/* Metricas — stagger cascade */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:28 }}>
                    {[
                      { l:'Remessas', v:remessas.length, c:'var(--t1)' },
                      { l:'Contas', v:`${contasDone}/${nContas}`, c:'var(--t1)' },
                      { l:'Conclusao', v:`${pctConclusao}%`, c:pctConclusao>=80?'var(--profit)':'var(--warn)' },
                      { l:'Depositado', v:`R$ ${fmt(totalDep)}`, c:'var(--t2)' },
                      { l:'Sacado', v:`R$ ${fmt(totalSaq)}`, c:'var(--t2)' },
                      { l:'Media/remessa', v:`R$ ${fmt(Math.abs(avgPerRemessa))}`, c:avgPerRemessa>=0?'var(--profit)':'var(--t2)' },
                    ].map(({l,v,c},i) => (
                      <motion.div key={l} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:T.metrics+i*0.08, duration:0.4, ease:[0.33,1,0.68,1]}}
                        style={{ padding:'14px 16px', borderRadius:14, background:'linear-gradient(145deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))', border:'1px solid rgba(255,255,255,0.05)', textAlign:'center', cursor:'default', transition:'all 0.25s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px) scale(1.02)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.3)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow='none' }}
                      >
                        <p style={{ fontSize:9, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 6px', fontWeight:600 }}>{l}</p>
                        <p style={{ fontSize:18, fontWeight:800, color:c, margin:0, fontFamily:'var(--mono)' }}>{v}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Insights — "analysis feel" */}
                  <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:T.insights, duration:0.45}} style={{ marginBottom:24 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>Analise da operacao</span>
                      <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.78)', background:'rgba(255,255,255,0.1)', padding:'2px 7px', borderRadius:5 }}>AI</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {insights.map((ins,i) => (
                        <motion.div key={i} initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} transition={{delay:T.insights+0.1+i*0.12, duration:0.4, ease:[0.33,1,0.68,1]}}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderRadius:12, background:'linear-gradient(145deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))', border:'1px solid rgba(255,255,255,0.05)', cursor:'default', transition:'all 0.25s ease' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.transform='translateX(3px)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'; e.currentTarget.style.transform='none' }}
                        >
                          <div style={{ width:8, height:8, borderRadius:'50%', background:cfgI[ins.type], flexShrink:0, boxShadow:`0 0 10px ${cfgI[ins.type]}` }} />
                          <span style={{ fontSize:13, color:'var(--t2)', lineHeight:1.4 }}>{ins.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Melhorias */}
                  <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:T.improve, duration:0.45}} style={{ padding:'18px 20px', borderRadius:16, background:'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.12)', marginBottom:28 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--warn)' }}>Proxima meta</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {melhorias.map((m,i) => (
                        <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:T.improve+0.1+i*0.08}} style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
                          <span style={{ fontSize:12, color:'var(--t3)', lineHeight:1.4 }}>{m}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* CTA */}
                  <motion.button
                    initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:T.cta, duration:0.4}}
                    whileHover={{ scale:1.02, boxShadow:`0 10px 36px rgba(${glowColor},0.35)` }}
                    whileTap={{ scale:0.96 }}
                    onClick={() => { setShowFinalePopup(false); router.push('/operator') }}
                    style={{
                      width:'100%', padding:'16px 28px', borderRadius:14, border:'none', cursor:'pointer',
                      fontSize:15, fontWeight:700, color:'#fff',
                      background: liq>=0 ? 'linear-gradient(135deg, var(--profit), #00a06d)' : 'linear-gradient(135deg, #e53935, #c62828)',
                      boxShadow: `0 6px 24px rgba(${glowColor},0.3)`,
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    }}
                  >
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Concluido — voltar ao painel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
      </AppLayout>
    </main>
  )
}

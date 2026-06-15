'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase/client'
import AppLayout from '../../components/AppLayout'
import { validClosedMetas } from '../../lib/operator-stats'
import RankBadge from '../../components/rank/RankBadge'

const DS_MENTORIA_TENANT = '78da0085-9308-41b1-98b1-1e4c44063c51'
const REDES = ['WE','W1','VOY','91','DZ','A8','OKOK','ANJO','XW','EK','DY','777','888','WP','BRA','GAME','ALFA','KK','MK','M9','KF','PU','COROA','MANGA','AA','FP']
const COST_TYPES = [
  { id: 'proxy', label: 'Proxy' },
  { id: 'sms', label: 'SMS' },
  { id: 'instagram', label: 'Postagem Instagram' },
  { id: 'bot', label: 'Bot / Automação' },
  { id: 'vps', label: 'VPS / Servidor' },
  { id: 'outros', label: 'Outros' },
]
const costLabel = id => (COST_TYPES.find(t => t.id === id)?.label || 'Outros')

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})
const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const getInitial = p => getName(p).charAt(0).toUpperCase()
const ease = [0.33, 1, 0.68, 1]
const fadeUp = (i, base = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: base + i * 0.05, ease } })

function statusInfo(m) {
  if (m.status_fechamento === 'fechada') return { label: 'Fechada', color: 'var(--profit, #10b981)', bg: 'rgba(16,185,129,0.12)', bd: 'rgba(16,185,129,0.3)' }
  if (m.status === 'finalizada') return { label: 'Finalizada — fechar', color: '#ffd166', bg: 'rgba(255,209,102,0.12)', bd: 'rgba(255,209,102,0.32)' }
  return { label: 'Ativa', color: 'rgba(255,255,255,0.8)', bg: 'rgba(255,255,255,0.06)', bd: 'rgba(255,255,255,0.14)' }
}

/* ── Modal: criar meta (operar) ── */
function CreateMetaModal({ leaderId, operators, onClose, onCreated }) {
  const [operatorId, setOperatorId] = useState(leaderId)
  const [titulo, setTitulo] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [rede, setRede] = useState('')
  const [contas, setContas] = useState('10')
  const [obs, setObs] = useState('')
  const [link, setLink] = useState('')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!titulo.trim() || !plataforma.trim() || !rede) {
      setError(!rede ? 'Selecione a rede' : !plataforma.trim() ? 'Preencha a plataforma' : 'Preencha o título')
      return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/team/create-meta', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leader_id: leaderId, operator_id: operatorId,
          titulo, plataforma, rede, quantidade_contas: contas, observacoes: obs,
          conta_link: link, conta_login: login, conta_senha: senha,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao criar'); setSaving(false); return }
      onCreated(json.meta)
    } catch (e) { setError(e.message); setSaving(false) }
  }

  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
  }
  const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', margin: '0 0 6px' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: 'linear-gradient(180deg, #11161f, #0a0d13)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Nova meta</h3>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px' }}>Crie e opere uma meta da equipe</p>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Operador</label>
            <select value={operatorId} onChange={e => setOperatorId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value={leaderId} style={{ background: '#0c1322' }}>Eu (líder)</option>
              {operators.filter(o => o.id !== leaderId).map(o => (
                <option key={o.id} value={o.id} style={{ background: '#0c1322' }}>{o.nome || o.email?.split('@')[0]}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Meta OKOK Junho" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Plataforma</label>
              <input value={plataforma} onChange={e => setPlataforma(e.target.value)} placeholder="Plataforma" style={inp} />
            </div>
            <div>
              <label style={lbl}>Rede</label>
              <select value={rede} onChange={e => setRede(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="" style={{ background: '#0c1322' }}>Selecione</option>
                {REDES.map(r => <option key={r} value={r} style={{ background: '#0c1322' }}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Quantidade de contas</label>
            <input value={contas} onChange={e => setContas(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="10" style={inp} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Observações (opcional)</label>
            <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Notas" style={inp} />
          </div>

          {error && <div style={{ padding: '9px 12px', marginBottom: 12, borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff9d9d', fontSize: 12.5 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 1.6, padding: '12px', borderRadius: 11, border: 'none', background: 'linear-gradient(180deg, #ef4444, #c62828)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'Criando...' : 'Criar e operar'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ── Modal: adicionar custo ── */
function CostModal({ leaderId, onClose, onSaved }) {
  const [type, setType] = useState('proxy')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { setError('Informe um valor válido'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/team/cost', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_id: leaderId, action: 'add', type, amount: Number(amount), date, note }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao salvar'); setSaving(false); return }
      onSaved()
    } catch (e) { setError(e.message); setSaving(false) }
  }

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff' }
  const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--t3)', margin: '0 0 6px' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(180deg, #11161f, #0a0d13)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>Novo custo</h3>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px' }}>Custo da equipe (entra no cálculo do lucro)</p>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {COST_TYPES.map(t => <option key={t.id} value={t.id} style={{ background: '#0c1322' }}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Valor (R$)</label>
              <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} inputMode="decimal" placeholder="0,00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Observação (opcional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Notas" style={inp} />
          </div>
          {error && <div style={{ padding: '9px 12px', marginBottom: 12, borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff9d9d', fontSize: 12.5 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 1.4, padding: '12px', borderRadius: 11, border: 'none', background: 'linear-gradient(180deg, #ef4444, #c62828)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'Salvando...' : 'Adicionar custo'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function EquipePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState(null) // { leader, operators, metas, remessas }
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showCost, setShowCost] = useState(false)

  useEffect(() => { boot() }, [])

  async function boot() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    setProfile(p)
    // Admin principal cai no /admin; quem não é líder da DS cai no /operator
    if (p?.role === 'admin') { router.push('/admin'); return }
    if (!p?.is_team_leader || p?.tenant_id !== DS_MENTORIA_TENANT || !p?.team) { router.push('/operator'); return }
    await load(p.id)
  }

  async function load(leaderId) {
    setLoading(true)
    try {
      const res = await fetch('/api/team/overview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_id: leaderId }),
      })
      const json = await res.json()
      if (!res.ok) { setDenied(true); setLoading(false); return }
      setData(json)
    } catch { setDenied(true) }
    setLoading(false)
  }

  async function deleteCost(costId) {
    try {
      await fetch('/api/team/cost', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leader_id: profile?.id, action: 'delete', cost_id: costId }),
      })
      await load(profile?.id)
    } catch {}
  }

  const operators = data?.operators || []
  const metas = data?.metas || []
  const remessas = data?.remessas || []
  const closedMetas = useMemo(() => validClosedMetas(metas), [metas])

  const operatorStats = useMemo(() => {
    return operators.map(op => {
      const opMetas = metas.filter(m => m.operator_id === op.id)
      const opClosed = closedMetas.filter(m => m.operator_id === op.id)
      const totalDeposit = opClosed.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
      const lucroFinal = opClosed.reduce((a, m) => a + Number(m.lucro_final || 0), 0)
      const activeMetas = opMetas.filter(m => m.status === 'ativa' || m.status === 'em_andamento').length
      const winMetas = opClosed.filter(m => Number(m.lucro_final || 0) > 0).length
      const winRate = opClosed.length > 0 ? (winMetas / opClosed.length) * 100 : 0
      return { ...op, metasCount: opMetas.length, closedCount: opClosed.length, totalDeposit, lucroFinal, activeMetas, winRate }
    })
  }, [operators, metas, closedMetas])

  const costs = data?.costs || []
  const custosTotal = useMemo(() => costs.reduce((a, c) => a + Number(c.amount || 0), 0), [costs])
  const ranking = useMemo(() => [...operatorStats].sort((a, b) => b.lucroFinal - a.lucroFinal), [operatorStats])
  const lucroBruto = useMemo(() => closedMetas.reduce((a, m) => a + Number(m.lucro_final || 0), 0), [closedMetas])
  const teamLucro = useMemo(() => lucroBruto - custosTotal, [lucroBruto, custosTotal])
  const teamDeps = useMemo(() => operatorStats.reduce((a, o) => a + o.totalDeposit, 0), [operatorStats])
  const openMetas = useMemo(() => metas.filter(m => m.status_fechamento !== 'fechada'), [metas])
  const toClose = useMemo(() => metas.filter(m => m.status === 'finalizada' && m.status_fechamento !== 'fechada'), [metas])

  // Metas ordenadas: primeiro as que precisam fechar, depois ativas, depois fechadas
  const metasSorted = useMemo(() => {
    const rank = m => (m.status === 'finalizada' && m.status_fechamento !== 'fechada') ? 0 : (m.status_fechamento === 'fechada' ? 2 : 1)
    return [...metas].sort((a, b) => rank(a) - rank(b))
  }, [metas])

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Carregando equipe...</p>
        </div>
      </div>
    )
  }

  const team = data?.leader?.team || profile?.team || ''
  const Kpi = ({ label, value, isCurrency, color }) => (
    <div style={{ padding: '16px 18px', borderRadius: 14, background: 'linear-gradient(145deg, var(--surface), rgba(8,12,22,0.8))', border: '1px solid var(--b1)' }}>
      <p style={{ fontSize: 10.5, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color: color || 'var(--t1)', margin: 0, fontFamily: 'var(--mono, monospace)', letterSpacing: '-0.02em' }}>
        {isCurrency ? `R$ ${fmt(value)}` : value}
      </p>
    </div>
  )

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={false} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#ffb3b3', textTransform: 'uppercase' }}>Painel do líder</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>Equipe {team}</h1>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
              Você gerencia {operators.length} operador{operators.length !== 1 ? 'es' : ''} — opere, acompanhe e feche as metas da equipe.
            </p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)}
            style={{ padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'linear-gradient(180deg, #ef4444, #c62828)', color: '#fff', fontSize: 13.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(239,68,68,0.35)' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova meta
          </button>
        </motion.div>

        {denied && (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ff9d9d', fontSize: 13, marginBottom: 20 }}>
            Não foi possível carregar a equipe. Atualize a página.
          </div>
        )}

        {/* KPIs */}
        <motion.div {...fadeUp(1)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          <Kpi label="Operadores" value={operators.length} />
          <Kpi label="Metas abertas" value={openMetas.length} />
          <Kpi label="A fechar" value={toClose.length} color={toClose.length > 0 ? '#ffd166' : undefined} />
          <Kpi label="Depositantes" value={teamDeps} />
          <Kpi label="Custos" value={custosTotal} isCurrency color={custosTotal > 0 ? 'var(--loss, #ef4444)' : undefined} />
          <Kpi label="Lucro líquido" value={teamLucro} isCurrency color={teamLucro >= 0 ? 'var(--profit, #10b981)' : 'var(--loss, #ef4444)'} />
        </motion.div>

        {/* Ranking dos operadores */}
        <motion.div {...fadeUp(2)} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: '0 0 14px' }}>Operadores da equipe</h2>
          {ranking.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--b1)' }}>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>Nenhum operador nesta equipe ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ranking.map((op, idx) => {
                const isProfit = op.lucroFinal >= 0
                return (
                  <motion.div key={op.id} {...fadeUp(idx, 0.1)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
                    background: 'linear-gradient(145deg, var(--surface), rgba(8,12,22,0.8))', border: '1px solid var(--b1)',
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: 'var(--t2)', fontFamily: 'var(--mono, monospace)' }}>{idx + 1}</div>
                    <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: isProfit ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.05))' : 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.05))', border: `1.5px solid ${isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: 'var(--t1)' }}>{getInitial(op)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{getName(op)}</span>
                        {op.is_team_leader && <span style={{ fontSize: 9, fontWeight: 800, color: '#ffb3b3', padding: '2px 7px', borderRadius: 5, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>LÍDER</span>}
                        <RankBadge contas={op.totalDeposit} size="xs" />
                      </div>
                      <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                        {op.totalDeposit} deps · {op.closedCount} meta{op.closedCount !== 1 ? 's' : ''} fechada{op.closedCount !== 1 ? 's' : ''} · {op.activeMetas} ativa{op.activeMetas !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: isProfit ? 'var(--profit, #10b981)' : 'var(--loss, #ef4444)', margin: 0, fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(op.lucroFinal)}</p>
                      <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '2px 0 0' }}>{op.winRate.toFixed(0)}% acerto</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Metas da equipe */}
        <motion.div {...fadeUp(3)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Metas da equipe</h2>
            {toClose.length > 0 && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffd166', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,209,102,0.12)', border: '1px solid rgba(255,209,102,0.3)' }}>
                {toClose.length} aguardando fechamento
              </span>
            )}
          </div>
          {metasSorted.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--b1)' }}>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>Nenhuma meta na equipe ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metasSorted.map((m, idx) => {
                const op = operators.find(o => o.id === m.operator_id)
                const st = statusInfo(m)
                return (
                  <button key={m.id} type="button" onClick={() => router.push(`/meta/${m.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 13, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      background: 'rgba(255,255,255,0.025)', border: '1px solid var(--b1)',
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{m.titulo || `${m.quantidade_contas || 0} DEP ${(m.rede || '').toUpperCase()}`}</span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: st.color, padding: '2px 8px', borderRadius: 5, background: st.bg, border: `1px solid ${st.bd}` }}>{st.label}</span>
                      </div>
                      <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{getName(op)} · {(m.rede || '—').toUpperCase()} · {m.quantidade_contas || 0} contas</span>
                    </div>
                    {m.status_fechamento === 'fechada' && (
                      <span style={{ fontSize: 14, fontWeight: 800, color: Number(m.lucro_final || 0) >= 0 ? 'var(--profit, #10b981)' : 'var(--loss, #ef4444)', fontFamily: 'var(--mono, monospace)' }}>R$ {fmt(m.lucro_final)}</span>
                    )}
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Custos da equipe */}
        <motion.div {...fadeUp(4)} style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Custos da equipe</h2>
              <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '3px 0 0' }}>Proxy, SMS, postagens — descontados do lucro líquido</p>
            </div>
            <button type="button" onClick={() => setShowCost(true)}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo custo
            </button>
          </div>
          {costs.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--b1)' }}>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>Nenhum custo lançado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {costs.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--b1)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{costLabel(c.type)}</span>
                    {c.note && <span style={{ fontSize: 11.5, color: 'var(--t4)' }}> · {c.note}</span>}
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 2 }}>{c.date ? new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--loss, #ef4444)', fontFamily: 'var(--mono, monospace)' }}>− R$ {fmt(c.amount)}</span>
                  <button type="button" onClick={() => deleteCost(c.id)} title="Remover"
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--t4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateMetaModal
            leaderId={profile?.id}
            operators={operators}
            onClose={() => setShowCreate(false)}
            onCreated={(meta) => { setShowCreate(false); if (meta?.id) router.push(`/meta/${meta.id}`) }}
          />
        )}
        {showCost && (
          <CostModal
            leaderId={profile?.id}
            onClose={() => setShowCost(false)}
            onSaved={async () => { setShowCost(false); await load(profile?.id) }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  )
}

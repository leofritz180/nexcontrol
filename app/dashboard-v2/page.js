'use client'
/* ══════════════════════════════════════════════════════════════
   NexControl — Dashboard V2 (layout inspirado no Resend)
   Rota isolada: /dashboard-v2 · 100% FRONTEND, dados mock.
   Nao importa AppLayout/Sidebar de producao, nao chama Supabase.
   ══════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Shell from './_components/Shell'
import { Icon, I } from './_components/icons'
import CSS from './_components/styles'
import {
  ToastHost, useToast, Drawer, Modal, Field, Input, Select, Def, Pill, Progress, EmptyState,
} from './_components/ui'
import {
  brl, fmtData, fmtHora, custosIniciais, CUSTO_TIPOS, REDES_DISPONIVEIS,
  operadores as opsFn, allMetas as allMetasFn,
} from './_components/data'

import Overview from './_views/Overview'
import Metas from './_views/Metas'
import Operadores from './_views/Operadores'
import Redes from './_views/Redes'
import SlotsView from './_views/Slots'
import Faturamento from './_views/Faturamento'
import CustosView from './_views/Custos'
import Pix from './_views/Pix'
import Premiacoes from './_views/Premiacoes'
import Network from './_views/Network'
import Config from './_views/Config'

const toneOf = (v) => (v > 0 ? 'var(--profit)' : v < 0 ? 'var(--loss)' : 'var(--t2)')

/* ══════════════ Drawer: detalhe da meta ══════════════ */
function MetaDrawer({ meta, onClose, onToast }) {
  return (
    <Drawer
      open={!!meta} onClose={onClose}
      title={meta?.titulo || ''}
      sub={meta ? `${meta.rede} · ${meta.operador} · criada em ${fmtData(meta.criadaEm)}` : ''}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="v2-btn-ghost" onClick={onClose}>Fechar</button>
          <button type="button" className="v2-btn-primary" onClick={() => { onToast(meta.fechada ? 'Meta reaberta para edição' : 'Meta pronta para fechamento', 'profit'); onClose() }}>
            {meta?.fechada ? 'Editar fechamento' : 'Fechar meta'}
          </button>
        </div>
      }
    >
      {meta && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            <Pill tom={meta.fechada ? 'neutral' : 'profit'}>{meta.fechada ? 'Fechada' : 'Ativa'}</Pill>
            <span className="v2-tag">{meta.rede}</span>
            <span className="v2-tag">{meta.remessas} remessas</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p className="v2-eyebrow">Resultado</p>
            <p className="v2-mono" style={{ margin: '8px 0 0', fontSize: 30, fontWeight: 700, letterSpacing: '-.04em', color: toneOf(meta.lucroFinal) }}>
              {brl(meta.lucroFinal, { sign: true })}
            </p>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--t4)', marginBottom: 7 }}>
                <span>{meta.contasFeitas}/{meta.contasTotal} contas</span>
                <span className="v2-mono">{meta.progresso}%</span>
              </div>
              <Progress value={meta.progresso} tom={meta.fechada ? 'profit' : 'neutral'} />
            </div>
          </div>

          <p className="v2-eyebrow" style={{ marginBottom: 4 }}>Composição</p>
          <Def label="Depósito total" value={brl(meta.deposito)} />
          <Def label="Saque total" value={brl(meta.saque)} />
          <Def label="Resultado das remessas" value={brl(meta.resultado, { sign: true })} tom={meta.resultado >= 0 ? 'profit' : 'loss'} />
          {meta.fechada && (
            <>
              <Def label="Salário" value={brl(meta.salario)} />
              <Def label="Baú" value={brl(meta.bau)} />
              <Def label="Custo fixo" value={`- ${brl(meta.custoFixo)}`} />
              <Def label="Taxa do agente" value={`- ${brl(meta.taxaAgente)}`} />
              <Def label="Lucro final" value={brl(meta.lucroFinal, { sign: true })} tom={meta.lucroFinal >= 0 ? 'profit' : 'loss'} />
              <Def label="Fechada em" value={meta.fechadaEm ? `${fmtData(meta.fechadaEm)} · ${fmtHora(meta.fechadaEm)}` : '—'} />
            </>
          )}

          <p className="v2-eyebrow" style={{ margin: '22px 0 10px' }}>Remessas</p>
          {meta.lista.length === 0 && <EmptyState titulo="Nenhuma remessa" texto="Esta meta ainda não recebeu lançamentos." />}
          {meta.lista.map(r => (
            <div key={r.id} className="v2-mini-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="v2-row-t">
                  {r.titulo}
                  {r.tipo === 'redeposito' && <span className="v2-tag" style={{ marginLeft: 8 }}>redep.</span>}
                  {r.problema && <span className="v2-tag" style={{ marginLeft: 8, color: 'var(--loss)', borderColor: 'var(--loss-border)' }}>pendente</span>}
                </p>
                <p className="v2-row-s">{r.slot} · {r.contas} contas · {fmtData(r.created_at)} {fmtHora(r.created_at)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="v2-mono" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: toneOf(r.resultado) }}>{brl(r.resultado, { sign: true })}</p>
                <p className="v2-row-s v2-mono" style={{ marginTop: 3 }}>{brl(r.deposito, { cents: false })} → {brl(r.saque, { cents: false })}</p>
              </div>
            </div>
          ))}
        </>
      )}
    </Drawer>
  )
}

/* ══════════════ Drawer: detalhe do operador ══════════════ */
function OperadorDrawer({ op, onClose, onOpenMeta, onToast }) {
  return (
    <Drawer
      open={!!op} onClose={onClose}
      title={op?.nome || ''}
      sub={op?.email}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="v2-btn-ghost" onClick={onClose}>Fechar</button>
          <button type="button" className="v2-btn-primary" onClick={() => { onToast(`Mensagem enviada para ${op.nome.split(' ')[0]}`, 'profit'); onClose() }}>
            Enviar mensagem
          </button>
        </div>
      }
    >
      {op && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span className="v2-avatar" style={{ width: 44, height: 44, fontSize: 14 }}>{op.iniciais}</span>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Pill tom={op.online ? 'profit' : 'neutral'}>{op.online ? 'Online' : 'Offline'}</Pill>
                <span className="v2-tag">#{op.rank} no ranking</span>
              </div>
              <p className="v2-row-s" style={{ marginTop: 6 }}>{op.badge}</p>
            </div>
          </div>

          <p className="v2-eyebrow">Lucro final gerado</p>
          <p className="v2-mono" style={{ margin: '8px 0 20px', fontSize: 30, fontWeight: 700, letterSpacing: '-.04em', color: toneOf(op.lucro) }}>
            {brl(op.lucro, { sign: true })}
          </p>

          <Def label="Metas fechadas" value={op.metas} />
          <Def label="Metas ativas" value={op.ativas} />
          <Def label="Contas processadas" value={op.contas} />
          <Def label="Remessas lançadas" value={op.remessas} />
          <Def label="Taxa de acerto" value={`${op.winRate}%`} tom={op.winRate >= 60 ? 'profit' : undefined} />
          <Def label="Lucro por conta" value={brl(op.porConta)} tom={op.porConta >= 0 ? 'profit' : 'loss'} />

          <p className="v2-eyebrow" style={{ margin: '22px 0 10px' }}>Metas do operador</p>
          {op.listaMetas.map(m => (
            <button key={m.id} type="button" className="v2-mini-row is-btn" onClick={() => { onClose(); onOpenMeta(m) }}>
              <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <p className="v2-row-t">{m.titulo} <span className="v2-tag" style={{ marginLeft: 6 }}>{m.rede}</span></p>
                <p className="v2-row-s">{m.fechada ? 'Fechada' : 'Ativa'} · {m.contasFeitas}/{m.contasTotal} contas</p>
              </div>
              <span className="v2-mono" style={{ fontSize: 13, fontWeight: 700, color: toneOf(m.lucroFinal) }}>{brl(m.lucroFinal, { sign: true })}</span>
            </button>
          ))}
        </>
      )}
    </Drawer>
  )
}

/* ══════════════ Modal: nova meta ══════════════ */
function NovaMetaModal({ open, onClose, onCriar }) {
  const ops = useMemo(() => opsFn(), [])
  const [titulo, setTitulo] = useState('')
  const [rede, setRede] = useState('W1')
  const [contas, setContas] = useState('30')
  const [operador, setOperador] = useState(ops[0]?.id || '')

  function submit() {
    const qtd = parseInt(String(contas).replace(/\D/g, ''), 10) || 0
    if (!titulo.trim() || !qtd) return
    onCriar({
      titulo: titulo.trim(), rede, contasTotal: qtd,
      operador: ops.find(o => o.id === operador)?.nome || '—',
      operadorId: operador,
    })
    setTitulo(''); setContas('30')
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova meta" sub="Defina o alvo de depósitos e quem vai executar."
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="v2-btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="v2-btn-primary" onClick={submit} disabled={!titulo.trim()}>Criar meta</button>
        </div>
      }>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="Título da meta" hint="Ex.: 30 DEP W1">
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="30 DEP W1" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Rede">
            <Select value={rede} onChange={e => setRede(e.target.value)} options={REDES_DISPONIVEIS} />
          </Field>
          <Field label="Quantidade de contas">
            <Input value={contas} inputMode="decimal" onChange={e => setContas(e.target.value)} />
          </Field>
        </div>
        <Field label="Operador responsável">
          <Select value={operador} onChange={e => setOperador(e.target.value)}
            options={ops.map(o => ({ value: o.id, label: o.nome }))} />
        </Field>
      </div>
    </Modal>
  )
}

/* ══════════════ Modal: novo custo ══════════════ */
function NovoCustoModal({ open, onClose, onCriar }) {
  const [tipo, setTipo] = useState('proxy')
  const [valor, setValor] = useState('')
  const [nota, setNota] = useState('')

  function submit() {
    const v = parseFloat(String(valor).replace(/\./g, '').replace(',', '.'))
    if (!v || v <= 0) return
    onCriar({ tipo, valor: Number(v.toFixed(2)), nota: nota.trim() || 'Sem descrição', data: new Date().toISOString().slice(0, 10) })
    setValor(''); setNota('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Lançar custo" sub="Custos do tenant entram no cálculo de exibição, não na meta."
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="v2-btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="v2-btn-primary" onClick={submit} disabled={!valor.trim()}>Lançar</button>
        </div>
      }>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tipo">
            <Select value={tipo} onChange={e => setTipo(e.target.value)} options={CUSTO_TIPOS} />
          </Field>
          <Field label="Valor" hint="Formato brasileiro: 1.055,90">
            <Input value={valor} inputMode="decimal" placeholder="0,00" onChange={e => setValor(e.target.value)} />
          </Field>
        </div>
        <Field label="Descrição">
          <Input value={nota} onChange={e => setNota(e.target.value)} placeholder="Proxy mensal" />
        </Field>
      </div>
    </Modal>
  )
}

/* ══════════════ Modal: convidar operador ══════════════ */
function ConvidarModal({ open, onClose, onEnviar }) {
  const [email, setEmail] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Convidar operador" sub="Ele recebe um link de acesso restrito ao painel do operador."
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="v2-btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="v2-btn-primary" onClick={() => { onEnviar(email); setEmail('') }} disabled={!email.includes('@')}>
            Enviar convite
          </button>
        </div>
      }>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="E-mail do operador">
          <Input value={email} type="email" placeholder="operador@email.com" onChange={e => setEmail(e.target.value)} />
        </Field>
        <div className="v2-note">
          <Icon d={I.wallet} size={14} />
          <span>Cada operador ativo adiciona <strong className="v2-mono">R$ 29,90</strong> por mês à sua assinatura.</span>
        </div>
      </div>
    </Modal>
  )
}

/* ══════════════ App ══════════════ */
function DashboardV2() {
  const toast = useToast()
  const [view, setView] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [metaSel, setMetaSel] = useState(null)
  const [opSel, setOpSel] = useState(null)
  const [modal, setModal] = useState(null)
  const [custos, setCustos] = useState(() => custosIniciais())
  const [metasExtras, setMetasExtras] = useState([])

  /* deep-link: ?view=metas · ?modal=meta|custo|convidar · ?meta=<id> */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const v = q.get('view'); if (v) setView(v)
    const m = q.get('modal'); if (m) setModal(m)
    const id = q.get('meta')
    if (id) {
      const alvo = allMetasFn().find(x => x.id === id)
      if (alvo) setMetaSel(alvo)
    }
  }, [])

  const navigate = useCallback((id) => {
    if (id === 'docs') { toast('Documentação abriria em nova aba'); return }
    if (id === 'suporte') { toast('Canal de suporte aberto'); return }
    setView(id)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', id === 'overview' ? window.location.pathname : `?view=${id}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [toast])

  const action = useCallback((id) => {
    if (id === 'nova-meta') return setModal('meta')
    if (id === 'novo-custo') return setModal('custo')
    if (id === 'convidar') return setModal('convidar')
    if (id === 'exportar') return toast('Relatório CSV gerado', 'profit')
    if (id === 'pagar') return toast('PIX copia e cola gerado', 'profit')
    toast('Ação de demonstração')
  }, [toast])

  const refresh = useCallback(() => {
    if (refreshing) return
    setRefreshing(true)
    setTimeout(() => { setRefreshing(false); toast('Dados atualizados', 'profit') }, 1100)
  }, [refreshing, toast])

  function criarMeta(dados) {
    const nova = {
      id: `nova-${metasExtras.length + 1}`,
      titulo: dados.titulo, rede: dados.rede, operador: dados.operador, operadorId: dados.operadorId,
      contasFeitas: 0, contasTotal: dados.contasTotal, progresso: 0, resultado: 0, remessas: 0,
      fechada: false, status: 'ativa', lucroFinal: 0, salario: 0, bau: 0, custoFixo: 0, taxaAgente: 0,
      criadaEm: new Date().toISOString(), fechadaEm: null, deposito: 0, saque: 0, lista: [],
    }
    setMetasExtras(l => [nova, ...l])
    setModal(null)
    toast(`Meta “${dados.titulo}” criada`, 'profit')
    setView('metas')
  }

  function criarCusto(c) {
    setCustos(l => [{ id: `c-${Date.now()}`, ...c }, ...l])
    setModal(null)
    toast(`Custo de ${brl(c.valor)} lançado`, 'profit')
  }

  const viewProps = {
    onNavigate: navigate,
    onAction: action,
    onOpenMeta: setMetaSel,
    onOpenOperador: setOpSel,
    loading: refreshing,
  }

  let content = null
  if (view === 'overview') content = <Overview {...viewProps} extras={metasExtras} />
  else if (view === 'metas') content = <Metas {...viewProps} extras={metasExtras} />
  else if (view === 'operadores') content = <Operadores {...viewProps} />
  else if (view === 'redes') content = <Redes {...viewProps} />
  else if (view === 'slots') content = <SlotsView {...viewProps} />
  else if (view === 'faturamento') content = <Faturamento {...viewProps} />
  else if (view === 'custos') content = <CustosView lista={custos} onNovo={() => setModal('custo')} onRemover={(id) => { setCustos(l => l.filter(c => c.id !== id)); toast('Custo removido') }} />
  else if (view === 'pix') content = <Pix {...viewProps} />
  else if (view === 'premiacoes') content = <Premiacoes {...viewProps} />
  else if (view === 'network') content = <Network {...viewProps} />
  else if (view === 'config') content = <Config {...viewProps} />

  return (
    <Shell view={view} onNavigate={navigate} onAction={action} onRefresh={refresh} refreshing={refreshing}>
      <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        {content}
      </motion.div>

      <footer className="v2-foot">
        <span>NexControl · Dashboard v2 · dados de demonstração</span>
        <nav>
          <button type="button" onClick={() => navigate('docs')}>Documentação</button>
          <button type="button" onClick={() => toast('Changelog: v2.0 — nova dashboard')}>Changelog</button>
          <button type="button" onClick={() => navigate('suporte')}>Suporte</button>
          <button type="button" onClick={() => toast('Todos os sistemas operacionais', 'profit')}>Status</button>
        </nav>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--profit)', display: 'block' }} />
          Todos os sistemas operacionais
        </span>
      </footer>

      <MetaDrawer meta={metaSel} onClose={() => setMetaSel(null)} onToast={toast} />
      <OperadorDrawer op={opSel} onClose={() => setOpSel(null)} onOpenMeta={setMetaSel} onToast={toast} />
      <NovaMetaModal open={modal === 'meta'} onClose={() => setModal(null)} onCriar={criarMeta} />
      <NovoCustoModal open={modal === 'custo'} onClose={() => setModal(null)} onCriar={criarCusto} />
      <ConvidarModal open={modal === 'convidar'} onClose={() => setModal(null)}
        onEnviar={(email) => { setModal(null); toast(`Convite enviado para ${email}`, 'profit') }} />
    </Shell>
  )
}

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <ToastHost><DashboardV2 /></ToastHost>
    </>
  )
}

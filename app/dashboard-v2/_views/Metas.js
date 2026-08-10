'use client'
import { useMemo, useState } from 'react'
import { Icon, I } from '../_components/icons'
import { Panel, PanelHead, PageHead, DataTable, Segmented, Progress } from '../_components/ui'
import { allMetas, brl } from '../_components/data'

const toneOf = (v) => (v > 0 ? 'var(--profit)' : v < 0 ? 'var(--loss)' : 'var(--t2)')

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'ativa', label: 'Ativas' },
  { id: 'fechada', label: 'Fechadas' },
]

export default function Metas({ onOpenMeta, onAction, extras = [] }) {
  const [filtro, setFiltro] = useState('todas')
  const [rede, setRede] = useState('todas')
  const todas = useMemo(() => [...extras, ...allMetas()], [extras])

  const redesList = useMemo(() => ['todas', ...new Set(todas.map(m => m.rede))], [todas])

  const rows = useMemo(() => todas.filter(m => {
    if (filtro !== 'todas' && m.status !== filtro) return false
    if (rede !== 'todas' && m.rede !== rede) return false
    return true
  }), [todas, filtro, rede])

  const resumo = useMemo(() => {
    const ativas = todas.filter(m => !m.fechada)
    const fechadas = todas.filter(m => m.fechada)
    const lucro = fechadas.reduce((a, m) => a + m.lucroFinal, 0)
    const contas = todas.reduce((a, m) => a + m.contasTotal, 0)
    return [
      { label: 'Total de metas', value: todas.length, hint: `${ativas.length} ativas · ${fechadas.length} fechadas` },
      { label: 'Lucro consolidado', value: brl(lucro), hint: 'Somente metas fechadas', tom: lucro >= 0 ? 'profit' : 'loss' },
      { label: 'Contas planejadas', value: contas, hint: 'Soma de todas as metas' },
      { label: 'Ticket médio', value: brl(fechadas.length ? lucro / fechadas.length : 0), hint: 'Lucro por meta fechada' },
    ]
  }, [todas])

  const columns = [
    {
      key: 'titulo', label: 'Meta', render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="strong">{r.titulo}</span>
          <span className="v2-tag">{r.rede}</span>
        </div>
      ),
    },
    { key: 'operador', label: 'Operador' },
    {
      key: 'status', label: 'Status', render: r => (
        <span className={`v2-pill ${r.fechada ? '' : 'is-profit'}`}><i />{r.fechada ? 'Fechada' : 'Ativa'}</span>
      ),
    },
    {
      key: 'progresso', label: 'Progresso', width: 150, sortValue: r => r.progresso, render: r => (
        <div style={{ minWidth: 110 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--t4)', marginBottom: 5, fontFamily: 'var(--mono)' }}>
            <span>{r.contasFeitas}/{r.contasTotal}</span><span>{r.progresso}%</span>
          </div>
          <Progress value={r.progresso} tom={r.fechada ? 'profit' : 'neutral'} />
        </div>
      ),
    },
    { key: 'remessas', label: 'Remessas', align: 'right', render: r => <span className="v2-mono">{r.remessas}</span> },
    { key: 'deposito', label: 'Depósito', align: 'right', render: r => <span className="v2-mono">{brl(r.deposito, { cents: false })}</span> },
    {
      key: 'lucroFinal', label: 'Resultado', align: 'right',
      render: r => <span className="v2-mono" style={{ color: toneOf(r.lucroFinal), fontWeight: 700 }}>{brl(r.lucroFinal, { sign: true })}</span>,
    },
  ]

  return (
    <>
      <PageHead
        title="Metas"
        sub="Todas as metas da operação, ativas e encerradas."
        actions={
          <>
            <button type="button" className="v2-btn-ghost" onClick={() => onAction('exportar')}>Exportar</button>
            <button type="button" className="v2-btn-primary" onClick={() => onAction('nova-meta')}>
              <Icon d={I.plus} size={14} /> Nova meta
            </button>
          </>
        }
      />

      <div className="v2-stack">
        <Panel>
          <div className="v2-kpis is-4">
            {resumo.map(k => (
              <div key={k.label} className="v2-kpi">
                <p className="v2-eyebrow">{k.label}</p>
                <p className="v2-kpi-v" style={{ color: k.tom === 'profit' ? 'var(--profit)' : k.tom === 'loss' ? 'var(--loss)' : 'var(--t1)' }}>{k.value}</p>
                <p className="v2-kpi-h">{k.hint}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Lista de metas" sub={`${rows.length} resultado${rows.length === 1 ? '' : 's'}`} />
          <DataTable
            columns={columns}
            rows={rows}
            searchKeys={['titulo', 'rede', 'operador']}
            searchPlaceholder="Buscar por meta, rede ou operador…"
            pageSize={7}
            onRowClick={onOpenMeta}
            empty="Nenhuma meta encontrada"
            toolbar={
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Segmented options={FILTROS} value={filtro} onChange={setFiltro} size="sm" />
                <Segmented options={redesList.map(r => ({ id: r, label: r === 'todas' ? 'Redes' : r }))} value={rede} onChange={setRede} size="sm" />
              </div>
            }
          />
        </Panel>
      </div>
    </>
  )
}

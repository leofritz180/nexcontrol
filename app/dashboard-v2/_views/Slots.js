'use client'
import { useMemo } from 'react'
import { Panel, PanelHead, PageHead, DataTable, Progress, Pill } from '../_components/ui'
import { slots, brl, pct } from '../_components/data'

const toneOf = (v) => (v > 0 ? 'var(--profit)' : v < 0 ? 'var(--loss)' : 'var(--t2)')

export default function Slots({ onAction }) {
  const list = useMemo(() => slots(), [])
  const total = list.reduce((a, s) => a + s.resultado, 0)
  const melhor = list[0]
  const pior = list[list.length - 1]

  const columns = [
    { key: 'nome', label: 'Slot', render: r => <span className="strong">{r.nome}</span> },
    { key: 'redes', label: 'Redes', sortable: false, render: r => (
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{r.redes.map(x => <span key={x} className="v2-tag">{x}</span>)}</div>
    ) },
    { key: 'usos', label: 'Usos', align: 'right', render: r => <span className="v2-mono">{r.usos}</span> },
    { key: 'deposito', label: 'Depósito', align: 'right', render: r => <span className="v2-mono">{brl(r.deposito, { cents: false })}</span> },
    { key: 'saque', label: 'Saque', align: 'right', render: r => <span className="v2-mono">{brl(r.saque, { cents: false })}</span> },
    { key: 'roi', label: 'ROI', align: 'right', render: r => <span className="v2-mono" style={{ color: toneOf(r.roi) }}>{pct(r.roi)}</span> },
    {
      key: 'winRate', label: 'Acerto', align: 'right', width: 120, render: r => (
        <div style={{ minWidth: 84, marginLeft: 'auto' }}>
          <p className="v2-mono" style={{ margin: '0 0 5px', fontSize: 11.5, textAlign: 'right' }}>{r.winRate}%</p>
          <Progress value={r.winRate} tom={r.winRate >= 50 ? 'profit' : 'loss'} />
        </div>
      ),
    },
    {
      key: 'resultado', label: 'Resultado', align: 'right',
      render: r => <span className="v2-mono" style={{ color: toneOf(r.resultado), fontWeight: 700 }}>{brl(r.resultado, { sign: true })}</span>,
    },
  ]

  return (
    <>
      <PageHead
        title="Slots"
        sub="Quais jogos estão devolvendo — e quais estão só consumindo depósito."
        actions={<button type="button" className="v2-btn-ghost" onClick={() => onAction('exportar')}>Exportar</button>}
      />

      <div className="v2-stack">
        <Panel>
          <div className="v2-kpis is-4">
            <div className="v2-kpi">
              <p className="v2-eyebrow">Slots monitorados</p>
              <p className="v2-kpi-v">{list.length}</p>
              <p className="v2-kpi-h">{list.reduce((a, s) => a + s.usos, 0)} remessas no total</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Resultado somado</p>
              <p className="v2-kpi-v" style={{ color: toneOf(total) }}>{brl(total, { sign: true })}</p>
              <p className="v2-kpi-h">Saque menos depósito</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Melhor slot</p>
              <p className="v2-kpi-v" style={{ fontSize: 17 }}>{melhor?.nome || '—'}</p>
              <p className="v2-kpi-h">{melhor ? `${brl(melhor.resultado, { sign: true })} · ${melhor.winRate}% acerto` : '—'}</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Pior slot</p>
              <p className="v2-kpi-v" style={{ fontSize: 17 }}>{pior?.nome || '—'}</p>
              <p className="v2-kpi-h">{pior ? `${brl(pior.resultado, { sign: true })} · ${pior.winRate}% acerto` : '—'}</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHead
            title="Ranking de slots"
            sub="Ordenado por resultado acumulado"
            action={<Pill tom="profit">Atualizado agora</Pill>}
          />
          <DataTable columns={columns} rows={list} searchKeys={['nome']} searchPlaceholder="Buscar slot…" pageSize={8} empty="Nenhum slot registrado" />
        </Panel>
      </div>
    </>
  )
}

'use client'
import { useMemo } from 'react'
import { Panel, PanelHead, PageHead, DataTable, Pill } from '../_components/ui'
import { pixRecebimentos, brl, fmtData, fmtHora } from '../_components/data'

export default function Pix({ onAction }) {
  const list = useMemo(() => pixRecebimentos(), [])
  const total = list.reduce((a, p) => a + p.valor, 0)
  const processando = list.filter(p => p.status === 'processando')

  const columns = [
    {
      key: 'status', label: 'Status',
      render: r => <span className={`v2-pill ${r.status === 'confirmado' ? 'is-profit' : ''}`}><i />{r.status === 'confirmado' ? 'Confirmado' : 'Processando'}</span>,
    },
    { key: 'chave', label: 'Chave', render: r => <span className="v2-mono" style={{ color: 'var(--t2)' }}>{r.chave}</span> },
    { key: 'operador', label: 'Operador', render: r => <span className="strong">{r.operador}</span> },
    { key: 'rede', label: 'Rede', render: r => <span className="v2-tag">{r.rede}</span> },
    { key: 'created_at', label: 'Data', align: 'right', render: r => <span className="v2-mono" style={{ color: 'var(--t4)' }}>{fmtData(r.created_at)} · {fmtHora(r.created_at)}</span> },
    { key: 'valor', label: 'Valor', align: 'right', render: r => <span className="v2-mono" style={{ fontWeight: 700, color: 'var(--profit)' }}>{brl(r.valor)}</span> },
  ]

  return (
    <>
      <PageHead
        title="PIX"
        sub="Saques recebidos das redes e status de confirmação."
        actions={<button type="button" className="v2-btn-ghost" onClick={() => onAction('exportar')}>Exportar extrato</button>}
      />

      <div className="v2-stack">
        <Panel>
          <div className="v2-kpis is-4">
            <div className="v2-kpi">
              <p className="v2-eyebrow">Recebido</p>
              <p className="v2-kpi-v" style={{ color: 'var(--profit)' }}>{brl(total)}</p>
              <p className="v2-kpi-h">{list.length} transações</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Em processamento</p>
              <p className="v2-kpi-v">{brl(processando.reduce((a, p) => a + p.valor, 0))}</p>
              <p className="v2-kpi-h">{processando.length} transação(ões)</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Ticket médio</p>
              <p className="v2-kpi-v">{brl(list.length ? total / list.length : 0)}</p>
              <p className="v2-kpi-h">Por recebimento</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Tempo médio</p>
              <p className="v2-kpi-v">1,8s</p>
              <p className="v2-kpi-h">Da solicitação à confirmação</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Extrato" sub="Últimos recebimentos"
            action={<Pill tom="profit">Webhook saudável</Pill>} />
          <DataTable columns={columns} rows={list} searchKeys={['operador', 'rede', 'chave']}
            searchPlaceholder="Buscar por operador, rede ou chave…" pageSize={8} empty="Nenhum recebimento" />
        </Panel>
      </div>
    </>
  )
}

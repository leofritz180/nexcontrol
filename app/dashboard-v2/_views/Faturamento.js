'use client'
import { useMemo } from 'react'
import { Icon, I } from '../_components/icons'
import { AreaChart } from '../_components/charts'
import { Panel, PanelHead, PageHead, DataTable, Progress, Pill, Def } from '../_components/ui'
import { assinatura, faturas, brl, fmtData, seriesFor } from '../_components/data'

export default function Faturamento({ onAction }) {
  const sub = useMemo(() => assinatura(3), [])
  const invs = useMemo(() => faturas(), [])
  const serie = useMemo(() => seriesFor('all'), [])

  const columns = [
    { key: 'id', label: 'Fatura', render: r => <span className="v2-mono strong">{r.id}</span> },
    { key: 'periodo', label: 'Período', render: r => <span style={{ textTransform: 'capitalize' }}>{r.periodo}</span> },
    { key: 'operadores', label: 'Operadores', align: 'right', render: r => <span className="v2-mono">{r.operadores}</span> },
    { key: 'metodo', label: 'Método' },
    {
      key: 'status', label: 'Status',
      render: r => <span className={`v2-pill ${r.status === 'paga' ? 'is-profit' : ''}`}><i />{r.status === 'paga' ? 'Paga' : 'Em aberto'}</span>,
    },
    { key: 'valor', label: 'Valor', align: 'right', render: r => <span className="v2-mono" style={{ fontWeight: 700, color: 'var(--t1)' }}>{brl(r.valor)}</span> },
    {
      key: 'acoes', label: '', align: 'right', sortable: false, width: 48,
      render: () => <button type="button" className="v2-icon-btn" title="Baixar recibo"><Icon d={I.download} size={13} /></button>,
    },
  ]

  return (
    <>
      <PageHead
        title="Faturamento"
        sub="Sua assinatura, faturas e o resultado financeiro da operação."
        actions={
          <>
            <button type="button" className="v2-btn-ghost" onClick={() => onAction('exportar')}>Exportar</button>
            <button type="button" className="v2-btn-primary" onClick={() => onAction('pagar')}>
              <Icon d={I.pix} size={13} /> Pagar com PIX
            </button>
          </>
        }
      />

      <div className="v2-stack">
        <div className="v2-grid-2">
          <Panel>
            <PanelHead title="Assinatura" sub="Plano atual e próxima cobrança"
              action={<Pill tom="profit">Ativa</Pill>} />
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <span className="v2-mono" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.04em', color: 'var(--t1)' }}>{brl(sub.total)}</span>
                <span style={{ fontSize: 13, color: 'var(--t3)' }}>/mês</span>
              </div>
              <p style={{ margin: '0 0 18px', fontSize: 12.5, color: 'var(--t4)' }}>
                Plano {sub.plano} · {brl(sub.base)} de base + {brl(sub.porOperador)} por operador
              </p>

              <Def label="Operadores ativos" value={`${sub.operadores} × ${brl(sub.porOperador)}`} />
              <Def label="Taxa base" value={brl(sub.base)} />
              <Def label="Método de pagamento" value={sub.metodo} />
              <Def label="Próximo vencimento" value={fmtData(sub.proximoVencimento)} />

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--t3)', marginBottom: 8 }}>
                  <span>Ciclo atual</span>
                  <span className="v2-mono">{30 - sub.diasRestantes}/30 dias</span>
                </div>
                <Progress value={((30 - sub.diasRestantes) / 30) * 100} tom="profit" />
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Resultado da operação" sub="Lucro final acumulado nos últimos 60 dias" />
            <div style={{ padding: '18px 18px 12px' }}>
              <p className="v2-eyebrow">Total no período</p>
              <p className="v2-mono" style={{ margin: '8px 0 0', fontSize: 30, fontWeight: 700, letterSpacing: '-.04em', color: 'var(--t1)' }}>
                {brl(serie.total)}
              </p>
              <div style={{ marginTop: 14 }}>
                <AreaChart values={serie.values} labels={serie.labels} height={170} format={v => brl(v)} />
              </div>
            </div>
            <div style={{ padding: '0 18px 18px' }}>
              <Def label="Custo da plataforma no período" value={brl(sub.total * 2)} />
              <Def label="Margem sobre o resultado" value={`${((1 - (sub.total * 2) / (serie.total || 1)) * 100).toFixed(1)}%`} tom="profit" />
            </div>
          </Panel>
        </div>

        <Panel>
          <PanelHead title="Histórico de faturas" sub={`${invs.length} faturas emitidas`} />
          <DataTable columns={columns} rows={invs} searchKeys={['id', 'periodo', 'status']}
            searchPlaceholder="Buscar fatura…" pageSize={6} empty="Nenhuma fatura emitida" />
        </Panel>
      </div>
    </>
  )
}

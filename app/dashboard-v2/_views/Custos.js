'use client'
import { useMemo } from 'react'
import { Icon, I } from '../_components/icons'
import { Panel, PanelHead, PageHead, DataTable, Progress } from '../_components/ui'
import { agrupaCustos, brl, fmtData, totals } from '../_components/data'

export default function Custos({ lista, onNovo, onRemover }) {
  const grupos = useMemo(() => agrupaCustos(lista), [lista])
  const total = lista.reduce((a, c) => a + Number(c.valor || 0), 0)
  const hoje = new Date().toISOString().slice(0, 10)
  const doDia = lista.filter(c => c.data === hoje).reduce((a, c) => a + Number(c.valor || 0), 0)

  const columns = [
    { key: 'tipo', label: 'Tipo', render: r => <span className="strong" style={{ textTransform: 'capitalize' }}>{r.tipo}</span> },
    { key: 'nota', label: 'Descrição', render: r => <span style={{ color: 'var(--t2)' }}>{r.nota || '—'}</span> },
    { key: 'data', label: 'Data', render: r => <span className="v2-mono" style={{ color: 'var(--t4)' }}>{fmtData(r.data)}</span> },
    { key: 'valor', label: 'Valor', align: 'right', render: r => <span className="v2-mono" style={{ fontWeight: 700, color: 'var(--t1)' }}>{brl(r.valor)}</span> },
    {
      key: 'acoes', label: '', align: 'right', sortable: false, width: 48,
      render: r => (
        <button type="button" className="v2-icon-btn" title="Remover"
          onClick={(e) => { e.stopPropagation(); onRemover(r.id) }}>
          <Icon d={I.close} size={13} />
        </button>
      ),
    },
  ]

  return (
    <>
      <PageHead
        title="Custos"
        sub="Proxy, SMS, VPS e tudo mais que come o lucro final."
        actions={
          <button type="button" className="v2-btn-primary" onClick={onNovo}>
            <Icon d={I.plus} size={14} /> Lançar custo
          </button>
        }
      />

      <div className="v2-stack">
        <Panel>
          <div className="v2-kpis is-4">
            <div className="v2-kpi">
              <p className="v2-eyebrow">Total lançado</p>
              <p className="v2-kpi-v">{brl(total)}</p>
              <p className="v2-kpi-h">{lista.length} lançamentos</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Custos de hoje</p>
              <p className="v2-kpi-v">{brl(doDia)}</p>
              <p className="v2-kpi-h">Dia operacional corrente</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Maior categoria</p>
              <p className="v2-kpi-v" style={{ fontSize: 18, textTransform: 'capitalize' }}>{grupos[0]?.tipo || '—'}</p>
              <p className="v2-kpi-h">{grupos[0] ? `${brl(grupos[0].valor)} · ${grupos[0].share}% do total` : '—'}</p>
            </div>
            <div className="v2-kpi">
              <p className="v2-eyebrow">Impacto no lucro</p>
              <p className="v2-kpi-v" style={{ color: 'var(--loss)' }}>
                -{((total / (totals.lucroFinalTotal || 1)) * 100).toFixed(1)}%
              </p>
              <p className="v2-kpi-h">Sobre o lucro consolidado</p>
            </div>
          </div>
        </Panel>

        <div className="v2-grid-2">
          <Panel>
            <PanelHead title="Lançamentos" sub={`${lista.length} registros`} />
            <DataTable
              columns={columns} rows={lista}
              searchKeys={['tipo', 'nota']} searchPlaceholder="Buscar custo…"
              pageSize={8} empty="Nenhum custo lançado"
            />
          </Panel>

          <Panel>
            <PanelHead title="Distribuição" sub="Participação por categoria" />
            <div style={{ padding: '6px 18px 18px' }}>
              {grupos.map((g, i) => (
                <div key={g.tipo} style={{ padding: '12px 0', borderBottom: i === grupos.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 500, textTransform: 'capitalize' }}>{g.tipo}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span className="v2-mono" style={{ fontSize: 11, color: 'var(--t4)' }}>{g.share}%</span>
                      <span className="v2-mono" style={{ fontSize: 13, fontWeight: 700 }}>{brl(g.valor)}</span>
                    </div>
                  </div>
                  <Progress value={g.share} delay={0.1 + i * 0.05} />
                </div>
              ))}
              {grupos.length === 0 && <p className="v2-empty-s" style={{ padding: '20px 0' }}>Nenhum custo lançado ainda.</p>}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

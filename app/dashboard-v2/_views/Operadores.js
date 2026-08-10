'use client'
import { useMemo } from 'react'
import { Icon, I } from '../_components/icons'
import { Sparkline } from '../_components/charts'
import { Panel, PanelHead, PageHead, DataTable, Progress } from '../_components/ui'
import { operadores, brl } from '../_components/data'

const toneOf = (v) => (v > 0 ? 'var(--profit)' : v < 0 ? 'var(--loss)' : 'var(--t2)')

export default function Operadores({ onOpenOperador, onAction }) {
  const ops = useMemo(() => operadores(), [])
  const totalLucro = ops.reduce((a, o) => a + o.lucro, 0)

  const columns = [
    {
      key: 'nome', label: 'Operador', render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="v2-avatar">{r.iniciais}</span>
          <span style={{ minWidth: 0 }}>
            <span className="strong" style={{ display: 'block' }}>{r.nome}</span>
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{r.email}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'online', label: 'Status', sortValue: r => (r.online ? 1 : 0),
      render: r => <span className={`v2-pill ${r.online ? 'is-profit' : ''}`}><i />{r.online ? 'Online' : 'Offline'}</span>,
    },
    { key: 'metas', label: 'Fechadas', align: 'right', render: r => <span className="v2-mono">{r.metas}</span> },
    { key: 'ativas', label: 'Ativas', align: 'right', render: r => <span className="v2-mono">{r.ativas}</span> },
    { key: 'contas', label: 'Contas', align: 'right', render: r => <span className="v2-mono">{r.contas}</span> },
    {
      key: 'winRate', label: 'Acerto', align: 'right', width: 110,
      render: r => (
        <div style={{ minWidth: 78, marginLeft: 'auto' }}>
          <p className="v2-mono" style={{ margin: '0 0 5px', fontSize: 11.5, textAlign: 'right' }}>{r.winRate}%</p>
          <Progress value={r.winRate} tom={r.winRate >= 60 ? 'profit' : 'loss'} />
        </div>
      ),
    },
    { key: 'porConta', label: 'Por conta', align: 'right', render: r => <span className="v2-mono" style={{ color: toneOf(r.porConta) }}>{brl(r.porConta)}</span> },
    {
      key: 'lucro', label: 'Lucro final', align: 'right',
      render: r => <span className="v2-mono" style={{ color: toneOf(r.lucro), fontWeight: 700 }}>{brl(r.lucro, { sign: true })}</span>,
    },
  ]

  return (
    <>
      <PageHead
        title="Operadores"
        sub="Quem está produzindo, quanto e com qual consistência."
        actions={
          <>
            <button type="button" className="v2-btn-ghost" onClick={() => onAction('exportar')}>Exportar</button>
            <button type="button" className="v2-btn-primary" onClick={() => onAction('convidar')}>
              <Icon d={I.plus} size={14} /> Convidar operador
            </button>
          </>
        }
      />

      <div className="v2-stack">
        <div className="v2-grid-3">
          {ops.map(o => (
            <Panel key={o.id} className="v2-card-hover">
              <div style={{ padding: 18, cursor: 'pointer' }} onClick={() => onOpenOperador(o)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                  <span className="v2-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{o.iniciais}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="v2-row-t">{o.nome}</p>
                    <p className="v2-row-s">{o.badge}</p>
                  </div>
                  <span className={`v2-rank ${o.rank === 1 ? 'is-first' : ''}`}>{o.rank}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p className="v2-eyebrow">Lucro final</p>
                    <p className="v2-mono" style={{ margin: '6px 0 0', fontSize: 21, fontWeight: 700, letterSpacing: '-.03em', color: toneOf(o.lucro) }}>
                      {brl(o.lucro, { sign: true })}
                    </p>
                  </div>
                  <Sparkline values={o.spark} width={72} height={26}
                    color={o.lucro >= 0 ? 'rgba(209,250,229,0.55)' : 'rgba(239,68,68,0.55)'} />
                </div>

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--b1)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { l: 'Metas', v: `${o.metas}/${o.metas + o.ativas}` },
                    { l: 'Acerto', v: `${o.winRate}%` },
                    { l: 'Por conta', v: brl(o.porConta) },
                  ].map(x => (
                    <div key={x.l}>
                      <p className="v2-eyebrow" style={{ fontSize: 9 }}>{x.l}</p>
                      <p className="v2-mono" style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--t1)' }}>{x.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ))}
        </div>

        <Panel>
          <PanelHead title="Comparativo" sub={`${ops.length} operadores · ${brl(totalLucro)} de lucro somado`} />
          <DataTable
            columns={columns}
            rows={ops}
            searchKeys={['nome', 'email']}
            searchPlaceholder="Buscar operador…"
            pageSize={8}
            onRowClick={onOpenOperador}
            empty="Nenhum operador encontrado"
          />
        </Panel>
      </div>
    </>
  )
}

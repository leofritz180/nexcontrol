'use client'
import { useMemo } from 'react'
import { Sparkline } from '../_components/charts'
import { Panel, PanelHead, PageHead, DataTable, Progress, Pill } from '../_components/ui'
import { redes, brl, pct } from '../_components/data'

const toneOf = (v) => (v > 0 ? 'var(--profit)' : v < 0 ? 'var(--loss)' : 'var(--t2)')

export default function Redes({ onAction }) {
  const nets = useMemo(() => redes(), [])
  const melhor = nets[0]

  const columns = [
    { key: 'rede', label: 'Rede', render: r => <span className="v2-tag" style={{ fontSize: 11 }}>{r.rede}</span> },
    { key: 'metas', label: 'Metas', align: 'right', render: r => <span className="v2-mono">{r.metas}</span> },
    { key: 'contas', label: 'Contas', align: 'right', render: r => <span className="v2-mono">{r.contas}</span> },
    { key: 'deposito', label: 'Depósito', align: 'right', render: r => <span className="v2-mono">{brl(r.deposito, { cents: false })}</span> },
    { key: 'saque', label: 'Saque', align: 'right', render: r => <span className="v2-mono">{brl(r.saque, { cents: false })}</span> },
    { key: 'roi', label: 'ROI', align: 'right', render: r => <span className="v2-mono" style={{ color: toneOf(r.roi) }}>{pct(r.roi)}</span> },
    { key: 'winRate', label: 'Acerto', align: 'right', render: r => <span className="v2-mono">{r.winRate}%</span> },
    { key: 'porConta', label: 'Por conta', align: 'right', render: r => <span className="v2-mono" style={{ color: toneOf(r.porConta) }}>{brl(r.porConta)}</span> },
    {
      key: 'lucro', label: 'Lucro final', align: 'right',
      render: r => <span className="v2-mono" style={{ color: toneOf(r.lucro), fontWeight: 700 }}>{brl(r.lucro, { sign: true })}</span>,
    },
  ]

  return (
    <>
      <PageHead
        title="Redes"
        sub="Onde o dinheiro está sendo feito — e onde está travando."
        actions={<button type="button" className="v2-btn-ghost" onClick={() => onAction('exportar')}>Exportar</button>}
      />

      <div className="v2-stack">
        <div className="v2-grid-4">
          {nets.map(n => (
            <Panel key={n.rede} className="v2-card-hover">
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span className="v2-tag" style={{ fontSize: 11.5 }}>{n.rede}</span>
                  <Pill tom={n.lucro >= 0 ? 'profit' : 'loss'}>{n.lucro >= 0 ? 'Saudável' : 'Risco'}</Pill>
                </div>
                <p className="v2-eyebrow">Lucro final</p>
                <p className="v2-mono" style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, letterSpacing: '-.03em', color: toneOf(n.lucro) }}>
                  {brl(n.lucro, { sign: true })}
                </p>
                <div style={{ margin: '12px 0 10px' }}>
                  <Sparkline values={n.spark} width={200} height={30} color="rgba(255,255,255,0.34)" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t4)', marginBottom: 6 }}>
                  <span>Score operacional</span><span className="v2-mono">{n.score}/100</span>
                </div>
                <Progress value={n.score} tom={n.lucro >= 0 ? 'profit' : 'loss'} />
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--t3)' }}>
                  <span>{n.metas} metas · {n.ativas} ativas</span>
                  <span className="v2-mono">{brl(n.porConta)}/conta</span>
                </div>
              </div>
            </Panel>
          ))}
        </div>

        {melhor && (
          <Panel>
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Pill tom="profit">Destaque</Pill>
              <span style={{ fontSize: 13, color: 'var(--t2)' }}>
                <strong style={{ color: 'var(--t1)' }}>{melhor.rede}</strong> é a rede mais rentável do período:
                {' '}<span className="v2-mono" style={{ color: 'var(--profit)' }}>{brl(melhor.lucro, { sign: true })}</span>
                {' '}em {melhor.metas} metas, com {brl(melhor.porConta)} por conta e {melhor.winRate}% de acerto.
              </span>
            </div>
          </Panel>
        )}

        <Panel>
          <PanelHead title="Comparativo completo" sub="Todas as redes com metas fechadas" />
          <DataTable columns={columns} rows={nets} searchKeys={['rede']} searchPlaceholder="Buscar rede…" pageSize={10} empty="Nenhuma rede encontrada" />
        </Panel>
      </div>
    </>
  )
}

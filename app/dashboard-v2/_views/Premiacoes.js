'use client'
import { useMemo } from 'react'
import { Icon, I } from '../_components/icons'
import { Panel, PanelHead, PageHead, Progress, Pill } from '../_components/ui'
import { premiacoes, brl, totals } from '../_components/data'

export default function Premiacoes() {
  const faixas = useMemo(() => premiacoes(), [])
  const atual = totals.lucroFinalTotal
  const proxima = faixas.find(f => !f.atingida)

  return (
    <>
      <PageHead
        title="Premiações"
        sub="Reconhecimento por faixa de resultado acumulado."
        actions={<Pill tom="profit">{faixas.filter(f => f.atingida).length} de {faixas.length} conquistadas</Pill>}
      />

      <div className="v2-stack">
        <Panel>
          <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <p className="v2-eyebrow">Resultado acumulado</p>
              <p className="v2-hero-value" style={{ fontSize: 38 }}>{brl(atual)}</p>
              <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
                {proxima
                  ? <>Faltam <strong className="v2-mono" style={{ color: 'var(--t1)' }}>{brl(proxima.falta)}</strong> para a placa {proxima.nome}.</>
                  : 'Todas as faixas conquistadas.'}
              </p>
            </div>
            {proxima && (
              <div style={{ minWidth: 240, flex: '1 1 240px', maxWidth: 340 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--t4)', marginBottom: 8 }}>
                  <span>Progresso até {proxima.nome}</span>
                  <span className="v2-mono">{proxima.progresso}%</span>
                </div>
                <Progress value={proxima.progresso} tom="profit" />
              </div>
            )}
          </div>
        </Panel>

        <div className="v2-grid-4">
          {faixas.map((f, i) => (
            <Panel key={f.nome} className="v2-card-hover">
              <div style={{ padding: 20, textAlign: 'center' }}>
                <div style={{
                  width: 62, height: 62, margin: '0 auto 14px', borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${f.atingida ? 'rgba(209,250,229,0.24)' : 'var(--b1)'}`,
                  background: f.atingida ? 'rgba(209,250,229,0.05)' : 'rgba(255,255,255,0.02)',
                  color: f.atingida ? 'var(--profit)' : 'var(--t4)',
                }}>
                  <Icon d={I.award} size={26} />
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: f.atingida ? 'var(--t1)' : 'var(--t3)' }}>{f.nome}</p>
                <p className="v2-mono" style={{ margin: '5px 0 14px', fontSize: 12, color: 'var(--t4)' }}>{brl(f.meta, { cents: false })}</p>

                <Progress value={f.progresso} tom={f.atingida ? 'profit' : 'neutral'} delay={0.1 + i * 0.08} />

                <p style={{ margin: '12px 0 0', fontSize: 11.5, color: f.atingida ? 'var(--profit)' : 'var(--t4)' }}>
                  {f.atingida ? 'Conquistada' : `Faltam ${brl(f.falta, { cents: false })}`}
                </p>
              </div>
            </Panel>
          ))}
        </div>

        <Panel>
          <PanelHead title="Como funciona" sub="Regras das faixas" />
          <div style={{ padding: 18, display: 'grid', gap: 12 }}>
            {[
              'A faixa considera o lucro final consolidado de todas as metas fechadas da operação.',
              'A placa é liberada automaticamente assim que o acumulado cruza o valor da faixa — não é preciso solicitar.',
              'Metas com prejuízo reduzem o acumulado; o progresso pode recuar.',
              'Cada placa conquistada fica registrada no histórico da operação, mesmo que o acumulado caia depois.',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--t4)', fontFamily: 'var(--mono)', fontSize: 11, marginTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55 }}>{t}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  )
}

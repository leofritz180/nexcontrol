'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon, I } from '../_components/icons'
import { AreaChart, Sparkline } from '../_components/charts'
import { Panel, PanelHead, PageHead, Segmented, Progress, Pill, Skeleton } from '../_components/ui'
import {
  brl, pct, PERIODS, seriesFor, kpis, metasAtivas,
  operadores, remessasRecentes, redes, custos, totals,
} from '../_components/data'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.33, 1, 0.68, 1] },
})

const toneOf = (v) => (v > 0 ? 'var(--profit)' : v < 0 ? 'var(--loss)' : 'var(--t2)')

export default function Overview({ onNavigate, onOpenMeta, onOpenOperador, onAction, loading, extras = [] }) {
  const [period, setPeriod] = useState('30d')

  const serie = useMemo(() => seriesFor(period), [period])
  const cells = useMemo(() => kpis(period), [period])
  const metas = useMemo(() => [...extras, ...metasAtivas()], [extras])
  const ops = useMemo(() => operadores(), [])
  const rems = useMemo(() => remessasRecentes(6), [])
  const nets = useMemo(() => redes(), [])
  const cst = useMemo(() => custos(), [])
  const custoTotal = cst.reduce((a, c) => a + c.amount, 0)

  return (
    <>
      <PageHead
        title="Visão geral"
        sub="Tudo o que aconteceu na sua operação, em um lugar só."
        actions={
          <>
            <button type="button" className="v2-btn-ghost" onClick={() => onAction('exportar')}>Exportar CSV</button>
            <button type="button" className="v2-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => onNavigate('faturamento')}>
              <Icon d={I.chart} size={13} /> Relatório
            </button>
          </>
        }
      />

      <div className="v2-stack">
        {/* HERO */}
        <motion.div {...fade(0.05)}>
          <Panel>
            <div className="v2-hero-top">
              <div>
                <p className="v2-eyebrow">Lucro final · {PERIODS.find(p => p.id === period)?.label}</p>
                {loading ? <Skeleton h={46} w={260} style={{ marginTop: 10 }} /> : (
                  <p className="v2-hero-value">{brl(serie.total)}</p>
                )}
                <div className="v2-hero-sub">
                  {serie.delta === null ? (
                    <>
                      <Pill dot={false}>Período completo</Pill>
                      <span>sem base de comparação anterior</span>
                    </>
                  ) : (
                    <>
                      <span className={`v2-pill ${serie.delta >= 0 ? 'is-profit' : 'is-loss'}`}>
                        <Icon d={serie.delta >= 0 ? I.up : I.down} size={11} />
                        {pct(serie.delta)}
                      </span>
                      <span>vs. período anterior ({brl(serie.prev)})</span>
                    </>
                  )}
                  <span style={{ color: 'var(--t4)' }}>·</span>
                  <span>{serie.days} dias · {totals.totalRem} remessas</span>
                </div>
              </div>
              <Segmented options={PERIODS.map(p => ({ id: p.id, label: p.label }))} value={period} onChange={setPeriod} />
            </div>
            <div className="v2-hero-chart">
              <AreaChart values={serie.values} labels={serie.labels} height={230} format={(v) => brl(v)} />
            </div>
          </Panel>
        </motion.div>

        {/* KPIs */}
        <motion.div {...fade(0.1)}>
          <Panel>
            <div className="v2-kpis">
              {cells.map(k => (
                <div key={k.label} className="v2-kpi">
                  <div className="v2-kpi-top">
                    <p className="v2-eyebrow">{k.label}</p>
                    <Sparkline values={k.spark} color={k.negative ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.42)'} />
                  </div>
                  {loading ? <Skeleton h={22} w={90} style={{ marginTop: 10 }} /> : <p className="v2-kpi-v">{k.value}</p>}
                  <p className="v2-kpi-h">{k.hint}</p>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* METAS + OPERADORES */}
        <div className="v2-grid-2">
          <motion.div {...fade(0.15)}>
            <Panel>
              <PanelHead title="Metas em andamento" sub={`${metas.length} metas rodando agora`}
                action={<button type="button" className="v2-link" onClick={() => onNavigate('metas')}>Ver todas <Icon d={I.arrow} size={12} /></button>} />
              {metas.map((m, i) => (
                <div key={m.id} className="v2-row" onClick={() => onOpenMeta(m)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p className="v2-row-t">{m.titulo}</p>
                      <span className="v2-tag">{m.rede}</span>
                    </div>
                    <p className="v2-row-s">{m.operador} · {m.remessas} remessas · {m.contasFeitas}/{m.contasTotal} contas</p>
                    <div style={{ marginTop: 9, maxWidth: 260 }}><Progress value={m.progresso} delay={0.2 + i * 0.06} /></div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p className="v2-mono" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: toneOf(m.resultado) }}>
                      {brl(m.resultado, { sign: true })}
                    </p>
                    <p className="v2-row-s v2-mono" style={{ marginTop: 4 }}>{m.progresso}%</p>
                  </div>
                </div>
              ))}
            </Panel>
          </motion.div>

          <motion.div {...fade(0.2)}>
            <Panel>
              <PanelHead title="Operadores" sub="Ranking por lucro final"
                action={<button type="button" className="v2-link" onClick={() => onNavigate('operadores')}>Gerenciar</button>} />
              {ops.map(o => (
                <div key={o.email} className="v2-row" onClick={() => onOpenOperador(o)}>
                  <span className={`v2-rank ${o.rank === 1 ? 'is-first' : ''}`}>{o.rank}</span>
                  <span className="v2-avatar">{o.iniciais}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="v2-row-t">{o.nome}</p>
                    <p className="v2-row-s">{o.metas} fechadas · {o.winRate}% acerto</p>
                  </div>
                  <Sparkline values={o.spark} width={54} height={20}
                    color={o.lucro >= 0 ? 'rgba(209,250,229,0.55)' : 'rgba(239,68,68,0.55)'} />
                  <p className="v2-mono" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: toneOf(o.lucro), minWidth: 84, textAlign: 'right' }}>
                    {brl(o.lucro, { sign: true })}
                  </p>
                </div>
              ))}
            </Panel>
          </motion.div>
        </div>

        {/* REMESSAS */}
        <motion.div {...fade(0.25)}>
          <Panel>
            <PanelHead title="Remessas recentes" sub="Últimos lançamentos da equipe"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Pill tom="profit">Sincronizado</Pill>
                  <button type="button" className="v2-link" onClick={() => onNavigate('metas')}>Ver histórico <Icon d={I.arrow} size={12} /></button>
                </div>
              } />
            <div className="v2-table-wrap">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Status</th><th>Remessa</th><th>Rede</th><th>Slot</th><th>Operador</th>
                    <th className="num">Depósito</th><th className="num">Saque</th><th className="num">Resultado</th><th className="num">Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {rems.map(r => (
                    <tr key={r.id}>
                      <td>
                        <span className={`v2-pill ${r.status === 'lucro' ? 'is-profit' : r.status === 'prejuizo' ? 'is-loss' : ''}`}>
                          <i />{r.status === 'lucro' ? 'Lucro' : r.status === 'prejuizo' ? 'Prejuízo' : 'Pendente'}
                        </span>
                      </td>
                      <td className="strong">{r.titulo}{r.tipo === 'redeposito' && <span className="v2-tag" style={{ marginLeft: 8 }}>redep.</span>}</td>
                      <td><span className="v2-tag">{r.rede}</span></td>
                      <td>{r.slot}</td>
                      <td>{r.operadorCurto}</td>
                      <td className="num">{brl(r.deposito, { cents: false })}</td>
                      <td className="num">{brl(r.saque, { cents: false })}</td>
                      <td className="num" style={{ color: toneOf(r.resultado), fontWeight: 700 }}>{brl(r.resultado, { sign: true })}</td>
                      <td className="num" style={{ color: 'var(--t4)' }}>{r.dia} · {r.hora}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </motion.div>

        {/* REDES + CUSTOS */}
        <div className="v2-grid-2e">
          <motion.div {...fade(0.3)}>
            <Panel>
              <PanelHead title="Desempenho por rede" sub="Lucro final acumulado em metas fechadas"
                action={<button type="button" className="v2-link" onClick={() => onNavigate('redes')}>Detalhar</button>} />
              <div style={{ padding: '6px 18px 16px' }}>
                {nets.map((n, i) => (
                  <div key={n.rede} style={{ padding: '12px 0', borderBottom: i === nets.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span className="v2-tag">{n.rede}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--t4)' }}>{n.metas} metas · {n.contas} contas</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span className="v2-mono" style={{ fontSize: 11, color: 'var(--t4)' }}>{brl(n.porConta)}/conta</span>
                        <span className="v2-mono" style={{ fontSize: 13, fontWeight: 700, color: toneOf(n.lucro) }}>{brl(n.lucro, { sign: true })}</span>
                      </div>
                    </div>
                    <Progress value={n.share} tom={n.lucro >= 0 ? 'profit' : 'loss'} delay={0.35 + i * 0.06} />
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>

          <motion.div {...fade(0.35)}>
            <Panel>
              <PanelHead title="Custos da operação" sub={`${brl(custoTotal)} no período`}
                action={<button type="button" className="v2-link" onClick={() => onAction('novo-custo')}>Lançar custo</button>} />
              <div style={{ padding: '6px 18px 16px' }}>
                {cst.map((c, i) => (
                  <div key={c.type} style={{ padding: '12px 0', borderBottom: i === cst.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 500, textTransform: 'capitalize' }}>{c.type}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span className="v2-mono" style={{ fontSize: 11, color: 'var(--t4)' }}>{c.share}%</span>
                        <span className="v2-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{brl(c.amount)}</span>
                      </div>
                    </div>
                    <Progress value={c.share} delay={0.4 + i * 0.06} />
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Impacto no lucro final</span>
                  <span className="v2-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--loss)' }}>
                    -{((custoTotal / (totals.lucroFinalTotal || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Panel>
          </motion.div>
        </div>
      </div>
    </>
  )
}

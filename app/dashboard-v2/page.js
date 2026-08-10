'use client'
/* ══════════════════════════════════════════════════════════════
   NexControl — Dashboard V2 (layout inspirado no Resend)
   Rota isolada: /dashboard-v2 · 100% FRONTEND, dados mock.
   Nao importa AppLayout/Sidebar de producao, nao chama Supabase.
   ══════════════════════════════════════════════════════════════ */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Shell, { Icon, I } from './_components/Shell'
import CSS from './_components/styles'
import { AreaChart, Sparkline, Bar } from './_components/charts'
import {
  brl, pct, PERIODS, seriesFor, kpis, metasAtivas,
  operadores, remessasRecentes, redes, custos, totals,
} from './_components/data'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.33, 1, 0.68, 1] },
})

const toneOf = (v) => (v > 0 ? 'var(--profit)' : v < 0 ? 'var(--loss)' : 'var(--t2)')

function PanelHead({ title, sub, action }) {
  return (
    <div className="v2-panel-h">
      <div style={{ minWidth: 0 }}>
        <h3 className="v2-panel-t">{title}</h3>
        {sub && <p className="v2-panel-s">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export default function DashboardV2() {
  const [period, setPeriod] = useState('30d')

  const serie = useMemo(() => seriesFor(period), [period])
  const cells = useMemo(() => kpis(period), [period])
  const metas = useMemo(() => metasAtivas(), [])
  const ops = useMemo(() => operadores(), [])
  const rems = useMemo(() => remessasRecentes(8), [])
  const nets = useMemo(() => redes(), [])
  const cst = useMemo(() => custos(), [])
  const custoTotal = cst.reduce((a, c) => a + c.amount, 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Shell>
        {/* ═══════════ CABECALHO DA PAGINA ═══════════ */}
        <motion.header {...fade(0)} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <h1 className="v2-title">Visão geral</h1>
            <p className="v2-subtitle">Tudo o que aconteceu na sua operação, em um lugar só.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="v2-btn-ghost">Exportar CSV</button>
            <button type="button" className="v2-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon d={I.chart} size={13} /> Relatório
            </button>
          </div>
        </motion.header>

        <div className="v2-stack">
          {/* ═══════════ HERO — lucro + grafico ═══════════ */}
          <motion.section {...fade(0.05)} className="v2-panel">
            <div className="v2-hero-top">
              <div>
                <p className="v2-eyebrow">Lucro final · {PERIODS.find(p => p.id === period)?.label}</p>
                <p className="v2-hero-value">{brl(serie.total)}</p>
                <div className="v2-hero-sub">
                  {serie.delta === null ? (
                    <>
                      <span className="v2-pill">Período completo</span>
                      <span>sem base de comparação anterior</span>
                    </>
                  ) : (
                    <>
                      <span className={`v2-pill ${serie.delta >= 0 ? 'is-profit' : 'is-loss'}`}>
                        <Icon d={serie.delta >= 0 ? 'M12 19V5M6 11l6-6 6 6' : 'M12 5v14M6 13l6 6 6-6'} size={11} />
                        {pct(serie.delta)}
                      </span>
                      <span>vs. período anterior ({brl(serie.prev)})</span>
                    </>
                  )}
                  <span style={{ color: 'var(--t4)' }}>·</span>
                  <span>{serie.days} dias · {totals.totalRem} remessas</span>
                </div>
              </div>

              <div className="v2-seg">
                {PERIODS.map(p => (
                  <button key={p.id} type="button" onClick={() => setPeriod(p.id)}
                    className={period === p.id ? 'is-on' : ''}>{p.label}</button>
                ))}
              </div>
            </div>

            <div className="v2-hero-chart">
              <AreaChart values={serie.values} labels={serie.labels} height={230} format={(v) => brl(v)} />
            </div>
          </motion.section>

          {/* ═══════════ FAIXA DE KPIs ═══════════ */}
          <motion.section {...fade(0.1)} className="v2-panel">
            <div className="v2-kpis">
              {cells.map((k, i) => (
                <div key={k.label} className="v2-kpi">
                  <div className="v2-kpi-top">
                    <p className="v2-eyebrow">{k.label}</p>
                    <Sparkline values={k.spark} color={k.negative ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.42)'} />
                  </div>
                  <p className="v2-kpi-v">{k.value}</p>
                  <p className="v2-kpi-h">{k.hint}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ═══════════ METAS + OPERADORES ═══════════ */}
          <div className="v2-grid-2">
            <motion.section {...fade(0.15)} className="v2-panel">
              <PanelHead
                title="Metas em andamento"
                sub={`${metas.length} metas rodando agora`}
                action={<button type="button" className="v2-link">Ver todas <Icon d={I.arrow} size={12} /></button>}
              />
              {metas.map((m, i) => (
                <div key={m.id} className="v2-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p className="v2-row-t">{m.titulo}</p>
                      <span className="v2-tag">{m.rede}</span>
                    </div>
                    <p className="v2-row-s">{m.operador} · {m.remessas} remessas · {m.contasFeitas}/{m.contasTotal} contas</p>
                    <div style={{ marginTop: 9, maxWidth: 260 }}>
                      <Bar value={m.progresso} delay={0.2 + i * 0.06} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p className="v2-mono" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: toneOf(m.resultado) }}>
                      {brl(m.resultado, { sign: true })}
                    </p>
                    <p className="v2-row-s v2-mono" style={{ marginTop: 4 }}>{m.progresso}%</p>
                  </div>
                </div>
              ))}
            </motion.section>

            <motion.section {...fade(0.2)} className="v2-panel">
              <PanelHead
                title="Operadores"
                sub="Ranking por lucro final"
                action={<button type="button" className="v2-link">Gerenciar</button>}
              />
              {ops.map((o, i) => (
                <div key={o.email} className="v2-row">
                  <span className={`v2-rank ${i === 0 ? 'is-first' : ''}`}>{o.rank}</span>
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
            </motion.section>
          </div>

          {/* ═══════════ TABELA DE REMESSAS ═══════════ */}
          <motion.section {...fade(0.25)} className="v2-panel">
            <PanelHead
              title="Remessas recentes"
              sub="Últimos lançamentos da equipe"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="v2-pill"><i style={{ background: 'var(--profit)' }} />Sincronizado</span>
                  <button type="button" className="v2-link">Ver histórico <Icon d={I.arrow} size={12} /></button>
                </div>
              }
            />
            <div className="v2-table-wrap">
              <table className="v2-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Remessa</th>
                    <th>Rede</th>
                    <th>Slot</th>
                    <th>Operador</th>
                    <th className="num">Depósito</th>
                    <th className="num">Saque</th>
                    <th className="num">Resultado</th>
                    <th className="num">Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {rems.map(r => (
                    <tr key={r.id}>
                      <td>
                        <span className={`v2-pill ${r.status === 'lucro' ? 'is-profit' : r.status === 'prejuizo' ? 'is-loss' : ''}`}>
                          <i />
                          {r.status === 'lucro' ? 'Lucro' : r.status === 'prejuizo' ? 'Prejuízo' : 'Pendente'}
                        </span>
                      </td>
                      <td className="strong">{r.titulo}{r.tipo === 'redeposito' && <span className="v2-tag" style={{ marginLeft: 8 }}>redep.</span>}</td>
                      <td><span className="v2-tag">{r.rede}</span></td>
                      <td>{r.slot}</td>
                      <td>{r.operador}</td>
                      <td className="num">{brl(r.deposito, { cents: false })}</td>
                      <td className="num">{brl(r.saque, { cents: false })}</td>
                      <td className="num" style={{ color: toneOf(r.resultado), fontWeight: 700 }}>{brl(r.resultado, { sign: true })}</td>
                      <td className="num" style={{ color: 'var(--t4)' }}>{r.dia} · {r.hora}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* ═══════════ REDES + CUSTOS ═══════════ */}
          <div className="v2-grid-2e">
            <motion.section {...fade(0.3)} className="v2-panel">
              <PanelHead title="Desempenho por rede" sub="Lucro final acumulado em metas fechadas" />
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
                    <Bar value={n.share} tone={n.lucro >= 0 ? 'profit' : 'loss'} delay={0.35 + i * 0.06} />
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section {...fade(0.35)} className="v2-panel">
              <PanelHead
                title="Custos da operação"
                sub={`${brl(custoTotal)} no período`}
                action={<button type="button" className="v2-link">Lançar custo</button>}
              />
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
                    <Bar value={c.share} delay={0.4 + i * 0.06} />
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--b1)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Impacto no lucro final</span>
                  <span className="v2-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--loss)' }}>
                    -{((custoTotal / (totals.lucroFinalTotal || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        {/* ═══════════ RODAPE ═══════════ */}
        <motion.footer {...fade(0.4)} className="v2-foot">
          <span>NexControl · Dashboard v2 · dados de demonstração</span>
          <nav>
            <button type="button">Documentação</button>
            <button type="button">Changelog</button>
            <button type="button">Suporte</button>
            <button type="button">Status</button>
          </nav>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--profit)', display: 'block' }} />
            Todos os sistemas operacionais
          </span>
        </motion.footer>
      </Shell>
    </>
  )
}

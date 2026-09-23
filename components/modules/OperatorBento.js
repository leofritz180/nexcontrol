'use client'
// ─────────────────────────────────────────────────────────────────────────
// PAINEL DO OPERADOR — visual 2.0.
//
// REGRA QUE NAO SE NEGOCIA: operador NUNCA ve campo financeiro do
// administrador. Nada de salario, bau, custo_fixo, taxa_agente ou
// lucro_final aqui dentro. O que ele ve e o que ELE registrou: contas,
// remessas, deposito e saque.
//
// A versao anterior deste arquivo trocava o painel inteiro por um resumo
// de quatro blocos, e com isso o operador PERDIA coisa ao entrar na 2.0:
// patente, stats pessoais, ranking, conquistas, alertas, acoes rapidas,
// os filtros Todas/Ativas/Fechadas e o destaque da meta em andamento.
// Redesenho nao pode tirar funcao. Tudo voltou, na linguagem do bento.
//
// AS ANCORAS DO TOUR MORAM AQUI: op-kpis, op-nova-meta, op-metas,
// op-stats, op-ranking, op-conquistas e op-alertas. Elas estao em
// lib/tour-config.js (OPERATOR_TOUR_STEPS) — mexer no data-tour sem
// mexer la quebra o tour em silencio.
// ─────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import RankBadge from '../rank/RankBadge'
import {
  BCard, Eyebrow, ModuleHeader, AcaoBtn, Hero, Tira, Lista, Destaque,
  MONO, int, money0, RED, RED2,
} from '../ui/bento'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* Painel da coluna da direita. Envelope proprio porque o BCard nao repassa
   props soltas, e o data-tour precisa cair num elemento de verdade. */
function Painel({ tour, titulo, icone, extra, children, delay = 0 }) {
  return (
    <div data-tour={tour}>
      <BCard pad={20} delay={delay}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {icone && <span style={{ color: 'var(--t3)', display: 'inline-flex' }}>{icone}</span>}
          <h3 style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em' }}>{titulo}</h3>
          {extra}
        </div>
        {children}
      </BCard>
    </div>
  )
}

const IcoTrofeu = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M6 4h12v7a6 6 0 0 1-12 0z" /><path d="M12 17v4M8 21h8" /></svg>
const IcoAlerta = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
const IcoCheck = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const IcoMais = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
const IcoRecarregar = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
const IcoPlay = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z" /></svg>

export default function OperatorBento({
  nome, email, stats, metas = [], remessas = [],
  perfStats, alertas, milestones = [], activeMeta,
  forceApex = false,
  onNovaMeta, onAbrirMeta, onAtualizar,
}) {
  const s = stats || {}
  const p = perfStats || {}
  const a = alertas || { total: 0, sp: 0, cb: 0, ba: 0 }
  const [aba, setAba] = useState('todas')

  const remPorMeta = useMemo(() => {
    const m = new Map()
    for (const r of (remessas || [])) {
      if (!m.has(r.meta_id)) m.set(r.meta_id, [])
      m.get(r.meta_id).push(r)
    }
    return m
  }, [remessas])

  const vivas = useMemo(() => (metas || []).filter(m => !m.deleted_at), [metas])
  const filtradas = useMemo(() => vivas.filter(m => {
    if (aba === 'ativas') return m.status_fechamento !== 'fechada' && (m.status === 'ativa' || m.status === 'em_andamento')
    if (aba === 'fechadas') return m.status_fechamento === 'fechada'
    return true
  }), [vivas, aba])

  const nAtivas = vivas.filter(m => m.status_fechamento !== 'fechada' && (m.status === 'ativa' || m.status === 'em_andamento')).length
  const nFechadas = vivas.filter(m => m.status_fechamento === 'fechada').length
  const pct = Number(s.taxaConclusao || 0)

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const linhas = filtradas.map(m => {
    const mr = remPorMeta.get(m.id) || []
    const dep = mr.reduce((x, r) => x + Number(r.deposito || 0), 0)
    const saq = mr.reduce((x, r) => x + Number(r.saque || 0), 0)
    const fechada = m.status_fechamento === 'fechada'
    const info = [
      m.plataforma || null,
      `${int(m.quantidade_contas)} contas`,
      `${mr.length} remessa${mr.length === 1 ? '' : 's'}`,
      mr.length ? `D: R$ ${fmt(dep)}` : null,
      mr.length ? `S: R$ ${fmt(saq)}` : null,
    ].filter(Boolean).join(' · ')
    return {
      k: m.id,
      avatar: String(m.rede || '—').slice(0, 3).toUpperCase(),
      avatarBg: fechada ? 'var(--fill-1)' : 'rgba(229,57,31,0.1)',
      avatarFg: fechada ? 'var(--t3)' : RED,
      t: `${int(m.quantidade_contas)} DEP ${m.rede || ''}`.trim(),
      s: info,
      v: fechada ? 'Fechada' : 'Ativa',
      vc: fechada ? 'var(--t3)' : RED,
      onClick: onAbrirMeta ? () => onAbrirMeta(m.id) : undefined,
    }
  })

  const Aba = ({ id, rotulo, n }) => (
    <button type="button" onClick={() => setAba(id)}
      style={{
        padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        border: '1px solid ' + (aba === id ? 'var(--b2)' : 'transparent'),
        background: aba === id ? 'var(--raised)' : 'transparent',
        color: aba === id ? 'var(--t1)' : 'var(--t3)',
        transition: 'all .18s ease',
      }}>
      {rotulo} <span style={{ fontFamily: MONO, opacity: 0.6, marginLeft: 3 }}>{n}</span>
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── CABECALHO: nome, patente, data e as duas acoes ───────────── */}
      <ModuleHeader
        titulo={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
            Olá, {nome || 'operador'}
            <RankBadge contas={p.totalDeps ?? s.totalDepositantes ?? 0} size="sm" forceApex={forceApex} />
          </span>
        }
        sub={`${hoje} · ${int(s.ativas)} meta(s) em andamento · ${int(s.nRem)} remessas registradas`}
        acao={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onAtualizar && (
              <button type="button" onClick={onAtualizar}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 15px', borderRadius: 11, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                  color: 'var(--t2)', background: 'transparent', border: '1px solid var(--b2)',
                }}>
                {IcoRecarregar} Atualizar
              </button>
            )}
            <span data-tour="op-nova-meta">
              <AcaoBtn onClick={onNovaMeta} icon={<path d="M12 5v14M5 12h14" />}>Nova meta</AcaoBtn>
            </span>
          </div>
        }
      />

      {/* ── OS INDICADORES ───────────────────────────────────────────── */}
      <div data-tour="op-kpis" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Hero
          rotulo="Contas processadas"
          valor={int(p.totalDeps ?? s.totalDepositantes)}
          nota={`${int(s.fechadas)} metas concluídas de ${int(s.total)}`}
          blob={['var(--profit-dim)', 'var(--profit-border)']}
          extras={[
            { l: 'Conclusão', v: `${pct}%`, c: pct >= 60 ? 'var(--profit)' : 'var(--t1)' },
            { l: 'Remessas', v: int(s.nRem) },
          ]}
        />
        <Tira itens={[
          { l: 'Metas ativas', v: int(s.ativas), hint: `${int(s.total)} no total` },
          { l: 'Total remessas', v: int(s.nRem), hint: 'registradas' },
          { l: 'Total depositantes', v: int(s.totalDepositantes), hint: 'soma das contas' },
          { l: 'Taxa de conclusão', v: `${pct}%`, c: pct >= 60 ? 'var(--profit)' : 'var(--t1)', hint: `${int(s.fechadas)} de ${int(s.total)} fechadas` },
        ]} />
      </div>

      {/* ── DUAS COLUNAS ─────────────────────────────────────────────── */}
      <div className="ob-cols" style={{ display: 'grid', gridTemplateColumns: '2.05fr 1fr', gap: 14, alignItems: 'start' }}>

        {/* ESQUERDA: a meta em andamento e a lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeMeta && (
            <Destaque
              rotulo="Meta em andamento"
              titulo={`${int(activeMeta.quantidade_contas)} DEP ${activeMeta.rede || ''}`.trim()}
              valor={`${int((remPorMeta.get(activeMeta.id) || []).length)} remessas`}
              nota={activeMeta.plataforma ? `${activeMeta.plataforma} · continue de onde parou` : 'continue de onde parou'}
              avatar={String(activeMeta.rede || '?').slice(0, 2).toUpperCase()}
              blob={[RED2, RED]}
              delay={0.06}
              onClick={onAbrirMeta ? () => onAbrirMeta(activeMeta.id) : undefined}
            />
          )}

          <div data-tour="op-metas">
            <Lista
              titulo="Suas metas"
              vazio="Nenhuma meta por aqui. Crie a primeira no botão acima."
              linhas={linhas}
              delay={0.1}
              placeholderBusca="Buscar meta…"
              acao={
                <div style={{ display: 'flex', gap: 4 }}>
                  <Aba id="todas" rotulo="Todas" n={vivas.length} />
                  <Aba id="ativas" rotulo="Ativas" n={nAtivas} />
                  <Aba id="fechadas" rotulo="Fechadas" n={nFechadas} />
                </div>
              }
            />
          </div>
        </div>

        {/* DIREITA: o que e do operador, e so dele */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Painel tour="op-stats" titulo="Stats pessoais" delay={0.12}>
            <div>
              {[
                { l: 'Metas fechadas', v: int(p.fechadasCount) },
                { l: 'Total de depositantes', v: int(p.totalDeps) },
                { l: 'Média depositantes/meta', v: int(p.mediaDeps) },
                { l: 'Média remessas/meta', v: int(p.mediaRem) },
              ].map((it, i, arr) => (
                <div key={it.l} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--b1)' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>{it.l}</span>
                  <span style={{ fontFamily: MONO, fontSize: 15.5, fontWeight: 800, color: 'var(--t2)' }}>{it.v}</span>
                </div>
              ))}
            </div>
          </Painel>

          <Painel tour="op-ranking" titulo="Ranking pessoal" icone={IcoTrofeu} delay={0.16}>
            <div style={{ padding: '16px 14px', borderRadius: 14, background: 'var(--fill-1)', border: '1px solid var(--b1)', textAlign: 'center' }}>
              <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 900, color: 'var(--t1)', margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {int(p.totalDeps)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>depositantes totais</p>
            </div>
          </Painel>

          <Painel tour="op-conquistas" titulo="Conquistas" delay={0.2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {milestones.map(m => (
                <div key={m.label} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 11px', borderRadius: 10,
                  background: m.achieved ? 'var(--fill-1)' : 'transparent',
                  border: '1px solid ' + (m.achieved ? 'var(--b1)' : 'transparent'),
                  opacity: m.achieved ? 1 : 0.45,
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: m.achieved ? 'var(--profit-dim)' : 'var(--raised)',
                    color: m.achieved ? 'var(--profit)' : 'var(--t4)',
                  }}>
                    {m.achieved ? IcoCheck : null}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: m.achieved ? 650 : 500, color: m.achieved ? 'var(--t1)' : 'var(--t3)' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </Painel>

          <Painel
            tour="op-alertas"
            titulo="Alertas"
            icone={IcoAlerta}
            delay={0.24}
            extra={a.total > 0 ? (
              <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: 'var(--fill-3)', color: 'var(--t1)', border: '1px solid var(--b3)' }}>{a.total}</span>
            ) : null}
          >
            {a.total === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>Nenhum alerta no momento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { n: a.sp, l: 'Saque pendente', perda: false },
                  { n: a.cb, l: 'Conta bloqueada', perda: true },
                  { n: a.ba, l: 'Banco em análise', perda: false },
                ].filter(x => x.n > 0).map(x => (
                  <div key={x.l} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 10,
                    background: x.perda ? 'var(--loss-dim, rgba(239,68,68,0.08))' : 'var(--fill-3)',
                    border: '1px solid ' + (x.perda ? 'var(--loss-border, rgba(239,68,68,0.2))' : 'var(--b3)'),
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 650, color: x.perda ? 'var(--loss)' : 'var(--t1)' }}>{x.l}</span>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: x.perda ? 'var(--loss)' : 'var(--t1)' }}>{x.n}</span>
                  </div>
                ))}
              </div>
            )}
          </Painel>

          <Painel titulo="Ações rápidas" delay={0.28}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={onNovaMeta}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 12, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, color: '#fff',
                  background: RED, border: '1px solid ' + RED,
                  boxShadow: '0 2px 12px rgba(229,57,31,0.25)',
                }}>
                {IcoMais} Iniciar nova meta
              </button>
              {activeMeta && onAbrirMeta && (
                <button type="button" onClick={() => onAbrirMeta(activeMeta.id)}
                  style={{
                    width: '100%', padding: '11px 16px', borderRadius: 12, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--t2)',
                    background: 'transparent', border: '1px solid var(--b2)',
                  }}>
                  {IcoPlay} Abrir meta ativa
                </button>
              )}
            </div>
          </Painel>

        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .ob-cols { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px)  { .bk-tira { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 460px)  { .bk-tira { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

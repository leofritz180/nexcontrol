'use client'
// ─────────────────────────────────────────────────────────────────────────
// METAS & FECHAMENTO — o TOPO da aba (a lista de metas continua na página).
//
// Reorganizado em 25/09/2026 depois de comparar com o painel de um
// concorrente: a nossa aba tinha MAIS informação e parecia menos
// organizada, porque usava três estilos de filtro e três sinais de cor pra
// uma coisa só. Aqui vale uma disciplina:
//
//   · um único estilo de controle (pílula de 40px, raio 30) pra operador,
//     status e período — nunca quebra em duas linhas desiguais, rola;
//   · a grade de números é 2×2, cards do MESMO tamanho, rótulo em cinza e
//     cor só no número que carrega significado (verde lucro, vermelho
//     prejuízo). Nada de borda lateral colorida nem bolinha pulsando;
//   · antes da grade, a barra de PROGRESSO DAS CONTAS (feitas / alvo das
//     metas abertas) — é o número que o dono de operação CPA olha primeiro;
//   · a "Leitura da operação" vem DEPOIS dos números, como uma faixa de uma
//     linha: número é o que a pessoa veio ver, leitura é comentário.
//
// 100% apresentação: filtros e dados chegam por props da página.
// ─────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BCard, Ico, MONO, RED, RED2, int, NumeroTexto } from '../ui/bento'

const I_PESSOA = <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
const I_LAMPADA = <><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.7V17H8v-2.3A7 7 0 0 1 12 2z" /></>
const I_SETA = <polyline points="6 9 12 15 18 9" />

const STATUS = [['all', 'Todas'], ['ativa', 'Ativas'], ['finalizada', 'Finalizadas'], ['fechada', 'Fechadas']]
const PERIODO = [['all', 'Tudo'], ['today', 'Hoje'], ['yesterday', 'Ontem'], ['week', '7 dias'], ['month', '30 dias']]

/* A pílula: o único controle desta tela. Ativa = preenchida com a cor do
   texto principal (preto no claro, branco no escuro), pra não competir com
   o vermelho dos números. */
function Pilula({ ativa, onClick, children, style }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativa}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '0 15px', borderRadius: 30, flexShrink: 0,
        border: ativa ? '1px solid var(--t1)' : '1px solid var(--b1)', background: ativa ? 'var(--t1)' : 'var(--surface)', color: ativa ? 'var(--surface)' : 'var(--t2)',
        fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .18s ease, color .18s ease, border-color .18s ease', ...style,
      }}>{children}</button>
  )
}

export default function MetasBento({ operators = [], selectedOp, onOperador, status = 'all', onStatus, periodo = 'all', onPeriodo, metas = [], remessas = [], getName }) {
  const nome = p => (getName ? getName(p) : p?.nome || p?.email || 'Operador')

  // Um passe só pelas remessas, indexado por meta — a página varre três vezes.
  const porMeta = useMemo(() => {
    const m = new Map()
    for (const r of remessas) {
      const e = m.get(r.meta_id) || { liq: 0, contas: 0, ultimas: [] }
      e.liq += Number(r.lucro || 0) - Number(r.prejuizo || 0)
      if (r.tipo !== 'redeposito') e.contas += Number(r.contas_remessa || 0)   // redepósito não conta na progressão (regra do projeto)
      e.ultimas.push(r)
      m.set(r.meta_id, e)
    }
    return m
  }, [remessas])

  const k = useMemo(() => {
    let contasAlvo = 0, feitas = 0, alvoAbertas = 0, feitasAbertas = 0, lucro = 0, prej = 0, neutras = 0, concluidas = 0, abertas = 0
    for (const m of metas) {
      const e = porMeta.get(m.id) || { liq: 0, contas: 0, ultimas: [] }
      const alvo = Number(m.quantidade_contas || 0)
      const fechada = m.status_fechamento === 'fechada'
      const val = fechada && m.lucro_final != null ? Number(m.lucro_final) : e.liq
      contasAlvo += alvo
      feitas += fechada ? alvo : Math.min(e.contas, alvo)
      if (!fechada) { abertas++; alvoAbertas += alvo; feitasAbertas += Math.min(e.contas, alvo) }
      if (fechada) concluidas++
      if (val > 0) lucro++; else if (val < 0) prej++; else neutras++
    }
    const pct = alvoAbertas > 0 ? Math.round((feitasAbertas / alvoAbertas) * 100) : 0
    return { contasAlvo, feitas, alvoAbertas, feitasAbertas, pct, lucro, prej, neutras, concluidas, abertas }
  }, [metas, porMeta])

  // A leitura: os mesmos critérios de antes (rede que mais perde, sequência
  // negativa, tamanho de meta que rende, maioria no positivo).
  const leitura = useMemo(() => {
    if (metas.length < 2) return []
    const out = []
    const abertas = metas.filter(m => m.status_fechamento !== 'fechada')
    const porRede = {}
    for (const m of abertas) {
      const r = (m.rede || 'Outros').toUpperCase(); const e = porMeta.get(m.id)
      porRede[r] = (porRede[r] || 0) + (e ? e.liq : 0)
    }
    const pior = Object.entries(porRede).filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1])[0]
    if (pior) out.push({ t: `Maior parte do prejuízo vem da ${pior[0]}`, c: 'var(--loss)' })
    const seqNeg = abertas.filter(m => { const u = [...(porMeta.get(m.id)?.ultimas || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 2); return u.length >= 2 && u.every(r => Number(r.resultado || 0) < 0) }).length
    if (seqNeg) out.push({ t: `${seqNeg} meta${seqNeg > 1 ? 's' : ''} em sequência negativa`, c: 'var(--loss)' })
    const fechPos = metas.filter(m => m.status_fechamento === 'fechada' && Number(m.lucro_final || 0) > 0)
    if (fechPos.length >= 2) out.push({ t: `Metas de ~${Math.round(fechPos.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0) / fechPos.length)} contas rendem mais`, c: 'var(--profit)' })
    const pos = abertas.filter(m => (porMeta.get(m.id)?.liq || 0) > 0).length
    if (abertas.length >= 2 && pos > abertas.length * 0.6) out.push({ t: `${pos} de ${abertas.length} abertas no positivo`, c: 'var(--profit)' })
    return out.slice(0, 4)
  }, [metas, porMeta])

  const opSel = operators.find(o => o.id === selectedOp)

  const KPI = ({ rotulo, valor, cor, sub, delay = 0 }) => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}>
      <BCard pad="18px 20px" style={{ height: '100%', minHeight: 104 }}>
        <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: 0 }}>{rotulo}</p>
        <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1, color: cor || 'var(--t1)', margin: '12px 0 0' }}><NumeroTexto delay={delay + 0.1}>{valor}</NumeroTexto></p>
        {sub && <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '6px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</p>}
      </BCard>
    </motion.div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
      {/* título + operador */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 25, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>Metas & Fechamento</h1>
          <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '3px 0 0' }}>Acompanhe, filtre e feche as operações da equipe</p>
        </div>
        {/* o select nativo continua por baixo (acessível, funciona no celular); a pílula é só a roupa */}
        <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 34px 0 14px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', color: 'var(--t1)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', maxWidth: '100%' }}>
          <Ico d={I_PESSOA} s={14} c="var(--t3)" />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{opSel ? nome(opSel) : 'Todos os operadores'}</span>
          <span style={{ position: 'absolute', right: 12, display: 'inline-flex', pointerEvents: 'none' }}><Ico d={I_SETA} s={13} c="var(--t3)" /></span>
          <select aria-label="Operador" value={selectedOp || ''} onChange={e => onOperador?.(e.target.value || null)}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', fontSize: 16 }}>
            <option value="">Todos os operadores</option>
            {operators.map(op => <option key={op.id} value={op.id}>{nome(op)}</option>)}
          </select>
        </label>
      </div>

      {/* UMA fileira de filtros: status e período com a mesma roupa. Rola de
          lado no celular em vez de quebrar em linhas desiguais. */}
      <div className="mb-filtros" data-tour="ops-filters" style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {STATUS.map(([v, l]) => <Pilula key={v} ativa={status === v} onClick={() => onStatus?.(v)}>{l}</Pilula>)}
        <span aria-hidden style={{ width: 1, height: 22, background: 'var(--b2)', flexShrink: 0, margin: '0 4px' }} />
        {PERIODO.map(([v, l]) => <Pilula key={v} ativa={periodo === v} onClick={() => onPeriodo?.(v)}>{l}</Pilula>)}
      </div>

      {/* progresso das contas nas metas abertas */}
      {k.abertas > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <BCard pad="16px 20px">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em' }}>Progresso das metas abertas</span>
              <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 900, color: 'var(--t1)' }}>{k.pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: 'var(--fill-2)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${k.pct}%` }} transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }} style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${RED2}, ${RED})` }} />
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '8px 0 0' }}>
              {int(k.feitasAbertas)} de {int(k.alvoAbertas)} contas feitas · {int(k.abertas)} meta{k.abertas === 1 ? '' : 's'} rodando · faltam {int(Math.max(0, k.alvoAbertas - k.feitasAbertas))}
            </p>
          </BCard>
        </motion.div>
      )}

      {/* a grade: sempre 2×2, nunca um card sobrando */}
      {metas.length > 0 && (
        <div className="mb-grade" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          <KPI rotulo="Contas" valor={int(k.contasAlvo)} sub={`${int(k.feitas)} feitas`} delay={0.02} />
          <KPI rotulo="Em lucro" valor={int(k.lucro)} cor="var(--profit)" sub={k.lucro === 1 ? 'meta' : 'metas'} delay={0.06} />
          <KPI rotulo="Em prejuízo" valor={int(k.prej)} cor={k.prej > 0 ? 'var(--loss)' : 'var(--t1)'} sub={k.neutras > 0 ? `${k.prej === 1 ? 'meta' : 'metas'} · ${int(k.neutras)} neutra${k.neutras === 1 ? '' : 's'}` : (k.prej === 1 ? 'meta' : 'metas')} delay={0.1} />
          <KPI rotulo="Concluídas" valor={int(k.concluidas)} sub={`de ${int(metas.length)} no filtro`} delay={0.14} />
        </div>
      )}

      {/* leitura: uma faixa, depois dos números */}
      {leitura.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
          <BCard pad="14px 18px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--fill-1)', border: '1px solid var(--b1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}><Ico d={I_LAMPADA} s={14} /></span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--t1)' }}>Leitura</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'var(--profit)' }}><span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--profit)' }} />AO VIVO</span>
              </span>
              {leitura.map((l, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 20, background: 'var(--fill-1)', border: '1px solid var(--b1)', fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: l.c, flexShrink: 0 }} />{l.t}
                </span>
              ))}
            </div>
          </BCard>
        </motion.div>
      )}

      <style>{`
        .mb-filtros::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) { .mb-filtros { -webkit-mask-image: linear-gradient(90deg, #000 88%, transparent); mask-image: linear-gradient(90deg, #000 88%, transparent); padding-right: 24px; } }
        @media (max-width: 900px) { .mb-grade { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
      `}</style>
    </div>
  )
}

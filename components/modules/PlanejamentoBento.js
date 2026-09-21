'use client'
// ─────────────────────────────────────────────────────────────────────────
// CONTROLE OPERACIONAL (/planejamento) — visual 2.0.
//
// Componente PURO: recebe as linhas, os operadores e TODOS os handlers da
// página. Não busca, não grava, não conhece Supabase nem a API.
//
// A planilha CONTINUA planilha: é assim que o dono trabalha a operação do
// dia. O que mudou é a casca — cabeçalho e indicadores no bento, filtros em
// pílulas, a tabela dentro de um cartão claro com cabeçalho grudado.
//
// DUAS DECISÕES:
//  1. Paleta enxuta: o arco-íris de 26 cores por rede saiu. A rede agora é
//     um selo em mono e a faixa lateral usa a rampa da marca (FATIAS),
//     indexada por hash do nome — continua dando pra bater o olho e
//     separar as redes, sem azul/roxo/amarelo.
//  2. Nenhum input numérico é type="number": a roda do mouse alterava o
//     valor (bug conhecido da casa). Entram como texto com inputMode
//     decimal e um buffer local, pra dar pra digitar "1.234,5" em paz.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModuleHeader, Hero, Tira, Barras, BCard, Rosca, Vazio, Ico, MONO, FATIAS, RED, RED2, money, int } from '../ui/bento'
import { Pilulas, lerMoeda } from '../ui/campo'

// Cor da rede vinda da rampa da marca, estável por nome.
function corDaRede(rede) {
  const s = String(rede || '')
  if (!s) return 'var(--b1)'
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return FATIAS[h % FATIAS.length]
}

const sinal = v => `${Number(v) >= 0 ? '+' : '-'}${money(Math.abs(Number(v) || 0))}`

// Tokens compactos: a caixa de 44px do kit CAMPO não cabe numa planilha de
// 14 colunas, então aqui a caixa é a MESMA linguagem em versão densa.
const CAIXA = {
  width: '100%', boxSizing: 'border-box', minHeight: 32,
  padding: '6px 9px', borderRadius: 10,
  background: 'transparent', border: '1px solid transparent',
  color: 'var(--t1)', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit',
  outline: 'none', transition: 'background-color .14s ease, border-color .14s ease',
}

// Enter desce para a mesma coluna da linha de baixo — atalho que o dono usa
// pra preencher a planilha em coluna. Não pode sumir.
function descerNoEnter(e) {
  if (e.key !== 'Enter') return
  e.preventDefault()
  const td = e.target.closest('td')
  if (!td) return
  const tr = td.closest('tr')
  if (!tr) return
  const idx = Array.from(tr.cells).indexOf(td)
  const prox = tr.nextElementSibling
  const alvo = prox && prox.cells[idx] && prox.cells[idx].querySelector('input,select')
  if (alvo) alvo.focus()
}

function focar(e) { e.currentTarget.style.background = 'var(--input)'; e.currentTarget.style.borderColor = 'var(--brand)' }
function desfocar(e) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }

// ── CÉLULA DE TEXTO ──────────────────────────────────────────────────────
function Celula({ valor, aoMudar, placeholder, style, mono = false }) {
  return (
    <input
      type="text" value={valor ?? ''} placeholder={placeholder}
      onChange={e => aoMudar(e.target.value)}
      onKeyDown={descerNoEnter}
      onFocus={focar} onBlur={desfocar}
      style={{ ...CAIXA, fontFamily: mono ? MONO : 'inherit', ...style }}
    />
  )
}

// ── CÉLULA NUMÉRICA ──────────────────────────────────────────────────────
// Guarda o texto digitado enquanto o campo está em edição (`buffer`) e
// entrega SEMPRE um número pro estado da página — mesmo contrato de antes.
// Sem isso, digitar "12," viraria 12 na hora e a vírgula sumiria.
function CelulaNum({ valor, aoMudar, inteiro = false, style }) {
  const [buffer, setBuffer] = useState(null)
  const exibir = buffer !== null ? buffer : String(valor ?? '')

  function mudar(bruto) {
    const limpo = inteiro ? bruto.replace(/[^\d]/g, '') : bruto.replace(/[^\d.,-]/g, '')
    setBuffer(limpo)
    // lerMoeda é o espelho EXATO do parseVal do projeto — usar qualquer
    // outro parse aqui mudaria o número que vai pro banco.
    aoMudar(lerMoeda(limpo))
  }

  return (
    <input
      type="text" inputMode={inteiro ? 'numeric' : 'decimal'}
      value={exibir}
      onChange={e => mudar(e.target.value)}
      onKeyDown={descerNoEnter}
      onFocus={focar}
      onBlur={e => { setBuffer(null); desfocar(e) }}
      style={{ ...CAIXA, fontFamily: MONO, fontWeight: 700, textAlign: 'right', ...style }}
    />
  )
}

// ── SELECT COMPACTO ──────────────────────────────────────────────────────
function Escolha({ valor, aoMudar, opcoes, vazio = '--', style }) {
  return (
    <span style={{ position: 'relative', display: 'block' }}>
      <select value={valor ?? ''} onChange={e => aoMudar(e.target.value)}
        onFocus={focar} onBlur={desfocar}
        style={{ ...CAIXA, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: 20, cursor: 'pointer', ...style }}>
        <option value="">{vazio}</option>
        {opcoes.map(o => <option key={String(o.v)} value={o.v}>{o.l}</option>)}
      </select>
      <span aria-hidden style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t4)', display: 'inline-flex' }}>
        <Ico d={<path d="M6 9l6 6 6-6" />} s={12} />
      </span>
    </span>
  )
}

// ── BOTÃO DE STATUS (cicla pendente ▸ andamento ▸ concluído ▸ problema) ──
function PilulaStatus({ st, onClick, compacta = false }) {
  const cores = {
    concluido: { fg: 'var(--profit)', bg: 'var(--profit-dim)', bd: 'var(--profit-border)' },
    problema: { fg: 'var(--loss)', bg: 'var(--loss-dim)', bd: 'var(--loss-border)' },
    em_andamento: { fg: RED, bg: 'rgba(229,57,31,0.09)', bd: 'rgba(229,57,31,0.22)' },
    pendente: { fg: 'var(--t3)', bg: 'var(--fill-1)', bd: 'var(--b1)' },
  }
  const c = cores[st.key] || cores.pendente
  const icone = st.key === 'concluido' ? <path d="M20 6L9 17l-5-5" />
    : st.key === 'problema' ? <><path d="M12 3l9.5 17h-19L12 3z" /><path d="M12 10v4M12 17h.01" /></>
      : st.key === 'em_andamento' ? <path d="M6 4l12 8-12 8V4z" />
        : <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
  return (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.95 }}
      title="Clique para avançar o status"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        width: compacta ? undefined : 108, padding: compacta ? '4px 10px' : '6px 10px',
        borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        fontSize: 9.5, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
        background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
        transition: 'background-color .16s ease, border-color .16s ease, color .16s ease',
      }}>
      <Ico d={icone} s={11} c={c.fg} />{st.label}
    </motion.button>
  )
}

// ── SINALIZADOR LUCRO/PREJUÍZO (a setinha ao lado do valor) ──────────────
function Sinal({ lucro, onAlternar, titulo }) {
  return (
    <motion.button type="button" onClick={onAlternar} whileTap={{ scale: 0.9 }} title={titulo}
      style={{
        flexShrink: 0, width: 22, height: 22, borderRadius: 7, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: lucro ? 'var(--profit-dim)' : 'var(--loss-dim)',
        border: `1px solid ${lucro ? 'var(--profit-border)' : 'var(--loss-border)'}`,
      }}>
      <Ico d={lucro ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />} s={11} c={lucro ? 'var(--profit)' : 'var(--loss)'} />
    </motion.button>
  )
}

// ── BOTÃO DE COPIAR LINK ─────────────────────────────────────────────────
function Copiar({ copiado, onCopiar }) {
  return (
    <motion.button type="button" onClick={onCopiar} whileTap={{ scale: 0.9 }} title="Copiar link"
      style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: 8, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: copiado ? 'var(--profit-dim)' : 'var(--fill-1)',
        border: `1px solid ${copiado ? 'var(--profit-border)' : 'var(--b1)'}`,
        color: copiado ? 'var(--profit)' : 'var(--t3)',
      }}>
      <Ico d={copiado
        ? <path d="M20 6L9 17l-5-5" />
        : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>} s={12} />
    </motion.button>
  )
}

// ── AVISO DE SALVAMENTO ──────────────────────────────────────────────────
function Aviso({ estado }) {
  const mapa = {
    saving: { t: 'Salvando...', fg: 'var(--t2)', bg: 'var(--fill-1)', bd: 'var(--b1)' },
    saved: { t: 'Salvo', fg: 'var(--profit)', bg: 'var(--profit-dim)', bd: 'var(--profit-border)' },
    error: { t: 'Erro ao salvar', fg: 'var(--loss)', bg: 'var(--loss-dim)', bd: 'var(--loss-border)' },
  }
  return (
    <AnimatePresence>
      {estado && (
        <motion.span
          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999,
            background: mapa[estado].bg, border: `1px solid ${mapa[estado].bd}`,
            fontSize: 11, fontWeight: 800, color: mapa[estado].fg,
          }}>
          {estado === 'saving' && (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--b2)', borderTopColor: 'var(--t2)' }} />
          )}
          {estado === 'saved' && <Ico d={<path d="M20 6L9 17l-5-5" />} s={12} c="var(--profit)" />}
          {estado === 'error' && <Ico d={<path d="M18 6L6 18M6 6l12 12" />} s={12} c="var(--loss)" />}
          {mapa[estado].t}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

// ── MÓDULO ───────────────────────────────────────────────────────────────
export default function PlanejamentoBento({
  linhas = [],          // já filtradas e ordenadas pela página
  todas = [],           // todas as linhas (base dos indicadores)
  operadores = [],      // [{ id, nome }]
  redes = [],
  statuses = [],
  pegarStatus,          // (chave) => objeto de status
  filtro = 'todos', onFiltro,
  kpis = {},
  saveStatus = null,
  linhaVazia = () => false,
  copiado = null, onCopiar,
  expandido = null, onExpandir,
  onCampo,              // (id, campo, valor)
  onOperador,           // (id, operadorId)
  onCiclarStatus,
  onNovaLinha,
  onExcluir,
  onSalvarTudo,
}) {
  // ── Indicadores derivados (só leitura, nada persiste daqui) ──
  const porRede = {}
  todas.forEach(r => {
    const k = (r.rede || '').toUpperCase()
    if (!k) return
    porRede[k] = (porRede[k] || 0) + Number(r.quantidade || 0)
  })
  const barras = Object.entries(porRede)
    .sort((a, b) => b[1] - a[1]).slice(0, 7)
    .map(([l, v]) => ({ l, v, txt: int(v), dot: corDaRede(l) }))

  const rosca = statuses.map((s, i) => ({
    l: s.label,
    v: todas.filter(r => (r.status || 'pendente') === s.key).length,
    c: s.key === 'concluido' ? 'var(--profit)' : s.key === 'problema' ? 'var(--loss)' : FATIAS[i % FATIAS.length],
  })).filter(d => d.v > 0)

  const colunas = ['REDE', 'DEP', 'AGENTE', 'APOSTAS', 'LINK', 'OPERADOR', 'STATUS', 'OBS', 'PREJ./LUCRO', 'CUSTOS', 'SAL+BAÚ', 'LUCRO TOTAL', 'L. PARCIAL', '']
  const opcoesOperador = operadores.map(o => ({ v: o.id, l: o.nome }))
  const opcoesRede = redes.map(r => ({ v: r, l: r }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Controle Operacional"
        sub="Planejamento de metas e plataformas — a planilha do dia"
        acao={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Aviso estado={saveStatus} />
            {/* Igual ao botão antigo: trava enquanto está salvando, senão o
                dono dispara dois flushes em cima do mesmo lote. */}
            <motion.button type="button" onClick={onSalvarTudo} disabled={saveStatus === 'saving'}
              whileHover={saveStatus === 'saving' ? undefined : { y: -2, boxShadow: '0 14px 32px rgba(229,57,31,0.36)' }}
              whileTap={saveStatus === 'saving' ? undefined : { scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30,
                border: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff',
                background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)',
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                opacity: saveStatus === 'saving' ? 0.6 : 1,
              }}>
              <Ico d={<path d="M20 6L9 17l-5-5" />} s={16} />Salvar e atualizar
            </motion.button>
          </span>
        }
      />

      <Hero
        rotulo="Lucro total do planejamento"
        valor={sinal(kpis.lucroTotal)}
        cor={Number(kpis.lucroTotal) >= 0 ? 'var(--profit)' : 'var(--loss)'}
        nota={`${int(kpis.operacoes)} operaç${Number(kpis.operacoes) === 1 ? 'ão' : 'ões'} · ${int(kpis.depositantes)} depositante${Number(kpis.depositantes) === 1 ? '' : 's'}`}
        blob={[RED2, RED]}
        extras={[
          { l: 'Lucro parcial', v: sinal(kpis.lucroParcial), c: Number(kpis.lucroParcial) >= 0 ? 'var(--profit)' : 'var(--loss)' },
          { l: 'Sal + baú', v: money(kpis.salarioBau) },
          { l: 'Prejuízo', v: money(kpis.prejuizo), c: Number(kpis.prejuizo) > 0 ? 'var(--loss)' : undefined },
        ]}
      />

      <Tira itens={[
        { l: 'Operações', v: int(kpis.operacoes) },
        { l: 'Depositantes', v: int(kpis.depositantes) },
        { l: 'Concluído', v: `${Number(kpis.pctConcluido) || 0}%`, c: 'var(--profit)' },
        { l: 'Com prejuízo', v: int(kpis.comPrejuizo), c: Number(kpis.comPrejuizo) > 0 ? 'var(--loss)' : undefined },
        { l: 'Problemas', v: int(kpis.problemas), c: Number(kpis.problemas) > 0 ? 'var(--loss)' : undefined },
      ]} />

      <div className="pl-2" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 14 }}>
        <Barras titulo="Depositantes por rede" dados={barras} />
        <BCard pad={24} delay={0.18}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Andamento</p>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 20px' }}>em que pé está cada operação</p>
          <Rosca dados={rosca} centro={`${Number(kpis.pctConcluido) || 0}%`} rotulo="concluído" />
        </BCard>
      </div>

      <Pilulas
        valor={filtro}
        aoMudar={v => onFiltro && onFiltro(v)}
        compacto
        opcoes={[
          { v: 'todos', l: `Todos (${int(todas.length)})` },
          ...statuses.map(s => ({ v: s.key, l: `${s.label} (${todas.filter(r => (r.status || 'pendente') === s.key).length})` })),
          { v: 'vazia', l: `Vazias (${todas.filter(r => linhaVazia(r)).length})` },
        ]}
      />

      {/* ═══ PLANILHA (desktop) ═══ */}
      <div className="pl-planilha">
      <BCard pad={0} delay={0.22} style={{ overflow: 'hidden' }}>
        <div className="pl-tabela" style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1480 }}>
            <thead>
              <tr>
                <th style={{ width: 4, padding: 0, background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 5 }} />
                {colunas.map((h, i) => (
                  <th key={i} style={{
                    padding: '13px 10px', textAlign: i >= 8 && i <= 12 ? 'right' : 'left',
                    fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--t4)',
                    whiteSpace: 'nowrap', borderBottom: '1px solid var(--b1)',
                    background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {linhas.map((r, i) => {
                  const lf = Number(r.lucro_final || 0)
                  const st = pegarStatus(r.status)
                  const vazia = linhaVazia(r)
                  const cor = corDaRede(r.rede)
                  const eLucro = (r.tipo_resultado || 'prejuizo') === 'lucro'
                  const eParcialLucro = (r.tipo_parcial || 'lucro') === 'lucro'
                  const prej = Number(r.prejuizo || 0)
                  const lp = Number(r.lucro_parcial || 0)

                  return (
                    <motion.tr key={r.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="pl-linha"
                      onClick={() => onExpandir(expandido === r.id ? null : r.id)}
                      style={{
                        borderBottom: '1px solid var(--b1)',
                        background: st.key === 'concluido' ? 'var(--profit-dim)' : st.key === 'problema' ? 'var(--loss-dim)' : 'transparent',
                        opacity: st.key === 'concluido' ? 0.72 : vazia ? 0.5 : 1,
                      }}>
                      {/* Faixa da rede */}
                      <td style={{ width: 4, padding: 0 }}>
                        <span style={{ display: 'block', width: 4, minHeight: 44, height: '100%', background: r.rede ? cor : 'var(--fill-2)' }} />
                      </td>

                      {/* REDE */}
                      <td style={{ padding: '4px 7px', minWidth: 92 }} onClick={e => e.stopPropagation()}>
                        <Escolha valor={r.rede} aoMudar={v => onCampo(r.id, 'rede', v)} opcoes={opcoesRede}
                          style={{ fontFamily: MONO, fontSize: 13, fontWeight: 900, letterSpacing: '0.02em', color: r.rede ? 'var(--t1)' : 'var(--t4)' }} />
                      </td>

                      {/* DEP */}
                      <td style={{ padding: '4px 6px', minWidth: 58 }} onClick={e => e.stopPropagation()}>
                        <CelulaNum valor={r.quantidade} inteiro aoMudar={v => onCampo(r.id, 'quantidade', v)} style={{ textAlign: 'center', fontWeight: 800 }} />
                      </td>

                      {/* AGENTE */}
                      <td style={{ padding: '4px 6px', minWidth: 104 }} onClick={e => e.stopPropagation()}>
                        <Celula valor={r.agente} aoMudar={v => onCampo(r.id, 'agente', v)} placeholder="..." style={{ fontWeight: 700 }} />
                      </td>

                      {/* APOSTAS */}
                      <td style={{ padding: '4px 6px', minWidth: 86 }} onClick={e => e.stopPropagation()}>
                        <Celula valor={r.apostas} aoMudar={v => onCampo(r.id, 'apostas', v)} placeholder="..." style={{ color: 'var(--t2)' }} />
                      </td>

                      {/* LINK */}
                      <td style={{ padding: '4px 6px', minWidth: 300 }} onClick={e => e.stopPropagation()}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Celula valor={r.link} aoMudar={v => onCampo(r.id, 'link', v)} placeholder="https://..." style={{ fontSize: 11.5, color: r.link ? 'var(--t2)' : 'var(--t4)' }} />
                          {r.link && <Copiar copiado={copiado === r.id} onCopiar={() => onCopiar(r)} />}
                        </span>
                      </td>

                      {/* OPERADOR */}
                      <td style={{ padding: '4px 6px', minWidth: 148 }} onClick={e => e.stopPropagation()}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: MONO, fontSize: 10, fontWeight: 900,
                            background: r.operator_id ? 'var(--fill-2)' : 'var(--profit-dim)',
                            border: `1px solid ${r.operator_id ? 'var(--b1)' : 'var(--profit-border)'}`,
                            color: r.operator_id ? 'var(--t2)' : 'var(--profit)',
                          }}>
                            {r.operator_id
                              ? String(r.operator_name || '?').charAt(0).toUpperCase()
                              : <Ico d={<path d="M12 5v14M5 12h14" />} s={11} c="var(--profit)" />}
                          </span>
                          <Escolha valor={r.operator_id || ''} aoMudar={v => onOperador(r.id, v)} opcoes={opcoesOperador} vazio="DISPONÍVEL"
                            style={{ fontSize: 11.5, fontWeight: 700, color: r.operator_id ? 'var(--t1)' : 'var(--profit)' }} />
                        </span>
                      </td>

                      {/* STATUS */}
                      <td style={{ padding: '4px 7px', minWidth: 118 }} onClick={e => e.stopPropagation()}>
                        <PilulaStatus st={st} onClick={() => onCiclarStatus(r)} />
                      </td>

                      {/* OBS */}
                      <td style={{ padding: '4px 6px', minWidth: 104 }} onClick={e => e.stopPropagation()}>
                        <Celula valor={r.observacao} aoMudar={v => onCampo(r.id, 'observacao', v)} placeholder="..." style={{ fontSize: 11.5, color: 'var(--t3)' }} />
                      </td>

                      {/* PREJ./LUCRO */}
                      <td style={{ padding: '4px 4px', minWidth: 96 }} onClick={e => e.stopPropagation()}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sinal lucro={eLucro} titulo={eLucro ? 'Entrando como lucro' : 'Entrando como prejuízo'}
                            onAlternar={() => onCampo(r.id, 'tipo_resultado', eLucro ? 'prejuizo' : 'lucro')} />
                          <CelulaNum valor={r.prejuizo} aoMudar={v => onCampo(r.id, 'prejuizo', v)}
                            style={{ color: prej > 0 ? (eLucro ? 'var(--profit)' : 'var(--loss)') : 'var(--t4)', fontWeight: prej > 0 ? 800 : 600 }} />
                        </span>
                      </td>

                      {/* CUSTOS */}
                      <td style={{ padding: '4px 4px', minWidth: 74 }} onClick={e => e.stopPropagation()}>
                        <CelulaNum valor={r.custos} aoMudar={v => onCampo(r.id, 'custos', v)}
                          style={{ fontSize: 12, color: Number(r.custos || 0) > 0 ? 'var(--t1)' : 'var(--t4)' }} />
                      </td>

                      {/* SAL+BAÚ */}
                      <td style={{ padding: '4px 4px', minWidth: 74 }} onClick={e => e.stopPropagation()}>
                        <CelulaNum valor={r.salario_bau} aoMudar={v => onCampo(r.id, 'salario_bau', v)}
                          style={{ fontSize: 12, color: Number(r.salario_bau || 0) > 0 ? 'var(--t1)' : 'var(--t4)' }} />
                      </td>

                      {/* LUCRO TOTAL (calculado) */}
                      <td style={{ padding: '4px 8px', minWidth: 96, textAlign: 'right' }}>
                        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 900, color: lf === 0 ? 'var(--t4)' : lf > 0 ? 'var(--profit)' : 'var(--loss)' }}>
                          {lf === 0 ? '—' : sinal(lf)}
                        </span>
                      </td>

                      {/* L. PARCIAL */}
                      <td style={{ padding: '4px 4px', minWidth: 96 }} onClick={e => e.stopPropagation()}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sinal lucro={eParcialLucro} titulo={eParcialLucro ? 'Parcial no lucro' : 'Parcial no prejuízo'}
                            onAlternar={() => onCampo(r.id, 'tipo_parcial', eParcialLucro ? 'prejuizo' : 'lucro')} />
                          <CelulaNum valor={r.lucro_parcial} aoMudar={v => onCampo(r.id, 'lucro_parcial', v)}
                            style={{ color: lp === 0 ? 'var(--t4)' : eParcialLucro ? 'var(--profit)' : 'var(--loss)', fontWeight: 800 }} />
                        </span>
                      </td>

                      {/* AÇÕES */}
                      <td style={{ padding: '4px 8px', width: 40 }} onClick={e => e.stopPropagation()}>
                        <motion.button type="button" onClick={() => onExcluir(r.id)} title="Excluir linha" whileTap={{ scale: 0.9 }}
                          className="pl-lixo"
                          style={{
                            width: 28, height: 28, borderRadius: 9, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: '1px solid transparent', color: 'var(--t4)',
                            transition: 'all .16s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--loss-dim)'; e.currentTarget.style.borderColor = 'var(--loss-border)'; e.currentTarget.style.color = 'var(--loss)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--t4)' }}>
                          <Ico d={<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />} s={13} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {linhas.length === 0 && (
          <Vazio
            titulo={filtro !== 'todos' ? 'Nenhuma linha nesse filtro' : 'A planilha está vazia'}
            texto={filtro !== 'todos' ? 'Troque o filtro ou volte para Todos.' : 'Clique em "Nova linha" pra começar o planejamento do dia.'}
            icone={<><path d="M3 3h18v18H3z" /><path d="M3 9h18M3 15h18M9 3v18" /></>}
          />
        )}
      </BCard>
      </div>

      {/* Nova linha */}
      <motion.button type="button" onClick={onNovaLinha}
        whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
          padding: '14px 20px', borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 800, color: RED,
          background: 'var(--surface)', border: '1px dashed rgba(229,57,31,0.38)',
          transition: 'background-color .16s ease, border-color .16s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,57,31,0.05)'; e.currentTarget.style.borderColor = RED }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'rgba(229,57,31,0.38)' }}>
        <Ico d={<path d="M12 5v14M5 12h14" />} s={15} c={RED} />
        Nova linha
      </motion.button>

      {/* ═══ CARTÕES (celular) ═══ */}
      <div className="pl-cartoes">
        {linhas.length === 0 && (
          <BCard pad={10}>
            <Vazio
              titulo={filtro !== 'todos' ? 'Nenhuma linha nesse filtro' : 'A planilha está vazia'}
              texto={filtro !== 'todos' ? 'Troque o filtro ou volte para Todos.' : 'Toque em "Nova linha" pra começar o planejamento do dia.'}
              icone={<><path d="M3 3h18v18H3z" /><path d="M3 9h18M3 15h18M9 3v18" /></>}
            />
          </BCard>
        )}
        {linhas.map((r, i) => {
          const lf = Number(r.lucro_final || 0)
          const st = pegarStatus(r.status)
          const aberto = expandido === r.id
          const cor = corDaRede(r.rede)
          return (
            <motion.div key={r.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
              onClick={() => onExpandir(aberto ? null : r.id)}
              style={{
                borderRadius: 20, overflow: 'hidden', marginBottom: 10, cursor: 'pointer',
                background: 'var(--surface)', border: '1px solid var(--b1)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
                opacity: st.key === 'concluido' ? 0.72 : linhaVazia(r) ? 0.55 : 1,
              }}>
              <span style={{ display: 'block', height: 3, background: r.rede ? cor : 'var(--fill-2)' }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 9 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 900, color: 'var(--t1)' }}>{r.rede || '--'}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{r.quantidade || 0} contas</span>
                  </span>
                  <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex' }}>
                    <PilulaStatus st={st} compacta onClick={() => onCiclarStatus(r)} />
                  </span>
                </div>

                {(r.agente || r.operator_name) && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 11.5 }}>
                    {r.agente && <span style={{ color: 'var(--t1)', fontWeight: 700 }}>{r.agente}</span>}
                    {r.operator_name && <span style={{ color: 'var(--t3)' }}>{r.operator_name}</span>}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 900, color: lf === 0 ? 'var(--t4)' : lf > 0 ? 'var(--profit)' : 'var(--loss)' }}>
                    {lf === 0 ? money(0) : sinal(lf)}
                  </span>
                  <motion.span animate={{ rotate: aberto ? 180 : 0 }} style={{ display: 'inline-flex', color: 'var(--t4)' }}>
                    <Ico d={<path d="M6 9l6 6 6-6" />} s={15} />
                  </motion.span>
                </div>

                <AnimatePresence initial={false}>
                  {aberto && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                      <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <label style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'var(--t4)', marginBottom: 4 }}>APOSTAS</span>
                            <Celula valor={r.apostas} aoMudar={v => onCampo(r.id, 'apostas', v)} placeholder="70 - 1,5X" style={{ border: '1px solid var(--b2)', background: 'var(--input)' }} />
                          </label>
                          <label style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'var(--t4)', marginBottom: 4 }}>LINK</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Celula valor={r.link} aoMudar={v => onCampo(r.id, 'link', v)} placeholder="https://..." style={{ fontSize: 11.5, border: '1px solid var(--b2)', background: 'var(--input)' }} />
                              {r.link && <Copiar copiado={copiado === r.id} onCopiar={() => onCopiar(r)} />}
                            </span>
                          </label>
                        </div>
                        <label>
                          <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'var(--t4)', marginBottom: 4 }}>OBS / FALTA</span>
                          <Celula valor={r.observacao} aoMudar={v => onCampo(r.id, 'observacao', v)} placeholder="Observação..." style={{ border: '1px solid var(--b2)', background: 'var(--input)' }} />
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <label>
                            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'var(--loss)', marginBottom: 4 }}>PREJUÍZO</span>
                            <CelulaNum valor={r.prejuizo} aoMudar={v => onCampo(r.id, 'prejuizo', v)} style={{ border: '1px solid var(--b2)', background: 'var(--input)' }} />
                          </label>
                          <label>
                            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'var(--t3)', marginBottom: 4 }}>CUSTOS</span>
                            <CelulaNum valor={r.custos} aoMudar={v => onCampo(r.id, 'custos', v)} style={{ border: '1px solid var(--b2)', background: 'var(--input)' }} />
                          </label>
                          <label>
                            <span style={{ display: 'block', fontSize: 9, fontWeight: 900, letterSpacing: '0.12em', color: 'var(--t3)', marginBottom: 4 }}>SAL+BAÚ</span>
                            <CelulaNum valor={r.salario_bau} aoMudar={v => onCampo(r.id, 'salario_bau', v)} style={{ border: '1px solid var(--b2)', background: 'var(--input)' }} />
                          </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
                          <motion.button type="button" onClick={() => onExcluir(r.id)} whileTap={{ scale: 0.96 }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
                              fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                              background: 'var(--loss-dim)', border: '1px solid var(--loss-border)', color: 'var(--loss)',
                            }}>
                            <Ico d={<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />} s={12} />Excluir
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>

      <style>{`
        .pl-cartoes { display: none; }
        .pl-linha:hover { background: var(--fill-1) !important; opacity: 1 !important; }
        @media (max-width: 1000px) { .pl-2 { grid-template-columns: 1fr !important } .bk-tira { grid-template-columns: repeat(2,1fr) !important } }
        @media (max-width: 768px) {
          .pl-planilha { display: none !important; }
          .pl-cartoes { display: block; }
        }
      `}</style>
    </div>
  )
}

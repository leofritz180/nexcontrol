'use client'
// ─────────────────────────────────────────────────────────────────────────
// MINHA OPERAÇÃO — bento. Camada de APRESENTAÇÃO da aba myops no visual 2.0.
// Recebe por props tudo que o /admin já calcula (metas ativas/fechadas,
// lucros, taxas, melhores/piores) e os handlers existentes. Não busca, não
// grava, não recalcula regra de negócio. Só é montado no V2.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion } from 'framer-motion'
import { NX, brl, fmt0, Panel, Strip, Bar, Eyebrow, Sub, Valor, Num, Pill, rise } from '../ui/nex'
import { NumeroTexto } from '../ui/bento'

const RED = '#e5391f', RED2 = '#ff7a4d', LIME = '#3f9b1e'
const MONO = 'var(--mono, "JetBrains Mono", monospace)'
const money0 = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

function Blob({ c1, c2, op = 0.9 }) {
  const id = 'mo' + String(c1).replace(/\W/g, '')
  return (
    <svg viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: '56%', height: '100%', pointerEvents: 'none' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} /></linearGradient></defs>
      <path d="M40,0 C90,18 70,58 110,78 C150,98 180,80 200,64 L200,0 Z" fill={`url(#${id})`} opacity={op} />
      <path d="M78,0 C118,22 100,54 142,72 C172,85 190,78 200,70 L200,0 Z" fill={c1} opacity="0.4" />
    </svg>
  )
}
const Ico = ({ d, c = 'currentColor', s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

const card = {
  position: 'relative', overflow: 'hidden', background: 'var(--surface)',
  borderRadius: 24, border: '1px solid var(--b1)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
}

function Card({ children, style, pad = 22, blob, onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.33, 1, 0.68, 1] }}
      whileHover={{ y: -5, boxShadow: '0 6px 14px rgba(0,0,0,0.06), 0 20px 46px rgba(0,0,0,0.11)' }}
      onClick={onClick}
      style={{ ...card, padding: pad, cursor: onClick ? 'pointer' : 'default', ...style }}>
      {blob && <Blob c1={blob[0]} c2={blob[1]} />}
      <div style={{ position: 'relative' }}>{children}</div>
    </motion.div>
  )
}

export default function MyOpsBento({
  nome, ativas = [], fechadas = [], myRemCount = 0, contasProc = 0,
  lucroTotal = 0, lucroHoje = 0, lucroSemana = 0, lucroMes = 0,
  taxaAcerto = 0, roiMedio = 0, lucroMedioMeta = 0,
  melhorMeta, piorMeta, melhorRede,
  metaProg, metaLiqV, metaContasDone,
  showForm, onToggleForm, onAbrirMeta,
}) {
  const [verFechadas, setVerFechadas] = useState(false)
  const pos = lucroTotal >= 0

  const destaques = [
    {
      tag: 'Melhor meta', c: 'var(--profit)', bg: 'var(--profit-dim)',
      ic: <path d="M23 6 13.5 15.5 8.5 10.5 1 18M17 6h6v6" />,
      title: melhorMeta ? (melhorMeta.m?.titulo || melhorMeta.m?.rede || '—') : '—',
      sub: melhorMeta ? `${melhorMeta.m?.rede || '—'} · ${melhorMeta.m?.quantidade_contas || 0} contas` : 'Sem dados',
      val: melhorMeta ? money0(melhorMeta.liq) : '—', vc: 'var(--profit)',
    },
    {
      tag: 'Maior prejuízo', c: 'var(--loss)', bg: 'var(--loss-dim)',
      ic: <path d="M23 18 13.5 8.5 8.5 13.5 1 6M17 18h6v-6" />,
      title: (piorMeta && piorMeta.liq < 0) ? (piorMeta.m?.titulo || piorMeta.m?.rede || '—') : 'Nenhum prejuízo',
      sub: (piorMeta && piorMeta.liq < 0) ? (piorMeta.m?.rede || '—') : 'Operação no azul',
      val: (piorMeta && piorMeta.liq < 0) ? money0(piorMeta.liq) : '—',
      vc: (piorMeta && piorMeta.liq < 0) ? 'var(--loss)' : 'var(--t4)',
    },
    {
      tag: 'Melhor rede', c: RED, bg: 'rgba(229,57,31,0.09)',
      ic: <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />,
      title: melhorRede ? melhorRede[0] : '—',
      sub: 'Lucro acumulado na rede',
      val: melhorRede ? money0(melhorRede[1]) : '—',
      vc: melhorRede ? (melhorRede[1] >= 0 ? 'var(--profit)' : 'var(--loss)') : 'var(--t4)',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── cabeçalho ── */}
      {/* data-tour: os passos "Minha operação" e "Criar minha meta" do tour
          apontam pra estes dois elementos (lib/tour-config.js). Eles viviam
          só no ramo antigo; sem eles aqui, a caixa de explicação flutua no
          meio da tela sem marcar nada. */}
      <div data-tour="myops-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>Minha operação</h2>
          <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '3px 0 0' }}>
            {ativas.length} ativa{ativas.length === 1 ? '' : 's'} · {fechadas.length} encerrada{fechadas.length === 1 ? '' : 's'} · {fmt0(contasProc)} contas
          </p>
        </div>
        <motion.button type="button" data-tour="myops-new" onClick={onToggleForm}
          whileHover={{ y: -2, boxShadow: showForm ? 'none' : '0 14px 32px rgba(229,57,31,0.36)' }} whileTap={{ scale: 0.97 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30,
            border: showForm ? '1px solid var(--b2)' : 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 800,
            color: showForm ? 'var(--t2)' : '#fff',
            background: showForm ? 'var(--surface)' : `linear-gradient(135deg, ${RED2}, ${RED})`,
            boxShadow: showForm ? 'none' : '0 10px 26px rgba(229,57,31,0.3)',
          }}>
          <Ico d={showForm ? <><path d="M18 6 6 18M6 6l12 12" /></> : <path d="M12 5v14M5 12h14" />} s={16} />
          {showForm ? 'Fechar' : 'Nova meta'}
        </motion.button>
      </div>

      {/* ── hero: lucro da operação ── */}
      <Card pad="28px 30px" blob={pos ? ['var(--profit-dim)', 'var(--profit-border)'] : ['var(--loss-dim)', 'var(--loss-border)']} delay={0.04}>
        <Eyebrow>Lucro total da operação</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: MONO, fontSize: 44, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: pos ? 'var(--profit)' : 'var(--loss)' }}>
              {money0(lucroTotal)}
            </span>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '12px 0 0' }}>
              {money0(lucroMes)} este mês · {money0(lucroSemana)} na semana
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[['Hoje', lucroHoje], ['Média / meta', lucroMedioMeta]].map(([l, v]) => (
              <div key={l} style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)', minWidth: 120 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>{l}</p>
                <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: Number(v) >= 0 ? 'var(--profit)' : 'var(--loss)', margin: 0 }}>{money0(v)}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── tira de indicadores ── */}
      <motion.div {...rise(2)}>
        <Strip items={[
          { l: 'Metas ativas', v: <Num v={ativas.length} size={18} /> },
          { l: 'Encerradas', v: <Num v={fechadas.length} size={18} /> },
          { l: 'Contas', v: <Num v={contasProc} size={18} /> },
          { l: 'Remessas', v: <Num v={myRemCount} size={18} /> },
          { l: 'Taxa de acerto', v: <Num v={taxaAcerto} size={18} suffix="%" color={taxaAcerto >= 50 ? 'var(--profit)' : 'var(--t1)'} /> },
          { l: 'ROI médio', v: <Num v={Math.round(roiMedio)} size={18} suffix="%" color={roiMedio >= 0 ? 'var(--profit)' : 'var(--loss)'} /> },
        ]} />
      </motion.div>

      {/* ── destaques ── */}
      <div className="mo-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {destaques.map((d, i) => (
          <Card key={d.tag} delay={0.1 + i * 0.06}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, background: d.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ico d={d.ic} c={d.c} s={17} />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--t3)' }}>{d.tag}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</p>
            <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '0 0 12px' }}>{d.sub}</p>
            <p style={{ fontFamily: MONO, fontSize: 20, fontWeight: 900, color: d.vc, margin: 0, letterSpacing: '-0.03em' }}>{d.val}</p>
          </Card>
        ))}
      </div>

      {/* ── metas ativas ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 2px 12px' }}>
          <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Metas ativas</h3>
          <Pill tone={ativas.length ? 'red' : 'neutral'}>{ativas.length} em andamento</Pill>
        </div>

        {ativas.length === 0 ? (
          <Card pad="38px 26px" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px' }}>Sua mesa de operações está pronta</p>
            <p style={{ fontSize: 13, color: 'var(--t3)', margin: '0 0 20px' }}>Crie a primeira meta e comece a registrar remessas.</p>
            <motion.button type="button" onClick={onToggleForm} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '12px 24px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)' }}>
              Criar primeira meta
            </motion.button>
          </Card>
        ) : (
          <div className="mo-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {ativas.map((m, i) => {
              const prog = metaProg ? metaProg(m) : 0
              const liq = metaLiqV ? metaLiqV(m) : 0
              const feitas = metaContasDone ? metaContasDone(m) : 0
              const alvo = Number(m.quantidade_contas || 0)
              const dias = m.created_at ? Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000) : 0
              const parada = dias > 15 && prog < 90
              const pronta = prog >= 90
              return (
                <Card key={m.id} delay={0.14 + i * 0.05} onClick={() => onAbrirMeta && onAbrirMeta(m.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 11, background: pronta ? 'var(--profit-dim)' : parada ? 'var(--loss-dim)' : 'rgba(229,57,31,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 11, fontWeight: 900, color: pronta ? 'var(--profit)' : parada ? 'var(--loss)' : RED, flexShrink: 0 }}>
                        {String(m.rede || '—').slice(0, 3).toUpperCase()}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.titulo || m.rede || 'Meta'}</p>
                        <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0' }}>há {dias}d · {m.rede || '—'}</p>
                      </span>
                    </span>
                    {pronta && <Pill tone="mint">fechar</Pill>}
                    {parada && <Pill tone="loss">parada</Pill>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: 'var(--t3)' }}>{feitas}/{alvo} contas</span>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 900, color: liq >= 0 ? 'var(--profit)' : 'var(--loss)' }}><NumeroTexto delay={0.15}>{money0(liq)}</NumeroTexto></span>
                  </div>
                  <Bar pct={prog} color={pronta ? 'var(--profit)' : parada ? 'var(--loss)' : RED} height={8} />
                  <p style={{ fontSize: 11, color: 'var(--t4)', margin: '8px 0 0' }}>{prog}% concluída</p>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* ── encerradas ── */}
      {fechadas.length > 0 && (
        <div>
          <button type="button" onClick={() => setVerFechadas(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '10px 2px', margin: '6px 0 0' }}>
            <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>Encerradas</h3>
            <Pill tone="neutral">{fechadas.length}</Pill>
            <motion.span animate={{ rotate: verFechadas ? 180 : 0 }} style={{ display: 'inline-flex', color: 'var(--t3)' }}>
              <Ico d={<path d="m6 9 6 6 6-6" />} s={16} />
            </motion.span>
          </button>
          {verFechadas && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
              <Card pad={8}>
                {fechadas.slice(0, 20).map((m, i, a) => {
                  const liq = Number(m.lucro_final || 0)
                  return (
                    <motion.div key={m.id} whileHover={{ x: 3 }} onClick={() => onAbrirMeta && onAbrirMeta(m.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', borderBottom: i < a.length - 1 ? '1px solid var(--b1)' : 'none', cursor: 'pointer', borderRadius: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--fill-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 9.5, fontWeight: 900, color: 'var(--t2)', flexShrink: 0 }}>
                          {String(m.rede || '—').slice(0, 3).toUpperCase()}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.titulo || m.rede || 'Meta'}</span>
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: liq >= 0 ? 'var(--profit)' : 'var(--loss)', flexShrink: 0 }}><NumeroTexto delay={0.15}>{money0(liq)}</NumeroTexto></span>
                    </motion.div>
                  )
                })}
              </Card>
            </motion.div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1000px) { .mo-3 { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 640px) { .mo-3 { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

'use client'
// ─────────────────────────────────────────────────────────────────────────
// OPERAÇÃO FINALIZADA — o momento de comemoração do NexControl 2.0.
//
// Serve ao admin (resultado final com salário/baú/custos, certificado e
// Network) e ao operador (resultado das remessas, insights e melhorias).
// Não calcula nada: todo número chega pronto da página, que já os deriva
// exatamente como o popup antigo. Os handlers (baixar, compartilhar, voltar,
// nova meta) são os mesmos de antes — só a cena mudou.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Folha, Confete } from '../ui/folha'
import { Ico, NumeroTexto, money, int, MONO, RED, RED2 } from '../ui/bento'

const I_CHECK = <path d="M20 6L9 17l-5-5" />
const I_BAIXAR = <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></>
const I_REDE = <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>
const I_SETA = <path d="M5 12h14M13 6l6 6-6 6" />
const I_MAIS = <path d="M12 5v14M5 12h14" />

function Anel({ pct = 100, cor, delay = 0.3 }) {
  const r = 46, circ = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, pct))
  return (
    <div style={{ position: 'relative', width: 116, height: 116 }}>
      <svg width={116} height={116} viewBox="0 0 116 116" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="58" cy="58" r={r} fill="none" stroke="var(--fill-2)" strokeWidth="11" />
        <motion.circle cx="58" cy="58" r={r} fill="none" stroke={cor} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - p / 100) }}
          transition={{ duration: 1.3, delay, ease: [0.33, 1, 0.68, 1] }} />
      </svg>
      <motion.span
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: delay + 0.9, type: 'spring', stiffness: 260, damping: 16 }}
        style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <span style={{
          width: 62, height: 62, borderRadius: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: cor, color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
        }}>
          <Ico d={I_CHECK} s={30} c="#fff" />
        </span>
      </motion.span>
    </div>
  )
}

function Bloco({ children, style }) {
  return <div style={{ padding: '16px 18px', borderRadius: 18, background: 'var(--fill-1)', border: '1px solid var(--b1)', ...style }}>{children}</div>
}

export default function FinaleV2({
  papel = 'operador', titulo, rede, data,
  resultado = 0, totalDep = 0, totalSaq = 0, contasDone = 0, nContas = 0, pctConclusao = 0, taxaAcerto = 0, porConta = 0, roi = 0,
  salario = 0, bau = 0, custos = 0, lucroRemessas = 0,
  insights = [], melhorias = [],
  netShareState = 'idle', aoCompartilhar, aoBaixar, aoVoltar, aoNovaMeta,
}) {
  const semMovimento = useReducedMotion()
  const positivo = Number(resultado) >= 0
  const cor = positivo ? 'var(--profit)' : 'var(--loss)'
  const [festa, setFesta] = useState(false)
  // o confete cai quando o número termina de contar — não junto com a folha
  useEffect(() => {
    if (!positivo || semMovimento) return
    const t = setTimeout(() => setFesta(true), 1250)
    return () => clearTimeout(t)
  }, [positivo, semMovimento])

  const admin = papel === 'admin'
  const metricas = [
    { l: 'Contas', v: `${int(contasDone)} / ${int(nContas)}` },
    { l: 'Execução', v: `${int(pctConclusao)}%`, c: pctConclusao >= 100 ? 'var(--profit)' : 'var(--t1)' },
    { l: 'Acerto', v: `${int(taxaAcerto)}%`, c: taxaAcerto >= 60 ? 'var(--profit)' : taxaAcerto >= 40 ? 'var(--t1)' : 'var(--loss)' },
    { l: admin ? 'Lucro/conta' : 'Por conta', v: (porConta >= 0 ? '+' : '-') + money(Math.abs(porConta)), c: porConta >= 0 ? 'var(--profit)' : 'var(--loss)' },
    { l: 'ROI', v: (roi >= 0 ? '+' : '-') + Math.abs(roi).toFixed(0) + '%', c: roi >= 0 ? 'var(--profit)' : 'var(--loss)' },
  ]

  return (
    <Folha aberto={true} aoFechar={aoVoltar} largura={600} z={9100}>
      <div style={{ position: 'relative', padding: '34px 30px 26px', overflow: 'hidden' }}>
        <Confete disparar={festa} />

        {/* topo: anel + título */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Anel pct={100} cor={cor} />
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.45 }}
            style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', margin: '18px 0 4px', letterSpacing: '-0.03em' }}>
            Operação finalizada
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
            style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0, fontFamily: MONO, letterSpacing: '0.04em' }}>
            {[titulo, rede, `${int(nContas)} DEP`, data].filter(Boolean).join(' · ')}
          </motion.p>
        </div>

        {/* clímax: o resultado */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
          style={{
            margin: '24px 0 16px', padding: '22px 24px', borderRadius: 22, textAlign: 'center',
            background: positivo ? 'var(--profit-dim)' : 'var(--loss-dim)',
            border: `1px solid ${positivo ? 'var(--profit-border)' : 'var(--loss-border)'}`,
          }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>
            {admin ? 'Resultado líquido da operação' : 'Resultado da meta'}
          </p>
          <NumeroTexto delay={0.8} duracao={1.2} style={{ fontFamily: MONO, fontSize: 44, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, color: cor, display: 'block' }}>
            {(positivo ? '+' : '-') + money(Math.abs(Number(resultado) || 0))}
          </NumeroTexto>
          {admin && (
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '10px 0 0' }}>
              remessas {(lucroRemessas >= 0 ? '+' : '-') + money(Math.abs(lucroRemessas))}
              {salario ? ` · salário +${money(salario)}` : ''}
              {bau ? ` · baú +${money(bau)}` : ''}
              {custos ? ` · custos -${money(custos)}` : ''}
            </p>
          )}
        </motion.div>

        {/* métricas em cascata */}
        <div className="fin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
          {metricas.map((m, i) => (
            <motion.div key={m.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 + i * 0.07, duration: 0.4 }}
              style={{ padding: '12px 10px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)', textAlign: 'center' }}>
              <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 900, color: m.c || 'var(--t1)', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{m.v}</p>
              <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', margin: '5px 0 0' }}>{m.l}</p>
            </motion.div>
          ))}
        </div>

        {/* depósito x saque */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Bloco><p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', margin: '0 0 4px' }}>Depositado</p><p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{money(totalDep)}</p></Bloco>
          <Bloco><p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)', margin: '0 0 4px' }}>Sacado</p><p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{money(totalSaq)}</p></Bloco>
        </motion.div>

        {/* leitura da operação */}
        {(insights.length > 0 || melhorias.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.45 }} style={{ marginBottom: 18 }}>
            {insights.length > 0 && (
              <Bloco style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 10px' }}>Leitura da operação</p>
                {insights.map((it, i) => {
                  const bom = it.type === 'good'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: i ? 8 : 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: bom ? 'var(--profit)' : 'var(--loss)' }} />
                      <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>{it.text}</span>
                    </div>
                  )
                })}
              </Bloco>
            )}
            {melhorias.length > 0 && (
              <Bloco>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 10px' }}>Para a próxima</p>
                {melhorias.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: i ? 8 : 0 }}>
                    <span style={{ color: RED, display: 'inline-flex', marginTop: 2 }}><Ico d={I_SETA} s={12} c={RED} /></span>
                    <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.5 }}>{m}</span>
                  </div>
                ))}
              </Bloco>
            )}
          </motion.div>
        )}

        {/* ações */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.55 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(aoBaixar || aoCompartilhar) && (
            <div style={{ display: 'grid', gridTemplateColumns: aoBaixar && aoCompartilhar ? '1fr 1fr' : '1fr', gap: 8 }}>
              {aoBaixar && (
                <motion.button type="button" onClick={aoBaixar} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: 'var(--t1)' }}>
                  <Ico d={I_BAIXAR} s={15} /> Baixar imagem
                </motion.button>
              )}
              {aoCompartilhar && (
                <motion.button type="button" onClick={aoCompartilhar} disabled={netShareState === 'sharing'} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', borderRadius: 30, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: '#fff',
                    background: netShareState === 'done' ? 'var(--profit)' : `linear-gradient(135deg, ${RED2}, ${RED})`,
                    boxShadow: '0 10px 26px rgba(229,57,31,0.28)', opacity: netShareState === 'sharing' ? 0.7 : 1,
                  }}>
                  <Ico d={netShareState === 'done' ? I_CHECK : I_REDE} s={15} c="#fff" />
                  {netShareState === 'sharing' ? 'Postando…' : netShareState === 'done' ? 'Postado no Network' : 'Compartilhar no Network'}
                </motion.button>
              )}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: aoNovaMeta ? '1fr 1fr' : '1fr', gap: 8 }}>
            <button type="button" onClick={aoVoltar}
              style={{ padding: '13px 16px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>
              Voltar para metas
            </button>
            {aoNovaMeta && (
              <button type="button" onClick={aoNovaMeta}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 16px', borderRadius: 30, border: '1px solid var(--b1)', background: 'var(--fill-1)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: 'var(--t1)' }}>
                <Ico d={I_MAIS} s={14} /> Nova meta
              </button>
            )}
          </div>
        </motion.div>
      </div>
      <style>{`@media (max-width: 560px) { .fin-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
    </Folha>
  )
}

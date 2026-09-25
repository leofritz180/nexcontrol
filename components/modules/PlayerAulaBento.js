'use client'
// ─────────────────────────────────────────────────────────────────────────
// PLAYER DE AULA — visual 2.0.
//
// Só apresentação: o player, o progresso, a navegação e o "marcar como
// concluída" continuam sendo calculados e salvos pela página. Aqui só
// entram valores prontos e callbacks.
//
// O vídeo continua em superfície escura de propósito: player claro com
// letterbox branco em volta cansa a vista e foge do que todo mundo espera
// de uma aula. O que virou claro foi o ENTORNO.
// ─────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'
import { BCard, Ico, NumeroTexto, MONO, RED, RED2, int, ON_RED, GLOW } from '../ui/bento'

const I_CHECK = <path d="M20 6L9 17l-5-5" />
const I_ANT = <polyline points="15 18 9 12 15 6" />
const I_PROX = <polyline points="9 18 15 12 9 6" />
const I_DOC = <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></>
const I_RELOGIO = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>

function Trilha({ pct, altura = 6 }) {
  return (
    <div style={{ height: altura, borderRadius: altura, background: 'var(--fill-2)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
        style={{ height: '100%', borderRadius: altura, background: `linear-gradient(90deg, ${RED2}, ${RED})` }}
      />
    </div>
  )
}

export default function PlayerAulaBento({
  curso, aula, modulos = [], aulas = [], concluidas,
  pct = 0, feitas = 0, total = 0,
  anterior, proxima, aoIr,
  urlEmbed, videoDireto,
  concluida = false, salvando = false, aoAlternarConclusao,
}) {
  return (
    <div className="pa-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, alignItems: 'start' }}>
      {/* ── coluna principal ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {/* o vídeo em si: fica escuro de propósito */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
          style={{
            width: '100%', aspectRatio: '16/9', position: 'relative', overflow: 'hidden',
            borderRadius: 24, background: '#0c0c10', border: '1px solid var(--b1)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 18px 46px rgba(0,0,0,0.16)',
          }}>
          {videoDireto ? (
            <video src={videoDireto} controls style={{ width: '100%', height: '100%', display: 'block' }} />
          ) : urlEmbed ? (
            <iframe src={urlEmbed} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13.5 }}>
              Vídeo não disponível
            </div>
          )}
        </motion.div>

        {/* título da aula + ações */}
        <BCard pad={24} delay={0.06}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.025em' }}>
                {aula?.title || 'Aula'}
              </h1>
              {aula?.description && (
                <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '8px 0 0', lineHeight: 1.6 }}>{aula.description}</p>
              )}
            </div>
            {aula?.duration_min > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '6px 12px', borderRadius: 30, background: 'var(--fill-1)', border: '1px solid var(--b1)', fontFamily: MONO, fontSize: 12, fontWeight: 800, color: 'var(--t2)' }}>
                <Ico d={I_RELOGIO} s={13} c="var(--t2)" />{int(aula.duration_min)} min
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            <motion.button type="button" onClick={aoAlternarConclusao} disabled={salvando}
              whileHover={salvando ? {} : { y: -2 }} whileTap={salvando ? {} : { scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30,
                border: concluida ? '1px solid var(--profit-border)' : 'none',
                cursor: salvando ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800,
                background: concluida ? 'var(--profit-dim)' : `linear-gradient(135deg, ${RED2}, ${RED})`,
                color: concluida ? 'var(--profit)' : ON_RED,
                boxShadow: concluida ? 'none' : `0 10px 26px ${GLOW}`,
                opacity: salvando ? 0.7 : 1, transition: 'background .2s ease',
              }}>
              {concluida && <Ico d={I_CHECK} s={15} c="var(--profit)" />}
              {salvando ? 'Salvando…' : concluida ? 'Concluída' : 'Marcar como concluída'}
            </motion.button>

            <div style={{ display: 'flex', gap: 8 }}>
              {[[anterior, 'Anterior', I_ANT, false], [proxima, 'Próxima', I_PROX, true]].map(([alvo, rotulo, ico, dir]) => (
                <button key={rotulo} type="button" disabled={!alvo} onClick={() => alvo && aoIr(alvo.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 30,
                    border: '1px solid var(--b1)', background: 'var(--surface)',
                    cursor: alvo ? 'pointer' : 'not-allowed', opacity: alvo ? 1 : 0.4,
                    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: 'var(--t2)',
                  }}>
                  {!dir && <Ico d={ico} s={13} c="var(--t2)" />}{rotulo}{dir && <Ico d={ico} s={13} c="var(--t2)" />}
                </button>
              ))}
            </div>
          </div>
        </BCard>

        {aula?.materials && (
          <BCard pad={24} delay={0.12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t2)' }}>
                <Ico d={I_DOC} s={14} />
              </span>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Materiais</p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--t2)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{aula.materials}</p>
          </BCard>
        )}
      </div>

      {/* ── coluna do curso ── */}
      <div className="pa-lado" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 14 }}>
        <BCard pad={22} delay={0.08}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>Curso</p>
          <p style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 14px', letterSpacing: '-0.015em' }}>{curso?.title || '—'}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>{int(feitas)} de {int(total)} aulas</span>
            <NumeroTexto delay={0.2} style={{ fontFamily: MONO, fontSize: 17, fontWeight: 900, color: 'var(--t1)' }}>{Math.round(pct) + '%'}</NumeroTexto>
          </div>
          <Trilha pct={pct} />
        </BCard>

        <BCard pad={0} delay={0.14} style={{ maxHeight: '62vh', overflowY: 'auto' }}>
          {modulos.map(mod => {
            const doModulo = aulas
              .filter(l => l.module_id === mod.id && l.status === 'published')
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            if (doModulo.length === 0) return null
            return (
              <div key={mod.id} style={{ padding: '14px 0 6px' }}>
                <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t4)', margin: '0 18px 8px' }}>{mod.title}</p>
                {doModulo.map(l => {
                  const atual = l.id === aula?.id
                  const feita = concluidas?.has?.(l.id)
                  return (
                    <button key={l.id} type="button" onClick={() => aoIr(l.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
                        border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        background: atual ? 'var(--fill-2)' : 'transparent',
                        borderLeft: `3px solid ${atual ? RED : 'transparent'}`,
                        transition: 'background .15s ease',
                      }}>
                      <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: feita ? 'var(--profit)' : 'transparent', border: feita ? 'none' : `2px solid ${atual ? RED : 'var(--b3)'}` }}>
                        {feita && <Ico d={I_CHECK} s={11} c="var(--k-on-sinal)" />}
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: atual ? 800 : 600, color: atual ? 'var(--t1)' : 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</span>
                      </span>
                      {l.duration_min > 0 && (
                        <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10.5, color: 'var(--t4)' }}>{int(l.duration_min)}m</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </BCard>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .pa-grid { grid-template-columns: 1fr !important; }
          .pa-lado { position: static !important; }
        }
      `}</style>
    </div>
  )
}

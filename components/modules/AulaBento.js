'use client'
// ─────────────────────────────────────────────────────────────────────────
// CURSO (uma aula VIP por dentro) — visual 2.0.
//
// Componente PURO: recebe curso, módulos, aulas, o conjunto de aulas já
// concluídas e os handlers da página. Não busca nem grava nada.
//
// Mesma decisão do /aulas: a ARTE da capa continua escura (é arte de vídeo);
// o entorno — cabeçalho, indicadores, lista de módulos — é a superfície
// clara do bento.
// ─────────────────────────────────────────────────────────────────────────
import { motion, AnimatePresence } from 'framer-motion'
import { ModuleHeader, AcaoBtn, Tira, BCard, Vazio, Arco, Ico, MONO, RED, RED2, int } from '../ui/bento'

const PLAY = <path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
const ARTE_PADRAO = 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)'

// ── VITRINE DO CURSO ─────────────────────────────────────────────────────
// O lugar do "play": capa grande, progresso e o botão que leva pra próxima
// aula não assistida. É o destaque da tela.
function Vitrine({ curso, pct, totalAulas, concluidas, proxima, rotuloCta, onContinuar }) {
  const arte = curso?.thumb_url ? `url(${curso.thumb_url}) center/cover` : ARTE_PADRAO
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      className="au-vitrine"
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 24,
        border: '1px solid var(--b1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
        minHeight: 300, display: 'flex', alignItems: 'flex-end',
      }}>
      <motion.div aria-hidden
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: -24, background: arte }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,8,12,0.3) 0%, rgba(6,8,12,0.66) 48%, rgba(6,8,12,0.94) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 2, padding: '34px 32px 30px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13, flexWrap: 'wrap' }}>
          {curso?.category && (
            <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: 999, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.92)' }}>
              {curso.category}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.74)' }}>
            <Ico d={PLAY} s={11} c="rgba(255,255,255,0.74)" />{int(totalAulas)} aula{totalAulas === 1 ? '' : 's'}
          </span>
        </div>

        <h2 style={{ fontSize: 34, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.04em', lineHeight: 1.06, textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
          {curso?.title || 'Curso'}
        </h2>
        {curso?.description && (
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 560 }}>{curso.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, maxWidth: 420, marginBottom: 20 }}>
          <span style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
            <motion.span initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
              style={{ display: 'block', height: '100%', borderRadius: 3, background: pct >= 100 ? 'var(--profit)' : `linear-gradient(90deg, ${RED2}, ${RED})` }} />
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{pct}%</span>
        </div>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', margin: '-12px 0 20px' }}>
          {int(concluidas)} de {int(totalAulas)} aulas concluídas
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <motion.button type="button" onClick={onContinuar}
            whileHover={{ y: -2, boxShadow: '0 14px 34px rgba(229,57,31,0.42)' }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 26px', borderRadius: 30,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: '#fff',
              background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.34)',
            }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="#fff" stroke="none">{PLAY}</svg>
            {rotuloCta}
          </motion.button>
          {proxima && (
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Próxima aula</span>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginTop: 3, maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proxima.title}</span>
            </span>
          )}
        </div>
      </div>
      <style>{`@media(max-width:768px){ .au-vitrine{ min-height:250px !important } .au-vitrine h2{ font-size:25px !important } }`}</style>
    </motion.div>
  )
}

// ── LINHA DE AULA ────────────────────────────────────────────────────────
function LinhaAula({ aula, feita, index, onAbrir }) {
  return (
    <motion.button type="button"
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ x: 3 }}
      onClick={() => onAbrir(aula.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        padding: '11px 12px', borderRadius: 14, marginTop: index === 0 ? 0 : 4,
        background: 'transparent', border: '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background-color .16s ease, border-color .16s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--fill-1)'; e.currentTarget.style.borderColor = 'var(--b1)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>
      <span style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: feita ? 'var(--profit-dim)' : 'var(--fill-1)',
        border: `1px solid ${feita ? 'var(--profit-border)' : 'var(--b2)'}`,
        color: feita ? 'var(--profit)' : 'var(--t4)',
      }}>
        {feita
          ? <Ico d={<path d="M20 6L9 17l-5-5" />} s={13} c="var(--profit)" />
          : <Ico d={<path d="M10 9l5 3-5 3V9z" />} s={13} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: 13.5, fontWeight: feita ? 600 : 700,
          color: feita ? 'var(--t3)' : 'var(--t1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{aula.title}</span>
      </span>
      {aula.duration_min > 0 && (
        <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', background: 'var(--fill-1)', border: '1px solid var(--b1)', padding: '3px 8px', borderRadius: 8 }}>
          {aula.duration_min}min
        </span>
      )}
    </motion.button>
  )
}

// ── MÓDULO (acordeão) ────────────────────────────────────────────────────
function Modulo({ mod, indice, aulas, concluidas, aberto, onAlternar, onAbrirAula, delay }) {
  const feitas = aulas.filter(l => concluidas.has(l.id)).length
  const completo = aulas.length > 0 && feitas === aulas.length

  return (
    <BCard pad={0} delay={delay} style={{ borderColor: aberto ? 'var(--b2)' : 'var(--b1)' }}>
      <button type="button" onClick={onAlternar} aria-expanded={aberto}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%',
          padding: '15px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 11, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: MONO, fontSize: 12, fontWeight: 900,
            background: completo ? 'var(--profit-dim)' : 'var(--fill-1)',
            border: `1px solid ${completo ? 'var(--profit-border)' : 'var(--b1)'}`,
            color: completo ? 'var(--profit)' : 'var(--t2)',
          }}>
            {completo ? <Ico d={<path d="M20 6L9 17l-5-5" />} s={14} c="var(--profit)" /> : indice + 1}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mod.title || 'Módulo sem título'}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--t4)', marginTop: 2 }}>{feitas}/{aulas.length} concluídas</span>
          </span>
        </span>
        <motion.span animate={{ rotate: aberto ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ display: 'inline-flex', color: 'var(--t3)', flexShrink: 0 }}>
          <Ico d={<path d="M6 9l6 6 6-6" />} s={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--b1)' }}>
              {aulas.length === 0
                ? <Vazio titulo="Nenhuma aula disponível neste módulo" texto="Assim que o conteúdo for publicado, ele aparece aqui." icone={<><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M10 9l5 3-5 3V9z" /></>} />
                : aulas.map((l, i) => (
                  <LinhaAula key={l.id} aula={l} feita={concluidas.has(l.id)} index={i} onAbrir={onAbrirAula} />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BCard>
  )
}

// ── MÓDULO DA PÁGINA ─────────────────────────────────────────────────────
export default function AulaBento({
  curso,
  modulos = [],
  aulasPorModulo = () => [],  // (moduleId) => aulas publicadas já ordenadas
  concluidas = new Set(),
  totalAulas = 0,
  totalConcluidas = 0,
  pct = 0,
  proxima = null,
  rotuloCta = 'Começar agora',
  duracaoTotal = 0,
  expandido = null,
  onExpandir,
  onAbrirAula,
  onContinuar,
}) {
  const restantes = Math.max(0, totalAulas - totalConcluidas)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo={curso?.title || 'Curso'}
        sub={`${curso?.category ? curso.category + ' · ' : ''}${int(modulos.length)} módulo${modulos.length === 1 ? '' : 's'} · ${int(totalAulas)} aula${totalAulas === 1 ? '' : 's'}`}
        acao={<AcaoBtn onClick={onContinuar} icon={PLAY}>{rotuloCta}</AcaoBtn>}
      />

      <Vitrine
        curso={curso}
        pct={pct}
        totalAulas={totalAulas}
        concluidas={totalConcluidas}
        proxima={proxima}
        rotuloCta={rotuloCta}
        onContinuar={onContinuar}
      />

      <Tira itens={[
        { l: 'Aulas', v: int(totalAulas) },
        { l: 'Concluídas', v: int(totalConcluidas), c: totalConcluidas ? 'var(--profit)' : undefined },
        { l: 'Restantes', v: int(restantes), c: restantes ? RED : 'var(--profit)' },
        { l: 'Módulos', v: int(modulos.length) },
        { l: 'Duração', v: duracaoTotal > 0 ? `${int(duracaoTotal)} min` : '—' },
      ]} />

      <div className="au-2" style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>Conteúdo do curso</p>
          {modulos.length === 0 ? (
            <BCard pad={12} delay={0.14}>
              <Vazio
                titulo="Este curso ainda não possui conteúdo"
                texto="Os módulos e as aulas aparecem aqui assim que forem publicados."
                icone={<><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M10 9l5 3-5 3V9z" /></>}
              />
            </BCard>
          ) : modulos.map((m, i) => (
            <Modulo
              key={m.id}
              mod={m}
              indice={i}
              aulas={aulasPorModulo(m.id)}
              concluidas={concluidas}
              aberto={expandido === m.id}
              onAlternar={() => onExpandir(expandido === m.id ? null : m.id)}
              onAbrirAula={onAbrirAula}
              delay={0.14 + Math.min(i * 0.04, 0.3)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Arco
            rotulo="Progresso do curso"
            pct={pct}
            centro={`${pct}%`}
            nota={pct >= 100
              ? 'Curso concluído — pode rever quando quiser.'
              : `${int(restantes)} aula${restantes === 1 ? '' : 's'} para terminar.`}
            delay={0.12}
          />
          <BCard pad={22} delay={0.18}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 12px' }}>
              {proxima ? 'Continuar por aqui' : 'Tudo em dia'}
            </p>
            {proxima ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.35 }}>{proxima.title}</p>
                {proxima.duration_min > 0 && <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: 'var(--t4)', margin: '6px 0 0' }}>{proxima.duration_min} min</p>}
                <div style={{ marginTop: 16 }}>
                  <AcaoBtn onClick={onContinuar} icon={PLAY}>Assistir</AcaoBtn>
                </div>
              </>
            ) : (
              <Vazio
                titulo={totalAulas > 0 ? 'Você assistiu tudo' : 'Sem aulas publicadas'}
                texto={totalAulas > 0 ? 'Todas as aulas publicadas deste curso estão concluídas.' : 'Nenhuma aula publicada neste curso até agora.'}
                icone={<path d="M20 6L9 17l-5-5" />}
              />
            )}
          </BCard>
        </div>
      </div>

      <style>{`
        @media (max-width:1000px){ .au-2{ grid-template-columns:1fr !important } .bk-tira{ grid-template-columns:repeat(2,1fr) !important } }
      `}</style>
    </div>
  )
}

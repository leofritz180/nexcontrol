'use client'
// ─────────────────────────────────────────────────────────────────────────
// PREMIAÇÕES — visual 2.0 ("vitrine clara com sombra longa").
//
// Componente PURO: recebe faturamento + marcos já calculados pela página.
// (`artPath`/`previewPath` são só montadores de caminho, não fazem I/O.)
//
// A ARTE DAS PLACAS NÃO MUDA: continua a mesma imagem, em cor cheia, inteira
// dentro do card. O que mudou é o entorno — antes o card era um bloco escuro
// com halo dourado, agora é superfície branca do bento e a placa ganha uma
// sombra longa embaixo, como peça exposta em vitrine.
//
// Os selos que ficam EM CIMA da placa seguem com véu escuro + texto branco:
// é legibilidade sobre imagem, não superfície de UI.
//
// A métrica é `lucro_final` das metas fechadas — vem pronta em `faturamento`.
// ─────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'
import { ModuleHeader, Hero, Tira, BCard, Vazio, Ico, money0, int, RED, RED2, MONO, ON_RED, GLOW } from '../ui/bento'
import { artPath, previewPath } from '../../lib/premiacoes'

const EASE = [0.33, 1, 0.68, 1]

const VEU = {
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}

function IconeBaixar() {
  return <Ico d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>} s={13} />
}

// ── TRILHA DE MARCOS ─────────────────────────────────────────────────────
function Trilha({ items, nextIdx, roadPos }) {
  const N = Math.max(1, items.length)
  return (
    <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ position: 'relative', minWidth: 520 }}>
        {/* trilho apagado */}
        <div style={{ position: 'absolute', left: `${50 / N}%`, right: `${50 / N}%`, top: 14, height: 4, borderRadius: 4, background: 'var(--fill-2)' }} />
        {/* trilho percorrido */}
        <motion.div initial={{ width: 0 }} animate={{ width: `calc(${Math.max(0, roadPos * 100 - 50 / N)}%)` }} transition={{ duration: 1.3, ease: EASE }}
          style={{ position: 'absolute', left: `${50 / N}%`, top: 14, height: 4, borderRadius: 4, background: `linear-gradient(90deg, ${RED2}, ${RED})` }} />
        <div style={{ position: 'relative', display: 'flex' }}>
          {items.map((p, i) => {
            const proximo = i === nextIdx
            return (
              <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ position: 'relative', width: 30, height: 30 }}>
                  {proximo && (
                    <motion.span aria-hidden animate={{ scale: [1, 1.55], opacity: [0.45, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: RED }} />
                  )}
                  <span style={{
                    position: 'relative', width: 30, height: 30, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: p.unlocked ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--surface)',
                    border: `2px solid ${p.unlocked ? 'transparent' : proximo ? RED : 'var(--b2)'}`,
                    boxShadow: p.unlocked ? `0 6px 16px ${GLOW}` : 'none',
                  }}>
                    {p.unlocked
                      ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={ON_RED} strokeWidth={3.2} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={proximo ? RED : 'var(--t4)'} strokeWidth={2.4} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
                  </span>
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 800, fontFamily: MONO, whiteSpace: 'nowrap', color: p.unlocked ? RED : proximo ? 'var(--t1)' : 'var(--t4)' }}>
                  {String(p.id).toUpperCase()}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── CARD DE QUADRO ───────────────────────────────────────────────────────
function Quadro({ p, faturamento, proximo, delay }) {
  const conquistado = !!p.unlocked
  const falta = Math.max(0, p.value - faturamento)
  const pct = Math.min(100, (Number(faturamento) / Math.max(1, p.value)) * 100)

  return (
    <BCard pad={0} delay={delay}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ── VITRINE DA PLACA (arte intocada, fundo claro, sombra longa) ── */}
        <div style={{
          position: 'relative', aspectRatio: '3 / 4', overflow: 'hidden',
          background: conquistado
            ? 'radial-gradient(120% 90% at 50% 0%, var(--fill-1), var(--surface))'
            : 'var(--fill-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img
            src={previewPath(p)}
            alt={`Quadro ${p.label}`}
            style={{
              width: '100%', height: '100%', objectFit: 'contain', padding: 14,
              // sombra longa: a peça "descola" do fundo claro. Bloqueada fica
              // dessaturada, mas ainda inteira — a arte é o produto.
              filter: conquistado
                ? 'drop-shadow(0 26px 30px rgba(0,0,0,0.26))'
                : 'grayscale(1) opacity(0.42) drop-shadow(0 16px 22px rgba(0,0,0,0.12))',
            }}
          />

          {/* brilho passando, só no conquistado */}
          {conquistado && (
            <motion.span aria-hidden animate={{ x: ['-130%', '340%'] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'linear', repeatDelay: 2.2 }}
              style={{ position: 'absolute', top: 0, left: 0, width: '28%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)', transform: 'skewX(-18deg)', pointerEvents: 'none' }} />
          )}

          {/* tier (topo esq) — véu escuro sobre a placa */}
          <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 999, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', ...VEU }}>{p.tier}</span>

          {/* estado (topo dir) — véu escuro sobre a placa */}
          <span style={{ position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, ...VEU }}>
            {conquistado
              ? <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Conquistado</>
              : <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> {proximo ? 'Próximo' : 'Bloqueado'}</>}
          </span>
        </div>

        {/* ── RODAPÉ CLARO ── */}
        <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em' }}>{p.label}</span>
            <span style={{ fontSize: 11.5, fontWeight: 900, fontFamily: MONO, color: conquistado ? RED : 'var(--t4)' }}>{String(p.id).toUpperCase()}</span>
          </div>

          {conquistado ? (
            p.available ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={artPath(p, '15x20')} download style={btnBaixar()}><IconeBaixar /> 15×20</a>
                <a href={artPath(p, '30x40')} download style={btnBaixar()}><IconeBaixar /> 30×40</a>
              </div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textAlign: 'center', padding: '10px 0', borderRadius: 12, background: 'var(--fill-1)', border: '1px dashed var(--b2)' }}>
                Conquistado! Arte em breve.
              </div>
            )
          ) : (
            <>
              {/* progresso saiu de cima da placa e veio pro corpo claro:
                  não esconde mais nenhum pedaço da arte. */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)' }}>faltam</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: MONO, color: 'var(--t1)' }}>{money0(falta)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--fill-2)', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.1, ease: EASE }}
                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${RED2}, ${RED})` }} />
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0 }}>
                Desbloqueie ao atingir <strong style={{ color: 'var(--t3)', fontFamily: MONO }}>{money0(p.value)}</strong> de faturamento.
              </p>
            </>
          )}
        </div>
      </div>
    </BCard>
  )
}

function btnBaixar() {
  return {
    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px', borderRadius: 12, textDecoration: 'none', boxSizing: 'border-box',
    fontSize: 12.5, fontWeight: 800, color: ON_RED,
    background: `linear-gradient(135deg, ${RED2}, ${RED})`,
    boxShadow: `0 8px 20px ${GLOW}`,
  }
}

// ── MÓDULO ───────────────────────────────────────────────────────────────
export default function PremiacoesBento({
  enabled = true,
  faturamento = 0,
  items = [],
  conquistados = 0,
  nextIdx = -1,
  next = null,
  roadPos = 1,
}) {
  const sub = 'Quadros de faturamento que você conquista e imprime — 15×20 e 30×40 cm'

  // Gate "em breve" — mesma regra de antes, só que em estado vazio do kit.
  if (!enabled) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ModuleHeader titulo="Premiações" sub={sub} />
        <BCard pad={10}>
          <Vazio
            titulo="Em breve"
            texto="As premiações estão sendo preparadas. Logo você poderá resgatar os quadros de faturamento da sua operação."
            icone={<><path d="M12 15a4 4 0 0 0 4-4V5H8v6a4 4 0 0 0 4 4z" /><path d="M12 15v4m-4 0h8M8 5H5a2 2 0 0 0 0 4h.5M16 5h3a2 2 0 0 1 0 4h-.5" /></>}
          />
        </BCard>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader titulo="Premiações" sub={sub} />

      <Hero
        rotulo="Seu faturamento"
        valor={money0(faturamento)}
        cor="var(--t1)"
        nota={next
          ? `Próximo: ${next.label} — faltam ${money0(next.value - faturamento)}`
          : 'Lenda absoluta — você conquistou todos os quadros.'}
        blob={['var(--k-blob-marca-a)', 'var(--k-blob-marca-b)']}
        extras={[
          { l: 'Conquistados', v: `${int(conquistados)}/${int(items.length)}`, c: conquistados > 0 ? RED : undefined },
          { l: 'Faltam', v: int(Math.max(0, items.length - conquistados)) },
        ]}
      />

      <Tira itens={[
        { l: 'Quadros', v: int(items.length) },
        { l: 'Conquistados', v: int(conquistados), c: conquistados > 0 ? 'var(--profit)' : undefined },
        { l: 'Próximo marco', v: next ? money0(next.value) : '—' },
        { l: 'Falta', v: next ? money0(next.value - faturamento) : 'R$ 0', c: next ? RED : 'var(--profit)' },
      ]} />

      <BCard pad={24} delay={0.12}>
        <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Trilha de marcos</p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 22px' }}>onde a sua operação está na escada de faturamento</p>
        <Trilha items={items} nextIdx={nextIdx} roadPos={roadPos} />
      </BCard>

      {items.length === 0 ? (
        <BCard pad={10} delay={0.16}>
          <Vazio titulo="Nenhum quadro configurado" texto="Assim que os marcos forem publicados, eles aparecem aqui." />
        </BCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(238px, 1fr))', gap: 16 }}>
          {items.map((p, i) => (
            <Quadro key={p.id} p={p} faturamento={faturamento} proximo={i === nextIdx} delay={Math.min(i * 0.05, 0.4)} />
          ))}
        </div>
      )}

      <p style={{ fontSize: 11.5, color: 'var(--t4)', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.6 }}>
        Todo quadro conquistado vem em <strong style={{ color: 'var(--t3)' }}>15×20 cm</strong> e <strong style={{ color: 'var(--t3)' }}>30×40 cm</strong> — baixe e leve pra imprimir na gráfica.
      </p>

      <style>{`@media (max-width:900px){ .bk-tira{grid-template-columns:repeat(2,1fr)!important} }`}</style>
    </div>
  )
}

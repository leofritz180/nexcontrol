'use client'
// ─────────────────────────────────────────────────────────────────────────
// SLOTS — visual 2.0 ("vitrine estilo streaming").
//
// Componente PURO: recebe a lista já filtrada e os handlers da página.
// Não busca, não grava, não conhece Supabase nem localStorage.
//
// DECISÃO IMPORTANTE (não reverter): os selos, o cadeado e o coração ficam
// SOBRE a arte da capa. Ali continua véu escuro `rgba(0,0,0,0.45)` com texto
// branco explícito — isso é legibilidade sobre foto, não superfície de UI.
// O que virou claro foi o ENTORNO: cabeçalho, filtros, busca, corpo do card.
// ─────────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModuleHeader, Tira, BCard, Vazio, Osso, Ico, int, RED, RED2 } from '../ui/bento'
import { Campo, Pilulas } from '../ui/campo'

// Véu padrão dos selos que ficam em cima da arte.
const VEU = {
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}

// Estrelas do card: agora vivem na área CLARA, então são vermelho da marca
// sobre borda cinza — as brancas de antes sumiriam no branco.
function Estrelas({ n = 0 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }} aria-label={`${n} de 3`}>
      {[1, 2, 3].map(i => (
        <svg key={i} width={12} height={12} viewBox="0 0 24 24"
          fill={i <= n ? RED : 'none'} stroke={i <= n ? RED : 'var(--b2)'} strokeWidth="1.6">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}

// ── CAPA ─────────────────────────────────────────────────────────────────
function Capa({ slot, index, isPro, favorito, onFavoritar }) {
  const [copiado, setCopiado] = useState(false)
  const [erroImg, setErroImg] = useState(false)
  const [hover, setHover] = useState(false)
  const [pulso, setPulso] = useState(false)

  const travado = !isPro
  const temImagem = slot.image && !erroImg
  // Variação de desfoque por card: mantém o efeito "orgânico" do original.
  const desfoque = 7 + (slot.id % 4)
  const brilho = 0.55 + (slot.id % 3) * 0.05
  const alta = slot.performance === 'alta'
  const rotuloPerf = alta ? 'Alta' : slot.performance === 'baixa' ? 'Baixa' : 'Media'

  // Card travado: clique dá um pulso curto (feedback de "tem cadeado aqui").
  function tocar() {
    if (!travado) return
    setPulso(true)
    setTimeout(() => setPulso(false), 420)
  }

  function copiar() {
    if (travado) { tocar(); return }
    try { navigator.clipboard.writeText(slot.name) } catch {}
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <BCard pad={0} delay={Math.min(index * 0.03, 0.4)} onClick={travado ? tocar : undefined}
      style={{ borderColor: hover && !travado ? 'var(--b2)' : 'var(--b1)' }}>
      <motion.div
        animate={pulso ? { scale: [1, 0.985, 1] } : { scale: 1 }}
        transition={{ duration: 0.42, ease: [0.33, 1, 0.68, 1] }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 232 }}>

        {/* ── ARTE (aqui e só aqui vale o véu escuro) ── */}
        <div style={{
          position: 'relative', aspectRatio: '16/10', overflow: 'hidden',
          background: 'var(--fill-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {temImagem ? (
            <img
              src={slot.image}
              alt={isPro ? slot.name : ''}
              onError={() => setErroImg(true)}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.45s, filter 0.3s',
                transform: hover && !travado ? 'scale(1.06)' : 'scale(1)',
                filter: travado ? `blur(${desfoque}px) brightness(${brilho}) saturate(0.55)` : 'none',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(145deg, #14141a, #2a2a33)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!travado && (
                <p style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', padding: '0 12px', margin: 0 }}>
                  {slot.name}
                </p>
              )}
            </div>
          )}

          {/* Escurecimento extra quando travado */}
          {travado && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.34) 100%)' }} />
          )}

          {/* Selo do provider (véu escuro — em cima da foto) */}
          <span style={{
            position: 'absolute', top: 10, left: 10, zIndex: 4,
            padding: '4px 10px', borderRadius: 8,
            fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
            ...VEU,
          }}>{String(slot.provider || '').toUpperCase()}</span>

          {/* Selo de performance (véu escuro — em cima da foto) */}
          <span style={{
            position: 'absolute', top: 10, right: 10, zIndex: 4,
            padding: '4px 10px', borderRadius: 8,
            fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
            ...VEU,
            color: alta ? '#a8e06a' : 'rgba(255,255,255,0.9)',
          }}>{rotuloPerf}</span>

          {/* Coração: favoritar. Só pra quem enxerga o jogo (PRO). */}
          {!travado && onFavoritar && (
            <motion.button type="button"
              onClick={(e) => { e.stopPropagation(); onFavoritar(slot.id) }}
              aria-pressed={!!favorito}
              aria-label={favorito ? `Remover ${slot.name} dos favoritos` : `Favoritar ${slot.name}`}
              whileTap={{ scale: 0.82 }} whileHover={{ scale: 1.08 }}
              style={{
                position: 'absolute', bottom: 10, right: 10, zIndex: 4,
                width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, ...VEU,
              }}>
              <motion.svg width={15} height={15} viewBox="0 0 24 24"
                animate={favorito ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.34, ease: [0.33, 1, 0.68, 1] }}
                fill={favorito ? RED : 'none'} stroke={favorito ? RED : 'rgba(255,255,255,0.9)'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </motion.svg>
            </motion.button>
          )}

          {/* Cadeado central (véu escuro — em cima da foto) */}
          {travado && (
            <span style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...VEU }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <span style={{ fontSize: 8.5, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.12em' }}>PRO</span>
            </span>
          )}
        </div>

        {/* ── CORPO (superfície clara do bento) ── */}
        <div style={{ padding: '14px 15px 15px', flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {travado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Osso w="70%" h={13} r={6} />
              <Osso w="45%" h={9} r={5} />
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.name}</h3>
              <Estrelas n={slot.rating} />
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(slot.tags || []).map(tag => (
                  <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)' }}>{tag}</span>
                ))}
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />

          {travado ? (
            <Link href="/billing" onClick={e => e.stopPropagation()} style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
              fontSize: 11.5, fontWeight: 800, textDecoration: 'none', color: '#fff',
              background: `linear-gradient(135deg, ${RED2}, ${RED})`,
              boxShadow: '0 8px 20px rgba(229,57,31,0.26)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Ico d={<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />} s={12} />
              Acessar PRO
            </Link>
          ) : (
            <motion.button type="button" onClick={copiar}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
                background: copiado ? 'var(--profit-dim)' : 'var(--fill-1)',
                color: copiado ? 'var(--profit)' : 'var(--t1)',
                border: `1px solid ${copiado ? 'var(--profit-border)' : 'var(--b2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
              }}>
              {copiado ? (
                <><Ico d={<polyline points="20 6 9 17 4 12" />} s={13} />Copiado!</>
              ) : (
                <><Ico d={<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>} s={13} />Copiar Nome</>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </BCard>
  )
}

// ── MÓDULO ───────────────────────────────────────────────────────────────
export default function SlotsBento({
  slots = [],           // lista JÁ filtrada pela página (aba + provider + busca)
  providers = [],
  counts = {},
  filtro = 'all', onFiltro,
  busca = '', onBusca,
  aba = 'catalogo', onAba,
  isPro = false,
  favoritos = [],
  onFavoritar,
  totalCatalogo = 0,
}) {
  const favSet = new Set(favoritos)
  const alta = slots.filter(s => s.performance === 'alta').length
  const media = slots.filter(s => s.performance === 'media').length
  const baixa = slots.filter(s => s.performance === 'baixa').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ModuleHeader
        titulo="Slots Premium"
        sub={`${int(totalCatalogo)} jogos testados para rollover · atualizado semanalmente`}
      />

      {/* Abas: mesmas duas de antes, agora em pílulas do kit CAMPO. */}
      <Pilulas
        valor={aba}
        aoMudar={v => onAba && onAba(v)}
        opcoes={[
          { v: 'catalogo', l: 'Catálogo Oficial' },
          { v: 'meus', l: `Meus Jogos${favoritos.length ? ` (${favoritos.length})` : ''}` },
        ]}
      />

      {/* Filtros + busca. O data-tour precisa continuar existindo: o tour de
          /slots aponta pra ele. */}
      <BCard pad={18} delay={0.06}>
        <div data-tour="slots-filtros" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Campo
            valor={busca}
            aoMudar={v => onBusca && onBusca(v)}
            placeholder="Buscar por nome ou tag..."
            icone={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>}
          />
          <Pilulas
            rotulo="Provider"
            valor={filtro}
            aoMudar={v => onFiltro && onFiltro(v)}
            compacto
            opcoes={providers.map(p => ({ v: p.id, l: `${p.label} ${counts[p.id] || 0}` }))}
          />
        </div>
      </BCard>

      <Tira itens={[
        { l: 'Na vitrine', v: int(slots.length) },
        { l: 'Alta performance', v: int(alta), c: 'var(--profit)' },
        { l: 'Média', v: int(media) },
        { l: 'Baixa', v: int(baixa) },
        { l: 'Favoritos', v: int(favoritos.length), c: favoritos.length ? RED : undefined },
      ]} />

      {/* A busca NÃO entra na chave da grade: remontar a cada tecla digitada
          faria o catálogo piscar. Só aba e provider trocam a cena. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${aba}-${filtro}`}
          data-tour="slots-grid"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))', gap: 16 }}>
          {slots.map((slot, i) => (
            <Capa key={slot.id} slot={slot} index={i} isPro={isPro}
              favorito={favSet.has(slot.id)} onFavoritar={onFavoritar} />
          ))}
        </motion.div>
      </AnimatePresence>

      {slots.length === 0 && (
        <BCard pad={10} delay={0.1}>
          {aba === 'meus' ? (
            <Vazio
              titulo="Nenhum jogo favoritado ainda"
              texto={isPro
                ? 'Toque no coração em cima da capa, no Catálogo Oficial, pra guardar os jogos que você mais usa.'
                : 'Os favoritos abrem junto com o catálogo no plano PRO.'}
              icone={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />}
            />
          ) : (
            <Vazio
              titulo="Nenhum slot encontrado"
              texto="Nada bate com esse provider e essa busca. Limpe a busca ou escolha Todos."
              icone={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>}
            />
          )}
        </BCard>
      )}

      <style>{`@media (max-width:900px){ .bk-tira{grid-template-columns:repeat(2,1fr)!important} }`}</style>
    </div>
  )
}

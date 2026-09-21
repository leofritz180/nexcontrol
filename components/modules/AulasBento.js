'use client'
// ─────────────────────────────────────────────────────────────────────────
// AULAS VIP — visual 2.0 ("vitrine estilo streaming", entorno claro).
//
// Componente PURO: recebe a lista de cursos, o mapa de progresso e os
// handlers da página. Não busca, não grava, não conhece Supabase.
//
// DECISÃO (mesma do SlotsBento, não reverter): a ARTE da capa continua
// escura — capa de vídeo é arte, não superfície de UI. Os selos que ficam
// EM CIMA da arte usam véu escuro com texto branco explícito, porque ali é
// legibilidade sobre foto. O que virou claro foi o ENTORNO: cabeçalho,
// busca, indicadores, corpo do card e os estados vazios.
// ─────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ModuleHeader, AcaoBtn, Tira, BCard, Vazio, Ico, MONO, RED, RED2, int } from '../ui/bento'
import { Campo } from '../ui/campo'

// Capa de curso sem imagem. Eram seis gradientes herdados da tela antiga —
// azul-marinho, ROXO, verde-garrafa, marrom — que num painel preto/branco/
// vermelho pareciam de outro produto. Agora é uma família só: grafite
// escuro com uma brasa da marca entrando de um canto diferente em cada uma.
// Continuam seis e continuam distinguíveis, mas pertencem à casa.
//
// 155deg e nao 150deg de proposito: o globals.css tem uma regra que casa por
// SUBSTRING com `linear-gradient(150deg` e troca o fundo por branco liso (ela
// existe pra limpar os cards do tema escuro antigo). Com 150 as capas saiam
// brancas.
const ARTES = [
  'radial-gradient(120% 130% at 12% 8%, rgba(229,57,31,0.42) 0%, transparent 58%), linear-gradient(155deg, #24242c, #131317)',
  'radial-gradient(120% 130% at 88% 12%, rgba(255,122,77,0.38) 0%, transparent 58%), linear-gradient(155deg, #202028, #101014)',
  'radial-gradient(130% 120% at 50% 100%, rgba(229,57,31,0.34) 0%, transparent 60%), linear-gradient(155deg, #26262e, #151519)',
  'radial-gradient(120% 130% at 8% 92%, rgba(255,122,77,0.34) 0%, transparent 56%), linear-gradient(155deg, #1e1e25, #0e0e12)',
  'radial-gradient(140% 120% at 92% 88%, rgba(229,57,31,0.38) 0%, transparent 62%), linear-gradient(155deg, #22222a, #121216)',
  'radial-gradient(110% 140% at 50% 0%, rgba(255,122,77,0.30) 0%, transparent 55%), linear-gradient(155deg, #28282f, #16161b)',
]

// O id do curso é UUID (string): `id % 6` daria NaN e a capa ficaria sem
// fundo nenhum. Por isso o índice sai de um hash simples e estável.
function indiceArte(id, i = 0) {
  const s = String(id ?? i)
  let h = 0
  for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) >>> 0
  return h % ARTES.length
}

// Véu padrão dos selos que ficam sobre a arte escura.
const VEU = {
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}

const PLAY = <path d="M8 5.14v14.72a1 1 0 001.5.86l11.24-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />

// ── ANEL DE PROGRESSO ────────────────────────────────────────────────────
// Irmão pequeno do Rosca/Arco do kit: uma métrica só, cabe dentro do card.
function Anel({ pct = 0, tamanho = 40, espessura = 4 }) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0))
  const r = (tamanho - espessura) / 2
  const circ = 2 * Math.PI * r
  const completo = p >= 100
  const cor = completo ? 'var(--profit)' : RED
  return (
    <span style={{ position: 'relative', width: tamanho, height: tamanho, flexShrink: 0, display: 'inline-flex' }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--fill-2)" strokeWidth={espessura} />
        <motion.circle
          cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none"
          stroke={cor} strokeWidth={espessura} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - p / 100) }}
          transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
        />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: tamanho > 44 ? 11 : 9.5, fontWeight: 900, color: completo ? 'var(--profit)' : 'var(--t1)' }}>
        {completo ? <Ico d={<path d="M20 6L9 17l-5-5" />} s={13} c="var(--profit)" /> : Math.round(p)}
      </span>
    </span>
  )
}

// ── VITRINE (o herói do topo) ────────────────────────────────────────────
// Card do bento por fora (canto 24, borda, sombra) e arte cinematográfica
// por dentro. O texto sobre a arte é branco de propósito.
function Vitrine({ curso, pct, onAssistir, onDetalhes }) {
  if (!curso) return null
  const arte = curso.thumb_url ? `url(${curso.thumb_url}) center/cover` : ARTES[indiceArte(curso.id)]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      className="au-vitrine"
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 24,
        border: '1px solid var(--b1)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
        minHeight: 340, display: 'flex', alignItems: 'flex-end',
      }}>
      {/* Arte com respiração lenta (o mesmo zoom cinematográfico de antes) */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: -24, background: arte }}
      />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,8,12,0.25) 0%, rgba(6,8,12,0.62) 46%, rgba(6,8,12,0.93) 100%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(6,8,12,0.88) 0%, rgba(6,8,12,0.42) 48%, transparent 78%)' }} />

      <div style={{ position: 'relative', zIndex: 2, padding: '38px 34px 32px', maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9.5, fontWeight: 900, padding: '4px 11px', borderRadius: 999, background: `linear-gradient(135deg, ${RED2}, ${RED})`, color: '#fff', letterSpacing: '0.14em' }}>VIP</span>
          {curso.category && <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 11px', borderRadius: 999, ...VEU }}>{curso.category}</span>}
          {curso.lesson_count > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>
              <Ico d={PLAY} s={11} c="rgba(255,255,255,0.78)" />{curso.lesson_count} aulas
            </span>
          )}
          {curso.total_duration > 0 && <span style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{curso.total_duration} min</span>}
        </div>

        <h2 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.04em', lineHeight: 1.05, textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
          {curso.title || 'Sem título'}
        </h2>
        {curso.description && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.74)', margin: '0 0 22px', lineHeight: 1.6, maxWidth: 480 }}>{curso.description}</p>
        )}

        {pct > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 20px', maxWidth: 320 }}>
            <span style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <motion.span initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
                style={{ display: 'block', height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${RED2}, ${RED})` }} />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 800, color: '#fff' }}>{Math.round(pct)}%</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <motion.button type="button" onClick={onAssistir}
            whileHover={{ y: -2, boxShadow: '0 14px 34px rgba(229,57,31,0.42)' }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 26px', borderRadius: 30,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: '#fff',
              background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.34)',
            }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="#fff" stroke="none">{PLAY}</svg>
            {pct > 0 && pct < 100 ? 'Continuar' : 'Assistir agora'}
          </motion.button>
          <motion.button type="button" onClick={onDetalhes}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 22px', borderRadius: 30,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, ...VEU,
            }}>
            <Ico d={<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>} s={14} c="rgba(255,255,255,0.92)" />
            Mais detalhes
          </motion.button>
        </div>
      </div>
      <style>{`@media(max-width:768px){ .au-vitrine{ min-height:280px !important } .au-vitrine h2{ font-size:27px !important } }`}</style>
    </motion.div>
  )
}

// ── CARD DE CURSO ────────────────────────────────────────────────────────
function CardCurso({ curso, pct = 0, index = 0, onAbrir }) {
  const [hover, setHover] = useState(false)
  const arte = curso.thumb_url ? `url(${curso.thumb_url}) center/cover` : ARTES[indiceArte(curso.id, index)]
  const temProg = pct > 0
  const tags = curso.tags || []

  return (
    <BCard pad={0} delay={Math.min(index * 0.03, 0.36)} onClick={() => onAbrir(curso.id)}
      style={{ flexShrink: 0, width: 268, scrollSnapAlign: 'start', borderColor: hover ? 'var(--b2)' : 'var(--b1)' }}>
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ display: 'flex', flexDirection: 'column', minHeight: 236 }}>

        {/* ── ARTE (única região escura do card) ── */}
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--fill-2)' }}>
          <div aria-hidden style={{
            position: 'absolute', inset: 0, background: arte,
            transform: hover ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.45s ease',
          }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(8,10,16,0.72) 0%, transparent 58%)' }} />

          {/* Selos sobre a arte */}
          <div style={{ position: 'absolute', top: 9, left: 9, display: 'flex', gap: 5, zIndex: 3 }}>
            {tags.includes('novo') && <span style={{ fontSize: 8.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, background: `linear-gradient(135deg, ${RED2}, ${RED})`, color: '#fff', letterSpacing: '0.1em' }}>NOVO</span>}
            {tags.includes('popular') && <span style={{ fontSize: 8.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.1em', ...VEU }}>POPULAR</span>}
            {tags.includes('vip') && <span style={{ fontSize: 8.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.1em', ...VEU }}>VIP</span>}
          </div>

          {/* Título sobre a arte, como na vitrine de vídeo */}
          <div style={{ position: 'absolute', left: 13, right: 13, bottom: temProg ? 13 : 10, zIndex: 3 }}>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em', textShadow: '0 1px 10px rgba(0,0,0,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {curso.title || 'Sem título'}
            </p>
          </div>

          {/* Play no hover */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.34)', opacity: hover ? 1 : 0, transition: 'opacity 0.25s' }}>
            <motion.span animate={hover ? { scale: [1, 1.1, 1] } : { scale: 1 }} transition={{ duration: 1.5, repeat: hover ? Infinity : 0 }}
              style={{ width: 46, height: 46, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 8px 24px rgba(229,57,31,0.45)' }}>
              <svg width={19} height={19} viewBox="0 0 24 24" fill="#fff" stroke="none">{PLAY}</svg>
            </motion.span>
          </div>

          {/* Barra de progresso colada na base da arte */}
          {temProg && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3.5, background: 'rgba(0,0,0,0.55)', zIndex: 5 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
                style={{ height: '100%', background: pct >= 100 ? 'var(--profit)' : `linear-gradient(90deg, ${RED2}, ${RED})` }} />
            </div>
          )}
        </div>

        {/* ── CORPO (superfície clara do bento) ── */}
        <div style={{ padding: '13px 15px 15px', flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              {curso.category && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t3)' }}>{curso.category}</span>}
              {curso.lesson_count > 0 && <span style={{ fontSize: 10.5, color: 'var(--t4)', fontWeight: 600 }}>{curso.lesson_count} aulas</span>}
              {curso.total_duration > 0 && <span style={{ fontSize: 10.5, color: 'var(--t4)', fontWeight: 600 }}>{curso.total_duration} min</span>}
            </div>
            {curso.description && (
              <p style={{ fontSize: 11, color: 'var(--t4)', margin: '7px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{curso.description}</p>
            )}
            {temProg && (
              <p style={{ fontSize: 10.5, fontWeight: 800, color: pct >= 100 ? 'var(--profit)' : RED, margin: '7px 0 0' }}>
                {pct >= 100 ? 'Concluído' : `${Math.round(pct)}% concluído`}
              </p>
            )}
          </div>
          {temProg && <Anel pct={pct} />}
        </div>
      </div>
    </BCard>
  )
}

// ── FILEIRA (carrossel horizontal por categoria) ─────────────────────────
function Fileira({ titulo, cursos, progresso, onAbrir, delay = 0, icone }) {
  const ref = useRef(null)
  const rolar = dir => ref.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  const seta = (dir, d) => (
    <motion.button type="button" onClick={() => rolar(dir)} aria-label={dir < 0 ? 'Voltar' : 'Avançar'}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }}
      style={{ width: 32, height: 32, borderRadius: 11, border: '1px solid var(--b1)', background: 'var(--surface)', color: 'var(--t3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ico d={d} s={14} />
    </motion.button>
  )

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease: [0.33, 1, 0.68, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {icone && <span style={{ width: 28, height: 28, borderRadius: 10, background: 'var(--fill-1)', border: '1px solid var(--b1)', color: RED, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico d={icone} s={14} c={RED} /></span>}
          <h2 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titulo}</h2>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', fontFamily: MONO, flexShrink: 0 }}>{int(cursos.length)}</span>
        </span>
        <span style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
          {seta(-1, <path d="M15 18l-6-6 6-6" />)}
          {seta(1, <path d="M9 18l6-6-6-6" />)}
        </span>
      </div>
      <div ref={ref} className="au-fileira" style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '4px 2px 10px' }}>
        {cursos.map((c, i) => <CardCurso key={c.id} curso={c} pct={Number(progresso[c.id] || 0)} index={i} onAbrir={onAbrir} />)}
      </div>
    </motion.section>
  )
}

// ── MÓDULO ───────────────────────────────────────────────────────────────
export default function AulasBento({
  cursos = [],          // lista JÁ filtrada pela busca
  progresso = {},
  busca = '', onBusca,
  destaque = null,      // curso do herói (null quando há busca ativa)
  isAdmin = false,
  onAbrirCurso,
  onGerenciar,
  continuar = [],       // cursos com progresso entre 1% e 99%
  categorias = [],      // [[nome, cursos[]]]
}) {
  const totalAulas = cursos.reduce((s, c) => s + Number(c.lesson_count || 0), 0)
  const concluidos = cursos.filter(c => Number(progresso[c.id] || 0) >= 100).length
  const medio = cursos.length ? Math.round(cursos.reduce((s, c) => s + Number(progresso[c.id] || 0), 0) / cursos.length) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ModuleHeader
        titulo="Aulas VIP DARKZIN"
        sub={`${int(cursos.length)} curso${cursos.length === 1 ? '' : 's'} · ${int(totalAulas)} aula${totalAulas === 1 ? '' : 's'} liberadas para a sua conta`}
        acao={isAdmin ? <AcaoBtn onClick={onGerenciar} icon={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>}>Gerenciar</AcaoBtn> : null}
      />

      <div style={{ maxWidth: 420 }}>
        <Campo
          valor={busca}
          aoMudar={v => onBusca && onBusca(v)}
          placeholder="Buscar por título, categoria ou tag..."
          icone={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>}
        />
      </div>

      <Tira itens={[
        { l: 'Cursos', v: int(cursos.length) },
        { l: 'Aulas', v: int(totalAulas) },
        { l: 'Em andamento', v: int(continuar.length), c: continuar.length ? RED : undefined },
        { l: 'Concluídos', v: int(concluidos), c: concluidos ? 'var(--profit)' : undefined },
        { l: 'Progresso médio', v: `${medio}%` },
      ]} />

      {destaque && (
        <div data-tour="aulas-hero">
          <Vitrine
            curso={destaque}
            pct={Number(progresso[destaque.id] || 0)}
            onAssistir={() => onAbrirCurso(destaque.id)}
            onDetalhes={() => onAbrirCurso(destaque.id)}
          />
        </div>
      )}

      {cursos.length === 0 && (
        <BCard pad={12} delay={0.1}>
          <Vazio
            titulo={busca ? 'Nenhum curso encontrado' : 'Nenhum curso disponível'}
            texto={busca
              ? 'Nada bate com essa busca. Limpe o campo para ver o catálogo inteiro.'
              : 'Os cursos aparecem aqui assim que forem publicados.'}
            icone={<><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3V9z" /></>}
            acao={isAdmin && !busca ? <AcaoBtn onClick={onGerenciar} icon={<path d="M12 5v14M5 12h14" />}>Criar primeiro curso</AcaoBtn> : null}
          />
        </BCard>
      )}

      {continuar.length > 0 && (
        <Fileira
          titulo="Continuar de onde parou"
          icone={PLAY}
          cursos={continuar}
          progresso={progresso}
          onAbrir={onAbrirCurso}
          delay={0.1}
        />
      )}

      <div data-tour="aulas-grid" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {categorias.map(([nome, lista], i) => (
          <Fileira
            key={nome}
            titulo={nome}
            icone={<><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M10 9l5 3-5 3V9z" /></>}
            cursos={lista}
            progresso={progresso}
            onAbrir={onAbrirCurso}
            delay={0.14 + i * 0.05}
          />
        ))}
      </div>

      <style>{`
        .au-fileira::-webkit-scrollbar{ display:none }
        .au-fileira{ scrollbar-width:none }
        @media (max-width:900px){ .bk-tira{ grid-template-columns:repeat(2,1fr) !important } }
      `}</style>
    </div>
  )
}

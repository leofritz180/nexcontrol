'use client'
// ─────────────────────────────────────────────────────────────────────────
// KIT BENTO — blocos de página reutilizados por TODOS os módulos do V2.
// Garante que /custos, /faturamento, /operadores, /redes, /operator e
// /performance tenham exatamente a mesma linguagem: superfície branca,
// cantos 24px, blob orgânico, sombra suave, entrada animada e hover com mola.
// Puramente visual — nenhum bloco aqui busca ou grava dados.
// ─────────────────────────────────────────────────────────────────────────
import { motion, AnimatePresence, animate, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export const RED = '#e5391f', RED2 = '#ff7a4d', LIME = '#3f9b1e'
export const MONO = 'var(--mono, "JetBrains Mono", monospace)'
export const money = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money0 = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
// maximumFractionDigits: 0 de propósito. Sem isso o toLocaleString mantém
// até 3 casas e uma taxa de acerto de 82,142857% saía na tela como
// "82,143% acerto" — precisão falsa e feia numa função chamada `int`.
export const int = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

// ── SOMBRAS: tres niveis e so. Nada de 0 40px 100px da era escura. ──
export const SOMBRA = {
  repouso:   '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
  hover:     '0 6px 14px rgba(0,0,0,0.06), 0 20px 46px rgba(0,0,0,0.11)',
  flutuante: '0 1px 2px rgba(0,0,0,0.05), 0 30px 80px rgba(0,0,0,0.20)',
}

// ── TIPOGRAFIA: uma escala so, pra nao ter 6 tamanhos por pagina. ──
export const TIPO = {
  display: { fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 },
  numero:  { fontSize: 27, fontWeight: 900, letterSpacing: '-0.035em', fontFamily: MONO },
  titulo:  { fontSize: 25, fontWeight: 800, letterSpacing: '-0.03em' },
  secao:   { fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.02em' },
  corpo:   { fontSize: 13.5, fontWeight: 500 },
  rotulo:  { fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' },
}

export const surf = {
  position: 'relative', overflow: 'hidden', background: 'var(--surface)',
  borderRadius: 24, border: '1px solid var(--b1)',
  boxShadow: SOMBRA.repouso,
}

// O kit e PURAMENTE VISUAL: se uma pagina passar a coisa errada numa prop
// de lista, o certo e o bloco aparecer vazio — nunca derrubar a tela toda
// pelo error boundary. Foi o que aconteceu em 21/09/2026: o /performance
// recebeu `stats` (um objeto de totais) onde ia a lista de metas e morreu
// inteiro com "(r || []).slice is not a function". O ESLint nao ve isso.
const lista = v => (Array.isArray(v) ? v : [])

export const Ico = ({ d, c = 'currentColor', s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)

export function Blob({ c1, c2 }) {
  const id = 'bk' + String(c1).replace(/\W/g, '')
  return (
    <svg viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: '56%', height: '100%', pointerEvents: 'none' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2 || c1} /></linearGradient></defs>
      <path d="M40,0 C90,18 70,58 110,78 C150,98 180,80 200,64 L200,0 Z" fill={`url(#${id})`} opacity="0.9" />
      <path d="M78,0 C118,22 100,54 142,72 C172,85 190,78 200,70 L200,0 Z" fill={c1} opacity="0.4" />
    </svg>
  )
}

export function BCard({ children, style, pad = 22, blob, onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.33, 1, 0.68, 1] }}
      whileHover={{ y: -5, boxShadow: SOMBRA.hover }}
      onClick={onClick}
      style={{ ...surf, padding: pad, cursor: onClick ? 'pointer' : 'default', ...style }}>
      {blob && <Blob c1={blob[0]} c2={blob[1]} />}
      <div style={{ position: 'relative' }}>{children}</div>
    </motion.div>
  )
}

export function Eyebrow({ children }) {
  return <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 10px' }}>{children}</p>
}

// cabeçalho padrão de módulo: título, subtítulo e ação à direita
export function ModuleHeader({ titulo, sub, acao }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
      <div>
        <h1 style={{ fontSize: 25, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>{titulo}</h1>
        {sub && <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '3px 0 0' }}>{sub}</p>}
      </div>
      {acao}
    </div>
  )
}

// Botão de ação com ripple: a onda nasce no ponto exato do clique, o que
// dá a sensação de que o botão respondeu ao dedo, não ao evento.
export function AcaoBtn({ children, onClick, icon }) {
  const semMovimento = useReducedMotion()
  const [ondas, setOndas] = useState([])

  function clicou(e) {
    if (!semMovimento) {
      const r = e.currentTarget.getBoundingClientRect()
      const id = Date.now() + Math.random()
      setOndas(o => [...o, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
      // 600ms é a duração da animação; depois a onda não serve pra nada
      setTimeout(() => setOndas(o => o.filter(w => w.id !== id)), 600)
    }
    onClick?.(e)
  }

  return (
    // nx-acao: no celular o CSS transforma este botao no BOTAO FLUTUANTE da
    // tela (redondo, acima da barra de abas). Ver o bloco V2 · CELULAR.
    <motion.button type="button" onClick={clicou} className="nx-acao"
      whileHover={{ y: -2, boxShadow: '0 14px 32px rgba(229,57,31,0.36)' }} whileTap={{ scale: 0.97 }}
      style={{ position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)' }}>
      {ondas.map(w => (
        <motion.span key={w.id} aria-hidden
          initial={{ opacity: 0.5, scale: 0 }} animate={{ opacity: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ position: 'absolute', left: w.x, top: w.y, width: 240, height: 240, marginLeft: -120, marginTop: -120, borderRadius: '50%', background: 'rgba(255,255,255,0.45)', pointerEvents: 'none' }} />
      ))}
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {icon && <span className="nx-acao-ico" style={{ display: 'inline-flex' }}><Ico d={icon} s={16} /></span>}
        <span className="nx-acao-txt">{children}</span>
      </span>
    </motion.button>
  )
}

// herói: número grande com blob
export function Hero({ rotulo, valor, cor, nota, extras = [], blob, delay = 0.04 }) {
  extras = lista(extras)
  return (
    <Tilt>
    <BCard pad="28px 30px" blob={blob} delay={delay}>
      <Eyebrow>{rotulo}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap' }}>
        <div>
          <NumeroTexto delay={delay + 0.1} style={{ fontFamily: MONO, fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: cor || 'var(--t1)' }}>{valor}</NumeroTexto>
          {nota && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '12px 0 0' }}>{nota}</p>}
        </div>
        {extras.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {extras.map(e => (
              <div key={e.l} style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)', minWidth: 118 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>{e.l}</p>
                <NumeroTexto delay={delay + 0.2} style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: e.c || 'var(--t1)', margin: 0, display: 'block' }}>{e.v}</NumeroTexto>
              </div>
            ))}
          </div>
        )}
      </div>
    </BCard>
    </Tilt>
  )
}

// tira de indicadores colada
export function Tira({ itens }) {
  itens = lista(itens)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
      className="bk-tira" style={{ display: 'grid', gridTemplateColumns: `repeat(${itens.length}, 1fr)`, gap: 1, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--b1)', background: 'var(--b1)' }}>
      {itens.map((c, i) => (
        <div key={i} style={{ padding: '15px 17px', background: 'var(--surface)' }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 8px' }}>{c.l}</p>
          <NumeroTexto delay={0.14 + i * 0.05} style={{ fontFamily: MONO, fontSize: 18, fontWeight: 900, color: c.c || 'var(--t1)', margin: 0, letterSpacing: '-0.02em', display: 'block' }}>{c.v}</NumeroTexto>
          {c.hint && <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '6px 0 0' }}>{c.hint}</p>}
        </div>
      ))}
    </motion.div>
  )
}

// barras horizontais (distribuição)
export function Barras({ titulo, sub, dados, delay = 0.16 }) {
  dados = lista(dados)
  const max = Math.max(1, ...dados.map(d => d.v))
  return (
    <BCard pad={24} delay={delay}>
      <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: sub ? '0 0 3px' : '0 0 18px', letterSpacing: '-0.02em' }}>{titulo}</p>
      {sub && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px' }}>{sub}</p>}
      {dados.length === 0 && <Vazio titulo="Sem dados no período" texto="Assim que houver movimento, o gráfico aparece aqui." icone={<><path d="M3 3v18h18" /><path d="M7 15l3-3 4 4 5-6" /></>} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {dados.map((d, i) => (
          <div key={d.l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--t2)' }}>
                {d.dot && <span style={{ width: 9, height: 9, borderRadius: 3, background: d.dot }} />}{d.l}
              </span>
              <NumeroTexto delay={delay + i * 0.06} style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 800, color: d.c || 'var(--t1)' }}>{d.txt}</NumeroTexto>
            </div>
            <div title={`${d.l}: ${d.txt}`} style={{ height: 18, borderRadius: 9, background: 'var(--fill-1)', overflow: 'hidden', cursor: 'default' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, (d.v / max) * 100)}%` }}
                transition={{ duration: 0.9, delay: delay + i * 0.06, ease: [0.33, 1, 0.68, 1] }}
                style={{ height: '100%', borderRadius: 9, background: d.dot || `linear-gradient(90deg, ${RED2}, ${RED})` }} />
            </div>
          </div>
        ))}
      </div>
    </BCard>
  )
}

// lista de linhas
// Tira acento e caixa: procurar por "joao" tem que achar "João".
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// A BUSCA MORA AQUI, e nao em cada pagina.
// O campo existia no kit desde a onda 2 e nao estava ligado em lugar nenhum,
// porque ligar dava trabalho em cada chamada (estado, filtro, slot). Assim
// TODA lista do bento ganha busca de uma vez — e so quando faz falta: com
// menos de `minBusca` linhas o campo nem aparece, pra nao poluir as curtas.
export function Lista({ titulo, linhas, vazio = 'Nada por aqui ainda.', delay = 0.22, acao, buscavel = true, minBusca = 8, placeholderBusca = 'Buscar…' }) {
  linhas = lista(linhas)
  const [busca, setBusca] = useState('')
  const mostrarBusca = buscavel && linhas.length >= minBusca
  const alvo = semAcento(busca).trim()
  const todas = linhas
  if (mostrarBusca && alvo) {
    linhas = linhas.filter(r => semAcento([r.t, r.s, r.v].filter(Boolean).join(' ')).includes(alvo))
  }
  return (
    <BCard pad={24} delay={delay}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{titulo}</p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {mostrarBusca && <BuscaLista valor={busca} aoMudar={setBusca} placeholder={placeholderBusca} />}
          {acao}
        </span>
      </div>
      {todas.length === 0 && <Vazio titulo={vazio} icone={<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></>} />}
      {todas.length > 0 && linhas.length === 0 && (
        <Vazio titulo={`Nada com “${busca}”`} texto={`Nenhuma das ${todas.length} linhas bate com essa busca.`}
          icone={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} />
      )}
      {linhas.map((r, i) => (
        <motion.div key={r.k || i} layout
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.32, delay: Math.min(i * 0.03, 0.3), ease: [0.33, 1, 0.68, 1] }}
          whileHover={r.onClick ? { x: 3 } : undefined} onClick={r.onClick}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: i < linhas.length - 1 ? '1px solid var(--b1)' : 'none', cursor: r.onClick ? 'pointer' : 'default' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            {r.avatar && (
              <span style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: r.avatarBg || 'var(--fill-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: r.avatarFg || 'var(--t2)', fontFamily: MONO }}>
                {r.avatar}
              </span>
            )}
            <span style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.t}</p>
              {r.s && <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0' }}>{r.s}</p>}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <NumeroTexto delay={delay + i * 0.04} style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 800, color: r.vc || 'var(--t1)' }}>{r.v}</NumeroTexto>
            {r.acao}
          </span>
        </motion.div>
      ))}
    </BCard>
  )
}

export const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }
export const grid2 = { display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14 }

// ── ROSCA (donut) ────────────────────────────────────────────────────────
// Anel com o total no miolo e legenda ao lado. Cada fatia é um arco desenhado
// com stroke-dasharray, então a animação é o próprio traço sendo riscado.
// `dados`: [{ l, v, c }] já ordenados. `centro`/`rotulo` vão no miolo.
export function Rosca({ dados = [], centro, rotulo, tamanho = 132, espessura = 16, formata = int, delay = 0.1 }) {
  dados = lista(dados)
  const total = dados.reduce((a, d) => a + Number(d.v || 0), 0)
  const r = (tamanho - espessura) / 2
  const circ = 2 * Math.PI * r
  const vazio = total <= 0

  let acumulado = 0
  const fatias = dados.map(d => {
    const frac = vazio ? 0 : Number(d.v || 0) / total
    const seg = { ...d, frac, offset: acumulado }
    acumulado += frac
    return seg
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: tamanho, height: tamanho, flexShrink: 0 }}>
        <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--fill-2)" strokeWidth={espessura} />
          {!vazio && fatias.map((s, i) => (
            <motion.circle
              key={s.l}
              cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none"
              stroke={s.c} strokeWidth={espessura} strokeLinecap="round"
              strokeDasharray={`${Math.max(0, s.frac * circ - 3)} ${circ}`}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: -s.offset * circ }}
              transition={{ duration: 1, delay: delay + i * 0.12, ease: [0.33, 1, 0.68, 1] }}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <NumeroTexto delay={delay + 0.2} style={{ fontFamily: MONO, fontSize: 23, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', lineHeight: 1 }}>{centro}</NumeroTexto>
          {rotulo && <span style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 4 }}>{rotulo}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1, minWidth: 140 }}>
        {dados.length === 0 && <Vazio titulo="Sem dados no período" texto="Assim que houver movimento, o gráfico aparece aqui." icone={<><path d="M3 3v18h18" /><path d="M7 15l3-3 4 4 5-6" /></>} />}
        {dados.map(d => (
          <div key={d.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.c, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.l}</span>
            <NumeroTexto delay={delay + 0.25} style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 800, color: 'var(--t1)', flexShrink: 0 }}>{formata(d.v)}</NumeroTexto>
          </div>
        ))}
      </div>
    </div>
  )
}

// rampa de cores das fatias — família da marca + lima, sem azul/roxo
export const FATIAS = ['#e5391f', '#ff7a4d', '#3f9b1e', '#ffb08a', '#b6b6c0']

// ── NUMERO ANIMADO ───────────────────────────────────────────────────────
// Conta de 0 até o valor na primeira vez e, depois disso, ROLA do valor
// anterior pro novo (ex: uma remessa entra e o lucro sobe sozinho).
// Respeita prefers-reduced-motion. A formatação roda a cada quadro, então o
// separador de milhar aparece durante a contagem — é o que dá a sensação.
export function NumeroAnimado({ valor, formata = int, duracao = 1.1, delay = 0, style, children }) {
  const semMovimento = useReducedMotion()
  const alvo = Number(valor) || 0
  const anterior = useRef(null)
  const [txt, setTxt] = useState(() => formata(semMovimento ? alvo : 0))

  useEffect(() => {
    if (semMovimento) { setTxt(formata(alvo)); anterior.current = alvo; return }
    const primeira = anterior.current === null
    const de = primeira ? 0 : anterior.current
    anterior.current = alvo
    if (de === alvo) { setTxt(formata(alvo)); return }
    const ctrl = animate(de, alvo, {
      duration: primeira ? duracao : 0.55,
      delay: primeira ? delay : 0,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => setTxt(formata(v)),
      onComplete: () => setTxt(formata(alvo)),
    })
    return () => ctrl.stop()
  }, [alvo, semMovimento])

  return <span style={style}>{txt}{children}</span>
}

// ── ESQUELETO ────────────────────────────────────────────────────────────
// Bloco cinza com a FORMA do conteúdo que vai chegar. Melhor que spinner
// porque o layout não pula quando os dados carregam.
export function Osso({ w = '100%', h = 14, r = 8, style }) {
  return <span aria-hidden className="bk-osso" style={{ display: 'block', width: w, height: h, borderRadius: r, background: 'var(--fill-2)', ...style }} />
}

export function CardEsqueleto({ altura = 148, linhas = 2, pad = 22 }) {
  return (
    <div style={{ ...surf, padding: pad, minHeight: altura, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Osso w={38} h={38} r={12} />
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Osso w="58%" h={24} r={7} />
        {Array.from({ length: Math.max(0, linhas - 1) }).map((_, i) => <Osso key={i} w={i % 2 ? '44%' : '72%'} h={11} r={6} />)}
      </div>
    </div>
  )
}

// Esqueleto de um módulo inteiro, no formato dos bentos.
export function ModuloEsqueleto({ cards = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-busy="true" aria-label="Carregando">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Osso w={210} h={26} r={8} />
          <Osso w={280} h={13} r={6} />
        </div>
        <Osso w={150} h={44} r={30} />
      </div>
      <div className="bk-esq-cards" style={{ display: 'grid', gridTemplateColumns: `repeat(${cards}, 1fr)`, gap: 14 }}>
        {Array.from({ length: cards }).map((_, i) => <CardEsqueleto key={i} />)}
      </div>
      <div className="bk-esq-2" style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14 }}>
        <div style={{ ...surf, padding: 24, minHeight: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Osso w="42%" h={18} r={7} />
          <Osso w="100%" h={200} r={16} style={{ marginTop: 'auto' }} />
        </div>
        <div style={{ ...surf, padding: 24, minHeight: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Osso w="60%" h={18} r={7} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Osso w={30} h={30} r={10} />
              <Osso w={`${70 - i * 8}%`} h={13} r={6} />
            </div>
          ))}
        </div>
      </div>
      <EstiloEsqueleto />
    </div>
  )
}

export function EstiloEsqueleto() {
  return (
    <style>{`
      .bk-osso { position: relative; overflow: hidden; }
      .bk-osso::after {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, rgba(0,0,0,0.035), transparent);
        transform: translateX(-100%);
        animation: bk-brilho 1.5s ease-in-out infinite;
      }
      @keyframes bk-brilho { 100% { transform: translateX(100%); } }
      @media (prefers-reduced-motion: reduce) { .bk-osso::after { animation: none; } }
      @media (max-width: 1000px) {
        .bk-esq-cards { grid-template-columns: 1fr 1fr !important; }
        .bk-esq-2 { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 600px) { .bk-esq-cards { grid-template-columns: 1fr !important; } }
    `}</style>
  )
}

// ── ESTADO VAZIO ─────────────────────────────────────────────────────────
// Substitui o <p> cinza solto: ícone em moldura, uma frase e o caminho.
export function Vazio({ icone, titulo, texto, acao }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '34px 20px' }}>
      <motion.span
        initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
        style={{
          width: 62, height: 62, borderRadius: 20, marginBottom: 14,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--fill-1)', border: '1px solid var(--b1)', color: 'var(--t4)',
        }}>
        <Ico d={icone || <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>} s={26} />
      </motion.span>
      <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em' }}>{titulo}</p>
      {texto && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '5px 0 0', maxWidth: 330, lineHeight: 1.55 }}>{texto}</p>}
      {acao && <span style={{ marginTop: 16 }}>{acao}</span>}
    </div>
  )
}

// ── NUMERO A PARTIR DO TEXTO ─────────────────────────────────────────────
// Recebe o valor JÁ FORMATADO ("R$ 90.433", "-R$ 1.007,00", "62%") e anima
// só a parte numérica, preservando prefixo, sufixo e o número de casas.
// Feito assim de propósito: os blocos do kit já recebem string pronta, então
// o contador entra sem mexer em nenhum ponto de chamada nem no cálculo.
const BK_RE_NUM = /\d[\d.]*(?:,\d+)?/

function bkParse(txt) {
  const m = String(txt).match(BK_RE_NUM)
  if (!m) return null
  const cru = m[0]
  const casas = cru.includes(',') ? cru.split(',')[1].length : 0
  const n = Number(cru.replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return { n, casas, inicio: m.index, fim: m.index + cru.length }
}

export function NumeroTexto({ children, duracao = 1.1, delay = 0, style }) {
  const bruto = String(children ?? '')
  const semMovimento = useReducedMotion()
  const info = bkParse(bruto)
  const alvo = info ? info.n : 0
  const anterior = useRef(null)
  const [atual, setAtual] = useState(() => (semMovimento || !info ? alvo : 0))

  useEffect(() => {
    if (!info) return
    if (semMovimento) { setAtual(alvo); anterior.current = alvo; return }
    const primeira = anterior.current === null
    const de = primeira ? 0 : anterior.current
    anterior.current = alvo
    if (de === alvo) { setAtual(alvo); return }
    const ctrl = animate(de, alvo, {
      duration: primeira ? duracao : 0.5,
      delay: primeira ? delay : 0,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => setAtual(v),
      onComplete: () => setAtual(alvo),
    })
    return () => ctrl.stop()
  }, [alvo, semMovimento, info === null])

  if (!info) return <span style={style}>{bruto}</span>
  const corpo = atual.toLocaleString('pt-BR', { minimumFractionDigits: info.casas, maximumFractionDigits: info.casas })
  return (
    <span style={style}>
      {bruto.slice(0, info.inicio)}{corpo}{bruto.slice(info.fim)}
    </span>
  )
}

// ── TILT ─────────────────────────────────────────────────────────────────
// Inclina o cartão 2-3 graus seguindo o cursor e move um brilho junto. É o
// que separa "card branco" de "card premium" sem precisar de cor nenhuma.
// Usa motionValue + spring: nada disso passa pelo React a cada movimento do
// mouse, então não há re-render. Desliga em toque e em movimento reduzido.
export function Tilt({ children, grau = 2.5, brilho = true, style, ...resto }) {
  const semMovimento = useReducedMotion()
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const mola = { stiffness: 180, damping: 22, mass: 0.6 }
  const rx = useSpring(useTransform(my, [0, 1], [grau, -grau]), mola)
  const ry = useSpring(useTransform(mx, [0, 1], [-grau, grau]), mola)
  const luzX = useTransform(mx, v => v * 100 + '%')
  const luzY = useTransform(my, v => v * 100 + '%')
  // O gradiente PRECISA ser declarado aqui em cima: se ficasse dentro do
  // {brilho && ...} seria um hook condicional, e a contagem mudaria entre
  // renders (React #300).
  const luzFundo = useTransform([luzX, luzY], ([x, y]) =>
    `radial-gradient(420px circle at ${x} ${y}, rgba(255,255,255,0.55), transparent 55%)`)

  function mover(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  function sair() { mx.set(0.5); my.set(0.5) }

  if (semMovimento) return <div style={style} {...resto}>{children}</div>

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => { if (e.pointerType === 'mouse') mover(e) }}
      onPointerLeave={sair}
      style={{ perspective: 900, ...style }}
      {...resto}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', position: 'relative' }}>
        {children}
        {brilho && (
          <motion.span
            aria-hidden
            style={{
              position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
              background: luzFundo,
              mixBlendMode: 'soft-light',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// CARDS DA 2.0 — os blocos que faltavam pro painel parecer vivo.
// Todos puramente visuais: recebem número pronto, não calculam nada.
// ═════════════════════════════════════════════════════════════════════════

// ── SPARKLINE ────────────────────────────────────────────────────────────
// KPI com a mini-curva dos últimos dias desenhada ATRÁS do número. Dá
// contexto sem ocupar espaço: o usuário vê o valor e a tendência de uma vez.
function caminhoSuave(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
    const cx = (x0 + x1) / 2
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
  }
  return d
}

export function Sparkline({ rotulo, valor, serie = [], cor = RED, nota, delay = 0.06, altura = 150 }) {
  serie = lista(serie)
  const id = 'sp' + String(rotulo).replace(/\W/g, '')
  const W = 260, H = 64
  const vals = serie.length ? serie.map(Number) : [0]
  const alto = Math.max(...vals), baixo = Math.min(...vals, 0)
  const faixa = (alto - baixo) || 1
  const pts = vals.map((v, i) => [
    vals.length > 1 ? (i * W) / (vals.length - 1) : 0,
    H - ((v - baixo) / faixa) * (H - 8) - 4,
  ])
  const d = caminhoSuave(pts)

  // A curva era position:absolute com bottom:0 — mas o pai posicionado nao e
  // o CARD, e o <div relative> que o BCard poe em volta dos filhos, cuja
  // altura e a do texto. Resultado: ela se ancorava no fim do texto e pintava
  // POR CIMA da legenda ("lucro das metas fechadas no periodo" saia riscado
  // de vermelho). Agora ela vem depois do texto, no fluxo normal, com margem
  // negativa pra sangrar ate a borda. Nao tem como sobrepor nada.
  return (
    <BCard pad={22} delay={delay} style={{ minHeight: altura }}>
      <Eyebrow>{rotulo}</Eyebrow>
      <NumeroTexto delay={delay + 0.1} style={{ ...TIPO.numero, color: 'var(--t1)', display: 'block', marginTop: 14 }}>{valor}</NumeroTexto>
      {nota && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '4px 0 0' }}>{nota}</p>}
      {d && (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden
          style={{ display: 'block', width: 'calc(100% + 44px)', height: 58, marginLeft: -22, marginRight: -22, marginTop: 16, marginBottom: -22, pointerEvents: 'none' }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity="0.20" />
              <stop offset="100%" stopColor={cor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#${id})`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: delay + 0.3 }} />
          <motion.path d={d} fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: delay + 0.15, ease: [0.33, 1, 0.68, 1] }} />
        </svg>
      )}
    </BCard>
  )
}

// ── COMPARATIVO ──────────────────────────────────────────────────────────
// Valor de agora contra o de antes, com a seta girando na entrada. O delta
// é calculado aqui só pra exibição; quem manda são os dois números recebidos.
export function Comparativo({ rotulo, valor, anterior, rotuloAnterior = 'período anterior', inverter = false, delay = 0.08 }) {
  const a = Number(anterior) || 0
  const b = Number(String(valor).replace(/[^\d,-]/g, '').replace(',', '.')) || 0
  const temBase = a !== 0
  const pct = temBase ? ((b - a) / Math.abs(a)) * 100 : null
  const subiu = pct != null && pct >= 0
  // inverter serve pra métricas onde cair é bom (custo, prejuízo)
  const bom = inverter ? !subiu : subiu
  const cor = pct == null ? 'var(--t3)' : bom ? 'var(--profit)' : 'var(--loss)'
  const fundo = pct == null ? 'var(--fill-1)' : bom ? 'var(--profit-dim)' : 'var(--loss-dim)'

  return (
    <BCard pad={22} delay={delay}>
      <Eyebrow>{rotulo}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <NumeroTexto delay={delay + 0.1} style={{ ...TIPO.numero, color: 'var(--t1)' }}>{valor}</NumeroTexto>
        {pct != null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.45, ease: [0.33, 1, 0.68, 1] }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20,
              background: fundo, color: cor, fontSize: 11.5, fontWeight: 800, fontFamily: MONO,
            }}>
            <motion.span
              initial={{ rotate: subiu ? 90 : -90 }} animate={{ rotate: 0 }}
              transition={{ duration: 0.5, delay: delay + 0.5, ease: [0.33, 1, 0.68, 1] }}
              style={{ display: 'inline-flex' }}>
              <Ico d={subiu ? <path d="M7 17L17 7M9 7h8v8" /> : <path d="M7 7l10 10M17 9v8H9" />} s={13} c={cor} />
            </motion.span>
            {Math.abs(pct).toFixed(1).replace('.', ',')}%
          </motion.span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--t4)', margin: '8px 0 0' }}>
        {temBase ? `contra ${money0(a)} no ${rotuloAnterior}` : `sem base de comparação no ${rotuloAnterior}`}
      </p>
    </BCard>
  )
}

// ── ARCO ─────────────────────────────────────────────────────────────────
// Meia-rosca com ponteiro. Irmão do Rosca, pra quando há UMA meta e um
// progresso, não uma divisão entre partes.
export function Arco({ rotulo, pct = 0, centro, nota, cor = RED, delay = 0.1, tamanho = 190 }) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0))
  const r = tamanho / 2 - 14
  const meia = Math.PI * r
  const id = 'ar' + String(rotulo).replace(/\W/g, '')
  return (
    <BCard pad={24} delay={delay}>
      <Eyebrow>{rotulo}</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
        <div style={{ position: 'relative', width: tamanho, height: tamanho / 2 + 10 }}>
          <svg width={tamanho} height={tamanho / 2 + 10} viewBox={`0 0 ${tamanho} ${tamanho / 2 + 10}`}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={RED2} /><stop offset="100%" stopColor={cor} />
              </linearGradient>
            </defs>
            <path d={`M14,${tamanho / 2} A${r},${r} 0 0 1 ${tamanho - 14},${tamanho / 2}`}
              fill="none" stroke="var(--fill-2)" strokeWidth="14" strokeLinecap="round" />
            <motion.path d={`M14,${tamanho / 2} A${r},${r} 0 0 1 ${tamanho - 14},${tamanho / 2}`}
              fill="none" stroke={`url(#${id})`} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={meia}
              initial={{ strokeDashoffset: meia }}
              animate={{ strokeDashoffset: meia * (1 - p / 100) }}
              transition={{ duration: 1.2, delay: delay + 0.15, ease: [0.33, 1, 0.68, 1] }} />
          </svg>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center' }}>
            <NumeroTexto delay={delay + 0.3} style={{ fontFamily: MONO, fontSize: 30, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.035em' }}>{centro}</NumeroTexto>
          </div>
        </div>
        {nota && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '10px 0 0', textAlign: 'center' }}>{nota}</p>}
      </div>
    </BCard>
  )
}

// ── SEQUÊNCIA ────────────────────────────────────────────────────────────
// "7 dias seguidos no lucro": os dias como bolinhas que acendem em cascata.
export function Sequencia({ rotulo, dias = [], nota, delay = 0.12 }) {
  dias = lista(dias)
  const seguidos = (() => { let n = 0; for (let i = dias.length - 1; i >= 0; i--) { if (dias[i]) n++; else break } return n })()
  return (
    <BCard pad={22} delay={delay}>
      <Eyebrow>{rotulo}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0 16px' }}>
        <NumeroTexto delay={delay + 0.1} style={{ ...TIPO.numero, color: 'var(--t1)' }}>{String(seguidos)}</NumeroTexto>
        <span style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 600 }}>dia{seguidos === 1 ? '' : 's'} seguidos</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {dias.map((ok, i) => (
          <motion.span key={i}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.34, delay: delay + 0.2 + i * 0.045, ease: [0.33, 1, 0.68, 1] }}
            style={{
              width: 13, height: 13, borderRadius: '50%',
              background: ok ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--fill-2)',
              boxShadow: ok ? '0 2px 6px rgba(229,57,31,0.28)' : 'none',
            }} />
        ))}
      </div>
      {nota && <p style={{ fontSize: 12, color: 'var(--t4)', margin: '14px 0 0' }}>{nota}</p>}
    </BCard>
  )
}

// ── DESTAQUE ─────────────────────────────────────────────────────────────
// Card grande com blob, uma frase e um número. Serve pra "melhor operador da
// semana", "rede que mais cresceu" — o card que conta uma história.
export function Destaque({ rotulo, titulo, valor, nota, avatar, blob = [RED2, RED], delay = 0.14, onClick }) {
  return (
    <BCard pad="26px 28px" blob={blob} delay={delay} onClick={onClick}>
      <Eyebrow>{rotulo}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
        {avatar && (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.1, ease: [0.33, 1, 0.68, 1] }}
            style={{
              width: 52, height: 52, borderRadius: 18, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${RED2}, ${RED})`, color: '#fff',
              fontFamily: MONO, fontSize: 18, fontWeight: 900,
              boxShadow: '0 8px 22px rgba(229,57,31,0.3)',
            }}>{avatar}</motion.span>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{titulo}</p>
          <NumeroTexto delay={delay + 0.2} style={{ fontFamily: MONO, fontSize: 24, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.03em', display: 'block', marginTop: 4 }}>{valor}</NumeroTexto>
        </div>
      </div>
      {nota && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '14px 0 0' }}>{nota}</p>}
    </BCard>
  )
}

// ── CALENDÁRIO DE CALOR ──────────────────────────────────────────────────
// 30 dias em quadradinhos, tom por resultado. Mostra o mês inteiro num
// espaço onde não caberia um gráfico.
//
// O cartão promete "passe o mouse pra ver" e antes entregava só o `title`
// nativo do navegador: precisa de ~1s parado, reinicia a contagem a cada
// quadrado e some sozinho. Passando o mouse pela grade, parecia que nada
// acontecia. Agora a leitura é imediata e fica presa ao quadrado.
//
// A intensidade é RELATIVA ao melhor dia do período (teto), não a um valor
// fixo — por isso a legenda embaixo diz qual é esse teto. Sem ela, um
// prejuízo pequeno ao lado de um dia excepcional parece insignificante.
export function Calor({ rotulo, dias = [], formata = money0, delay = 0.16 }) {
  dias = lista(dias)
  const vals = dias.map(d => Number(d.v) || 0)
  const teto = Math.max(1, ...vals.map(Math.abs))
  const [alvo, setAlvo] = useState(null)

  // mede o quadrado dentro da grade pra ancorar o balão; na primeira linha
  // ele cai pra baixo, senão sairia por cima do subtítulo
  function mirar(i, el) {
    const grade = el.parentElement
    if (!grade) return
    const meio = el.offsetLeft + el.offsetWidth / 2
    const abaixo = el.offsetTop < el.offsetHeight
    setAlvo({
      i,
      x: Math.max(52, Math.min(meio, grade.offsetWidth - 52)),
      y: abaixo ? el.offsetTop + el.offsetHeight + 8 : el.offsetTop - 8,
      abaixo,
    })
  }

  const atual = alvo ? dias[alvo.i] : null
  const vAtual = atual ? Number(atual.v) || 0 : 0

  return (
    <BCard pad={24} delay={delay}>
      <p style={{ ...TIPO.secao, color: 'var(--t1)', margin: '0 0 3px' }}>{rotulo}</p>
      <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px' }}>cada quadrado é um dia · passe o mouse pra ver</p>
      {dias.length === 0
        ? <Vazio titulo="Sem movimento no período" icone={<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>} />
        : (
          <>
            <div
              onMouseLeave={() => setAlvo(null)}
              style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(26px, 1fr))', gap: 6 }}>
              {dias.map((d, i) => {
                const v = Number(d.v) || 0
                const f = Math.min(1, Math.abs(v) / teto)
                const cor = v === 0 ? 'var(--fill-2)'
                  : v > 0 ? `rgba(63,155,30,${0.18 + f * 0.7})`
                    : `rgba(220,38,38,${0.18 + f * 0.7})`
                const aceso = alvo?.i === i
                return (
                  <motion.span key={d.d || i}
                    aria-label={`${d.d || ''}: ${formata(v)}`}
                    onMouseEnter={e => mirar(i, e.currentTarget)}
                    // no celular não existe passar o mouse: o toque faz o mesmo
                    onClick={e => mirar(i, e.currentTarget)}
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: delay + i * 0.012 }}
                    whileHover={{ scale: 1.18 }}
                    style={{
                      aspectRatio: '1', borderRadius: 7, background: cor, cursor: 'pointer',
                      boxShadow: aceso ? '0 0 0 2px var(--surface), 0 0 0 3.5px var(--t1)' : 'none',
                      zIndex: aceso ? 1 : 0,
                    }} />
                )
              })}

              {/* o balão fica DENTRO da grade pra acompanhar o quadrado */}
              <AnimatePresence>
                {atual && (
                  // dois níveis de propósito: o de fora ancora (o Framer
                  // controla `transform` e apagaria o translate do -50%),
                  // o de dentro anima.
                  <div key="balao" style={{
                    position: 'absolute', left: alvo.x, top: alvo.y,
                    transform: alvo.abaixo ? 'translateX(-50%)' : 'translate(-50%, -100%)',
                    pointerEvents: 'none', zIndex: 3,
                  }}>
                  <motion.div
                    initial={{ opacity: 0, y: alvo.abaixo ? -4 : 4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.16, ease: [0.33, 1, 0.68, 1] }}
                    style={{
                      background: '#15151a', color: '#ffffff',
                      borderRadius: 11, padding: '8px 12px', whiteSpace: 'nowrap',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.26)',
                    }}>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#a0a0ac', fontFamily: MONO }}>
                      {atual.d}
                    </span>
                    <span style={{
                      display: 'block', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2,
                      color: vAtual === 0 ? 'rgba(255,255,255,0.72)' : vAtual > 0 ? '#8fe06a' : '#ff8a7a',
                    }}>
                      {vAtual === 0 ? 'sem fechamento' : formata(vAtual)}
                    </span>
                  </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* sem isto o tom não quer dizer nada: o verde cheio é o melhor
                dia DESTE período, não um valor fixo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--t4)' }}>menos</span>
              {[0.18, 0.36, 0.54, 0.72, 0.88].map(o => (
                <span key={o} style={{ width: 11, height: 11, borderRadius: 3, background: `rgba(63,155,30,${o})` }} />
              ))}
              <span style={{ fontSize: 11, color: 'var(--t4)' }}>mais · cheio = {formata(teto)}</span>
            </div>
          </>
        )}
    </BCard>
  )
}

// ── PÓDIO ────────────────────────────────────────────────────────────────
// Top 3 em pódio, altura proporcional ao resultado. Só faz sentido com 2 ou
// mais: com um só não existe disputa, e a lista já diz quem é.
export function Podio({ rotulo, itens = [], formata = money0, delay = 0.14, aoAbrir }) {
  itens = lista(itens)
  const top = itens.slice(0, 3)
  const teto = Math.max(1, ...top.map(t => Math.abs(Number(t.v) || 0)))
  // 2º, 1º, 3º — a ordem visual de um pódio de verdade
  const ordem = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0]
  const alturas = [96, 72, 56]

  return (
    <BCard pad={24} delay={delay}>
      <p style={{ ...TIPO.secao, color: 'var(--t1)', margin: '0 0 3px' }}>{rotulo}</p>
      <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 22px' }}>os três que mais trouxeram no período</p>
      {top.length < 2 ? (
        <Vazio titulo="Ainda não há disputa" texto="Com dois ou mais operadores fechando metas, o pódio aparece aqui."
          icone={<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M6 4h12v7a6 6 0 0 1-12 0z" /><path d="M12 17v4M8 21h8" /></>} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
          {ordem.map((idx, pos) => {
            const t = top[idx]
            if (!t) return null
            const lugar = idx + 1
            const h = alturas[idx] * (0.55 + 0.45 * (Math.abs(Number(t.v) || 0) / teto))
            const primeiro = lugar === 1
            return (
              <div key={t.l || pos} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, maxWidth: 120 }}>
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: delay + pos * 0.1, ease: [0.33, 1, 0.68, 1] }}
                  style={{
                    width: primeiro ? 46 : 38, height: primeiro ? 46 : 38, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontFamily: MONO, fontSize: primeiro ? 15 : 13, fontWeight: 900, color: '#fff',
                    background: primeiro ? `linear-gradient(135deg, ${RED2}, ${RED})` : 'var(--t4)',
                    boxShadow: primeiro ? '0 8px 22px rgba(229,57,31,0.3)' : 'none',
                  }}>
                  {String(t.l || '?').slice(0, 2).toUpperCase()}
                </motion.span>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', margin: 0, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{t.l}</p>
                <NumeroTexto delay={delay + 0.3} style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 800, color: Number(t.v) >= 0 ? 'var(--profit)' : 'var(--loss)' }}>{formata(t.v)}</NumeroTexto>
                <motion.div
                  onClick={aoAbrir ? () => aoAbrir(t) : undefined}
                  initial={{ height: 0 }} animate={{ height: h }}
                  transition={{ duration: 0.7, delay: delay + 0.15 + pos * 0.1, ease: [0.33, 1, 0.68, 1] }}
                  style={{
                    width: '100%', borderRadius: '14px 14px 0 0', cursor: aoAbrir ? 'pointer' : 'default',
                    background: primeiro ? `linear-gradient(180deg, ${RED2}, ${RED})` : 'var(--fill-2)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8,
                  }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 900, color: primeiro ? '#fff' : 'var(--t3)' }}>{lugar}º</span>
                </motion.div>
              </div>
            )
          })}
        </div>
      )}
    </BCard>
  )
}

// ── TERMÔMETRO DE RISCO ──────────────────────────────────────────────────
// Card que só aparece quando há algo a olhar. A borda pulsa devagar: chama
// atenção sem gritar, que é o certo pra um alerta que fica na tela.
export function Risco({ rotulo = 'Precisa de atenção', itens = [], delay = 0.18 }) {
  itens = lista(itens)
  const semMovimento = useReducedMotion()
  if (!itens.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay }}
      style={{ position: 'relative', borderRadius: 24, overflow: 'hidden' }}>
      <motion.div
        animate={semMovimento ? {} : { opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, borderRadius: 24, border: '1.5px solid var(--loss)', pointerEvents: 'none', zIndex: 2 }}
      />
      <div style={{ background: 'var(--loss-dim)', border: '1px solid var(--loss-border)', borderRadius: 24, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ width: 30, height: 30, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--loss)', color: '#fff' }}>
            <Ico d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>} s={15} c="#fff" />
          </span>
          <p style={{ ...TIPO.secao, color: 'var(--loss)', margin: 0 }}>{rotulo}</p>
        </div>
        {itens.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: i ? 10 : 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: 'var(--loss)' }} />
            <span style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.5 }}>{typeof it === 'string' ? it : it.texto}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── BUSCA DE LISTA ───────────────────────────────────────────────────────
// Campo de busca enxuto pra usar no `acao` da Lista. Não filtra sozinho:
// devolve o termo e quem tem os dados decide o que fazer.
export function BuscaLista({ valor, aoMudar, placeholder = 'Buscar…', largura = 190 }) {
  const [foco, setFoco] = useState(false)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, width: largura, maxWidth: '100%',
      padding: '7px 12px', borderRadius: 30,
      background: 'var(--surface)',
      border: `1px solid ${foco ? 'var(--brand)' : 'var(--b1)'}`,
      boxShadow: foco ? '0 0 0 3px rgba(229,57,31,0.12)' : 'none',
      transition: 'border-color .16s ease, box-shadow .16s ease',
    }}>
      <Ico d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} s={13} c="var(--t3)" />
      <input
        className="nx-campo-ctl" value={valor} onChange={e => aoMudar(e.target.value)}
        onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 12.5, color: 'var(--t1)' }}
      />
      {valor && (
        <button type="button" onClick={() => aoMudar('')} aria-label="Limpar busca"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--t4)', padding: 0, display: 'inline-flex' }}>
          <Ico d={<path d="M18 6L6 18M6 6l12 12" />} s={12} c="var(--t4)" />
        </button>
      )}
    </span>
  )
}

/** Realça o trecho encontrado, sem depender de dangerouslySetInnerHTML. */
export function Realce({ texto, termo }) {
  const t = String(texto ?? '')
  const b = String(termo ?? '').trim()
  if (!b) return <>{t}</>
  const limpa = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const i = limpa(t).indexOf(limpa(b))
  if (i < 0) return <>{t}</>
  return (
    <>
      {t.slice(0, i)}
      <mark style={{ background: 'var(--brand-dim)', color: 'var(--brand)', borderRadius: 4, padding: '0 2px' }}>{t.slice(i, i + b.length)}</mark>
      {t.slice(i + b.length)}
    </>
  )
}

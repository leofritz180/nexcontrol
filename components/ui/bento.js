'use client'
// ─────────────────────────────────────────────────────────────────────────
// KIT BENTO — blocos de página reutilizados por TODOS os módulos do V2.
// Garante que /custos, /faturamento, /operadores, /redes, /operator e
// /performance tenham exatamente a mesma linguagem: superfície branca,
// cantos 24px, blob orgânico, sombra suave, entrada animada e hover com mola.
// Puramente visual — nenhum bloco aqui busca ou grava dados.
// ─────────────────────────────────────────────────────────────────────────
import { motion, animate, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export const RED = '#e5391f', RED2 = '#ff7a4d', LIME = '#c4f042'
export const MONO = 'var(--mono, "JetBrains Mono", monospace)'
export const money = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money0 = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
export const int = v => Number(v || 0).toLocaleString('pt-BR')

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

export function AcaoBtn({ children, onClick, icon }) {
  return (
    <motion.button type="button" onClick={onClick}
      whileHover={{ y: -2, boxShadow: '0 14px 32px rgba(229,57,31,0.36)' }} whileTap={{ scale: 0.97 }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 30, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800, color: '#fff', background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 10px 26px rgba(229,57,31,0.3)' }}>
      {icon && <Ico d={icon} s={16} />}{children}
    </motion.button>
  )
}

// herói: número grande com blob
export function Hero({ rotulo, valor, cor, nota, extras = [], blob, delay = 0.04 }) {
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
export function Barras({ titulo, dados, delay = 0.16 }) {
  const max = Math.max(1, ...dados.map(d => d.v))
  return (
    <BCard pad={24} delay={delay}>
      <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: '0 0 18px', letterSpacing: '-0.02em' }}>{titulo}</p>
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
            <div style={{ height: 18, borderRadius: 9, background: 'var(--fill-1)', overflow: 'hidden' }}>
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
export function Lista({ titulo, linhas, vazio = 'Nada por aqui ainda.', delay = 0.22, acao }) {
  return (
    <BCard pad={24} delay={delay}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{titulo}</p>
        {acao}
      </div>
      {linhas.length === 0 && <Vazio titulo={vazio} icone={<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></>} />}
      {linhas.map((r, i) => (
        <motion.div key={r.k || i} whileHover={r.onClick ? { x: 3 } : undefined} onClick={r.onClick}
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
export const FATIAS = ['#e5391f', '#ff7a4d', '#c4f042', '#ffb08a', '#b6b6c0']

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

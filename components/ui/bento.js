'use client'
// ─────────────────────────────────────────────────────────────────────────
// KIT BENTO — blocos de página reutilizados por TODOS os módulos do V2.
// Garante que /custos, /faturamento, /operadores, /redes, /operator e
// /performance tenham exatamente a mesma linguagem: superfície branca,
// cantos 24px, blob orgânico, sombra suave, entrada animada e hover com mola.
// Puramente visual — nenhum bloco aqui busca ou grava dados.
// ─────────────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'

export const RED = '#e5391f', RED2 = '#ff7a4d', LIME = '#c4f042'
export const MONO = 'var(--mono, "JetBrains Mono", monospace)'
export const money = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money0 = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
export const int = v => Number(v || 0).toLocaleString('pt-BR')

export const surf = {
  position: 'relative', overflow: 'hidden', background: 'var(--surface)',
  borderRadius: 24, border: '1px solid var(--b1)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 26px rgba(0,0,0,0.05)',
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
      whileHover={{ y: -5, boxShadow: '0 6px 14px rgba(0,0,0,0.06), 0 20px 46px rgba(0,0,0,0.11)' }}
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
    <BCard pad="28px 30px" blob={blob} delay={delay}>
      <Eyebrow>{rotulo}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 22, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontFamily: MONO, fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: cor || 'var(--t1)' }}>{valor}</span>
          {nota && <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '12px 0 0' }}>{nota}</p>}
        </div>
        {extras.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {extras.map(e => (
              <div key={e.l} style={{ padding: '12px 16px', borderRadius: 16, background: 'var(--fill-1)', border: '1px solid var(--b1)', minWidth: 118 }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>{e.l}</p>
                <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: e.c || 'var(--t1)', margin: 0 }}>{e.v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </BCard>
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
          <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 900, color: c.c || 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{c.v}</p>
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
      {dados.length === 0 && <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>Sem dados no período.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {dados.map((d, i) => (
          <div key={d.l}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--t2)' }}>
                {d.dot && <span style={{ width: 9, height: 9, borderRadius: 3, background: d.dot }} />}{d.l}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 800, color: d.c || 'var(--t1)' }}>{d.txt}</span>
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
      {linhas.length === 0 && <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>{vazio}</p>}
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
          <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 13.5, fontWeight: 800, color: r.vc || 'var(--t1)' }}>{r.v}</span>
        </motion.div>
      ))}
    </BCard>
  )
}

export const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }
export const grid2 = { display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14 }

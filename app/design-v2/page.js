'use client'
// ─────────────────────────────────────────────────────────────────────────
// PRÉVIA DO REDESIGN — dashboard no estilo "bento arredondado" (referência
// enviada pelo dono: light mode, cards brancos, blobs orgânicos, rail preto,
// pills). Construída com TEMA DUPLO: claro e escuro, mesmo layout.
// O laranja/lima da referência foi mapeado no vermelho/mint da Nex.
//
// ISOLADA: dados fictícios, zero leitura/escrita no banco, fora do AppLayout.
// ─────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion } from 'framer-motion'

// ── TEMAS ────────────────────────────────────────────────────────────────
const TH = {
  claro: {
    bg: '#f0f0f3', card: '#ffffff', cardSoft: '#fafafa',
    t1: '#15151a', t2: '#6c6c78', t3: '#9b9ba6',
    line: 'rgba(0,0,0,0.07)', lineSoft: 'rgba(0,0,0,0.05)',
    shadow: '0 1px 2px rgba(0,0,0,0.04), 0 10px 28px rgba(0,0,0,0.05)',
    rail: '#131317', railIcon: 'rgba(255,255,255,0.45)', railOn: '#ffffff',
    mintFill: '#d9f7b8', mintInk: '#22331a', mintBar: '#ffffff', mintBarFill: '#8fd14f',
    peachFill: '#fde8de', peachInk: '#3a2218',
    chipBg: '#15151a', chipInk: '#ffffff',
    grid: 'rgba(0,0,0,0.05)',
  },
  escuro: {
    bg: '#08080a', card: '#141418', cardSoft: '#101013',
    t1: '#f4f4f6', t2: 'rgba(255,255,255,0.58)', t3: 'rgba(255,255,255,0.36)',
    line: 'rgba(255,255,255,0.08)', lineSoft: 'rgba(255,255,255,0.055)',
    shadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 18px 44px rgba(0,0,0,0.55)',
    rail: '#000000', railIcon: 'rgba(255,255,255,0.4)', railOn: '#ffffff',
    mintFill: '#12301f', mintInk: '#c8f5d8', mintBar: 'rgba(255,255,255,0.1)', mintBarFill: '#4ade80',
    peachFill: '#241110', peachInk: '#ffd9d2',
    chipBg: '#ffffff', chipInk: '#15151a',
    grid: 'rgba(255,255,255,0.05)',
  },
}
const RED = '#e5391f', RED2 = '#ff7a4d', REDINK = '#ffffff'
const MONO = 'var(--mono, "JetBrains Mono", monospace)'

const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brl0 = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })

// ── blob orgânico do canto do card ──
function Blob({ from, to, flip }) {
  return (
    <svg viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden
      style={{ position: 'absolute', top: 0, right: 0, width: '58%', height: '100%', pointerEvents: 'none', transform: flip ? 'scaleY(-1)' : 'none' }}>
      <defs><linearGradient id={`bl${from.replace(/\W/g, '')}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={from} /><stop offset="100%" stopColor={to} /></linearGradient></defs>
      <path d="M40,0 C90,18 70,58 110,78 C150,98 180,80 200,64 L200,0 Z" fill={`url(#bl${from.replace(/\W/g, '')})`} opacity="0.95" />
      <path d="M78,0 C118,22 100,54 142,72 C172,85 190,78 200,70 L200,0 Z" fill={from} opacity="0.5" />
    </svg>
  )
}

// ── curva suave (Catmull-Rom → bézier) ──
function curva(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d
}

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const SERIE_A = [820, 1340, 980, 1720, 1240, 640, 410]   // lucro
const SERIE_B = [300, 560, 1180, 700, 1560, 980, 720]    // depósitos

function Grafico({ t }) {
  const W = 680, H = 210
  const max = Math.max(...SERIE_A, ...SERIE_B) * 1.18
  const px = i => (i * W) / (DIAS.length - 1)
  const py = v => H - (v / max) * H
  const ptsA = SERIE_A.map((v, i) => [px(i), py(v)])
  const ptsB = SERIE_B.map((v, i) => [px(i), py(v)])
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H + 8}`} style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>
        <path d={curva(ptsB)} fill="none" stroke={t.mintBarFill} strokeWidth="4" strokeLinecap="round" opacity="0.95" />
        <path d={curva(ptsA)} fill="none" stroke={RED} strokeWidth="4" strokeLinecap="round" />
      </svg>
      {/* chips de valor flutuando, como na referência */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {SERIE_A.map((v, i) => (
          <span key={i} style={{
            position: 'absolute', left: `${(i / (DIAS.length - 1)) * 100}%`, top: `${(py(v) / (H + 8)) * 100}%`,
            transform: 'translate(-50%,-150%)', background: t.chipBg, color: t.chipInk,
            fontFamily: MONO, fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          }}>{brl0(v)}</span>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 14 }}>
        {DIAS.map(d => <span key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11.5, color: t.t3, fontWeight: 600 }}>{d}</span>)}
      </div>
    </div>
  )
}

// ── primitivas ──
function Card({ t, children, style, pad = 22, blob, blobTo, flip }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: t.card, borderRadius: 24, border: `1px solid ${t.line}`, boxShadow: t.shadow, padding: pad, ...style }}>
      {blob && <Blob from={blob} to={blobTo || blob} flip={flip} />}
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}
function Chip({ t, bg, children }) {
  return <span style={{ width: 40, height: 40, borderRadius: 13, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</span>
}
const Ico = ({ d, c = '#fff', s = 19 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>

function Rail({ t, tema }) {
  const icons = [
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" key="h" />,
    <><path d="M3 7h6l2 2h10v10H3z" /></>,
    <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></>,
    <><path d="M4 20V10M10 20V4M16 20v-7M22 20v-4" /></>,
    <><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /></>,
    <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
    <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V7a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  ]
  return (
    <div style={{ position: 'sticky', top: 18, width: 64, flexShrink: 0, background: t.rail, borderRadius: 30, padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, alignSelf: 'flex-start', boxShadow: '0 18px 40px rgba(0,0,0,0.25)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <img src="/icons/nexcontrol-icon-clean.png" alt="" width={18} height={18} style={{ width: 18, height: 18, objectFit: 'contain' }} />
      </div>
      {icons.map((d, i) => (
        <div key={i} style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer' }}>
          <Ico d={d} c={i === 0 ? t.railOn : t.railIcon} s={19} />
        </div>
      ))}
      <div style={{ flex: 1, minHeight: 20 }} />
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#15151a' }}>C</div>
    </div>
  )
}

export default function DesignV2() {
  const [tema, setTema] = useState('claro')
  const t = TH[tema]

  const pillBase = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 30, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }

  return (
    <main style={{ minHeight: '100vh', background: t.bg, transition: 'background 0.35s ease', padding: '18px', fontFeatureSettings: '"cv02","cv03"' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <Rail t={t} tema={tema} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ── TOPO ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: t.t1, margin: 0, letterSpacing: '-0.03em' }}>Olá, Carlos</h1>
              <p style={{ fontSize: 13.5, color: t.t3, margin: '3px 0 0' }}>Sua operação está rodando bem hoje.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4, background: t.card, borderRadius: 30, padding: 4, border: `1px solid ${t.line}` }}>
                {['Visão geral', 'Metas', 'Equipe'].map((n, i) => (
                  <span key={n} style={{ ...pillBase, background: i === 0 ? t.chipBg : 'transparent', color: i === 0 ? t.chipInk : t.t2, cursor: 'pointer' }}>{n}</span>
                ))}
              </div>
              <span style={{ ...pillBase, background: t.card, border: `1px solid ${t.line}`, color: t.t3 }}>
                <Ico d={<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>} c={t.t3} s={15} /> Buscar
              </span>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: t.card, border: `1px solid ${t.line}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Ico d={<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>} c={t.t2} s={17} />
                <span style={{ position: 'absolute', top: 8, right: 10, width: 7, height: 7, borderRadius: '50%', background: RED, border: `2px solid ${t.card}` }} />
              </span>
              {/* alternador de tema */}
              <div style={{ display: 'flex', gap: 3, background: t.card, borderRadius: 30, padding: 4, border: `1px solid ${t.line}` }}>
                {['claro', 'escuro'].map(m => (
                  <button key={m} type="button" onClick={() => setTema(m)} style={{ ...pillBase, padding: '8px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: tema === m ? RED : 'transparent', color: tema === m ? '#fff' : t.t2, textTransform: 'capitalize' }}>{m}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── LINHA 1: 4 cards ── */}
          <div className="bento-r1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <Card t={t} blob={t.mintFill} blobTo={t.mintBarFill} style={{ minHeight: 146 }}>
                <Chip t={t} bg={t.mintFill}><Ico d={<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>} c={t.mintBarFill} /></Chip>
                <p style={{ fontSize: 30, fontWeight: 900, color: t.t1, margin: '18px 0 0', letterSpacing: '-0.035em', fontFamily: MONO }}>R$ 128.940</p>
                <p style={{ fontSize: 12.5, color: t.t3, margin: '4px 0 0' }}>lucro final acumulado</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
              <Card t={t} blob={RED2} blobTo={RED} style={{ minHeight: 146 }}>
                <Chip t={t} bg={RED}><Ico d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>} c="#fff" /></Chip>
                <p style={{ fontSize: 30, fontWeight: 900, color: t.t1, margin: '18px 0 0', letterSpacing: '-0.035em', fontFamily: MONO }}>20</p>
                <p style={{ fontSize: 12.5, color: t.t3, margin: '4px 0 0' }}>metas fechadas no mês</p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
              <div style={{ minHeight: 146, height: '100%', borderRadius: 24, border: `2px dashed ${t.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.t2, margin: 0 }}>Nova meta</p>
                <span style={{ width: 38, height: 38, borderRadius: '50%', background: t.mintBarFill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico d={<path d="M12 5v14M5 12h14" />} c={tema === 'claro' ? '#fff' : '#08120c'} s={18} />
                </span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
              <div style={{ position: 'relative', overflow: 'hidden', minHeight: 146, height: '100%', borderRadius: 24, padding: 22, background: `linear-gradient(135deg, ${RED2}, ${RED})`, boxShadow: '0 14px 34px rgba(229,57,31,0.32)' }}>
                <svg viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.28 }}>
                  <path d="M0,96 C46,60 84,124 132,88 C164,64 182,74 200,66 L200,140 L0,140 Z" fill="#fff" opacity="0.35" />
                  <path d="M0,116 C52,86 92,138 140,110 C170,92 186,98 200,92 L200,140 L0,140 Z" fill="#fff" opacity="0.4" />
                </svg>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 800, color: REDINK, margin: 0, letterSpacing: '-0.02em' }}>Meta do dia</p>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', margin: '3px 0 0' }}>R$ 3.420 de R$ 5.000</p>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 900, color: REDINK }}>68%</span>
                  </div>
                  <div style={{ marginTop: 22, height: 8, borderRadius: 5, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }} style={{ height: '100%', borderRadius: 5, background: '#fff' }} />
                  </div>
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', margin: '10px 0 0' }}>faltam R$ 1.580 · sequência de 4 dias</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── LINHA 2: gráfico + estatística ── */}
          <div className="bento-r2" style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14, marginBottom: 14 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.22 }}>
              <Card t={t} pad={24}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 16.5, fontWeight: 800, color: t.t1, margin: 0, letterSpacing: '-0.02em' }}>Resultado da semana</p>
                    <p style={{ fontSize: 12.5, color: t.t3, margin: '3px 0 0' }}>lucro e depósitos por dia</p>
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    {[['Lucro', RED], ['Depósitos', t.mintBarFill]].map(([l, c]) => (
                      <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.t2, fontWeight: 600 }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ paddingTop: 26 }}><Grafico t={t} /></div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.28 }}>
              <div style={{ height: '100%', borderRadius: 24, padding: 24, background: t.mintFill, border: `1px solid ${t.line}`, boxShadow: t.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 12, background: tema === 'claro' ? '#15151a' : '#0a1b11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico d={<path d="M3 17l6-6 4 4 8-8" />} c={t.mintBarFill} s={17} />
                  </span>
                  <p style={{ fontSize: 15.5, fontWeight: 800, color: t.mintInk, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>Metas fechadas<br />por mês</p>
                </div>
                {[['Julho', 62], ['Agosto', 84], ['Setembro', 41]].map(([m, p]) => (
                  <div key={m} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: t.mintInk, margin: '0 0 6px', opacity: 0.85 }}>{m}</p>
                    <div style={{ height: 22, borderRadius: 11, background: t.mintBar, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
                        style={{ height: '100%', borderRadius: 11, background: t.mintBarFill }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.mintInk, opacity: 0.85 }}>Ver histórico</span>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', background: tema === 'claro' ? '#15151a' : '#0a1b11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico d={<path d="M5 12h14M13 6l6 6-6 6" />} c={t.mintBarFill} s={15} />
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── LINHA 3: tabela + equipe ── */}
          <div className="bento-r2" style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: 14 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.34 }}>
              <Card t={t} pad={24}>
                <p style={{ fontSize: 16.5, fontWeight: 800, color: t.t1, margin: '0 0 18px', letterSpacing: '-0.02em' }}>Remessas recentes</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 8, paddingBottom: 10, borderBottom: `1px solid ${t.lineSoft}` }}>
                  {['Operador', 'Rede', 'Contas', 'Resultado'].map(h => <span key={h} style={{ fontSize: 11.5, color: t.t3, fontWeight: 600 }}>{h}</span>)}
                </div>
                {[
                  { n: 'Carlos', r: 'WE', c: 48, v: 3120, cor: t.mintBarFill },
                  { n: 'Ana', r: 'OKOK', c: 31, v: 2980, cor: RED },
                  { n: 'Pedro', r: 'W1', c: 26, v: 840, cor: '#a78bfa' },
                  { n: 'Lucas', r: 'VOY', c: 12, v: -340, cor: t.t3 },
                ].map((x, i, a) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 8, alignItems: 'center', padding: '13px 0', borderBottom: i < a.length - 1 ? `1px solid ${t.lineSoft}` : 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 9, background: x.cor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{x.n[0]}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: t.t1 }}>{x.n}</span>
                    </span>
                    <span style={{ fontSize: 13, color: t.t2, fontFamily: MONO }}>{x.r}</span>
                    <span style={{ fontSize: 13, color: t.t2, fontFamily: MONO }}>{x.c}</span>
                    <span style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 800, color: x.v >= 0 ? (tema === 'claro' ? '#16a34a' : '#4ade80') : '#ef4444' }}>{x.v >= 0 ? '+' : ''}{brl(x.v)}</span>
                  </div>
                ))}
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 }}>
              <div style={{ position: 'relative', overflow: 'hidden', height: '100%', borderRadius: 24, padding: 24, background: t.peachFill, border: `1px solid ${t.line}`, boxShadow: t.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 12, background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /></>} c="#fff" s={17} />
                  </span>
                  <p style={{ fontSize: 15.5, fontWeight: 800, color: t.peachInk, margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>Equipe<br />agora</p>
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, color: t.peachInk, margin: 0, fontFamily: MONO, letterSpacing: '-0.035em' }}>12</p>
                <p style={{ fontSize: 12.5, color: t.peachInk, opacity: 0.6, margin: '3px 0 18px' }}>de 14 operadores online</p>
                <div style={{ display: 'flex' }}>
                  {['C', 'P', 'A', 'L', 'M', 'J'].map((l, i) => (
                    <span key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: i % 2 ? RED : '#15151a', border: `2.5px solid ${t.peachFill}`, marginLeft: i ? -11 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, color: '#fff' }}>{l}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── trocador flutuante ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: t.chipBg, borderRadius: 30, padding: '7px 9px', boxShadow: '0 12px 30px rgba(0,0,0,0.22)' }}>
              <span style={{ fontSize: 12, color: tema === 'claro' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)', padding: '0 6px', fontWeight: 600 }}>Painel:</span>
              {['Operação', 'Financeiro'].map((n, i) => (
                <span key={n} style={{ ...pillBase, padding: '7px 16px', fontSize: 12.5, background: i === 0 ? (tema === 'claro' ? '#fff' : '#15151a') : 'transparent', color: i === 0 ? (tema === 'claro' ? '#15151a' : '#fff') : (tema === 'claro' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)'), cursor: 'pointer' }}>{n}</span>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: t.t3, marginTop: 22 }}>
            Prévia isolada · dados fictícios · nada aqui lê ou grava no banco
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .bento-r1 { grid-template-columns: 1fr 1fr !important; }
          .bento-r2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .bento-r1 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}

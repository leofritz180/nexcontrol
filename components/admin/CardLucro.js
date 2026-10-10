'use client'
// ─────────────────────────────────────────────────────────────────────────
// CARD DO LUCRO — o número da operação como peça de vitrine (10/10/2026).
//
// Pedido do dono, a partir de um reels de outro painel: o valor em destaque,
// grande, "3D", instagramável. Aqui ele é o LUCRO do período (decisão do
// dono: lucro no card principal, maior), e não faturamento/volume.
//
// O QUE ELE FAZ
//   · número metálico em relevo (degradê no texto + sombra em camadas),
//     com o "R$" pequeno em cima e os centavos menores, como no estrato
//   · odômetro: cada dígito ROLA até o valor ao abrir e ao trocar período
//   · inclina com o mouse (3D) e a luz desliza junto; no toque fica parado
//   · selo do período com as datas ("01/10 → 10/10 · 10 DIAS")
//   · olho: esconde o valor (R$ ••••) — lembrado neste aparelho
//   · apoio embaixo: média por dia, metas fechadas, depositantes
//
// DE ONDE VEM CADA NÚMERO
//   O valor grande é o MESMO `lucroPeriodo` que o painel já mostrava (o
//   heroLucro de app/admin/page.js) — não muda o que ele significa. As
//   metas fechadas e depositantes usam o MESMO filtro do heroLucro (metas
//   fechadas pela data de CRIAÇÃO, dia operacional), pra que o apoio bata
//   com o número grande.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { opDayISO } from '../../lib/opday'

const PERIODOS = [['month', 'Mês'], ['today', 'Hoje'], ['yesterday', 'Ontem'], ['7d', '7d'], ['30d', '30d'], ['all', 'Tudo']]
const ROTULO = { month: 'do mês', today: 'de hoje', yesterday: 'de ontem', '7d': 'dos últimos 7 dias', '30d': 'dos últimos 30 dias', all: 'desde o início' }
const DIA = 86400000
const int = v => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const dm = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

/** o mesmo recorte do heroLucro (app/admin/page.js), pra o apoio bater com o número */
function recorte(metas, periodo, agora = new Date()) {
  const fechadas = metas.filter(m => !m.deleted_at && m.status_fechamento === 'fechada' && m.created_at)
  let ini = null, dias = 1, lista = fechadas
  if (periodo === 'today') { const t = opDayISO(agora); lista = fechadas.filter(m => opDayISO(m.created_at) === t); ini = agora }
  else if (periodo === 'yesterday') { const y = opDayISO(new Date(agora.getTime() - DIA)); lista = fechadas.filter(m => opDayISO(m.created_at) === y); ini = new Date(agora.getTime() - DIA) }
  else if (periodo === '7d' || periodo === '30d') { const n = periodo === '7d' ? 7 : 30; const d = new Date(agora); d.setDate(d.getDate() - n); lista = fechadas.filter(m => new Date(m.created_at) >= d); ini = d; dias = n }
  else if (periodo === 'month') { const d = new Date(agora.getFullYear(), agora.getMonth(), 1); lista = fechadas.filter(m => new Date(m.created_at) >= d); ini = d; dias = agora.getDate() }
  else {
    const mais = fechadas.reduce((a, m) => Math.min(a, new Date(m.created_at).getTime()), Infinity)
    ini = Number.isFinite(mais) ? new Date(mais) : agora
    dias = Math.max(1, Math.ceil((agora.getTime() - ini.getTime()) / DIA))
  }
  const fim = periodo === 'yesterday' ? ini : agora
  const depositantes = lista.reduce((a, m) => a + Number(m.quantidade_contas || 0), 0)
  return { metas: lista.length, depositantes, dias, faixa: periodo === 'today' || periodo === 'yesterday' ? dm(ini) : `${dm(ini)} → ${dm(fim)}` }
}

/* um dígito do odômetro: a coluna 0–9 desliza até o número */
function Digito({ d, i, parado }) {
  return (
    <span className="cl-dig" aria-hidden>
      <motion.span className="cl-col"
        initial={parado ? false : { y: '0em' }}
        animate={{ y: `${-d}em` }}
        transition={parado ? { duration: 0 } : { type: 'spring', stiffness: 70, damping: 16, mass: 1, delay: 0.08 + i * 0.06 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <span key={n}>{n}</span>)}
      </motion.span>
    </span>
  )
}

/* o número inteiro: dígitos rolam, pontos/sinais ficam parados */
function Odometro({ texto, chave, parado }) {
  let k = 0
  return (
    <span key={chave} className="cl-odo">
      {[...texto].map((c, idx) => /\d/.test(c)
        ? <Digito key={idx} d={Number(c)} i={k++} parado={parado} />
        : <span key={idx} className="cl-sep">{c}</span>)}
    </span>
  )
}

export default function CardLucro({ valor, periodo, onPeriodo, metas = [], curva }) {
  const parado = useReducedMotion()
  const [oculto, setOculto] = useState(false)
  const card = useRef(null)
  useEffect(() => { try { setOculto(localStorage.getItem('nx_lucro_oculto') === '1') } catch {} }, [])
  const alternar = () => setOculto(v => { const n = !v; try { localStorage.setItem('nx_lucro_oculto', n ? '1' : '0') } catch {}; return n })

  /* inclinação 3D com o mouse (mola), e a posição da luz */
  const mx = useMotionValue(0.5), my = useMotionValue(0.5)
  const sx = useSpring(mx, { stiffness: 140, damping: 18 }), sy = useSpring(my, { stiffness: 140, damping: 18 })
  const rotY = useTransform(sx, [0, 1], [-7, 7]), rotX = useTransform(sy, [0, 1], [6, -6])
  const luzX = useTransform(sx, v => `${v * 100}%`), luzY = useTransform(sy, v => `${v * 100}%`)
  const mover = e => {
    if (parado || e.pointerType === 'touch') return
    const r = card.current?.getBoundingClientRect(); if (!r) return
    mx.set((e.clientX - r.left) / r.width); my.set((e.clientY - r.top) / r.height)
  }
  const sair = () => { mx.set(0.5); my.set(0.5) }

  const v = Number(valor || 0)
  const neg = v < 0
  const [inteiro, cent] = Math.abs(v).toFixed(2).split('.')
  const inteiroBR = Number(inteiro).toLocaleString('pt-BR')
  const info = useMemo(() => recorte(metas, periodo), [metas, periodo])
  const media = v / Math.max(1, info.dias)
  const nDias = info.dias

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="cl-palco" onPointerMove={mover} onPointerLeave={sair}>
      <style>{CSS}</style>
      <motion.div ref={card} className="cl-card" style={parado ? undefined : { rotateX: rotX, rotateY: rotY }}>
        {/* luz que segue o mouse (fundo liso, como os outros cards — a grade e o tom verde sairam a pedido do dono, 10/10) */}
        <motion.div className="cl-luz" style={{ '--lx': luzX, '--ly': luzY }} aria-hidden />
        {curva?.d && (
          <svg className="cl-curva" viewBox={`0 0 ${curva.L} ${curva.A}`} preserveAspectRatio="none" aria-hidden>
            <defs><linearGradient id="clFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--profit)" stopOpacity="0.16" /><stop offset="100%" stopColor="var(--profit)" stopOpacity="0" /></linearGradient></defs>
            <path d={`${curva.d} L${curva.L},${curva.A} L0,${curva.A} Z`} fill="url(#clFill)" />
            <motion.path d={curva.d} fill="none" stroke="var(--profit)" strokeOpacity="0.45" strokeWidth="2" vectorEffect="non-scaling-stroke"
              initial={parado ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.4, ease: [0.33, 1, 0.68, 1] }} />
          </svg>
        )}

        <div className="cl-topo">
          <div className="cl-rot">
            <span className="cl-ponto" />LUCRO {ROTULO[periodo]?.toUpperCase() || ''}
            <span className="cl-selo">{info.faixa}{periodo !== 'today' && periodo !== 'yesterday' ? ` · ${int(nDias)} ${nDias === 1 ? 'DIA' : 'DIAS'}` : ''}</span>
          </div>
          <div className="cl-acoes">
            <button type="button" className="cl-olho" onClick={alternar} aria-label={oculto ? 'Mostrar valor' : 'Esconder valor'} title={oculto ? 'Mostrar valor' : 'Esconder valor'}>
              {oculto
                ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.9 17.9A10 10 0 0 1 12 20c-7 0-10-8-10-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" /></svg>
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>}
            </button>
            {onPeriodo && (
              <div className="cl-periodos" role="tablist" aria-label="Período">
                {PERIODOS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={periodo === k} className={periodo === k ? 'on' : ''} onClick={() => onPeriodo(k)}>{l}</button>)}
              </div>
            )}
          </div>
        </div>

        <div className="cl-numero" style={{ '--enc': Math.min(1, 10 / Math.max(1, inteiroBR.length)), '--encM': Math.min(1, 7 / Math.max(1, inteiroBR.length)) }} aria-label={oculto ? 'Valor escondido' : `${neg ? 'menos ' : ''}R$ ${inteiroBR},${cent}`}>
          <span className="cl-rs">{neg ? '−R$' : 'R$'}</span>
          {oculto ? (
            <span className="cl-valor cl-oculto">••••••</span>
          ) : (
            <span className={`cl-valor${neg ? ' cl-neg' : ''}`}>
              <span className="cl-relevo" aria-hidden>{inteiroBR}<small>,{cent}</small></span>
              <span className="cl-face"><Odometro texto={inteiroBR} chave={`${periodo}-${inteiro}`} parado={parado} /><small>,{cent}</small></span>
            </span>
          )}
        </div>

        <div className="cl-apoio">
          <div><b>{oculto ? 'R$ ••••' : `${media < 0 ? '−' : ''}R$ ${int(Math.abs(media))}`}</b><span>média por dia</span></div>
          <div><b>{int(info.metas)}</b><span>{info.metas === 1 ? 'meta fechada' : 'metas fechadas'}</span></div>
          <div><b>{int(info.depositantes)}</b><span>depositantes</span></div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const CSS = `
.cl-palco { perspective: 1400px; }
.cl-card { position: relative; overflow: hidden; border-radius: 28px; padding: 26px 30px 24px; transform-style: preserve-3d; font-family: var(--font-sans);
  background: var(--surface);
  border: 1px solid var(--b1); box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.10); will-change: transform; }
.cl-luz { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(420px circle at var(--lx, 50%) var(--ly, 50%), color-mix(in srgb, var(--t1) 9%, transparent), transparent 60%); }
.cl-curva { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 42%; pointer-events: none; }
.cl-topo { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; transform: translateZ(20px); }
.cl-rot { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; font-size: 11px; font-weight: 800; letter-spacing: .16em; color: var(--t3); }
.cl-ponto { width: 7px; height: 7px; border-radius: 50%; background: var(--profit); box-shadow: 0 0 12px var(--profit); }
.cl-selo { font-family: var(--mono, "JetBrains Mono", monospace); font-size: 10.5px; letter-spacing: .06em; font-weight: 700; color: var(--t2);
  padding: 4px 9px; border-radius: 8px; border: 1px solid var(--b2); background: color-mix(in srgb, var(--t1) 4%, transparent); }
.cl-acoes { display: flex; align-items: center; gap: 8px; }
.cl-olho { width: 36px; height: 36px; border-radius: 12px; border: 1px solid var(--b1); background: var(--surface); color: var(--t2);
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: color .15s, border-color .15s; }
.cl-olho:hover { color: var(--t1); border-color: var(--b2); }
.cl-periodos { display: inline-flex; gap: 2px; padding: 4px; border-radius: 30px; background: var(--surface); border: 1px solid var(--b1); }
.cl-periodos button { padding: 6px 13px; border-radius: 30px; border: none; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 700;
  background: transparent; color: var(--t3); transition: background .18s, color .18s; }
.cl-periodos button.on { background: var(--k-pill-bg); color: var(--k-pill-fg); }

.cl-numero { position: relative; margin: 26px 0 6px; transform: translateZ(60px); }
.cl-rs { display: block; font-size: clamp(22px, 2.6vw, 34px); font-weight: 800; letter-spacing: -.02em; color: var(--t2); margin-bottom: -.1em; }
.cl-valor { position: relative; display: inline-block; font-weight: 800; letter-spacing: -.055em; line-height: .92;
  font-size: calc(clamp(54px, 9.4vw, 132px) * var(--enc, 1)); font-variant-numeric: tabular-nums; white-space: nowrap; }
.cl-valor small { font-size: .42em; letter-spacing: -.02em; margin-left: .06em; }
/* a face: metal (claro em cima, escurecendo em baixo, fio de lime no pé).
   O degradê vai em CADA glifo: num pai com filhos em movimento (o odômetro)
   o background-clip:text falha. */
.cl-face { position: relative; display: inline-flex; align-items: baseline; color: var(--t1); }
.cl-face .cl-col > span, .cl-face .cl-sep, .cl-face small {
  background: linear-gradient(180deg, var(--t1) 0%, var(--t1) 40%, color-mix(in srgb, var(--t1) 55%, transparent) 76%, color-mix(in srgb, var(--profit) 60%, var(--t1)) 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.cl-neg .cl-face .cl-col > span, .cl-neg .cl-face .cl-sep, .cl-neg .cl-face small {
  background: linear-gradient(180deg, var(--loss) 0%, var(--loss) 45%, color-mix(in srgb, var(--loss) 55%, transparent) 100%); -webkit-background-clip: text; background-clip: text; }
/* o relevo: a mesma forma, atrás, empilhada pra baixo (dá o "3D" do número) */
.cl-relevo { position: absolute; left: 0; top: 0; color: transparent; pointer-events: none;
  text-shadow: 0 1px 0 color-mix(in srgb, var(--t1) 22%, transparent), 0 2px 0 color-mix(in srgb, var(--t1) 18%, transparent), 0 3px 0 color-mix(in srgb, var(--t1) 14%, transparent),
    0 4px 0 color-mix(in srgb, var(--t1) 11%, transparent), 0 5px 0 color-mix(in srgb, var(--t1) 8%, transparent), 0 6px 1px color-mix(in srgb, var(--t1) 6%, transparent),
    0 18px 30px rgba(0,0,0,.35), 0 0 60px color-mix(in srgb, var(--profit) 22%, transparent); }
.cl-odo { display: inline-flex; }
.cl-dig { display: inline-block; height: 1em; overflow: hidden; line-height: 1em; vertical-align: top; }
.cl-col { display: flex; flex-direction: column; }
.cl-col > span { height: 1em; line-height: 1em; }
.cl-sep { display: inline-block; line-height: 1em; }
.cl-oculto { color: var(--t3); letter-spacing: .08em; }

.cl-apoio { position: relative; display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; transform: translateZ(30px); }
.cl-apoio > div { display: flex; flex-direction: column; gap: 2px; padding: 11px 16px; border-radius: 16px; min-width: 128px;
  background: color-mix(in srgb, var(--surface) 82%, transparent); border: 1px solid var(--b1); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.cl-apoio b { font-family: var(--mono, "JetBrains Mono", monospace); font-size: 17px; font-weight: 800; color: var(--t1); letter-spacing: -.02em; }
.cl-apoio span { font-size: 11.5px; color: var(--t3); }
@media (max-width: 760px) {
  .cl-card { padding: 20px 18px 18px; border-radius: 24px; }
  .cl-topo { align-items: flex-start; }
  .cl-acoes { width: 100%; justify-content: space-between; }
  .cl-periodos { flex: 1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; padding: 3px; }
  .cl-periodos button { padding: 7px 0; font-size: 11.5px; }
  .cl-numero { margin-top: 20px; }
  .cl-valor { font-size: calc(clamp(44px, 14.5vw, 76px) * var(--encM, 1)); }
  .cl-apoio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .cl-apoio > div { min-width: 0; padding: 10px 11px; }
  .cl-apoio b { font-size: 14.5px; }
  .cl-apoio span { font-size: 10.5px; }
}
`

'use client'
// ─────────────────────────────────────────────────────────────────────────
// O N DA NEX, ANIMADO EM CÓDIGO.
//
// Antes esta seção rodava marca.mp4: 2,31 MB de vídeo pré-renderizado, com
// câmera fixa, luz fixa e o wordmark "NEXCONTROL 2.0" queimado dentro —
// inclusive um selo LARANJA que não é da paleta 2.0. Nada disso dava pra
// ajustar sem voltar pro Flow e re-renderizar.
//
// Aqui o N é geometria. Ele gira, a luz acompanha o giro e os brilhos são
// calculados a partir do ângulo. Pesa ~4 KB em vez de 2,31 MB, é vetor
// (nítido em qualquer tela e em qualquer tamanho) e qualquer coisa nele é
// um número que se muda.
//
// COMO A FORMA FOI OBTIDA: não existe SVG da marca 2.0 em lugar nenhum do
// repositório — só PNG. A geometria abaixo foi TRAÇADA de public/brand/
// nex-v2.png varrendo os pixels linha a linha e lendo onde cada faixa
// começa e termina. A marca tem simetria de 180° em torno do centro, e é
// isso que os três polígonos respeitam.
//
// POR QUE TRÊS SVGs E NÃO UM: cada faceta precisa do próprio translateZ
// pra existir em profundidade de verdade. Filhos de um mesmo <svg> não
// aceitam transform 3D independente — então cada faceta é um <svg> seu,
// empilhado, dentro de um pai com preserve-3d. É isso que faz a fita
// passar À FRENTE dos postes quando o N vira.
//
// INTERAÇÃO
//   ponteiro  o N acompanha o mouse sobre a seção inteira, com mola
//   toque     gira conforme a seção atravessa a tela (arrastar em cima
//             brigaria com a rolagem) e balança de leve sozinho
//   parado    com prefers-reduced-motion ele fica imóvel na pose de
//             descanso, sem brilho correndo
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react'
import {
  motion, useMotionValue, useSpring, useTransform,
  useMotionTemplate, useScroll, useReducedMotion,
} from 'framer-motion'

/* ── A FORMA ────────────────────────────────────────────────────────────
   Num quadro de 100x103, tudo traçado de public/brand/nex-v2.png.

   A CONSTRUÇÃO, que demorei a enxergar: não são três peças soltas. É UMA
   FITA que atravessa o quadro inteiro na diagonal, com um POSTE atrás de
   cada ponta dela. A fita passa na frente; os postes aparecem só onde ela
   não cobre. É por isso que o canto de cima à esquerda e o de baixo à
   direita são claros no original — são as duas pontas da mesma fita.

   As três diagonais têm a mesma inclinação (dx/dy = 0,94). O poste
   esquerdo foi medido direto; o direito é ele girado 180° em torno do
   centro (50; 51,25), porque a marca tem essa simetria. A fita é uma
   faixa de 40 de largura horizontal recortada pelas bordas do quadro. */
const FACETAS = {
  esq:  [[0, 9.3], [31.2, 41.6], [31.2, 100], [0, 67.4]],
  dir:  [[68.8, 2.5], [100, 35.1], [100, 93.2], [68.8, 60.9]],
  fita: [[0, 9.3], [0, 2.5], [33.6, 2.5], [100, 73.2], [100, 100], [85.3, 100]],
}
const RAIO = 7 // o arredondamento dos cantos, como no original

/* Devolve o path de um polígono com os cantos arredondados. Cada vértice
   vira: recua pela aresta que chega, faz a curva, sai pela aresta que sai.
   O recuo nunca passa de 40% da aresta, senão cantos de arestas curtas se
   comem. */
function arredondar(pts, r) {
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const ant = pts[(i - 1 + n) % n], at = pts[i], prox = pts[(i + 1) % n]
    const recuo = (de, para) => {
      const dx = para[0] - de[0], dy = para[1] - de[1]
      const comp = Math.hypot(dx, dy) || 1
      const t = Math.min(r, comp * 0.4) / comp
      return [de[0] + dx * t, de[1] + dy * t]
    }
    const entra = recuo(at, ant)   // ponto sobre a aresta que chega
    const sai = recuo(at, prox)    // ponto sobre a aresta que sai
    d += (i === 0 ? 'M' : 'L') + `${entra[0].toFixed(2)} ${entra[1].toFixed(2)}`
    d += `Q${at[0].toFixed(2)} ${at[1].toFixed(2)} ${sai[0].toFixed(2)} ${sai[1].toFixed(2)}`
  }
  return d + 'Z'
}

const PATH = Object.fromEntries(
  Object.entries(FACETAS).map(([k, p]) => [k, arredondar(p, RAIO)])
)

/* ── AS CORES ───────────────────────────────────────────────────────────
   Amostradas do PNG, não inventadas. O poste esquerdo é grafite parelho; o
   direito nasce escuro e termina claro; a fita sai do quase-branco e cai
   no lime. Só o lime mais alto foi puxado pro #C8F21D da identidade 2.0 —
   no PNG ele é um pouco mais oliva. */
const TINTA = {
  esq:  [['#2E3438', 0], ['#3C444A', 0.45], ['#545C64', 1]],
  fita: [['#F0F1F2', 0], ['#DCDFE1', 0.34], ['#C8F21D', 0.82], ['#B9D634', 1]],
  dir:  [['#2F353A', 0], ['#4A5158', 0.52], ['#C9CDD1', 0.84], ['#DDE1E4', 1]],
}

function Gradiente({ id, paradas, angulo = 0 }) {
  // ângulo em graus, 0 = de cima pra baixo
  const rad = (angulo - 90) * Math.PI / 180
  const dx = Math.cos(rad) / 2, dy = Math.sin(rad) / 2
  return (
    <linearGradient id={id} x1={0.5 - dx} y1={0.5 - dy} x2={0.5 + dx} y2={0.5 + dy}>
      {paradas.map(([cor, off]) => <stop key={off} offset={off} stopColor={cor} />)}
    </linearGradient>
  )
}

/* Uma faceta: o próprio SVG, com profundidade própria. */
function Faceta({ nome, z, anguloLuz, brilhoX, escala, parado }) {
  const cid = `nxn-c-${nome}`, gid = `nxn-g-${nome}`, bid = `nxn-b-${nome}`
  return (
    <motion.svg
      className={`nxn-faceta nxn-${nome}`}
      viewBox="-3 0 106 106" aria-hidden
      style={{ transform: `translateZ(${z}px)` }}
    >
      <defs>
        <clipPath id={cid}><path d={PATH[nome]} /></clipPath>
        <Gradiente id={gid} paradas={TINTA[nome]} angulo={anguloLuz} />
        {/* o brilho: uma faixa de luz que atravessa a faceta. É ela que dá
            a leitura de metal — metal é reflexo que anda, não cor. */}
        <linearGradient id={bid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={PATH[nome]} fill={`url(#${gid})`} />

      <g clipPath={`url(#${cid})`}>
        <motion.rect
          className="nxn-brilho"
          x="-34" y="-14" width="40" height="134"
          fill={`url(#${bid})`}
          style={parado ? undefined : { x: brilhoX, scaleX: escala }}
          transform="skewX(-24)"
        />
      </g>

      {/* aresta: a linha fina que separa a faceta do fundo e dá a dobra */}
      <path d={PATH[nome]} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
    </motion.svg>
  )
}

export default function MarcaN({ className = '', alvo }) {
  const parado = useReducedMotion()
  const raiz = useRef(null)

  // ângulos crus, antes da mola
  const cruY = useMotionValue(-16)
  const cruX = useMotionValue(6)

  const mola = { stiffness: 90, damping: 18, mass: 0.8 }
  const ry = useSpring(cruY, mola)
  const rx = useSpring(cruX, mola)

  /* ── PONTEIRO: a área de escuta é a SEÇÃO, não a peça.
        Exigir o mouse em cima do N seria exigir pontaria pra descobrir que
        ele gira. Do jeito que está, qualquer movimento dentro do bloco já
        vira o N — e a pessoa descobre sem procurar. */
  useEffect(() => {
    if (parado) return
    const area = (alvo && alvo.current) || raiz.current?.parentElement
    if (!area) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let cru = null
    const mover = e => {
      const r = area.getBoundingClientRect()
      cru = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
      if (!pedido) { pedido = requestAnimationFrame(aplicar) }
    }
    let pedido = 0
    const aplicar = () => {
      pedido = 0
      if (!cru) return
      cruY.set((cru[0] - 0.5) * 92)   // ±46° na horizontal
      cruX.set((0.5 - cru[1]) * 30)   // ±15° na vertical, mais contido
    }
    const sair = () => { cruY.set(-16); cruX.set(6) }

    area.addEventListener('pointermove', mover, { passive: true })
    area.addEventListener('pointerleave', sair)
    return () => {
      area.removeEventListener('pointermove', mover)
      area.removeEventListener('pointerleave', sair)
      if (pedido) cancelAnimationFrame(pedido)
    }
  }, [parado, alvo, cruY, cruX])

  /* ── TOQUE: gira conforme a seção atravessa a tela.
        Arrastar em cima brigaria com a rolagem da página, então quem vira
        o N no telefone é o próprio scroll — e o resultado é melhor: ele
        gira enquanto a pessoa lê. */
  const { scrollYProgress } = useScroll({
    target: raiz, offset: ['start end', 'end start'],
  })
  useEffect(() => {
    if (parado) return
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    return scrollYProgress.on('change', v => {
      cruY.set((v - 0.5) * 108)
      cruX.set((0.5 - v) * 16)
    })
  }, [parado, scrollYProgress, cruY, cruX])

  /* ── O QUE O GIRO COMANDA ─────────────────────────────────────────────
     Tudo abaixo é função do ângulo. É isso que separa isto de um GIF: a
     luz não está gravada, ela é consequência de onde a peça está. */

  // a faixa de brilho atravessa a peça conforme ela vira
  const brilhoX = useTransform(ry, [-46, 46], [-8, 128])
  // de perfil a faixa comprime, de frente ela abre
  const escala = useTransform(rx, [-15, 15], [0.85, 1.25])
  // o gradiente das facetas roda junto, como se a fonte de luz fosse fixa
  const anguloLuz = 158

  const corpo = useMotionTemplate`rotateX(${rx}deg) rotateY(${ry}deg)`
  // a sombra no chão desliza pro lado oposto ao giro
  const sombraX = useTransform(ry, [-46, 46], [26, -26])
  const sombraOp = useTransform(rx, [-15, 15], [0.5, 0.26])

  return (
    <div ref={raiz} className={`nxn ${className}`} aria-hidden>
      <div className="nxn-palco">
        <motion.div
          className="nxn-corpo"
          style={parado ? { transform: 'rotateX(6deg) rotateY(-16deg)' } : { transform: corpo }}
        >
          {/* o halo lime nasce ATRÁS da peça: é o que amarra o N à
              identidade sem pintar a marca de verde */}
          <div className="nxn-halo" />
          {/* A ORDEM IMPORTA, e eu tinha errado ela. No original os POSTES
              ficam na frente e a fita passa ATRÁS — é isso que faz a ponta
              dela sumir no meio e reaparecer embaixo à direita. Invertido,
              a fita cobria tudo e o N virava uma faixa clara com dois
              retângulos ao lado. */}
          <Faceta nome="fita" z={-17} anguloLuz={anguloLuz} brilhoX={brilhoX} escala={escala} parado={parado} />
          <Faceta nome="esq"  z={13}  anguloLuz={anguloLuz} brilhoX={brilhoX} escala={escala} parado={parado} />
          <Faceta nome="dir"  z={13}  anguloLuz={anguloLuz} brilhoX={brilhoX} escala={escala} parado={parado} />
        </motion.div>
        <motion.div
          className="nxn-chao"
          style={parado ? undefined : { x: sombraX, opacity: sombraOp }}
        />
      </div>
    </div>
  )
}

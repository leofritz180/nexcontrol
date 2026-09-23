/**
 * O CONJUNTO DE ICONES, a partir da marca nova.
 *
 * Ate 24/09/2026 TODOS os icones do sistema — PWA, favicon, apple-touch e
 * o icone que aparece na notificacao push — ainda eram o N cromado antigo.
 * A marca nova (com a fita lime) so existia em public/brand/. Quem instalava
 * o app via uma marca; quem abria a landing via outra.
 *
 * DUAS FONTES, de proposito:
 *
 *  · os tamanhos GRANDES (180 pra cima) saem do PNG de 1254px, que tem o
 *    acabamento de material — sombra, curvatura, o degrade da fita;
 *  · os PEQUENOS (16, 32) e o distintivo saem da GEOMETRIA tracada, a mesma
 *    do marca-n.js. Reduzir um PNG com degrade pra 16px vira borrao cinza;
 *    o vetor chapado continua legivel.
 *
 * O DISTINTIVO (badge) e caso a parte: o Android trata a imagem do badge
 * como MASCARA — le so o canal alfa e joga a cor do sistema por cima. Um
 * icone colorido ali vira uma bolha cinza sem forma. Por isso ele sai
 * branco chapado em fundo transparente.
 *
 * O MASKABLE tambem: o sistema recorta o icone num circulo/squircle que
 * come ate 20% de cada borda. Por isso ele leva MUITO mais respiro que os
 * outros — senao a fita do N sai cortada no lancador do Android.
 *
 *   node scripts/icones-marca.mjs
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const navegador = CHROMES.find(p => fs.existsSync(p))
if (!navegador) { console.error('Nenhum Chrome/Edge encontrado.'); process.exit(1) }

const FONTE = 'public/brand/nex-v2.png'
if (!fs.existsSync(FONTE)) { console.error('nao achei ' + FONTE); process.exit(1) }
const b64 = fs.readFileSync(FONTE).toString('base64')

const PRETO = '#0D0E0F'
const LIME = '#C8F21D'

/* A mesma geometria de app/v2/marca-n.js. */
function vetor({ cor, fita, fundo }) {
  return `<svg viewBox="0 0 100 103" width="100%" height="100%" style="display:block">
    ${fundo ? `<rect x="-20" y="-20" width="140" height="143" fill="${fundo}"/>` : ''}
    <path d="M0 9.3 31.2 41.6 31.2 100 0 67.4Z" fill="${cor}"/>
    <path d="M68.8 2.5 100 35.1 100 93.2 68.8 60.9Z" fill="${cor}"/>
    <path d="M0 9.3 0 2.5 33.6 2.5 100 73.2 100 100 85.3 100Z" fill="${fita || cor}"/>
  </svg>`
}

function pagina(conteudo, lado, fundo) {
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${lado}px;height:${lado}px;overflow:hidden}
    body{background:${fundo || 'transparent'};display:flex;align-items:center;justify-content:center}
  </style>${conteudo}`
}

const nav = await chromium.launch({ executablePath: navegador, headless: true })
const feitos = []

async function desenhar(destino, lado, html, transparente) {
  const ctx = await nav.newContext({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 })
  const pg = await ctx.newPage()
  await pg.setContent(html, { waitUntil: 'networkidle' })
  await pg.waitForTimeout(350)
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  await pg.screenshot({ path: destino, omitBackground: !!transparente })
  await ctx.close()
  feitos.push([destino, lado, (fs.statSync(destino).size / 1024).toFixed(0) + ' KB'])
}

/* ── 1) os grandes, do PNG de material ───────────────────────────────── */
// respiro: o quanto do lado fica de margem em volta da marca
const GRANDES = [
  ['public/icons/icon-192.png',           192,  0.10],
  ['public/icons/icon-512.png',           512,  0.10],
  ['public/icons/icon-1024.png',         1024,  0.10],
  ['public/icons/apple-touch-icon.png',   180,  0.08],  // iOS ja recorta o canto
  ['public/apple-touch-icon.png',         180,  0.08],
  ['public/icons/nexcontrol-icon-clean.png', 1024, 0.10],
  // o lancador do Android come ate 20% de cada borda no maskable
  ['public/icons/icon-512-maskable.png',  512,  0.26],
]
for (const [destino, lado, respiro] of GRANDES) {
  const img = `<img src="data:image/png;base64,${b64}" style="width:${Math.round(lado * (1 - respiro * 2))}px;height:auto;display:block">`
  await desenhar(destino, lado, pagina(img, lado, PRETO))
}

/* ── 2) os pequenos, do vetor ────────────────────────────────────────── */
for (const [destino, lado] of [['public/icons/favicon-16.png', 16], ['public/icons/favicon-32.png', 32], ['public/favicon.png', 32]]) {
  const svg = `<div style="width:${Math.round(lado * 0.78)}px;height:${Math.round(lado * 0.78)}px">${vetor({ cor: '#F4F4F1', fita: LIME })}</div>`
  await desenhar(destino, lado, pagina(svg, lado, PRETO))
}

/* ── 3) o distintivo da notificacao: so silhueta ─────────────────────── */
// branco chapado em fundo transparente — o Android le so o alfa
const silhueta = `<div style="width:76px;height:76px">${vetor({ cor: '#ffffff' })}</div>`
await desenhar('public/icons/badge-96.png', 96, pagina(silhueta, 96), true)

await nav.close()

/* ── 4) favicon vetorial: nitido em qualquer tamanho ─────────────────── */
const svgArquivo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 123">
  <rect width="120" height="123" rx="26" fill="${PRETO}"/>
  <g transform="translate(10 10)">
    <path d="M0 9.3 31.2 41.6 31.2 100 0 67.4Z" fill="#F4F4F1"/>
    <path d="M68.8 2.5 100 35.1 100 93.2 68.8 60.9Z" fill="#F4F4F1"/>
    <path d="M0 9.3 0 2.5 33.6 2.5 100 73.2 100 100 85.3 100Z" fill="${LIME}"/>
  </g>
</svg>`
fs.writeFileSync('public/favicon.svg', svgArquivo)
feitos.push(['public/favicon.svg', '—', (fs.statSync('public/favicon.svg').size / 1024).toFixed(1) + ' KB'])

console.log('')
for (const [f, lado, peso] of feitos) console.log(`  ${String(lado).padStart(4)}  ${f.padEnd(42)} ${peso}`)
console.log(`\n  ${feitos.length} arquivos.`)

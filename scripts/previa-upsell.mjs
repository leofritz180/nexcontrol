/**
 * AS QUATRO TELAS DO UPSELL, fotografadas.
 *
 * Existe porque o upsell e uma sequencia, nao uma tela: convite, dados, PIX
 * e "voce esta dentro". Conferir so a primeira esconde justamente onde a
 * versao anterior era amadora — as tres seguintes.
 *
 * Usa o Chrome da maquina (playwright-core). A pagina e publica e o
 * pagamento e inerte (prop `demo`), entao nao precisa de sessao.
 *
 *   node scripts/previa-upsell.mjs
 *   node scripts/previa-upsell.mjs --url=http://localhost:3000
 *   node scripts/previa-upsell.mjs --mobile
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const valor = (f, padrao) => {
  const a = args.find(x => x.startsWith(f + '='))
  return a ? a.slice(f.length + 1) : padrao
}
const BASE = valor('--url', 'https://nexcpa.com.br')
const MOBILE = args.includes('--mobile')
const PASTA = path.join(process.cwd(), '.telas', 'upsell')

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const navegador = CHROMES.find(p => fs.existsSync(p))
if (!navegador) { console.error('Nenhum Chrome/Edge encontrado.'); process.exit(1) }

fs.mkdirSync(PASTA, { recursive: true })
const espera = ms => new Promise(r => setTimeout(r, ms))

const nav = await chromium.launch({ executablePath: navegador, headless: true })
const ctx = await nav.newContext({
  viewport: MOBILE ? { width: 390, height: 900 } : { width: 520, height: 980 },
  deviceScaleFactor: 2,
  isMobile: MOBILE,
})
const pg = await ctx.newPage()

async function foto(nome) {
  await espera(900)               // deixa a animacao de entrada assentar
  const alvo = path.join(PASTA, `${nome}${MOBILE ? '-mobile' : ''}.png`)
  await pg.screenshot({ path: alvo, fullPage: true })
  console.log('·', path.relative(process.cwd(), alvo))
}

await pg.goto(BASE + '/previa-upsell', { waitUntil: 'networkidle', timeout: 60000 })
await espera(1200)
await foto('1-convite')

await pg.getByText('Entrar no grupo').click()
await foto('2-dados')

// a prova de que o nome ja veio preenchido e o WhatsApp e digitado
await pg.locator('input[type="tel"]').fill('32998348889')
await espera(300)
await pg.getByRole('button', { name: /Gerar PIX/ }).click()
await foto('3-pix')

// no modo demo a aprovacao chega sozinha em ~3,5s
await espera(4000)
await foto('4-dentro')

await nav.close()
console.log('/nPronto:', path.relative(process.cwd(), PASTA))

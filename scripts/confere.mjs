/**
 * CONFERE UMA ROTA SO, na sessao ja salva.
 *
 * O scripts/telas.mjs fotografa o painel inteiro; quando o que mudou foi um
 * bloco, esperar 20 telas so pra olhar uma e desperdicio de minuto.
 *
 *   node scripts/confere.mjs faturamento leitura   (rota SEM a barra)
 *   node scripts/confere.mjs admin admin --mobile
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
// O Git Bash converte um argumento que comeca com barra em caminho do
// Windows: "/faturamento" virava "C:/Program Files/Git/faturamento" e o
// goto ia pro lugar errado. Entao a rota se passa SEM a barra.
const ROTA = '/' + String(args[0] || 'admin').split(/[\/]/).filter(Boolean).pop()
const NOME = args[1] || 'confere'
const MOBILE = args.includes('--mobile')
const BASE = (args.find(a => a.startsWith('--url=')) || '--url=https://nexcpa.com.br').slice(6)

const PASTA = path.join(process.cwd(), '.telas')
const SESSAO = path.join(PASTA, 'sessao.json')
if (!fs.existsSync(SESSAO)) { console.error('Sem sessao. Rode: node scripts/telas.mjs --login'); process.exit(1) }

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const navegador = CHROMES.find(p => fs.existsSync(p))
if (!navegador) { console.error('Nenhum Chrome/Edge encontrado.'); process.exit(1) }

const nav = await chromium.launch({ executablePath: navegador, headless: true })
const ctx = await nav.newContext({
  storageState: SESSAO, locale: 'pt-BR',
  viewport: MOBILE ? { width: 390, height: 900 } : { width: 1440, height: 1000 },
  deviceScaleFactor: MOBILE ? 2 : 1, isMobile: MOBILE,
})
const pg = await ctx.newPage()
await pg.goto(BASE + ROTA, { waitUntil: 'networkidle', timeout: 90000 })
await pg.waitForTimeout(6000)

// os pop-ups de onboarding tampam justamente o que se quer olhar
for (const t of ['Agora não', 'Fechar', 'Entendi', 'Pular', 'Depois']) {
  try { const b = pg.getByRole('button', { name: t }); if (await b.count()) await b.first().click({ timeout: 1200 }) } catch {}
}
await pg.waitForTimeout(1500)

const alvo = path.join(PASTA, `${NOME}${MOBILE ? '-mobile' : ''}.png`)
await pg.screenshot({ path: alvo, fullPage: true })
console.log('·', path.relative(process.cwd(), alvo), '·', pg.url())
await nav.close()

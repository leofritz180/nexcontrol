/**
 * TESTE DE FUMACA — percorre as telas logadas e escuta o console.
 *
 * Um print mostra o que renderizou; nao mostra o que explodiu em silencio
 * num canto, nem a chamada que voltou 500. Depois de virar o visual pra
 * todas as contas, e essa a diferenca entre "parece ok" e "esta ok".
 *
 *   node scripts/fumaca.mjs
 *   node scripts/fumaca.mjs --url=https://nexcontrol.vercel.app
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const BASE = (args.find(a => a.startsWith('--url=')) || '--url=https://nexcontrol.vercel.app').slice(6)
const SESSAO = path.join(process.cwd(), '.telas', 'sessao.json')
if (!fs.existsSync(SESSAO)) { console.error('Sem sessao salva.'); process.exit(1) }

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const navegador = CHROMES.find(p => fs.existsSync(p))

const ROTAS = ['/admin', '/faturamento', '/operadores', '/custos', '/redes', '/pix',
               '/slots', '/planejamento', '/premiacoes', '/network', '/billing', '/billing-mp', '/tutorial']

// ruido conhecido que nao diz nada sobre a 2.0
const IGNORAR = [/favicon/i, /manifest/i, /ServiceWorker/i, /Download the React DevTools/i,
                 /ERR_BLOCKED_BY_CLIENT/i, /net::ERR_INTERNET_DISCONNECTED/i]
const interessa = t => !IGNORAR.some(r => r.test(t))

const nav = await chromium.launch({ executablePath: navegador, headless: true })
const ctx = await nav.newContext({ storageState: SESSAO, locale: 'pt-BR', viewport: { width: 1440, height: 1000 } })
const pg = await ctx.newPage()

let falhas = 0
for (const rota of ROTAS) {
  const erros = []
  const ouvirC = m => { if (m.type() === 'error' && interessa(m.text())) erros.push('console: ' + m.text().slice(0, 160)) }
  const ouvirP = e => { if (interessa(String(e))) erros.push('excecao: ' + String(e).slice(0, 160)) }
  const ouvirR = r => { if (r.status() >= 500) erros.push(`http ${r.status()}: ${r.url().replace(BASE, '').slice(0, 110)}`) }
  pg.on('console', ouvirC); pg.on('pageerror', ouvirP); pg.on('response', ouvirR)

  try {
    await pg.goto(BASE + rota, { waitUntil: 'networkidle', timeout: 90000 })
    await pg.waitForTimeout(4500)
  } catch (e) { erros.push('navegacao: ' + String(e.message || e).slice(0, 120)) }

  pg.off('console', ouvirC); pg.off('pageerror', ouvirP); pg.off('response', ouvirR)

  const parou = new URL(pg.url()).pathname
  const desviou = parou !== rota && !parou.startsWith(rota)
  if (erros.length || desviou) {
    falhas++
    console.log(`\n✗ ${rota}${desviou ? `  (parou em ${parou})` : ''}`)
    for (const e of [...new Set(erros)].slice(0, 5)) console.log('   ' + e)
  } else {
    console.log(`✓ ${rota}`)
  }
}
await nav.close()
console.log(falhas ? `\n${falhas} rota(s) com problema.` : '\nTodas limpas.')
process.exit(falhas ? 1 : 0)

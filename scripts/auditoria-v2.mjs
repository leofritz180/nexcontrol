/**
 * TUDO VIROU 2.0? — a resposta medida, rota por rota.
 *
 * Nao adianta olhar o codigo: o que decide e o que o navegador monta. Esta
 * varredura entra em cada rota com sessao real e pergunta tres coisas:
 *
 *   · o <html> recebeu nx-bento (a camada 2.0)?
 *   · o corpo veio CLARO ou continua escuro?
 *   · a tela tem conteudo, ou virou casca vazia?
 *
 * Rotas escuras DE PROPOSITO (a home publica, /owner e as bancadas) entram
 * na conta como esperado-escuro, nao como falha.
 *
 *   node scripts/auditoria-v2.mjs
 */
import fs from 'fs'
import { chromium } from 'playwright-core'

const BASE = process.argv.find(a => a.startsWith('--url='))?.slice(6) || 'https://nexcontrol.vercel.app'
const SESSAO = '.telas/sessao.json'
const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const navegador = CHROMES.find(p => fs.existsSync(p))

// rotas que SAO escuras por decisao, nao por esquecimento
const ESCURAS = new Set(['/owner', '/design-v2', '/admin-preview', '/'])

const ROTAS = [
  '/', '/admin', '/faturamento', '/operadores', '/operator',
  '/custos', '/redes', '/pix', '/slots', '/proxy', '/minhas-proxies',
  '/planejamento', '/premiacoes', '/network', '/afiliados', '/equipe',
  '/performance', '/tutorial', '/aulas', '/billing', '/billing-mp',
  '/login', '/signup', '/invite', '/reset-password', '/demo',
  '/termos', '/privacidade', '/owner',
]

if (!fs.existsSync(SESSAO)) { console.error('Sem sessao: node scripts/telas.mjs --link'); process.exit(1) }
const nav = await chromium.launch({ executablePath: navegador, headless: true })
const ctx = await nav.newContext({ storageState: SESSAO, locale: 'pt-BR', viewport: { width: 1440, height: 950 } })
const pg = await ctx.newPage()

const claro = c => /(\b|\s)nx-light(\b|\s)/.test(c)
const bento = c => /(\b|\s)nx-bento(\b|\s)/.test(c)
let falhas = 0
console.log('ROTA'.padEnd(18) + 'CLASSES'.padEnd(26) + 'FUNDO'.padEnd(18) + 'TEXTO')
console.log('─'.repeat(74))

for (const r of ROTAS) {
  let cls = '', bg = '', txt = 0, erro = '', parou = ''
  try {
    await pg.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 60000 })
    // espera a tela ter CONTEUDO, com teto de 15s — o /owner monta um
    // painel pesado e passava de qualquer espera fixa razoavel
    try {
      await pg.waitForFunction(() => (document.body.innerText || '').trim().length > 150, { timeout: 15000 })
    } catch {}
    await pg.waitForTimeout(1200)
    parou = await pg.evaluate(() => location.pathname)
    cls = await pg.evaluate(() => document.documentElement.className)
    bg = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor)
    txt = await pg.evaluate(() => (document.body.innerText || '').trim().length)
  } catch (e) { erro = String(e.message).slice(0, 30) }

  const deveSerEscura = ESCURAS.has(r)
  const temBento = bento(cls)
  const temClaro = claro(cls)
  let veredito = 'ok'
  // desviou pro login? entao nao medimos a rota, medimos o login
  const desviou = parou === '/login' && r !== '/login'
  if (desviou) { veredito = 'X SESSAO CAIU (foi pro login)'; falhas++ }
  else if (erro) { veredito = 'X ' + erro; falhas++ }
  else if (txt < 120) { veredito = 'X tela vazia'; falhas++ }
  else if (deveSerEscura && temClaro) { veredito = 'X clareou sem querer'; falhas++ }
  else if (!deveSerEscura && !temBento) { veredito = 'X SEM a camada 2.0'; falhas++ }

  console.log(r.padEnd(18) + (cls || '(nenhuma)').padEnd(26) + bg.padEnd(18) + String(txt).padStart(5) + '  ' + veredito)
}
await nav.close()
console.log('─'.repeat(74))
console.log(falhas ? `\n  ${falhas} rota(s) fora do esperado.` : '\n  Todas as rotas como devem ser.')

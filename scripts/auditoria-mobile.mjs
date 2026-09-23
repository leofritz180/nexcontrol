/**
 * O QUE ESTOURA A TELA DO CELULAR.
 *
 * Numero nao ve feiura, mas ve o que SAI da tela — e e isso que quebra no
 * telefone. Esta varredura entra em cada rota a 390x844 e mede tres coisas
 * que o olho so pega rolando a pagina inteira:
 *
 *   · a pagina rola pra LADO? (largura maior que a janela)
 *   · algum elemento visivel passa da borda?
 *   · alguma caixa FLUTUANTE (tour, pop-up, aviso) esta cortada?
 *
 * As flutuantes sao o caso mais caro: elas nascem posicionadas por conta
 * (position: fixed) e nenhuma media query as segura. Um tooltip de tour com
 * largura cravada em 360px numa tela de 390 nao cabe com margem nenhuma.
 *
 *   node scripts/auditoria-mobile.mjs
 *   node scripts/auditoria-mobile.mjs --url=http://localhost:3000
 *   node scripts/auditoria-mobile.mjs --tour    (abre os tours de novo)
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const BASE = (args.find(a => a.startsWith('--url=')) || '--url=https://nexcontrol.vercel.app').slice(6)
const COM_TOUR = args.includes('--tour')
const SESSAO = '.telas/sessao.json'
const OUT = '.telas/mobile'
const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

const ROTAS = ['/admin', '/faturamento', '/operadores', '/operator', '/custos', '/redes',
               '/pix', '/slots', '/planejamento', '/premiacoes', '/network', '/afiliados',
               '/performance', '/tutorial', '/billing-mp', '/', '/login', '/signup']

if (!fs.existsSync(SESSAO)) { console.error('Sem sessao.'); process.exit(1) }
fs.mkdirSync(OUT, { recursive: true })
const nav = await chromium.launch({ executablePath: CHROMES.find(p => fs.existsSync(p)), headless: true })

const MEDIDA = () => {
  const vw = innerWidth, vh = innerHeight
  const fora = []
  const flutuantes = []
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e)
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue
    const r = e.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) continue
    const nome = (e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : '') || e.tagName
    // caixa flutuante: fixa e grande o bastante pra ser conteudo
    if ((s.position === 'fixed' || s.position === 'absolute') && r.width > 180 && r.height > 90) {
      const corta = r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1
      if (corta) flutuantes.push({
        nome: nome.slice(0, 26), z: s.zIndex,
        cx: `${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}`,
        estoura: [r.left < -1 && 'esq', r.right > vw + 1 && 'dir', r.top < -1 && 'topo', r.bottom > vh + 1 && 'base'].filter(Boolean).join('+'),
      })
      continue
    }
    // conteudo normal passando da borda lateral
    if (r.width > 8 && (r.right > vw + 2 || r.left < -2) && s.position !== 'fixed') {
      fora.push({ nome: nome.slice(0, 26), dir: Math.round(r.right), esq: Math.round(r.left) })
    }
  }
  return {
    rolaLado: document.documentElement.scrollWidth > vw + 1,
    larguraDoc: document.documentElement.scrollWidth,
    vw,
    fora: fora.slice(0, 5),
    flutuantes: flutuantes.slice(0, 5),
  }
}

let problemas = 0
for (const r of ROTAS) {
  const ctx = await nav.newContext({
    storageState: SESSAO, locale: 'pt-BR',
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  })
  const pg = await ctx.newPage()
  try {
    await pg.goto(BASE + r, { waitUntil: 'networkidle', timeout: 90000 })
    if (COM_TOUR) {
      await pg.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('nx_tour_completed_')) localStorage.removeItem(k) })
      await pg.reload({ waitUntil: 'networkidle', timeout: 90000 })
    }
    await pg.waitForTimeout(COM_TOUR ? 9000 : 6000)
    const m = await pg.evaluate(MEDIDA)
    const ruim = m.rolaLado || m.fora.length || m.flutuantes.length
    if (ruim) problemas++
    console.log(`\n${ruim ? 'X' : 'ok'} ${r}${m.rolaLado ? `   ROLA PRO LADO (${m.larguraDoc}px numa tela de ${m.vw})` : ''}`)
    for (const f of m.flutuantes) console.log(`     flutuante cortada: ${f.nome} (z${f.z}) ${f.cx}  estoura: ${f.estoura}`)
    for (const f of m.fora) console.log(`     passa da borda: ${f.nome}  ${f.esq}→${f.dir}`)
    if (ruim) await pg.screenshot({ path: path.join(OUT, r.replace(/\//g, '_') + '.png'), fullPage: false })
  } catch (e) { console.log(`\nX ${r}  ${String(e.message).slice(0, 60)}`); problemas++ }
  await ctx.close()
}
await nav.close()
console.log('\n' + '='.repeat(68))
console.log(problemas ? `  ${problemas} rota(s) com problema no celular.` : '  Nenhuma rota estoura a tela.')

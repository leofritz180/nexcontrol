/**
 * O QUE QUEBRA NA TELA DO CELULAR.
 *
 * A primeira versão desta varredura era inútil de tão barulhenta: acusava
 * como defeito todo elemento abaixo da dobra — o que numa página que rola é
 * simplesmente "o resto da página". Uma auditoria que aponta 200 coisas não
 * aponta nenhuma.
 *
 * Agora ela mede só o que é defeito de verdade:
 *
 *   1. A página ROLA PRO LADO. Sempre errado num telefone.
 *   2. Um elemento FIXO (barra, aviso, tutorial) sai da tela. Fixo é o que
 *      se posiciona pela janela, então sair dela é sempre bug.
 *   3. Um elemento do conteúdo passa da borda direita E não está dentro de
 *      algo que rola de lado de propósito (faixa de abas, carrossel).
 *   4. Dois pop-ups grandes ao mesmo tempo — o coordenador de overlays
 *      deveria impedir, e já falhou antes.
 *
 * Rola a página até o fim antes de medir: bug de rodapé fixo só aparece
 * depois que se rola.
 *
 *   node scripts/auditoria-mobile.mjs
 *   node scripts/auditoria-mobile.mjs --url=http://localhost:3000
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const BASE = (args.find(a => a.startsWith('--url=')) || '--url=https://nexcontrol.vercel.app').slice(6)
const SESSAO = '.telas/sessao.json'
const OUT = '.telas/mobile'
const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

const ROTAS = ['/admin', '/faturamento', '/operadores', '/operator', '/custos', '/redes',
               '/pix', '/slots', '/planejamento', '/premiacoes', '/network', '/afiliados',
               '/performance', '/tutorial', '/billing-mp', '/equipe', '/proxy',
               '/', '/login', '/signup']

const MEDIR = () => {
  const vw = innerWidth, vh = innerHeight
  const contido = e => {
    let a = e
    while (a && a !== document.body) {
      const s = getComputedStyle(a)
      // rola de lado de propósito (faixa de abas, carrossel)
      if (/auto|scroll/.test(s.overflowX) && a.scrollWidth > a.clientWidth + 2) return true
      // corta o excesso: quem passa daqui não aparece pra ninguém
      if (/hidden|clip/.test(s.overflowX) || /hidden|clip/.test(s.overflow)) return true
      a = a.parentElement
    }
    return false
  }
  const nomear = e => (typeof e.className === 'string' && e.className.split(' ')[0]) || e.tagName

  const fixosFora = [], vazando = [], popups = []
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e)
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue
    const r = e.getBoundingClientRect()
    if (r.width < 6 || r.height < 6) continue

    if (s.position === 'fixed') {
      // enfeite (brilho, blob, gradiente) sangra pra fora de propósito e o
      // navegador corta na janela: ninguém perde nada. Só conta como defeito
      // o que tem texto ou o que se clica.
      const temConteudo = (e.innerText || '').trim().length > 0
        || !!e.querySelector('button, a, input, [role="button"]')
      const enfeite = !temConteudo
      if (!enfeite && (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1)) {
        fixosFora.push({ nome: nomear(e).slice(0, 28), z: s.zIndex,
          cx: `${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}`,
          estoura: [r.left < -1 && 'esq', r.right > vw + 1 && 'dir', r.top < -1 && 'topo', r.bottom > vh + 1 && 'base'].filter(Boolean).join('+') })
      }
      // caixa grande e opaca por cima de tudo = pop-up
      if (r.width > 240 && r.height > 160 && Number(s.zIndex) >= 900) {
        popups.push({ nome: nomear(e).slice(0, 26), z: s.zIndex, txt: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 26) })
      }
      continue
    }
    // conteúdo passando da borda, fora de algo que rola de lado de propósito
    if (r.right > vw + 2 && !contido(e)) {
      vazando.push({ nome: nomear(e).slice(0, 28), dir: Math.round(r.right) })
    }
  }
  // pop-ups aninhados contam uma vez só (véu + caixa são o mesmo overlay)
  // véu escuro + caixa são o MESMO overlay: agrupa por texto, e o véu
  // (sem texto próprio) não conta sozinho
  const distintos = [...new Map(popups.filter(p => p.txt.trim()).map(p => [p.txt, p])).values()]
  return { rolaPraLado: document.documentElement.scrollWidth > vw + 2, larguraDoc: document.documentElement.scrollWidth, vw,
           fixosFora, vazando: vazando.slice(0, 4), popups: distintos }
}

if (!fs.existsSync(SESSAO)) { console.error('Sem sessao.'); process.exit(1) }
fs.mkdirSync(OUT, { recursive: true })
const nav = await chromium.launch({ executablePath: CHROMES.find(p => fs.existsSync(p)), headless: true })

let ruins = 0
for (const r of ROTAS) {
  const ctx = await nav.newContext({ storageState: SESSAO, locale: 'pt-BR',
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const pg = await ctx.newPage()
  try {
    await pg.goto(BASE + r, { waitUntil: 'networkidle', timeout: 90000 })
    try { await pg.waitForFunction(() => (document.body.innerText || '').trim().length > 120, { timeout: 12000 }) } catch {}
    await pg.waitForTimeout(3000)
    // bug de rodapé fixo só aparece depois de rolar
    await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await pg.waitForTimeout(1500)
    const m = await pg.evaluate(MEDIR)
    const problemas = []
    if (m.rolaPraLado) problemas.push(`ROLA PRO LADO (${m.larguraDoc}px numa tela de ${m.vw})`)
    for (const f of m.fixosFora) problemas.push(`fixo fora da tela: ${f.nome} (z${f.z}) ${f.cx} — estoura ${f.estoura}`)
    for (const v of m.vazando) problemas.push(`passa da borda: ${v.nome} até ${v.dir}px`)
    if (m.popups.length > 1) problemas.push(`${m.popups.length} pop-ups juntos: ${m.popups.map(p => p.nome + '/' + p.z).join(', ')}`)

    if (problemas.length) { ruins++; console.log(`\nX ${r}`); problemas.forEach(p => console.log('   · ' + p))
      await pg.screenshot({ path: path.join(OUT, r.replace(/\//g, '_') + '.png') }) }
    else console.log(`ok ${r}`)
  } catch (e) { ruins++; console.log(`\nX ${r}  ${String(e.message).slice(0, 60)}`) }
  await ctx.close()
}
await nav.close()
console.log('\n' + '='.repeat(64))
console.log(ruins ? `  ${ruins} de ${ROTAS.length} rotas com defeito no celular.` : `  ${ROTAS.length} rotas, nenhuma quebra no celular.`)

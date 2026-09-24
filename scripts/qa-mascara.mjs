/**
 * A SONDA DA MÁSCARA — o que `overflow-x: hidden` está escondendo.
 *
 * O globals.css tem duas regras que, no celular, ESCONDEM vazamento em vez
 * de corrigir:
 *   html, body { max-width: 100vw; overflow-x: hidden }
 *   @media (max-width: 768px) { * { max-width: 100vw } }
 *
 * Com elas ligadas, "rola pro lado" nunca dispara — mesmo que um card esteja
 * 80px mais largo que a tela, porque o navegador simplesmente corta. Isto
 * desliga as duas EM TEMPO DE EXECUÇÃO (sem rebuild), mede a largura real do
 * documento e lista quem passa da borda. É o mapa do que precisaria ser
 * corrigido de verdade pra máscara poder sair — ou a prova de que ela pode
 * ficar como cinto de segurança porque não há nada por baixo.
 *
 *   node scripts/qa-mascara.mjs --url=http://localhost:3151 --largura=390
 */
import fs from 'fs'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const opt = (n, d) => (args.find(a => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d
const BASE = opt('url', 'http://localhost:3151')
const W = Number(opt('largura', '390'))
const SESSAO = '.telas/sessao.json'
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']

const estadoPara = (base) => {
  const est = JSON.parse(fs.readFileSync(SESSAO, 'utf8'))
  const f = (est.origins || []).find(o => (o.localStorage || []).some(x => /supabase|sb-/.test(x.name)))
  return f ? { cookies: [], origins: [{ origin: new URL(base).origin, localStorage: f.localStorage }] } : est
}

const ROTAS = ['/', '/login', '/signup', '/admin', '/operator', '/meta/193', '/faturamento', '/operadores', '/custos',
               '/redes', '/pix', '/slots', '/planejamento', '/premiacoes', '/network', '/afiliados', '/performance',
               '/tutorial', '/billing', '/billing-mp', '/demo']

const SONDAR = () => {
  // 1) desliga as máscaras
  const st = document.createElement('style')
  st.textContent = 'html, body { overflow-x: visible !important; max-width: none !important; } * { max-width: none !important; }'
  document.head.appendChild(st)
  // força recálculo
  void document.body.offsetWidth
  const vw = innerWidth
  const larg = document.documentElement.scrollWidth
  // 2) quem passa da borda — só o que a pessoa VERIA (fora de overflow hidden local)
  const contido = e => {
    let a = e.parentElement
    while (a && a !== document.body) {
      const s = getComputedStyle(a)
      if (/hidden|clip|auto|scroll/.test(s.overflowX) || /hidden|clip/.test(s.overflow)) return true
      a = a.parentElement
    }
    return false
  }
  const nome = e => (typeof e.className === 'string' && e.className.trim().split(/\s+/)[0]) || e.tagName.toLowerCase()
  const culpados = []
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e)
    if (s.display === 'none' || s.position === 'fixed') continue
    const b = e.getBoundingClientRect()
    if (b.width < 8 || b.height < 8) continue
    if (b.right > vw + 2 && !contido(e)) {
      // o culpado é o MAIS EXTERNO que vaza; filhos dele vazam por tabela
      if (culpados.some(c => c.el.contains(e))) continue
      culpados.push({ el: e, n: nome(e).slice(0, 30), tag: e.tagName, dir: Math.round(b.right), w: Math.round(b.width),
        txt: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 30), pai: e.parentElement ? nome(e.parentElement).slice(0, 24) : '' })
    }
  }
  st.remove()
  return { vw, larg, rola: larg > vw + 2, culpados: culpados.slice(0, 5).map(({ el, ...r }) => r) }
}

const nav = await chromium.launch({ executablePath: CHROMES.find(p => fs.existsSync(p)), headless: true })
let comMascara = 0, semMascara = 0
console.log(`\nSONDA DA MÁSCARA  ${BASE}  ${W}px\n${'─'.repeat(70)}`)
for (const r of ROTAS) {
  const ctx = await nav.newContext({ storageState: estadoPara(BASE), locale: 'pt-BR', viewport: { width: W, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const pg = await ctx.newPage()
  try {
    await pg.goto(BASE + r, { waitUntil: 'networkidle', timeout: 90000 })
    try { await pg.waitForFunction(() => (document.body.innerText || '').trim().length > 100, { timeout: 10000 }) } catch {}
    await pg.waitForTimeout(1500)
    const antes = await pg.evaluate(() => ({ larg: document.documentElement.scrollWidth, vw: innerWidth }))
    const s = await pg.evaluate(SONDAR)
    if (antes.larg > antes.vw + 2) comMascara++
    if (s.rola) semMascara++
    const marca = s.rola ? 'X ' : 'ok'
    console.log(`${marca} ${r.padEnd(16)} com máscara: ${antes.larg}px   sem máscara: ${s.larg}px` + (s.rola ? `   (+${s.larg - s.vw})` : ''))
    for (const c of s.culpados) console.log(`      ↳ <${c.tag.toLowerCase()} .${c.n}> em <${c.pai}>  até ${c.dir}px (larg ${c.w})  "${c.txt}"`)
  } catch (e) { console.log(`?  ${r.padEnd(16)} ${String(e.message).slice(0, 60)}`) }
  await ctx.close()
}
await nav.close()
console.log('─'.repeat(70))
console.log(`  rola pro lado COM a máscara: ${comMascara} rota(s)   ·   SEM a máscara: ${semMascara} rota(s)`)
console.log(semMascara ? '  → a máscara está escondendo vazamento real; os culpados acima são o que corrigir.' : '  → não há vazamento por baixo: a máscara pode ficar como cinto de segurança.')

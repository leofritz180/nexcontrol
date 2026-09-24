/**
 * QA DE LIBERAÇÃO — a Nex Control 2.0 no celular, medida.
 *
 * Isto não é "cabe na tela?". É o que um QA sênior mede antes de liberar
 * pra centenas de pessoas: cada rota, em cada largura de telefone que
 * existe de verdade, com sessão real, ouvindo o console e medindo o que o
 * olho não pega numa foto.
 *
 * POR ROTA × LARGURA:
 *   · rola pro lado?                (scrollWidth > largura da janela)
 *   · algo FIXO com conteúdo sai da tela?   (rodapé, aviso, tutorial)
 *   · input com fonte < 16px?       (o iPhone dá ZOOM sozinho ao focar)
 *   · alvo de toque < 40px?         (botão que o dedo não acerta)
 *   · texto vazando do bloco?       (scrollWidth > clientWidth sem overflow)
 *   · LAYOUT SHIFT: onde os blocos estavam a 700ms vs 3500ms
 *   · erro de console, exceção, hydration, ResizeObserver loop
 *   · dois pop-ups de uma vez
 *
 * O que ISTO NÃO CONSEGUE: Safari de verdade. É Chrome emulando iPhone. O
 * comportamento de 100vh com a barra do Safari, o teclado empurrando a
 * página e a safe-area física só se vê no aparelho — o que dá pra fazer
 * aqui é achar as CAUSAS conhecidas desses bugs no código, e isso o
 * relatório aponta separado.
 *
 *   node scripts/qa-mobile.mjs
 *   node scripts/qa-mobile.mjs --url=http://localhost:3000
 *   node scripts/qa-mobile.mjs --largura=390        (só uma)
 *   node scripts/qa-mobile.mjs --rota=admin         (só uma; SEM a barra)
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const opt = (n, d) => (args.find(a => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d
const BASE = opt('url', 'https://nexcontrol.vercel.app')
const SO_LARG = opt('largura', '')
// sem a barra: o Git Bash converte '/x' em caminho do Windows
const SO_ROTA = (r => r ? '/' + r.replace(/^[\\/]+/, '') : '')(opt('rota', ''))
const SESSAO = '.telas/sessao.json'
const OUT = '.telas/qa'
const CHROMES = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean)

// as larguras que existem de verdade no bolso das pessoas
const LARGURAS = [
  [320, 568, 'iPhone SE 1 / Android pequeno'],
  [360, 780, 'Android comum'],
  [375, 812, 'iPhone 13 mini / X'],
  [390, 844, 'iPhone 13/14/15'],
  [430, 932, 'iPhone Pro Max'],
  [768, 1024, 'tablet'],
  // desktop só entra quando pedido (--largura=1440): é REGRESSÃO, não mobile
  [1440, 900, 'desktop (regressão)'],
].filter(([w]) => SO_LARG ? String(w) === SO_LARG : w !== 1440)

const ROTAS = [
  '/', '/login', '/signup', '/invite', '/reset-password',
  '/admin', '/operator', '/meta/193', '/faturamento', '/operadores', '/custos', '/redes',
  '/pix', '/slots', '/proxy', '/minhas-proxies', '/planejamento', '/premiacoes',
  '/network', '/afiliados', '/equipe', '/performance', '/tutorial', '/aulas',
  '/billing', '/billing-mp', '/demo', '/termos', '/privacidade',
].filter(r => !SO_ROTA || r === SO_ROTA)

// o que roda DENTRO da página
const MEDIR = (fase) => {
  const vw = innerWidth, vh = innerHeight
  const nome = e => (typeof e.className === 'string' && e.className.trim().split(/\s+/)[0]) || e.tagName.toLowerCase()
  const visivel = (e, s) => s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'
  const contido = e => {
    let a = e.parentElement
    while (a && a !== document.body) {
      const s = getComputedStyle(a)
      if (/auto|scroll/.test(s.overflowX) && a.scrollWidth > a.clientWidth + 2) return true
      if (/hidden|clip/.test(s.overflowX) || /hidden|clip/.test(s.overflow)) return true
      a = a.parentElement
    }
    return false
  }
  const temConteudo = e => (e.innerText || '').trim().length > 0 || !!e.querySelector('button,a,input,[role="button"]')

  const r = { fixosFora: [], inputsPequenos: [], alvosPequenos: [], textoVaza: [], vazando: [], popups: [] }
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e)
    if (!visivel(e, s)) continue
    const b = e.getBoundingClientRect()
    if (b.width < 4 || b.height < 4) continue

    if (s.position === 'fixed') {
      if (temConteudo(e) && (b.left < -1 || b.right > vw + 1 || b.top < -1 || b.bottom > vh + 1))
        r.fixosFora.push({ n: nome(e).slice(0, 26), cx: `${Math.round(b.left)},${Math.round(b.top)}→${Math.round(b.right)},${Math.round(b.bottom)}` })
      if (b.width > 240 && b.height > 160 && Number(s.zIndex) >= 900 && (e.innerText || '').trim())
        r.popups.push({ n: nome(e).slice(0, 22), z: s.zIndex, t: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 24) })
      continue
    }
    if (b.right > vw + 2 && !contido(e)) r.vazando.push({ n: nome(e).slice(0, 26), dir: Math.round(b.right) })

    const tag = e.tagName
    if ((tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') && !/checkbox|radio|hidden|range|color|file/.test(e.type || '')) {
      const fs = parseFloat(s.fontSize)
      if (fs < 16) r.inputsPequenos.push({ n: (e.placeholder || e.name || e.type || 'input').slice(0, 22), fs })
    }
    if (tag === 'BUTTON' || tag === 'A' || e.getAttribute('role') === 'button') {
      if (b.width > 0 && (b.width < 40 || b.height < 40) && (b.width < 32 || b.height < 32))
        r.alvosPequenos.push({ n: ((e.innerText || e.getAttribute('aria-label') || e.title || nome(e)).replace(/\s+/g, ' ').slice(0, 20)), w: Math.round(b.width), h: Math.round(b.height) })
    }
    // texto vazando: bloco com overflow visível cujo conteúdo é mais largo que ele
    if (s.overflowX === 'visible' && e.scrollWidth > e.clientWidth + 6 && e.clientWidth > 40 && e.children.length === 0 && (e.innerText || '').trim().length > 8)
      r.textoVaza.push({ n: nome(e).slice(0, 22), t: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 24), extra: e.scrollWidth - e.clientWidth })
  }
  // shift honesto: o primeiro título que a pessoa vê, e a altura da página
  const titulo = [...document.querySelectorAll('h1, h2')].find(e => { const b = e.getBoundingClientRect(); return b.height > 0 && b.width > 0 })
  const marcos = { tituloY: titulo ? Math.round(titulo.getBoundingClientRect().top + scrollY) : null, tituloTxt: titulo ? (titulo.innerText || '').slice(0, 30) : '', altura: document.documentElement.scrollHeight }
  const popDistintos = [...new Map(r.popups.map(p => [p.t, p])).values()]
  return {
    fase, vw, rolaLado: document.documentElement.scrollWidth > vw + 2, larguraDoc: document.documentElement.scrollWidth,
    fixosFora: r.fixosFora.slice(0, 4), vazando: r.vazando.slice(0, 4), inputsPequenos: r.inputsPequenos.slice(0, 6),
    alvosPequenos: r.alvosPequenos.slice(0, 6), textoVaza: r.textoVaza.slice(0, 4), popups: popDistintos, marcos,
    txt: (document.body.innerText || '').trim().length, onde: location.pathname,
  }
}

if (!fs.existsSync(SESSAO)) { console.error('Sem sessão. node scripts/telas.mjs --link'); process.exit(1) }
// A sessão do Supabase vive no localStorage e é presa à ORIGEM em que foi
// salva (nexcontrol.vercel.app). Pra medir um build local, o mesmo token é
// reescrito pra origem alvo — senão toda rota logada vira a tela de login e
// a medição é da página errada (foi exatamente o que aconteceu na primeira
// tentativa: cinco rotas "medidas" eram o /login).
const estadoPara = (base) => {
  const est = JSON.parse(fs.readFileSync(SESSAO, 'utf8'))
  const alvo = new URL(base).origin
  const fonte = (est.origins || []).find(o => (o.localStorage || []).some(x => /supabase|sb-/.test(x.name)))
  if (!fonte) return est
  return { cookies: [], origins: [{ origin: alvo, localStorage: fonte.localStorage }] }
}
fs.mkdirSync(OUT, { recursive: true })
const nav = await chromium.launch({ executablePath: CHROMES.find(p => fs.existsSync(p)), headless: true })
const relatorio = []

for (const [w, h, rotulo] of LARGURAS) {
  console.log(`\n${'━'.repeat(70)}\n  ${w}×${h}  ${rotulo}\n${'━'.repeat(70)}`)
  for (const rota of ROTAS) {
    const ctx = await nav.newContext({ storageState: estadoPara(BASE), locale: 'pt-BR', viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 700, hasTouch: w < 700 })
    const pg = await ctx.newPage()
    const console_ = [], excecoes = [], rede = []
    pg.on('console', m => { const t = m.text(); if (m.type() === 'error' || /ResizeObserver|hydrat|Warning: /i.test(t)) console_.push(t.slice(0, 150)) })
    pg.on('pageerror', e => excecoes.push(String(e).slice(0, 150)))
    pg.on('response', r => { if (r.status() >= 500) rede.push(`${r.status()} ${r.url().replace(BASE, '').slice(0, 60)}`) })
    const item = { rota, w, h }
    try {
      await pg.goto(BASE + rota, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await pg.waitForTimeout(700)
      const cedo = await pg.evaluate(MEDIR, 'cedo')
      try { await pg.waitForFunction(() => (document.body.innerText || '').trim().length > 100, { timeout: 12000 }) } catch {}
      await pg.waitForTimeout(2800)
      const tarde = await pg.evaluate(MEDIR, 'tarde')
      // layout shift: blocos que existiam cedo e mudaram de lugar
      // só conta se o MESMO título mudou de lugar; título trocado é carregamento, não pulo
      const shift = (cedo.marcos.tituloY != null && tarde.marcos.tituloY != null && cedo.marcos.tituloTxt === tarde.marcos.tituloTxt)
        ? Math.abs(tarde.marcos.tituloY - cedo.marcos.tituloY) : 0
      // depois de rolar até o fim: rodapé fixo, últimos cards
      await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(900)
      const fim = await pg.evaluate(MEDIR, 'fim')
      Object.assign(item, {
        desviou: tarde.onde !== rota && !tarde.onde.startsWith(rota) ? tarde.onde : null,
        rolaLado: tarde.rolaLado || fim.rolaLado, larguraDoc: Math.max(tarde.larguraDoc, fim.larguraDoc),
        fixosFora: [...tarde.fixosFora, ...fim.fixosFora].slice(0, 4), vazando: tarde.vazando, inputsPequenos: tarde.inputsPequenos,
        alvosPequenos: tarde.alvosPequenos, textoVaza: tarde.textoVaza, popups: tarde.popups, shift, txt: tarde.txt,
        console: [...new Set(console_)].slice(0, 4), excecoes: [...new Set(excecoes)].slice(0, 3), rede: rede.slice(0, 3),
      })
    } catch (e) { item.erro = String(e.message).slice(0, 80) }
    relatorio.push(item)

    const p = []
    if (item.erro) p.push('ERRO ' + item.erro)
    if (item.desviou) p.push('desviou→' + item.desviou)
    if (item.rolaLado) p.push(`ROLA-LADO ${item.larguraDoc}px`)
    if (item.fixosFora?.length) p.push('fixo-fora:' + item.fixosFora.map(f => f.n).join(','))
    if (item.vazando?.length) p.push('vaza:' + item.vazando.map(v => v.n + '→' + v.dir).join(','))
    if (item.inputsPequenos?.length) p.push(`input<16px×${item.inputsPequenos.length}`)
    if (item.alvosPequenos?.length) p.push(`toque<40px×${item.alvosPequenos.length}`)
    if (item.textoVaza?.length) p.push('texto-vaza×' + item.textoVaza.length)
    if (item.popups?.length > 1) p.push(`${item.popups.length}popups`)
    if (item.shift > 24) p.push(`shift ${item.shift}px`)
    if (item.excecoes?.length) p.push('EXCEÇÃO')
    if (item.console?.length) p.push(`console×${item.console.length}`)
    if (item.rede?.length) p.push('HTTP5xx')
    console.log(`  ${(p.length ? 'X' : 'ok').padEnd(3)}${rota.padEnd(16)} ${p.join('  ')}`)
    if (p.length) await pg.screenshot({ path: path.join(OUT, `${w}${rota.replace(/\//g, '_')}.png`) }).catch(() => {})
    await ctx.close()
  }
}
await nav.close()
fs.writeFileSync(path.join(OUT, 'relatorio.json'), JSON.stringify(relatorio, null, 1))
const ruins = relatorio.filter(i => i.erro || i.rolaLado || i.fixosFora?.length || i.vazando?.length || i.inputsPequenos?.length || i.alvosPequenos?.length || i.textoVaza?.length || i.popups?.length > 1 || i.shift > 24 || i.excecoes?.length || i.console?.length)
console.log(`\n${'═'.repeat(70)}\n  ${relatorio.length} medições · ${ruins.length} com algo a ver · detalhes em ${OUT}/relatorio.json`)

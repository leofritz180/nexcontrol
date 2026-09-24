/**
 * QA DE INTERAÇÃO — o que só aparece USANDO o app no celular.
 *
 * A varredura estática mede uma tela parada. Isto mede o que treme, pula ou
 * trava quando a pessoa MEXE:
 *   1. ping-pong de navegação (admin→faturamento→operadores→admin ×3):
 *      a largura do documento muda? sobrou overlay invisível bloqueando?
 *   2. drawer do menu: abrir trava o body? fechar destrava? navegar fecha?
 *   3. abas de planos na landing (sozinho/equipe ×6): a altura da seção
 *      oscila? aparece rolagem lateral?
 *   4. foco em input no login/cadastro: a largura muda? e a CAUSA do zoom do
 *      iPhone — fonte < 16px — está tratada? (o Chrome não amplia; o que se
 *      confere aqui é a causa)
 *   5. paisagem 844×390: rola pro lado? algo fixo fora?
 *
 *   node scripts/qa-interacao.mjs
 *   node scripts/qa-interacao.mjs --prod=https://nexcontrol.vercel.app --local=http://localhost:3141
 */
import fs from 'fs'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const opt = (n, d) => (args.find(a => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d
const PROD = opt('prod', 'https://nexcontrol.vercel.app')
const LOCAL = opt('local', 'http://localhost:3141')
const SESSAO = '.telas/sessao.json'
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']

// a sessão é presa à origem em que foi salva; reescreve pra origem alvo
const estadoPara = (base) => {
  const est = JSON.parse(fs.readFileSync(SESSAO, 'utf8'))
  const f = (est.origins || []).find(o => (o.localStorage || []).some(x => /supabase|sb-/.test(x.name)))
  return f ? { cookies: [], origins: [{ origin: new URL(base).origin, localStorage: f.localStorage }] } : est
}

const nav = await chromium.launch({ executablePath: CHROMES.find(p => fs.existsSync(p)), headless: true })
const fone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'pt-BR' }

const medida = () => ({
  larg: document.documentElement.scrollWidth, vw: innerWidth, alt: document.documentElement.scrollHeight,
  bodyOverflow: getComputedStyle(document.body).overflow,
  // overlay invisível que ainda captura o toque: fixo, cobre a tela, opacidade 0, pointer-events ativo
  overlayFantasma: [...document.querySelectorAll('body *')].some(e => {
    const s = getComputedStyle(e); const b = e.getBoundingClientRect()
    return s.position === 'fixed' && b.width >= innerWidth * 0.9 && b.height >= innerHeight * 0.9
      && (s.opacity === '0' || s.visibility === 'hidden') && s.pointerEvents !== 'none' && s.display !== 'none'
  }),
})
const silenciar = async pg => {
  let fechou = false
  // até 3 rodadas: fechar o onboarding (3 passos) faz o coordenador soltar o
  // próximo da fila (o Bem-vindo 2.0), que também tem 'Pular' — uma passada
  // só deixava o segundo aberto e o teste da gaveta batia nele.
  for (let rodada = 0; rodada < 3; rodada++) {
    let algum = false
    for (const t of ['Agora não', 'Agora nao', 'Pular', 'Entendi', 'Fechar', 'Pronto', 'Começar']) {
      try { const b = pg.getByRole('button', { name: t }); if (await b.count()) { await b.first().click({ timeout: 800 }); fechou = true; algum = true } } catch {}
    }
    if (!algum) break
    await pg.waitForTimeout(700)
  }
  // fechar um pop-up dispara a animação de saída dele: por ~300ms ele ainda
  // existe, com opacidade caindo e pointer-events ativo. Medir nesse instante
  // acusa 'overlay fantasma' e 'fixo fora' que não existem um segundo depois.
  if (fechou) await pg.waitForTimeout(700)
}

// Marca os pop-ups de primeira entrada como já vistos ANTES de carregar: o
// teste do drawer quer medir o drawer, não o bem-vindo/convite/anúncio que
// sobem por cima dele numa sessão nova (e que já têm testes próprios).
const semPopups = async (pg, base) => {
  await pg.goto(base + '/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await pg.evaluate(() => {
    const dono = Object.keys(localStorage).find(k => /sb-.*-auth-token/.test(k)); let mail = 'leofritz180@gmail.com'
    try { mail = JSON.parse(localStorage.getItem(dono)).user.email } catch {}
    const m = mail.toLowerCase()
    localStorage.setItem('nx_bemvindo_20_' + m, '1'); localStorage.setItem('nx_convite_noir_' + m, '1')
    localStorage.setItem('nexcontrol_onboarded', '1'); localStorage.setItem('nexcontrol_install_done', '1')
    for (const id of ['admin','admin-myops','admin-operations','admin-trash','faturamento','operadores','custos','redes','pix','slots','afiliados','aulas','operator','tutorial','proxy','planejamento','premiacoes','performance']) localStorage.setItem('nx_tour_completed_' + id, '1')
  })
  await pg.evaluate(() => { try { sessionStorage.setItem('nx_bettify_promo_v1', '1'); sessionStorage.setItem('bettify_promo_seen', '1') } catch {} })
}
let falhas = 0
const X = m => { falhas++; console.log('  X  ' + m) }
const ok = m => console.log('  ok ' + m)

// ── 1. ping-pong de navegação ─────────────────────────────────────────
try {
  console.log('\n1) PING-PONG DE NAVEGAÇÃO  (' + PROD + ')')
  const ctx = await nav.newContext({ storageState: estadoPara(PROD), ...fone })
  const pg = await ctx.newPage()
  const erros = []; pg.on('pageerror', e => erros.push(String(e).slice(0, 100)))
  const larguras = new Set(); let fantasma = false
  for (let i = 0; i < 3; i++) for (const r of ['/admin', '/faturamento', '/operadores', '/admin']) {
    await pg.goto(PROD + r, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await pg.waitForTimeout(2200); await silenciar(pg)
    const m = await pg.evaluate(medida); larguras.add(m.larg); if (m.overlayFantasma) fantasma = true
    if (m.larg > m.vw + 2) X(r + ': documento ' + m.larg + 'px numa janela de ' + m.vw + ' (rola pro lado)')
  }
  larguras.size === 1 ? ok('largura do documento estável em ' + [...larguras][0] + 'px ao longo de 12 trocas') : X('largura do documento oscilou: ' + [...larguras].join(', '))
  fantasma ? X('overlay invisível ficou capturando toques depois de navegar') : ok('nenhum overlay fantasma depois de navegar')
  erros.length ? X('exceções: ' + [...new Set(erros)].join(' | ')) : ok('zero exceções em 12 navegações')
  await ctx.close()
} catch (e) { X('seção abortou: ' + String(e.message).slice(0, 90)) }

// ── 2. drawer do menu ────────────────────────────────────────────────
try {
  console.log('\n2) DRAWER DO MENU  (' + LOCAL + ')')
  const ctx = await nav.newContext({ storageState: estadoPara(LOCAL), ...fone })
  const pg = await ctx.newPage()
  await semPopups(pg, LOCAL)
  await pg.goto(LOCAL + '/admin', { waitUntil: 'networkidle', timeout: 90000 })
  await pg.waitForTimeout(3000); await silenciar(pg)
  // na 2.0 o menu do celular é o item 'Menu' da barra inferior (.nx-barra-app); o
  // hambúrguer antigo existe no DOM mas fica oculto
  const gatilho = () => pg.locator('.nx-barra-app button:has-text("Menu"), .nx-barra-app a:has-text("Menu"), .sidebar-mobile-toggle:visible').first()
  if (!(await gatilho().count())) X('não achei o botão do menu mobile')
  else {
    await gatilho().click(); await pg.waitForTimeout(700)
    const aberto = await pg.evaluate(medida)
    aberto.bodyOverflow === 'hidden' ? ok('drawer aberto → body travado') : X('drawer aberto mas o body continua rolando (overflow=' + aberto.bodyOverflow + ')')
    const dentro = await pg.evaluate(() => [...document.querySelectorAll('aside')].some(a => { const b = a.getBoundingClientRect(); return b.width > 100 && b.left >= -1 && b.right <= innerWidth + 1 }))
    dentro ? ok('drawer dentro da tela') : X('drawer fora da tela ou não abriu')
    const link = pg.locator('aside').getByRole('link', { name: /Faturamento/i }).first()
    try { await link.scrollIntoViewIfNeeded({ timeout: 3000 }) } catch {}
    if (await link.count()) {
      await link.click(); await pg.waitForTimeout(2500)
      const depois = await pg.evaluate(medida)
      depois.bodyOverflow !== 'hidden' ? ok('navegou pelo drawer → body destravado') : X('body FICOU travado depois de navegar pelo drawer')
      const aindaAberto = await pg.evaluate(() => [...document.querySelectorAll('aside')].some(a => a.getBoundingClientRect().width > 100 && getComputedStyle(a).position === 'fixed'))
      aindaAberto ? X('drawer continua aberto depois de navegar') : ok('drawer fechou ao navegar')
    } else X('não achei link do drawer pra /faturamento')
    for (let i = 0; i < 5; i++) {
      try { await gatilho().click({ timeout: 2000 }); await pg.waitForTimeout(400); await pg.mouse.click(370, 300); await pg.waitForTimeout(400) } catch {}
    }
    const fim = await pg.evaluate(medida)
    fim.bodyOverflow !== 'hidden' ? ok('5× abrir/fechar → body destravado no fim') : X('body travado depois de abrir/fechar 5×')
    fim.larg <= fim.vw + 2 ? ok('sem rolagem lateral depois do estresse do menu') : X('rolagem lateral depois do menu: ' + fim.larg + 'px')
  }
  await ctx.close()
} catch (e) { X('seção abortou: ' + String(e.message).slice(0, 90)) }

// ── 3. abas de planos na landing ─────────────────────────────────────
try {
  console.log('\n3) ABAS DE PLANOS ×6  (' + PROD + ')')
  const ctx = await nav.newContext({ ...fone })
  const pg = await ctx.newPage()
  await pg.goto(PROD + '/#planos', { waitUntil: 'networkidle', timeout: 90000 })
  await pg.waitForTimeout(2500)
  const alturas = [], largs = []
  for (let i = 0; i < 6; i++) {
    const aba = i % 2 ? 'Trabalho sozinho' : 'Tenho uma equipe'
    try { await pg.getByText(aba, { exact: true }).click({ timeout: 3000 }) } catch { X('não achei a aba ' + aba); break }
    await pg.waitForTimeout(700)
    const m = await pg.evaluate(() => { const s = document.querySelector('.nv2-planos'); return { alt: s ? Math.round(s.getBoundingClientRect().height) : 0, larg: document.documentElement.scrollWidth, vw: innerWidth, n: s ? s.getAttribute('data-n') : '?' } })
    alturas.push(m.n + ':' + m.alt); largs.push(m.larg)
    if (m.larg > m.vw + 2) X('aba ' + aba + ': rolagem lateral (' + m.larg + 'px)')
  }
  ok('alturas por aba: ' + alturas.join(' → '))
  const porAba = {}; alturas.forEach(a => { const [n, h] = a.split(':'); (porAba[n] = porAba[n] || new Set()).add(h) })
  Object.values(porAba).every(s => s.size === 1) ? ok('cada aba repete a mesma altura (sem oscilação)') : X('a mesma aba mudou de altura entre trocas: ' + JSON.stringify(Object.fromEntries(Object.entries(porAba).map(([k, v]) => [k, [...v]]))))
  new Set(largs).size === 1 && largs[0] <= 392 ? ok('largura do documento estável nas 6 trocas') : X('largura oscilou: ' + [...new Set(largs)].join(','))
  await ctx.close()
} catch (e) { X('seção abortou: ' + String(e.message).slice(0, 90)) }

// ── 4. foco em input ─────────────────────────────────────────────────
try {
  console.log('\n4) FOCO EM INPUT — /login e /signup  (' + LOCAL + ')')
  const ctx = await nav.newContext({ ...fone })
  const pg = await ctx.newPage()
  for (const r of ['/login', '/signup']) {
    await pg.goto(LOCAL + r, { waitUntil: 'networkidle', timeout: 90000 }); await pg.waitForTimeout(1500)
    const antes = await pg.evaluate(medida)
    const campos = await pg.$$('input:not([type=checkbox]):not([type=hidden])')
    let menor = 99
    for (const c of campos) { await c.focus().catch(() => {}); await pg.waitForTimeout(150); const fs = await c.evaluate(e => parseFloat(getComputedStyle(e).fontSize)); menor = Math.min(menor, fs) }
    await pg.keyboard.press('Tab'); await pg.waitForTimeout(300)
    const depois = await pg.evaluate(medida)
    menor >= 16 ? ok(r + ': menor fonte de input = ' + menor + 'px (o iPhone não amplia)') : X(r + ': input com ' + menor + 'px — o iPhone AMPLIA ao focar')
    antes.larg === depois.larg && depois.larg <= depois.vw + 2 ? ok(r + ': largura igual antes/depois de percorrer os campos (' + depois.larg + 'px)') : X(r + ': largura mudou ' + antes.larg + '→' + depois.larg)
  }
  await ctx.close()
} catch (e) { X('seção abortou: ' + String(e.message).slice(0, 90)) }

// ── 5. paisagem ──────────────────────────────────────────────────────
try {
  console.log('\n5) PAISAGEM 844×390  (' + PROD + ')')
  const ctx = await nav.newContext({ storageState: estadoPara(PROD), viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'pt-BR' })
  const pg = await ctx.newPage()
  for (const r of ['/', '/admin', '/faturamento', '/login']) {
    await pg.goto(PROD + r, { waitUntil: 'domcontentloaded', timeout: 60000 }); await pg.waitForTimeout(2500); await silenciar(pg)
    const m = await pg.evaluate(() => {
      const vw = innerWidth, vh = innerHeight
      const fixosFora = [...document.querySelectorAll('body *')].filter(e => {
        const s = getComputedStyle(e); if (s.position !== 'fixed' || s.display === 'none' || s.opacity === '0') return false
        const b = e.getBoundingClientRect()
        return b.width > 6 && b.height > 6 && ((e.innerText || '').trim() || e.querySelector('button,a')) && (b.left < -1 || b.right > vw + 1 || b.top < -1 || b.bottom > vh + 1)
      }).map(e => { const b = e.getBoundingClientRect(); return ((typeof e.className === 'string' && e.className.split(' ')[0]) || e.tagName) + '[' + Math.round(b.left) + ',' + Math.round(b.top) + '→' + Math.round(b.right) + ',' + Math.round(b.bottom) + ' op ' + getComputedStyle(e).opacity + '] "' + (e.innerText || '').replace(/s+/g, ' ').slice(0, 24) + '"' })
      return { larg: document.documentElement.scrollWidth, vw, fixosFora: fixosFora.length, quem: fixosFora.slice(0, 3), txt: (document.body.innerText || '').trim().length }
    })
    const probs = []
    if (m.larg > m.vw + 2) probs.push('rola pro lado ' + m.larg + 'px')
    if (m.fixosFora) probs.push(m.fixosFora + ' fixo(s) fora: ' + m.quem.join(' | '))
    if (m.txt < 100) probs.push('tela vazia')
    probs.length ? X(r + ': ' + probs.join(', ')) : ok(r + ': inteira em paisagem')
  }
  await ctx.close()
} catch (e) { X('seção abortou: ' + String(e.message).slice(0, 90)) }

await nav.close()
console.log('\n' + '═'.repeat(60))
console.log('  ' + (falhas ? falhas + ' falha(s) de interação.' : 'Interação estável em todos os cenários.'))

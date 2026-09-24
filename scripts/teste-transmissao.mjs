// Teste de duas pontas da transmissão de tela. Antes: node scripts/transmissao-op-temp.mjs (cria o operador
// temporário e a sessão dele); depois: node scripts/transmissao-op-temp.mjs --apagar.
// Duas pontas de verdade: o operador (conta temporária) transmite de um
// navegador, o admin assiste em outro. getDisplayMedia é trocado por um
// canvas animado — o WebRTC, a sinalização e a presença são os reais.
import fs from 'fs'
import { chromium } from 'playwright-core'
const BASE = process.argv[2] || 'http://localhost:3301'
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
const sess = (arq) => { const est = JSON.parse(fs.readFileSync(arq, 'utf8')); const f = est.origins.find(o => o.localStorage.some(x => /sb-/.test(x.name))); return { cookies: [], origins: [{ origin: BASE, localStorage: f.localStorage }] } }
const nav = await chromium.launch({ executablePath: CHROMES.find(p => fs.existsSync(p)), headless: true, args: ['--use-fake-ui-for-media-stream'] })
const dispensar = async pg => { for (let r = 0; r < 10; r++) { let algum = false; if (await pg.getByText('Toque fora pra fechar').count().catch(() => 0)) { await pg.mouse.click(8, 400); algum = true; await pg.waitForTimeout(700) } const cd = pg.getByText('Confirmar depois', { exact: true }).first(); if (await cd.count().catch(() => 0)) { await cd.click({ timeout: 2000 }).catch(() => {}); algum = true; await pg.waitForTimeout(600) } await pg.keyboard.press('Escape').catch(() => {}); for (const n of ['Pular', 'Sair', 'Fechar', 'Agora nao', 'Agora não', 'Entendi', 'Depois', 'Agora não, obrigado']) { const b = pg.getByRole('button', { name: n, exact: true }).first(); if (await b.count().catch(() => 0)) { await b.click({ timeout: 2000 }).catch(() => {}); algum = true; await pg.waitForTimeout(600) } } if (!algum) break } }

// ── OPERADOR ──
const ctxOp = await nav.newContext({ storageState: sess('.telas/sessao-op.json'), viewport: { width: 1280, height: 800 }, locale: 'pt-BR' })
const op = await ctxOp.newPage(); const errosOp = []; op.on('pageerror', e => errosOp.push(e.message.slice(0, 120)))
await op.addInitScript(() => {
  // tela falsa: um canvas com relógio andando (pra ter frames de verdade)
  navigator.mediaDevices.getDisplayMedia = async () => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const g = c.getContext('2d')
    setInterval(() => { g.fillStyle = '#111'; g.fillRect(0, 0, 640, 360); g.fillStyle = '#e5391f'; g.font = '48px monospace'; g.fillText(new Date().toLocaleTimeString(), 120, 200) }, 100)
    return c.captureStream(10)
  }
})
await op.goto(BASE + '/operator', { waitUntil: 'networkidle', timeout: 90000 }); await op.waitForTimeout(3000); await dispensar(op)
const btn = op.getByRole('button', { name: /Transmitir/ }).first()
console.log('operador: botão Transmitir visível?', await btn.count())
const pushResp = op.waitForResponse(r => r.url().includes('/api/push/send'), { timeout: 20000 }).catch(() => null)
await op.evaluate(() => { const t = document.elementFromPoint(640, 400); console.log('cobre:', t && (t.className || t.tagName), (t && t.innerText || '').slice(0, 60)) }); await btn.click({ force: true }); await op.waitForTimeout(2500)
console.log('operador: pílula AO VIVO?', await op.getByText('AO VIVO', { exact: true }).count(), '| push:', await pushResp.then(r => r && r.status() + ' ' + '') )
await op.screenshot({ path: '.telas/qa/tela-operador.png' })

// ── ADMIN ──
const ctxAd = await nav.newContext({ storageState: sess('.telas/sessao.json'), viewport: { width: 1280, height: 800 }, locale: 'pt-BR' })
const ad = await ctxAd.newPage(); const errosAd = []; ad.on('pageerror', e => errosAd.push(e.message.slice(0, 120)))
await ad.goto(BASE + '/operadores', { waitUntil: 'networkidle', timeout: 90000 }); await ad.waitForTimeout(3000); await dispensar(ad)
console.log('admin /operadores: faixa "transmitindo"?', await ad.getByText(/transmitindo a tela/).count(), '| AO VIVO no ranking?', await ad.getByText(/AO VIVO/).count())
await ad.goto(BASE + '/sala', { waitUntil: 'networkidle', timeout: 90000 }); await ad.waitForTimeout(2500); await dispensar(ad)
console.log('admin /sala: cartão do operador?', await ad.getByText('Teste Transmissão').count())
await ad.getByRole('button', { name: 'Assistir' }).first().click()
let ok = false
for (let i = 0; i < 30; i++) {
  await ad.waitForTimeout(500)
  const v = await ad.evaluate(() => { const v = document.querySelector('video'); return v ? { w: v.videoWidth, rs: v.readyState, t: v.currentTime } : null })
  if (v && v.w > 0 && v.t > 0) { ok = true; console.log('admin: VÍDEO CHEGOU', JSON.stringify(v), 'em ~' + (i + 1) * 0.5 + 's'); break }
}
if (!ok) console.log('admin: vídeo NÃO chegou em 15s')
await ad.waitForTimeout(1500)
console.log('admin: estado na tela:', (await ad.locator('body').innerText()).match(/AO VIVO|INSTÁVEL|Não deu pra conectar|Conectando/)?.[0], '| operador vê espectadores:', (await op.locator('body').innerText()).match(/\d+ assistindo/)?.[0])
await ad.screenshot({ path: '.telas/qa/tela-admin.png' })
// operador para → admin vê "encerrou"
await op.getByRole('button', { name: /Parar/ }).first().click(); await ad.waitForTimeout(2500)
console.log('admin após parar:', (await ad.locator('body').innerText()).match(/encerrou a transmissão|Ninguém transmitindo/)?.[0] || 'sem aviso')
console.log('exceções op:', errosOp, '| admin:', errosAd)
await nav.close()

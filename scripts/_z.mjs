import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'
const CH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'https://nexcontrol.vercel.app'
const PASTA = path.join(process.cwd(), '.telas')
const [, , rota, nome, ys, hs, larg] = process.argv
const y = Number(ys || 0), h = Number(hs || 900), W = Number(larg || 1440)
const b = await chromium.launch({ executablePath: CH })
const ctx = await b.newContext({
  storageState: path.join(PASTA, 'sessao.json'),
  viewport: { width: W, height: W < 500 ? 844 : 900 }, deviceScaleFactor: 2, locale: 'pt-BR',
})
await ctx.addInitScript(() => {
  const L = ['nexcontrol_install_done','nexcontrol_just_signed_up','nexcontrol_onboarded','nx_phone_ok','nx_network_launch_seen_v1','nexVoiceAnnounce_v1','nx_dock_seen_v1']
  const S = ['nx_bettify_promo_v1_sessao','nx_push_prompt_shown','nx_upgrade_bar_dismissed']
  try {
    L.forEach(k => localStorage.setItem(k, k === 'nexcontrol_install_done' ? String(Date.now()) : '1'))
    S.forEach(k => sessionStorage.setItem(k, '1'))
    const o = localStorage.getItem.bind(localStorage)
    localStorage.getItem = k => /^nx_(tour_completed_|bemvindo_20_|firstmeta_wizard_dismissed_)/.test(String(k)) ? '1' : o(k)
  } catch {}
})
const pg = await ctx.newPage()
await pg.goto(BASE + rota, { waitUntil: 'networkidle', timeout: 60000 })
await pg.waitForTimeout(2800)
for (const t of ['Sair','Agora não','Pular','Entendi','Fechar']) {
  try { const el = pg.getByRole('button', { name: t, exact: false }).first()
    if (await el.isVisible({ timeout: 250 })) { await el.click({ timeout: 900 }); await pg.waitForTimeout(400) } } catch {}
}
const arq = path.join(PASTA, nome + '.png')
await pg.screenshot({ path: arq, fullPage: true, clip: { x: 0, y, width: W, height: h } })
await b.close()
console.log('→ ' + arq)

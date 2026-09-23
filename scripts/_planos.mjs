import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'
const CHROMES = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
const nav = await chromium.launch({ executablePath: CHROMES.find(p => fs.existsSync(p)), headless: true })
const OUT = '.telas/planos'; fs.mkdirSync(OUT, { recursive: true })
for (const [w, h, nome] of [[1360, 950, 'desktop'], [900, 1000, 'tablet'], [390, 900, 'mobile']]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: nome === 'mobile' ? 2 : 1, isMobile: nome === 'mobile', locale: 'pt-BR' })
  const pg = await ctx.newPage()
  await pg.goto('https://nexcpa.com.br/v2#planos', { waitUntil: 'networkidle', timeout: 90000 })
  await pg.waitForTimeout(3000)
  try { await pg.getByText('Tenho uma equipe').click({ timeout: 4000 }) } catch {}
  await pg.waitForTimeout(1500)
  const el = await pg.$('.nv2-planos')
  if (el) await el.scrollIntoViewIfNeeded()
  await pg.waitForTimeout(900)
  const n = await pg.evaluate(() => document.querySelector('.nv2-planos')?.getAttribute('data-n'))
  const cols = await pg.evaluate(() => { const e = document.querySelector('.nv2-planos'); return e ? getComputedStyle(e).gridTemplateColumns.split(' ').length : 0 })
  const temDupla = await pg.evaluate(() => (document.body.innerText || '').includes('Dupla'))
  await pg.screenshot({ path: path.join(OUT, nome + '.png') })
  console.log(`${nome.padEnd(8)} cartoes=${n} colunas=${cols} temDupla=${temDupla ? 'SIM' : 'NAO'}`)
  await ctx.close()
}
await nav.close()

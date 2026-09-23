/**
 * A ARTE DE COMPARTILHAMENTO DA /v2 — 1200x630.
 *
 * POR QUE NAO SERVIA A CAPTURA DO PAINEL: ela e 3200x2000, proporcao 1,6:1.
 * WhatsApp, Twitter e LinkedIn mostram 1,91:1 e cortam o resto — a arte
 * chegava decapitada, com metade de um card no meio. Uma imagem feita na
 * medida certa nao e capricho: e a diferenca entre o link parecer produto e
 * parecer print.
 *
 * O que entra aqui e SO o que existe: nome, a frase da propria landing e a
 * marca. Nenhum numero, nenhum selo, nenhum depoimento.
 *
 *   node scripts/og.mjs
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const navegador = CHROMES.find(p => fs.existsSync(p))
if (!navegador) { console.error('Nenhum Chrome/Edge encontrado.'); process.exit(1) }

const SAIDA = path.join('public', 'landing', 'v2', 'og.png')

// a mesma geometria do N usada na landing e no upsell
const N = `
  <svg viewBox="0 0 100 103" style="width:100%;height:100%">
    <path d="M0 9.3 31.2 41.6 31.2 100 0 67.4Z" fill="#F4F4F1"/>
    <path d="M68.8 2.5 100 35.1 100 93.2 68.8 60.9Z" fill="#F4F4F1"/>
    <path d="M0 9.3 0 2.5 33.6 2.5 100 73.2 100 100 85.3 100Z" fill="#C8F21D"/>
  </svg>`

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@600&family=Inter:wght@400;700&display=swap">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#0D0E0F;font-family:Inter,sans-serif;overflow:hidden;position:relative}
  .marca{position:absolute;right:-90px;top:-70px;width:560px;height:560px;opacity:0.07;
         -webkit-mask-image:radial-gradient(ellipse 70% 70% at 58% 34%,#000 18%,transparent 76%)}
  .corpo{position:relative;padding:74px 80px;height:100%;display:flex;flex-direction:column;justify-content:space-between}
  .olho{display:inline-flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;
        font-size:16px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#9A9E9F}
  .ponto{width:9px;height:9px;border-radius:50%;background:#C8F21D}
  h1{font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:82px;line-height:1.02;
     letter-spacing:-0.025em;color:#F4F4F1;max-width:830px}
  h1 em{font-style:normal;color:#C8F21D}
  p{font-size:23px;line-height:1.5;color:#9A9E9F;max-width:720px;margin-top:26px}
  .rodape{display:flex;align-items:center;justify-content:space-between}
  .selo{width:44px;height:44px}
  .end{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:600;
       letter-spacing:0.13em;text-transform:uppercase;color:#9A9E9F}
  .filete{height:1px;background:linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.01));margin-bottom:30px}
</style></head><body>
  <div class="marca">${N}</div>
  <div class="corpo">
    <span class="olho"><span class="ponto"></span>Nex Control 2.0</span>
    <div>
      <h1>Sua operação inteira<br>em <em>uma tela só</em>.</h1>
      <p>Operadores, metas, remessas, custos e o lucro do dia — calculado sozinho, no mesmo lugar.</p>
    </div>
    <div>
      <div class="filete"></div>
      <div class="rodape">
        <span class="selo">${N}</span>
        <span class="end">nexcpa.com.br</span>
      </div>
    </div>
  </div>
</body></html>`

const nav = await chromium.launch({ executablePath: navegador, headless: true })
const ctx = await nav.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
const pg = await ctx.newPage()
await pg.setContent(html, { waitUntil: 'networkidle' })
await pg.waitForTimeout(1800)   // as fontes do Google precisam chegar
await pg.screenshot({ path: SAIDA })
await nav.close()
console.log(SAIDA, (fs.statSync(SAIDA).size / 1024).toFixed(0) + ' KB')

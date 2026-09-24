// Ensaio da copy de renovação (não envia nada): node scripts/ensaio-renovacao.mjs
// Ensaio da copy de renovação: preenche cada segmento pra conta solo, dupla
// e scale, acusa placeholder sem valor, mede o push, e renderiza o e-mail
// pra foto. Não envia nada.
import fs from 'fs'
import { chromium } from 'playwright-core'
const { RENEWAL_SEGMENTS, varsDePlano } = await import('../lib/renewal-segments.js')
const { renderWinbackEmail } = await import('../lib/email-templates.js')
const fill = (t, v) => String(t || '').replace(/\{(\w+)\}/g, (_, k) => v[k] != null ? v[k] : `{${k}}`)
let problemas = 0
for (const [rot, ops] of [['solo', 0], ['dupla', 2], ['scale 3', 3], ['scale 10 + 4', 14]]) {
  const v = { nome: 'Fabio', ...varsDePlano(ops), url: 'https://nexcpa.com.br/billing-mp?renewal=1' }
  console.log(`\n── ${rot}: ${v.plano} · ${v.preco}\n   oferta: ${v.oferta}`)
  for (const [id, seg] of Object.entries(RENEWAL_SEGMENTS)) {
    const t = fill(seg.push.title, v), b = fill(seg.push.body, v)
    const txt = [t, b, ...Object.values(seg.email).map(x => fill(x, v))].join(' ')
    const sobra = txt.match(/\{\w+\}/g)
    if (sobra) { console.log(`   !! ${id}: placeholder sem valor ${sobra.join(' ')}`); problemas++ }
    if (rot === 'solo') console.log(`   ${id.padEnd(15)} push: ${t} — ${b}  (${t.length}/${b.length} chars)`)
  }
}
// e-mail renderizado: expiring_3 pra dupla e expired_revive pra solo
const nav = await chromium.launch({ executablePath: ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p)), headless: true })
for (const [nome, segId, ops] of [['email-expiring3-dupla', 'expiring_3', 2], ['email-revive-solo', 'expired_revive', 0]]) {
  const v = { nome: 'Fabio', ...varsDePlano(ops), url: 'https://nexcpa.com.br/billing-mp?renewal=1' }
  const seg = RENEWAL_SEGMENTS[segId]
  const filled = {}; for (const k of Object.keys(seg.email)) filled[k] = fill(seg.email[k], v)
  const { subject, html } = renderWinbackEmail({ segment: { email: filled }, vars: v })
  fs.writeFileSync(`.telas/qa/${nome}.html`, html)
  const pg = await nav.newPage({ viewport: { width: 640, height: 900 } }); await pg.setContent(html); await pg.screenshot({ path: `.telas/qa/${nome}.png`, fullPage: true }); await pg.close()
  console.log(`\n${nome}: assunto "${subject}" · foto salva`)
}
await nav.close()
console.log(problemas ? `\n${problemas} problema(s)` : '\nSem placeholder solto.')

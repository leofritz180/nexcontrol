/**
 * AS ANCORAS DO TOUR — quais sobrevivem ao apagar o modelo antigo.
 *
 * O tour aponta pra elementos por [data-tour=...]. Quando uma tela vira v2,
 * e facil refazer o visual e esquecer a ancora: o passo continua existindo
 * no lib/tour-config.js, o ProductTour nao acha o elemento e a caixa de
 * explicacao flutua no meio da tela, explicando algo que nao esta marcado
 * em lugar nenhum. Nao quebra — so fica sem sentido, que e pior de achar.
 *
 *   node scripts/auditoria-ancoras.mjs
 */
import fs from 'fs'
import path from 'path'

const cfg = fs.readFileSync('lib/tour-config.js', 'utf8')
const ancoras = [...new Set([...cfg.matchAll(/data-tour="([a-z0-9-]+)"/g)].map(m => m[1]))]

function varrer(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (!/node_modules|\.next/.test(p)) varrer(p, acc) }
    else if (/\.jsx?$/.test(e.name)) acc.push(p)
  }
  return acc
}
const arquivos = [...varrer('app'), ...varrer('components')].filter(f => !/admin-preview/.test(f))
const conteudo = new Map(arquivos.map(f => [f, fs.readFileSync(f, 'utf8')]))

// a ancora esta dentro de um ramo !isNex2 ainda aberto?
function noRamoAntigo(txt, ancora) {
  const i = txt.indexOf(`data-tour="${ancora}"`)
  if (i < 0) return null
  const antes = txt.slice(0, i)
  const g = antes.lastIndexOf('!isNex2')
  if (g < 0) return false
  let prof = 0
  for (const ch of antes.slice(g)) { if (ch === '{') prof++; else if (ch === '}') prof-- }
  return prof > 0
}

const orfas = [], vivas = [], ausentes = []
for (const a of ancoras.sort()) {
  const onde = [...conteudo].filter(([, t]) => t.includes(`data-tour="${a}"`)).map(([f]) => f)
  if (!onde.length) { ausentes.push(a); continue }
  if (onde.every(f => noRamoAntigo(conteudo.get(f), a) === true)) orfas.push([a, onde])
  else vivas.push(a)
}

console.log('ANCORAS DO TOUR: ' + ancoras.length + '\n')
console.log('  vivas fora do ramo antigo: ' + vivas.length)
if (ausentes.length) { console.log('\n  ?  nao existem em lugar nenhum (' + ausentes.length + ') — o tour ja pula esses passos:'); ausentes.forEach(a => console.log('       · ' + a)) }
if (orfas.length) {
  console.log('\n  X  SO NO RAMO ANTIGO (' + orfas.length + ') — apagar o ramo quebra estes passos:')
  orfas.forEach(([a, onde]) => console.log('       · ' + a.padEnd(16) + onde.join(', ')))
} else console.log('\n  ok — nenhuma ancora presa ao ramo antigo.')

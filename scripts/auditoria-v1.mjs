/**
 * O QUE AINDA SO EXISTE NO MODELO ANTIGO.
 *
 * Antes de apagar os ramos `!isNex2`, e preciso saber o que mora dentro
 * deles. Um bloco que so redesenha um cabecalho pode sumir sem dor; um que
 * carrega uma FUNCAO que o bento nao refez leva a funcao junto — e isso ja
 * aconteceu quatro vezes nesta migracao (leitura da operacao, revelacao de
 * patente, distintivo de patente, painel de demonstracao do operador).
 *
 * Aqui nao se decide nada: so se lista o que cada bloco contem, com as
 * marcas que denunciam funcao (data-tour, onClick, fetch, supabase, modal,
 * componente importado) em vez de mera apresentacao.
 *
 *   node scripts/auditoria-v1.mjs
 */
import fs from 'fs'

const ALVOS = [
  'app/admin/page.js',
  'app/meta/[id]/page.js',
  'app/operadores/page.js',
  'app/operator/page.js',
  'app/faturamento/page.js',
]

// o que indica FUNCAO, nao enfeite
const SINAIS = [
  [/data-tour="([^"]+)"/g,            'passo do tour'],
  [/<([A-Z][A-Za-z0-9]*)[\s/>]/g,     'componente'],
  [/onClick=\{/g,                     'acao de clique'],
  [/(supabase|fetch)\s*[.(]/g,        'chamada de dados'],
  [/router\.push/g,                   'navegacao'],
]

function blocoDe(linhas, inicio) {
  // conta chaves a partir da guarda ate fechar
  let prof = 0, comecou = false, fim = inicio
  for (let i = inicio; i < linhas.length; i++) {
    for (const ch of linhas[i]) {
      if (ch === '{') { prof++; comecou = true }
      else if (ch === '}') prof--
    }
    if (comecou && prof <= 0) { fim = i; break }
    fim = i
  }
  return linhas.slice(inicio, fim + 1)
}

let total = 0
for (const arq of ALVOS) {
  if (!fs.existsSync(arq)) { console.log('  ! nao achei ' + arq); continue }
  const linhas = fs.readFileSync(arq, 'utf8').split('\n')
  const guardas = []
  linhas.forEach((l, i) => { if (l.includes('!isNex2')) guardas.push(i) })
  if (!guardas.length) continue

  console.log('\n' + '─'.repeat(78))
  console.log(arq + '   (' + guardas.length + ' bloco' + (guardas.length > 1 ? 's' : '') + ')')
  console.log('─'.repeat(78))

  for (const g of guardas) {
    total++
    const corpo = blocoDe(linhas, g).join('\n')
    const achados = []
    for (const [re, nome] of SINAIS) {
      const m = [...corpo.matchAll(re)].map(x => x[1]).filter(Boolean)
      const n = [...corpo.matchAll(re)].length
      if (!n) continue
      if (m.length) {
        const unicos = [...new Set(m)].filter(x => !/^(div|span|p|a|b|svg|path|g|br|img|motion)$/.test(x))
        if (unicos.length) achados.push(`${nome}: ${unicos.slice(0, 8).join(', ')}`)
      } else achados.push(`${nome}: ${n}x`)
    }
    console.log(`\n  linha ${g + 1}  ·  ${blocoDe(linhas, g).length} linhas`)
    if (achados.length) for (const a of achados) console.log('     · ' + a)
    else console.log('     · (nada alem de marcacao — provavelmente so layout)')
  }
}
console.log('\n' + '='.repeat(78))
console.log('  ' + total + ' blocos do modelo antigo ainda no codigo.')

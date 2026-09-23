// Rode com: node scripts/teste-precos.mjs
// Prova duas coisas:
//   1. DESLIGADO, calculatePrice devolve exatamente o de antes (nada muda
//      pra ninguem hoje).
//   2. LIGADO, cada faixa cai no pacote certo — conferido contra os 84
//      pagantes reais.
import fs from 'fs'

const BASE = 59.90, OP = 29.90
const TIERS = [[1,1,0],[2,3,10],[4,6,15],[7,9,20],[10,999,25]]
function antigo(n) {                       // a formula como ela era, a mao
  if (n <= 0) return BASE
  const t = TIERS.find(([a,b]) => n >= a && n <= b) || TIERS[TIERS.length-1]
  const unit = Math.round(OP * (1 - t[2]/100) * 100) / 100
  return Math.round((BASE + Math.round(n * unit * 100)/100) * 100) / 100
}

const mod = await import('../lib/pricing.js')
const { calculatePrice, PACOTES_ATIVOS, PACOTES, pacotePara, precoComPacote } = mod

console.log(`  PACOTES_ATIVOS = ${PACOTES_ATIVOS}\n`)

// ── 1 · desligado nao pode mudar nada ────────────────────────────────
let falhas = 0
if (PACOTES_ATIVOS) {
  console.log('  1) chave LIGADA — a formula antiga nao vale mais (esperado)')
} else
for (let n = 0; n <= 25; n++) {
  const esperado = antigo(n)
  const obtido = calculatePrice(n).total
  if (Math.abs(esperado - obtido) > 0.001) { console.log(`   ✗ ${n} ops: esperava ${esperado}, veio ${obtido}`); falhas++ }
}
if (!PACOTES_ATIVOS) console.log(falhas === 0
  ? '  1) DESLIGADO devolve o preco antigo em 0..25 operadores  ✓'
  : `  1) DESLIGADO divergiu em ${falhas} casos  ✗`)

// ── 2 · a escolha do pacote ──────────────────────────────────────────
console.log('\n  2) ESCOLHA DO PACOTE')
for (const [n, pro] of [[0,false],[0,true],[1,false],[2,false],[3,false],[4,false],[6,false],[7,false],[10,false],[14,false],[22,false]]) {
  const r = precoComPacote(n, { pro })
  const extra = r.excedente ? `  (+${r.excedente} acima do teto)` : ''
  console.log(`     ${String(n).padStart(2)} op${pro ? ' +pro' : '    '}  ->  ${r.pacote.nome.padEnd(9)} R$ ${r.total.toFixed(2).padStart(7)}${extra}`)
}

// ── 3 · o efeito nos 15 clientes com equipe ──────────────────────────
console.log('\n  3) O QUE MUDA PRA QUEM JA TEM EQUIPE')
console.log('     ops  clientes   paga hoje     pacote        novo    diferenca')
console.log('     ' + '-'.repeat(60))
let hoje = 0, novo = 0
for (const [n, qtd] of [[1,8],[2,6],[3,1],[4,1],[10,2]]) {
  const a = antigo(n)
  const r = precoComPacote(n)
  hoje += a * qtd; novo += r.total * qtd
  const d = r.total - a
  console.log(`     ${String(n).padStart(3)}  ${String(qtd).padStart(8)}   R$ ${a.toFixed(2).padStart(7)}   ${r.pacote.nome.padEnd(9)} R$ ${r.total.toFixed(2).padStart(7)}   ${d>0?'+':''}${((r.total/a-1)*100).toFixed(0)}%`)
}
console.log('     ' + '-'.repeat(60))
console.log(`     soma  R$ ${hoje.toFixed(2)}/mes -> R$ ${novo.toFixed(2)}/mes  (+${((novo/hoje-1)*100).toFixed(0)}%)`)
console.log(`\n     os 66 sem operador continuam em R$ ${BASE.toFixed(2)} — nao sentem nada.`)

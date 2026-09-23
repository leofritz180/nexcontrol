/**
 * APAGA OS RAMOS `!isNex2` — o modelo antigo.
 *
 * Desde 24/09/2026 o isNex2 devolve true pra todo mundo, entao tudo dentro
 * de `{... !isNex2(...) && (...)}` nunca mais renderiza. E codigo morto que
 * pesa no bundle e convida a editar o lado errado da tela.
 *
 * NAO RODE ANTES das auditorias (auditoria-v1 e auditoria-ancoras): quatro
 * funcoes ja sumiram nesta migracao por apagar sem conferir o que morava
 * dentro.
 *
 * DUAS FORMAS DE GUARDA, e a segunda quase me fez estragar tudo:
 *   {!isNex2(x) && ( ... )}                  simples
 *   {tab==='overview' && !isNex2(x) && (...)}  composta
 * Uma primeira versao removia so o trecho "&& !isNex2(x)" da composta — o
 * que NAO apaga o bloco: transforma bloco morto em bloco VIVO, e as duas
 * interfaces passariam a aparecer juntas. Por isso aqui se acha sempre a
 * chave que ABRE a expressao JSX e se apaga ate a que a fecha.
 *
 *   node scripts/apaga-ramo-antigo.mjs --ver    (so mostra)
 *   node scripts/apaga-ramo-antigo.mjs          (apaga)
 */
import fs from 'fs'

const SO_VER = process.argv.includes('--ver')
const BARRA = String.fromCharCode(92)
const ALVOS = [
  'app/admin/page.js',
  'app/meta/[id]/page.js',
  'app/operadores/page.js',
  'app/operator/page.js',
  'app/faturamento/page.js',
]

/* Caminha do indice pra tras ate a chave que abre a expressao JSX. */
function aberturaDaExpressao(txt, idx) {
  let prof = 0
  for (let i = idx; i >= 0; i--) {
    const c = txt[i]
    if (c === '}') prof++
    else if (c === '{') { if (prof === 0) return i; prof-- }
  }
  return -1
}

/* Da chave de abertura ate a que fecha, respeitando aspas e template. */
function fechamento(txt, ini) {
  let prof = 0, aspas = null
  for (let i = ini; i < txt.length; i++) {
    const c = txt[i], ant = txt[i - 1]
    if (aspas) { if (c === aspas && ant !== BARRA) aspas = null; continue }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue }
    if (c === '{') prof++
    else if (c === '}') { prof--; if (prof === 0) return i }
  }
  return -1
}

let total = 0, blocos = 0
for (const arq of ALVOS) {
  let txt = fs.readFileSync(arq, 'utf8')
  let n = 0, linhas = 0

  for (;;) {
    const idx = txt.indexOf('!isNex2')
    if (idx < 0) break
    const ini = aberturaDaExpressao(txt, idx)
    if (ini < 0) { console.error('  ! nao achei a abertura em ' + arq); break }
    const fim = fechamento(txt, ini)
    if (fim < 0) { console.error('  ! nao achei o fechamento em ' + arq); break }
    linhas += txt.slice(ini, fim + 1).split('\n').length
    txt = txt.slice(0, ini) + txt.slice(fim + 1)
    n++
    if (n > 40) { console.error('  ! parei por seguranca em ' + arq); break }
  }

  if (n) {
    if (!SO_VER) fs.writeFileSync(arq, txt)
    console.log(`  ${arq.padEnd(26)} ${n} bloco(s), ~${linhas} linhas`)
    total += linhas; blocos += n
  }
}
console.log(`\n  ${blocos} blocos · ~${total} linhas ${SO_VER ? 'seriam removidas' : 'removidas'}.`)
if (SO_VER) console.log('  (nada foi escrito — rode sem --ver para aplicar)')

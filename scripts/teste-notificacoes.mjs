/**
 * O QUE CADA NOTIFICAÇÃO VIRA no aparelho — em cada uma das três vozes.
 *
 * Não dá pra fotografar uma notificação do sistema operacional — ela é
 * desenhada fora do navegador. O que dá pra conferir, e é o que quebra na
 * prática, são as duas pontas: o pacote que sai do servidor e a leitura
 * dele pelo service worker. E, desde as vozes, que TODO tipo tem texto nas
 * três — um tipo sem texto numa voz cairia no padrão sem ninguém notar.
 *
 *   node scripts/teste-notificacoes.mjs            (tudo, nas três vozes)
 *   node scripts/teste-notificacoes.mjs --voz=low  (só uma)
 */
import { montarNotificacao, textoDe, textosDe, TIPOS, VOZES, CATEGORIA, prefsPermitem } from '../lib/notificacoes.js'

const soVoz = (process.argv.find(a => a.startsWith('--voz=')) || '').slice(6)

// Dados de exemplo por tipo — os mesmos que o produto manda (ver lib/notify,
// api/meta/close, insights-engine, network/*).
const CASOS = [
  ['transmissao',     { nome: 'Fabio', chave: 'uid-1' }],
  ['meta-criada',     { nome: 'Fabio', contas: 10, rede: 'W1', metaId: 'abc-123', chave: 'abc-123' }],
  ['remessa-nova',    { nome: 'Fabio', valor: 340, contas: 12, rede: 'W1', slot: 'Fortune Tiger', feitas: 6, alvo: 10, metaId: 'abc-123', chave: 'abc-123' }],
  ['remessa-nova',    { nome: 'Fabio', valor: -120, contas: 8, rede: 'OKOK', feitas: 9, alvo: 10, metaId: 'abc-123', chave: 'abc-123' }],
  ['remessa-nova',    { nome: 'Fabio', valor: 50, rede: 'W1', bonus: true, metaId: 'abc-123', chave: 'abc-123' }],
  ['remessa-feedback',{ valor: 340, perConta: 28.33, contas: 12, metaId: 'abc-123', chave: 'abc-123' }],
  ['remessa-feedback',{ valor: -84, perConta: 7, contas: 12, metaId: 'abc-123', chave: 'abc-123' }],
  ['marco-meta',      { nome: 'Fabio', feitas: 5, alvo: 10, rede: 'W1', marco: 50, metaId: 'abc-123', chave: 'abc-123-50' }],
  ['marco-meta',      { feitas: 10, alvo: 10, rede: 'W1', marco: 100, paraOperador: true, metaId: 'abc-123', chave: 'abc-123-100' }],
  ['meta-finalizada', { nome: 'Fabio', contas: 10, rede: 'W1', nRem: 8, valor: 900, metaId: 'abc-123', chave: 'abc-123' }],
  ['meta-fechada',    { contas: 40, rede: 'OKOK', lucroFinal: 1284.5, metaId: 'abc-123', chave: 'abc-123' }],
  ['meta-fechada-operador', { contas: 10, rede: 'W1', valor: 900, metaId: 'abc-123', chave: 'abc-123' }],
  ['alerta-operacao', { insight: 'sequencia_negativa', streak: 3, total: 640, metaId: 'def-456', chave: 'def-456' }],
  ['alerta-operacao', { insight: 'meta_parada', horas: 14, metaId: 'def-456', chave: 'def-456' }],
  ['pagamento',       { titulo: 'Seu plano vence amanhã', corpo: 'Scale 3 · R$ 169,90 · PIX na hora', chave: 'd1' }],
  ['network',         { evento: 'mencao', nome: 'Furtado', trecho: 'alguém já testou a VOY essa semana?', url: '/network?c=geral' }],
  ['conquista',       { evento: 'patente', patente: 'Elite', depositantes: 4966 }],
  ['conquista',       { evento: 'comissao', valor: 320, url: '/afiliados' }],
]

/* A mesma tradução que o public/sw.js faz. Se as duas discordarem, é aqui
   que se vê — e é onde um botão vira decoração sem ninguém notar. */
function comoOSwLe(data) {
  return {
    title: data.title || 'Nex Control',
    body: data.body || '',
    tag: data.tag || 'nexcontrol-' + Date.now(),
    renotify: data.renotify === true,
    requireInteraction: data.requireInteraction === true,
    vibrate: Array.isArray(data.vibrate) ? data.vibrate : [100, 50, 100],
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
    data: { url: data.url || '/', destinos: data.destinos || {} },
  }
}

let problemas = 0
const vozes = VOZES.filter(v => !soVoz || v.id === soVoz)

for (const [tipo, dados] of CASOS) {
  console.log('\n' + '─'.repeat(70))
  console.log(`  ${tipo}${dados.insight ? ' · ' + dados.insight : dados.evento ? ' · ' + dados.evento : dados.marco ? ' · ' + dados.marco + '%' : dados.bonus ? ' · bônus' : ''}   [${CATEGORIA[tipo] || 'sempre'}]`)
  const textos = new Set()
  for (const v of vozes) {
    const p = montarNotificacao(tipo, dados, v.id)
    const n = comoOSwLe(p)
    const t = textoDe(tipo, dados, v.id)
    if (!t.titulo) { console.log(`  !! ${v.id}: sem título`); problemas++ }
    textos.add(t.titulo + '|' + t.corpo)
    const botoes = n.actions.map(a => `[ ${a.title} → ${n.data.destinos[a.action] || '?'} ]`).join('  ')
    const todos = textosDe(tipo, dados, v.id)
    if (v.id === 'engracado' && !dados.titulo && todos.length < 3) { console.log(`  !! engraçado com só ${todos.length} variação(ões)`); problemas++ }
    todos.forEach((x, k) => { console.log(`  ${(k === 0 ? v.id : '').padEnd(10)} ${x.titulo}`); console.log(`  ${''.padEnd(10)} ${x.corpo}`) })
    if (v === vozes[0]) console.log(`  ${''.padEnd(10)} ${botoes}   corpo→${n.data.url}  tag=${n.tag}  ${n.requireInteraction ? 'fica' : 'passa'}`)
    for (const a of n.actions) if (!n.data.destinos[a.action]) { console.log(`  !! botão "${a.title}" sem destino`); problemas++ }
  }
  // prosa (pagamento) é igual nas três — é o esperado; tipo com texto por voz TEM que variar
  if (!dados.titulo && vozes.length === 3 && textos.size < 3) { console.log('  !! as três vozes dizem a mesma coisa'); problemas++ }
}

// interruptores: cada categoria desliga só o que é dela
console.log('\n' + '═'.repeat(70))
const off = { voz: 'serio', ciclo: false, remessas: false, marcos: false, insights: false, network: false }
const sempreChegam = Object.keys(TIPOS).filter(t => prefsPermitem(off, t))
console.log('  com tudo desligado ainda chegam:', sempreChegam.join(', '))
if (sempreChegam.some(t => (CATEGORIA[t] || 'sempre') !== 'sempre')) { console.log('  !! um tipo com interruptor passou desligado'); problemas++ }
console.log(problemas ? `  ${problemas} problema(s).` : '  Todas coerentes, nas três vozes.')
process.exit(problemas ? 1 : 0)

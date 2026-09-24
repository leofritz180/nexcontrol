/**
 * O QUE CADA NOTIFICAÇÃO VIRA no aparelho.
 *
 * Não dá pra fotografar uma notificação do sistema operacional — ela é
 * desenhada fora do navegador. O que dá pra conferir, e é o que quebra na
 * prática, são as duas pontas: o pacote que sai do servidor e a leitura
 * dele pelo service worker.
 *
 *   node scripts/teste-notificacoes.mjs
 */
import { montarNotificacao, TIPOS } from '../lib/notificacoes.js'

const CASOS = [
  ['meta-criada',     { titulo: 'Fabio abriu uma meta', corpo: '10 DEP na W1 · começa agora', metaId: 'abc-123', chave: 'abc-123' }],
  ['remessa-nova',    { titulo: 'Fabio lucrou na remessa', corpo: '+R$ 340,00 · 12 contas · W1 · 6/10 DEP', metaId: 'abc-123', chave: 'abc-123' }],
  ['remessa-feedback',{ titulo: 'Remessa no lucro!', corpo: '+R$ 340,00 — Show! Mantém esse ritmo.', metaId: 'abc-123', chave: 'abc-123' }],
  ['marco-meta',      { titulo: 'Fabio bateu a meta', corpo: '10/10 DEP na W1 · pronta pra finalizar', metaId: 'abc-123', chave: 'abc-123-100' }],
  ['meta-finalizada', { titulo: 'Fabio finalizou · falta você fechar', corpo: '10 DEP W1 · 8 remessas · +R$ 900,00 nas remessas', metaId: 'abc-123', chave: 'abc-123' }],
  ['meta-fechada-operador', { titulo: 'Sua meta foi fechada', corpo: '10 DEP W1 · suas remessas: +R$ 900,00', metaId: 'abc-123', chave: 'abc-123' }],
  ['meta-fechada',    { titulo: 'Meta fechada', corpo: '40 DEP OKOK — Lucro: R$ 1.284,50', metaId: 'abc-123', chave: 'abc-123' }],
  ['alerta-operacao', { titulo: 'Três remessas negativas seguidas', corpo: 'Meta W1 · 18 contas · −R$ 640,00', metaId: 'def-456' }],
  ['pagamento',       { titulo: 'Seu plano vence amanhã', corpo: 'Scale 3 · R$ 169,90 · PIX na hora', chave: 'd1' }],
  ['network',         { titulo: 'Furtado te mencionou', corpo: 'alguém já testou a VOY essa semana?' }],
  ['conquista',       { titulo: 'Patente nova: Elite', corpo: '4.966 depositantes processados' }],
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
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
    data: { url: data.url || '/', destinos: data.destinos || {} },
  }
}

let falhas = 0
for (const [tipo, p] of CASOS) {
  const pacote = montarNotificacao(tipo, p)
  const n = comoOSwLe(pacote)

  console.log('\n' + '─'.repeat(70))
  console.log('  ' + n.title)
  console.log('  ' + n.body)
  const botoes = n.actions.map(a => `[ ${a.title} → ${n.data.destinos[a.action] || '?'} ]`).join('  ')
  console.log('  ' + (botoes || '(sem botão)'))
  console.log(`  tag=${n.tag}  fica=${n.requireInteraction ? 'até tocar' : 'passa'}  rechama=${n.renotify}  vibra=[${n.vibrate}]`)

  // os erros que importam
  if (!n.title || !n.body) { console.log('  X sem título ou corpo'); falhas++ }
  if (n.actions.length > 2) { console.log('  X mais de 2 botões: o sistema corta'); falhas++ }
  for (const a of n.actions) {
    if (!n.data.destinos[a.action]) { console.log(`  X o botão "${a.title}" não tem destino — vira decoração`); falhas++ }
  }
  if (n.tag.endsWith('undefined')) { console.log('  X tag com undefined'); falhas++ }
  if (tipo !== 'aviso' && !TIPOS[tipo]) { console.log('  X tipo fora do catálogo'); falhas++ }
}

console.log('\n' + '='.repeat(70))
console.log(falhas ? `  ${falhas} problema(s).` : '  Todas coerentes.')
process.exit(falhas ? 1 : 0)

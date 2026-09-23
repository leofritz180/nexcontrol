/**
 * O ANÚNCIO PRA BASE INTEIRA.
 *
 * Isto alcança TODO aparelho inscrito e não tem como recolher: uma vez
 * entregue, está na mão da pessoa. Por isso o padrão é ENSAIO — ele mostra
 * o que cada aparelho receberia e não manda nada. Disparar exige a palavra
 * `--disparar` escrita à mão.
 *
 *   node scripts/anunciar.mjs              (ensaio: só mostra)
 *   node scripts/anunciar.mjs --disparar    (manda de verdade)
 *   node scripts/anunciar.mjs --so=2        (só o segundo)
 */
import fs from 'fs'
import { montarNotificacao } from '../lib/notificacoes.js'

const args = process.argv.slice(2)
const DISPARAR = args.includes('--disparar')
const SO = (args.find(a => a.startsWith('--so=')) || '').slice(5)

const env = {}
for (const f of ['.env.local', '.env']) {
  if (!fs.existsSync(f)) continue
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

/* Os anúncios. Cada um com CHAVE própria: sem isso o segundo substituiria o
   primeiro no aparelho, porque a tag agrupa por assunto — e a pessoa veria
   só o último. */
const ANUNCIOS = [
  {
    n: 1,
    // sem botão de propósito: o toque no corpo leva cada um ao SEU painel
    // (operador no dele, admin no dele). Um botão com endereço fixo mandaria
    // metade da base pro lugar errado.
    tipo: 'anuncio',
    chave: 'v2-no-ar',
    titulo: '🚀 Nex Control 2.0 no ar',
    corpo: 'O painel inteiro foi redesenhado. Mesmos dados, mesmas contas, mesmas funções — tudo mais claro e mais rápido de ler.',
  },
  {
    n: 2,
    tipo: 'anuncio',
    chave: 'instagram',
    titulo: '📸 Agora temos Instagram',
    corpo: '@usenexcontrol — siga a gente e marque a Nex nos stories da sua operação 💚',
    botao: 'Abrir o Instagram',
    destino: 'https://instagram.com/usenexcontrol',
  },
]

const escolhidos = SO ? ANUNCIOS.filter(a => String(a.n) === SO) : ANUNCIOS

console.log('\n' + '═'.repeat(66))
console.log(DISPARAR ? '  DISPARANDO DE VERDADE' : '  ENSAIO — nada será enviado')
console.log('═'.repeat(66))

for (const a of escolhidos) {
  const pacote = montarNotificacao(a.tipo, a)
  console.log(`\n  ── ${a.n} ──────────────────────────────────────────────`)
  console.log(`  ${pacote.title}`)
  console.log(`  ${pacote.body}`)
  const b = pacote.actions.map(x => `[ ${x.title} → ${pacote.destinos[x.action]} ]`).join('  ')
  console.log(`  ${b || '(sem botão — o toque leva cada um ao próprio painel)'}`)
  console.log(`  agrupamento=${pacote.tag}   fica na tela=${pacote.requireInteraction ? 'sim' : 'não'}`)

  if (!DISPARAR) continue

  const r = await fetch('https://nexcpa.com.br/api/push/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-auth': env.SUPABASE_SERVICE_ROLE_KEY },
    body: JSON.stringify({
      title: a.titulo, body: a.corpo, tag: a.chave,
      tipo: a.tipo, botao: a.botao, destino: a.destino,
    }),
  })
  const d = await r.json().catch(() => ({}))
  console.log(`  >> ${r.status}  ${JSON.stringify(d)}`)
  // respiro entre os dois: duas notificações no mesmo segundo viram uma só
  // na percepção de quem recebe
  if (escolhidos.length > 1) await new Promise(s => setTimeout(s, 4000))
}

console.log('\n' + '═'.repeat(66))
if (!DISPARAR) console.log('  Nada foi enviado. Pra mandar: node scripts/anunciar.mjs --disparar\n')

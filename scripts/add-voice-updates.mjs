// Insere as 2 novas atualizacoes no sino (system_updates). Idempotente: nao duplica por titulo.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Carrega .env.local manualmente (node puro nao le sozinho)
const env = {}
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const UPDATES = [
  {
    title: 'Dispare avisos quando quiser',
    category: 'feature',
    body: 'Agora você pede um resumo na hora, direto do painel: lucro de hoje, da semana, do mês, top operador, top rede, metas ativas e mais. Toque no botão de avisos (ao lado do microfone, no canto inferior direito) e escolha o que disparar — você recebe na hora como notificação.',
  },
  {
    title: 'Operação por voz',
    category: 'feature',
    body: 'Comande o NexControl falando. Ative o microfone no canto inferior direito (ou tecla F3 no computador), navegue entre as telas só com a voz e pergunte seus números — "quanto lucrei hoje?" — para ouvir a resposta na hora. Disponível para administradores.',
  },
]

const { data: existentes } = await sb.from('system_updates').select('title')
const jaTem = new Set((existentes || []).map(u => u.title))

for (const u of UPDATES) {
  if (jaTem.has(u.title)) {
    console.log('JA EXISTE, pulando:', u.title)
    continue
  }
  const { data, error } = await sb.from('system_updates').insert({ ...u, published: true }).select('id, title').single()
  if (error) console.error('ERRO ao inserir', u.title, '→', error.message)
  else console.log('INSERIDO id', data.id, '→', data.title)
}
console.log('Concluido.')

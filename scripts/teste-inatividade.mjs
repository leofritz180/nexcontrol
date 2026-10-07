// Só leitura: quem o cron de inatividade pegaria HOJE e nos próximos dias,
// e como ficam os textos. Não envia nada.
//   node scripts/teste-inatividade.mjs
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { alvosInatividade, dataCurta, textos, MARCOS } from '../lib/inatividade.js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const DIA = 86400000

for (let d = 0; d < 7; d++) {
  const agora = Date.now() + d * DIA
  const alvos = await alvosInatividade(sb, agora)
  console.log(`\n${d === 0 ? 'HOJE' : `+${d} dia(s)`}: ${alvos.length} aviso(s)`)
  for (const a of alvos) {
    const { data: adm } = await sb.from('profiles').select('email,nome').eq('tenant_id', a.tenantId).eq('role', 'admin').maybeSingle()
    console.log(`   ${a.marco.segmento}  ${adm?.email}  último lançamento ${dataCurta(a.ultimo)} (${a.dias} dias)`)
  }
}

console.log('\nTEXTOS (exemplo):')
for (const m of MARCOS) {
  const t = textos(m, { nome: 'Leonardo', desde: dataCurta(Date.now() - m.dias * DIA) })
  console.log(`\n[${m.segmento}] PUSH: ${t.push.titulo} — ${t.push.corpo}`)
  console.log(`[${m.segmento}] EMAIL: ${t.email.subject}\n   ${t.email.bodyText}`)
}

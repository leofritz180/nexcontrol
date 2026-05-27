// Migra orfaos pro tenant do Bruno (DS MENTORIA)
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmt = d => d ? new Date(d).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}).slice(0,16) : '—'

const BRUNO_TENANT = '8cf82c67-1d8e-4e64-9f8d-ea5a038d4ad5'
const ORPHAN_EMAILS = [
  'danilo.danilo.dalforn2@gmail.com',
  'lucasnserra@hotmail.com',
  'danilo.danilo.dalforn1@gmail.com',
  'marciaferreirakta1@gmail.com',
  'danilo.danilo.dalforne@gmail.com',
  'lucasneves7569@gmail.com',
]

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('MIGRACAO DE ORFAOS → DS MENTORIA')
  console.log('═══════════════════════════════════════════════')

  let migrated = 0
  let tenantsDeleted = 0
  for (const email of ORPHAN_EMAILS) {
    const { data: prof } = await sb.from('profiles').select('id,nome,email,role,tenant_id').eq('email', email).maybeSingle()
    if (!prof) { console.log('  ' + email + ' · ❌ profile nao achado'); continue }
    if (prof.tenant_id === BRUNO_TENANT) { console.log('  ' + email + ' · ✅ ja esta no Bruno'); continue }

    const oldTenantId = prof.tenant_id

    // Atualiza profile pra operator do Bruno
    const { error: upErr } = await sb.from('profiles').update({
      role: 'operator',
      tenant_id: BRUNO_TENANT,
    }).eq('id', prof.id)

    if (upErr) { console.log('  ' + email + ' · ❌ erro update: ' + upErr.message); continue }

    // Deleta o tenant orfao (Minha Operacao vazio)
    // Soh deleta se nao tem outras profiles vinculadas
    const { count: stillUsing } = await sb.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', oldTenantId)
    if (!stillUsing || stillUsing === 0) {
      const { error: delErr } = await sb.from('tenants').delete().eq('id', oldTenantId)
      if (delErr) {
        console.log('  ' + email + ' · ✅ migrado, mas erro deletar tenant orfao: ' + delErr.message)
      } else {
        console.log('  ' + email + ' · ✅ MIGRADO + tenant orfao deletado')
        tenantsDeleted++
      }
    } else {
      console.log('  ' + email + ' · ✅ MIGRADO (tenant velho tinha outros profiles, manteve)')
    }
    migrated++
  }

  console.log()
  console.log('━━━ RESUMO ━━━')
  console.log('  Total a migrar:           ' + ORPHAN_EMAILS.length)
  console.log('  Migrados com sucesso:     ' + migrated)
  console.log('  Tenants orfaos deletados: ' + tenantsDeleted)

  // Estado final do tenant do Bruno
  console.log()
  const { data: bruno } = await sb.from('tenants').select('name').eq('id', BRUNO_TENANT).maybeSingle()
  const { data: ops } = await sb.from('profiles').select('id,nome,email,last_seen_at').eq('tenant_id', BRUNO_TENANT).eq('role','operator').order('created_at',{ascending:true})
  console.log('━━━ DS MENTORIA agora (' + ops.length + ' operadores) ━━━')
  for (const o of ops) {
    console.log('  ' + (o.nome||'?').padEnd(28).slice(0,28) + ' · ' + o.email)
  }
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })

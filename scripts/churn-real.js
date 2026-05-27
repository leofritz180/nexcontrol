require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }).slice(0, 16)

async function main() {
  // Sheik
  const { data: sheikProfs } = await sb.from('profiles').select('id,nome,email,role,tenant_id,last_seen_at').or('email.ilike.%trustoferta%,email.ilike.%enriquecendoonline%')
  console.log('=== SHEIK ===')
  for (const p of sheikProfs || []) {
    const { data: t } = await sb.from('tenants').select('name').eq('id', p.tenant_id).maybeSingle()
    console.log('  ' + (p.nome || '?').padEnd(20) + ' · ' + p.email.padEnd(40) + ' · role=' + p.role + ' · tenant=' + (t?.name||'?') + ' · last_seen ' + fmt(p.last_seen_at))
  }

  // Diego Hilario
  const { data: diegoProfs } = await sb.from('profiles').select('id,nome,email,role,tenant_id,last_seen_at').ilike('email', '%hillario%')
  console.log('\n=== DIEGO HILARIO ===')
  for (const p of diegoProfs || []) {
    const { data: t } = await sb.from('tenants').select('name').eq('id', p.tenant_id).maybeSingle()
    console.log('  ' + (p.nome || '?').padEnd(20) + ' · ' + p.email.padEnd(40) + ' · role=' + p.role + ' · tenant=' + (t?.name||'?') + ' · last_seen ' + fmt(p.last_seen_at))
  }

  console.log('\n━━━ STATUS DOS 14 QUE "CHURNARAM" ━━━')
  const churnedEmails = [
    'diego.hillario@gmail.com',
    'guiihhs04@gmail.com',
    'halysonfernandes2004@gmail.com',
    'fncservicosonline@gmail.com',
    'kauanbiel409@gmail.com',
    'wellingtond.igt10@gmail.com',
    'trustoferta@gmail.com',
    'daniel30contratd1@gmail.com',
    'joaovictorjss13@gmail.com',
    'gabrielpereira30541@gmail.com',
    'jjonmarqu@gmail.com',
    'thalisonmonteiro09@gmail.com',
    'ricolorenzo771@gmail.com',
  ]
  let realChurn = 0, migratedOp = 0, stillActive = 0
  for (const email of churnedEmails) {
    const { data: matches } = await sb.from('profiles').select('email,role,tenant_id,last_seen_at,nome').eq('email', email)
    if (!matches || matches.length === 0) { console.log('  ' + email.padEnd(40) + ' · ❌ NAO ACHADO'); realChurn++; continue }
    for (const m of matches) {
      const { data: t } = await sb.from('tenants').select('name').eq('id', m.tenant_id).maybeSingle()
      const lastDays = m.last_seen_at ? Math.floor((Date.now() - new Date(m.last_seen_at).getTime()) / 86400000) : 999
      let status
      if (m.role === 'operator') {
        status = 'OPERADOR ATIVO em "' + (t?.name||'?') + '"'
        migratedOp++
      } else if (lastDays <= 7) {
        status = 'admin ATIVO (mas sem renovar)'
        stillActive++
      } else {
        status = 'churn real (' + lastDays + 'd sem acesso)'
        realChurn++
      }
      console.log('  ' + email.padEnd(40) + ' · role=' + m.role.padEnd(9) + ' · ult ' + (m.last_seen_at ? fmt(m.last_seen_at) : 'nunca').padEnd(18) + ' · ' + status)
    }
  }

  console.log('\n━━━ RESUMO ━━━')
  console.log('  Total marcados como "churn":      ' + churnedEmails.length)
  console.log('  → Viraram operador em outro:      ' + migratedOp + ' (NAO eh churn real)')
  console.log('  → Admin ainda ativo (sem renovar):' + stillActive + ' (oportunidade)')
  console.log('  → Churn real (sumiram):           ' + realChurn)
}

main().catch(e => { console.error('erro:', e.message); process.exit(1) })

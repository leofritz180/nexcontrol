// Funil do Grupo Nex Network: viram → clicaram → geraram PIX → pagaram.
//   node scripts/grupo-funil.mjs [--dias=7]
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const dias = Number((process.argv.find(a => a.startsWith('--dias=')) || '').slice(7)) || 30
const desde = new Date(Date.now() - dias * 86400e3).toISOString()
const { data: ev } = await sb.from('winback_log').select('user_id,segment,status,sent_at').like('segment', 'grupo_%').gte('sent_at', desde)
const por = (seg) => { const l = (ev || []).filter(e => e.segment === seg); return { eventos: l.length, pessoas: new Set(l.map(e => e.user_id)).size } }
const v = por('grupo_view'), c = por('grupo_click'), q = por('grupo_qr')
const { data: pags } = await sb.from('mp_payments').select('user_id,status,amount,created_at').eq('operator_count', -1).eq('plan_months', 0).gte('created_at', desde)
const pagos = (pags || []).filter(p => ['approved', 'paid'].includes(p.status))
console.log(`\nGRUPO NEX NETWORK · últimos ${dias} dias`)
console.log(`  viram a oferta      ${String(v.pessoas).padStart(4)} pessoas  (${v.eventos} vezes)`)
console.log(`  clicaram            ${String(c.pessoas).padStart(4)} pessoas  (${c.eventos} vezes)`)
console.log(`  geraram o PIX       ${String(q.pessoas).padStart(4)} pessoas  (${(pags || []).length} pedidos no MP)`)
console.log(`  pagaram             ${String(new Set(pagos.map(p => p.user_id)).size).padStart(4)} pessoas  R$ ${pagos.reduce((a, p) => a + Number(p.amount || 0), 0).toFixed(2)}`)
const origens = {}; for (const e of ev || []) if (e.segment === 'grupo_view') origens[e.status] = (origens[e.status] || 0) + 1
console.log('  por onde viram:', JSON.stringify(origens))

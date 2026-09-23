// Rode com: node scripts/auditoria-vagas.mjs
// O operator_count da assinatura bate com o que a pessoa REALMENTE pagou?
// So leitura.
import fs from 'fs'
import { calculatePrice } from '../lib/pricing.js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')] })
)
const U = env.NEXT_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_ROLE_KEY
async function todos(rota) {
  const out = []
  for (let de = 0; ; de += 1000) {
    const r = await fetch(`${U}/rest/v1/${rota}`, { headers: { apikey: K, Authorization: 'Bearer ' + K, Range: `${de}-${de + 999}` } })
    const j = await r.json(); if (!Array.isArray(j) || !j.length) break
    out.push(...j); if (j.length < 1000) break
  }
  return out
}

const CORTESIA = new Set(['lifetime_comp','lifetime_owner','lifetime_partner','cortesia_parceiro','owner_access','mock','admin'])
const agora = new Date()
const subs = await todos('subscriptions?select=tenant_id,status,operator_count,total_amount,payment_method,expires_at,created_at')
const pagos = await todos('mp_payments?select=tenant_id,status,amount,operator_count,created_at&order=created_at.asc')
const tenants = await todos('tenants?select=id,name')
const perfis = await todos('profiles?select=id,tenant_id,role,last_seen_at,removed_from_tenant_id')
const nome = id => (tenants.find(t => t.id === id)?.name || String(id).slice(0, 8))

const porTenant = new Map()
for (const s of subs) {
  if (!s.expires_at) continue
  const at = porTenant.get(s.tenant_id)
  if (!at || new Date(s.expires_at) > new Date(at.expires_at)) porTenant.set(s.tenant_id, s)
}
const ativos = [...porTenant.values()].filter(s =>
  new Date(s.expires_at) > agora && s.status === 'active' && !CORTESIA.has(s.payment_method))

console.log('─'.repeat(112))
console.log('  O QUE A ASSINATURA DIZ  x  O QUE A ULTIMA COBRANCA APROVADA DIZ')
console.log('─'.repeat(112))
console.log('  CLIENTE                 sub diz  ult.pgto diz   valor pago   cadastrados  ativos30d   situacao')
console.log('─'.repeat(112))

const d30 = new Date(agora - 30 * 86400000)
let divergentes = 0, brechas = 0
const linhas = []
for (const s of ativos) {
  const meus = pagos.filter(p => p.tenant_id === s.tenant_id && (p.status === 'approved' || p.status === 'paid'))
  const ult = meus[meus.length - 1]
  const subOps = Number(s.operator_count || 0)
  const pgOps = ult ? Number(ult.operator_count || 0) : null
  const ops = perfis.filter(p => p.tenant_id === s.tenant_id && p.role === 'operator' && !p.removed_from_tenant_id)
  const vivos = ops.filter(p => p.last_seen_at && new Date(p.last_seen_at) > d30)
  if (subOps === 0 && (pgOps === 0 || pgOps === null) && ops.length === 0) continue // solo limpo
  const divergiu = pgOps !== null && pgOps !== subOps
  const brecha = ops.length > Math.max(subOps, pgOps ?? 0)
  if (divergiu) divergentes++
  if (brecha) brechas++
  linhas.push({ n: nome(s.tenant_id).slice(0, 22), subOps, pgOps, val: ult ? Number(ult.amount) : null,
    cad: ops.length, viv: vivos.length, divergiu, brecha })
}
linhas.sort((a, b) => (b.divergiu + b.brecha * 2) - (a.divergiu + a.brecha * 2) || b.subOps - a.subOps)
for (const r of linhas) {
  const sit = [r.divergiu ? 'SUB≠PAGO' : '', r.brecha ? 'MAIS OPERADORES QUE VAGAS' : ''].filter(Boolean).join(' + ') || 'ok'
  console.log('  ' + r.n.padEnd(22) +
    '  ' + String(r.subOps).padStart(6) +
    '  ' + String(r.pgOps ?? '—').padStart(11) +
    '   R$ ' + String(r.val != null ? r.val.toFixed(2) : '—').padStart(8) +
    '   ' + String(r.cad).padStart(10) +
    '  ' + String(r.viv).padStart(8) +
    '   ' + sit)
}
console.log('─'.repeat(112))
console.log(`\n  assinaturas onde o operator_count NAO bate com a ultima cobranca: ${divergentes}`)
console.log(`  tenants com MAIS operadores cadastrados do que vagas pagas:      ${brechas}`)

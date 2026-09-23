// Rode com: node scripts/clientes-equipe.mjs
// OS CLIENTES COM EQUIPE — os que a migracao de preco atinge.
// So leitura. Alem do preco, mostra se as vagas de operador estao sendo
// USADAS: quem paga por vaga vazia vai simplesmente virar Solo, e esse nao
// e um cliente ferido, e um cliente que se reacomoda sozinho.
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
    const r = await fetch(`${U}/rest/v1/${rota}`, {
      headers: { apikey: K, Authorization: 'Bearer ' + K, Range: `${de}-${de + 999}` },
    })
    const j = await r.json()
    if (!Array.isArray(j) || !j.length) break
    out.push(...j); if (j.length < 1000) break
  }
  return out
}

const agora = new Date()
// NAO PAGANTES. Sao SETE formas de pagamento, nao uma — descobri isso
// conferindo as assinaturas que vencem em 2099. Deixar qualquer uma de fora
// infla o MRR e coloca conta de teste no meio de cliente de verdade.
const CORTESIA = new Set([
  'lifetime_comp',      // DS MENTORIA 2.0
  'lifetime_owner',     // conta principal do dono
  'lifetime_partner',   // 00 company
  'cortesia_parceiro',  // HEYYTHALESOF
  'owner_access',
  'mock',               // DARKZIN, conta de teste do dono
  'admin',              // ativacao manual sem cobranca
])
const PACOTES = [{ ops: 3, nome: 'Scale 3', p: 169.90 }, { ops: 6, nome: 'Scale 6', p: 259.90 }, { ops: 10, nome: 'Scale 10', p: 399.90 }]
const pacote = n => n <= 0 ? { nome: 'Solo', p: 59.90 } : (PACOTES.find(x => n <= x.ops) || { nome: 'NAO CABE', p: null })

const subs = await todos('subscriptions?select=tenant_id,status,operator_count,payment_method,expires_at,created_at')
const tenants = await todos('tenants?select=id,name,owner_id,created_at')
const perfis = await todos('profiles?select=id,email,nome,role,tenant_id,last_seen_at,removed_from_tenant_id')

const porTenant = new Map()
for (const s of subs) {
  if (!s.expires_at) continue
  const at = porTenant.get(s.tenant_id)
  if (!at || new Date(s.expires_at) > new Date(at.expires_at)) porTenant.set(s.tenant_id, s)
}
const pagantes = [...porTenant.values()].filter(s =>
  new Date(s.expires_at) > agora && s.status === 'active' && !CORTESIA.has(s.payment_method))

const comEquipe = pagantes.filter(s => Number(s.operator_count || 0) > 0)
  .sort((a, b) => Number(b.operator_count) - Number(a.operator_count))

const d30 = new Date(agora - 30 * 86400000)
const linhas = comEquipe.map(s => {
  const t = tenants.find(x => x.id === s.tenant_id)
  const dono = perfis.find(p => p.id === t?.owner_id)
  const ops = perfis.filter(p => p.tenant_id === s.tenant_id && p.role === 'operator' && !p.removed_from_tenant_id)
  const vivos = ops.filter(p => p.last_seen_at && new Date(p.last_seen_at) > d30)
  const n = Number(s.operator_count || 0)
  const hoje = calculatePrice(n).total
  const nv = pacote(n)
  return {
    nome: (t?.name || '—').slice(0, 22),
    email: (dono?.email || '—').slice(0, 30),
    pagas: n,
    noTenant: ops.length,
    ativos30d: vivos.length,
    hoje, pacote: nv.nome, novo: nv.p,
    delta: nv.p - hoje,
    pct: Math.round((nv.p / hoje - 1) * 100),
    vence: Math.ceil((new Date(s.expires_at) - agora) / 86400000),
    cliente: t?.created_at ? Math.floor((agora - new Date(t.created_at)) / 86400000) : null,
  }
})

const L = '─'.repeat(122)
console.log(L)
console.log('  OS 18 CLIENTES COM EQUIPE   (vagas = pagas · no tenant = operadores cadastrados · ativos = viram o sistema em 30d)')
console.log(L)
console.log('  CLIENTE                 E-MAIL DO ADMIN                 VAGAS  NO TENANT  ATIVOS   PAGA HOJE   PACOTE      NOVO      AUMENTO   VENCE  CLIENTE HA')
console.log(L)
for (const r of linhas) {
  console.log(
    '  ' + r.nome.padEnd(22) +
    '  ' + r.email.padEnd(30) +
    '  ' + String(r.pagas).padStart(4) +
    '  ' + String(r.noTenant).padStart(8) +
    '  ' + String(r.ativos30d).padStart(6) +
    '   R$ ' + r.hoje.toFixed(2).padStart(7) +
    '  ' + r.pacote.padEnd(9) +
    ' R$ ' + r.novo.toFixed(2).padStart(7) +
    '   +' + (r.delta.toFixed(2) + ' (' + r.pct + '%)').padEnd(16) +
    ' ' + (r.vence + 'd').padStart(5) +
    '  ' + (r.cliente != null ? r.cliente + 'd' : '—').padStart(7)
  )
}
console.log(L)

const somaHoje = linhas.reduce((a, r) => a + r.hoje, 0)
const somaNovo = linhas.reduce((a, r) => a + r.novo, 0)
console.log(`\n  somam hoje R$ ${somaHoje.toFixed(2)}/mes  ->  R$ ${somaNovo.toFixed(2)}/mes   (+R$ ${(somaNovo - somaHoje).toFixed(2)}, +${Math.round((somaNovo / somaHoje - 1) * 100)}%)`)
console.log(`  representam ${((somaHoje / 6224.53) * 100).toFixed(0)}% do MRR atual, sendo ${linhas.length} de 84 clientes\n`)

// quem paga por vaga que ninguem usa
const vazias = linhas.filter(r => r.ativos30d === 0)
const parciais = linhas.filter(r => r.ativos30d > 0 && r.ativos30d < r.pagas)
console.log(`  VAGAS PAGAS SEM NINGUEM ATIVO EM 30 DIAS: ${vazias.length} clientes`)
for (const r of vazias) console.log(`     ${r.nome.padEnd(22)} paga ${r.pagas} vaga(s), ${r.noTenant} cadastrado(s), 0 ativo(s)  ->  viraria Solo sem perder nada`)
console.log(`\n  USAM MENOS VAGAS DO QUE PAGAM: ${parciais.length} clientes`)
for (const r of parciais) console.log(`     ${r.nome.padEnd(22)} paga ${r.pagas}, usa ${r.ativos30d}`)

const usamTudo = linhas.filter(r => r.ativos30d >= r.pagas && r.pagas > 0)
console.log(`\n  USAM TUDO QUE PAGAM (os que realmente sentem o aumento): ${usamTudo.length}`)
for (const r of usamTudo) console.log(`     ${r.nome.padEnd(22)} ${r.pagas} vagas, ${r.ativos30d} ativos   R$ ${r.hoje.toFixed(2)} -> R$ ${r.novo.toFixed(2)}  (+${r.pct}%)`)

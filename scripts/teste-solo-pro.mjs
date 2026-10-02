// Prova o Solo Pro a 89,90 (02/10/2026):
//   1. o preço de cada período (o que a tela manda e o servidor aceita)
//   2. Solo x Solo Pro pelo valor mensal (lib/pro.js) em todos os períodos,
//      inclusive quem ainda está no preço antigo (99,90)
//   3. valorDoPlano: com saldo de afiliado abatido, a assinatura grava o
//      preço do plano (linha de teste no banco, apagada no fim)
//   node scripts/teste-solo-pro.mjs
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { calculatePrice, pacotePorId } from '../lib/pricing.js'
import { ehPro } from '../lib/pro.js'
import { PLANS } from '../lib/plans.js'
import { valorDoPlano } from '../lib/affiliate-credit.js'

let falhas = 0
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) falhas++ }
const r2 = v => Math.round(v * 100) / 100

console.log('\n1) preço por período')
ok(pacotePorId('solo-pro').preco === 89.90, 'Solo Pro = 89,90')
ok(calculatePrice(0, { pro: true }).total === 89.90, 'calculatePrice(0, pro) = 89,90')
ok(calculatePrice(0).total === 59.90, 'Solo continua 59,90')
for (const p of PLANS) {
  const solo = r2(59.90 * p.months * (1 - p.discount)), pro = r2(89.90 * p.months * (1 - p.discount))
  console.log(`     ${p.id.padEnd(10)} Solo R$ ${solo.toFixed(2).padStart(7)}   Solo Pro R$ ${pro.toFixed(2).padStart(7)}  (${(pro / p.months).toFixed(2)}/mês)`)
}

console.log('\n2) Solo x Solo Pro pelo valor (corte no meio do vão)')
for (const p of PLANS) {
  const solo = r2(59.90 * p.months * (1 - p.discount)), pro = r2(89.90 * p.months * (1 - p.discount)), antigo = r2(99.90 * p.months * (1 - p.discount))
  ok(!ehPro({ operator_count: 0, total_amount: solo, plan_months: p.months }), `${p.id}: Solo (${solo}) NÃO é Pro`)
  ok(ehPro({ operator_count: 0, total_amount: pro, plan_months: p.months }), `${p.id}: Solo Pro novo (${pro}) é Pro`)
  ok(ehPro({ operator_count: 0, total_amount: antigo, plan_months: p.months }), `${p.id}: Solo Pro antigo (${antigo}) continua Pro`)
}
ok(ehPro({ operator_count: 2, total_amount: 129.90, plan_months: 1 }), 'Dupla é Pro')

console.log('\n3) valorDoPlano com saldo de afiliado (banco real, linha de teste)')
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const TENANT = '64609b6c-3947-4e3d-b31d-3fd169f5d088' // conta de teste leofritz178
const ID = 'TESTE-VDP-' + Date.now()
ok(await valorDoPlano(sb, ID, 89.90) === 89.90, 'sem desconto: grava o que foi pago')
const { error } = await sb.from('affiliate_commissions').insert({ affiliate_tenant_id: TENANT, referred_tenant_id: TENANT, asaas_payment_id: ID, payment_amount: 0, commission_amount: 30, rate: 0, status: 'reservado', paid_note: 'desconto:' + ID })
if (error) { console.log('  ✗ não consegui criar a linha de teste:', error.message); falhas++ }
else {
  try {
    const v = await valorDoPlano(sb, ID, 59.90)
    ok(v === 89.90, `PIX de 59,90 + 30 de saldo → grava ${v} (preço do plano)`)
    ok(ehPro({ operator_count: 0, total_amount: v, plan_months: 1 }), 'e continua Pro')
    ok(!ehPro({ operator_count: 0, total_amount: 59.90, plan_months: 1 }), '(sem a correção, 59,90 seria lido como Solo)')
    await sb.from('affiliate_commissions').update({ status: 'paid', paid_note: 'Usado como desconto na assinatura (PIX ' + ID + ')' }).eq('asaas_payment_id', ID)
    ok(await valorDoPlano(sb, ID, 59.90) === 89.90, 'depois de consumido, mesmo valor (ordem não importa)')
  } finally {
    await sb.from('affiliate_commissions').delete().eq('asaas_payment_id', ID)
    const { count } = await sb.from('affiliate_commissions').select('id', { count: 'exact', head: true }).eq('asaas_payment_id', ID)
    ok(count === 0, 'linha de teste apagada')
  }
}
console.log(falhas ? `\n  ${falhas} FALHA(S)` : '\n  tudo certo')
process.exit(falhas ? 1 : 0)

// Antes de mexer no corte Solo x Solo Pro (lib/pro.js): quem muda de lado?
// So leitura.  node scripts/checa-corte-pro.mjs
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const agora = new Date()
const { data: subs, error } = await sb.from('subscriptions').select('tenant_id,total_amount,plan_months,operator_count,status,expires_at,external_id,payment_method').eq('status', 'active')
if (error) throw error
const vivas = subs.filter(s => s.expires_at && new Date(s.expires_at) > agora && Number(s.operator_count || 0) === 0 && Number(s.total_amount) > 0)
const mensal = s => Number(s.total_amount) / Math.max(1, Number(s.plan_months || 1))
console.log('assinaturas ativas sem operador e pagas:', vivas.length)
const faixa = vivas.filter(s => mensal(s) > 59.9 && mensal(s) < 75)
console.log('mensal entre 59,90 e 75 (zona que importa pro corte):', faixa.map(s => ({ tenant: s.tenant_id, mensal: mensal(s).toFixed(2), meses: s.plan_months, pm: s.payment_method })))
const proAntes = vivas.filter(s => mensal(s) >= 65).length, proDepois = vivas.filter(s => mensal(s) >= 63.5).length
console.log('Pro com corte 65:', proAntes, '· com corte 63,50:', proDepois)
/* quem pagou com saldo de afiliado (o valor gravado ficou menor que o plano) */
const { data: usadas } = await sb.from('affiliate_commissions').select('affiliate_tenant_id,commission_amount,status,paid_by,paid_note').or('status.eq.reservado,paid_by.eq.desconto_assinatura')
console.log('comissoes reservadas/usadas como desconto:', usadas?.length || 0, usadas?.map(c => ({ t: c.affiliate_tenant_id, v: c.commission_amount, st: c.status, nota: c.paid_note })))

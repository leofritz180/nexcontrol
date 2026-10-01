// ═══════════════════════════════════════════════════════════════════════
// SALDO DE AFILIADO VIRA DESCONTO NA RENOVAÇÃO (decisão do dono, 01/10/2026)
//
// O saldo é a soma das comissões ainda não pagas (affiliate_commissions
// com status 'pending', onde affiliate_tenant_id = o tenant do afiliado).
// Antes ele só saía por PIX manual do dono; agora abate automaticamente o
// PIX da próxima ASSINATURA (renovação/novo ciclo). Upgrade de operador no
// meio do ciclo e o grupo avulso não usam o saldo.
//
// CICLO DE VIDA de uma comissão (o campo status é texto livre, sem DDL):
//   pending    saldo disponível
//   reservado  amarrada a um PIX de renovação gerado e ainda não pago
//              (paid_note = 'desconto:<mp_payment_id>')
//   paid       paga. paid_by = 'desconto_assinatura' quando foi usada como
//              desconto; = e-mail do dono quando foi PIX manual.
//
// Se o PIX reservado não for pago, a reserva volta a ser saldo na próxima
// cobrança gerada (liberarReservasVencidas). Se o saldo for maior que o
// preço, o PIX fica em R$ 1,00 (o mínimo pra existir um PIX) e o resto
// continua como saldo: a comissão usada pela metade é DIVIDIDA em duas
// linhas, a usada e a que sobra.
// ═══════════════════════════════════════════════════════════════════════

import { PIX_MINIMO, descontoPara } from './affiliate-desconto.js'
export { PIX_MINIMO, descontoPara }
const r2 = v => Math.round(Number(v || 0) * 100) / 100

/** Saldo disponível (pending + reservas cujo PIX não foi pago). */
export async function saldoAfiliado(sb, tenantId) {
  if (!tenantId) return 0
  try {
    const { data } = await sb.from('affiliate_commissions')
      .select('commission_amount, status, paid_note')
      .eq('affiliate_tenant_id', tenantId)
      .in('status', ['pending', 'reservado'])
    const reservas = (data || []).filter(c => c.status === 'reservado')
    const pagos = await pagamentosAprovados(sb, reservas.map(c => idDaReserva(c.paid_note)))
    return r2((data || [])
      .filter(c => c.status === 'pending' || !pagos.has(idDaReserva(c.paid_note)))
      .reduce((s, c) => s + Number(c.commission_amount || 0), 0))
  } catch (e) {
    console.error('[affiliate-credit] saldo falhou', e?.message)
    return 0
  }
}


const idDaReserva = note => (String(note || '').startsWith('desconto:') ? String(note).slice(9) : null)

async function pagamentosAprovados(sb, ids) {
  const lista = [...new Set(ids.filter(Boolean))]
  if (!lista.length) return new Set()
  const { data } = await sb.from('mp_payments').select('mp_payment_id, status').in('mp_payment_id', lista)
  return new Set((data || []).filter(p => ['approved', 'paid'].includes(p.status)).map(p => String(p.mp_payment_id)))
}

/**
 * Reservas de PIX que não foram pagos voltam a ser saldo. ANTES de soltar,
 * o PIX antigo é CANCELADO no Mercado Pago: senão a pessoa podia pagar o QR
 * velho (com desconto) e ainda ganhar o desconto de novo no QR novo. Se o
 * cancelamento falhar (ex.: foi pago nesse meio tempo), a reserva fica.
 */
async function liberarReservasVencidas(sb, tenantId) {
  const { data } = await sb.from('affiliate_commissions')
    .select('id, paid_note').eq('affiliate_tenant_id', tenantId).eq('status', 'reservado')
  if (!data?.length) return
  const ids = [...new Set(data.map(c => idDaReserva(c.paid_note)).filter(Boolean))]
  const { data: pags } = await sb.from('mp_payments').select('mp_payment_id, status').in('mp_payment_id', ids)
  const statusDe = Object.fromEntries((pags || []).map(p => [String(p.mp_payment_id), p.status]))
  const liberados = new Set()
  for (const id of ids) {
    const st = statusDe[id]
    if (['approved', 'paid'].includes(st)) continue
    if (st === 'pending' && !(await cancelarNoMP(id))) continue
    if (st === 'pending') await sb.from('mp_payments').update({ status: 'cancelled' }).eq('mp_payment_id', id).eq('status', 'pending')
    liberados.add(id)
  }
  const soltar = data.filter(c => liberados.has(idDaReserva(c.paid_note))).map(c => c.id)
  if (soltar.length) {
    await sb.from('affiliate_commissions').update({ status: 'pending', paid_note: null }).in('id', soltar).eq('status', 'reservado')
  }
}

async function cancelarNoMP(mpId) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) return false
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${mpId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    const j = await r.json().catch(() => ({}))
    return r.ok && ['cancelled', 'rejected', 'expired'].includes(j?.status)
  } catch { return false }
}

/**
 * Amarra R$ `valor` do saldo ao PIX `mpPaymentId`. Chamado DEPOIS de o PIX
 * existir, com o desconto que foi efetivamente abatido do valor.
 * Devolve quanto conseguiu reservar.
 */
export async function reservarDesconto(sb, { tenantId, mpPaymentId, valor }) {
  let falta = r2(valor)
  if (!tenantId || !mpPaymentId || falta <= 0) return 0
  try {
    await liberarReservasVencidas(sb, tenantId)
    const { data: comms } = await sb.from('affiliate_commissions')
      .select('*').eq('affiliate_tenant_id', tenantId).eq('status', 'pending')
      .order('created_at', { ascending: true })
    const nota = 'desconto:' + mpPaymentId
    let reservado = 0
    for (const c of comms || []) {
      if (falta <= 0) break
      const v = Number(c.commission_amount || 0)
      if (v <= 0) continue
      if (v <= falta + 0.001) {
        // usa a comissão inteira
        const { error } = await sb.from('affiliate_commissions')
          .update({ status: 'reservado', paid_note: nota }).eq('id', c.id).eq('status', 'pending')
        if (!error) { reservado = r2(reservado + v); falta = r2(falta - v) }
      } else {
        // usa só uma parte: a linha original fica com o que SOBRA (pending)
        // e nasce uma linha nova com a parte usada (reservado)
        const usado = falta, sobra = r2(v - usado)
        const { error: e1 } = await sb.from('affiliate_commissions')
          .update({ commission_amount: sobra }).eq('id', c.id).eq('status', 'pending')
        if (e1) continue
        const { error: e2 } = await sb.from('affiliate_commissions').insert({
          affiliate_tenant_id: c.affiliate_tenant_id,
          referred_tenant_id: c.referred_tenant_id,
          asaas_payment_id: `${c.asaas_payment_id}:parte:${mpPaymentId}`,
          payment_amount: c.payment_amount,
          commission_amount: usado,
          rate: c.rate,
          status: 'reservado',
          paid_note: nota,
          created_at: c.created_at,
        })
        if (e2) {
          // desfaz a divisão pra não sumir dinheiro do afiliado
          await sb.from('affiliate_commissions').update({ commission_amount: v }).eq('id', c.id)
          console.error('[affiliate-credit] divisão falhou', e2.message)
          continue
        }
        reservado = r2(reservado + usado); falta = 0
      }
    }
    return reservado
  } catch (e) {
    console.error('[affiliate-credit] reserva falhou', e?.message)
    return 0
  }
}

/** PIX aprovado: as comissões reservadas pra ele viram 'paid' (usadas como desconto). Idempotente. */
export async function consumirDesconto(sb, mpPaymentId) {
  if (!mpPaymentId) return
  try {
    await sb.from('affiliate_commissions').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_by: 'desconto_assinatura',
      paid_note: 'Usado como desconto na assinatura (PIX ' + mpPaymentId + ')',
    }).eq('status', 'reservado').eq('paid_note', 'desconto:' + mpPaymentId)
  } catch (e) {
    console.error('[affiliate-credit] consumo falhou', e?.message)
  }
}

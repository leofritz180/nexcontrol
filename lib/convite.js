// Server-only — API routes e scripts.
//
// CONVITE DE TESTE: um link que cria UMA conta com acesso grátis por N meses
// e até N operadores. Sem tabela nova: o token é assinado (HMAC com a chave
// de serviço do Supabase, que só o servidor tem) e carrega tudo que precisa;
// o "só pode ser usado uma vez" vem do UNIQUE em subscriptions.idempotency_key
// — a assinatura de cortesia nasce com idempotency_key = 'convite:<id>', e a
// segunda tentativa bate na constraint.
//
//   token = base64url("<id>.<operadores>.<meses>.<validadeDoLinkEmMs>") + "." + assinatura
//
// Gerar: node scripts/convite-teste.mjs --operadores=2 --meses=1
import crypto from 'crypto'

const segredo = () => process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const deb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
const assinar = corpo => b64u(crypto.createHmac('sha256', segredo()).update(corpo).digest()).slice(0, 27)

export function gerarConvite({ operadores = 2, meses = 1, validadeDias = 30 } = {}) {
  const id = crypto.randomBytes(6).toString('hex')
  const corpo = `${id}.${Number(operadores)}.${Number(meses)}.${Date.now() + validadeDias * 86400e3}`
  return { id, token: b64u(corpo) + '.' + assinar(corpo) }
}

/** Devolve { ok, id, operadores, meses, validoAte } ou { ok:false, motivo }. */
export function lerConvite(token) {
  try {
    const [corpoB, sig] = String(token || '').split('.')
    if (!corpoB || !sig) return { ok: false, motivo: 'inválido' }
    const corpo = deb64u(corpoB)
    const esperado = assinar(corpo)
    if (esperado.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(sig))) return { ok: false, motivo: 'inválido' }
    const [id, op, m, exp] = corpo.split('.')
    if (Number(exp) < Date.now()) return { ok: false, motivo: 'expirado' }
    return { ok: true, id, operadores: Number(op), meses: Number(m), validoAte: Number(exp), chave: 'convite:' + id }
  } catch { return { ok: false, motivo: 'inválido' } }
}

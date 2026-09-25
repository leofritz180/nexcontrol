import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { GRUPO_PRECOS } from '../../../lib/network-grupo'

// ─────────────────────────────────────────────────────────────────────────
// O LINK DO GRUPO NEX NETWORK — entregue SÓ PELO SERVIDOR, e só a quem
// pagou.
//
// POR QUE ELE NÃO PODE SER NEXT_PUBLIC_: toda variável com esse prefixo é
// embutida no bundle que vai pro navegador. O link ficaria legível no
// devtools de qualquer visitante, e um convite de WhatsApp é a própria
// chave do grupo — quem tem o link entra, pagando ou não. O produto
// inteiro (R$ 97 pelo acesso) evapora.
//
// Aqui ele mora em NEX_GRUPO_URL, sem prefixo público: existe no servidor
// e nunca sai daqui sem a conferência abaixo.
//
// A CONFERÊNCIA: um pagamento aprovado de R$ 97,00 no nome do usuário.
// Esse valor é único no sistema — nenhum plano, período ou compra de
// operador cai nele. É o que permite identificar o comprador sem tabela
// nova, já que esta instância do Supabase não dá DDL pela service role.
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

function servico() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function usuarioDoToken(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false }, global: { headers: { Authorization: 'Bearer ' + token } } }
  )
  const { data } = await anon.auth.getUser()
  return data?.user || null
}

export async function GET(req) {
  try {
    const user = await usuarioDoToken(req)
    if (!user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })

    const sb = servico()
    const { data: pagos } = await sb.from('mp_payments')
      .select('mp_payment_id,status,amount,operator_count,plan_months')
      .eq('user_id', user.id)
      .in('status', ['approved', 'paid'])
      .or(`amount.in.(${GRUPO_PRECOS.join(',')}),and(operator_count.eq.-1,plan_months.eq.0)`)
      .limit(1)

    if (!pagos?.length) {
      // 402 e não 403: não é falta de permissão, é falta de pagamento.
      return NextResponse.json({ error: 'Pagamento do grupo não encontrado.' }, { status: 402 })
    }

    const link = (process.env.NEX_GRUPO_URL || '').trim()
    if (!link) {
      // Pagou, mas o link ainda não foi configurado. Não é erro do cliente:
      // ele entra pela lista, que é o caminho manual.
      return NextResponse.json({ link: '', manual: true })
    }
    return NextResponse.json({ link })
  } catch (e) {
    console.error('[network-grupo]', e?.message)
    return NextResponse.json({ error: 'Erro ao liberar o acesso.' }, { status: 500 })
  }
}

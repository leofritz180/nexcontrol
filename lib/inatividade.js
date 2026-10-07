// ─────────────────────────────────────────────────────────────────────────
// INATIVIDADE — o sinal que antecede o cancelamento.
//
// Medido em 06/10/2026 nos últimos 4 meses: quem renovou tinha lançado 18
// vezes nas duas semanas antes do vencimento; quem cancelou, ZERO. 59% dos
// que cancelaram passaram 14 dias sem lançar nada antes de vencer, contra
// 24% dos que renovam. O cliente não cancela porque o produto falhou: ele
// cancela porque parou de alimentar o painel e, duas semanas depois, não
// vê motivo pra pagar.
//
// O que conta como "lançar": criar meta ou registrar remessa (as duas
// tabelas que a operação alimenta). Login NÃO conta — abrir o app e não
// lançar é justamente o caso que a gente quer pegar.
//
// Marcos: 3 dias (lembrete) e 7 dias (alerta). Cada marco dispara UMA vez
// por silêncio: se a pessoa volta a lançar e para de novo, dispara de novo.
// Quem nunca lançou nada fica de fora — isso é ativação, outro problema,
// outro cron (trial-notifications).
// ─────────────────────────────────────────────────────────────────────────

const DIA = 86400000

export const MARCOS = [
  { dias: 3, segmento: 'inativo_3d' },
  { dias: 7, segmento: 'inativo_7d' },
]

/** data em pt-BR, no fuso de Brasília ("terça-feira, 3 de outubro") */
export function dataCurta(ms) {
  return new Date(ms).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })
}

/**
 * Tenants pagantes com assinatura em dia, com o último lançamento (meta ou
 * remessa) de cada um. Devolve só quem bateu num marco HOJE.
 *
 * @returns {Promise<Array<{tenantId, ultimo: number, dias: number, marco}>>}
 */
export async function alvosInatividade(sb, agora = Date.now()) {
  // assinaturas pagas e em dia (cortesia de parceiro não é cliente)
  let subs = [], de = 0
  for (;;) {
    const { data, error } = await sb.from('subscriptions')
      .select('tenant_id,total_amount,payment_method,expires_at,status')
      .eq('status', 'active').gt('total_amount', 0).range(de, de + 999)
    if (error) throw new Error('subscriptions: ' + error.message)
    subs.push(...(data || []))
    if (!data || data.length < 1000) break
    de += 1000
  }
  const emDia = new Set(subs
    .filter(s => s.payment_method !== 'cortesia_parceiro' && s.expires_at && new Date(s.expires_at).getTime() > agora)
    .map(s => s.tenant_id))

  const alvos = []
  for (const tenantId of emDia) {
    const [{ data: r }, { data: m }] = await Promise.all([
      sb.from('remessas').select('created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('metas').select('created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    const ultimo = Math.max(r?.created_at ? new Date(r.created_at).getTime() : 0, m?.created_at ? new Date(m.created_at).getTime() : 0)
    if (!ultimo) continue                                  // nunca lançou: não é inatividade
    const dias = Math.floor((agora - ultimo) / DIA)
    const marco = MARCOS.find(x => x.dias === dias)
    if (!marco) continue
    alvos.push({ tenantId, ultimo, dias, marco })
  }
  return alvos
}

/** Já mandou este marco pra esta pessoa neste silêncio? (janela = desde o último lançamento) */
export async function jaAvisado(sb, userId, segmento, desdeMs) {
  const { data } = await sb.from('winback_log').select('id')
    .eq('user_id', userId).eq('segment', segmento).gte('sent_at', new Date(desdeMs).toISOString())
    .limit(1).maybeSingle()
  return !!data
}

/** Os textos. Dados, não promessas: quantos dias, desde quando. */
export function textos(marco, { nome, desde }) {
  if (marco.dias === 3) {
    return {
      push: {
        titulo: `${nome}, sua operação está sem registro há 3 dias`,
        corpo: `Último lançamento: ${desde}. O lucro final só fecha certo com o que você lança.`,
      },
      email: {
        subject: `${nome}, sua operação está sem registro desde ${desde}`,
        preheader: 'Faz 3 dias que nada entra no painel. O lucro final só fecha com o que é lançado.',
        bodyTitle: 'Faz 3 dias que o painel não recebe nada',
        bodyText: `${nome}, o último lançamento da sua operação foi em ${desde}. Não é cobrança — é lembrete: o NexControl calcula o lucro final em cima do que você lança, e cada remessa que fica de fora deixa o número errado. Leva um minuto pra colocar em dia.`,
        ctaText: 'Lançar agora',
      },
    }
  }
  return {
    push: {
      titulo: `${nome}, uma semana sem lançar nada`,
      corpo: `Desde ${desde} o painel está parado. Dois toques colocam tudo em dia.`,
    },
    email: {
      subject: `${nome}, uma semana sem registro na sua operação`,
      preheader: 'Desde ' + desde + ' nada entra no painel. Dois toques colocam tudo em dia.',
      bodyTitle: 'Uma semana sem nenhum lançamento',
      bodyText: `${nome}, o último lançamento foi em ${desde}. Sete dias é o tempo em que a operação some do painel e o mês fecha no escuro. Se foi correria, dois toques colocam tudo em dia. Se você parou porque algo não funcionou ou ficou confuso, me conta no suporte do painel — é assim que a ferramenta melhora.`,
      ctaText: 'Colocar em dia',
    },
  }
}

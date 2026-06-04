// ═══════════════════════════════════════════════════════════════
// NexControl — Win-back segmentation
// Define os segmentos de inatividade e suas mensagens.
// ═══════════════════════════════════════════════════════════════

export const WINBACK_SEGMENTS = [
  {
    id: '3d',
    minDaysInactive: 3,
    maxDaysInactive: 6,
    push: {
      title: 'Sua operacao tá esperando',
      body: 'Volta lá ver o lucro de hoje. Tem um operador novo e tudo!',
    },
    email: {
      subject: '{nome}, tem coisa nova rolando no seu painel',
      preheader: 'Os numeros nao param. Da uma olhada.',
      bodyTitle: 'Faz 3 dias que voce nao entra',
      bodyText: 'Sua operacao continua viva mesmo enquanto voce nao olha. Os numeros do dia podem te surpreender.',
      ctaText: 'Voltar pro painel',
    },
  },
  {
    id: '7d',
    minDaysInactive: 7,
    maxDaysInactive: 13,
    push: {
      title: 'Uma semana sem voce',
      body: 'Ja criou sua primeira meta? Bora começar.',
    },
    email: {
      subject: 'Vamos comecar juntos? 5min pro seu primeiro lucro',
      preheader: 'Te ajudo a configurar a primeira meta agora.',
      bodyTitle: 'Sua plataforma esta esperando',
      bodyText: 'Em 5 minutos voce cria sua primeira meta e ja vê como o sistema controla cada centavo. Eu te guio passo a passo.',
      ctaText: 'Criar minha primeira meta',
    },
  },
  {
    id: '14d',
    minDaysInactive: 14,
    maxDaysInactive: 44,
    push: {
      title: 'Seu acesso pode expirar',
      body: 'Volta antes do trial cair. Não perca o que ja construiu.',
    },
    email: {
      subject: 'Ultima chance: nao perca seu acesso ao NexControl',
      preheader: 'Ainda da tempo de salvar tudo.',
      bodyTitle: 'Sentimos sua falta no painel',
      bodyText: 'Voce assinou e ainda nao explorou tudo. Seu trial esta perto de expirar — depois o acesso é bloqueado. Volta agora e continua sem perder nada.',
      ctaText: 'Recuperar meu acesso',
    },
  },
  {
    id: 'reativacao',
    minDaysInactive: 45,
    maxDaysInactive: 9999,
    // Reenvia a cada 30d (sobrescreve cooldown padrao do shouldSend)
    repeatEveryDays: 30,
    push: {
      title: '{nome}, sentimos sua falta',
      body: 'Sua operacao esta esperando. Volta e ve o que mudou.',
    },
    email: {
      subject: '{nome}, ainda da tempo de voltar pro NexControl',
      preheader: 'Tudo que voce construiu continua salvo.',
      bodyTitle: 'Sua operacao ficou pausada',
      bodyText: 'Faz meses que voce nao entra. Mas seus dados, metas e historico continuam salvos. Volta sem perder nada — em 1 minuto voce ja esta operando de novo.',
      ctaText: 'Voltar pra minha operacao',
    },
  },
]

export function pickSegment(daysInactive) {
  return WINBACK_SEGMENTS.find(s => daysInactive >= s.minDaysInactive && daysInactive <= s.maxDaysInactive) || null
}

/**
 * Decide se devemos enviar uma mensagem ao user no segmento atual.
 * Regras:
 * - Cada user x segment x channel: maximo 1 envio TOTAL (anti-spam)
 * - Cooldown global: nao enviar nada pra mesmo user em < 24h (mesmo se segmento mudou)
 */
export function shouldSend({ segment, channel, recentLogs = [] }) {
  // Cooldown global 24h
  const dayAgo = Date.now() - 24 * 3600 * 1000
  const recentSomeChannel = recentLogs.some(l => new Date(l.sent_at).getTime() > dayAgo)
  if (recentSomeChannel) return false

  // Se o segmento aceita reenvio periodico, checa o ultimo envio desse segmento+channel
  if (segment.repeatEveryDays && segment.repeatEveryDays > 0) {
    const cooldownMs = segment.repeatEveryDays * 24 * 3600 * 1000
    const lastSameSeg = recentLogs
      .filter(l => l.segment === segment.id && l.channel === channel)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0]
    if (lastSameSeg && (Date.now() - new Date(lastSameSeg.sent_at).getTime()) < cooldownMs) {
      return false
    }
    return true
  }

  // Padrao: 1x por usuario+segmento+canal
  const alreadySent = recentLogs.some(l => l.segment === segment.id && l.channel === channel)
  if (alreadySent) return false
  return true
}

/**
 * Substitui placeholders nos templates: {nome}
 */
export function fillTemplate(text, vars = {}) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : `{${k}}`)
}

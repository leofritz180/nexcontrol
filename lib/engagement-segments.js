// Segmentos de push de ENGAJAMENTO — para clientes PAGANTES que ficaram inativos.
// Diferente do winback (que mira em users que nunca pagaram ou churned ha muito).
// Aqui o objetivo eh trazer de volta um cliente PRO que ja virou dormente,
// pra evitar perda de renovacao.

export const ENGAGEMENT_SEGMENTS = [
  {
    id: 'engagement_1d',
    minDaysInactive: 1,
    maxDaysInactive: 1,
    push: {
      title: 'Sua operacao tá rodando sem voce',
      body: 'Faz 1 dia sem dar uma olhada. Os numeros podem te surpreender.',
    },
  },
  {
    id: 'engagement_2d',
    minDaysInactive: 2,
    maxDaysInactive: 2,
    push: {
      title: '{nome}, tem update no seu painel',
      body: 'Faz 2 dias. Tudo bem por ai? Da uma olhada no que rolou.',
    },
  },
  {
    id: 'engagement_3d',
    minDaysInactive: 3,
    maxDaysInactive: 3,
    push: {
      title: 'Faz 3 dias sem voce, {nome}',
      body: 'Sua operacao continua viva. Volta antes que a renovacao chegue.',
    },
  },
  {
    id: 'engagement_7d',
    minDaysInactive: 7,
    maxDaysInactive: 7,
    push: {
      title: 'Uma semana inteira sem voce, {nome}',
      body: 'Tem algo te impedindo de usar? Volta la — ou me responde por aqui.',
    },
  },
]

export function pickEngagementSegment(daysInactive) {
  // Match exato no dia — so envia 1x por marco (1d, 2d, 3d, 7d)
  return ENGAGEMENT_SEGMENTS.find(s => daysInactive === s.minDaysInactive) || null
}

export function fillTemplate(text, vars = {}) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : `{${k}}`)
}

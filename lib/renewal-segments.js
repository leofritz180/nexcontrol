// ═══════════════════════════════════════════════════════════════
// NexControl — Mensagens de RENOVAÇÃO / REATIVAÇÃO / TRIAL
// Cada momento tem copy propria (push + email). Placeholders: {nome}
// Precos reais: a partir de R$ 39,90/mes (base) + R$ 19,90/operador.
// NUNCA inventar desconto/cupom.
// ═══════════════════════════════════════════════════════════════

export const RENEWAL_SEGMENTS = {
  // ─── ANTES de vencer (assinatura ainda ativa) ───
  expiring_3: {
    push: { title: '{nome}, faltam 3 dias da sua assinatura', body: 'Renove com antecedencia e mantenha a operacao rodando sem pausa.' },
    email: {
      subject: '{nome}, faltam 3 dias da sua assinatura NexControl',
      preheader: 'Renove com antecedencia e nao perca o acesso.',
      bodyTitle: 'Faltam 3 dias',
      bodyText: '{nome}, sua assinatura do NexControl vence em 3 dias. Renove agora e garanta que voce e sua equipe continuem com a operacao em tempo real, sem nenhuma interrupcao. Leva menos de 1 minuto.',
      ctaText: 'Renovar agora',
    },
  },
  expiring_2: {
    push: { title: 'Faltam 2 dias, {nome}', body: 'Garanta seu acesso antes de vencer. Renove em 1 clique.' },
    email: {
      subject: '{nome}, faltam 2 dias — garanta seu acesso',
      preheader: 'Sua assinatura esta perto de vencer.',
      bodyTitle: 'Faltam 2 dias',
      bodyText: '{nome}, faltam apenas 2 dias pra sua assinatura vencer. Pra nao correr o risco do acesso ser bloqueado no meio de uma operacao, renove agora. Mantem tudo no ar e sua equipe trabalhando normal.',
      ctaText: 'Renovar agora',
    },
  },
  expiring_1: {
    push: { title: 'Ultimo dia, {nome}', body: 'Sua assinatura vence amanha. Renove agora pra nao perder acesso.' },
    email: {
      subject: 'Ultimo dia: sua assinatura NexControl vence amanha',
      preheader: 'Renove hoje pra nao ser bloqueado.',
      bodyTitle: 'Sua assinatura vence amanha',
      bodyText: '{nome}, amanha sua assinatura vence e o acesso e bloqueado. Renove hoje em 1 clique pra continuar com o controle total da operacao, sem perder seus dados, metas e equipe.',
      ctaText: 'Renovar antes de vencer',
    },
  },

  // ─── DEPOIS de vencer (acesso bloqueado) ───
  expired_1: {
    push: { title: 'Sua assinatura venceu', body: 'Reative em 1 clique e volte a operar agora mesmo.' },
    email: {
      subject: '{nome}, sua assinatura venceu — reative em 1 clique',
      preheader: 'Seu acesso esta bloqueado ate reativar.',
      bodyTitle: 'Sua assinatura venceu ontem',
      bodyText: '{nome}, sua assinatura venceu e o acesso ao painel foi bloqueado. Mas calma: seus dados, metas e historico continuam salvos. Reative agora e volte a operar em 1 minuto.',
      ctaText: 'Reativar acesso',
    },
  },
  expired_2: {
    push: { title: '{nome}, 2 dias sem acesso', body: 'Sua equipe esta sem o painel. Reative agora.' },
    email: {
      subject: '{nome}, faz 2 dias que seu acesso esta bloqueado',
      preheader: 'Sua operacao esta sem controle em tempo real.',
      bodyTitle: '2 dias sem acesso',
      bodyText: '{nome}, faz 2 dias que o NexControl esta bloqueado pra voce e sua equipe. Cada dia sem o painel e a operacao rodando no escuro. Reative agora e retome o controle — seus dados continuam intactos.',
      ctaText: 'Reativar minha conta',
    },
  },
  expired_3: {
    push: { title: '3 dias bloqueado, {nome}', body: 'Seus dados continuam salvos. Reative e volte a operar.' },
    email: {
      subject: '3 dias sem acesso — seus dados continuam salvos',
      preheader: 'Da tempo de voltar sem perder nada.',
      bodyTitle: '3 dias sem o seu painel',
      bodyText: '{nome}, ja sao 3 dias com o acesso bloqueado. Tudo que voce construiu — metas, remessas, ranking da equipe — continua guardado e te esperando. Reative em 1 clique e volte exatamente de onde parou.',
      ctaText: 'Voltar a operar',
    },
  },
  expired_7: {
    push: { title: '1 semana sem voce, {nome}', body: 'Nao perca sua operacao. Reative antes que esfrie.' },
    email: {
      subject: '{nome}, ja faz 1 semana — nao perca sua operacao',
      preheader: 'Sua conta continua salva, mas volte logo.',
      bodyTitle: 'Uma semana sem o NexControl',
      bodyText: '{nome}, ja faz 1 semana que sua assinatura venceu. Sua equipe esta sem controle em tempo real e voce sem visao do lucro. Tudo ainda esta salvo — reative agora e retome a operacao antes de perder o ritmo.',
      ctaText: 'Reativar agora',
    },
  },

  // ─── BACKLOG: qualquer vencido (inclusive antigo) que nunca recebeu nada ───
  expired_revive: {
    push: { title: '{nome}, sua conta esta te esperando', body: 'Tudo que voce construiu continua salvo. Volte a operar.' },
    email: {
      subject: '{nome}, sua operacao no NexControl esta te esperando',
      preheader: 'Seus dados continuam salvos. Reative quando quiser.',
      bodyTitle: 'Sua conta continua aqui',
      bodyText: '{nome}, sua assinatura do NexControl venceu ha um tempo, mas nada foi perdido: suas metas, remessas, equipe e historico continuam salvos. Quando quiser retomar o controle total da operacao, e so reativar — leva menos de 1 minuto e voce volta de onde parou.',
      ctaText: 'Reativar minha conta',
    },
  },

  // ─── TRIAL que nao converteu (inclusive antigos) ───
  trial_lapsed: {
    push: { title: '{nome}, chega de operar no escuro', body: 'Voce testou o NexControl. Bora assinar e ver o lucro de cada conta em tempo real.' },
    email: {
      subject: '{nome}, chega de operar no escuro',
      preheader: 'Lucro em tempo real, equipe no controle. A partir de R$ 39,90/mes.',
      bodyTitle: 'Voce testou. Agora bora pra valer?',
      bodyText: '{nome}, voce chegou a testar o NexControl mas nao assinou — e a operacao continua girando. Pensa rapido: hoje quanto do seu resultado voce controla no olho ou na planilha? Com o NexControl voce ve o lucro de cada conta em tempo real, acompanha cada operador e fecha cada meta sem erro nem retrabalho. E a partir de R$ 39,90/mes, e em 1 minuto voce ja esta no controle. Seus dados do teste continuam salvos — e so voltar.',
      ctaText: 'Assinar e assumir o controle',
    },
  },
}

// Bucket de quem esta pra vencer (daysLeft = dias ate expirar, ceil)
export function expiringSegmentId(daysLeft) {
  if (daysLeft === 3) return 'expiring_3'
  if (daysLeft === 2) return 'expiring_2'
  if (daysLeft === 1) return 'expiring_1'
  return null
}

// Bucket de quem ja venceu (daysSince = dias desde que venceu, floor).
// 1/2/3/7 = sequencia; qualquer outro >0 cai no revive (uma vez so).
export function expiredSegmentId(daysSince) {
  if (daysSince === 1) return 'expired_1'
  if (daysSince === 2) return 'expired_2'
  if (daysSince === 3) return 'expired_3'
  if (daysSince === 7) return 'expired_7'
  if (daysSince > 0) return 'expired_revive'
  return null
}

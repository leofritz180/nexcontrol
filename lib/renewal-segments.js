// ═══════════════════════════════════════════════════════════════
// NexControl — Mensagens de RENOVAÇÃO / REATIVAÇÃO / TRIAL
//
// Cada momento tem copy própria (push + e-mail). Desde 25/09/2026 elas
// vendem a 2.0 e falam do PLANO DA PESSOA, não de "assinatura" genérica.
// Placeholders (preenchidos pelo cron, ver app/api/cron/renewal):
//   {nome}      primeiro nome
//   {plano}     Solo · Solo Pro · Dupla · Scale 3/6/10 (pelo nº de operadores)
//   {preco}     R$ 129,90 (o preço mensal do plano)
//   {oferta}    a frase de preço/plano certa pra ela (ver OFERTA no cron):
//               solo   → "Seu plano continua R$ 59,90/mês (Solo). Quer a leitura da
//                         operação, a captura de QR e a Sala ao vivo? Solo Pro, R$ 99,90."
//               equipe → "Com N operadores, seu plano é o Dupla: R$ 129,90/mês, com
//                         Sala ao vivo e leitura da operação incluídas."
//   {novidades} a lista do que mudou desde a última vez que ela pagou
//
// Preços REAIS de lib/pricing.js. NUNCA inventar desconto/cupom.
// ═══════════════════════════════════════════════════════════════

import { precoComPacote, pacotePorId } from './pricing.js'

export const NOVIDADES_20 = 'Painel 2.0 inteiro redesenhado · Sala ao vivo (a tela do operador em tempo real) · push com a voz que você escolher · Central de aulas · lucro por conta e por rede'

const brl = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',')

/**
 * As variáveis de plano/preço pra uma conta, pelo nº de operadores da
 * última assinatura dela. Uma fonte só (lib/pricing) — nunca digitar preço
 * na copy. Devolve { plano, preco, oferta, novidades }.
 */
export function varsDePlano(operadores = 0) {
  const n = Math.max(0, Number(operadores) || 0)
  const { total, pacote, excedente } = precoComPacote(n)
  const plano = excedente > 0 ? `${pacote.nome} + ${excedente} operador${excedente === 1 ? '' : 'es'}` : pacote.nome
  const preco = brl(total)
  const oferta = n === 0
    ? `Seu plano continua ${brl(pacotePorId('solo').preco)}/mês (Solo). Quer a leitura da operação, a captura automática de QR e a Sala ao vivo? Solo Pro, ${brl(pacotePorId('solo-pro').preco)}/mês.`
    : `Com ${n} operador${n === 1 ? '' : 'es'}, seu plano é o ${plano}: ${preco}/mês, com Sala ao vivo e leitura da operação incluídas.`
  return { plano, preco, oferta, novidades: NOVIDADES_20 }
}

export const RENEWAL_SEGMENTS = {
  // ─── ANTES de vencer (assinatura ainda ativa) ───
  expiring_3: {
    push: { title: '{nome}, faltam 3 dias · {plano} por {preco}', body: 'Renova sem pausa e continua na 2.0: Sala ao vivo, push com voz e lucro por conta.' },
    email: {
      subject: '{nome}, faltam 3 dias — e a 2.0 já está no seu painel',
      preheader: '{oferta}',
      bodyTitle: 'Faltam 3 dias',
      bodyText: '{nome}, sua assinatura vence em 3 dias. Desde a última vez que você pagou, a Nex Control virou 2.0: {novidades}. {oferta} Renova agora e sua equipe segue sem pausa — leva menos de 1 minuto no PIX.',
      ctaText: 'Renovar agora',
    },
  },
  expiring_2: {
    push: { title: 'Faltam 2 dias, {nome}', body: '{plano} por {preco}. Renova em 1 clique e não para a operação.' },
    email: {
      subject: '{nome}, faltam 2 dias — garanta seu acesso à 2.0',
      preheader: '{oferta}',
      bodyTitle: 'Faltam 2 dias',
      bodyText: '{nome}, faltam 2 dias pra sua assinatura vencer. Pra não travar no meio de uma operação, renova agora: {oferta} E você continua com tudo que chegou na 2.0 — {novidades}.',
      ctaText: 'Renovar agora',
    },
  },
  expiring_1: {
    push: { title: 'Último dia, {nome}', body: 'Vence amanhã. {plano} por {preco} — renova agora e não perde acesso.' },
    email: {
      subject: 'Último dia: sua Nex Control vence amanhã',
      preheader: 'Renove hoje e continue na 2.0 sem perder nada.',
      bodyTitle: 'Vence amanhã',
      bodyText: '{nome}, amanhã sua assinatura vence e o acesso é bloqueado. {oferta} Renova hoje, em 1 clique, e mantém metas, remessas, equipe e tudo que a 2.0 trouxe: {novidades}.',
      ctaText: 'Renovar antes de vencer',
    },
  },

  // ─── DEPOIS de vencer (acesso bloqueado) ───
  expired_1: {
    push: { title: 'Sua assinatura venceu', body: 'Reativa em 1 clique: {plano} por {preco}. Seus dados estão salvos.' },
    email: {
      subject: '{nome}, sua assinatura venceu — reative em 1 clique',
      preheader: '{oferta}',
      bodyTitle: 'Venceu ontem',
      bodyText: '{nome}, sua assinatura venceu e o painel foi bloqueado — mas nada foi perdido: metas, remessas, equipe e histórico continuam salvos. {oferta} E você volta direto na 2.0: {novidades}.',
      ctaText: 'Reativar acesso',
    },
  },
  expired_2: {
    push: { title: '{nome}, 2 dias sem acesso', body: 'Sua equipe está sem o painel. Reativa: {plano} por {preco}.' },
    email: {
      subject: '{nome}, faz 2 dias que seu acesso está bloqueado',
      preheader: 'Sua operação está rodando no escuro.',
      bodyTitle: '2 dias sem acesso',
      bodyText: '{nome}, faz 2 dias que a Nex Control está bloqueada pra você e sua equipe. Cada dia sem painel é operação no escuro. {oferta} Reativa agora e retoma o controle — na 2.0, com {novidades}.',
      ctaText: 'Reativar minha conta',
    },
  },
  expired_3: {
    push: { title: '3 dias bloqueado, {nome}', body: 'Seus dados continuam salvos. Reativa e volta pra 2.0.' },
    email: {
      subject: '3 dias sem acesso — seus dados continuam salvos',
      preheader: 'Dá tempo de voltar sem perder nada.',
      bodyTitle: '3 dias sem o seu painel',
      bodyText: '{nome}, já são 3 dias com o acesso bloqueado. Tudo que você construiu — metas, remessas, ranking da equipe — continua guardado. {oferta} Reativa em 1 clique e volta exatamente de onde parou, agora na 2.0: {novidades}.',
      ctaText: 'Voltar a operar',
    },
  },
  expired_7: {
    push: { title: '1 semana sem você, {nome}', body: 'A 2.0 chegou enquanto você estava fora. Reativa: {plano} por {preco}.' },
    email: {
      subject: '{nome}, já faz 1 semana — e a Nex Control mudou',
      preheader: 'Sala ao vivo, push com voz, painel novo. {oferta}',
      bodyTitle: 'Uma semana fora — e muita coisa nova',
      bodyText: '{nome}, faz 1 semana que sua assinatura venceu. Nesse meio tempo a Nex Control virou 2.0: {novidades}. {oferta} Tudo seu continua salvo — reativa e retoma antes de perder o ritmo.',
      ctaText: 'Reativar agora',
    },
  },

  // ─── BACKLOG: qualquer vencido (inclusive antigo) que nunca recebeu nada ───
  expired_revive: {
    push: { title: '{nome}, a Nex Control virou 2.0', body: 'Painel novo, Sala ao vivo, push com voz. Sua conta continua salva.' },
    email: {
      subject: '{nome}, a Nex Control que você conheceu não existe mais (virou 2.0)',
      preheader: '{oferta}',
      bodyTitle: 'Sua conta continua aqui — e o painel é outro',
      bodyText: '{nome}, sua assinatura venceu há um tempo e nada foi perdido: metas, remessas, equipe e histórico continuam salvos. O que mudou foi o resto: {novidades}. {oferta} Quando quiser retomar, é só reativar.',
      ctaText: 'Ver a 2.0 e reativar',
    },
  },

  // ─── TRIAL que não converteu (inclusive antigos) ───
  trial_lapsed: {
    push: { title: '{nome}, chega de operar no escuro', body: 'Lucro por conta em tempo real, a partir de R$ 59,90/mês. A 2.0 está no ar.' },
    email: {
      subject: '{nome}, chega de operar no escuro',
      preheader: 'Lucro em tempo real, equipe no controle. A partir de R$ 59,90/mês.',
      bodyTitle: 'Você testou. Agora bora pra valer?',
      bodyText: '{nome}, você chegou a testar a Nex Control mas não assinou — e a operação continua girando. Quanto do seu resultado você controla hoje no olho ou na planilha? Na 2.0 você vê o lucro de cada conta e de cada rede em tempo real, acompanha a tela do operador ao vivo e recebe push do jeito que preferir. A partir de R$ 59,90/mês, PIX na hora.',
      ctaText: 'Assinar e assumir o controle',
    },
  },
}

// Bucket de quem está pra vencer (daysLeft = dias até expirar, ceil)
export function expiringSegmentId(daysLeft) {
  if (daysLeft === 3) return 'expiring_3'
  if (daysLeft === 2) return 'expiring_2'
  if (daysLeft === 1) return 'expiring_1'
  return null
}

// Bucket de quem já venceu (daysSince = dias desde que venceu, floor).
// 1/2/3/7 = sequência; qualquer outro >0 cai no revive (uma vez só).
export function expiredSegmentId(daysSince) {
  if (daysSince === 1) return 'expired_1'
  if (daysSince === 2) return 'expired_2'
  if (daysSince === 3) return 'expired_3'
  if (daysSince === 7) return 'expired_7'
  if (daysSince > 0) return 'expired_revive'
  return null
}

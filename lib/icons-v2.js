// ─────────────────────────────────────────────────────────────────────────
// ÍCONES DO MENU — NexControl 2.0
// Conjunto coerente (traço lucide, 24×24) para o visual V2. Substitui os
// ícones antigos, que eram genéricos e tinham repetição: Faturamento e Custos
// usavam EXATAMENTE o mesmo desenho (cifrão), e vários não diziam nada.
// Usado só nas contas do V2 (lib/theme-v2.js) — o menu antigo não muda.
// Chave = href da rota.
// ─────────────────────────────────────────────────────────────────────────
export const ICONS_V2 = {
  // Operação
  '/admin':          'M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z',            // painel bento
  '/operator':       'M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',  // casa
  '/operadores':     'M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-3.87', // equipe
  '/redes':          'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4', // nós conectados
  '/performance':    'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',                                // tendência
  // Financeiro
  '/faturamento':    'M3 3v18h18M7 15l4-4 3 3 5-6',                                     // gráfico de receita
  '/custos':         'M6 2h12a1 1 0 0 1 1 1v18l-3-2-3 2-3-2-3 2V3a1 1 0 0 1 1-1zM9 7h6M9 11h6', // recibo
  '/pix':            'M21 2l-2 2M11.4 11.6a5 5 0 1 1-7.1 7.1 5 5 0 0 1 7.1-7.1zM15.5 7.5l3 3L22 7l-3-3z', // chave
  // Recursos
  '/slots':          'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',              // grade de slots
  '/proxy':          'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',                     // escudo
  '/minhas-proxies': 'M22 12h-4l-3 9L9 3l-3 9H2',                                       // tráfego
  // Comunidade
  '/network':        'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',   // conversa
  '/aulas':          'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM10 8l6 4-6 4z',         // play
  '/premiacoes':     'M7 4h10v6a5 5 0 0 1-10 0zM7 6H4.5a2.5 2.5 0 0 0 0 5H7M17 6h2.5a2.5 2.5 0 0 1 0 5H17M9 21h6M12 15v6', // troféu
  // Conta
  '/afiliados':      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M19 8v6M22 11h-6', // convidar
  '/billing':        'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20', // cartão
  '/billing-mp':     'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
  '/tutorial':       'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z', // manual
  // Master
  '/planejamento':   'M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1zM8 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', // prancheta
  '/owner':          'M3 17l2-10 5 5 2-7 2 7 5-5 2 10z',                                 // coroa
}

export function iconV2(href, fallback) {
  return ICONS_V2[href] || fallback
}

// ─────────────────────────────────────────────────────────────────────────
// AS NOTIFICAÇÕES — um catálogo, não texto solto em cada rota.
//
// COMO ERA: cada lugar que envia push montava `{title, body, url}` na mão.
// Sem botão, sem hierarquia, e com `tag` terminando em Date.now() — o que
// significa que oito metas fechadas viravam oito notificações empilhadas,
// a nona empurrando a primeira pra fora antes de ser lida. E a vibração era
// a mesma para uma conquista e para um alerta de prejuízo.
//
// O QUE MUDA AQUI:
//
// 1. BOTÃO. O sistema operacional desenha até dois botões na notificação.
//    "Meta fechada → Ver meta" resolve em um toque o que antes era abrir o
//    app, achar a meta e clicar. É a diferença entre aviso e ferramenta.
//
// 2. PESO. Nem toda notificação vale o mesmo. Um alerta de prejuízo fica na
//    tela até alguém decidir (`exigeAcao`); um comentário no Network passa.
//    A vibração acompanha: celebração tem cadência de repique, alerta tem
//    batida dupla seca, ambiente quase não vibra.
//
// 3. AGRUPAMENTO. A `tag` passa a ser por ASSUNTO, não por instante. A
//    segunda meta fechada do dia SUBSTITUI a primeira em vez de empilhar —
//    e `renotify` decide se isso volta a chamar atenção ou entra quieto.
//
// 4. HORA. `timestamp` é a hora do FATO, não a da entrega. Push atrasado
//    mostrando "agora" faz o operador procurar um depósito que entrou há
//    duas horas.
//
// O QUE CADA SISTEMA SUPORTA é diferente, e isso MUDA O QUE SE PODE
// PROMETER:
//
//   Android/Chrome   desenha os botões, a imagem, tudo.
//   iPhone/iPad      IGNORA `actions`. Não desenha botão nenhum. Nunca.
//
// Metade da base é Apple (210 de 431 em 24/09/2026), então BOTÃO NUNCA PODE
// SER A ÚNICA PORTA. O que funciona em todo aparelho é o toque no corpo,
// que vai pro `url` — o botão é atalho pra quem tem.
//
// Isto está escrito aqui porque eu errei exatamente nisso: o anúncio do
// Instagram saiu com o endereço só no botão, e nos 210 iPhones não havia
// caminho pro Instagram. O tipo 'anuncio' hoje força o destino no corpo
// também, justamente pra que ninguém precise lembrar disso de novo.
// ─────────────────────────────────────────────────────────────────────────

/** Cadências de vibração. Milissegundos: vibra, pausa, vibra… */
const PULSO = {
  celebracao: [40, 40, 40, 40, 120],  // repique curto, sobe no fim
  alerta:     [120, 60, 120],         // batida dupla seca
  dinheiro:   [30, 30, 90],
  ambiente:   [25],                   // quase um toque
}

/**
 * O catálogo. Cada tipo diz COMO a notificação se comporta; o texto vem de
 * quem envia, porque só ele conhece os números.
 *
 *   grupo        vira a `tag`: mesma tag = a nova substitui a anterior
 *   exigeAcao    fica na tela até alguém tocar (só onde há decisão a tomar)
 *   rechamar     ao substituir, volta a tocar/vibrar
 *   acoes        até 2 botões — mais que isso o sistema corta
 */
const meta = d => (d.metaId ? `/meta/${d.metaId}` : '/admin')

export const TIPOS = {
  // ── O CICLO DA META, do começo ao fim ───────────────────────────────
  // criada → remessas (marcos de 50% e 100%) → finalizada pelo operador
  // → fechada pelo admin. Cada passo avisa quem precisa agir no seguinte.
  'meta-criada': {                 // operador abriu uma meta → admin
    grupo: 'meta-nova',
    pulso: PULSO.ambiente,
    rechamar: false,
    acoes: (d) => [
      { action: 'abrir', title: 'Acompanhar', url: meta(d) },
      { action: 'painel', title: 'Painel', url: '/admin' },
    ],
  },
  'remessa-nova': {                // operador registrou remessa → admin
    grupo: 'remessa',
    pulso: PULSO.dinheiro,
    rechamar: false,
    acoes: (d) => [
      { action: 'abrir', title: 'Ver meta', url: meta(d) },
      { action: 'fat', title: 'Faturamento', url: '/faturamento' },
    ],
  },
  'remessa-feedback': {            // leitura da própria remessa → quem registrou
    grupo: 'remessa-eu',
    pulso: PULSO.dinheiro,
    rechamar: false,
    acoes: (d) => [
      { action: 'abrir', title: 'Ver meta', url: meta(d) },
    ],
  },
  'marco-meta': {                  // metade / meta batida → admin e operador
    grupo: 'marco',
    pulso: PULSO.celebracao,
    rechamar: true,
    acoes: (d) => [
      { action: 'abrir', title: 'Ver meta', url: meta(d) },
    ],
  },
  'meta-finalizada': {             // operador finalizou; falta o admin fechar → admin
    grupo: 'fechar',
    pulso: PULSO.dinheiro,
    exigeAcao: true,               // tem uma decisão esperando
    rechamar: true,
    acoes: (d) => [
      // abre a meta JÁ com o fechamento na tela (a página lê ?acao=fechar)
      { action: 'fechar', title: 'Fechar agora', url: d.metaId ? `/meta/${d.metaId}?acao=fechar` : '/admin' },
      { action: 'abrir', title: 'Ver meta', url: meta(d) },
    ],
    url: (d) => (d.metaId ? `/meta/${d.metaId}?acao=fechar` : null),
  },
  'meta-fechada': {                // fechada com custos → admin
    grupo: 'meta',
    pulso: PULSO.celebracao,
    rechamar: true,
    acoes: (d) => [
      { action: 'abrir', title: 'Ver meta', url: meta(d) },
      { action: 'painel', title: 'Ir ao painel', url: '/admin' },
    ],
  },
  'meta-fechada-operador': {       // a meta DELE foi fechada → operador
    // NUNCA leva salário, baú ou lucro final no texto: o operador não vê
    // campos financeiros do admin (regra do produto). Só o resultado das
    // remessas, que ele mesmo registrou.
    grupo: 'meta',
    pulso: PULSO.celebracao,
    rechamar: true,
    acoes: (d) => [
      { action: 'desempenho', title: 'Meu desempenho', url: '/performance' },
      { action: 'abrir', title: 'Ver meta', url: meta(d) },
    ],
  },
  'alerta-operacao': {
    grupo: 'alerta',
    pulso: PULSO.alerta,
    exigeAcao: true,      // é uma decisão, não um aviso
    rechamar: true,
    acoes: (d) => [
      { action: 'abrir', title: 'Abrir meta', url: meta(d) },
      { action: 'slots', title: 'Ver slots', url: '/slots' },
    ],
  },
  'pagamento': {
    grupo: 'pagamento',
    pulso: PULSO.alerta,
    exigeAcao: true,
    rechamar: true,
    acoes: () => [
      { action: 'abrir', title: 'Pagar agora', url: '/billing-mp' },
    ],
  },
  'network': {
    grupo: 'network',
    pulso: PULSO.ambiente,
    rechamar: false,
    acoes: () => [
      { action: 'abrir', title: 'Responder', url: '/network' },
    ],
  },
  'conquista': {
    grupo: 'conquista',
    pulso: PULSO.celebracao,
    rechamar: true,
    acoes: () => [
      { action: 'abrir', title: 'Ver conquista', url: '/performance' },
    ],
  },
  'resumo': {
    grupo: 'resumo',
    pulso: PULSO.dinheiro,
    rechamar: true,
    acoes: (d) => [
      { action: 'abrir', title: 'Abrir painel', url: d.url || '/admin' },
    ],
  },
  'anuncio': {
    grupo: 'anuncio',
    pulso: PULSO.celebracao,
    rechamar: true,
    acoes: (d) => (d.botao && d.destino ? [{ action: 'abrir', title: d.botao, url: d.destino }] : []),
    // metade da base é iPhone, e o Web Push do iOS IGNORA `actions`: não
    // desenha botão nenhum. O que funciona em todo aparelho é o toque no
    // CORPO, que vai pro `url` — então o destino do anúncio manda no corpo
    // também, e o botão vira atalho pra quem tem, não a única porta.
    url: (d) => d.destino || null,
  },
  'aviso': {
    grupo: 'aviso',
    pulso: PULSO.ambiente,
    rechamar: false,
    acoes: () => [],
  },
}

/**
 * Monta o pacote que vai pro aparelho.
 *
 * @param {string} tipo    chave de TIPOS
 * @param {object} p
 *   titulo, corpo   o texto (obrigatórios)
 *   url             pra onde o toque no corpo leva
 *   metaId          usado pelos botões quando faz sentido
 *   chave           separa notificações do mesmo tipo que NÃO devem se
 *                   substituir (ex.: uma por operador)
 *   quando          Date ou ms do FATO; o padrão é agora
 *   imagem          arte grande — só onde o momento justifica
 */
export function montarNotificacao(tipo, p = {}) {
  const t = TIPOS[tipo] || TIPOS.aviso
  const acoes = (t.acoes ? t.acoes(p) : []).slice(0, 2)

  return {
    title: p.titulo || 'Nex Control',
    body: p.corpo || '',
    // o tipo pode ditar o destino do corpo (ver 'anuncio'); senão vale o que
    // o remetente mandou, e por último o painel
    url: (typeof t.url === 'function' ? t.url(p) : null) || p.url || '/admin',
    // por ASSUNTO, não por instante: a nova troca a anterior do mesmo grupo
    tag: 'nex-' + t.grupo + (p.chave ? '-' + p.chave : ''),
    renotify: !!t.rechamar,
    requireInteraction: !!t.exigeAcao,
    vibrate: t.pulso || PULSO.ambiente,
    timestamp: p.quando ? new Date(p.quando).getTime() : Date.now(),
    // o service worker precisa do destino de cada botão, e o padrão web só
    // carrega `action` e `title` — o resto viaja em `data`
    actions: acoes.map(a => ({ action: a.action, title: a.title })),
    destinos: Object.fromEntries(acoes.map(a => [a.action, a.url])),
    ...(p.imagem ? { image: p.imagem } : {}),
  }
}

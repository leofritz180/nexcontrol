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
// 5. VOZ (24/09/2026). Quem RECEBE escolhe como o NexControl fala com ele:
//    'serio' (direto ao ponto), 'engracado' (com humor) ou 'low' (curto,
//    minúsculo, sem alarde). Pra isso o remetente manda DADOS (nome, rede,
//    valor, contas…), não frase pronta — o texto é escrito aqui, uma vez
//    por tipo e por voz, em `texto`. Frase pronta (`titulo`/`corpo`) ainda
//    é aceita e vence: é o caminho das cobranças e dos anúncios, que não
//    mudam de voz.
//
//    A preferência mora no user_metadata da conta (auth), em `nx_push`:
//    { voz, ciclo, remessas, marcos, insights, network }. Ver PREFS_PADRAO
//    e prefsPermitem(). Quem lê e aplica por destinatário é lib/push.js.
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

import { repertorioEngracado } from './vozEngracada.js'

/** Cadências de vibração. Milissegundos: vibra, pausa, vibra… */
const PULSO = {
  celebracao: [40, 40, 40, 40, 120],  // repique curto, sobe no fim
  alerta:     [120, 60, 120],         // batida dupla seca
  dinheiro:   [30, 30, 90],
  ambiente:   [25],                   // quase um toque
}

// ── As vozes ─────────────────────────────────────────────────────────────
export const VOZES = [
  { id: 'serio',     nome: 'Sério',        sub: 'Direto ao ponto. Números na frente, sem enfeite.' },
  { id: 'engracado', nome: 'Engraçado',    sub: 'Com humor e emoji. A operação também pode ser leve.' },
  { id: 'low',       nome: 'Low profile',  sub: 'Curto, minúsculo, sem alarde. Estilo caption.' },
]
export const VOZ_PADRAO = 'serio'

// Categoria de cada tipo: é o que a pessoa liga e desliga. 'sempre' não
// tem interruptor (cobrança, anúncio oficial, aviso do sistema).
export const CATEGORIA = {
  'transmissao': 'ciclo', 'meta-criada': 'ciclo', 'meta-finalizada': 'ciclo', 'meta-fechada': 'ciclo', 'meta-fechada-operador': 'ciclo', 'conquista': 'ciclo',
  'remessa-nova': 'remessas', 'remessa-feedback': 'remessas',
  'marco-meta': 'marcos',
  'alerta-operacao': 'insights',
  'network': 'network',
  'resumo': 'sempre', 'pagamento': 'sempre', 'anuncio': 'sempre', 'aviso': 'sempre',
}
export const CATEGORIAS = [
  { id: 'ciclo',    nome: 'Ciclo da meta',   sub: 'Meta aberta, finalizada e fechada; patentes e comissões.' },
  { id: 'remessas', nome: 'Remessas',        sub: 'Cada remessa registrada, com resultado e progresso.', papel: 'admin' },
  { id: 'marcos',   nome: 'Marcos da meta',  sub: 'Metade do caminho e meta batida.' },
  { id: 'insights', nome: 'Insights',        sub: 'Sequência negativa, prejuízo fora do padrão, meta parada.' },
  { id: 'network',  nome: 'Network',         sub: 'Menções, comentários e avisos da comunidade.' },
]
export const PREFS_PADRAO = { voz: VOZ_PADRAO, ciclo: true, remessas: true, marcos: true, insights: true, network: true }

export function normalizarPrefs(p) {
  const o = { ...PREFS_PADRAO, ...(p && typeof p === 'object' ? p : {}) }
  if (!VOZES.some(v => v.id === o.voz)) o.voz = VOZ_PADRAO
  for (const c of CATEGORIAS) o[c.id] = o[c.id] !== false
  return o
}
/** A pessoa quer receber este tipo? */
export function prefsPermitem(prefs, tipo) {
  const cat = CATEGORIA[tipo] || 'sempre'
  if (cat === 'sempre') return true
  return normalizarPrefs(prefs)[cat] !== false
}

// ── Formatação ───────────────────────────────────────────────────────────
const R = v => Math.abs(Number(v || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const val = v => `${Number(v || 0) >= 0 ? '+' : '−'}R$ ${R(v)}`
const rs = v => `R$ ${R(v)}`
const REDE = r => (r || 'rede').toUpperCase()
const rede = r => (r || 'rede').toLowerCase()
const prog = d => (d.alvo ? ` · ${Math.min(Number(d.feitas || 0), Number(d.alvo))}/${d.alvo} DEP` : '')
const progLow = d => (d.alvo ? ` · ${Math.min(Number(d.feitas || 0), Number(d.alvo))}/${d.alvo}` : '')
const nome = d => d.nome || 'Operador'
const n = (q, s, p) => `${q} ${q === 1 ? s : p}`

// Faixa do feedback da própria remessa, por prejuízo por conta
export function nivelRemessa(valor, perConta) {
  if (Number(valor) >= 0) return 'lucro'
  const p = Number(perConta || 0)
  if (p <= 2) return 'baixo'
  if (p <= 4) return 'leve'
  if (p <= 6) return 'atencao'
  if (p <= 8) return 'redobrada'
  if (p <= 10) return 'ruim'
  return 'negativo'
}

// A voz engraçada tem REPERTÓRIO (várias frases por situação, sorteadas a
// cada envio) e mora em lib/vozEngracada.js. Recebe os helpers daqui.
const ENGRACADO = repertorioEngracado({ val, rs, REDE, prog, nome, n, nivelRemessa })

// ── Os textos, por tipo e por voz ────────────────────────────────────────
// Cada função recebe os DADOS e devolve { titulo, corpo }.
const TEXTO = {
  'transmissao': {
    serio:     d => ({ titulo: `${nome(d)} está transmitindo a tela`, corpo: 'Ao vivo agora. Abra a Sala pra assistir.' }),
    engracado: ENGRACADO['transmissao'],
    low:       d => ({ titulo: 'ao vivo', corpo: `${nome(d)} · tela` }),
  },
  'meta-criada': {
    serio:     d => ({ titulo: `Nova meta: ${d.contas || 0} DEP na ${REDE(d.rede)}`, corpo: `${nome(d)} abriu a meta agora.` }),
    engracado: ENGRACADO['meta-criada'],
    low:       d => ({ titulo: 'nova meta', corpo: `${nome(d)} · ${d.contas || 0} dep · ${rede(d.rede)}` }),
  },
  'remessa-nova': {
    serio: d => d.bonus
      ? ({ titulo: `Bônus registrado por ${nome(d)}`, corpo: `${val(d.valor)} · ${REDE(d.rede)}` })
      : ({ titulo: Number(d.valor) >= 0 ? `Remessa positiva de ${nome(d)}` : `Remessa negativa de ${nome(d)}`, corpo: [val(d.valor), d.contas ? n(d.contas, 'conta', 'contas') : null, REDE(d.rede), d.slot].filter(Boolean).join(' · ') + prog(d) }),
    engracado: ENGRACADO['remessa-nova'],
    low: d => d.bonus
      ? ({ titulo: 'bônus', corpo: `${nome(d)} · ${val(d.valor)}` })
      : ({ titulo: 'remessa', corpo: `${nome(d)} · ${val(d.valor)} · ${rede(d.rede)}${progLow(d)}` }),
  },
  'remessa-feedback': {
    serio: d => {
      const base = `${val(d.valor)} (${rs(d.perConta)}/conta)`
      return {
        lucro:     { titulo: 'Remessa no lucro', corpo: `${base}. Ritmo mantido.` },
        baixo:     { titulo: 'Remessa registrada', corpo: `${base} · prejuízo baixo, dentro do esperado.` },
        leve:      { titulo: 'Remessa registrada', corpo: `${base} · leve oscilação.` },
        atencao:   { titulo: 'Atenção na operação', corpo: `${base} · oscilação subindo. Acompanhe as próximas.` },
        redobrada: { titulo: 'Atenção redobrada', corpo: `${base} · avalie trocar o slot.` },
        ruim:      { titulo: 'Resultado ruim', corpo: `${base} · reavalie a estratégia.` },
        negativo:  { titulo: 'Resultado negativo', corpo: `${base} · mude o caminho.` },
      }[d.nivel || nivelRemessa(d.valor, d.perConta)]
    },
    engracado: ENGRACADO['remessa-feedback'],
    low: d => {
      const base = `${val(d.valor)} · ${rs(d.perConta)}/conta`
      return {
        lucro:     { titulo: 'no lucro', corpo: base },
        baixo:     { titulo: 'registrada', corpo: base },
        leve:      { titulo: 'registrada', corpo: base },
        atencao:   { titulo: 'atenção', corpo: base },
        redobrada: { titulo: 'atenção', corpo: `${base} · trocar slot?` },
        ruim:      { titulo: 'no vermelho', corpo: base },
        negativo:  { titulo: 'no vermelho', corpo: base },
      }[d.nivel || nivelRemessa(d.valor, d.perConta)]
    },
  },
  'marco-meta': {
    serio: d => d.marco >= 100
      ? (d.paraOperador ? { titulo: 'Meta batida', corpo: `${d.feitas}/${d.alvo} DEP na ${REDE(d.rede)}. Finalize para o admin fechar.` } : { titulo: `${nome(d)} bateu a meta`, corpo: `${d.feitas}/${d.alvo} DEP na ${REDE(d.rede)} · pronta pra finalizar.` })
      : (d.paraOperador ? { titulo: 'Metade da meta', corpo: `${d.feitas}/${d.alvo} DEP na ${REDE(d.rede)}. Continue.` } : { titulo: `Metade da meta na ${REDE(d.rede)}`, corpo: `${nome(d)} está em ${d.feitas}/${d.alvo} DEP.` }),
    engracado: ENGRACADO['marco-meta'],
    low: d => d.marco >= 100
      ? { titulo: 'meta batida', corpo: `${d.paraOperador ? '' : nome(d) + ' · '}${d.feitas}/${d.alvo} · ${rede(d.rede)}` }
      : { titulo: 'metade', corpo: `${d.paraOperador ? '' : nome(d) + ' · '}${d.feitas}/${d.alvo} · ${rede(d.rede)}` },
  },
  'meta-finalizada': {
    serio:     d => ({ titulo: `${nome(d)} finalizou · falta você fechar`, corpo: `${d.contas || 0} DEP ${REDE(d.rede)} · ${n(d.nRem || 0, 'remessa', 'remessas')} · ${val(d.valor)} nas remessas` }),
    engracado: ENGRACADO['meta-finalizada'],
    low:       d => ({ titulo: 'falta fechar', corpo: `${nome(d)} · ${d.contas || 0} dep ${rede(d.rede)} · ${val(d.valor)}` }),
  },
  'meta-fechada': {
    serio:     d => ({ titulo: Number(d.lucroFinal) >= 0 ? 'Meta fechada no lucro' : 'Meta fechada no prejuízo', corpo: `${d.contas || 0} DEP ${REDE(d.rede)} · resultado final ${val(d.lucroFinal)}` }),
    engracado: ENGRACADO['meta-fechada'],
    low:       d => ({ titulo: 'fechada', corpo: `${d.contas || 0} dep ${rede(d.rede)} · ${val(d.lucroFinal)}` }),
  },
  'meta-fechada-operador': {
    serio:     d => ({ titulo: 'Sua meta foi fechada', corpo: `${d.contas || 0} DEP ${REDE(d.rede)} · suas remessas: ${val(d.valor)}` }),
    engracado: ENGRACADO['meta-fechada-operador'],
    low:       d => ({ titulo: 'sua meta fechou', corpo: `${d.contas || 0} dep ${rede(d.rede)} · ${val(d.valor)}` }),
  },
  'alerta-operacao': {
    serio: d => ({
      sequencia_negativa:   { titulo: 'Sequência negativa', corpo: `${n(d.streak || 0, 'remessa seguida', 'remessas seguidas')} no prejuízo · ${rs(d.total)} acumulado. Avalie trocar de estratégia.` },
      prejuizo_acima_media: { titulo: 'Prejuízo acima do seu padrão', corpo: `${rs(d.perConta)}/conta nesta remessa · média recente ${rs(d.media)}/conta.` },
      meta_parada:          { titulo: 'Meta sem movimentação', corpo: `Sem remessa há ${d.horas || 0}h. Retome quando possível.` },
      meta_sem_inicio:      { titulo: 'Meta aguardando início', corpo: `${d.contas || 0} DEP ${REDE(d.rede)} ativa e sem nenhuma remessa.` },
    }[d.insight] || { titulo: 'Alerta da operação', corpo: d.corpo || '' }),
    engracado: ENGRACADO['alerta-operacao'],
    low: d => ({
      sequencia_negativa:   { titulo: 'sequência negativa', corpo: `${d.streak || 0} seguidas · ${rs(d.total)}` },
      prejuizo_acima_media: { titulo: 'acima da média', corpo: `${rs(d.perConta)}/conta · média ${rs(d.media)}` },
      meta_parada:          { titulo: 'meta parada', corpo: `${d.horas || 0}h sem remessa` },
      meta_sem_inicio:      { titulo: 'sem começar', corpo: `${d.contas || 0} dep ${rede(d.rede)}` },
    }[d.insight] || { titulo: 'alerta', corpo: d.corpo || '' }),
  },
  'network': {
    serio: d => ({
      comentario: { titulo: `${nome(d)} comentou seu resultado`, corpo: d.trecho || '' },
      mencao:     { titulo: `${nome(d)} te mencionou no Network`, corpo: d.trecho || '' },
      todos:      { titulo: `${nome(d)} marcou todos no Network`, corpo: d.trecho || '' },
      aviso:      { titulo: 'Novo aviso no Network', corpo: d.trecho || '' },
    }[d.evento] || { titulo: 'Network', corpo: d.trecho || '' }),
    engracado: ENGRACADO['network'],
    low: d => ({
      comentario: { titulo: `${nome(d)} comentou`, corpo: d.trecho || '' },
      mencao:     { titulo: `${nome(d)} te mencionou`, corpo: d.trecho || '' },
      todos:      { titulo: `${nome(d)} · todos`, corpo: d.trecho || '' },
      aviso:      { titulo: 'aviso', corpo: d.trecho || '' },
    }[d.evento] || { titulo: 'network', corpo: d.trecho || '' }),
  },
  'conquista': {
    serio: d => d.evento === 'comissao'
      ? { titulo: 'Comissão paga', corpo: `${rs(d.valor)} enviada via PIX` }
      : { titulo: `Patente nova: ${d.patente || ''}`, corpo: `${Number(d.depositantes || 0).toLocaleString('pt-BR')} depositantes processados` },
    engracado: ENGRACADO['conquista'],
    low: d => d.evento === 'comissao'
      ? { titulo: 'comissão paga', corpo: `${rs(d.valor)} · pix` }
      : { titulo: String(d.patente || 'patente nova').toLowerCase(), corpo: `${Number(d.depositantes || 0).toLocaleString('pt-BR')} depositantes` },
  },
}

/**
 * O catálogo. Cada tipo diz COMO a notificação se comporta; o texto vem de
 * TEXTO (por voz) ou, se o remetente mandou frase pronta, dele.
 *
 *   grupo        vira a `tag`: mesma tag = a nova substitui a anterior
 *   exigeAcao    fica na tela até alguém tocar (só onde há decisão a tomar)
 *   rechamar     ao substituir, volta a tocar/vibrar
 *   acoes        até 2 botões — mais que isso o sistema corta
 */
const meta = d => (d.metaId ? `/meta/${d.metaId}` : '/admin')

export const TIPOS = {
  'transmissao': {                 // operador começou a transmitir a tela → admin
    grupo: 'transmissao',
    pulso: PULSO.ambiente,
    rechamar: true,
    acoes: (d) => [
      { action: 'assistir', title: 'Assistir', url: d.chave ? `/sala?op=${d.chave}` : '/sala' },
    ],
    url: (d) => (d.chave ? `/sala?op=${d.chave}` : '/sala'),
  },
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
    acoes: (d) => [
      { action: 'abrir', title: 'Responder', url: d.url || '/network' },
    ],
  },
  'conquista': {
    grupo: 'conquista',
    pulso: PULSO.celebracao,
    rechamar: true,
    acoes: (d) => [
      { action: 'abrir', title: d.evento === 'comissao' ? 'Ver afiliados' : 'Ver conquista', url: d.url || '/performance' },
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

/** TODOS os textos possíveis de um tipo numa voz (a engraçada tem vários). */
export function textosDe(tipo, p = {}, voz = VOZ_PADRAO) {
  if (p.titulo) return [{ titulo: p.titulo, corpo: p.corpo || '' }]
  const t = TEXTO[tipo]
  if (!t) return [{ titulo: 'Nex Control', corpo: p.corpo || '' }]
  const f = t[voz] || t[VOZ_PADRAO]
  let r
  try { r = f(p) } catch { r = null }
  if (!r) { try { r = t[VOZ_PADRAO](p) } catch { r = null } }
  const lista = (Array.isArray(r) ? r : [r]).filter(x => x && x.titulo)
  return lista.length ? lista : [{ titulo: 'Nex Control', corpo: p.corpo || '' }]
}

/** O texto de um tipo numa voz, a partir dos dados. Frase pronta vence;
 *  repertório (voz engraçada) sorteia — piada repetida deixa de ser piada. */
export function textoDe(tipo, p = {}, voz = VOZ_PADRAO) {
  const lista = textosDe(tipo, p, voz)
  return lista[Math.floor(Math.random() * lista.length)]
}

/**
 * Monta o pacote que vai pro aparelho.
 *
 * @param {string} tipo    chave de TIPOS
 * @param {object} p
 *   titulo, corpo   frase pronta (opcional — sem ela, o texto sai de TEXTO)
 *   nome, rede, contas, valor, …   os dados que o texto usa
 *   url             pra onde o toque no corpo leva
 *   metaId          usado pelos botões quando faz sentido
 *   chave           separa notificações do mesmo tipo que NÃO devem se
 *                   substituir (ex.: uma por operador)
 *   quando          Date ou ms do FATO; o padrão é agora
 *   imagem          arte grande — só onde o momento justifica
 * @param {string} voz     'serio' | 'engracado' | 'low' — a de quem RECEBE
 */
export function montarNotificacao(tipo, p = {}, voz = VOZ_PADRAO) {
  const t = TIPOS[tipo] || TIPOS.aviso
  const acoes = (t.acoes ? t.acoes(p) : []).slice(0, 2)
  const texto = textoDe(tipo, p, voz)

  return {
    title: texto.titulo || 'Nex Control',
    body: texto.corpo || '',
    // o tipo pode ditar o destino do corpo (ver 'anuncio'); senão vale o que
    // o remetente mandou; senão a meta do aviso (iPhone só tem o toque no
    // corpo, e "ver a meta" é o que a pessoa quer); por último o painel
    url: (typeof t.url === 'function' ? t.url(p) : null) || p.url || (p.metaId ? `/meta/${p.metaId}` : '/admin'),
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

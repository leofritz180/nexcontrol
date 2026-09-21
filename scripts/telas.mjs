/**
 * CAPTURAS DE TELA — NexControl 2.0
 *
 * Existe porque durante toda a migração eu só conseguia conferir o visual
 * lendo código e medindo contraste. Erro que o olho pega na hora — um card
 * preto no meio do claro — passava batido e só aparecia num print do dono.
 *
 * Usa o Chrome que já está na máquina (playwright-core, sem baixar browser).
 *
 *   node scripts/telas.mjs --login       abre o Chrome pra você entrar UMA vez
 *                                        e salva a sessão em .telas/sessao.json
 *   node scripts/telas.mjs               captura tudo em .telas/
 *   node scripts/telas.mjs --noir        idem, no tema escuro
 *   node scripts/telas.mjs --mobile      idem, em 390x844
 *   node scripts/telas.mjs --url=...     aponta pra outro ambiente
 *
 * A sessão fica em .telas/, que está no .gitignore: token de acesso não
 * entra no repositório.
 */
import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const tem = (f) => args.includes(f)
const valor = (f, padrao) => {
  const a = args.find(x => x.startsWith(f + '='))
  return a ? a.slice(f.length + 1) : padrao
}

const BASE = valor('--url', 'https://nexcpa.com.br')
const PASTA = path.join(process.cwd(), '.telas')
const SESSAO = path.join(PASTA, 'sessao.json')
const NOIR = tem('--noir')
const MOBILE = tem('--mobile')

const CHROMES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]
const navegador = CHROMES.find(p => fs.existsSync(p))
if (!navegador) {
  console.error('Nenhum Chrome/Edge encontrado nos caminhos padrão. Passe o caminho em CHROME_PATH.')
  process.exit(1)
}

const PUBLICAS = [
  ['/login', 'login'],
  ['/signup', 'cadastro'],
  ['/reset-password', 'redefinir-senha'],
  // sem token: cai no estado "convite indisponivel", que tambem precisa
  // estar apresentavel — e a primeira tela que um operador ve
  ['/invite', 'convite'],
]
const LOGADAS = [
  ['/admin', 'admin-visao-geral'],
  ['/operadores', 'operadores'],
  ['/redes', 'redes'],
  ['/faturamento', 'faturamento'],
  ['/custos', 'custos'],
  ['/performance', 'performance'],
  ['/pix', 'pix'],
  ['/slots', 'slots'],
  ['/premiacoes', 'premiacoes'],
  ['/afiliados', 'afiliados'],
  ['/tutorial', 'tutorial'],
  ['/minhas-proxies', 'minhas-proxies'],
  ['/aulas', 'aulas'],
  ['/planejamento', 'planejamento'],
  // /network e /billing ficaram DE FORA da lista por meses. O /network
  // estava ilegivel em producao e ninguem viu, porque ninguem olhava.
  ['/network', 'network'],
  ['/billing', 'assinatura'],
]

fs.mkdirSync(PASTA, { recursive: true })

// ── modo link: consome um magic link e salva a sessão, sem digitar senha ──
// Gere o link com a API admin do Supabase e deixe em .telas/link.txt.
if (tem('--link')) {
  const url = fs.readFileSync(path.join(PASTA, 'link.txt'), 'utf8').trim()
  if (!url) { console.error('.telas/link.txt está vazio'); process.exit(1) }
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || navegador })
  const ctx = await b.newContext({ locale: 'pt-BR' })
  const pg = await ctx.newPage()
  await pg.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await pg.waitForTimeout(4000)
  console.log('parou em: ' + pg.url())
  await ctx.storageState({ path: SESSAO })
  await b.close()
  // o link é de uso único: não deixa rastro depois de consumido
  try { fs.unlinkSync(path.join(PASTA, 'link.txt')) } catch {}
  console.log('Sessão salva em ' + SESSAO + ' (.telas está no .gitignore).')
  process.exit(0)
}

// ── modo login: abre visível, você entra, ele salva a sessão ──
if (tem('--login')) {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || navegador, headless: false })
  const ctx = await b.newContext()
  const pg = await ctx.newPage()
  await pg.goto(BASE + '/login')
  console.log('\nEntre na conta nesta janela. Quando o painel abrir, volte aqui e tecle ENTER.')
  await new Promise(r => process.stdin.once('data', r))
  await ctx.storageState({ path: SESSAO })
  await b.close()
  console.log('Sessão salva em ' + SESSAO + ' (a pasta .telas está no .gitignore).')
  process.exit(0)
}

const temSessao = fs.existsSync(SESSAO)
const alvos = temSessao ? [...PUBLICAS, ...LOGADAS] : PUBLICAS
if (!temSessao) {
  console.log('Sem sessão salva: capturando só as telas públicas.')
  console.log('Para incluir o painel, rode antes:  node scripts/telas.mjs --login\n')
}

const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || navegador })
const ctx = await b.newContext({
  storageState: temSessao ? SESSAO : undefined,
  viewport: MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'pt-BR',
})
const pg = await ctx.newPage()

// o tema é escolha do usuário guardada no navegador
if (NOIR) {
  await ctx.addInitScript(() => { try { localStorage.setItem('nx_noir', '1') } catch {} })
} else {
  await ctx.addInitScript(() => { try { localStorage.setItem('nx_noir', '0') } catch {} })
}
// Tira do caminho tudo que só aparece uma vez e cobriria a tela.
// Isto NÃO é cosmético: o rail e o dock são position:fixed, então numa
// captura de página inteira eles aparecem na altura da janela — ou seja,
// atrás de qualquer modal que esteja aberto. Com um pop-up no ar, a foto
// perde justamente os dois elementos que mais precisam de conferência.
await ctx.addInitScript(() => {
  const L = [
    'nexcontrol_install_done', 'nexcontrol_just_signed_up', 'nexcontrol_onboarded',
    'nx_phone_ok', 'nx_network_launch_seen_v1', 'nexVoiceAnnounce_v1',
    'nx_dock_seen_v1', 'nx_bemvindo_20_',
  ]
  const S = ['nx_bettify_promo_v1_sessao', 'nx_push_prompt_shown', 'nx_upgrade_bar_dismissed']
  try {
    L.forEach(k => localStorage.setItem(k, k === 'nexcontrol_install_done' ? String(Date.now()) : '1'))
    S.forEach(k => sessionStorage.setItem(k, '1'))
    // Famílias de chave com sufixo variável (id do tour, id do usuário).
    // Não dá pra enumerar, então a leitura é que responde "já viu".
    const orig = localStorage.getItem.bind(localStorage)
    localStorage.getItem = k =>
      /^nx_(tour_completed_|bemvindo_20_|firstmeta_wizard_dismissed_)/.test(String(k)) ? '1' : orig(k)
  } catch {}
})

const sufixo = (NOIR ? '-noir' : '') + (MOBILE ? '-mobile' : '')
let ok = 0, erro = 0

// ── ERRO DE JAVASCRIPT ──────────────────────────────────────────────────
// A foto sozinha nao basta: uma tela que estourou mostra o cartao de erro,
// e num relance ele parece "uma tela". Em 21/09/2026 o /performance estava
// derrubado em producao e so apareceu porque alguem LEU a imagem. Agora o
// proprio script grita.
const estouros = []
let rotaAtual = ''
pg.on('pageerror', e => estouros.push([rotaAtual, String(e?.message || e).split(String.fromCharCode(10))[0]]))
pg.on('console', m => {
  if (m.type() !== 'error') return
  const t = m.text()
  // ruido conhecido que nao e defeito da tela
  if (/favicon|manifest|net::ERR_|Failed to load resource/i.test(t)) return
  estouros.push([rotaAtual, t.split(String.fromCharCode(10))[0].slice(0, 160)])
})

for (const [rota, nome] of alvos) {
  rotaAtual = rota
  const arquivo = path.join(PASTA, `${nome}${sufixo}.png`)
  try {
    await pg.goto(BASE + rota, { waitUntil: 'networkidle', timeout: 45000 })
    // tempo pro contador terminar e as animações assentarem
    await pg.waitForTimeout(2200)
    // O que escapar das chaves sai no clique. Depois da espera, de propósito:
    // vários overlays têm atraso de entrada e não existiam ainda no load.
    for (const texto of ['Sair', 'Agora não', 'Agora nao', 'Pular', 'Depois', 'Entendi', 'Fechar']) {
      try {
        const b = pg.getByRole('button', { name: texto, exact: false }).first()
        if (await b.isVisible({ timeout: 250 })) { await b.click({ timeout: 1000 }); await pg.waitForTimeout(500) }
      } catch {}
    }
    await pg.screenshot({ path: arquivo, fullPage: true })
    console.log('  ok   ' + rota + '  →  ' + path.relative(process.cwd(), arquivo))
    ok++
  } catch (e) {
    console.log('  FALHOU ' + rota + '  ' + (e?.message || '').split('\n')[0].slice(0, 90))
    erro++
  }
}

await b.close()
console.log(`\n${ok} capturada(s), ${erro} com erro. Pasta: ${path.relative(process.cwd(), PASTA)}`)

if (estouros.length) {
  console.log('')
  console.log('!! ' + estouros.length + ' ERRO(S) DE JAVASCRIPT — tela quebrada no navegador:')
  const vistos = new Set()
  for (const [rota, msg] of estouros) {
    const k = rota + msg
    if (vistos.has(k)) continue
    vistos.add(k)
    console.log('   ' + rota + '  →  ' + msg)
  }
} else {
  console.log('Nenhum erro de JavaScript nas telas visitadas.')
}

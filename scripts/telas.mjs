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
]

fs.mkdirSync(PASTA, { recursive: true })

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
// tira do caminho o que só aparece uma vez e cobriria a tela
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('nx_bemvindo_20_', '1')
    Object.keys(localStorage).filter(k => k.startsWith('nx_bemvindo_20_')).forEach(k => localStorage.setItem(k, '1'))
    sessionStorage.setItem('nx_bettify_promo_v1_sessao', '1')
  } catch {}
})

const sufixo = (NOIR ? '-noir' : '') + (MOBILE ? '-mobile' : '')
let ok = 0, erro = 0

for (const [rota, nome] of alvos) {
  const arquivo = path.join(PASTA, `${nome}${sufixo}.png`)
  try {
    await pg.goto(BASE + rota, { waitUntil: 'networkidle', timeout: 45000 })
    // tempo pro contador terminar e as animações assentarem
    await pg.waitForTimeout(2200)
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

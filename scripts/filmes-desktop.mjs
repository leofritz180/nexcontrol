// ─────────────────────────────────────────────────────────────────────────
// RE-CODIFICA OS FILMES DE DESKTOP DA LANDING.
//
// POR QUE: os cinco somam ~17 MB na versão de desktop. As versões de
// celular (-mob) já foram feitas e pesam 0,8 MB no total, mas quem abre a
// /v2 no computador ainda baixa os 17. É a primeira coisa que um cliente
// novo vê do produto, e a primeira coisa que ele sente é a espera.
//
// A resolução NÃO muda: numa tela de desktop o filme ocupa área grande e
// reduzir pixel apareceria. O que muda é a compressão — CRF mais alto e
// preset lento, que é onde está a gordura de um render de tela.
//
// O original nunca é sobrescrito: vai pra .originais/ antes. Sem isso, uma
// re-codificação em cima de outra degrada o filme a cada rodada e não há
// volta.
//
// Rode com: node scripts/filmes-desktop.mjs
// ─────────────────────────────────────────────────────────────────────────
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const FFMPEG = (await import('@ffmpeg-installer/ffmpeg')).default.path
const DIR = 'public/landing/v2'
const COFRE = path.join(DIR, '.originais')

const FILMES = ['painel-3d', 'operadores-3d', 'marca', 'celular-painel', 'criar-meta', 'captura-qr']

// 28 é o ponto em que um render de tela (superfícies lisas, pouco grão)
// ainda não mostra bloco. Acima disso o degradê do fundo começa a faixar.
const CRF = '28'

const mb = f => +(fs.statSync(f).size / 1048576).toFixed(2)
fs.mkdirSync(COFRE, { recursive: true })

let antes = 0, depois = 0
for (const nome of FILMES) {
  const vivo = path.join(DIR, `${nome}.mp4`)
  const guardado = path.join(COFRE, `${nome}.mp4`)
  if (!fs.existsSync(vivo) && !fs.existsSync(guardado)) { console.error(`  falta ${nome}`); continue }

  // já rodou antes? então a fonte é o original guardado, nunca o que está no ar
  if (!fs.existsSync(guardado)) fs.copyFileSync(vivo, guardado)
  const fonte = guardado
  const saida = path.join(DIR, `${nome}.novo.mp4`)

  execFileSync(FFMPEG, [
    '-y', '-i', fonte,
    '-c:v', 'libx264',
    '-crf', CRF,
    '-preset', 'slow',
    '-profile:v', 'main', '-level', '4.0',
    '-pix_fmt', 'yuv420p',     // sem isto o Safari não decodifica
    '-movflags', '+faststart', // começa a tocar antes de baixar tudo
    '-an',                     // os filmes são mudos
    saida,
  ], { stdio: ['ignore', 'ignore', 'ignore'] })

  const a = mb(fonte), d = mb(saida)
  // só troca se realmente ficou menor: num arquivo já otimizado a
  // re-codificação pode crescer, e aí o certo é não mexer
  if (d < a) { fs.renameSync(saida, vivo); console.log(`  ${nome.padEnd(16)} ${String(a).padStart(5)} MB  ->  ${String(d).padStart(5)} MB   (-${Math.round((1 - d / a) * 100)}%)`) }
  else { fs.unlinkSync(saida); console.log(`  ${nome.padEnd(16)} ${String(a).padStart(5)} MB  ->  mantido (a nova ficou maior)`) }
  antes += a; depois += Math.min(a, d)
}
console.log(`\n  TOTAL            ${antes.toFixed(2)} MB  ->  ${depois.toFixed(2)} MB   (-${Math.round((1 - depois / antes) * 100)}%)`)
console.log(`  originais em ${COFRE} (fora do repositorio pelo .gitignore)`)

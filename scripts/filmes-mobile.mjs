// ─────────────────────────────────────────────────────────────────────────
// VERSÕES MOBILE DOS FILMES DA LANDING.
//
// POR QUE: os cinco filmes somam 17 MB em tamanho de desktop. A maioria do
// primeiro acesso vem do telefone, e num 4G isso é inaceitável — mas sem
// filme nenhum o herói do celular vira uma foto parada, que foi exatamente
// a reclamação. A saída é servir o MESMO movimento em corpo menor.
//
// Uma tela de telefone tem ~390pt de largura. Mesmo em 3x isso dá 1170px,
// e o filme do herói ainda sangra além da largura — 720px de fonte cobre
// com folga, porque vídeo comprimido em movimento não mostra o detalhe que
// justificaria mais resolução.
//
// Rode com: node scripts/filmes-mobile.mjs
// ─────────────────────────────────────────────────────────────────────────
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const FFMPEG = (await import('@ffmpeg-installer/ffmpeg')).default.path
const DIR = 'public/landing/v2'

const FILMES = [
  // nome              largura de saída
  ['painel-3d',        720],   // herói: 16:9
  ['operadores-3d',    720],   // 16:9
  ['marca',            640],   // ambientação, fica a 34% de opacidade
  ['celular-painel',   540],   // 9:16, gravação de tela
  ['criar-meta',       540],   // 9:16, cena 3D
]

const mb = f => (fs.statSync(f).size / 1048576).toFixed(2)
let antes = 0, depois = 0

for (const [nome, larg] of FILMES) {
  const de = path.join(DIR, `${nome}.mp4`)
  const para = path.join(DIR, `${nome}-mob.mp4`)
  if (!fs.existsSync(de)) { console.error(`  falta ${de}`); continue }

  execFileSync(FFMPEG, [
    '-y', '-i', de,
    // -2 mantém a altura par, que o H.264 exige
    '-vf', `scale=${larg}:-2`,
    '-c:v', 'libx264',
    '-crf', '30',          // qualidade visualmente suficiente em tela de telefone
    '-preset', 'slow',     // demora mais aqui, pesa menos no cliente
    '-profile:v', 'main', '-level', '4.0',
    '-pix_fmt', 'yuv420p', // sem isto o Safari não decodifica
    '-movflags', '+faststart', // começa a tocar antes de baixar tudo
    '-an',                 // os filmes são mudos: a trilha só ocuparia espaço
    para,
  ], { stdio: ['ignore', 'ignore', 'ignore'] })

  const a = +mb(de), d = +mb(para)
  antes += a; depois += d
  console.log(`  ${nome.padEnd(16)} ${String(a).padStart(5)} MB  ->  ${String(d).padStart(5)} MB   (-${Math.round((1 - d / a) * 100)}%)`)
}
console.log(`\n  TOTAL            ${antes.toFixed(2)} MB  ->  ${depois.toFixed(2)} MB   (-${Math.round((1 - depois / antes) * 100)}%)`)

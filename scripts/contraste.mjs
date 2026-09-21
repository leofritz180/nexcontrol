/**
 * CHECAGEM DE CONTRASTE — NexControl 2.0
 *
 * Resolve os tokens dos DOIS temas (bento claro e Nex Noir) e mede o
 * contraste WCAG de cada par cor/fundo escrito em estilo inline. Existe
 * porque o `next build` compila um texto branco sobre fundo branco sem
 * reclamar — e isso já aconteceu aqui.
 *
 *   node scripts/contraste.mjs          → resumo
 *   node scripts/contraste.mjs --lista  → cada ponto abaixo do limite
 *
 * O que ele NÃO pega: cor vinda de classe CSS, gradiente, imagem por trás,
 * e texto branco sobre botão colorido declarado em outro elemento. Por isso
 * o número nunca chega a zero — o que importa é ele não SUBIR.
 */
import fs from 'fs'
import path from 'path'

const RAIZ = process.cwd()
const LISTAR = process.argv.includes('--lista')

// Telas escuras de propósito, que valem pra todos os usuários.
const FORA = /marketing[\\/]|app[\\/]page\.js|app[\\/]owner[\\/]|design-v2|admin-preview|remotion|showcase[\\/]/

const CLARO = {
  '--surface': '#ffffff', '--raised': '#fafafa', '--overlay': '#ffffff', '--float': '#ffffff',
  '--base': '#f0f0f3', '--void': '#f0f0f3',
  '--t1': '#15151a', '--t2': '#6c6c78', '--t3': '#82828d', '--t4': '#9b9ba6',
  '--profit': '#3f9b1e', '--loss': '#dc2626', '--brand': '#e5391f', '--warn': '#c2410c', '--info': '#6c6c78',
  '--fill-1': 'rgba(0,0,0,0.025)', '--fill-2': 'rgba(0,0,0,0.045)', '--fill-3': 'rgba(0,0,0,0.07)',
  '--profit-dim': '#e3f7c6', '--loss-dim': '#fde8e4', '--warn-dim': '#fdeade', '--brand-dim': 'rgba(229,57,31,0.09)',
}
const NOIR = {
  '--surface': '#17171c', '--raised': '#1d1d23', '--overlay': '#1d1d23', '--float': '#1d1d23',
  '--base': '#0e0e11', '--void': '#0b0b0e',
  '--t1': '#f4f4f6', '--t2': '#a6a6b2', '--t3': '#82828f', '--t4': '#62626e',
  '--profit': '#7ee08a', '--loss': '#ff6b6b', '--brand': '#ff5a3c', '--warn': '#ffa366', '--info': '#a6a6b2',
  '--fill-1': 'rgba(255,255,255,0.035)', '--fill-2': 'rgba(255,255,255,0.06)', '--fill-3': 'rgba(255,255,255,0.09)',
  '--profit-dim': 'rgba(126,224,138,0.13)', '--loss-dim': 'rgba(255,107,107,0.13)',
  '--warn-dim': 'rgba(255,163,102,0.13)', '--brand-dim': 'rgba(255,90,60,0.14)',
}

const lum = (c) => {
  const s = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]
}
const razao = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

function resolver(valor, base, tokens) {
  let v = String(valor || '').trim()
  const tk = v.match(/^var\((--[a-z0-9-]+)\)$/)
  if (tk) v = tokens[tk[1]] || ''
  if (!v) return null
  let m = v.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (m) {
    let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('')
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  }
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/)
  if (m) {
    const a = m[4] === undefined ? 1 : parseFloat(m[4])
    return [+m[1], +m[2], +m[3]].map((x, i) => Math.round(x * a + base[i] * (1 - a)))
  }
  return null
}

const arquivos = []
;(function anda(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (!/node_modules|\.next|\.git/.test(e.name)) anda(p) }
    else if (/\.jsx?$/.test(e.name)) arquivos.push(p)
  }
})(RAIZ + path.sep + 'app')
;(function anda(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) anda(p)
    else if (/\.jsx?$/.test(e.name)) arquivos.push(p)
  }
})(RAIZ + path.sep + 'components')

const LIMITE = 2.2
let saiu = 0

for (const [nome, tokens, pagina, cartao] of [
  ['CLARO', CLARO, [240, 240, 243], [255, 255, 255]],
  ['NOIR', NOIR, [14, 14, 17], [23, 23, 28]],
]) {
  let ruins = 0
  const porArquivo = {}
  const exemplos = []

  for (const f of arquivos) {
    if (FORA.test(f)) continue
    const src = fs.readFileSync(f, 'utf8')
    const linhas = src.split('\n')
    linhas.forEach((linha, i) => {
      for (const obj of linha.match(/\{[^{}]*\}/g) || []) {
        const cm = obj.match(/(?<![a-zA-Z])color\s*:\s*'([^'\n]+)'/)
        if (!cm) continue
        // --t4 é o token de rótulo apagado: fraco por desenho, não por erro
        if (cm[1] === 'var(--t4)') continue
        const bm = obj.match(/background(?:Color)?\s*:\s*'([^'\n]+)'/)
        if (bm && /gradient/.test(bm[1])) continue
        const bg = bm ? resolver(bm[1], pagina, tokens) : cartao
        if (!bg) continue
        const fg = resolver(cm[1], bg, tokens)
        if (!fg) continue
        const r = razao(fg, bg)
        if (r < LIMITE) {
          ruins++
          const rel = path.relative(RAIZ, f)
          porArquivo[rel] = (porArquivo[rel] || 0) + 1
          if (exemplos.length < 40) exemplos.push(`  ${rel}:${i + 1}  ${cm[1]} sobre ${bm ? bm[1] : '(superfície)'}  →  ${r.toFixed(2)}`)
        }
      }
    })
  }

  console.log(`\nTEMA ${nome}: ${ruins} ponto(s) abaixo de ${LIMITE}:1`)
  const topo = Object.entries(porArquivo).sort((a, b) => b[1] - a[1]).slice(0, 6)
  if (topo.length) console.log(topo.map(([f, n]) => `   ${f} (${n})`).join('\n'))
  if (LISTAR && exemplos.length) console.log(exemplos.join('\n'))
  saiu += ruins
}

console.log('\nLembrete: o numero nunca chega a zero — branco sobre botao vermelho e')
console.log('selo sobre arte de capa sao falso-positivo. O que importa e ele nao SUBIR.')
process.exit(0)

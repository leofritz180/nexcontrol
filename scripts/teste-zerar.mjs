// Prova o zerar/restaurar na CONTA DE TESTE (leofritz178), de ponta a ponta:
// copia → apaga → confere zero → restaura → confere que voltou IGUAL (ids).
// Limpa as cópias que criou no fim.   node scripts/teste-zerar.mjs
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { BUCKET, TABELAS, apagar, contagem, copiar, listar, restaurar, detalhe } from '../lib/zerar.js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const T = '64609b6c-3947-4e3d-b31d-3fd169f5d088'
let falhas = 0
const ok = (c, m) => { console.log(`  ${c ? '✓' : '✗'} ${m}`); if (!c) falhas++ }
const igual = (a, b) => JSON.stringify(Object.fromEntries(Object.entries(a).sort())) === JSON.stringify(Object.fromEntries(Object.entries(b).sort()))

async function foto() {
  const out = {}
  // ids numéricos mudam na restauração; compara o conteúdo e religa remessa→meta pelo created_at da meta
  const { data: ms } = await sb.from('metas').select('id,created_at').eq('tenant_id', T)
  const metaRef = Object.fromEntries((ms || []).map(m => [String(m.id), m.created_at]))
  for (const t of TABELAS) { const { data } = await sb.from(t).select('*').eq('tenant_id', T); out[t] = (data || []).map(l => { const { id, meta_id, ...r } = l; return JSON.stringify({ ...r, meta_ref: meta_id == null ? null : metaRef[String(meta_id)] || 'ORFA' }) }).sort() }
  return out
}

const antes = await contagem(sb, T)
const fotoAntes = await foto()
console.log('antes:', antes)
ok(Object.values(antes).some(v => v > 0), 'a conta de teste tem dados pra testar')

const c = await copiar(sb, T, 'zerar')
ok(!!c.nome, `cópia gravada: ${c.nome} (${c.bytes} bytes)`)
ok(igual(c.contagem, antes), 'contagem da cópia = contagem do banco')
const d = await detalhe(sb, T, c.nome)
ok(igual(d.contagem, antes), 'detalhe lê a cópia de volta')

const apagado = await apagar(sb, T)
const zero = await contagem(sb, T)
ok(Object.values(zero).every(v => v === 0), `apagou tudo: ${JSON.stringify(zero)}`)
ok(igual(apagado, antes), 'apagou exatamente o que tinha')

const lista = await listar(sb, T)
ok(lista.some(x => x.nome === c.nome), 'a cópia aparece na lista dos 7 dias')

const r = await restaurar(sb, T, c.nome)
const depois = await contagem(sb, T)
ok(igual(depois, antes), `restaurou as contagens: ${JSON.stringify(depois)}`)
const fotoDepois = await foto()
let iguais = true
for (const t of TABELAS) if (JSON.stringify(fotoAntes[t]) !== JSON.stringify(fotoDepois[t])) { iguais = false; console.log('   difere em', t) }
ok(iguais, 'cada linha voltou idêntica (valores e vínculo remessa→meta)')
ok(!!r.guardada, `a restauração guardou o estado anterior: ${r.guardada}`)

// limpeza das cópias de teste
const { data: arqs } = await sb.storage.from(BUCKET).list(T, { limit: 100 })
const nomes = (arqs || []).map(f => `${T}/${f.name}`)
if (nomes.length) await sb.storage.from(BUCKET).remove(nomes)
const { data: sobrou } = await sb.storage.from(BUCKET).list(T, { limit: 100 })
ok(!(sobrou || []).length, 'cópias de teste apagadas')

console.log(falhas ? `\n  ${falhas} FALHA(S)` : '\n  tudo certo')
process.exit(falhas ? 1 : 0)

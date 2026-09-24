/**
 * Gera um LINK DE CONVITE de teste: cria uma conta com acesso grátis por N
 * meses e até N operadores. Vale pra UMA conta só (ver lib/convite.js).
 *
 *   node scripts/convite-teste.mjs --operadores=2 --meses=1 --validade=30
 *
 * A assinatura do token usa a SUPABASE_SERVICE_ROLE_KEY do .env.local — a
 * mesma da Vercel, então o link gerado aqui é aceito em produção.
 */
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
for (const k of Object.keys(env)) if (!process.env[k]) process.env[k] = env[k]
const { gerarConvite, lerConvite } = await import('../lib/convite.js')
const arg = (n, d) => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? Number(a.split('=')[1]) : d }
const c = gerarConvite({ operadores: arg('operadores', 2), meses: arg('meses', 1), validadeDias: arg('validade', 30) })
const lido = lerConvite(c.token)
const dominio = process.argv.find(x => x.startsWith('--dominio='))?.split('=')[1] || 'https://nexcpa.com.br'
console.log(`\n  ${dominio}/convite/${c.token}\n`)
console.log(`  id ${c.id} · ${lido.operadores} operador(es) · ${lido.meses} mês(es) grátis · link válido até ${new Date(lido.validoAte).toLocaleDateString('pt-BR')} · uso único`)

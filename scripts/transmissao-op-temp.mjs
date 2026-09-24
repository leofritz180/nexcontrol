// Cria (ou apaga, com --apagar) um operador TEMPORÁRIO no tenant do dono,
// só pra testar a transmissão de tela com duas pontas. Salva a sessão dele
// em .telas/sessao-op.json no mesmo formato do sessao.json.
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const admin = createClient(SUPA, env.SUPABASE_SERVICE_ROLE_KEY)
const TENANT = '9b83c5f4-19df-4438-ba75-8fb62ff59b84'
const EMAIL = 'teste-transmissao@nexcpa.com.br'
const SENHA = 'Tr4nsm1ssao-' + Math.random().toString(36).slice(2, 10)

if (process.argv.includes('--apagar')) {
  const { data: p } = await admin.from('profiles').select('id').eq('email', EMAIL).maybeSingle()
  if (p) { await admin.from('push_subscriptions').delete().eq('user_id', p.id); await admin.from('profiles').delete().eq('id', p.id); await admin.auth.admin.deleteUser(p.id); console.log('apagado', p.id) } else console.log('não existia')
  try { fs.unlinkSync('.telas/sessao-op.json') } catch {}
  process.exit(0)
}

// colunas de um operador real do tenant, pra copiar só o necessário
const { data: modelo } = await admin.from('profiles').select('*').eq('tenant_id', TENANT).eq('role', 'operator').limit(1).maybeSingle()
console.log('colunas do perfil:', Object.keys(modelo || {}).join(', '))

let { data: existente } = await admin.from('profiles').select('id').eq('email', EMAIL).maybeSingle()
let uid = existente?.id
if (!uid) {
  const { data, error } = await admin.auth.admin.createUser({ email: EMAIL, password: SENHA, email_confirm: true, user_metadata: { nome: 'Teste Transmissão' } })
  if (error) throw error
  uid = data.user.id
  // um gatilho do banco já cria o perfil junto com o usuário: só ajusta
  await new Promise(r => setTimeout(r, 800))
  const { data: ja } = await admin.from('profiles').select('id').eq('id', uid).maybeSingle()
  const { error: e2 } = ja
    ? await admin.from('profiles').update({ email: EMAIL, role: 'operator', tenant_id: TENANT, nome: 'Teste Transmissão' }).eq('id', uid)
    : await admin.from('profiles').insert({ id: uid, email: EMAIL, role: 'operator', tenant_id: TENANT, nome: 'Teste Transmissão' })
  if (e2) { console.log('insert profile falhou:', e2.message); await admin.auth.admin.deleteUser(uid); process.exit(1) }
  console.log('criado', uid)
} else {
  await admin.auth.admin.updateUserById(uid, { password: SENHA })
  console.log('já existia', uid)
}
const anon = createClient(SUPA, ANON, { auth: { persistSession: false } })
const { data: s, error: e3 } = await anon.auth.signInWithPassword({ email: EMAIL, password: SENHA })
if (e3) throw e3
const ref = new URL(SUPA).hostname.split('.')[0]
const est = { cookies: [], origins: [{ origin: 'http://localhost', localStorage: [{ name: `sb-${ref}-auth-token`, value: JSON.stringify(s.session) }] }] }
fs.writeFileSync('.telas/sessao-op.json', JSON.stringify(est))
console.log('sessão do operador salva; uid', uid)

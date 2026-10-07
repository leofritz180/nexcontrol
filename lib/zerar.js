// ─────────────────────────────────────────────────────────────────────────
// ZERAR A OPERAÇÃO — e poder voltar atrás por 7 dias.
//
// O cliente pode apagar TODOS os dados da operação (metas, remessas,
// custos, planilha, métodos, histórico de atividade, capturas de QR) e
// começar do zero. Antes de apagar, uma CÓPIA completa vai pro Storage
// (bucket privado `backups`, pasta do tenant). A cópia fica 7 dias e pode
// ser restaurada pelo próprio cliente; depois disso o cron limpar-backups
// apaga.
//
// Por que Storage e não uma tabela: este Supabase não dá DDL pela service
// role (sem tabela nova, sem coluna nova). Criar bucket é API de Storage,
// não DDL — funciona. E JSON num arquivo é exatamente a forma que uma
// cópia precisa ter: fiel, com os ids originais, restaurável.
//
// O que NÃO é apagado: operadores, assinatura, chaves PIX, proxies,
// Network, afiliados, perfil. "Zerar" é a planilha, não a conta.
// ─────────────────────────────────────────────────────────────────────────

export const BUCKET = 'backups'
export const DIAS_GUARDADOS = 7
const DIA = 86400000

/** Tabelas da operação, na ORDEM DE APAGAR (filhas antes das mães: remessas,
    logs e capturas apontam pra metas). Restaurar usa a ordem inversa. */
export const TABELAS = ['activity_logs', 'deposit_capture_sessions', 'remessas', 'admin_planilha', 'costs', 'metodos_registros', 'metas']
export const ROTULO = {
  metas: 'metas', remessas: 'remessas', costs: 'custos', admin_planilha: 'linhas da planilha',
  metodos_registros: 'registros de métodos', activity_logs: 'registros de atividade', deposit_capture_sessions: 'capturas de QR',
}

async function todas(sb, tabela, tenantId) {
  const linhas = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await sb.from(tabela).select('*').eq('tenant_id', tenantId).order('id', { ascending: true }).range(de, de + 999)
    if (error) throw new Error(`${tabela}: ${error.message}`)
    linhas.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return linhas
}

/** Quantas linhas de cada tabela o tenant tem hoje. */
export async function contagem(sb, tenantId) {
  const out = {}
  await Promise.all(TABELAS.map(async t => {
    const { count, error } = await sb.from(t).select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    out[t] = error ? 0 : (count || 0)
  }))
  return out
}

const caminho = (tenantId, nome) => `${tenantId}/${nome}`

/**
 * Tira a cópia completa e grava no Storage. Devolve { nome, contagem }.
 * `motivo` vai no arquivo: 'zerar' ou 'antes-de-restaurar' (a restauração
 * também guarda o estado que vai ser sobrescrito — ninguém perde nada).
 */
export async function copiar(sb, tenantId, motivo = 'zerar') {
  const tabelas = {}, cont = {}
  for (const t of TABELAS) { tabelas[t] = await todas(sb, t, tenantId); cont[t] = tabelas[t].length }
  const criadoEm = new Date().toISOString()
  const nome = `${criadoEm.replace(/[:.]/g, '-')}__${motivo}.json`
  const corpo = Buffer.from(JSON.stringify({ versao: 1, tenant_id: tenantId, motivo, criado_em: criadoEm, contagem: cont, tabelas }))
  const { error } = await sb.storage.from(BUCKET).upload(caminho(tenantId, nome), corpo, { contentType: 'application/json', upsert: false })
  if (error) throw new Error('não consegui guardar a cópia: ' + error.message)
  return { nome, criado_em: criadoEm, contagem: cont, bytes: corpo.length }
}

/** Apaga tudo da operação do tenant, na ordem segura. Devolve quantas linhas saíram. */
export async function apagar(sb, tenantId) {
  const antes = await contagem(sb, tenantId)
  for (const t of TABELAS) {
    const { error } = await sb.from(t).delete().eq('tenant_id', tenantId)
    if (error) throw new Error(`apagar ${t}: ${error.message}`)
  }
  return antes
}

/** As cópias do tenant ainda dentro dos 7 dias, da mais nova pra mais velha. */
export async function listar(sb, tenantId) {
  const { data, error } = await sb.storage.from(BUCKET).list(tenantId, { limit: 100, sortBy: { column: 'name', order: 'desc' } })
  if (error) throw new Error('listar cópias: ' + error.message)
  const agora = Date.now()
  return (data || [])
    .filter(f => f.name.endsWith('.json'))
    .map(f => {
      const [ts, resto] = f.name.replace(/\.json$/, '').split('__')
      // "2026-10-07T12-30-00-123Z" → ISO de volta
      const iso = ts.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, '$1T$2:$3:$4.$5Z')
      const criado = new Date(iso).getTime()
      return { nome: f.name, criado_em: iso, motivo: resto || 'zerar', bytes: f.metadata?.size || 0, expira_em: new Date(criado + DIAS_GUARDADOS * DIA).toISOString(), valida: Number.isFinite(criado) && agora - criado < DIAS_GUARDADOS * DIA }
    })
    .filter(c => c.valida)
}

async function baixar(sb, tenantId, nome) {
  const { data, error } = await sb.storage.from(BUCKET).download(caminho(tenantId, nome))
  if (error || !data) throw new Error('cópia não encontrada')
  const j = JSON.parse(await data.text())
  if (j.tenant_id !== tenantId) throw new Error('cópia de outra conta')
  return j
}

/** O resumo de uma cópia (contagem), sem restaurar. */
export async function detalhe(sb, tenantId, nome) {
  const j = await baixar(sb, tenantId, nome)
  return { nome, criado_em: j.criado_em, motivo: j.motivo, contagem: j.contagem }
}

/**
 * Volta a operação ao estado da cópia. Antes, guarda o estado atual
 * (motivo 'antes-de-restaurar') e só então apaga e reinsere.
 *
 * IDS: metas, remessas, custos, logs e métodos têm id numérico GERADO PELO
 * BANCO (identity) — não dá pra reinserir com o id antigo. Então as metas
 * entram primeiro, o banco dá ids novos, e tudo que apontava pra meta
 * (remessas.meta_id, activity_logs.meta_id, deposit_capture_sessions.meta_id)
 * é religado pelo mapa antigo→novo. admin_planilha e capturas têm id uuid e
 * voltam com o mesmo id.
 */
export async function restaurar(sb, tenantId, nome) {
  const j = await baixar(sb, tenantId, nome)
  const guardada = await copiar(sb, tenantId, 'antes-de-restaurar')
  await apagar(sb, tenantId)
  const inserido = {}
  const inicio = new Date().toISOString()
  const semId = l => { const { id, ...resto } = l; return { ...resto, tenant_id: tenantId } }
  const comId = l => ({ ...l, tenant_id: tenantId })

  // 1 · metas: o banco gera o id; o RETURNING vem na ordem do VALUES
  const mapa = new Map()
  const metas = j.tabelas.metas || []
  inserido.metas = 0
  for (let i = 0; i < metas.length; i += 500) {
    const lote = metas.slice(i, i + 500)
    const { data, error } = await sb.from('metas').insert(lote.map(semId)).select('id,created_at,titulo')
    if (error) throw new Error('restaurar metas: ' + error.message)
    if ((data || []).length !== lote.length) throw new Error('restaurar metas: o banco devolveu ' + (data || []).length + ' de ' + lote.length)
    lote.forEach((m, k) => {
      const d = data[k]
      if (String(d.created_at) !== String(m.created_at) || (d.titulo || '') !== (m.titulo || '')) throw new Error('restaurar metas: ordem do retorno não bateu — restauração interrompida (a cópia continua guardada)')
      mapa.set(Number(m.id), d.id)
    })
    inserido.metas += lote.length
  }
  const novaMeta = v => (v == null ? null : mapa.get(Number(v)) ?? null)

  // 2 · o resto, mãe → filhas
  const PLANO = {
    admin_planilha:           l => comId(l),
    costs:                    l => semId(l),
    metodos_registros:        l => semId(l),
    remessas:                 l => ({ ...semId(l), meta_id: novaMeta(l.meta_id) }),
    activity_logs:            l => ({ ...semId(l), meta_id: novaMeta(l.meta_id) }),
    deposit_capture_sessions: l => ({ ...comId(l), meta_id: l.meta_id == null ? null : String(novaMeta(l.meta_id) ?? '') }),
  }
  for (const [t, prepara] of Object.entries(PLANO)) {
    let linhas = (j.tabelas[t] || []).map(prepara)
    // remessa sem meta (apontava pra meta que não existia na cópia) não tem onde morar
    if (t === 'remessas') linhas = linhas.filter(l => l.meta_id != null)
    inserido[t] = 0
    for (let i = 0; i < linhas.length; i += 500) {
      const lote = linhas.slice(i, i + 500)
      const { error } = await sb.from(t).insert(lote)
      if (error) throw new Error('restaurar ' + t + ': ' + error.message)
      inserido[t] += lote.length
    }
  }
  // Um gatilho no banco grava um activity_log a cada meta/remessa inserida.
  // Na restauração isso duplicaria o histórico (os logs verdadeiros já
  // voltaram da cópia, com a data original): sai tudo que nasceu agora.
  await sb.from('activity_logs').delete().eq('tenant_id', tenantId).gte('created_at', inicio)
  return { inserido, guardada: guardada.nome }
}

/** Apaga do Storage toda cópia com mais de 7 dias, de todos os tenants. Devolve quantas saíram. */
export async function limparAntigas(sb) {
  const { data: pastas, error } = await sb.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) throw new Error('listar pastas: ' + error.message)
  const agora = Date.now()
  let removidas = 0
  for (const p of pastas || []) {
    if (!p.name || p.name.includes('.')) continue
    const { data: arqs } = await sb.storage.from(BUCKET).list(p.name, { limit: 1000 })
    const velhos = (arqs || []).filter(f => {
      const iso = f.name.split('__')[0].replace(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z.*$/, '$1T$2:$3:$4.$5Z')
      const t = new Date(iso).getTime()
      return !Number.isFinite(t) || agora - t >= DIAS_GUARDADOS * DIA
    }).map(f => `${p.name}/${f.name}`)
    if (velhos.length) {
      const { error: e2 } = await sb.storage.from(BUCKET).remove(velhos)
      if (!e2) removidas += velhos.length
    }
  }
  return removidas
}

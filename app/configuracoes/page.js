'use client'
// CONFIGURAÇÕES — por enquanto, uma coisa só: zerar a operação e voltar
// atrás. O cliente apaga TUDO da planilha (metas, remessas, custos…) em três
// confirmações (ler o que some → digitar ZERAR → senha da conta). Antes de
// apagar, uma cópia fica guardada por 7 dias e aparece aqui embaixo, com
// botão de restaurar (também pede a senha). Regras e cópias: lib/zerar.js.
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'

const getName = p => p?.nome || p?.email?.split('@')[0] || 'Operador'
const ROTULO = { metas: 'Metas', remessas: 'Remessas', costs: 'Custos', admin_planilha: 'Linhas da planilha', metodos_registros: 'Registros de métodos', activity_logs: 'Histórico de atividade', deposit_capture_sessions: 'Capturas de QR' }
const ORDEM = ['metas', 'remessas', 'costs', 'admin_planilha', 'metodos_registros', 'activity_logs', 'deposit_capture_sessions']
const FICA = ['Operadores e convites', 'Assinatura e pagamentos', 'Chaves PIX e proxies', 'Network, afiliados e perfil']
const int = v => Number(v || 0).toLocaleString('pt-BR')
const quando = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const ease = [0.33, 1, 0.68, 1]

const card = { borderRadius: 16, padding: '20px 22px', background: 'linear-gradient(145deg, var(--raised), var(--surface))', border: '1px solid var(--b1)', boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }
const campo = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--b2)', background: 'var(--fill-1)', color: 'var(--t1)', fontSize: 15, outline: 'none', fontFamily: 'inherit' }
const btn = (tipo = 'neutro', dis = false) => ({
  padding: '11px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: dis ? 'default' : 'pointer', fontFamily: 'inherit', opacity: dis ? 0.55 : 1, transition: 'all .15s',
  ...(tipo === 'perigo' ? { background: 'var(--loss)', color: '#fff', border: '1px solid var(--loss)' }
    : tipo === 'perigoLeve' ? { background: 'var(--loss-dim)', color: 'var(--loss)', border: '1px solid var(--loss-border)' }
    : tipo === 'forte' ? { background: 'var(--t1)', color: 'var(--surface)', border: '1px solid var(--t1)' }
    : { background: 'transparent', color: 'var(--t2)', border: '1px solid var(--b2)' }),
})

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(null)
  const [dados, setDados] = useState(null)      // { contagem, copias }
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(null)      // { tipo:'zerar' } | { tipo:'restaurar', copia }
  const [aviso, setAviso] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u); setToken(s.session.access_token)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    setProfile(p)
    if (p?.role !== 'admin') return
    await carregar(s.session.access_token)
  }
  async function carregar(tk = token) {
    setErro('')
    try {
      const r = await fetch('/api/tenant/zerar', { headers: { Authorization: 'Bearer ' + tk }, cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Falha ao carregar')
      // o conteúdo de cada cópia (são poucas: 7 dias)
      const copias = await Promise.all((j.copias || []).map(async c => {
        try {
          const d = await fetch('/api/tenant/zerar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk }, body: JSON.stringify({ acao: 'detalhe', nome: c.nome }) }).then(x => x.json())
          return { ...c, contagem: d.contagem || null }
        } catch { return c }
      }))
      setDados({ contagem: j.contagem, copias })
    } catch (e) { setErro(e.message) }
  }

  const total = useMemo(() => dados ? ORDEM.reduce((s, k) => s + Number(dados.contagem[k] || 0), 0) : 0, [dados])
  const isAdmin = profile?.role === 'admin'

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={isAdmin} userId={user?.id} tenantId={profile?.tenant_id}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px 80px' }}>
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 25, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>Configurações</h1>
            <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '3px 0 0' }}>Dados da operação: zerar e restaurar</p>
          </div>

          {profile && !isAdmin && (
            <div style={card}><p style={{ margin: 0, color: 'var(--t2)', fontSize: 14 }}>Só o administrador da conta pode zerar ou restaurar os dados da operação.</p></div>
          )}

          {isAdmin && (
            <div style={{ display: 'grid', gap: 16 }}>
              {aviso && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, borderColor: 'var(--b2)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M20 6L9 17l-5-5" /></svg>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--t1)', lineHeight: 1.5 }}>{aviso}</p>
                  <button onClick={() => setAviso('')} aria-label="Fechar" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                </motion.div>
              )}
              {erro && <div style={{ ...card, borderColor: 'var(--loss-border)', color: 'var(--loss)', fontSize: 13.5 }}>{erro}</div>}

              {/* ── O que existe hoje ── */}
              <section style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>Dados da operação</p>
                    <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{dados ? `${int(total)} registros no painel` : 'Carregando…'}</h2>
                  </div>
                  <button onClick={() => setModal({ tipo: 'zerar' })} disabled={!dados || total === 0} style={btn('perigoLeve', !dados || total === 0)}>Zerar a operação…</button>
                </div>
                {dados && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginTop: 18 }}>
                    {ORDEM.map(k => (
                      <div key={k} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--fill-1)', border: '1px solid var(--b1)' }}>
                        <p style={{ fontFamily: 'var(--mono, monospace)', fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>{int(dados.contagem[k])}</p>
                        <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '3px 0 0' }}>{ROTULO[k]}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '16px 0 0', lineHeight: 1.55 }}>
                  Zerar apaga tudo isso e deixa o painel como no primeiro dia. Operadores, assinatura, chaves PIX, proxies e Network não são tocados. Antes de apagar, uma cópia completa fica guardada por 7 dias, e você pode restaurar daqui.
                </p>
              </section>

              {/* ── Cópias ── */}
              <section style={card}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px' }}>Cópias dos últimos 7 dias</p>
                {!dados ? null : dados.copias.length === 0 ? (
                  <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--t2)' }}>Nenhuma cópia guardada. Elas aparecem aqui quando você zera a operação ou restaura uma cópia.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                    {dados.copias.map(c => (
                      <div key={c.nome} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--fill-1)', border: '1px solid var(--b1)', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--t1)' }}>
                            {c.motivo === 'antes-de-restaurar' ? 'Estado antes de uma restauração' : 'Antes de zerar'} · {quando(c.criado_em)}
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--t3)' }}>
                            {c.contagem ? ORDEM.filter(k => c.contagem[k] > 0).map(k => `${int(c.contagem[k])} ${ROTULO[k].toLowerCase()}`).join(' · ') || 'vazia' : '…'}
                            {' '}· expira {quando(c.expira_em)}
                          </p>
                        </div>
                        <button onClick={() => setModal({ tipo: 'restaurar', copia: c })} style={btn('neutro')}>Restaurar</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </AppLayout>

      <AnimatePresence>
        {modal && (
          <Modal
            key={modal.tipo + (modal.copia?.nome || '')}
            modal={modal} token={token} contagem={dados?.contagem} email={user?.email}
            onClose={() => setModal(null)}
            onDone={async msg => { setModal(null); setAviso(msg); await carregar() }}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

/* ── o fluxo de confirmação, em etapas ── */
function Modal({ modal, token, contagem, email, onClose, onDone }) {
  const zerar = modal.tipo === 'zerar'
  const [etapa, setEtapa] = useState(1)
  const [ciente, setCiente] = useState(false)
  const [frase, setFrase] = useState('')
  const [senha, setSenha] = useState('')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const total = zerar ? 3 : 2

  async function executar() {
    setBusy(true); setErro('')
    try {
      const body = zerar ? { acao: 'zerar', frase, senha } : { acao: 'restaurar', nome: modal.copia.nome, senha }
      const r = await fetch('/api/tenant/zerar', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Não deu certo')
      if (zerar) {
        const n = Object.values(j.apagado || {}).reduce((s, v) => s + Number(v || 0), 0)
        onDone(`Operação zerada: ${int(n)} registros apagados. A cópia fica guardada por 7 dias na lista abaixo, com botão de restaurar.`)
      } else {
        const n = Object.values(j.inserido || {}).reduce((s, v) => s + Number(v || 0), 0)
        onDone(`Cópia restaurada: ${int(n)} registros de volta no painel. O estado anterior também ficou guardado por 7 dias.`)
      }
    } catch (e) { setErro(e.message); setBusy(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={busy ? undefined : onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 10050, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.25, ease }} onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true"
        style={{ width: '100%', maxWidth: 520, borderRadius: 18, padding: '24px 24px 20px', background: 'var(--raised)', border: '1px solid var(--b2)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: zerar ? 'var(--loss)' : 'var(--t3)', margin: 0 }}>
            {zerar ? 'Zerar a operação' : 'Restaurar cópia'} · passo {etapa} de {total}
          </p>
          <div style={{ display: 'flex', gap: 4 }}>{Array.from({ length: total }, (_, i) => <i key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < etapa ? (zerar ? 'var(--loss)' : 'var(--t1)') : 'var(--b2)' }} />)}</div>
        </div>

        {zerar && etapa === 1 && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Isso apaga a operação inteira</h3>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 14px', lineHeight: 1.5 }}>O painel volta ao primeiro dia. Vai sair:</p>
            <ul style={{ margin: '0 0 14px', paddingLeft: 18, color: 'var(--t1)', fontSize: 13.5, lineHeight: 1.7 }}>
              {ORDEM.filter(k => contagem?.[k] > 0).map(k => <li key={k}><b>{int(contagem[k])}</b> {ROTULO[k].toLowerCase()}</li>)}
            </ul>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px', lineHeight: 1.5 }}>Continua como está: {FICA.join(', ').toLowerCase()}. Uma cópia de tudo fica guardada por 7 dias e pode ser restaurada em Configurações.</p>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13.5, color: 'var(--t1)', marginBottom: 18 }}>
              <input type="checkbox" checked={ciente} onChange={e => setCiente(e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--loss)' }} />
              Entendi que todos os dados da operação serão apagados.
            </label>
          </>
        )}
        {zerar && etapa === 2 && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Digite ZERAR para confirmar</h3>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 14px', lineHeight: 1.5 }}>Em letras maiúsculas, exatamente assim.</p>
            <input autoFocus value={frase} onChange={e => setFrase(e.target.value)} placeholder="ZERAR" style={{ ...campo, letterSpacing: '0.12em', fontWeight: 700, marginBottom: 18 }} />
          </>
        )}
        {etapa === total && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>{zerar ? 'Por último, sua senha' : 'Confirme com sua senha'}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 14px', lineHeight: 1.5 }}>
              {zerar ? `A senha da conta ${email}.` : `A operação atual será guardada antes (7 dias) e substituída pela cópia de ${quando(modal.copia.criado_em)}. Senha da conta ${email}.`}
            </p>
            <input autoFocus type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" style={{ ...campo, marginBottom: 12 }} onKeyDown={e => { if (e.key === 'Enter' && senha && !busy) executar() }} />
          </>
        )}
        {!zerar && etapa === 1 && (
          <>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Voltar para esta cópia?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', margin: '0 0 8px', lineHeight: 1.5 }}>Cópia de <b style={{ color: 'var(--t1)' }}>{quando(modal.copia.criado_em)}</b>, com:</p>
            <ul style={{ margin: '0 0 14px', paddingLeft: 18, color: 'var(--t1)', fontSize: 13.5, lineHeight: 1.7 }}>
              {modal.copia.contagem ? ORDEM.filter(k => modal.copia.contagem[k] > 0).map(k => <li key={k}><b>{int(modal.copia.contagem[k])}</b> {ROTULO[k].toLowerCase()}</li>) : <li>…</li>}
            </ul>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 18px', lineHeight: 1.5 }}>O que está no painel agora é substituído, mas antes vira uma cópia nova, também guardada por 7 dias. Nada se perde sem volta.</p>
          </>
        )}

        {erro && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--loss)' }}>{erro}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} disabled={busy} style={btn('neutro', busy)}>Cancelar</button>
          {etapa < total ? (
            <button onClick={() => setEtapa(etapa + 1)} disabled={zerar && ((etapa === 1 && !ciente) || (etapa === 2 && frase.trim().toUpperCase() !== 'ZERAR'))} style={btn('forte', zerar && ((etapa === 1 && !ciente) || (etapa === 2 && frase.trim().toUpperCase() !== 'ZERAR')))}>Continuar</button>
          ) : (
            <button onClick={executar} disabled={busy || !senha} style={btn(zerar ? 'perigo' : 'forte', busy || !senha)}>{busy ? (zerar ? 'Apagando…' : 'Restaurando…') : zerar ? 'Zerar agora' : 'Restaurar'}</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

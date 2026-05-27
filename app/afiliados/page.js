'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import RouteTour from '../../components/RouteTour'
import { supabase } from '../../lib/supabase/client'

const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ease = [0.33, 1, 0.68, 1]

export default function AfiliadosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [data, setData] = useState(null)
  const [copied, setCopied] = useState(false)
  const emailRef = useRef(null)

  async function fetchStats(email) {
    const res = await fetch('/api/affiliate/stats', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    let interval
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      emailRef.current = u.email
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p || p.role !== 'admin') { router.push('/admin'); return }
      setProfile(p)
      if (p.tenant_id) {
        const { data: t } = await supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle()
        setTenant(t)
      }
      await fetchStats(u.email)
      setLoading(false)
      interval = setInterval(() => { if (emailRef.current) fetchStats(emailRef.current) }, 20000)
    }
    init()
    return () => { if (interval) clearInterval(interval) }
  }, [])

  async function copyLink() {
    if (!data?.link) return
    try {
      await navigator.clipboard.writeText(data.link)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  if (loading) return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 22, height: 22, borderTopColor: '#e53935' }} />
      </main>
    </AppLayout>
  )

  const enabled = !!data?.enabled
  const totals = data?.totals || {}
  const referrals = data?.referrals || []

  return (
    <AppLayout userName={profile?.nome} userEmail={user?.email} isAdmin={true} tenant={tenant} userId={user?.id} tenantId={profile?.tenant_id}>
      <main style={{ minHeight: '100vh', padding: '40px 28px 80px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.87"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--t1)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Programa de Afiliados</h1>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Ganhe comissão recorrente por cada cliente indicado</p>
          </div>
        </motion.div>

        {!enabled ? (
          /* BLOQUEIO */
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
            style={{ borderRadius: 20, background: 'linear-gradient(145deg, #000000, #000000)', border: '1px solid rgba(255,255,255,0.15)', padding: '48px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30%', left: '20%', right: '20%', height: 200, background: 'radial-gradient(ellipse, rgba(255,255,255,0.12), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
                <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </motion.div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', margin: '0 0 10px' }}>Programa em ativação controlada</h2>
              <p style={{ fontSize: 14, color: 'var(--t2)', margin: '0 auto 6px', maxWidth: 520, lineHeight: 1.55 }}>
                O programa de afiliados NexControl está sendo liberado gradualmente para parceiros selecionados.
              </p>
              <p style={{ fontSize: 12, color: 'var(--t4)', margin: '0 auto', maxWidth: 520 }}>
                Em breve você também poderá gerar seu link único e ganhar comissão recorrente.
              </p>
              <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.78)' }} />
                <span style={{ fontSize: 11, color: '#fcd34d', fontWeight: 600 }}>Acesso restrito · Em breve para você</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* LINK CARD */}
            <motion.div data-tour="afil-link" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0.05 }}
              style={{ borderRadius: 18, padding: 24, marginBottom: 22, background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(209,250,229,0.04))', border: '1px solid rgba(255,255,255,0.18)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Seu link de convite</p>
                  <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>Compartilhe e ganhe <strong style={{ color: '#D1FAE5' }}>{Math.round((data?.rate || 0.50) * 100)}%</strong> da primeira mensalidade · pagamento via PIX</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(209,250,229,0.1)', color: '#D1FAE5', border: '1px solid rgba(209,250,229,0.2)' }}>ATIVO</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.link}
                </div>
                <motion.button onClick={copyLink} whileTap={{ scale: 0.97 }}
                  style={{ padding: '12px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: copied ? 'rgba(209,250,229,0.18)' : 'rgba(255,255,255,0.78)', color: copied ? '#D1FAE5' : '#fff', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' }}>
                  {copied ? (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copiado!</>)
                    : (<><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar link</>)}
                </motion.button>
              </div>
              <p style={{ fontSize: 10, color: 'var(--t4)', margin: '12px 0 0' }}>Código: <strong style={{ color: 'var(--t2)', fontFamily: 'var(--mono)' }}>{data.code}</strong></p>
            </motion.div>

            {/* KPIs */}
            <div data-tour="afil-kpis" className="g-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
              {[
                { l: 'Indicados', v: totals.totalIndicados || 0, c: 'rgba(255,255,255,0.78)', prefix: '' },
                { l: 'Faturamento gerado', v: totals.totalFaturado || 0, c: '#60A5FA', prefix: 'R$ ' },
                { l: 'Comissão acumulada', v: totals.totalComissao || 0, c: '#D1FAE5', prefix: 'R$ ' },
                { l: 'A receber', v: totals.pendente || 0, c: 'rgba(255,255,255,0.78)', prefix: 'R$ ' },
              ].map((k, i) => (
                <motion.div key={k.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 + i * 0.06, ease }}
                  style={{ borderRadius: 14, padding: '18px 20px', background: 'linear-gradient(145deg, #000000, #000000)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 10, color: 'var(--t4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{k.l}</p>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: k.c, margin: 0, lineHeight: 1 }}>
                    {k.prefix}{typeof k.v === 'number' && k.prefix ? fmt(k.v) : k.v}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* COMO DIVULGAR + PIX + SIMULADOR */}
            <DivulgaPixSimulador data={data} fmt={fmt} onPixSaved={() => fetchStats(emailRef.current)} userEmail={user?.email} />

            {/* Lista de indicados */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease }}
              style={{ borderRadius: 16, padding: 24, background: 'linear-gradient(145deg, #000000, #000000)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Clientes indicados ({referrals.length})</h3>
                <span style={{ fontSize: 10, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Atualiza a cada 20s</span>
              </div>
              {referrals.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>Nenhum indicado ainda — compartilhe seu link e comece a ganhar</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AnimatePresence initial={false}>
                    {referrals.map(r => (
                      <motion.div key={r.tenant_id} layout
                        initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
                        transition={{ duration: 0.35, ease }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#c4b5fd' }}>{(r.tenant_name || '?')[0].toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.tenant_name}</p>
                          <p style={{ fontSize: 10, color: 'var(--t4)', margin: '2px 0 0' }}>
                            {r.email && <span>{r.email} · </span>}
                            <span style={{ color: r.subscription_status === 'active' ? '#D1FAE5' : r.subscription_status === 'trial' ? 'rgba(255,255,255,0.78)' : 'var(--t4)', fontWeight: 600 }}>
                              {r.subscription_status === 'active' ? 'PRO' : r.subscription_status === 'trial' ? 'TRIAL' : r.subscription_status}
                            </span>
                            {r.payments_count > 0 && <span> · {r.payments_count} pagto(s)</span>}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: '#D1FAE5', margin: 0 }}>+R$ {fmt(r.commission)}</p>
                          <p style={{ fontSize: 9, color: 'var(--t4)', margin: '2px 0 0' }}>de R$ {fmt(r.generated)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
      <RouteTour tourId="afiliados" />
    </AppLayout>
  )
}

/* ── COMO DIVULGAR + PIX + SIMULADOR ── */
function DivulgaPixSimulador({ data, fmt, onPixSaved, userEmail }) {
  const link = data?.link || ''
  const rate = data?.rate || 0.50
  const [pixKey, setPixKey] = useState(data?.pix_key || '')
  const [pixType, setPixType] = useState(data?.pix_type || 'email')
  const [pixSaved, setPixSaved] = useState(false)
  const [savingPix, setSavingPix] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [simIndicados, setSimIndicados] = useState(10)

  useEffect(() => {
    setPixKey(data?.pix_key || '')
    setPixType(data?.pix_type || 'email')
  }, [data?.pix_key, data?.pix_type])

  async function savePix() {
    setSavingPix(true)
    try {
      const res = await fetch('/api/affiliate/pix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, pix_key: pixKey, pix_type: pixType }),
      })
      if (res.ok) {
        setPixSaved(true)
        setTimeout(() => setPixSaved(false), 2200)
        onPixSaved?.()
      }
    } finally { setSavingPix(false) }
  }

  function copyTpl(text, idx) {
    try {
      navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1800)
    } catch {}
  }

  const templates = [
    {
      label: 'WhatsApp curto',
      text: `Mano, descobri um sistema que organiza toda operação de CPA. Metas, operadores, BAU, lucro líquido — tudo num lugar só. Testa grátis 3 dias: ${link}`,
    },
    {
      label: 'Instagram / Stories',
      text: `🎯 Operação de CPA organizada de verdade. Sistema com metas, operadores, BAU, ranking e fechamento automático. Teste 3 dias grátis 👇\n${link}`,
    },
    {
      label: 'Direct / DM longo',
      text: `Cara, se tu opera com CPA isso vai te ajudar muito. É o NexControl — sistema feito pra essa nossa operação (metas, BAU, operadores, lucro líquido, fechamento, push em tempo real). Testei e virei cliente. Tem 3 dias grátis:\n\n${link}\n\nQualquer dúvida me chama.`,
    },
  ]

  // Simulador
  const baseTicket = 39.90 // ticket mais conservador (Admin Solo)
  const earningSim = simIndicados * baseTicket * rate

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12, ease: [0.33, 1, 0.68, 1] }}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>

      {/* COMO DIVULGAR — copy pronta */}
      <div style={{ borderRadius: 16, padding: 22, background: 'linear-gradient(145deg, #000000, #050505)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.2" strokeLinecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Mensagens prontas</p>
            <p style={{ fontSize: 10, color: '#64748B', margin: '2px 0 0' }}>Copie e cole no WhatsApp / Insta</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map((t, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.label}</span>
                <button onClick={() => copyTpl(t.text, i)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: copiedIdx === i ? 'rgba(16,185,129,0.15)' : 'rgba(229,57,53,0.12)', color: copiedIdx === i ? '#10B981' : '#e53935', border: 'none', cursor: 'pointer' }}>
                  {copiedIdx === i ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#CBD5E1', margin: 0, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PIX + SIMULADOR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* PIX */}
        <div style={{ borderRadius: 16, padding: 22, background: 'linear-gradient(145deg, #000000, #050505)', border: '1px solid rgba(229,57,53,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(229,57,53,0.12)', border: '1px solid rgba(229,57,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.2" strokeLinecap="round"><path d="M22 4L12 14.01l-3-3"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Chave PIX pra receber</p>
              <p style={{ fontSize: 10, color: '#64748B', margin: '2px 0 0' }}>Sem PIX, suas comissões ficam paradas</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select value={pixType} onChange={e => setPixType(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#F1F5F9', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Aleatória</option>
            </select>
            <input value={pixKey} onChange={e => setPixKey(e.target.value)}
              placeholder={pixType === 'cpf' ? '000.000.000-00' : pixType === 'email' ? 'seu@email.com' : pixType === 'phone' ? '+55 31 99999-9999' : 'chave aleatoria'}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 9, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#F1F5F9', fontSize: 12, fontFamily: 'var(--mono)', outline: 'none' }} />
          </div>
          <button onClick={savePix} disabled={savingPix || !pixKey.trim()}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 9, border: 'none', cursor: savingPix || !pixKey.trim() ? 'not-allowed' : 'pointer',
              background: pixSaved ? 'rgba(16,185,129,0.15)' : (savingPix || !pixKey.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(145deg, #e53935, #c62828)',
              color: pixSaved ? '#10B981' : (savingPix || !pixKey.trim()) ? '#64748B' : '#fff',
              fontSize: 12, fontWeight: 800, fontFamily: 'inherit' }}>
            {pixSaved ? '✓ Chave salva' : savingPix ? 'Salvando...' : 'Salvar chave PIX'}
          </button>
        </div>

        {/* SIMULADOR */}
        <div style={{ borderRadius: 16, padding: 22, background: 'linear-gradient(145deg, #000000, #050505)', border: '1px solid rgba(209,250,229,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(209,250,229,0.1)', border: '1px solid rgba(209,250,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D1FAE5" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9', margin: 0, flex: 1 }}>Simulador de ganhos</p>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 10px' }}>Se você indicar <strong style={{ color: '#fff', fontFamily: 'var(--mono)' }}>{simIndicados}</strong> pessoas e todas assinarem:</p>
          <input type="range" min="1" max="50" value={simIndicados} onChange={e => setSimIndicados(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 12, accentColor: '#e53935' }} />
          <div style={{ textAlign: 'center', padding: '14px 12px', borderRadius: 11, background: 'rgba(209,250,229,0.06)', border: '1px solid rgba(209,250,229,0.16)' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 900, color: '#D1FAE5', margin: 0, letterSpacing: '-0.025em' }}>
              R$ {fmt(earningSim)}
            </p>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '4px 0 0' }}>{Math.round(rate * 100)}% × R$ {fmt(baseTicket)} × {simIndicados} = R$ {fmt(earningSim)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

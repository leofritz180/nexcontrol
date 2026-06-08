'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '../../../lib/supabase/client'

const OWNER = 'leofritz180@gmail.com'
const fmt = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ease = [0.33, 1, 0.68, 1]

export default function OwnerAfiliadosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const emailRef = useRef(null)

  async function fetchData(email) {
    const res = await fetch('/api/owner/affiliates', {
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
      if (!u || u.email !== OWNER) { router.push('/admin'); return }
      emailRef.current = u.email
      await fetchData(u.email)
      setLoading(false)
      interval = setInterval(() => { if (emailRef.current) fetchData(emailRef.current) }, 20000)
    }
    init()
    return () => { if (interval) clearInterval(interval) }
  }, [])

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div className="spinner" style={{ width: 22, height: 22, borderTopColor: '#e53935' }} />
    </main>
  )
  if (!data) return null

  const { rows = [], totals = {}, pendingCommissions = [] } = data

  async function markPaid(ids) {
    const res = await fetch('/api/owner/affiliates/pay', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailRef.current, ids }),
    })
    if (res.ok) await fetchData(emailRef.current)
  }

  function copyText(t) {
    try { navigator.clipboard.writeText(t) } catch {}
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 28px 80px' }}>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="1.7" strokeLinecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Afiliados</h1>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Visão geral do programa de indicações</p>
            </div>
          </div>
          <button onClick={() => router.push('/owner')}
            style={{ fontSize: 12, fontWeight: 600, padding: '8px 18px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'var(--t3)' }}>
            Voltar ao Centro
          </button>
        </motion.div>

        {/* Totais */}
        <div className="g-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { l: 'Afiliados ativos', v: `${totals.enabled || 0} / ${totals.affiliates || 0}`, c: 'rgba(255,255,255,0.78)' },
            { l: 'Indicados', v: totals.indicados || 0, c: '#60A5FA' },
            { l: 'Faturamento gerado', v: `R$ ${fmt(totals.totalFaturado)}`, c: '#F1F5F9' },
            { l: 'Comissão total', v: `R$ ${fmt(totals.totalComissao)}`, c: 'var(--profit)' },
            { l: 'A pagar', v: `R$ ${fmt(totals.pendente)}`, c: 'rgba(255,255,255,0.78)' },
          ].map((k, i) => (
            <motion.div key={k.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.06 + i * 0.05, ease }}
              style={{ borderRadius: 14, padding: '18px 20px', background: 'linear-gradient(145deg, var(--surface), var(--surface))', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 10, color: '#64748B', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{k.l}</p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: k.c, margin: 0, lineHeight: 1 }}>{k.v}</p>
            </motion.div>
          ))}
        </div>

        {/* PAGAMENTOS PENDENTES — owner paga via PIX e marca como paid */}
        {pendingCommissions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18, ease }}
            style={{ borderRadius: 16, padding: 24, marginBottom: 24, background: 'linear-gradient(180deg, var(--raised), #050505)', border: '1px solid rgba(229,57,53,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
                💸 Pagamentos pendentes <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginLeft: 8 }}>({pendingCommissions.length})</span>
              </h3>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 800, color: '#e53935' }}>
                R$ {fmt(pendingCommissions.reduce((s, c) => s + c.commission_amount, 0))}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingCommissions.map(c => (
                <div key={c.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr 160px 130px', gap: 12, alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Afiliado (recebe)</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>{c.affiliate.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--t3)', margin: '2px 0 0', fontFamily: 'var(--mono)' }}>{c.affiliate.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Indicou</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', margin: 0 }}>{c.referred.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--t3)', margin: '2px 0 0' }}>pagou R$ {fmt(c.payment_amount)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>PIX</p>
                    {c.affiliate.pix_key ? (
                      <button onClick={() => copyText(c.affiliate.pix_key)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                        <p style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--profit)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }} title="clique pra copiar">📋 {c.affiliate.pix_key}</p>
                        <p style={{ fontSize: 9, color: '#64748B', margin: '2px 0 0' }}>{c.affiliate.pix_type || 'tipo —'}</p>
                      </button>
                    ) : (
                      <p style={{ fontSize: 11, color: 'var(--loss)', margin: 0 }}>⚠️ sem PIX</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 900, color: '#e53935' }}>R$ {fmt(c.commission_amount)}</span>
                    <button onClick={() => markPaid([c.id])}
                      disabled={!c.affiliate.pix_key}
                      style={{
                        fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 6,
                        background: c.affiliate.pix_key ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.08)',
                        color: c.affiliate.pix_key ? '#10B981' : '#64748B',
                        border: `1px solid ${c.affiliate.pix_key ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`,
                        cursor: c.affiliate.pix_key ? 'pointer' : 'not-allowed',
                      }}>
                      ✓ Marcar pago
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Ranking */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease }}
          style={{ borderRadius: 16, padding: 24, background: 'linear-gradient(145deg, var(--surface), var(--surface))', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', margin: '0 0 14px' }}>Ranking de afiliados</h3>
          {rows.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Nenhum afiliado cadastrado ainda</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['#', 'Afiliado', 'Status', 'Taxa', 'Indicados', 'Faturamento', 'Comissão', 'A pagar'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const medals = ['#FFD700', '#C0C0C0', '#CD7F32']
                    const medal = medals[i]
                    return (
                      <tr key={r.tenant_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px', fontFamily: 'var(--mono)', fontWeight: 800, color: medal || '#64748B', fontSize: 13 }}>{i + 1}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#c4b5fd' }}>{(r.tenant_name || '?')[0].toUpperCase()}</span>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{r.tenant_name}</p>
                              <p style={{ fontSize: 9, color: '#64748B', margin: '2px 0 0', fontFamily: 'var(--mono)' }}>{r.email || '—'} · {r.code}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: r.enabled ? 'rgba(209,250,229,0.08)' : 'rgba(100,116,139,0.08)', color: r.enabled ? 'var(--profit)' : '#64748B', border: `1px solid ${r.enabled ? 'rgba(209,250,229,0.2)' : 'rgba(100,116,139,0.2)'}` }}>
                            {r.enabled ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'var(--mono)', color: 'var(--t3)' }}>{Math.round(r.rate * 100)}%</td>
                        <td style={{ padding: '12px', fontFamily: 'var(--mono)', fontWeight: 700, color: '#F1F5F9' }}>{r.indicados}</td>
                        <td style={{ padding: '12px', fontFamily: 'var(--mono)', color: '#60A5FA' }}>R$ {fmt(r.totalFaturado)}</td>
                        <td style={{ padding: '12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--profit)' }}>R$ {fmt(r.totalComissao)}</td>
                        <td style={{ padding: '12px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'rgba(255,255,255,0.78)' }}>R$ {fmt(r.pendente)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

      </div>
    </main>
  )
}

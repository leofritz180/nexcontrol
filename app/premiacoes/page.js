'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AppLayout from '../../components/AppLayout'
import { supabase } from '../../lib/supabase/client'
import { PREMIACOES, artPath, previewPath, premiacoesEnabled } from '../../lib/premiacoes'

const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'
const fmt = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
const ease = [0.33, 1, 0.68, 1]

export default function PremiacoesPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [faturamento, setFaturamento] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p) { router.push('/login'); return }
    setProfile(p)
    const [{ data: t }, { data: s2 }] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (t) setTenant(t); if (s2) setSub(s2)
    // Faturamento = soma de lucro_final das metas fechadas do tenant (todo o histórico)
    const { data: metas } = await supabase.from('metas').select('lucro_final,status_fechamento,deleted_at').eq('tenant_id', p.tenant_id)
    const total = (metas || []).filter(m => !m.deleted_at && m.status_fechamento === 'fechada').reduce((a, m) => a + Number(m.lucro_final || 0), 0)
    setFaturamento(total)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading && !profile) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  )

  const enabled = premiacoesEnabled(user?.email)

  // Estado de cada quadro + próximo marco
  const items = PREMIACOES.map(p => ({ ...p, unlocked: faturamento >= p.value }))
  const next = items.find(p => !p.unlocked) || null
  const conquistados = items.filter(p => p.unlocked).length

  return (
    <AppLayout userName={getName(profile)} userEmail={user?.email} isAdmin={profile?.role === 'admin'} tenant={tenant} subscription={sub} userId={user?.id} tenantId={profile?.tenant_id}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(245,184,60,0.12)', border: '1px solid rgba(245,184,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#f5b83c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a4 4 0 004-4V5H8v6a4 4 0 004 4zm0 0v4m-4 0h8M8 5H5a2 2 0 000 4h.5M16 5h3a2 2 0 010 4h-.5" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Premiações</h1>
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '2px 0 0' }}>Quadros de faturamento que você conquista e imprime — 2 tamanhos pra gráfica</p>
          </div>
        </div>

        {!enabled ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px' }}>Em breve</h2>
            <p style={{ fontSize: 13.5, maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>As premiações estão sendo preparadas. Logo você poderá resgatar os quadros de faturamento da sua operação.</p>
          </div>
        ) : (
          <>
            {/* Faixa: faturamento atual + progresso pro próximo */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
              style={{ borderRadius: 16, padding: '20px 24px', marginBottom: 26, background: 'linear-gradient(135deg, rgba(245,184,60,0.12), var(--surface))', border: '1px solid rgba(245,184,60,0.22)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#f5b83c', textTransform: 'uppercase', marginBottom: 4 }}>Seu faturamento</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--t1)', fontFamily: 'var(--mono)', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(faturamento)}</div>
                  <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 6 }}>{conquistados} de {items.length} quadros conquistados</div>
                </div>
                {next && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7, gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>Próximo quadro: <strong style={{ color: next.color }}>{next.label}</strong></span>
                      <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>faltam <strong style={{ color: 'var(--t1)' }}>{fmt(next.value - faturamento)}</strong></span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (faturamento / next.value) * 100)}%` }} transition={{ duration: 1.1, ease }}
                        style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, #fff, ${next.color})`, boxShadow: `0 0 12px ${next.color}` }} />
                    </div>
                  </div>
                )}
                {!next && <div style={{ flex: 1, minWidth: 200, fontSize: 13.5, fontWeight: 700, color: '#f5b83c' }}>🎉 Você conquistou todos os quadros!</div>}
              </div>
            </motion.div>

            {/* Grade de quadros */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {items.map((p, i) => <QuadroCard key={p.id} p={p} faturamento={faturamento} delay={i * 0.05} />)}
            </div>

            <p style={{ fontSize: 11.5, color: 'var(--t4)', textAlign: 'center', marginTop: 26, lineHeight: 1.6 }}>
              Cada quadro vem em <strong style={{ color: 'var(--t3)' }}>15×20 cm</strong> e <strong style={{ color: 'var(--t3)' }}>20×30 cm</strong> — baixe e leve pra imprimir na gráfica.
            </p>
          </>
        )}
      </div>
    </AppLayout>
  )
}

function QuadroCard({ p, faturamento, delay }) {
  const unlocked = p.unlocked
  const falta = Math.max(0, p.value - faturamento)
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease }}
      style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', border: `1px solid ${unlocked ? p.color + '55' : 'var(--b1)'}`, boxShadow: unlocked ? `0 10px 30px rgba(0,0,0,0.3), 0 0 30px ${p.color}22` : 'none' }}>
      {/* preview do quadro (arte real quando disponível; senão placeholder) */}
      <div style={{ position: 'relative', aspectRatio: '3 / 4', background: `linear-gradient(160deg, ${p.color}22, #0a0d14)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {p.preview ? (
          <img src={previewPath(p)} alt={`Quadro ${p.label}`} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: unlocked ? 'none' : 'grayscale(1) brightness(0.45)' }} />
        ) : (
          // placeholder estilizado (moldura + valor) até a arte chegar
          <div style={{ position: 'absolute', inset: 14, borderRadius: 10, border: `2px solid ${p.color}66`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 12, filter: unlocked ? 'none' : 'grayscale(0.6) brightness(0.7)' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', color: p.color, textTransform: 'uppercase' }}>Faturamento</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', margin: '8px 0 4px' }}>{p.label.replace('R$ ', '')}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: p.color, textTransform: 'uppercase' }}>{p.tier}</div>
            <div style={{ position: 'absolute', bottom: 8, fontSize: 8, color: 'var(--t4)', letterSpacing: '0.1em' }}>PRÉVIA · ARTE EM BREVE</div>
          </div>
        )}
        {/* selo de estado */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: unlocked ? 'rgba(34,197,94,0.16)' : 'rgba(0,0,0,0.5)', border: `1px solid ${unlocked ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`, color: unlocked ? '#4ade80' : 'var(--t3)' }}>
          {unlocked
            ? <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Conquistado</>
            : <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Bloqueado</>}
        </div>
      </div>

      {/* rodapé: título + downloads/estado */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>{p.label}</span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: p.color, textTransform: 'uppercase' }}>{p.tier}</span>
        </div>
        {unlocked ? (
          p.available ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={artPath(p, '15x20')} download style={dlBtn(p.color)}>
                <DownloadIcon /> 15×20
              </a>
              <a href={artPath(p, '20x30')} download style={dlBtn(p.color)}>
                <DownloadIcon /> 20×30
              </a>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', padding: '9px 0', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
              🎉 Conquistado! Arte pra download em breve.
            </div>
          )
        ) : (
          <div style={{ fontSize: 12, color: 'var(--t4)', textAlign: 'center', padding: '9px 0' }}>
            Faltam <strong style={{ color: 'var(--t2)', fontFamily: 'var(--mono)' }}>{fmt(falta)}</strong> pra desbloquear
          </div>
        )}
      </div>
    </motion.div>
  )
}

function dlBtn(color) {
  return { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 9, textDecoration: 'none', fontSize: 12.5, fontWeight: 800, color: '#fff', background: color, border: 'none', cursor: 'pointer' }
}
function DownloadIcon() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}

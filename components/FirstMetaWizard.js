'use client'
// ─────────────────────────────────────────────────────────────────────────
// FirstMetaWizard — assistente da PRIMEIRA meta.
//
// Ataca o gargalo do funil: 64% dos cadastros nunca criam uma meta, mas 68%
// dos que FECHAM uma meta viram pagantes. Este modal guiado tira o atrito de
// criar a 1a meta — 2 telas, so o essencial (rede, plataforma, titulo, contas).
//
// So aparece pra ADMIN com 0 metas no tenant (parent passa `show`). Usa o
// coordenador de overlays (prio 0 = lidera o onboarding, nao empilha com o
// tour). "Agora nao" dispensa por SESSAO — reaparece no proximo login enquanto
// a conta seguir sem meta (reforca o email/push de ativacao).
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase/client'
import { useOverlaySlot } from '../lib/overlayCoordinator'
import { afterVoiceBanner } from '../lib/onboardingSeq'
import { REDES, MULTI_REDE } from '../lib/redes'

const ease = [0.22, 1, 0.36, 1]
const CONTA_PICKS = [10, 20, 30, 50]

export default function FirstMetaWizard({ show, user, tenantId, onCreated }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [step, setStep] = useState(0)
  const [rede, setRede] = useState('')
  const [plataforma, setPlataforma] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tituloTouched, setTituloTouched] = useState(false)
  const [contas, setContas] = useState('20')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Dispensa por sessao (reaparece no proximo login enquanto sem meta)
  const dismissKey = user?.id ? `nx_firstmeta_wizard_dismissed_${user.id}` : null
  useEffect(() => {
    if (!dismissKey) return
    try { if (sessionStorage.getItem(dismissKey) === '1') setDismissed(true) } catch {}
  }, [dismissKey])

  // Espera o banner de onboarding fechar (hoje ja expirado → imediato)
  useEffect(() => {
    const off = afterVoiceBanner(() => setReady(true))
    return off
  }, [])

  // Titulo auto-sugerido enquanto o usuario nao mexe nele
  useEffect(() => {
    if (tituloTouched) return
    const base = plataforma.trim() || rede
    setTitulo(base ? (rede && base !== rede ? `${rede} · ${base}` : base) : '')
  }, [rede, plataforma, tituloTouched])

  const want = !!show && ready && !dismissed
  const granted = useOverlaySlot('first-meta-wizard', 0, want)

  function handleDismiss() {
    try { if (dismissKey) sessionStorage.setItem(dismissKey, '1') } catch {}
    setDismissed(true)
  }

  async function handleCreate() {
    if (saving) return
    if (!rede || !plataforma.trim() || !titulo.trim()) return
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('metas').insert({
      operator_id: user.id,
      titulo: titulo.trim(),
      plataforma: plataforma.trim(),
      rede,
      quantidade_contas: Number(contas || 10),
      status: 'ativa',
      tenant_id: tenantId,
      operation_model: 'salario_bau',
      conta_link: null, conta_login: null, conta_senha: null,
    }).select().single()
    setSaving(false)
    if (err || !data) { setError('Não deu pra criar agora. Tenta de novo.'); return }
    try { onCreated?.(data.id) } catch {}
    router.push(`/meta/${data.id}`)
  }

  if (!want || !granted) return null

  const canCreate = !!rede && !!plataforma.trim() && !!titulo.trim() && !saving

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9200,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflowY: 'auto',
    }}>
      {/* glow ambiente */}
      <div style={{
        position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 520, height: 520, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(209,250,229,0.06), transparent 62%)', filter: 'blur(50px)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease }}
        style={{
          position: 'relative', width: '100%', maxWidth: 460, margin: 'auto',
          background: 'linear-gradient(180deg, #0b0b0b, #050505)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22,
          boxShadow: '0 40px 120px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
        {/* linha de brilho no topo */}
        <div style={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(209,250,229,0.5), transparent)' }} />

        {/* progresso */}
        <div style={{ display: 'flex', gap: 6, padding: '18px 24px 0' }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: i <= step ? 'var(--profit, #d1fae5)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div key="intro"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease }}
              style={{ padding: '28px 26px 26px' }}>
              <div style={{
                fontFamily: 'var(--mono, monospace)', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--profit, #d1fae5)', marginBottom: 16,
              }}>Primeiro passo</div>

              <h2 style={{
                fontFamily: 'var(--font-serif, "Instrument Serif", serif)', fontSize: 30, fontWeight: 400,
                color: '#fafafa', letterSpacing: '-0.02em', lineHeight: 1.12, margin: '0 0 12px',
              }}>Vamos criar sua primeira meta.</h2>

              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 22px', fontWeight: 300 }}>
                Uma <strong style={{ color: '#fff', fontWeight: 600 }}>meta</strong> é o objetivo de depósitos numa rede.
                Assim que você cria a primeira, o NexControl começa a calcular seu
                <strong style={{ color: '#fff', fontWeight: 600 }}> lucro real</strong>, por operador, em tempo real. Leva 2 minutos.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
                {[
                  ['Escolha a rede', 'W1, OKOK, VOY... ou várias ao mesmo tempo.'],
                  ['Defina a plataforma e a quantidade de contas', 'É o alvo que você quer bater.'],
                  ['Acompanhe o lucro ao vivo', 'Cada remessa entra e o resultado se atualiza sozinho.'],
                ].map(([t, d], i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      flexShrink: 0, width: 22, height: 22, borderRadius: 7, marginTop: 1,
                      background: 'rgba(209,250,229,0.1)', border: '1px solid rgba(209,250,229,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: 'var(--profit, #d1fae5)', fontFamily: 'var(--mono, monospace)',
                    }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f0f0', marginBottom: 1 }}>{t}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => setStep(1)} style={btnPrimary}>
                Começar
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
              </button>
              <button type="button" onClick={handleDismiss} style={btnGhost}>Agora não</button>
            </motion.div>
          ) : (
            <motion.div key="form"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease }}
              style={{ padding: '24px 26px 26px' }}>

              <h2 style={{
                fontFamily: 'var(--font-serif, "Instrument Serif", serif)', fontSize: 26, fontWeight: 400,
                color: '#fafafa', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '2px 0 20px',
              }}>Configure sua meta.</h2>

              {/* REDE */}
              <label style={labelStyle}>Rede</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                {[MULTI_REDE, ...REDES].map(r => {
                  const active = rede === r
                  const isMulti = r === MULTI_REDE
                  return (
                    <button key={r} type="button" onClick={() => setRede(r)}
                      style={{
                        padding: isMulti ? '8px 13px' : '8px 12px', borderRadius: 9, cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit',
                        background: active ? 'var(--profit, #d1fae5)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#04140c' : 'rgba(255,255,255,0.72)',
                        border: `1px solid ${active ? 'var(--profit, #d1fae5)' : 'rgba(255,255,255,0.09)'}`,
                        transition: 'all 0.15s',
                      }}>{isMulti ? '★ Múltiplas' : r}</button>
                  )
                })}
              </div>

              {/* PLATAFORMA */}
              <label style={labelStyle}>Plataforma</label>
              <input value={plataforma} onChange={e => setPlataforma(e.target.value)}
                placeholder="Ex.: Blaze, Betano, 1Win..."
                style={inputStyle} />

              {/* TITULO */}
              <label style={{ ...labelStyle, marginTop: 16 }}>Título da meta</label>
              <input value={titulo}
                onChange={e => { setTitulo(e.target.value); setTituloTouched(true) }}
                placeholder="Ex.: W1 · Blaze"
                style={inputStyle} />

              {/* CONTAS */}
              <label style={{ ...labelStyle, marginTop: 16 }}>Quantas contas (alvo)</label>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                {CONTA_PICKS.map(n => {
                  const active = String(n) === String(contas)
                  return (
                    <button key={n} type="button" onClick={() => setContas(String(n))}
                      style={{
                        padding: '9px 15px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 800,
                        fontFamily: 'var(--mono, monospace)',
                        background: active ? 'rgba(209,250,229,0.12)' : 'rgba(255,255,255,0.04)',
                        color: active ? 'var(--profit, #d1fae5)' : 'rgba(255,255,255,0.7)',
                        border: `1px solid ${active ? 'rgba(209,250,229,0.35)' : 'rgba(255,255,255,0.09)'}`,
                      }}>{n}</button>
                  )
                })}
                <input value={contas} inputMode="numeric"
                  onChange={e => setContas(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ ...inputStyle, width: 74, textAlign: 'center', marginBottom: 0, fontFamily: 'var(--mono, monospace)', fontWeight: 700 }} />
              </div>

              {error && <div style={{ fontSize: 12.5, color: 'var(--loss, #ef4444)', marginTop: 14 }}>{error}</div>}

              <button type="button" onClick={handleCreate} disabled={!canCreate}
                style={{ ...btnPrimary, marginTop: 24, opacity: canCreate ? 1 : 0.5, cursor: canCreate ? 'pointer' : 'not-allowed' }}>
                {saving ? (
                  <motion.div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(4,20,12,0.35)', borderTopColor: '#04140c' }}
                    animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                ) : (<>Criar minha primeira meta
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </>)}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <button type="button" onClick={() => setStep(0)} style={{ ...btnGhost, width: 'auto', padding: '8px 4px', margin: 0 }}>← Voltar</button>
                <button type="button" onClick={handleDismiss} style={{ ...btnGhost, width: 'auto', padding: '8px 4px', margin: 0 }}>Agora não</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const btnPrimary = {
  width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
  background: 'var(--profit, #d1fae5)', color: '#04140c',
  fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 8px 24px rgba(209,250,229,0.18)',
}
const btnGhost = {
  width: '100%', padding: '11px 20px', marginTop: 8, borderRadius: 12,
  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)',
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 9,
}
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 11, marginBottom: 0,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fafafa', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

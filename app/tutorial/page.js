'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../../components/Header'
import { supabase } from '../../lib/supabase/client'

const ease = [0.33, 1, 0.68, 1]

const CHECKLIST_KEY = 'nexcontrol_tutorial_checklist'
const STEPS = [
  { id: 'criar_meta', label: 'Criar primeira meta', desc: 'Va em "Minha operacao" ou no painel do operador e crie sua primeira meta de operacao.' },
  { id: 'registrar_remessa', label: 'Registrar remessa', desc: 'Dentro da meta, registre deposito, saque e resultado da remessa.' },
  { id: 'finalizar_meta', label: 'Finalizar meta', desc: 'Quando terminar, finalize a meta. O operador finaliza e o admin fecha com custos.' },
  { id: 'dashboard', label: 'Acompanhar dashboard', desc: 'Veja lucro do dia, resultado liquido e feed ao vivo no painel executivo.' },
  { id: 'convidar_operador', label: 'Convidar operador', desc: 'Na aba Equipe, gere um link de convite e envie para seu operador.' },
  { id: 'fechamento', label: 'Fechar meta com custos', desc: 'Defina salario, custo fixo e taxa do agente no fechamento final.' },
]

export default function TutorialPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState({})
  useEffect(() => {
    async function init() {
      const { data: s } = await supabase.auth.getSession()
      const u = s?.session?.user
      if (!u) { router.push('/login'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (!p || p.role !== 'admin') { router.push('/operator'); return }
      setProfile(p)
      const [{ data: t }, { data: s2 }] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', p.tenant_id).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('tenant_id', p.tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (t) setTenant(t)
      if (s2) setSub(s2)
      setLoading(false)
    }
    init()

    // Load checklist from localStorage
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY)
      if (saved) setChecked(JSON.parse(saved))
    } catch {}
  }, [])

  function toggle(id) {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next))
      return next
    })
  }

  function resetChecklist() {
    setChecked({})
    localStorage.removeItem(CHECKLIST_KEY)
  }

  const completedCount = STEPS.filter(s => checked[s.id]).length
  const allDone = completedCount === STEPS.length
  const progress = (completedCount / STEPS.length) * 100

  if (loading) return null

  const getName = p => p?.nome || p?.email?.split('@')[0] || 'Admin'

  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Header
        userName={getName(profile)}
        userEmail={user?.email}
        isAdmin={true}
        tenant={tenant}
        subscription={sub}
        userId={user?.id}
        tenantId={profile?.tenant_id}
      />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: 'linear-gradient(135deg, rgba(79,110,247,0.15), rgba(124,92,252,0.1))',
              border: '1px solid rgba(79,110,247,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="1.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)', margin: 0 }}>
                Guia rapido do NexControl
              </h1>
              <p style={{ fontSize: 13, color: 'var(--t2)', margin: '4px 0 0' }}>
                Aprenda a usar a plataforma em poucos minutos
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
                Progresso do tutorial
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: allDone ? 'var(--profit)' : 'var(--brand-bright)' }}>
                {completedCount}/{STEPS.length}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  height: '100%', borderRadius: 99,
                  background: allDone
                    ? 'linear-gradient(90deg, #05d98c, #34d399)'
                    : 'linear-gradient(90deg, #4f6ef7, #7c5cfc)',
                  boxShadow: allDone
                    ? '0 0 12px rgba(5,217,140,0.3)'
                    : '0 0 12px rgba(79,110,247,0.3)',
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Video card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          style={{
            borderRadius: 20, overflow: 'hidden', position: 'relative',
            background: 'rgba(15, 24, 41, 0.6)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '1px solid rgba(79,110,247,0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(79,110,247,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
            marginBottom: 24,
          }}
        >
          {/* YouTube embed */}
          <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9' }}>
            <iframe
              src="https://www.youtube.com/embed/fBiktv6NaSw?rel=0&modestbranding=1"
              title="Video aula NexControl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                width: '100%', height: '100%', display: 'block',
                border: 'none',
              }}
            />
          </div>

          {/* Video info */}
          <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: '0 0 2px' }}>
                Video aula — NexControl
              </p>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
                Como usar o painel, criar metas, registrar remessas e fechar operacoes
              </p>
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 99,
              background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.2)',
              fontSize: 10, fontWeight: 700, color: 'var(--brand-bright)', letterSpacing: '0.06em',
            }}>
              EXCLUSIVO ADMIN
            </div>
          </div>
        </motion.div>

        {/* Checklist card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease }}
          style={{
            borderRadius: 20, overflow: 'hidden',
            background: 'rgba(15, 24, 41, 0.5)',
            backdropFilter: 'blur(30px) saturate(150%)',
            WebkitBackdropFilter: 'blur(30px) saturate(150%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: allDone ? 'rgba(5,217,140,0.12)' : 'rgba(79,110,247,0.1)',
                border: `1px solid ${allDone ? 'rgba(5,217,140,0.25)' : 'rgba(79,110,247,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {allDone ? (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--profit)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                )}
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                  Checklist de onboarding
                </h2>
                <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0' }}>
                  Marque cada etapa conforme voce completa
                </p>
              </div>
            </div>
            {completedCount > 0 && (
              <motion.button
                onClick={resetChecklist}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--t3)',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >
                Reiniciar
              </motion.button>
            )}
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {STEPS.map((step, i) => {
              const done = checked[step.id]
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.06, ease }}
                  whileHover={{
                    background: done ? 'rgba(5,217,140,0.06)' : 'rgba(79,110,247,0.06)',
                    x: 4,
                    transition: { duration: 0.15 },
                  }}
                  onClick={() => toggle(step.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                    background: done ? 'rgba(5,217,140,0.04)' : 'transparent',
                    border: `1px solid ${done ? 'rgba(5,217,140,0.12)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Checkbox */}
                  <motion.div
                    animate={{
                      background: done ? 'rgba(5,217,140,0.2)' : 'rgba(255,255,255,0.04)',
                      borderColor: done ? 'rgba(5,217,140,0.4)' : 'rgba(255,255,255,0.12)',
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <AnimatePresence>
                      {done && (
                        <motion.svg
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.2, ease }}
                          width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#05d98c" strokeWidth="3" strokeLinecap="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 600, margin: '0 0 2px',
                      color: done ? 'var(--profit)' : 'var(--t1)',
                      textDecoration: done ? 'line-through' : 'none',
                      opacity: done ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}>
                      {step.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>
                      {step.desc}
                    </p>
                  </div>

                  {/* Number */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
                    color: done ? 'var(--profit)' : 'var(--t4)',
                    flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {/* All done message */}
          <AnimatePresence>
            {allDone && (
              <motion.div
                initial={{ opacity: 0, y: 12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 12, height: 0 }}
                transition={{ duration: 0.4, ease }}
                style={{
                  marginTop: 20, padding: '18px 22px', borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(5,217,140,0.1), rgba(5,217,140,0.04))',
                  border: '1px solid rgba(5,217,140,0.2)',
                  boxShadow: '0 0 30px rgba(5,217,140,0.06)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(5,217,140,0.3)',
                      '0 0 0 8px rgba(5,217,140,0)',
                      '0 0 0 0 rgba(5,217,140,0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(5,217,140,0.15)', border: '1px solid rgba(5,217,140,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#05d98c" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </motion.div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--profit)', margin: '0 0 2px' }}>
                    Voce esta pronto para usar o NexControl!
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(5,217,140,0.6)', margin: 0 }}>
                    Todas as etapas foram concluidas. Bom trabalho!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Notifications guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
          style={{
            borderRadius: 20, overflow: 'hidden', marginTop: 24,
            background: 'rgba(15, 24, 41, 0.5)',
            backdropFilter: 'blur(30px) saturate(150%)',
            WebkitBackdropFilter: 'blur(30px) saturate(150%)',
            border: '1px solid rgba(245,166,35,0.12)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(245,166,35,0.2)',
                  '0 0 0 6px rgba(245,166,35,0)',
                  '0 0 0 0 rgba(245,166,35,0)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </motion.div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                Como ativar notificacoes no celular
              </h2>
              <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0' }}>
                Receba alertas em tempo real sobre sua operacao
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 18px' }}>
            Para receber notificacoes no celular, instale o NexControl como app na tela inicial do seu aparelho. Depois, ao abrir o app, permita as notificacoes quando o sistema solicitar.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { n: '01', text: 'Abra o NexControl no navegador do celular' },
              { n: '02', text: 'Toque no menu do navegador e selecione "Adicionar a tela inicial"' },
              { n: '03', text: 'Abra o app instalado na sua tela inicial' },
              { n: '04', text: 'Permita as notificacoes quando o aviso aparecer' },
              { n: '05', text: 'Se nao aparecer, ative manualmente nas configuracoes do navegador' },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.05, ease }}
                whileHover={{
                  background: 'rgba(245,166,35,0.05)',
                  x: 4,
                  transition: { duration: 0.15 },
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.03)',
                  transition: 'border-color 0.2s',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--warn)',
                }}>
                  {step.n}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>
                  {step.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Note */}
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(245,166,35,0.04)', border: '1px solid rgba(245,166,35,0.1)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span style={{ fontSize: 12, color: 'rgba(245,166,35,0.7)', lineHeight: 1.5 }}>
              As notificacoes ajudam voce a acompanhar atualizacoes importantes da operacao em tempo real.
            </span>
          </div>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease }}
          style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
        >
          {[
            { label: 'Painel admin', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1', color: 'var(--brand-bright)' },
            { label: 'Minha operacao', href: '/operator', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'var(--profit)' },
            { label: 'Assinatura', href: '/billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'var(--warn)' },
          ].map((link, i) => (
            <motion.a
              key={link.href}
              href={link.href}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 18px', borderRadius: 14,
                background: 'var(--surface)', border: '1px solid var(--b1)',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={link.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{link.label}</span>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </main>
  )
}

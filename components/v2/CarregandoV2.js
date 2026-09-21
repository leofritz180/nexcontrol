'use client'
// ─────────────────────────────────────────────────────────────────────────
// CARREGANDO V2 — tela de abertura do "NexControl 2.0".
//
// Existe porque a tela antiga (components/branding/GlobalLoadingScreen.js) é
// escura e, nas contas do visual V2, o app abre claro: sem isto o usuário via
// um piscar preto antes do bento. Quem NÃO está no V2 continua com a antiga.
//
// Ela é puramente visual: não busca dado nenhum, só ocupa o tempo em que o
// Supabase resolve a sessão. Por isso a barra para em ~90% e fica pulsando —
// fingir 100% seria mentir sobre um progresso que ninguém mede aqui.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { RED, RED2 } from '../ui/bento'

const TINTA = '#15151a'
const FUNDO = '#f0f0f3'

export default function CarregandoV2() {
  const [visivel, setVisivel] = useState(true)
  const [saindo, setSaindo] = useState(false)
  const semMovimento = useReducedMotion()

  // Mesmos tempos da tela antiga, pra não mudar a sensação de velocidade do app.
  useEffect(() => {
    const tSaida = setTimeout(() => setSaindo(true), 1200)
    const tFim = setTimeout(() => setVisivel(false), 1600)
    return () => { clearTimeout(tSaida); clearTimeout(tFim) }
  }, [])

  const marca = 76

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: saindo ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: semMovimento ? 0 : 0.4, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: FUNDO,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* A marca "respira" devagar: dá sinal de vida sem virar spinner. */}
          <motion.div
            animate={semMovimento ? undefined : { scale: [1, 1.04, 1] }}
            transition={semMovimento ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: marca, height: marca, flexShrink: 0 }}
          >
            <img
              src="/brand/nex-mark.png"
              alt="NexControl"
              width={marca}
              height={marca}
              style={{ width: marca, height: marca, objectFit: 'contain', display: 'block' }}
            />
          </motion.div>

          {/* Assinatura: NEXCONTROL + selo da versão */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 20 }}>
            <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, color: TINTA }}>
              <span>NEX</span><span>CONTROL</span>
            </span>
            <span style={{
              fontSize: 9.5, fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1,
              color: '#fff', padding: '4px 8px', borderRadius: 30,
              background: `linear-gradient(135deg, ${RED2}, ${RED})`,
              boxShadow: '0 4px 12px rgba(229,57,31,0.28)',
            }}>2.0</span>
          </div>

          {/* Barra de progresso "honesta": sobe até ~90% e pulsa, nunca fecha. */}
          {!semMovimento && (
            <div style={{
              width: 180, height: 3, borderRadius: 2, marginTop: 22,
              background: 'rgba(21,21,26,0.10)', overflow: 'hidden',
            }}>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                style={{ height: '100%' }}
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                  style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${RED2}, ${RED})` }}
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

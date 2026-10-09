'use client'
// ─────────────────────────────────────────────────────────────────────────
// O TOUR EM VÍDEO (1:15, narrado) — logo abaixo do herói.
//
// Antes do clique só existe a CAPA (imagem leve, 84 KB) com o botão de play
// pulsando; o vídeo (6,9 MB) só começa a baixar quando a pessoa clica —
// `preload="none"` e o <video> nem é montado antes. Assim a landing não fica
// mais pesada pra quem não assiste.
//
// O botão "Assista ao tour" do herói aponta pra #tour: além de rolar até
// aqui, ele já dá o play (o hash é ouvido abaixo), porque quem clicou ali já
// pediu o vídeo — não faz sentido pedir um segundo clique.
//
// Origem: marketing/tutorial-nex (Remotion, voz ElevenLabs). Pra trocar o
// vídeo, regravar public/landing/v2/tour.mp4 e tour-poster.jpg.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const LIME = '#C8F21D'

export default function Tour() {
  const [tocando, setTocando] = useState(false)
  const video = useRef(null)
  const parado = useReducedMotion()

  useEffect(() => {
    const ver = () => { if (window.location.hash === '#tour') setTocando(true) }
    ver()
    window.addEventListener('hashchange', ver)
    return () => window.removeEventListener('hashchange', ver)
  }, [])
  useEffect(() => {
    if (tocando && video.current) { const p = video.current.play(); if (p && p.catch) p.catch(() => {}) }
  }, [tocando])

  return (
    <section className="nv2-sec nv2-tour" id="tour" style={{ paddingTop: 40, scrollMarginTop: 72 }}>
      <style>{`
        .nv2-tour-moldura { position: relative; border-radius: 22px; overflow: hidden; aspect-ratio: 16 / 9; background: #080909;
          border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(200,242,29,0.06), 0 0 90px rgba(200,242,29,0.08); }
        .nv2-tour-capa { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; cursor: pointer; background: none; display: block; }
        .nv2-tour-capa img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s cubic-bezier(.22,1,.36,1), filter .4s; filter: brightness(.72); }
        .nv2-tour-capa:hover img { transform: scale(1.025); filter: brightness(.6); }
        .nv2-tour-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .nv2-tour-bola { position: relative; width: 104px; height: 104px; border-radius: 50%; background: ${LIME}; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 18px 60px rgba(200,242,29,0.45); transition: transform .25s cubic-bezier(.22,1,.36,1); }
        .nv2-tour-capa:hover .nv2-tour-bola { transform: scale(1.08); }
        .nv2-tour-anel { position: absolute; inset: 0; border-radius: 50%; border: 2px solid ${LIME}; animation: nv2-tour-pulso 2.2s cubic-bezier(.22,1,.36,1) infinite; }
        .nv2-tour-anel + .nv2-tour-anel { animation-delay: 1.1s; }
        @keyframes nv2-tour-pulso { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(1.9); opacity: 0 } }
        .nv2-tour-rotulo { font-size: 15px; font-weight: 700; color: #F4F4F1; background: rgba(8,9,9,0.72); border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 9px 16px; border-radius: 999px; white-space: nowrap; }
        .nv2-tour-rotulo b { color: ${LIME}; font-weight: 800; }
        .nv2-tour-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 26px; flex-wrap: wrap; }
        .nv2-tour-cab h2 { margin: 10px 0 0; }
        .nv2-tour-lista { display: flex; gap: 8px; flex-wrap: wrap; }
        .nv2-tour-lista span { font-size: 13px; font-weight: 600; color: rgba(244,244,241,0.72); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px; padding: 7px 12px; }
        .nv2-tour video { width: 100%; height: 100%; display: block; background: #080909; }
        @media (prefers-reduced-motion: reduce) { .nv2-tour-anel { animation: none; opacity: 0; } }
        @media (max-width: 640px) {
          .nv2-tour-moldura { border-radius: 16px; }
          .nv2-tour-bola { width: 76px; height: 76px; }
          .nv2-tour-rotulo { font-size: 13px; padding: 7px 12px; }
          .nv2-tour-play { gap: 12px; }
        }
      `}</style>
      <div className="nv2-larg">
        <motion.div className="nv2-tour-cab"
          initial={parado ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div>
            <span className="nv2-olho"><i />Tour em vídeo · 1 minuto</span>
            <h2 className="nv2-h2">Veja a operação inteira<br />funcionando na prática.</h2>
          </div>
          <div className="nv2-tour-lista" aria-hidden>
            {['Criar meta', 'Lançar remessa', 'Leitura automática', 'Equipe ao vivo', 'Lucro final', 'Notificações'].map(t => <span key={t}>{t}</span>)}
          </div>
        </motion.div>

        <motion.div className="nv2-tour-moldura"
          initial={parado ? false : { opacity: 0, y: 28, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          {tocando ? (
            <video ref={video} src="/landing/v2/tour.mp4" poster="/landing/v2/tour-poster.jpg" controls playsInline preload="none"
              aria-label="Tour narrado da Nex Control: criar meta, lançar remessa, leitura automática de depósito, equipe ao vivo, lucro final e notificações" />
          ) : (
            <button type="button" className="nv2-tour-capa" onClick={() => setTocando(true)} aria-label="Assistir ao tour da Nex Control, 1 minuto e 15 segundos, narrado">
              <img src="/landing/v2/tour-poster.jpg" alt="" loading="lazy" />
              <span className="nv2-tour-play">
                <span className="nv2-tour-bola">
                  <span className="nv2-tour-anel" /><span className="nv2-tour-anel" />
                  <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="#080909" /></svg>
                </span>
                <span className="nv2-tour-rotulo"><b>Assista ao tour</b> · 1:15 · com narração</span>
              </span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  )
}

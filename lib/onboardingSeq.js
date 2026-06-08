// Sequenciador de onboarding — fonte única da ordem dos overlays.
// Ordem desejada: 1) banner de voz  2) tutorial (tour)  3) passo a passo.
//
// O problema antigo era race condition: os tours checavam window.__nxBannerOpen,
// que só é setado num useEffect do banner — se o tour montasse antes, não
// esperava. Aqui a checagem é DETERMINÍSTICA (lê localStorage direto), então
// não depende de quem montou primeiro.

export const VOICE_BANNER_SEEN_KEY = 'nx_voicebanner_v3'
export const VOICE_BANNER_UNTIL = new Date('2026-06-15T23:59:59-03:00')

// O banner de voz ainda vai aparecer pra este usuário? (sem depender de effect)
// "Já vi" é por SESSÃO (sessionStorage) → reaparece a cada login/abertura do
// site dentro da janela de 7 dias, mas não re-abre a cada navegação.
export function voiceBannerPending() {
  if (typeof window === 'undefined') return false
  try {
    if (new Date() > VOICE_BANNER_UNTIL) return false
    return sessionStorage.getItem(VOICE_BANNER_SEEN_KEY) !== '1'
  } catch { return false }
}

// Executa `start` agora, ou espera o banner fechar se ele ainda vai aparecer.
// Retorna uma função de cleanup (remove o listener). Uso em useEffect:
//   const off = afterVoiceBanner(start); return () => { off(); clearTimeout(t) }
export function afterVoiceBanner(start) {
  if (typeof window === 'undefined') { return () => {} }
  if (voiceBannerPending() || window.__nxBannerOpen) {
    const onClosed = () => start()
    window.addEventListener('nx-banner-closed', onClosed, { once: true })
    return () => window.removeEventListener('nx-banner-closed', onClosed)
  }
  start()
  return () => {}
}

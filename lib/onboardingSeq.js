// Sequenciador de onboarding — fonte única da ordem dos overlays.
// Ordem desejada: 1) banner (1º overlay)  2) tutorial (tour)  3) passo a passo.
//
// O problema antigo era race condition: os tours checavam window.__nxBannerOpen,
// que só é setado num useEffect do banner — se o tour montasse antes, não
// esperava. Aqui a checagem é DETERMINÍSTICA (lê localStorage direto), então
// não depende de quem montou primeiro.

// Banner ativo: NOVO INSTAGRAM (@nexcontrol_ofc). Janela de 7 dias (até 18/06).
// Aparece 1x POR DIA (localStorage guarda a data) + sempre que o user loga
// (o login limpa a marca). Key nova => reaparece pra todos.
export const VOICE_BANNER_SEEN_KEY = 'nx_instabanner_v3'
export const VOICE_BANNER_UNTIL = new Date('2026-06-18T23:59:59-03:00')

// Data de hoje (BRT) no formato YYYY-MM-DD — usada como "já vi hoje".
export function bannerToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) }
  catch { return new Date().toISOString().slice(0, 10) }
}

// O banner de voz ainda vai aparecer pra este usuário? (sem depender de effect)
// "Já vi" é por SESSÃO (sessionStorage) → reaparece a cada login/abertura do
// site dentro da janela de 7 dias, mas não re-abre a cada navegação.
export function voiceBannerPending() {
  if (typeof window === 'undefined') return false
  try {
    if (new Date() > VOICE_BANNER_UNTIL) return false
    // 1x por dia: pendente se a data salva não é hoje (o login limpa a marca,
    // então também reaparece ao logar de novo).
    return localStorage.getItem(VOICE_BANNER_SEEN_KEY) !== bannerToday()
  } catch { return false }
}

// Banner ativo: LOJA BETTIFY integrada. Campanha de 10 dias (até 12/07).
// Mesma lógica: 1x por dia por dispositivo. É o 1º overlay quando pendente.
export const BETTIFY_BANNER_SEEN_KEY = 'nx_bettify_banner_seen'
export const BETTIFY_BANNER_UNTIL = new Date('2026-07-12T23:59:59-03:00')

export function bettifyBannerPending() {
  if (typeof window === 'undefined') return false
  try {
    if (new Date() > BETTIFY_BANNER_UNTIL) return false
    return localStorage.getItem(BETTIFY_BANNER_SEEN_KEY) !== bannerToday()
  } catch { return false }
}

// Algum banner (voz/insta OU bettify) ainda vai aparecer? (determinístico)
export function anyBannerPending() {
  if (typeof window === 'undefined') return false
  return voiceBannerPending() || bettifyBannerPending() || !!window.__nxBannerOpen
}

// Executa `start` agora, ou espera o banner fechar se ele ainda vai aparecer.
// Retorna uma função de cleanup (remove o listener). Uso em useEffect:
//   const off = afterVoiceBanner(start); return () => { off(); clearTimeout(t) }
export function afterVoiceBanner(start) {
  if (typeof window === 'undefined') { return () => {} }
  if (voiceBannerPending() || bettifyBannerPending() || window.__nxBannerOpen) {
    const onClosed = () => start()
    window.addEventListener('nx-banner-closed', onClosed, { once: true })
    return () => window.removeEventListener('nx-banner-closed', onClosed)
  }
  start()
  return () => {}
}

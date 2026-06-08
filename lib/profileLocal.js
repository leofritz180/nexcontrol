// Perfil estendido (foto, whatsapp, etc) — persistido local por enquanto.
// Quando o schema do Supabase ganhar as colunas (avatar_url, whatsapp, bio...),
// é só trocar load/save por chamadas ao banco mantendo a mesma interface.

export function profileKey(userId) { return 'nx_profile_' + (userId || 'anon') }

export function loadLocalProfile(userId) {
  try { return JSON.parse(localStorage.getItem(profileKey(userId)) || '{}') } catch { return {} }
}

export function saveLocalProfile(userId, data) {
  try {
    localStorage.setItem(profileKey(userId), JSON.stringify(data || {}))
    window.dispatchEvent(new CustomEvent('profile:updated', { detail: { userId } }))
  } catch {}
}

// Redimensiona uma imagem (File) pra um data URL quadrado ~256px (leve no storage)
export function fileToAvatarDataUrl(file, size = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) { reject(new Error('Arquivo invalido')); return }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = size; canvas.height = size
          const ctx = canvas.getContext('2d')
          // cover: recorta o centro mantendo proporção
          const scale = Math.max(size / img.width, size / img.height)
          const w = img.width * scale, h = img.height * scale
          ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch (e) { reject(e) }
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

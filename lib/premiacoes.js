// ─────────────────────────────────────────────────────────────────────────
// PREMIAÇÕES — quadros de faturamento que o usuário conquista ao atingir marcos.
// Cada quadro tem 2 artes pra download (15x20 e 20x30) que o usuário imprime na
// gráfica. Por enquanto liberado SÓ pra conta de teste (darkzinmg7).
// As ARTES ainda não existem: quando chegarem, colocar os arquivos em
//   public/premiacoes/<id>-15x20.<ext>  e  public/premiacoes/<id>-20x30.<ext>
// e marcar `available: true` no marco correspondente (ou setar ext).
// ─────────────────────────────────────────────────────────────────────────

export const PREMIACOES_EMAILS = new Set([
  'darkzinmg7@gmail.com', // fase de teste
])
export function premiacoesEnabled(email) {
  return !!email && PREMIACOES_EMAILS.has(String(email).toLowerCase())
}

// Marcos (quadros). value = faturamento necessário pra conquistar.
// preview   = imagem da PLACA exibida no card (public/premiacoes/<id>.png).
// available = já tem as ARTES pra download (15x20/20x30)? (false até subirmos).
// ext = extensão das artes de download ('png' | 'jpg') — usada só quando available.
export const PREMIACOES = [
  { id: '10k',   value: 10000,   label: 'R$ 10 mil',   tier: 'Bronze',    color: '#cd7f32', preview: true, available: true, ext: 'png' },
  { id: '20k',   value: 20000,   label: 'R$ 20 mil',   tier: 'Prata',     color: '#c4cdd6', preview: true, available: true, ext: 'png' },
  { id: '50k',   value: 50000,   label: 'R$ 50 mil',   tier: 'Ouro',      color: '#f5b83c', preview: true, available: true, ext: 'png' },
  { id: '100k',  value: 100000,  label: 'R$ 100 mil',  tier: 'Platina',   color: '#5ac8fa', preview: true, available: true, ext: 'png' },
  { id: '200k',  value: 200000,  label: 'R$ 200 mil',  tier: 'Diamante',  color: '#7aa5ff', preview: true, available: true, ext: 'png' },
  { id: '500k',  value: 500000,  label: 'R$ 500 mil',  tier: 'Master',    color: '#b978e6', preview: true, available: true, ext: 'png' },
  { id: '1m',    value: 1000000, label: 'R$ 1 Milhão', tier: 'Lendário',  color: '#ff5b56', preview: true, available: true, ext: 'png' },
]

// Imagem da placa exibida no card (preview).
export function previewPath(p) {
  return `/premiacoes/${p.id}.png`
}

// Caminho da arte pra download. size: '15x20' | '20x30'
export function artPath(p, size) {
  return `/premiacoes/${p.id}-${size}.${p.ext || 'png'}`
}

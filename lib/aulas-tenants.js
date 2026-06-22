// Tenants com a área de Aulas (vídeo aulas gravadas) habilitada.
// Cada tenant vê/gerencia SOMENTE os próprios cursos — os dados já são
// escopados por tenant_id, então não há vazamento entre contas.
// Para liberar a função para uma nova conta, basta adicionar o tenant_id aqui.
export const AULAS_TENANTS = [
  '9b83c5f4-19df-4438-ba75-8fb62ff59b84', // leofritz180@gmail.com (dono)
  '78da0085-9308-41b1-98b1-1e4c44063c51', // DS MENTORIA 2.0 (darkzinmg7@gmail.com)
]

export function aulasEnabled(tenantId) {
  return !!tenantId && AULAS_TENANTS.includes(tenantId)
}

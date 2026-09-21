// ─────────────────────────────────────────────────────────────────────────
// DIA OPERACIONAL
//
// A operação não vira à meia-noite: vira às 5h da manhã (BRT). Um fechamento
// pertence ao dia D se ocorreu em [D 05:00, D+1 05:00). Subtraindo 5h, a data
// de calendário resultante JÁ é o dia operacional.
//
// Ex.: fechada 24/06 00:00 BRT -> -5h -> 23/06 -> conta no dia 23, não no 24.
//
// Estava declarado só dentro de app/admin/page.js. O calendário de calor do
// AdminBento usava `toISOString().slice(0,10)`, que é UTC — dois calendários
// diferentes no mesmo painel, e depois das 21h BRT o rótulo do quadrado
// discordava do saldo que ele carregava. Agora os dois leem daqui.
// ─────────────────────────────────────────────────────────────────────────

// 'YYYY-MM-DD' do dia operacional a que uma data pertence.
export function opDayISO(d) {
  const x = new Date(new Date(d).getTime() - 5 * 3600 * 1000)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

// A régua dos últimos n dias operacionais, do mais antigo pro mais recente.
// O rótulo e a chave saem da MESMA data, então não têm como discordar.
export function ultimosDiasOp(n, agora = new Date()) {
  const base = new Date(agora.getTime() - 5 * 3600 * 1000)
  const saida = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    saida.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      rotulo: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    })
  }
  return saida
}

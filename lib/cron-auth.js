// ─────────────────────────────────────────────────────────────────────────
// AUTENTICAÇÃO DOS CRONS — um lugar só.
//
// POR QUE ISTO EXISTE (incidente de 22/09/2026):
// o vercel.json agendava os crons como `/api/cron/x?secret=${CRON_SECRET}`.
// A Vercel NÃO interpola `${...}` no path do cron — ela chama a URL
// literalmente, com os caracteres `${CRON_SECRET}` dentro. O endpoint
// comparava isso com o segredo real, não batia, e devolvia 401.
//
// Resultado: reconcile-payments, trial-notifications, comeback e
// proxy-usage NUNCA rodaram. O reconcile é justamente a rede que pega
// pagamento aprovado no Mercado Pago cujo webhook falhou — e foi assim que
// um cliente pagou 5 vagas de operador e ficou sem elas.
//
// O jeito certo: a Vercel manda o CRON_SECRET no cabeçalho
// `Authorization: Bearer <segredo>` automaticamente, sem precisar de nada
// no path. A query continua aceita para disparo manual.
// ─────────────────────────────────────────────────────────────────────────

export function cronAutorizado(req) {
  const esperado = process.env.CRON_SECRET
  // sem segredo configurado, ninguém entra — melhor o cron falhar calado
  // do que a rota ficar aberta na internet
  if (!esperado) return false

  // 1) o jeito da Vercel: cabeçalho automático
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${esperado}`) return true

  // 2) disparo manual: ?secret=...
  try {
    if (new URL(req.url).searchParams.get('secret') === esperado) return true
  } catch {}

  return false
}

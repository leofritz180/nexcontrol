// ═══════════════════════════════════════════════════════════════
// NexControl — Email HTML templates
// Estilo dark premium consistente com o app.
// ═══════════════════════════════════════════════════════════════

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcpa.com.br'
const LOGO_URL = `${APP_URL}/icons/nexcontrol-icon-clean.png?v=7`

/**
 * Template base — header com logo, body, CTA, footer
 */
function baseTemplate({ preheader, bodyTitle, bodyText, ctaText, ctaUrl, signature }) {
  const safePre = (preheader || '').replace(/[<>]/g, '')
  const safeTitle = (bodyTitle || '').replace(/[<>]/g, '')
  const safeText = (bodyText || '').replace(/[<>]/g, '')
  const safeCta = (ctaText || 'Voltar ao painel').replace(/[<>]/g, '')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>NexControl</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#F5F5F5;">
<!-- preheader (hidden) -->
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;">${safePre}</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:linear-gradient(180deg,#0a0a0a,#050505);border:1px solid rgba(229,57,53,0.25);border-radius:14px;overflow:hidden;">

        <!-- Header com logo -->
        <tr>
          <td align="center" style="padding:28px 24px 12px;">
            <img src="${LOGO_URL}" alt="NexControl" width="56" height="56" style="display:block;border-radius:14px;"/>
            <p style="margin:14px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#71717A;font-weight:800;font-family:'JetBrains Mono',monospace;">
              NexControl
            </p>
          </td>
        </tr>

        <!-- Title serif -->
        <tr>
          <td align="center" style="padding:18px 32px 8px;">
            <h1 style="margin:0;font-family:Georgia,'Instrument Serif',serif;font-size:26px;font-weight:400;letter-spacing:-0.02em;color:#FFFFFF;line-height:1.25;">
              ${safeTitle}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td align="center" style="padding:8px 32px 24px;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#A1A1AA;">
              ${safeText}
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" style="padding:8px 32px 28px;">
            <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;letter-spacing:0.06em;color:#FFFFFF;background:linear-gradient(135deg,#e53935,#c62828);border-radius:10px;text-decoration:none;box-shadow:0 6px 22px rgba(229,57,53,0.45);">
              ${safeCta}
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 32px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent);"></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:20px 32px 28px;">
            <p style="margin:0 0 4px;font-size:11px;color:#52525B;line-height:1.5;">
              ${signature || 'NexControl · Plataforma de operacao CPA'}
            </p>
            <p style="margin:0;font-size:10px;color:#52525B;">
              <a href="${APP_URL}" style="color:#71717A;text-decoration:none;">${APP_URL.replace('https://','')}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

/**
 * Renderiza email a partir de um segmento + variaveis do user.
 */
export function renderWinbackEmail({ segment, vars = {} }) {
  const subject = (segment.email.subject || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : `{${k}}`)
  const html = baseTemplate({
    preheader: segment.email.preheader,
    bodyTitle: segment.email.bodyTitle,
    bodyText: segment.email.bodyText,
    ctaText: segment.email.ctaText,
    ctaUrl: vars.url || `${APP_URL}/admin`,
    signature: 'NexControl · Plataforma de operacao CPA',
  })
  return { subject, html }
}

/**
 * Sender via Resend API. Se RESEND_API_KEY nao estiver setada,
 * retorna { ok: false, skipped: true } sem erro.
 */
export async function sendEmailViaResend({ to, subject, html, from }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log('[email] RESEND_API_KEY nao configurada — skip')
    return { ok: false, skipped: true, reason: 'no_resend_key' }
  }
  const fromAddr = from || process.env.RESEND_FROM || 'NexControl <noreply@nexcpa.com.br>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddr, to, subject, html }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[email] resend error', res.status, data)
      return { ok: false, error: data }
    }
    return { ok: true, id: data.id }
  } catch (e) {
    console.error('[email] resend exception', e?.message)
    return { ok: false, error: e?.message }
  }
}

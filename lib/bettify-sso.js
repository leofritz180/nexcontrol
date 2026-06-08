// SSO Bettify Proxy — gera um JWT HS256 assinado com a secret compartilhada.
// SERVER-ONLY (a secret nunca pode ir pro client). Token válido por 5 min.
import crypto from 'node:crypto'

const SECRET = process.env.BETTIFY_SSO_SECRET
const BETTIFY_URL = process.env.BETTIFY_URL || 'https://bettifyproxy.com'

function b64url(buf) {
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function buildBettifyURL({ email, name }) {
  if (!SECRET) throw new Error('BETTIFY_SSO_SECRET nao configurado')
  const now = Math.floor(Date.now() / 1000)
  const body = {
    sub: String(email).toLowerCase().trim(),
    name,
    iss: 'nexcontrol',
    iat: now,
    exp: now + 5 * 60,
    source: 'nexcontrol',
  }
  const header = { alg: 'HS256', typ: 'JWT' }
  const eh = b64url(Buffer.from(JSON.stringify(header)))
  const ep = b64url(Buffer.from(JSON.stringify(body)))
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(`${eh}.${ep}`).digest())
  return `${BETTIFY_URL}/sso?token=${encodeURIComponent(`${eh}.${ep}.${sig}`)}`
}

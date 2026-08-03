// ─────────────────────────────────────────────────────────────────────────
// Content script — roda em CADA aba (inclusive iframes). Detecta a tela de
// confirmacao do QR PIX, extrai o VALOR + o NUMERO DO PEDIDO e manda pro
// background, que envia pro NexControl. Dedup local por numero do pedido.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  const sent = new Set() // order_ids ja enviados nesta aba (evita reenvio a cada scan)

  function parseValor(raw) {
    // "1.055,00" -> 1055.00 | "40,00" -> 40 | "40" -> 40
    if (!raw) return null
    let s = String(raw).replace(/\./g, '').replace(',', '.')
    const n = Number(s)
    return isFinite(n) && n > 0 ? n : null
  }

  function scan() {
    let text = ''
    try { text = document.body ? document.body.innerText : '' } catch { return }
    if (!text) return

    // Assinatura da tela de QR PIX (evita falso positivo na tela de digitar valor):
    // precisa ter "Número do Pedido" (unico) e algo de QR/PIX.
    if (!/N[uú]mero do Pedido/i.test(text)) return
    if (!/(c[oó]digo QR|copie e cole|PIX)/i.test(text)) return

    // Numero do pedido (chave anti-duplicacao) — o numerico grande
    const mOrder = text.match(/N[uú]mero do Pedido[^0-9]*([0-9]{6,})/i)
    const orderId = mOrder && mOrder[1]
    if (!orderId) return
    if (sent.has(orderId)) return

    // Valor: pega o "R$ XX,XX" (na tela de QR normalmente so tem o do deposito).
    // Prioriza valor com centavos; se nao houver, pega inteiro.
    let valor = null
    const withCents = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/)
    if (withCents) valor = parseValor(withCents[1])
    if (valor == null) {
      const anyVal = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*)/)
      if (anyVal) valor = parseValor(anyVal[1])
    }
    if (valor == null) return

    sent.add(orderId)
    try {
      chrome.runtime.sendMessage({
        type: 'deposit',
        order_id: orderId,
        valor,
        casa: location.hostname.replace(/^www\./, ''),
      }, (res) => { if (res && res.ok) toast(valor) })
    } catch {}
  }

  // Toast minimo (nao atrapalha o bot) — confirma a captura
  function toast(valor) {
    try {
      const d = document.createElement('div')
      d.textContent = '✓ R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      d.style.cssText = 'position:fixed;top:6px;right:6px;z-index:2147483647;background:#052e1a;color:#d1fae5;font:700 11px system-ui;padding:4px 8px;border-radius:6px;border:1px solid #10b981;box-shadow:0 4px 12px rgba(0,0,0,.4);pointer-events:none;opacity:.96'
      document.documentElement.appendChild(d)
      setTimeout(() => { try { d.remove() } catch {} }, 1600)
    } catch {}
  }

  // Dispara scan: no load, em mudancas do DOM (SPA) e a cada 2.5s (garantia)
  let deb = null
  const obs = new MutationObserver(() => { clearTimeout(deb); deb = setTimeout(scan, 400) })
  try { obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true }) } catch {}
  setInterval(scan, 2500)
  scan()
})()

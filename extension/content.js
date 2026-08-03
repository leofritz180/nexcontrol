// ─────────────────────────────────────────────────────────────────────────
// Content script — roda em CADA aba (inclusive iframes). Detecta DEPÓSITO (QR
// PIX) e SAQUE (retirada) e manda pro background, SEM confundir os dois e SEM
// contar duas vezes (chave = numero do pedido / orderNo da URL).
// ─────────────────────────────────────────────────────────────────────────
(function () {
  const sent = new Set() // ids ja enviados nesta aba

  let chip, hideT
  function setChip(txt, ok) {
    const blocking = /chave|Iniciar/i.test(txt)
    if (!ok && !blocking) { if (chip) chip.style.display = 'none'; return }
    try {
      if (!chip) {
        chip = document.createElement('div')
        chip.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:2147483647;font:700 10px system-ui;padding:3px 7px;border-radius:6px;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.4);white-space:nowrap;max-width:96vw;overflow:hidden'
        ;(document.documentElement || document.body).appendChild(chip)
      }
      chip.style.display = 'block'
      chip.textContent = ok ? txt : ('NexControl: ' + txt)
      chip.style.background = ok ? '#052e1a' : '#3a1a00'
      chip.style.color = '#fff'
      chip.style.border = '1px solid ' + (ok ? '#10b981' : '#f59e0b')
      clearTimeout(hideT)
      if (ok) hideT = setTimeout(() => { if (chip) chip.style.display = 'none' }, 1800)
    } catch {}
  }

  function parseValor(raw) {
    if (!raw) return null
    let s = String(raw).trim()
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.') // 1.055,00 -> 1055.00
    const n = Number(s)
    return isFinite(n) && n > 0 ? n : null
  }

  function deepText(root, acc) {
    try { for (const el of (root.querySelectorAll ? root.querySelectorAll('*') : [])) if (el.shadowRoot) deepText(el.shadowRoot, acc) } catch {}
    try { acc.push(root.textContent || '') } catch {}
    return acc
  }
  function getText() {
    let t = ''
    try { t = document.body ? document.body.innerText : '' } catch {}
    try { t += '\n' + deepText(document, []).join('\n') } catch {}
    return t
  }

  function firstValor(text, anchors) {
    for (const re of anchors) { const m = text.match(re); if (m) { const v = parseValor(m[1]); if (v != null) return v } }
    return null
  }

  function send(tipo, orderId, valor) {
    if (sent.has(orderId)) { setChip('✓ ' + (tipo === 'saque' ? 'Saque' : 'Depósito') + ' R$' + valor, true); return }
    sent.add(orderId)
    setChip('enviando ' + (tipo === 'saque' ? 'saque' : 'depósito') + '...', false)
    try {
      chrome.runtime.sendMessage({ type: 'deposit', tipo, order_id: orderId, valor, casa: location.hostname.replace(/^www\./, '') }, (res) => {
        if (!res) { setChip('sem resposta (extensao?)', false); return }
        if (res.ok) setChip('✓ ' + (tipo === 'saque' ? 'Saque' : 'Depósito') + ' R$' + valor + ' · ' + (res.count || '?'), true)
        else if (res.reason === 'no_active_session') { sent.delete(orderId); setChip('clique "Iniciar" no NexControl', false) }
        else if (res.error === 'no_key') setChip('sem chave (config.js)', false)
        else { sent.delete(orderId); setChip('erro: ' + (res.error || '?'), false) }
      })
    } catch { setChip('erro envio', false) }
  }

  function scan() {
    const text = getText()
    if (!text) return
    const url = location.href.toLowerCase()

    // ── SAQUE tem prioridade (a tela de detalhe do saque tambem tem "Numero do
    //    Pedido"+PIX; sem isso, era contado como deposito) ──
    const isSaque = /withdraw|sacar|\bsaque|retirad/i.test(url) ||
      /(solicitar saque|detalhes de retirada|registro de saques|valor do saque|sacar para|quantia da retirada|tipo de transa\S+\s*:?\s*saque)/i.test(text)

    if (isSaque) {
      const mo = url.match(/orderno=([a-z0-9]+)/i) || text.match(/N[uú]mero do Pedido[^0-9]*([0-9]{6,})/i)
      const orderId = mo && (mo[1])
      const valor = firstValor(text, [
        /Valor do Saque[^0-9\-]*R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
        /Quantia da retirada[^0-9\-]*R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
        /(\d{1,3}(?:\.\d{3})*,\d{2})\s*BRL/i,
        /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/,
        /R\$\s?(\d{1,3}(?:\.\d{3})*)/,
      ])
      if (!orderId) { setChip('saque sem nº do pedido (abra o detalhe)', false); return }
      if (valor == null) { setChip('saque sem valor', false); return }
      send('saque', 'sq_' + orderId, valor) // prefixo evita colisao com id de deposito
      return
    }

    // ── DEPÓSITO (QR PIX) ──
    const isDeposit = /(c[oó]digo QR|copie e cole)/i.test(text) || /\/deposit/i.test(url) ||
      (/N[uú]mero do Pedido/i.test(text) && /pix/i.test(text))
    if (!isDeposit) { setChip('monitorando', false); return }

    let orderId = null
    let m = text.match(/N[uú]mero do Pedido[^0-9A-Za-z]*([0-9]{6,})/i)
    if (m) orderId = m[1]
    if (!orderId) { m = url.match(/orderno=([a-z0-9]+)/i); if (m) orderId = m[1] }
    if (!orderId) { setChip('depósito sem nº do pedido', false); return }

    const valor = firstValor(text, [
      /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/,
      /(\d{1,3}(?:\.\d{3})*,\d{2})\s*BRL/i,
      /R\$\s?(\d{1,3}(?:\.\d{3})*)/,
    ])
    if (valor == null) { setChip('depósito sem valor', false); return }
    send('deposito', 'dp_' + orderId, valor)
  }

  let deb = null
  try {
    const obs = new MutationObserver(() => { clearTimeout(deb); deb = setTimeout(scan, 400) })
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  } catch {}
  setInterval(scan, 2500)
  scan()
})()

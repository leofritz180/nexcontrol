// ─────────────────────────────────────────────────────────────────────────
// Content script — roda em CADA aba (inclusive iframes). Detecta a tela de
// QR PIX, extrai VALOR + NUMERO DO PEDIDO e manda pro background.
// Tem um SELO de diagnostico no canto pra mostrar o que esta acontecendo.
// ─────────────────────────────────────────────────────────────────────────
(function () {
  const sent = new Set()

  // ── selo discreto: mostra SO sucesso (some sozinho) e erros que BLOQUEIAM
  //    (sem chave / precisa iniciar). Estados normais ficam silenciosos. ──
  let chip, hideT
  function setChip(txt, color) {
    const success = color === '#052e1a'
    const blocking = /chave|Iniciar/i.test(txt)
    if (!success && !blocking) { if (chip) chip.style.display = 'none'; return }
    try {
      if (!chip) {
        chip = document.createElement('div')
        chip.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:2147483647;font:700 10px system-ui;padding:3px 7px;border-radius:6px;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.4);white-space:nowrap;max-width:96vw;overflow:hidden'
        ;(document.documentElement || document.body).appendChild(chip)
      }
      chip.style.display = 'block'
      chip.textContent = success ? txt : ('NexControl: ' + txt)
      chip.style.background = success ? '#052e1a' : '#3a1a00'
      chip.style.color = '#fff'
      chip.style.border = '1px solid ' + (success ? '#10b981' : '#f59e0b')
      clearTimeout(hideT)
      if (success) hideT = setTimeout(() => { if (chip) chip.style.display = 'none' }, 1600)
    } catch {}
  }

  function parseValor(raw) {
    if (!raw) return null
    let s = String(raw).replace(/\./g, '').replace(',', '.')
    const n = Number(s)
    return isFinite(n) && n > 0 ? n : null
  }

  // Coleta texto da pagina INCLUINDO shadow DOM (muitos sites usam web components)
  function deepText(root, acc) {
    try {
      const walker = root.querySelectorAll ? root.querySelectorAll('*') : []
      for (const el of walker) {
        if (el.shadowRoot) deepText(el.shadowRoot, acc)
      }
    } catch {}
    try { acc.push(root.textContent || '') } catch {}
    return acc
  }
  function getText() {
    let t = ''
    try { t = document.body ? document.body.innerText : '' } catch {}
    // reforco com shadow DOM + textContent
    try { t += '\n' + deepText(document, []).join('\n') } catch {}
    return t
  }

  function scan() {
    const text = getText()
    if (!text) return

    const looksPix = /(N[uú]mero do Pedido|c[oó]digo QR|copie e cole|pix)/i.test(text)
    if (!looksPix) { setChip('monitorando', '#111'); return }

    // numero do pedido (chave anti-dup): tenta varios rotulos
    let orderId = null
    let m = text.match(/N[uú]mero do Pedido[^0-9A-Za-z]*([0-9]{6,})/i)
    if (m) orderId = m[1]
    if (!orderId) { m = text.match(/pedido do comerciante[^0-9A-Za-z]*([A-Za-z0-9]{10,})/i); if (m) orderId = m[1] }
    if (!orderId) { m = text.match(/(?:Pedido|Order)[^0-9]{0,4}([0-9]{10,})/i); if (m) orderId = m[1] }

    // valor
    let valor = null
    let mv = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/)
    if (mv) valor = parseValor(mv[1])
    if (valor == null) { mv = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*)/); if (mv) valor = parseValor(mv[1]) }

    if (!orderId && valor == null) { setChip('tela PIX (sem pedido/valor)', '#3a1a00'); return }
    if (!orderId) { setChip('achei R$' + valor + ' mas sem nº pedido', '#3a1a00'); return }
    if (valor == null) { setChip('achei pedido mas sem valor', '#3a1a00'); return }
    if (sent.has(orderId)) { setChip('✓ R$' + valor + ' (enviado)', '#052e1a'); return }

    sent.add(orderId)
    setChip('enviando R$' + valor + '...', '#111')
    try {
      chrome.runtime.sendMessage({ type: 'deposit', order_id: orderId, valor, casa: location.hostname.replace(/^www\./, '') }, (res) => {
        if (!res) { setChip('sem resposta (extensao?)', '#3a1a00'); return }
        if (res.ok) setChip('✓ R$' + valor + ' · ' + (res.count || '?') + ' no total', '#052e1a')
        else if (res.reason === 'no_active_session') { sent.delete(orderId); setChip('clique "Iniciar" no NexControl', '#3a1a00') }
        else if (res.error === 'no_key') setChip('sem chave (config.js)', '#3a1a00')
        else { sent.delete(orderId); setChip('erro: ' + (res.error || '?'), '#3a1a00') }
      })
    } catch (e) { setChip('erro envio', '#3a1a00') }
  }

  let deb = null
  try {
    const obs = new MutationObserver(() => { clearTimeout(deb); deb = setTimeout(scan, 400) })
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  } catch {}
  setInterval(scan, 2500)
  setChip('iniciando', '#111')
  scan()
})()

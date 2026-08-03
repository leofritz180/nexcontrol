const send = (msg) => new Promise(r => chrome.runtime.sendMessage(msg, r))

async function init() {
  const s = await send({ type: 'status' })
  const hasKey = !!(s && s.hasKey)
  document.getElementById('ok').style.display = hasKey ? 'block' : 'none'
  document.getElementById('nokey').style.display = hasKey ? 'none' : 'block'
}
init()

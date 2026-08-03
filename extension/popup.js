const $ = (id) => document.getElementById(id)
const send = (msg) => new Promise(r => chrome.runtime.sendMessage(msg, r))

function render(email) {
  $('logged').style.display = email ? 'block' : 'none'
  $('form').style.display = email ? 'none' : 'block'
  if (email) $('who').textContent = email
}

async function init() {
  const s = await send({ type: 'status' })
  render(s?.email || null)
}

$('login').addEventListener('click', async () => {
  $('err').textContent = ''
  const email = $('email').value.trim()
  const password = $('pass').value
  if (!email || !password) { $('err').textContent = 'Preencha email e senha.'; return }
  $('login').textContent = 'Conectando...'
  const r = await send({ type: 'login', email, password })
  $('login').textContent = 'Conectar'
  if (!r?.ok) { $('err').textContent = r?.error || 'Não deu pra conectar.'; return }
  render(r.email)
})

$('logout').addEventListener('click', async () => { await send({ type: 'logout' }); render(null) })

init()

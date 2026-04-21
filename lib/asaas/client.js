// Asaas API Client — server-side only

const BASE_URL = (process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3').trim()
const API_KEY = (process.env.ASAAS_API_KEY || '').trim()

async function asaasRequest(path, options = {}) {
  if (!API_KEY) throw new Error('ASAAS_API_KEY nao configurada no servidor')

  const url = `${BASE_URL}${path}`
  console.log('[Asaas]', options.method || 'GET', url, 'key:', API_KEY.slice(0, 8) + '...')

  const res = await fetch(url, {
    ...options,
    headers: {
      'access_token': API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Parse defensivo — Asaas pode retornar body vazio em alguns erros (401/403/204)
  const text = await res.text()
  let data = {}
  if (text) {
    try { data = JSON.parse(text) } catch { data = { _raw: text } }
  }

  if (!res.ok) {
    const msg = data.errors?.[0]?.description
      || data.message
      || data._raw
      || `Asaas HTTP ${res.status}`
    console.error('[Asaas] Error:', res.status, msg)
    throw new Error(msg)
  }
  return data
}

// Create or find customer (always update CPF if provided)
export async function getOrCreateCustomer(supabase, userId, { name, email, cpfCnpj }) {
  const { data: profile } = await supabase.from('profiles').select('asaas_customer_id').eq('id', userId).single()

  // If already has customer, update CPF and return
  if (profile?.asaas_customer_id) {
    if (cpfCnpj) {
      await asaasRequest(`/customers/${profile.asaas_customer_id}`, {
        method: 'PUT',
        body: JSON.stringify({ cpfCnpj }),
      }).catch(() => {}) // ignore update errors
    }
    return profile.asaas_customer_id
  }

  // Search in Asaas by email
  const search = await asaasRequest(`/customers?email=${encodeURIComponent(email)}`)
  if (search.data?.length > 0) {
    const customerId = search.data[0].id
    if (cpfCnpj) {
      await asaasRequest(`/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify({ cpfCnpj }),
      }).catch(() => {})
    }
    await supabase.from('profiles').update({ asaas_customer_id: customerId }).eq('id', userId)
    return customerId
  }

  // Create new customer with CPF
  const customer = await asaasRequest('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email, cpfCnpj }),
  })

  await supabase.from('profiles').update({ asaas_customer_id: customer.id }).eq('id', userId)
  return customer.id
}

// Create PIX payment
export async function createPixPayment(customerId, amount, description) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const payment = await asaasRequest('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: amount,
      dueDate: tomorrow.toISOString().slice(0, 10),
      description: description || 'NexControl - Assinatura',
    }),
  })

  return payment
}

// Get PIX QR Code
export async function getPixQrCode(paymentId) {
  const pix = await asaasRequest(`/payments/${paymentId}/pixQrCode`)
  return pix
}

// Get payment status
export async function getPaymentStatus(paymentId) {
  const payment = await asaasRequest(`/payments/${paymentId}`)
  return payment
}

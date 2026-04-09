// Asaas API Client — server-side only

const BASE_URL = process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3'
const API_KEY = process.env.ASAAS_API_KEY

async function asaasRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'access_token': API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.description || data.message || 'Asaas API error')
  return data
}

// Create or find customer
export async function getOrCreateCustomer(supabase, userId, { name, email, cpfCnpj }) {
  // Check if already has asaas_customer_id
  const { data: profile } = await supabase.from('profiles').select('asaas_customer_id').eq('id', userId).single()
  if (profile?.asaas_customer_id) return profile.asaas_customer_id

  // Search in Asaas by email
  const search = await asaasRequest(`/customers?email=${encodeURIComponent(email)}`)
  if (search.data?.length > 0) {
    const customerId = search.data[0].id
    await supabase.from('profiles').update({ asaas_customer_id: customerId }).eq('id', userId)
    return customerId
  }

  // Create new customer
  const customer = await asaasRequest('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email, cpfCnpj: cpfCnpj || undefined }),
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

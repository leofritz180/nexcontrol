'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Asaas foi descontinuado — todo fluxo de assinatura agora passa por /billing-mp (Mercado Pago).
// Mantemos este redirect pra preservar links antigos (sidebar, push, e-mails, bookmarks).
export default function BillingRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/billing-mp') }, [router])
  return null
}

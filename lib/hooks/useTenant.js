'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase/client'

export function useTenant({ requireAdmin = false } = {}) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenantId, setTenantId] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: s } = await supabase.auth.getSession()
    const u = s?.session?.user
    if (!u) { router.push('/login'); return }
    setUser(u)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
    if (!p) { router.push('/login'); return }

    if (requireAdmin && p.role !== 'admin') {
      router.push('/operator')
      return
    }

    setProfile(p)
    setTenantId(p.tenant_id)
    setReady(true)
  }

  return { user, profile, tenantId, ready, isAdmin: profile?.role === 'admin' }
}

'use client'
import { useEffect, useState } from 'react'
import { isPushSupported, getPermissionState, registerSW, subscribePush, savePushSubscription } from '../lib/pushClient'

export default function PushManager({ userId, tenantId }) {
  const [state, setState] = useState('loading') // loading | unsupported | default | prompt | granted | denied | error
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) { setState('unsupported'); return }
    setState(getPermissionState())
  }, [])

  async function enable() {
    if (saving) return
    setSaving(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState(permission); setSaving(false); return }

      const reg = await registerSW()
      if (!reg) { setState('error'); setSaving(false); return }

      const sub = await subscribePush(reg)
      const saved = await savePushSubscription(sub, userId, tenantId)
      if (saved) {
        setState('granted')
      } else {
        setState('error')
      }
    } catch (err) {
      console.error('Push setup failed:', err)
      setState('error')
    }
    setSaving(false)
  }

  // Don't render anything if already granted, unsupported, or no user
  if (!userId || !tenantId) return null
  if (state === 'granted' || state === 'unsupported' || state === 'loading') return null

  if (state === 'denied') return (
    <div style={{
      position:'fixed', bottom:20, left:20, right:20, zIndex:9000, maxWidth:400,
      padding:'14px 18px', borderRadius:14,
      background:'var(--surface)', border:'1px solid var(--b1)',
      boxShadow:'0 12px 40px rgba(0,0,0,0.4)',
      display:'flex', alignItems:'center', gap:12,
      animation:'fade-up 0.3s cubic-bezier(0.33,1,0.68,1) both',
      fontSize:12, color:'var(--t3)',
    }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round"><path d="M18.36 6.64A9 9 0 0 1 20.77 15"/><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
      Notificacoes bloqueadas. Ative nas configuracoes do navegador.
    </div>
  )

  return (
    <div style={{
      position:'fixed', bottom:20, left:20, right:20, zIndex:9000, maxWidth:420,
      padding:'16px 20px', borderRadius:16,
      background:'linear-gradient(135deg, rgba(79,110,247,0.12), var(--surface))',
      border:'1px solid rgba(79,110,247,0.2)',
      boxShadow:'0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(79,110,247,0.08)',
      display:'flex', alignItems:'center', gap:14,
      animation:'fade-up 0.4s cubic-bezier(0.33,1,0.68,1) both',
    }}>
      <div style={{width:38,height:38,borderRadius:11,background:'var(--brand-dim)',border:'1px solid var(--brand-border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--brand-bright)" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      </div>
      <div style={{flex:1}}>
        <p style={{fontSize:13,fontWeight:700,color:'var(--t1)',margin:'0 0 2px'}}>Ativar notificacoes</p>
        <p style={{fontSize:11,color:'var(--t3)',margin:0}}>Receba alertas de remessas e metas em tempo real</p>
      </div>
      <button onClick={enable} disabled={saving} className="btn btn-brand btn-sm" style={{flexShrink:0}}>
        {saving ? 'Ativando...' : 'Ativar'}
      </button>
    </div>
  )
}

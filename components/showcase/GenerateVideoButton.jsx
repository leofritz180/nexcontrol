'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/**
 * GenerateVideoButton
 *
 * Sends render request to API → if server render available, polls status.
 * If server returns 'use_client_render', falls back to Canvas renderer.
 */
export function GenerateVideoButton({ amount, completedGoals, goalPct, mode, style }) {
  const [status, setStatus] = useState('idle') // idle | preparing | rendering | done | error
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const generate = useCallback(async () => {
    if (status === 'rendering' || status === 'preparing') return
    setStatus('preparing'); setProgress(0); setErrorMsg('')

    try {
      // Step 1: Request render from API
      const res = await fetch('/api/render-profit-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, completedGoals, goalPct, mode }),
      })
      const data = await res.json()

      if (data.status === 'done' && data.url) {
        // Server render completed (Remotion Vercel)
        setDownloadUrl(data.url)
        setStatus('done')
        return
      }

      if (data.status === 'rendering' && data.renderId) {
        // Server render in progress — poll
        setStatus('rendering')
        await pollStatus(data.renderId)
        return
      }

      // Fallback: client-side render
      setStatus('rendering')
      const { renderVideo } = await import('../../lib/video')
      const blob = await renderVideo({
        value: amount,
        metasFechadas: completedGoals || 0,
        goalPct: goalPct || 0,
        onProgress: setProgress,
      })

      const url = URL.createObjectURL(blob)
      const d = new Date()
      const link = document.createElement('a')
      link.download = `nexcontrol-resultado-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.webm`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      setStatus('done')

    } catch (err) {
      console.error('Video generation failed:', err)
      setErrorMsg(err.message || 'Erro ao gerar video')
      setStatus('error')
    }
  }, [status, amount, completedGoals, goalPct, mode])

  async function pollStatus(renderId) {
    for (let i = 0; i < 120; i++) { // max 2 min polling
      await new Promise(r => setTimeout(r, 2000))
      try {
        const res = await fetch('/api/render-profit-video/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ renderId }),
        })
        const data = await res.json()
        if (data.progress) setProgress(data.progress)
        if (data.status === 'done' && data.url) {
          setDownloadUrl(data.url)
          setStatus('done')
          return
        }
        if (data.status === 'error') {
          setErrorMsg(data.error || 'Render failed')
          setStatus('error')
          return
        }
      } catch { /* continue polling */ }
    }
    setErrorMsg('Timeout — render demorou demais')
    setStatus('error')
  }

  const labels = {
    idle: 'Gerar video',
    preparing: 'Preparando...',
    rendering: `Gerando ${progress}%`,
    done: 'Video pronto!',
    error: 'Tentar novamente',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...style }}>
      <motion.button
        onClick={status === 'done' && downloadUrl ? () => window.open(downloadUrl) : generate}
        disabled={status === 'preparing' || status === 'rendering'}
        whileTap={{ scale: 0.96 }}
        style={{
          fontSize: 12, fontWeight: 700, padding: '8px 20px', borderRadius: 8,
          cursor: (status === 'preparing' || status === 'rendering') ? 'wait' : 'pointer',
          border: '1px solid rgba(229,57,53,0.3)',
          background: status === 'done' ? 'rgba(34,197,94,0.15)' : status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(229,57,53,0.15)',
          color: status === 'done' ? '#22C55E' : status === 'error' ? '#EF4444' : '#ff6b6b',
          opacity: (status === 'preparing' || status === 'rendering') ? 0.7 : 1,
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        {(status === 'preparing' || status === 'rendering') && (
          <motion.div
            style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,107,107,0.3)', borderTopColor: '#ff6b6b' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {labels[status]}
      </motion.button>

      {errorMsg && (
        <p style={{ fontSize: 10, color: 'var(--loss)', margin: 0 }}>{errorMsg}</p>
      )}
    </div>
  )
}

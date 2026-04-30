'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/**
 * GenerateVideoButton
 *
 * 1. Renders video client-side (Canvas + MediaRecorder)
 * 2. Uploads to Vercel Blob Storage
 * 3. Returns shareable public URL
 */
export function GenerateVideoButton({ amount, completedGoals, goalPct, mode, stats, onClose, style }) {
  const [status, setStatus] = useState('idle') // idle | rendering | uploading | done | error
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const generate = useCallback(async () => {
    if (status === 'rendering' || status === 'uploading') return
    setStatus('rendering'); setProgress(0); setErrorMsg(''); setVideoUrl(null)

    try {
      // Step 1: Render video client-side
      const { renderVideo } = await import('../../lib/video')
      const blob = await renderVideo({
        value: amount,
        metasFechadas: completedGoals || 0,
        goalPct: goalPct || 0,
        stats: stats || {},
        onProgress: setProgress,
      })

      // Step 2: Upload to Vercel Blob
      setStatus('uploading'); setProgress(100)
      const formData = new FormData()
      formData.append('video', blob, 'video.webm')

      const res = await fetch('/api/render-profit-video/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.url) {
        setVideoUrl(data.url)
        setStatus('done')
      } else {
        throw new Error(data.error || 'Upload failed')
      }

    } catch (err) {
      console.error('Video generation failed:', err)
      setErrorMsg(err.message || 'Erro ao gerar video')
      setStatus('error')
    }
  }, [status, amount, completedGoals, goalPct])

  function downloadDirect() {
    if (!videoUrl) return
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `nexcontrol-resultado.webm`
    link.click()
  }

  async function shareVideo() {
    if (!videoUrl) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NexControl - Resultado', url: videoUrl })
      } catch {}
    } else {
      await navigator.clipboard.writeText(videoUrl)
      alert('Link copiado!')
    }
  }

  const labels = {
    idle: 'Gerar video',
    rendering: `Renderizando ${progress}%`,
    uploading: 'Salvando...',
    done: 'Video pronto!',
    error: 'Tentar novamente',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...style }}>
      {/* Main button */}
      {status !== 'done' ? (
        <motion.button
          onClick={generate}
          disabled={status === 'rendering' || status === 'uploading'}
          whileTap={{ scale: 0.96 }}
          style={{
            fontSize: 12, fontWeight: 700, padding: '8px 20px', borderRadius: 8,
            cursor: (status === 'rendering' || status === 'uploading') ? 'wait' : 'pointer',
            border: '1px solid rgba(229,57,53,0.3)',
            background: status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(229,57,53,0.15)',
            color: status === 'error' ? '#EF4444' : '#ff6b6b',
            opacity: (status === 'rendering' || status === 'uploading') ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {(status === 'rendering' || status === 'uploading') && (
            <motion.div
              style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,107,107,0.3)', borderTopColor: '#ff6b6b' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {labels[status]}
        </motion.button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button onClick={downloadDirect} whileTap={{ scale: 0.96 }}
            style={{ fontSize: 11, fontWeight: 600, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', border: 'none', background: '#008C5E', color: '#052e16' }}>
            Baixar video
          </motion.button>
          <motion.button onClick={shareVideo} whileTap={{ scale: 0.96 }}
            style={{ fontSize: 11, fontWeight: 600, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            Compartilhar
          </motion.button>
          <motion.button onClick={() => { setStatus('idle'); setVideoUrl(null) }} whileTap={{ scale: 0.96 }}
            style={{ fontSize: 11, fontWeight: 600, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
            Novo
          </motion.button>
          {onClose && (
            <motion.button onClick={onClose} whileTap={{ scale: 0.96 }}
              style={{ fontSize: 11, fontWeight: 600, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.3)' }}>
              Fechar
            </motion.button>
          )}
        </div>
      )}

      {errorMsg && <p style={{ fontSize: 10, color: '#EF4444', margin: 0 }}>{errorMsg}</p>}
    </div>
  )
}

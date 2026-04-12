import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

export function AmbientGlow({ color = '#22C55E', startFrame = 0 }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sec = frame / fps

  const rise = interpolate(frame, [startFrame, startFrame + fps], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  const breathe = 0.7 + Math.sin(sec * 1.8) * 0.3

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {/* Central glow */}
      <div style={{
        position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)',
        width:'70%', height:'50%', borderRadius:'50%',
        background:`radial-gradient(circle, ${color}${Math.round(rise * breathe * 20).toString(16).padStart(2,'0')}, transparent 60%)`,
        filter:'blur(60px)',
      }}/>
      {/* Vignette */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 65% 60% at 50% 45%, transparent 30%, rgba(0,0,0,0.7) 100%)',
      }}/>
    </div>
  )
}

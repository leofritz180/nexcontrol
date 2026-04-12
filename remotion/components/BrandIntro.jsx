import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

export function BrandIntro() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Logo appears 0.3-1s
  const logoFade = interpolate(frame, [9, 30], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  const logoScale = interpolate(frame, [9, 30], [0.85, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  // Logo fades out 1.3-1.8s
  const logoOut = interpolate(frame, [39, 54], [1, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  const a = logoFade * logoOut

  // Text
  const textFade = interpolate(frame, [18, 36], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' }) * logoOut

  // Digital grid
  const gridA = interpolate(frame, [6, 24], [0, 0.03], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
    * interpolate(frame, [36, 45], [1, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      {/* Grid */}
      <svg style={{ position:'absolute', inset:0, opacity: gridA }}>
        {Array.from({length:28}, (_,i) => <line key={`v${i}`} x1={i*40} y1={0} x2={i*40} y2={1920} stroke="rgba(255,255,255,0.5)" strokeWidth={0.5}/>)}
        {Array.from({length:48}, (_,i) => <line key={`h${i}`} x1={0} y1={i*40} x2={1080} y2={i*40} stroke="rgba(255,255,255,0.5)" strokeWidth={0.5}/>)}
      </svg>

      {/* Logo */}
      <div style={{
        opacity: a, transform: `scale(${logoScale})`,
        display:'flex', flexDirection:'column', alignItems:'center', gap: 20,
      }}>
        {/* Red square */}
        <div style={{
          width: 80, height: 80, borderRadius: 20, background:'#e53935',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: `0 0 ${40 * a}px rgba(229,57,53,${0.4*a})`,
        }}>
          <svg width={36} height={36} viewBox="0 0 28 28" fill="none">
            <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
            <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
            <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
          </svg>
        </div>

        {/* Brand text */}
        <div style={{ opacity: textFade, textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <span style={{ fontSize:36, fontWeight:800, color:'rgba(255,255,255,0.6)', fontFamily:'Inter,sans-serif' }}>Nex</span>
            <span style={{ fontSize:36, fontWeight:800, color:'rgba(255,68,68,0.9)', fontFamily:'Inter,sans-serif' }}>Control</span>
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', letterSpacing:'0.15em', marginTop:8 }}>
            SISTEMA OPERACIONAL DE RESULTADOS
          </p>
        </div>
      </div>
    </div>
  )
}

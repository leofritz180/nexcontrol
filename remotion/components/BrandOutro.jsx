import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

export function BrandOutro({ dateLabel }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  // Darken at 5.5s (frame 165)
  const darken = interpolate(frame, [165, 195], [0, 0.35], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  // Brand at 6.5s (frame 195)
  const brandA = interpolate(frame, [195, 219], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  const brandScale = interpolate(frame, [195, 219], [0.88, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  // Fade out at end
  const brandOut = interpolate(frame, [240, 255], [1, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  const a = brandA * brandOut

  return (
    <div style={{ position:'absolute', inset:0 }}>
      {/* Darken overlay */}
      <div style={{ position:'absolute', inset:0, background:`rgba(0,0,0,${darken})` }}/>

      {/* Brand */}
      <div style={{
        position:'absolute', bottom: 120, left:0, right:0,
        display:'flex', flexDirection:'column', alignItems:'center', gap:16,
        opacity: a, transform:`scale(${brandScale})`,
      }}>
        {/* Logo — BIGGER than intro */}
        <div style={{
          width:72, height:72, borderRadius:18, background:'#e53935',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 ${50*a}px rgba(229,57,53,${0.5*a})`,
        }}>
          <svg width={32} height={32} viewBox="0 0 28 28" fill="none">
            <path d="M4 22L10 22L10 12L4 12Z" fill="white" opacity={0.5}/>
            <path d="M12 22L18 22L18 6L12 6Z" fill="white"/>
            <path d="M20 22L26 22L26 16L20 16Z" fill="white" opacity={0.7}/>
          </svg>
        </div>

        <div style={{ textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <span style={{ fontSize:32, fontWeight:800, color:'rgba(255,255,255,0.55)', fontFamily:'Inter,sans-serif' }}>Nex</span>
            <span style={{ fontSize:32, fontWeight:800, color:'rgba(255,68,68,0.85)', fontFamily:'Inter,sans-serif' }}>Control</span>
          </div>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.2)', letterSpacing:'0.12em', marginTop:6 }}>
            SISTEMA OPERACIONAL DE RESULTADOS
          </p>
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.1)', marginTop:10, letterSpacing:'0.06em' }}>
            {dateLabel || new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}
          </p>
        </div>
      </div>
    </div>
  )
}

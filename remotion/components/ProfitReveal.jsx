import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

const fmt = v => Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})

export function ProfitReveal({ amount, isPositive, completedGoals, color }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const abs = Math.abs(amount)

  // Reveal: blur→focus at 3s (frame 90)
  const reveal = interpolate(frame, [84, 99], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  // Count-up: 3-4.8s
  const countUp = interpolate(frame, [90, 144], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
  const eased = 1 - Math.pow(2, -10 * countUp) // outExpo
  const current = abs * eased

  // Impact bounce at 4.3s (frame 129)
  const bounce = spring({ frame: frame - 129, fps, config:{ damping:12, stiffness:150, mass:0.8 }})
  const impactScale = frame < 129 ? 0.82 + reveal*0.18 : 0.82 + 0.18 + (bounce-1)*-0.1 + bounce*0.06

  // Shine at 4.3-4.7s
  const shineProg = interpolate(frame, [129, 141], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  // Flash
  const flashA = interpolate(frame, [129, 135], [0.12, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  // Meta text
  const metaA = interpolate(frame, [144, 159], [0, 0.3], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  // Confirm text at 5s
  const confirmA = interpolate(frame, [150, 168], [0, 0.25], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
    * interpolate(frame, [195, 210], [1, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  if (reveal <= 0) return null

  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      {/* Flash */}
      {flashA > 0 && <div style={{ position:'absolute', inset:0, background:color, opacity:flashA }}/>}

      {/* Value */}
      <div style={{
        transform: `scale(${impactScale})`,
        opacity: reveal,
        textAlign:'center',
      }}>
        <p style={{
          fontFamily:"'JetBrains Mono',monospace", fontSize:48, fontWeight:900,
          color, lineHeight:1, margin:0,
          textShadow:`0 0 60px ${color}80, 0 0 120px ${color}40`,
          position:'relative', overflow:'hidden',
        }}>
          {isPositive?'+':'-'}R$
          <br/>
          <span style={{ fontSize:56 }}>{fmt(current)}</span>

          {/* Shine */}
          {shineProg > 0 && shineProg < 1 && (
            <span style={{
              position:'absolute', top:0, left:`${-20+shineProg*120}%`,
              width:'25%', height:'100%', display:'block',
              background:`linear-gradient(90deg,transparent,rgba(255,255,255,${0.2*(1-shineProg)}),transparent)`,
            }}/>
          )}
        </p>

        <p style={{ fontSize:14, color:`rgba(255,255,255,${metaA})`, marginTop:16 }}>
          {completedGoals} metas fechadas
        </p>
      </div>

      {/* Confirm */}
      <p style={{
        position:'absolute', bottom:'30%',
        fontSize:14, fontWeight:700, color:`rgba(255,255,255,${confirmA})`,
        letterSpacing:'0.1em',
      }}>
        LUCRO CONFIRMADO
      </p>
    </div>
  )
}

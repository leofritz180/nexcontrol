import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'

export function EnergyCore({ color = '#22C55E' }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const sec = frame / fps
  const cx = width/2, cy = height/2 - 60

  // Activation: 1.3-3s
  const build = interpolate(frame, [39, 90], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  // Scan lines
  const lines = Array.from({length:6}, (_,i) => ({
    y: cy - 180 + i * 72,
    delay: i * 0.08,
  }))

  // Beam
  const beamA = interpolate(frame, [54, 78], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  // Brackets
  const bracketA = interpolate(frame, [60, 78], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {/* Scan lines */}
      {lines.map((line, i) => {
        const p = interpolate(frame, [42 + i*2.4, 60 + i*2.4], [0, 1], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })
        const w = p * 300
        return (
          <div key={i}>
            <div style={{
              position:'absolute', left: cx-w, top: line.y, width: w*2, height: 1,
              background: color, opacity: p * 0.08 * build,
            }}/>
            {p > 0.5 && <>
              <div style={{ position:'absolute', left:cx-w-3, top:line.y-3, width:6, height:6, borderRadius:'50%', background:color, opacity:p*0.2*build }}/>
              <div style={{ position:'absolute', left:cx+w-3, top:line.y-3, width:6, height:6, borderRadius:'50%', background:color, opacity:p*0.2*build }}/>
            </>}
          </div>
        )
      })}

      {/* Vertical beam */}
      <div style={{
        position:'absolute', left: cx-60, top: cy-300, width:120, height:600,
        background:`linear-gradient(180deg, transparent 10%, ${color}${Math.round(beamA*8).toString(16).padStart(2,'0')} 40%, ${color}${Math.round(beamA*15).toString(16).padStart(2,'0')} 50%, ${color}${Math.round(beamA*8).toString(16).padStart(2,'0')} 60%, transparent 90%)`,
        opacity: build,
      }}/>

      {/* Corner brackets */}
      <svg style={{ position:'absolute', inset:0, opacity: bracketA * build * 0.15 }} viewBox={`0 0 ${width} ${height}`}>
        {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dy],i) => {
          const bx = cx + dx*100, by = cy + dy*150
          return (
            <path key={i} d={`M ${bx} ${by+dy*-40} L ${bx} ${by} L ${bx+dx*40} ${by}`}
              fill="none" stroke={color} strokeWidth={2}/>
          )
        })}
      </svg>
    </div>
  )
}

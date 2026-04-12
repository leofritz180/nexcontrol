import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { AnimatedHUD } from '../components/AnimatedHUD'
import { ProfitAmount } from '../components/ProfitAmount'
import { ParticleField } from '../components/ParticleField'
import { BrandOutro } from '../components/BrandOutro'

/**
 * ProfitResultVideo — Main Remotion composition
 *
 * Props:
 * @param {number} amount - Profit/loss value
 * @param {boolean} isPositive - Whether profit is positive
 * @param {string} mode - "total" | "today" | "7days"
 * @param {number} completedGoals - Number of closed metas
 * @param {string} operationName - Operation label
 * @param {string} dateLabel - Formatted date string
 * @param {string} brandName - "NexControl"
 * @param {number} goalPct - Goal completion 0-1
 */
export function ProfitResultVideo({
  amount = 3058.47,
  isPositive = true,
  mode = 'total',
  completedGoals = 14,
  operationName = 'Resultado da operacao',
  dateLabel,
  brandName = 'NexControl',
  goalPct = 0.65,
}) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const sec = frame / fps

  const color = isPositive ? '#22C55E' : '#EF4444'
  const colorDim = isPositive ? 'rgba(34,197,94,' : 'rgba(239,68,68,'
  const profitPct = Math.min(1, Math.abs(amount) / Math.max(1, Math.abs(amount) * 1.5))

  // Master fade out at 6s
  const masterFade = interpolate(frame, [360, 420], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Intro glow
  const introGlow = interpolate(frame, [0, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Zoom: in during intro, bump at impact, out at end
  const zoomIntro = interpolate(frame, [0, 72], [1, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const zoomImpact = frame >= 180 ? interpolate(frame, [180, 216], [0, 0.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0
  const zoomOut = interpolate(frame, [270, 420], [0, -0.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const zoom = zoomIntro + zoomImpact + zoomOut

  // Title
  const titleOpacity = interpolate(frame, [18, 48], [0, 0.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    * interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [18, 48], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{
      background: '#010204',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      transform: `scale(${zoom})`,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, ${colorDim}${0.1 * introGlow * (0.8 + Math.sin(sec*1.2)*0.2)}), ${colorDim}0.03) 35%, transparent 60%)`,
        filter: 'blur(80px)', opacity: masterFade,
      }}/>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 70% at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        opacity: masterFade,
      }}/>

      {/* Title */}
      <div style={{
        position: 'absolute', top: '22%',
        opacity: titleOpacity * masterFade,
        transform: `translateY(${titleY}px)`,
        fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.2em', textTransform: 'uppercase',
        fontFamily: "'Inter', sans-serif",
      }}>
        {operationName.toUpperCase()}
      </div>

      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, opacity: masterFade }}>
        <ParticleField color={color} count={22} radius={240}/>
      </div>

      {/* HUD */}
      <div style={{ position: 'relative', opacity: masterFade }}>
        <AnimatedHUD
          goalPct={goalPct}
          profitPct={profitPct}
          color={color}
          size={420}
        />

        {/* Center value */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ProfitAmount
            amount={amount}
            isPositive={isPositive}
            metasFechadas={completedGoals}
            color={color}
          />
        </div>
      </div>

      {/* Brand outro */}
      <BrandOutro brandName={brandName} dateLabel={dateLabel}/>
    </AbsoluteFill>
  )
}

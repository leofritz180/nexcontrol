import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { AmbientGlow } from '../components/AmbientGlow'
import { ParticleField } from '../components/ParticleField'
import { BrandIntro } from '../components/BrandIntro'
import { EnergyCore } from '../components/EnergyCore'
import { ProfitReveal } from '../components/ProfitReveal'
import { BrandOutro } from '../components/BrandOutro'

/**
 * ProfitCinematicVideo — Main Remotion composition
 * 5-scene cinematic narrative, brand-first, no HUD/circles
 *
 * Timeline (8.5s at 30fps = 255 frames):
 * Scene 1: Brand Intro (0-1.5s / frames 0-45)
 * Scene 2: System Activation (1.3-3s / frames 39-90)
 * Scene 3: Profit Reveal (3-5s / frames 90-150)
 * Scene 4: Atmosphere (5-6.5s / frames 150-195)
 * Scene 5: Brand Outro (6.5-8.5s / frames 195-255)
 */
export function ProfitCinematicVideo({
  amount = 3058.47,
  isPositive = true,
  completedGoals = 14,
  operationName = 'Resultado da operacao',
  dateLabel = '',
  brandName = 'NexControl',
  mode = 'total',
}) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const color = isPositive ? '#22C55E' : '#EF4444'

  // Master fade at end
  const masterFade = interpolate(frame, [durationInFrames-15, durationInFrames], [1, 0], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  // Gentle zoom
  const zoom = interpolate(frame, [0, 60, 120, 135, durationInFrames], [1, 1.03, 1.03, 1.05, 1.01], { extrapolateLeft:'clamp', extrapolateRight:'clamp' })

  return (
    <AbsoluteFill style={{
      background:'#000',
      transform:`scale(${zoom})`,
      opacity: masterFade,
    }}>
      {/* Layer 1: Ambient */}
      <AmbientGlow color={color}/>

      {/* Layer 2: Particles */}
      <ParticleField color={color} count={25}/>

      {/* Layer 3: Brand Intro */}
      <BrandIntro/>

      {/* Layer 4: Energy activation */}
      <EnergyCore color={color}/>

      {/* Layer 5: Value reveal */}
      <ProfitReveal
        amount={amount}
        isPositive={isPositive}
        completedGoals={completedGoals}
        color={color}
      />

      {/* Layer 6: Brand outro */}
      <BrandOutro dateLabel={dateLabel}/>
    </AbsoluteFill>
  )
}

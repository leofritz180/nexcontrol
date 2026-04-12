import { Composition } from 'remotion'
import { ProfitResultVideo } from './compositions/ProfitResultVideo'

/**
 * Remotion Root — registers all compositions
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="ProfitResultVideo"
        component={ProfitResultVideo}
        durationInFrames={420}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          amount: 3058.47,
          isPositive: true,
          mode: 'total',
          completedGoals: 14,
          operationName: 'Resultado da operacao',
          dateLabel: '',
          brandName: 'NexControl',
          goalPct: 0.65,
        }}
      />
    </>
  )
}

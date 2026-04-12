import { registerRoot, Composition } from 'remotion'
import { ProfitCinematicVideo } from './compositions/ProfitCinematicVideo'

function RemotionRoot() {
  return (
    <>
      <Composition
        id="ProfitCinematicVideo"
        component={ProfitCinematicVideo}
        durationInFrames={255}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          amount: 3058.47,
          isPositive: true,
          completedGoals: 14,
          operationName: 'Resultado da operacao',
          dateLabel: '',
          brandName: 'NexControl',
          mode: 'total',
        }}
      />
    </>
  )
}

registerRoot(RemotionRoot)

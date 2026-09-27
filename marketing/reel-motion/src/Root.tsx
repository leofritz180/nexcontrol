import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { FPS, duracaoTotal, type Cta } from "./script";

export const Root: React.FC = () => (
  <Composition
    id="Video"
    component={Video}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={duracaoTotal("bio")}
    defaultProps={{ cta: "bio" as Cta }}
    calculateMetadata={({ props }) => ({ durationInFrames: duracaoTotal((props.cta as Cta) ?? "bio") })}
  />
);

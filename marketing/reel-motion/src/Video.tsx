import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { C } from "./brand";
import { carregarFontes } from "./fonte";
import { Grao } from "./components/base";
import { linha, OVER, type Cta } from "./script";
import { Gancho } from "./scenes/Gancho";
import { Palco } from "./scenes/Palco";
import { Titulos } from "./scenes/Titulos";
import { Final } from "./scenes/Final";

/* Camadas, de baixo pra cima: palco (cenas 2–9, câmera contínua) · gancho
   (cenas 0–1, racha por cima do palco) · títulos · fecho · grão.
   `voz` só serve pra conferir no Studio; o render final sai mudo e o som
   entra no mux (tools/final.mjs). */
export const Video: React.FC<{ cta?: Cta; voz?: boolean }> = ({ cta = "bio", voz = false }) => {
  carregarFontes();
  const L = linha(cta);
  const P0 = L.cenas[2].from, F = L.cenas[10].from;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {voz ? <Audio src={staticFile(`voice-${cta}.mp3`)} /> : null}
      <Sequence from={P0} durationInFrames={F + OVER + 14 - P0} layout="none"><Palco L={L} /></Sequence>
      <Sequence from={0} durationInFrames={P0 + 16} layout="none"><Gancho L={L} /></Sequence>
      <Sequence from={0} durationInFrames={F + 12} layout="none"><Titulos L={L} /></Sequence>
      <Sequence from={F} layout="none"><Final L={L} cta={cta} /></Sequence>
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)", pointerEvents: "none" }} />
      <Grao op={0.05} />
    </AbsoluteFill>
  );
};

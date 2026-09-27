/* FECHO (cena 10) — o N se monta em 3D a partir das três facetas, a luz
   atravessa, entra o nome e o CTA. O último frame é a capa. Frames locais. */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTE, MONO, SAFE } from "../brand";
import { Faiscas, Ico, Olho, clamp, ease, easeInOut, lin, mola } from "../components/base";
import { MarcaN, Wordmark } from "../components/Logo";
import type { Cta, Linha } from "../script";

export const Final: React.FC<{ L: Linha; cta: Cta }> = ({ L, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const F = L.cenas[10].from;
  const q = (w: string) => L.abs(10, w) - F;
  const tNex = q("Nex"), tCta = cta === "bio" ? q("link") : q("saiba");
  /* entrada: círculo preto abre do centro por cima do palco */
  const abre = ease(lin(frame, 0, 12));
  const monta = ease(lin(frame, 0, 18));
  const assenta = mola(frame, fps, 10, { damping: 12, stiffness: 90 });
  /* depois de assentar, o N segue balançando de leve (a capa não fica morta) */
  const balanco = Math.sin(frame / 22) * 5 * clamp((frame - 30) / 20);
  const ry = -70 + 54 * assenta + balanco, rx = 18 - 12 * assenta;
  const brilho = lin(frame, tNex, tNex + 22);
  const kW = mola(frame, fps, tNex - 2, { damping: 14 });
  const kC = mola(frame, fps, tCta - 2, { damping: 10, stiffness: 190 });
  const setaY = cta === "bio" ? Math.sin(Math.max(0, frame - tCta) / 5) * 8 : 0;
  const setaX = cta === "saiba" ? Math.sin(Math.max(0, frame - tCta) / 5) * 8 : 0;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${abre * 130}% at 50% 52%)`, background: `radial-gradient(80% 50% at 50% 46%, #141617 0%, ${C.bg} 70%)`, fontFamily: FONTE }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
        <MarcaN tam={360} rx={rx} ry={ry} monta={monta} brilho={brilho} halo={clamp(monta * 1.2)} uid="final" />
      </div>
      <Faiscas x={540} y={740} inicio={16} n={12} raio={300} seed={31} />
      {/* anel lime que marca a chegada da marca */}
      <div style={{ position: "absolute", left: 540, top: 740, width: 0, height: 0 }}><div style={{ position: "absolute", left: -lin(frame, 4, 26, 60, 520), top: -lin(frame, 4, 26, 60, 520), width: lin(frame, 4, 26, 120, 1040), height: lin(frame, 4, 26, 120, 1040), borderRadius: "50%", border: `${lin(frame, 4, 26, 10, 1)}px solid ${C.lime}`, opacity: lin(frame, 4, 26, 0.8, 0) * (frame >= 4 ? 1 : 0) }} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: clamp(kW * 1.3), transform: `translateY(${(1 - kW) * 40}px)` }}>
        <Wordmark tam={88} />
        <Olho texto="Gestão da operação CPA" inicio={tNex + 6} tamanho={24} />
      </div>
      {frame >= tCta - 2 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "30px 54px", borderRadius: 999, background: C.lime, color: C.bg, fontWeight: 800, fontSize: 40, letterSpacing: 5, transform: `scale(${kC})`, boxShadow: `0 20px 60px ${C.lime}44` }}>
            {cta === "bio" ? "LINK NA BIO" : "SAIBA MAIS"}
            <span style={{ display: "inline-flex", transform: `translate(${setaX}px, ${-setaY}px)` }}><Ico n={cta === "bio" ? "setaCima" : "seta"} s={44} c={C.bg} w={3} /></span>
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: SAFE.base + 20, textAlign: "center", fontFamily: MONO, fontSize: 28, color: C.cinza, letterSpacing: 2, opacity: lin(frame, tCta + 8, tCta + 18) }}>nexcpa.com.br</div>
    </AbsoluteFill>
  );
};

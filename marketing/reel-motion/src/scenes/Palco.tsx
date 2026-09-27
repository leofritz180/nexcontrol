/* PALCO (cenas 2 a 9) — UM espaço 3D só, com o notebook do administrador e
   o celular do operador. Em vez de cortar de cena em cena, a CÂMERA viaja
   entre os aparelhos (dolly, giro, foco) no ritmo da narração, com
   profundidade de campo e motion blur nos movimentos. Frames locais: 0 é o
   início da cena 2. */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { C } from "../brand";
import { clamp, easeInOut, lin, pulso } from "../components/base";
import { AppBloqueio, AppMetas, AppRemessa, Celular, FH, FW, ModalFechamento, NH, NW, Notebook, TelaOperadores, TelaPainel } from "../components/Nex";
import type { Linha } from "../script";

type Cam = { x: number; y: number; s: number; rx: number; ry: number; dof: number };
/* posição dos aparelhos no mundo */
const FONE = { x: 900, y: 110, z: 160 };
const NOTE = { x: 0, y: 0 };
const ORIGEM_Y = 1075; // onde o centro do mundo cai na tela (abaixo dos títulos)

export function tempos(L: Linha) {
  const P0 = L.cenas[2].from;
  const q = (i: number, w: string, oc = 0) => L.abs(i, w, oc) - P0;
  const s = (i: number) => L.cenas[i].from - P0;
  return { P0, q, s };
}

function camera(frame: number, L: Linha): { cam: Cam; mov: number } {
  const { q, s } = tempos(L);
  const fone: Cam = { x: FONE.x - 20, y: FONE.y - 150, s: 1.36, rx: 4, ry: -10, dof: 1 };
  const note: Cam = { x: NOTE.x, y: -10, s: 0.64, rx: 5, ry: 8, dof: 0 };
  const K: { t: number; d: number; c: Cam }[] = [
    { t: -20, d: 1, c: { ...fone, s: 1.0, ry: -22, rx: 10 } },
    { t: 0, d: 22, c: fone },
    { t: s(3), d: 12, c: { ...fone, s: 1.42, y: FONE.y - 130, ry: -6 } },
    { t: q(3, "hora") - 2, d: 20, c: note },
    { t: s(5) + 2, d: 16, c: { x: 0, y: 20, s: 0.96, rx: 3, ry: 3, dof: 0 } },
    { t: s(6), d: 14, c: { x: 0, y: 40, s: 1.06, rx: 2, ry: -2, dof: 0 } },
    { t: s(7) - 2, d: 20, c: { ...fone, s: 1.34, ry: -14 } },
    { t: s(8) - 2, d: 20, c: { ...note, s: 0.66, ry: 10 } },
    { t: s(9) - 2, d: 26, c: { x: 300, y: 60, s: 0.5, rx: 12, ry: -18, dof: 0.5 } },
  ];
  let atual = K[0].c, mov = 0;
  for (let i = 1; i < K.length; i++) {
    const k = K[i];
    if (frame < k.t) break;
    const x = easeInOut((frame - k.t) / k.d);
    const prev = atual;
    atual = { x: prev.x + (k.c.x - prev.x) * x, y: prev.y + (k.c.y - prev.y) * x, s: prev.s + (k.c.s - prev.s) * x, rx: prev.rx + (k.c.rx - prev.rx) * x, ry: prev.ry + (k.c.ry - prev.ry) * x, dof: prev.dof + (k.c.dof - prev.dof) * x };
    if (x > 0 && x < 1) mov = Math.max(mov, Math.sin(Math.PI * x));
  }
  /* respiro: a câmera nunca para de todo (câmera na mão, bem contida) */
  const t = frame / 30;
  atual = { ...atual, rx: atual.rx + Math.sin(t * 0.9) * 0.6, ry: atual.ry + Math.sin(t * 0.7 + 1) * 0.8, s: atual.s * (1 + 0.006 * Math.sin(t * 0.5)) };
  return { cam: atual, mov };
}

const Mundo: React.FC<{ L: Linha }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { q, s } = tempos(L);
  const { cam } = camera(frame, L);
  const blurNote = cam.dof * 7;
  const blurFone = (1 - cam.dof) * 5 * clamp((cam.s - 0.5) / 0.3);
  /* telas do celular por momento */
  const telaFone = frame < s(7) - 4 ? "app" : "bloqueio";
  const tremor = pulso(frame, q(7, "Alerta"), q(7, "Alerta") + 24);
  /* quando a câmera está no notebook, o celular sai de cena pela direita
     (na frente e borrado, ele cobria o modal do fechamento) */
  const fora = (a: number, b: number) => easeInOut(lin(frame, a, a + 16)) * (1 - easeInOut(lin(frame, b, b + 16)));
  const afasta = Math.max(fora(q(3, "hora") + 2, s(7) - 14), fora(s(8) - 2, s(9) - 6));
  /* notebook: painel → (modal por cima) → operadores → painel */
  const telaNote = frame >= s(8) - 6 && frame < s(9) + 4 ? "ops" : "painel";
  const fechaModal = lin(frame, s(7) + 4, s(7) + 12, 1, 0);
  /* pulso de dados: do botão "Salvar remessa" até o card de lucro */
  const pIni = q(3, "entra") + 4, pFim = q(4, "lucro");
  const pk = easeInOut(lin(frame, pIni, pFim));
  const A = { x: FONE.x - 10, y: FONE.y + 250 }, B = { x: -420, y: -230 }, M = { x: 380, y: -560 };
  const bez = (t: number) => ({ x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * M.x + t * t * B.x, y: (1 - t) ** 2 * A.y + 2 * (1 - t) * t * M.y + t * t * B.y });
  const pulsoVivo = frame >= pIni && frame <= pFim + 6;
  const rastro = Array.from({ length: 14 }, (_, i) => bez(clamp(pk - i * 0.025)));

  return (
    <div style={{ position: "absolute", left: 540, top: ORIGEM_Y, width: 0, height: 0, transformStyle: "preserve-3d", transform: `scale(${cam.s}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate3d(${-cam.x}px, ${-cam.y}px, 0)` }}>
      {/* halo lime atrás do notebook */}
      <div style={{ position: "absolute", left: -1100, top: -800, width: 2200, height: 1400, background: `radial-gradient(ellipse at 50% 50%, ${C.lime}16 0%, transparent 60%)`, transform: "translateZ(-200px)" }} />
      <div style={{ position: "absolute", left: NOTE.x - (NW + 60) / 2, top: NOTE.y - (NH + 60) / 2, filter: blurNote > 0.3 ? `blur(${blurNote}px)` : undefined }}>
        <Notebook>
          {telaNote === "painel" ? <TelaPainel T={{ chega: q(4, "lucro"), perda: q(4, "prejuízo"), fim: s(5) }} /> : <TelaOperadores T={{ entra: s(8) - 4, acesso: q(8, "acesso"), ranking: q(8, "ranking") }} />}
          {frame >= s(5) && frame < s(7) + 12 ? <div style={{ position: "absolute", inset: 0, opacity: fechaModal }}><ModalFechamento T={{ abre: s(5) + 2, salario: q(5, "Salário"), bau: q(5, "baú"), custos: q(5, "custos"), final: q(6, "lucro"), carimbo: q(6, "calculado") }} /></div> : null}
        </Notebook>
      </div>
      <div style={{ position: "absolute", left: FONE.x - FW / 2, top: FONE.y - FH / 2, transform: `translateX(${afasta * 700}px) translateZ(${FONE.z}px) rotateY(-6deg)`, filter: blurFone > 0.3 ? `blur(${blurFone}px)` : undefined }}>
        <Celular tremor={tremor}>
          {telaFone === "app" ? (
            <>
              <AppMetas T={{ meta: q(2, "meta"), dono: q(2, "dono") }} />
              {frame >= s(3) - 2 ? <AppRemessa T={{ abre: s(3) - 2, digita: s(3) + 1, salva: q(3, "entra") }} /> : null}
            </>
          ) : (
            <AppBloqueio T={{ liga: s(7) - 4, n1: q(7, "parada"), n2: q(7, "vermelho"), alerta: q(7, "Alerta") }} />
          )}
        </Celular>
      </div>
      {pulsoVivo ? (
        <svg style={{ position: "absolute", left: -2000, top: -2000, overflow: "visible", transform: "translateZ(120px)" }} width={4000} height={4000}>
          {rastro.map((p, i) => <circle key={i} cx={p.x + 2000} cy={p.y + 2000} r={(22 - i * 1.3) / Math.max(0.5, cam.s)} fill={C.lime} opacity={(1 - i / 14) * 0.8 * lin(frame, pFim, pFim + 6, 1, 0)} />)}
          <circle cx={rastro[0].x + 2000} cy={rastro[0].y + 2000} r={46 / Math.max(0.5, cam.s)} fill={C.lime} opacity={0.18} />
        </svg>
      ) : null}
    </div>
  );
};

export const Palco: React.FC<{ L: Linha }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { mov } = camera(frame, L);
  const conteudo = (
    <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: `50% ${ORIGEM_Y}px`, overflow: "hidden" }}>
      <Mundo L={L} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 55% 62%, #1d2021 0%, #0d0f0f 55%, ${C.bg} 85%)` }}>
      {/* chão em perspectiva, desenhado PLANO no fundo. Dentro do mundo 3D ele
          cruzava o notebook e o Chrome recortava metade da tela (25/09). */}
      <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", left: -1400, right: -1400, top: 1320, height: 1400, transform: "rotateX(72deg)", transformOrigin: "50% 0", backgroundImage: `linear-gradient(${C.linha} 2px, transparent 2px), linear-gradient(90deg, ${C.linha} 2px, transparent 2px)`, backgroundSize: "140px 140px", backgroundPosition: `${-frame * 1.2}px 0`, maskImage: "linear-gradient(180deg, #000 0%, transparent 70%)", WebkitMaskImage: "linear-gradient(180deg, #000 0%, transparent 70%)", opacity: 0.8 }} />
      </AbsoluteFill>
      {mov > 0.15 ? <CameraMotionBlur shutterAngle={180} samples={6}>{conteudo}</CameraMotionBlur> : conteudo}
    </AbsoluteFill>
  );
};

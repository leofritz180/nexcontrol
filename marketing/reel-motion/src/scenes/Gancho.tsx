/* GANCHO (cenas 0 e 1) — versão premium, toda em escuro.
   · uma grade de planilha em 3D se desenha no preto e a câmera sobrevoa,
     com os números embaralhando até assentar (e erros #REF! piscando)
   · "print": obturador de câmera de verdade + prints em vidro escuro
     girando em 3D
   · "WhatsApp": balões estouram na direção da câmera
   · cena 1: o cartão LUCRO DO DIA vem do fundo, os dígitos embaralham,
     no "chute" o número falha (glitch), vira ??? e TRINCA, com luz lime
     vazando pelas rachaduras. Na virada o cartão explode em estilhaços e
     o painel aparece por baixo.
   Frames absolutos (a Sequence começa em 0). */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTE, MONO } from "../brand";
import { Ico, clamp, ease, easeInOut, lin, mola, prng, pulso } from "../components/base";
import type { Linha } from "../script";

const CARAC = "0123456789";
/* dígito embaralhado determinístico */
const embaralha = (alvo: string, frame: number, assenta: number, seed: number) =>
  alvo.split("").map((ch, i) => {
    if (!/[0-9]/.test(ch)) return ch;
    if (frame >= assenta + i * 1.5) return ch;
    const r = prng(seed * 97 + i * 13 + Math.floor(frame / 2))();
    return CARAC[Math.floor(r * 10)];
  }).join("");

/* ---------------------------------------------------------------- GRADE 3D */
const COLS = 9, LINHAS = 34, CW = 190, CH = 78;
const GradeInfinita: React.FC<{ tPlan: number; soco: number; escurece: number }> = ({ tPlan, soco, escurece }) => {
  const frame = useCurrentFrame();
  const W = COLS * CW, Hh = LINHAS * CH;
  const avanco = frame * 5.5;
  const revela = 0.4 + 0.6 * ease(lin(frame, 0, 24)); // ja visivel no frame 0 (e a miniatura)
  const acende = pulso(frame, tPlan - 1, tPlan + 16);
  const r = prng(11);
  const celulas: React.ReactNode[] = [];
  for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLS; x++) {
    const a = r(), b = r();
    const erro = a < 0.045;
    const neg = !erro && a < 0.16;
    const v = erro ? "#REF!" : x === 0 ? `${String(1 + ((y * 3) % 28)).padStart(2, "0")}/09` : x === 1 ? ["W1", "VOY", "OKOK", "DY", "WE"][(y + x) % 5] : String(Math.round(40 + b * 900) * (neg ? -1 : 1));
    const surge = -8 + (Math.abs(x - COLS / 2) + Math.abs(y - 8)) * 0.9;
    if (frame < surge) continue;
    const txt = erro ? v : embaralha(v, frame, surge + 8, x * 100 + y);
    const piscaErro = erro ? 0.55 + 0.45 * Math.sin(frame / 3 + y) : 1;
    celulas.push(
      <div key={x + "-" + y} style={{ position: "absolute", left: x * CW, top: y * CH, width: CW, height: CH, display: "flex", alignItems: "center", padding: "0 18px", boxSizing: "border-box", fontFamily: MONO, fontSize: 30, fontWeight: 500, color: erro ? C.perda : neg ? "rgba(255,90,82,0.8)" : "rgba(244,244,241,0.62)", opacity: lin(frame, surge, surge + 6) * piscaErro, background: erro ? "rgba(255,90,82,0.10)" : undefined }}>{txt}</div>,
    );
  }
  const varre = lin(frame, tPlan, tPlan + 14);
  return (
    <AbsoluteFill style={{ perspective: 1000, perspectiveOrigin: "50% 30%", filter: escurece > 0 ? `blur(${escurece * 7}px) brightness(${1 - escurece * 0.55})` : undefined }}>
      <div style={{ position: "absolute", left: 540 - W / 2, top: 560, width: W, height: Hh, transformOrigin: "50% 0", transform: `rotateX(${58 - 4 * soco}deg) rotateZ(${-6 + frame * 0.03}deg) translateY(${-avanco % (CH * 6)}px) scale(${1 + 0.06 * soco})` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,${0.10 + 0.12 * acende}) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,${0.10 + 0.12 * acende}) 2px, transparent 2px)`, backgroundSize: `${CW}px ${CH}px`, WebkitMaskImage: `radial-gradient(circle at 50% 18%, #000 ${revela * 70}%, transparent ${revela * 70 + 12}%)`, maskImage: `radial-gradient(circle at 50% 18%, #000 ${revela * 70}%, transparent ${revela * 70 + 12}%)` }} />
        {celulas}
        {varre > 0 && varre < 1 ? <div style={{ position: "absolute", left: 0, right: 0, top: CH * 7, height: CH, background: `linear-gradient(90deg, transparent ${varre * 100 - 30}%, rgba(244,244,241,0.28) ${varre * 100}%, transparent ${varre * 100 + 10}%)` }} /> : null}
      </div>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg} 30%, rgba(8,9,9,0) 55%, rgba(8,9,9,0) 80%, ${C.bg} 100%)` }} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- PRINTS EM VIDRO */
const MSGS = [["quanto deu a W1?", "pera, vou ver o print", "acho que 380"], ["o baú caiu?", "caiu 200, eu acho", "anota aí"], ["manda o saque de ontem", "qual conta?", "a do Lucas"]];
const Print: React.FC<{ i: number; em: number; bolhaEm: number; escurece: number }> = ({ i, em, bolhaEm, escurece }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < em) return null;
  const k = mola(frame, fps, em, { damping: 13, stiffness: 120 });
  const pos = [{ x: 40, y: 900, r: -10, ry: 24 }, { x: 560, y: 830, r: 8, ry: -26 }, { x: 290, y: 1150, r: -3, ry: 8 }][i];
  const flutua = Math.sin((frame - em) / 14 + i) * 10;
  const brilho = (frame - em) * 1.5;
  return (
    <div style={{ position: "absolute", left: pos.x, top: pos.y + flutua, width: 480, perspective: 1200, opacity: 1 - escurece * 0.8, filter: escurece > 0 ? `blur(${escurece * 8}px)` : undefined }}>
      <div style={{ transform: `rotateX(${(1 - k) * 70}deg) rotateY(${pos.ry * (1 - k * 0.6)}deg) rotate(${pos.r * k}deg) translateY(${(1 - k) * 420}px) translateZ(${(1 - k) * -400}px)`, borderRadius: 36, background: "linear-gradient(160deg, rgba(38,41,43,0.94), rgba(17,19,20,0.97))", border: `1px solid ${C.linha2}`, padding: "58px 20px 24px", boxShadow: "0 50px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)", fontFamily: FONTE, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${30 + brilho}%, rgba(255,255,255,0.07) ${40 + brilho}%, transparent ${50 + brilho}%)` }} />
        <div style={{ position: "absolute", top: 18, left: 22, right: 22, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: C.graf3, border: `1px solid ${C.linha2}` }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: C.t2 }}>Operação</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 14, color: C.t4 }}>23:4{i}</span>
        </div>
        {MSGS[i].map((m, j) => {
          const on = frame >= bolhaEm + j * 3;
          const kk = on ? mola(frame, fps, bolhaEm + j * 3, { damping: 12, stiffness: 240 }) : 0;
          const meu = j % 2 === 1;
          return (
            <div key={j} style={{ display: "flex", justifyContent: meu ? "flex-end" : "flex-start", marginTop: 10 }}>
              <div style={{ maxWidth: 340, padding: "12px 16px", borderRadius: 18, background: meu ? "rgba(244,244,241,0.14)" : "rgba(255,255,255,0.06)", border: `1px solid ${C.linha}`, fontSize: 25, color: C.tinta, transform: `scale(${kk})`, transformOrigin: meu ? "right" : "left" }}>{m}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* balões que estouram na direção da câmera */
const Estouro: React.FC<{ em: number }> = ({ em }) => {
  const frame = useCurrentFrame();
  if (frame < em) return null;
  const r = prng(404);
  return (
    <AbsoluteFill style={{ perspective: 900, pointerEvents: "none" }}>
      {Array.from({ length: 14 }, (_, i) => {
        const at = Math.floor(r() * 8), x = 150 + r() * 780, y = 900 + r() * 500, dx = (r() - 0.5) * 900, dy = (r() - 0.6) * 900, w = 110 + r() * 120;
        const t = lin(frame, em + at, em + at + 26);
        if (t <= 0 || t >= 1) return null;
        const e = easeInOut(t);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: w * 0.42, borderRadius: w * 0.2, background: i % 3 ? "rgba(244,244,241,0.16)" : "rgba(244,244,241,0.30)", border: `1px solid ${C.linha2}`, transform: `translate3d(${dx * e}px, ${dy * e}px, ${e * 700}px)`, opacity: Math.sin(Math.PI * t) * 0.9, filter: `blur(${e * 6}px)` }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- CARTÃO DO LUCRO */
const RACHAS = [
  "M0 0 L-60 -40 L-140 -30 L-230 -90",
  "M0 0 L70 -60 L120 -70 L260 -150",
  "M0 0 L-40 70 L-130 90 L-240 150",
  "M0 0 L60 50 L150 40 L270 110",
  "M0 0 L10 -90 L-20 -150",
  "M0 0 L-10 90 L30 160",
];
/* estilhaços: triângulos em volta do ponto de impacto (em % do cartão) */
const CACOS = (() => {
  const r = prng(77);
  const cx = 50, cy = 55;
  const borda: [number, number][] = [[0, 0], [25, 0], [50, 0], [75, 0], [100, 0], [100, 50], [100, 100], [75, 100], [50, 100], [25, 100], [0, 100], [0, 50]];
  return borda.map((p, i) => { const q = borda[(i + 1) % borda.length]; const j = [cx + (r() - 0.5) * 10, cy + (r() - 0.5) * 10]; return { poli: `polygon(${j[0]}% ${j[1]}%, ${p[0]}% ${p[1]}%, ${q[0]}% ${q[1]}%)`, dx: ((p[0] + q[0]) / 2 - cx) * 18, dy: ((p[1] + q[1]) / 2 - cy) * 18, rot: (r() - 0.5) * 220, z: 200 + r() * 700 }; });
})();

const CartaoLucro: React.FC<{ tLucro: number; tChute: number; fim: number }> = ({ tLucro, tChute, fim }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < tLucro - 6) return null;
  const k = mola(frame, fps, tLucro - 6, { damping: 14, stiffness: 110 });
  const chute = frame >= tChute;
  const girando = frame >= tLucro && !chute;
  const glitch = chute && frame < tChute + 7;
  const tremor = chute ? Math.sin(frame * 3.3) * 14 * lin(frame, tChute, tChute + 18, 1, 0) : 0;
  const r = prng(frame);
  const valor = girando ? `R$ ${Math.floor(r() * 9)}.${String(Math.floor(r() * 999)).padStart(3, "0")}` : chute ? "R$ ???" : "R$ —";
  const racha = ease(lin(frame, tChute + 2, tChute + 12));
  const vaza = chute ? 0.6 + 0.4 * Math.sin(frame / 4) : 0;
  const quebra = lin(frame, fim, fim + 18);
  const conteudo = (fatia?: number) => (
    <div style={{ width: 880, height: 420, borderRadius: 34, background: "linear-gradient(160deg, #1d2021, #0e1011)", border: `2px solid ${chute ? "rgba(255,90,82,0.6)" : C.linha2}`, boxShadow: chute ? "0 0 80px rgba(255,90,82,0.18)" : "0 60px 120px rgba(0,0,0,0.7)", padding: "48px 56px", boxSizing: "border-box", position: "relative", overflow: "hidden", fontFamily: FONTE }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 600, letterSpacing: 5, color: C.cinza }}><Ico n="tabela" s={30} c={C.cinza} />LUCRO DO DIA</div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 150, letterSpacing: -5, color: chute ? C.perda : C.tinta, marginTop: 30, filter: girando ? "blur(1.2px)" : undefined, transform: glitch && fatia !== undefined ? `translateX(${(prng(frame * 7 + fatia)() - 0.5) * 60}px)` : undefined }}>{valor}</div>
      {racha > 0 ? (
        <svg viewBox="-440 -210 880 420" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <g transform="translate(20 20)">
            {RACHAS.map((d, i) => <path key={"g" + i} d={d} fill="none" stroke={C.lime} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - racha} opacity={0.35 * vaza} style={{ filter: "blur(6px)" }} />)}
            {RACHAS.map((d, i) => <path key={i} d={d} fill="none" stroke="#F4F4F1" strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - racha} />)}
            {RACHAS.map((d, i) => <path key={"l" + i} d={d} fill="none" stroke={C.lime} strokeWidth={1.2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - racha} opacity={vaza} />)}
          </g>
        </svg>
      ) : null}
    </div>
  );
  const pose = { left: 100, top: 800, width: 880, height: 420 } as const;
  if (quebra > 0) {
    const e = ease(quebra);
    return (
      <AbsoluteFill style={{ perspective: 1100 }}>
        {CACOS.map((c, i) => (
          <div key={i} style={{ position: "absolute", ...pose, clipPath: c.poli, transform: `translate3d(${c.dx * e}px, ${c.dy * e}px, ${c.z * e}px) rotate3d(1, 1, 0, ${c.rot * e}deg)`, opacity: 1 - clamp((quebra - 0.5) / 0.5) }}>{conteudo()}</div>
        ))}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ perspective: 1200 }}>
      <div style={{ position: "absolute", ...pose, transform: `translateX(${tremor}px) translateZ(${(1 - k) * -1400}px) rotateX(${(1 - k) * 25}deg)`, opacity: clamp(k * 1.6) }}>
        {glitch ? [0, 1, 2, 3, 4].map((f) => <div key={f} style={{ position: "absolute", inset: 0, clipPath: `inset(${f * 20}% 0 ${80 - f * 20}% 0)` }}>{conteudo(f)}</div>) : conteudo()}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- CENA */
export const Gancho: React.FC<{ L: Linha }> = ({ L }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tPlan = L.abs(0, "planilha"), tPrint = L.abs(0, "print"), tZap = L.abs(0, "WhatsApp");
  const s1 = L.cenas[1].from, tLucro = L.abs(1, "lucro"), tChute = L.abs(1, "chute");
  const fim = L.cenas[2].from;
  const soco = pulso(frame, tPlan - 1, tPlan + 10);
  const obt = frame >= tPrint - 1 && frame < tPrint + 6 ? Math.sin(Math.PI * lin(frame, tPrint - 1, tPrint + 6)) : 0;
  const flash = 0.4 * pulso(frame, tPrint + 2, tPrint + 8);
  const escurece = ease(lin(frame, s1, s1 + 12));
  const sai = lin(frame, fim, fim + 14);
  const anel = lin(frame, fim, fim + 16);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: C.bg, opacity: 1 - sai, transform: `scale(${1 + sai * 0.25})` }}>
        <AbsoluteFill style={{ background: `radial-gradient(80% 50% at 50% 60%, #151718 0%, ${C.bg} 70%)` }} />
        <GradeInfinita tPlan={tPlan} soco={soco} escurece={escurece} />
        {[0, 1, 2].map((i) => <Print key={i} i={i} em={tPrint + i * 3} bolhaEm={tZap + i * 2} escurece={escurece} />)}
        <Estouro em={tZap} />
        {frame >= tZap && frame < s1 + 12 ? (
          <div style={{ position: "absolute", right: 70, top: 760, width: 124, height: 124, borderRadius: 38, background: "linear-gradient(160deg,#26292b,#141617)", border: `1px solid ${C.linha2}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", transform: `scale(${mola(frame, fps, tZap, { damping: 9, stiffness: 220 })}) rotate(${Math.sin(frame / 2) * 6 * lin(frame, tZap, tZap + 20, 1, 0)}deg)`, opacity: 1 - escurece }}>
            <Ico n="chat" s={62} c={C.tinta} />
            <div style={{ position: "absolute", top: -14, right: -14, minWidth: 60, height: 60, borderRadius: 30, background: C.laranja, color: C.bg, fontFamily: MONO, fontWeight: 800, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 10px" }}>{Math.min(99, 12 + Math.floor((frame - tZap) * 2.4))}</div>
          </div>
        ) : null}
        <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      </AbsoluteFill>
      <CartaoLucro tLucro={tLucro} tChute={tChute} fim={fim} />
      {obt > 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 960 * obt, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 960 * obt, background: "#000" }} />
        </>
      ) : null}
      {anel > 0 && anel < 1 ? (
        <div style={{ position: "absolute", left: 540, top: 1010, width: 0, height: 0 }}>
          <div style={{ position: "absolute", left: -1400 * ease(anel), top: -1400 * ease(anel), width: 2800 * ease(anel), height: 2800 * ease(anel), borderRadius: "50%", border: `${30 * (1 - anel) + 2}px solid ${C.lime}`, opacity: 1 - anel, boxShadow: `0 0 120px ${C.lime}88` }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

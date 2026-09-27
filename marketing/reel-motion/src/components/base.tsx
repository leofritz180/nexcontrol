import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONTE, MONO } from "../brand";

/* PRNG determinístico: nada aqui pode depender de Math.random */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const expo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
/** 1 no instante `a` caindo a 0 em `b`; 0 ANTES de `a` (lin(…,1,0) daria 1 antes) */
export const pulso = (frame: number, a: number, b: number) => (frame < a ? 0 : interpolate(frame, [a, b], [1, 0], { extrapolateRight: "clamp" }));
export const lin = (frame: number, a: number, b: number, v0 = 0, v1 = 1) => interpolate(frame, [a, b], [v0, v1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export function mola(frame: number, fps: number, inicio: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) {
  return spring({ frame: frame - inicio, fps, config: { damping: cfg.damping ?? 14, stiffness: cfg.stiffness ?? 160, mass: cfg.mass ?? 0.8 } });
}
export function useMola(inicio: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return mola(frame, fps, inicio, cfg);
}

/* ------------------------------------------------------------ PALAVRA
   Entra por máscara de baixo pra cima, com blur e overshoot de mola. */
export const Palavra: React.FC<{ texto: string; inicio: number; tamanho?: number; peso?: number; cor?: string; mono?: boolean; sublinhado?: boolean; destaque?: boolean; sai?: number; style?: React.CSSProperties }> = ({ texto, inicio, tamanho = 96, peso = 650, cor = C.tinta, mono, sublinhado, destaque, sai, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < inicio) return null;
  const k = mola(frame, fps, inicio, { damping: 13, stiffness: 170 });
  const blur = interpolate(k, [0, 1], [12, 0], { extrapolateRight: "clamp" });
  const s = sai !== undefined ? lin(frame, sai, sai + 8) : 0;
  return (
    <span style={{ display: "inline-block", overflow: sublinhado ? "visible" : "hidden", verticalAlign: "bottom", padding: destaque ? "0 0.24em" : "0 0.02em", borderRadius: destaque ? tamanho * 0.22 : 0, background: destaque ? C.lime : "transparent", opacity: 1 - s, transform: `translateY(${s * -40}px)`, filter: s > 0 ? `blur(${s * 8}px)` : undefined, ...style }}>
      <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
        <span style={{ display: "inline-block", fontFamily: mono ? MONO : FONTE, fontSize: tamanho, fontWeight: peso, color: destaque ? C.bg : cor, lineHeight: 1.14, letterSpacing: mono ? -tamanho * 0.02 : -tamanho * 0.045, transform: `translateY(${(1 - k) * 110}%) scale(${0.9 + 0.1 * k})`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined, whiteSpace: "nowrap" }}>
          {texto}
        </span>
      </span>
      {sublinhado ? <span style={{ position: "relative", display: "block", height: 0 }}><Sublinhado inicio={inicio + 6} /></span> : null}
    </span>
  );
};

export type Item = { t: string; em: number; tam?: number; cor?: string; peso?: number; sublinhado?: boolean; destaque?: boolean; quebra?: boolean; mono?: boolean };
export const Frase: React.FC<{ itens: Item[]; tamanho?: number; alinhar?: "left" | "center"; maxW?: number; sai?: number; style?: React.CSSProperties }> = ({ itens, tamanho = 96, alinhar = "center", maxW = 900, sai, style }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar === "center" ? "center" : "flex-start", alignItems: "flex-end", columnGap: tamanho * 0.2, rowGap: tamanho * 0.02, maxWidth: maxW, ...style }}>
    {itens.map((it, i) => (
      <React.Fragment key={i}>
        {it.quebra ? <div style={{ flexBasis: "100%", height: 0 }} /> : null}
        <Palavra texto={it.t} inicio={it.em} tamanho={it.tam ?? tamanho} peso={it.peso} cor={it.cor} sublinhado={it.sublinhado} destaque={it.destaque} mono={it.mono} sai={sai} />
      </React.Fragment>
    ))}
  </div>
);

/* sublinhado desenhado à mão, em lime, que se traça */
export const Sublinhado: React.FC<{ inicio: number; cor?: string; grosso?: number; altura?: number }> = ({ inicio, cor = C.lime, grosso = 9, altura = 22 }) => {
  const frame = useCurrentFrame();
  const k = ease(lin(frame, inicio, inicio + 11));
  return (
    <svg viewBox="0 0 100 14" preserveAspectRatio="none" style={{ position: "absolute", left: "-3%", top: -altura * 0.35, width: "106%", height: altura, overflow: "visible" }}>
      <path d="M2 9 C 20 4, 40 12, 60 7 S 90 5, 98 8" fill="none" stroke={cor} strokeWidth={grosso} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

/* faíscas em estrela de 4 pontas que estouram em volta de um ponto */
export const Faiscas: React.FC<{ x: number; y: number; inicio: number; n?: number; raio?: number; cor?: string; seed?: number }> = ({ x, y, inicio, n = 9, raio = 130, cor = C.lime, seed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = prng(seed);
  const itens = Array.from({ length: n }, () => ({ a: r() * Math.PI * 2, d: 0.5 + r() * 0.5, s: 12 + r() * 18, at: Math.floor(r() * 6) }));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, pointerEvents: "none" }}>
      {itens.map((it, i) => {
        if (frame < inicio + it.at) return null;
        const k = mola(frame, fps, inicio + it.at, { damping: 12, stiffness: 200 });
        const fade = lin(frame, inicio + it.at + 12, inicio + it.at + 24, 1, 0);
        const dx = Math.cos(it.a) * raio * it.d * k, dy = Math.sin(it.a) * raio * it.d * k;
        return (
          <svg key={i} width={it.s} height={it.s} viewBox="0 0 24 24" style={{ position: "absolute", left: dx - it.s / 2, top: dy - it.s / 2, opacity: fade, transform: `scale(${k}) rotate(${k * 90}deg)` }}>
            <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill={cor} />
          </svg>
        );
      })}
    </div>
  );
};

/* rótulo em caixa alta, cinza, com o ponto lime (o "olho" da landing) */
export const Olho: React.FC<{ texto: string; inicio: number; cor?: string; ponto?: string; tamanho?: number; style?: React.CSSProperties }> = ({ texto, inicio, cor = C.cinza, ponto = C.lime, tamanho = 24, style }) => {
  const frame = useCurrentFrame();
  const o = lin(frame, inicio, inicio + 9);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: tamanho * 0.45, fontFamily: FONTE, fontWeight: 600, fontSize: tamanho, letterSpacing: tamanho * 0.16, color: cor, opacity: o, transform: `translateY(${(1 - o) * 14}px)`, textTransform: "uppercase", whiteSpace: "nowrap", ...style }}>
      <i style={{ width: tamanho * 0.28, height: tamanho * 0.28, borderRadius: "50%", background: ponto, display: "block" }} />
      {texto}
    </div>
  );
};

/* ------------------------------------------------------------ CONTADOR
   Número rolando até o alvo (curva outExpo), com o dígito final "girando". */
export const fmtBR = (v: number) => Math.round(Math.abs(v)).toLocaleString("pt-BR");
export const Contador: React.FC<{ de: number; ate: number; inicio: number; dur?: number; tamanho?: number; cor?: string; prefixo?: string; sinal?: boolean; peso?: number }> = ({ de, ate, inicio, dur = 26, tamanho = 80, cor = C.tinta, prefixo = "R$ ", sinal, peso = 700 }) => {
  const frame = useCurrentFrame();
  const x = expo(lin(frame, inicio, inicio + dur));
  const v = de + (ate - de) * x;
  const txt = (sinal ? (v >= 0 ? "+" : "−") : v < 0 ? "−" : "") + prefixo + fmtBR(v);
  const rodando = x > 0 && x < 1;
  return (
    <span style={{ fontFamily: MONO, fontSize: tamanho, fontWeight: peso, color: cor, letterSpacing: -tamanho * 0.03, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", filter: rodando && x < 0.8 ? `blur(${(0.8 - x) * 2}px)` : undefined }}>
      {txt}
    </span>
  );
};

/* ------------------------------------------------------------ ÍCONES
   Vetoriais, traço 2, sem emoji. */
export const ICONES: Record<string, React.ReactNode> = {
  alvo: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /></>,
  grafico: <><path d="M3 3v18h18" /><path d="M7 15l3-3 4 4 5-6" /></>,
  sino: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  cadeado: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  usuarios: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 12 0v1" /><path d="M16 4a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  mais: <path d="M12 5v14M5 12h14" />,
  bandeira: <><path d="M4 22V4" /><path d="M4 4h13l-2 4 2 4H4" /></>,
  alerta: <><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  trofeu: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />,
  tabela: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 4v16" /></>,
  seta: <path d="M5 12h14M13 6l6 6-6 6" />,
  setaCima: <path d="M12 19V5M6 11l6-6 6 6" />,
  painel: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  moeda: <><circle cx="12" cy="12" r="9" /><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.1 0 2.9 6 1.4 6 4.2 0 1.2-1.3 2.2-3 2.2-1.4 0-2.6-.6-3.1-1.6M12 6v2M12 16v2" /></>,
  caixa: <><path d="M3 8h18v12H3z" /><path d="M3 8l2-4h14l2 4M9 12h6" /></>,
  camera: <><path d="M3 7h4l2-3h6l2 3h4v13H3z" /><circle cx="12" cy="13" r="4" /></>,
};
export const Ico: React.FC<{ n: string; s?: number; c?: string; w?: number; style?: React.CSSProperties }> = ({ n, s = 24, c = "currentColor", w = 2, style }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>{ICONES[n]}</svg>
);

/* grão de filme leve, determinístico por frame (dá textura ao preto) */
export const Grao: React.FC<{ op?: number }> = ({ op = 0.05 }) => {
  const frame = useCurrentFrame();
  const seed = frame % 6;
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: op, pointerEvents: "none" }}>
      <filter id={`grao${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter={`url(#grao${seed})`} />
    </svg>
  );
};

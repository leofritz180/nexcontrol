import React from "react";
import { C, FONTE, MONO } from "../brand";

/* O N DA NEX — mesma geometria e mesmas cores de app/v2/marca-n.js (traçado
   do PNG oficial). Uma fita diagonal atrás de dois postes. Cada faceta é um
   SVG próprio para ter profundidade (translateZ) de verdade. */
const FACETAS: Record<string, number[][]> = {
  esq: [[0, 9.3], [31.2, 41.6], [31.2, 100], [0, 67.4]],
  dir: [[68.8, 2.5], [100, 35.1], [100, 93.2], [68.8, 60.9]],
  fita: [[0, 9.3], [0, 2.5], [33.6, 2.5], [100, 73.2], [100, 100], [85.3, 100]],
};
const TINTA: Record<string, [string, number][]> = {
  esq: [["#2E3438", 0], ["#3C444A", 0.45], ["#545C64", 1]],
  fita: [["#F0F1F2", 0], ["#DCDFE1", 0.34], ["#C8F21D", 0.82], ["#B9D634", 1]],
  dir: [["#2F353A", 0], ["#4A5158", 0.52], ["#C9CDD1", 0.84], ["#DDE1E4", 1]],
};
function arredondar(pts: number[][], r: number) {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const ant = pts[(i - 1 + n) % n], at = pts[i], prox = pts[(i + 1) % n];
    const recuo = (de: number[], para: number[]) => { const dx = para[0] - de[0], dy = para[1] - de[1]; const comp = Math.hypot(dx, dy) || 1; const t = Math.min(r, comp * 0.4) / comp; return [de[0] + dx * t, de[1] + dy * t]; };
    const e = recuo(at, ant), s = recuo(at, prox);
    d += (i === 0 ? "M" : "L") + `${e[0].toFixed(2)} ${e[1].toFixed(2)}` + `Q${at[0]} ${at[1]} ${s[0].toFixed(2)} ${s[1].toFixed(2)}`;
  }
  return d + "Z";
}
const PATH = Object.fromEntries(Object.entries(FACETAS).map(([k, p]) => [k, arredondar(p, 7)]));

function grad(id: string, paradas: [string, number][], angulo = 158) {
  const rad = ((angulo - 90) * Math.PI) / 180, dx = Math.cos(rad) / 2, dy = Math.sin(rad) / 2;
  return (
    <linearGradient id={id} x1={0.5 - dx} y1={0.5 - dy} x2={0.5 + dx} y2={0.5 + dy}>
      {paradas.map(([c, o]) => <stop key={o} offset={o} stopColor={c} />)}
    </linearGradient>
  );
}

/** faceta com deslocamento/rotação próprios (para a montagem animada) */
const Faceta: React.FC<{ nome: string; tam: number; z: number; brilho: number; extra?: string; op?: number; uid: string }> = ({ nome, tam, z, brilho, extra = "", op = 1, uid }) => {
  const gid = `${uid}-g-${nome}`, cid = `${uid}-c-${nome}`, bid = `${uid}-b-${nome}`;
  return (
    <svg viewBox="-3 0 106 106" width={tam} height={tam} style={{ position: "absolute", inset: 0, transform: `translateZ(${z}px) ${extra}`, opacity: op, overflow: "visible" }}>
      <defs>
        {grad(gid, TINTA[nome])}
        <clipPath id={cid}><path d={PATH[nome]} /></clipPath>
        <linearGradient id={bid} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <path d={PATH[nome]} fill={`url(#${gid})`} />
      <g clipPath={`url(#${cid})`}><rect x={-40 + brilho * 170} y="-14" width="40" height="134" fill={`url(#${bid})`} transform="skewX(-24)" /></g>
      <path d={PATH[nome]} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
    </svg>
  );
};

/** N em 3D. `monta` 0..1 traz as facetas de longe; `brilho` 0..1 passa a faixa de luz. */
export const MarcaN: React.FC<{ tam?: number; rx?: number; ry?: number; monta?: number; brilho?: number; halo?: number; uid?: string }> = ({ tam = 300, rx = 6, ry = -16, monta = 1, brilho = 0.5, halo = 1, uid = "n" }) => {
  const m = 1 - monta;
  return (
    <div style={{ width: tam, height: tam, position: "relative", perspective: tam * 4 }}>
      <div style={{ position: "absolute", inset: -tam * 0.35, borderRadius: "50%", background: `radial-gradient(circle, ${C.lime}40 0%, ${C.lime}10 35%, transparent 68%)`, opacity: halo, filter: `blur(${tam * 0.06}px)` }} />
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
        <Faceta uid={uid} nome="fita" tam={tam} z={-17 * (tam / 300)} brilho={brilho} extra={`translate(${m * tam * 0.9}px, ${-m * tam * 0.7}px) rotate(${m * 40}deg)`} op={Math.min(1, monta * 2.5)} />
        <Faceta uid={uid} nome="esq" tam={tam} z={13 * (tam / 300)} brilho={brilho} extra={`translate(${-m * tam * 1.1}px, ${m * tam * 0.3}px) rotate(${-m * 30}deg)`} op={Math.min(1, monta * 2.5)} />
        <Faceta uid={uid} nome="dir" tam={tam} z={13 * (tam / 300)} brilho={brilho} extra={`translate(${m * tam * 1.1}px, ${m * tam * 0.6}px) rotate(${m * 25}deg)`} op={Math.min(1, monta * 2.5)} />
      </div>
    </div>
  );
};

/** N plano e pequeno (ícone de app, rail) */
export const MarcaPlana: React.FC<{ tam?: number; uid?: string }> = ({ tam = 40, uid = "p" }) => (
  <svg viewBox="-3 0 106 106" width={tam} height={tam}>
    <defs>{["fita", "esq", "dir"].map((k) => <React.Fragment key={k}>{grad(`${uid}-${k}`, TINTA[k])}</React.Fragment>)}</defs>
    {["fita", "esq", "dir"].map((k) => <path key={k} d={PATH[k]} fill={`url(#${uid}-${k})`} />)}
  </svg>
);

/** wordmark: "Nex Control" + selo 2.0, como no topo da landing */
export const Wordmark: React.FC<{ tam?: number; cor?: string }> = ({ tam = 64, cor = C.tinta }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: tam * 0.3 }}>
    <span style={{ fontFamily: FONTE, fontWeight: 600, fontSize: tam, letterSpacing: -tam * 0.03, color: cor }}>Nex Control</span>
    <span style={{ fontFamily: MONO, fontSize: tam * 0.3, letterSpacing: tam * 0.02, color: C.cinza, border: `1px solid ${C.linha2}`, borderRadius: tam * 0.1, padding: `${tam * 0.07}px ${tam * 0.12}px` }}>2.0</span>
  </div>
);

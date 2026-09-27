/* TRILHA CINEMÁTICA ORIGINAL (pedido do dono em 27/09) — composta em código,
   sem sample. Piano de feltro, cordas, sub, pulsação de coração, risers,
   impactos e resolução em maior, ancorada nos momentos do vídeo:
     gancho      cordas graves em Ré menor + coração, tensão crescendo
     virada      impacto + silêncio curto + piano entra (a planilha racha)
     produto     piano em arpejo + cordas abrindo (Dm Bb F C)
     fechamento  swell de cordas no "lucro final calculado"
     alerta      cordas em trêmulo, coração volta (tensão)
     controle    riser + tambores crescendo
     marca       impacto e resolução em Fá maior, brilho no CTA
     node tools/musica-cine.mjs bio|saiba → out/musica-cine-<cta>.wav */
import path from "node:path";
import { criarSynth } from "./synth.mjs";
import { linha, RAIZ, FPS } from "./tempo.mjs";
import { gravarWav, db } from "./audio.mjs";

const cta = process.argv[2] || "bio";
const { abs, cenas, DUR, P0, F } = linha(cta);
const T = (fr) => fr / FPS;
const t0v = T(P0), tF = T(F), tFech = T(cenas[5].from), tCalc = T(abs(6, "calculado")), tAl = T(cenas[7].from), tEq = T(cenas[8].from), tCt = T(cenas[9].from);
const tCta = cta === "bio" ? T(abs(10, "link")) : T(abs(10, "saiba"));

const synth = criarSynth(DUR);
const { PI2, voz, biquad, env, prng, reverb, secoL, secoR, envioL, envioR, N } = synth;
const nota = (m) => 440 * Math.pow(2, (m - 69) / 12);
const r = prng(1709);
const saw = (f, t) => 2 * ((f * t) % 1) - 1;

const piano = (m, t0, vel = 0.5, dur = 1.8, pan = 0) => {
  const f = nota(m) * (1 + (r() - 0.5) * 0.002), lp = biquad("lp", 2400 + vel * 1800, 0.7);
  voz(t0, dur, (k, t) => lp((Math.sin(PI2 * f * t) * Math.exp(-t / 1.2) + 0.45 * Math.sin(PI2 * f * 2.003 * t) * Math.exp(-t / 0.45) + 0.18 * Math.sin(PI2 * f * 3.01 * t) * Math.exp(-t / 0.22) + 0.06 * Math.sin(PI2 * f * 4.02 * t) * Math.exp(-t / 0.12)) * Math.min(1, t / 0.004)), { gan: 0.17 * vel, pan, rev: 0.4 });
};
const cordas = (notas, t0, dur, gan = 0.05, brilho = 0.4, ataque = 0.9, tremulo = 0) => notas.forEach((m, j) => {
  const f = nota(m), lp = biquad("lp", 500 + brilho * 2600, 0.8);
  voz(t0, dur + 1.4, (k, t) => {
    const e = Math.min(1, t / ataque) * (t > dur ? Math.exp(-(t - dur) / 0.7) : 1);
    const vib = 1 + 0.004 * Math.sin(PI2 * 5.2 * t + j);
    const trem = tremulo ? 0.55 + 0.45 * Math.sin(PI2 * 11 * t + j) : 1;
    return lp((saw(f * vib, t) + saw(f * 1.006 * vib, t) + saw(f * 0.994 * vib, t)) / 3) * e * trem;
  }, { gan, pan: (j - (notas.length - 1) / 2) * 0.35, rev: 0.55 });
});
const sub = (m, t0, dur, g = 0.26) => { const f = nota(m); voz(t0, dur + 0.4, (k, t) => (Math.sin(PI2 * f * t) + 0.25 * Math.sin(PI2 * f * 2 * t)) * Math.min(1, t / 0.08) * (t > dur ? Math.exp(-(t - dur) / 0.25) : 1), { gan: g, rev: 0.05 }); };
const coracao = (t0, g = 0.4) => voz(t0, 0.3, (k, t) => Math.sin(PI2 * (60 + 40 * Math.exp(-t / 0.035)) * t) * env(t, 0.002, 0.11), { gan: g, rev: 0.1 });
const tambor = (t0, g = 0.35) => { const nz = prng(Math.round(t0 * 991)), lp = biquad("lp", 900, 0.7); voz(t0, 0.6, (k, t) => Math.sin(PI2 * (70 + 30 * Math.exp(-t / 0.05)) * t) * env(t, 0.002, 0.25) * 0.8 + lp(nz() * 2 - 1) * env(t, 0.001, 0.04) * 0.4, { gan: g, rev: 0.35 }); };
const riser = (t0, dur, g = 0.33) => { const nz = prng(77 + Math.round(t0)), bp = biquad("bp", 300, 1.2); voz(t0, dur, (k, t) => { const x = t / dur; if (k % 32 === 0) bp.set(300 + 5200 * x * x, 1.2); return bp(nz() * 2 - 1) * x * x; }, { gan: g, rev: 0.5 }); };
const impacto = (t0, g = 0.75) => {
  voz(t0, 3.4, (k, t) => Math.sin(PI2 * (42 + 42 * Math.exp(-t / 0.09)) * t) * env(t, 0.002, 0.85), { gan: g, rev: 0.3 });
  const nz = prng(99 + Math.round(t0)), lp = biquad("lp", 700, 0.7); voz(t0, 0.8, (k, t) => lp(nz() * 2 - 1) * env(t, 0.001, 0.13), { gan: 0.45, rev: 0.75 });
};
const brilho = (t0, base = 1396.9) => [0, 7, 12, 16, 19, 24].forEach((n, j) => { const f = base * Math.pow(2, n / 12); voz(t0 + j * 0.05, 2.4, (k, t) => Math.sin(PI2 * f * t) * env(t, 0.003, 0.55), { gan: 0.045, pan: -0.6 + j * 0.24, rev: 0.8 }); });

/* harmonia: Ré menor. Dm(50,53,57) Bb(46,50,53) F(53,57,60) C(48,52,55) → fim em Fá maior */
const PROG = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]];
const BPM = 92, B = 60 / BPM, BAR = 4 * B;
const acorde = (t) => PROG[(((Math.floor((t - t0v) / (2 * BAR))) % 4) + 4) % 4];

/* 1 · gancho: cordas graves + coração acelerando + riser até a virada */
cordas([38, 45, 50], 0.0, t0v - 0.1, 0.05, 0.25, 1.2);
cordas([62, 65], T(cenas[1].from), t0v - T(cenas[1].from) - 0.1, 0.035, 0.45, 0.4, 1);
sub(38, 0.0, t0v - 0.1, 0.2);
{ let t = 0.3, passo = B * 1.4; while (t < t0v - 0.4) { coracao(t, 0.38); coracao(t + passo * 0.32, 0.24); t += passo; passo = Math.max(B * 0.7, passo * 0.93); } }
riser(t0v - 1.5, 1.5, 0.34);

/* 2 · virada: impacto, respiro, piano entra */
impacto(t0v, 0.8);
brilho(t0v + 0.05);
for (let t = t0v + 0.45, i = 0; t < tF - 0.1; t += B / 2, i++) {
  const ac = acorde(t);
  const tenso = t >= tAl - 0.05 && t < tEq - 0.05;
  if (tenso && i % 2) continue;                                    // no alerta, metade das notas
  const m = ac[[0, 1, 2, 1, 2, 0, 1, 2][i % 8]] + 12 + (i % 8 === 6 ? 12 : 0);
  piano(m, t + (r() - 0.5) * 0.01, (tenso ? 0.4 : 0.55) * (0.85 + r() * 0.3), 1.6, (r() - 0.5) * 0.5);
}
/* cordas e sub pela progressão */
for (let t = t0v + 0.3; t < tF - 0.05; t += 2 * BAR) {
  const ac = acorde(t + 0.01), fim = Math.min(t + 2 * BAR, tF - 0.05);
  const tenso = t >= tAl - 0.1 && t < tEq - 0.1;
  const inten = tenso ? 0.35 : t >= tCt ? 0.9 : t >= tFech ? 0.7 : 0.5;
  cordas(ac.map((m) => m + 12), t, fim - t, 0.045 * (0.6 + inten * 0.6), inten, 0.8, tenso ? 1 : 0);
  sub(ac[0] - 12, t, fim - t, 0.22);
}
/* 3 · fechamento: swell no "lucro final calculado" */
cordas([65, 69, 72, 77], tCalc - 0.6, 1.6, 0.07, 0.9, 0.5);
brilho(tCalc, 1760);
/* 4 · alerta: coração volta */
for (let t = tAl; t < tEq - 0.2; t += B) { coracao(t, 0.34); coracao(t + B * 0.32, 0.2); }
/* 5 · controle: tambores crescendo + riser */
{ let t = tCt, passo = B; while (t < tF - 0.1) { tambor(t, 0.2 + 0.35 * ((t - tCt) / (tF - tCt))); t += passo; passo = Math.max(B / 4, passo * 0.86); } riser(tCt, tF - tCt, 0.32); }
/* 6 · marca: impacto e Fá maior até o fim */
impacto(tF, 0.9);
cordas([41, 48, 53, 57, 60, 65], tF, DUR - tF, 0.06, 0.6, 1.0);
sub(29, tF, DUR - tF - 0.4, 0.26);
[77, 81, 84, 89].forEach((m, j) => piano(m, tF + 0.15 + j * 0.17, 0.65, 3.4, -0.3 + j * 0.2));
brilho(tCta, 2093);

for (let i = 0; i < N; i++) if (!Number.isFinite(secoL[i] + secoR[i] + envioL[i] + envioR[i])) { console.error("NaN na trilha em", (i / 48000).toFixed(3)); process.exit(2); }
const rl = reverb(envioL, [1557, 1617, 1491, 1422].map((d) => Math.round(d * 2.6)), 0.88);
const rr = reverb(envioR, [1580, 1640, 1514, 1445].map((d) => Math.round(d * 2.6)), 0.88);
const L = new Float32Array(N), R = new Float32Array(N);
const hl = biquad("hp", 30, 0.7), hr = biquad("hp", 30, 0.7);
const pts = [[0, 0.8], [t0v - 0.05, 1.05], [t0v + 0.15, 1], [t0v + 0.4, 0.85], [tCalc, 1], [tAl, 0.8], [tEq, 0.95], [tF - 0.05, 1.1], [tF + 0.3, 1], [DUR - 0.9, 0.95], [DUR, 0]];
const curva = (t) => { for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, ga] = pts[i - 1], [b, gb] = pts[i]; const x = (t - a) / Math.max(1e-6, b - a); return ga + (gb - ga) * x; } return 0; };
let p = 0;
for (let i = 0; i < N; i++) { const g = curva(i / 48000); L[i] = hl(secoL[i] + rl[i] * 0.16) * g; R[i] = hr(secoR[i] + rr[i] * 0.16) * g; p = Math.max(p, Math.abs(L[i]), Math.abs(R[i])); }
const gn = db(-1) / (p || 1);
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * gn * 1.2) / Math.tanh(1.2); R[i] = Math.tanh(R[i] * gn * 1.2) / Math.tanh(1.2); }
gravarWav(path.join(RAIZ, "out", `musica-cine-${cta}.wav`), L, R);
console.log(`trilha cinemática ${cta}: ${DUR.toFixed(2)}s · virada ${t0v.toFixed(2)}s · marca ${tF.toFixed(2)}s`);

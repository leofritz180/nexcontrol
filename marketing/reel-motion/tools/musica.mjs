/* TRILHA ORIGINAL — composta em código (sem sample, sem música de terceiros).
   Eletrônica escura e contida, em Lá menor, 100 BPM, com a GRADE alinhada à
   virada: o tempo 1 do compasso cai no frame em que a planilha racha.
     A  gancho      sub pulsando, tique de relógio, pluck fechado, riser
     B  drop        bumbo, palma, baixo, arpejo e pad (Am F C G)
     C  alerta      bumbo sai, o filtro fecha (tensão), volta na equipe
     D  build       caixa acelerando + riser até a marca
     E  marca       impacto e resolução em Dó maior até o fim
     node tools/musica.mjs bio|saiba → out/musica-<cta>.wav */
import path from "node:path";
import { criarSynth } from "./synth.mjs";
import { linha, RAIZ, FPS } from "./tempo.mjs";
import { gravarWav, db } from "./audio.mjs";

const cta = process.argv[2] || "bio";
const L = linha(cta);
const { abs, cenas, DUR, P0, F } = L;
const T = (fr) => fr / FPS;
const tP0 = T(P0), tF = T(F), tAl = T(cenas[7].from), tEq = T(cenas[8].from), tCt = T(cenas[9].from);

const synth = criarSynth(DUR);
const { PI2, voz, biquad, env, prng, reverb, secoL, secoR, envioL, envioR, N } = synth;
const nota = (m) => 440 * Math.pow(2, (m - 69) / 12);
const r = prng(2609);
const BPM = 100, B = 60 / BPM, BAR = 4 * B;
const saw = (f, t) => 2 * ((f * t) % 1) - 1;

/* grade: compasso n começa em tP0 + n*BAR (n pode ser negativo, no gancho) */
const compasso = (t) => Math.floor((t - tP0) / BAR);
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
const acorde = (t) => PROG[((compasso(t) % 4) + 4) % 4];

/* bumbos: para o sidechain do pad/baixo */
const kicks = [];
const temKick = (t) => (t >= tP0 && t < tAl - 0.05) || (t >= tEq - 0.05 && t < tF - 0.9);
for (let t = tP0; t < tF - 0.9; t += B) if (temKick(t)) kicks.push(t);
const side = (ta) => { let d = 9; for (let i = kicks.length - 1; i >= 0; i--) if (kicks[i] <= ta) { d = ta - kicks[i]; break; } return 1 - 0.55 * Math.exp(-d / 0.11); };

/* ---------------- instrumentos ---------------- */
const kick = (t0, g = 0.8) => voz(t0, 0.45, (k, t) => Math.sin(PI2 * (46 + 90 * Math.exp(-t / 0.035)) * t) * env(t, 0.001, 0.2) + 0.25 * Math.sin(PI2 * 3000 * t) * env(t, 0.0002, 0.002), { gan: g, rev: 0.02 });
const palma = (t0, g = 0.28) => { const nz = prng(Math.round(t0 * 997)), bp = biquad("bp", 1400, 0.9); voz(t0, 0.3, (k, t) => bp(nz() * 2 - 1) * (env(t, 0.0005, 0.008) + env(Math.max(0, t - 0.011), 0.0005, 0.008) * (t > 0.011) + env(Math.max(0, t - 0.022), 0.0005, 0.06) * (t > 0.022)), { gan: g, pan: 0.05, rev: 0.35 }); };
const chimbal = (t0, g = 0.06, aberto = false) => { const nz = prng(Math.round(t0 * 1000)), hp = biquad("hp", 8000, 0.7); voz(t0, aberto ? 0.2 : 0.05, (k, t) => hp(nz() * 2 - 1) * env(t, 0.0005, aberto ? 0.07 : 0.012), { gan: g, pan: 0.25, rev: 0.15 }); };
const pluck = (m, t0, vel, brilho, pan = 0, dur = 0.5) => { const f = nota(m), lp = biquad("lp", 800, 1.4); voz(t0, dur, (k, t) => { if (k % 32 === 0) lp.set(300 + brilho * 5200 * Math.exp(-t / 0.09) + 200, 1.4); return lp(saw(f, t) * 0.6 + saw(f * 1.004, t) * 0.4) * env(t, 0.002, 0.16) * side(t0 + t); }, { gan: 0.1 * vel, pan, rev: 0.35 }); };
const baixo = (m, t0, dur, g = 0.22) => { const f = nota(m), lp = biquad("lp", 420, 1.1); voz(t0, dur + 0.05, (k, t) => (lp(saw(f, t)) * 0.7 + Math.sin(PI2 * f * t) * 0.6) * Math.min(1, t / 0.005) * (t > dur ? Math.exp(-(t - dur) / 0.03) : 1) * side(t0 + t), { gan: g, rev: 0.03 }); };
const pad = (notas, t0, dur, g, brilho = 0.4, ataque = 0.6) => notas.forEach((m, j) => { const f = nota(m), lp = biquad("lp", 400 + brilho * 2400, 0.8); voz(t0, dur + 1.2, (k, t) => { const e = Math.min(1, t / ataque) * (t > dur ? Math.exp(-(t - dur) / 0.6) : 1); const v = 1 + 0.003 * Math.sin(PI2 * 4.8 * t + j); return lp((saw(f * v, t) + saw(f * 1.007 * v, t) + saw(f * 0.993 * v, t)) / 3) * e * side(t0 + t); }, { gan: g, pan: (j - (notas.length - 1) / 2) * 0.4, rev: 0.55 }); });
const sub = (m, t0, dur, g = 0.3) => { const f = nota(m); voz(t0, dur + 0.3, (k, t) => Math.sin(PI2 * f * t) * Math.min(1, t / 0.05) * (t > dur ? Math.exp(-(t - dur) / 0.2) : 1), { gan: g, rev: 0.03 }); };
const riser = (t0, dur, g = 0.3) => { const nz = prng(77 + Math.round(t0)), bp = biquad("bp", 300, 1.2); voz(t0, dur, (k, t) => { const x = t / dur; if (k % 32 === 0) bp.set(250 + 6000 * x * x, 1.3); return bp(nz() * 2 - 1) * x * x; }, { gan: g, rev: 0.5 }); };
const impacto = (t0, g = 0.7) => { voz(t0, 3, (k, t) => Math.sin(PI2 * (40 + 50 * Math.exp(-t / 0.08)) * t) * env(t, 0.002, 0.7), { gan: g, rev: 0.3 }); const nz = prng(99), lp = biquad("lp", 900, 0.7); voz(t0, 0.8, (k, t) => lp(nz() * 2 - 1) * env(t, 0.001, 0.14), { gan: 0.4, rev: 0.7 }); };
const caixa = (t0, g) => { const nz = prng(Math.round(t0 * 733)), bp = biquad("bp", 2000, 0.8); voz(t0, 0.12, (k, t) => (bp(nz() * 2 - 1) * 0.8 + 0.3 * Math.sin(PI2 * 200 * t)) * env(t, 0.0005, 0.04), { gan: g, rev: 0.3 }); };

/* ---------------- A · gancho ---------------- */
for (let t = tP0 - BAR * 3; t < tP0 - 0.02; t += B / 2) {
  if (t < 0) continue;
  sub(45, t, B / 2 - 0.05, 0.16);                     // pulso grave em Lá
  chimbal(t + B / 4, 0.035);                          // tique de relógio
}
for (let t = 0.05, i = 0; t < tP0 - 0.02; t += B / 4, i++) {
  const ac = PROG[0], m = ac[[0, 1, 2, 1][i % 4]] + 12;
  pluck(m, t, 0.55, 0.12 + 0.35 * (t / tP0), (i % 2 ? 0.25 : -0.25), 0.35); // filtro abrindo
}
pad([45, 57, 60, 64], 0, T(cenas[1].from), 0.028, 0.25, 1.2);
pad([44, 56, 59, 63], T(cenas[1].from), tP0 - T(cenas[1].from) - 0.1, 0.03, 0.3, 0.3); // meio tom abaixo: "não bate"
riser(tP0 - 1.6, 1.6, 0.32);

/* ---------------- B/C/D · corpo ---------------- */
impacto(tP0, 0.75);
for (const t of kicks) kick(t, 0.8);
for (let t = tP0 + B; t < tF - 0.9; t += 2 * B) if (temKick(t)) palma(t, 0.24);
for (let t = tP0; t < tF - 0.9; t += B / 2) chimbal(t + B / 4, t >= tAl && t < tEq ? 0.03 : 0.055, (Math.round((t - tP0) / (B / 2)) % 8) === 7);
for (let n = 0; tP0 + n * BAR < tF; n++) {
  const t0 = tP0 + n * BAR, ac = PROG[n % 4], fim = Math.min(t0 + BAR, tF - 0.05);
  const tenso = t0 >= tAl - 0.1 && t0 < tEq - 0.1;
  pad(ac.map((m) => m + 12), t0, fim - t0, tenso ? 0.022 : 0.03, tenso ? 0.2 : 0.5, 0.25);
  /* baixo em colcheias (menos no alerta: só semibreve) */
  if (tenso) baixo(ac[0] - 24, t0, fim - t0 - 0.05, 0.2);
  else for (let t = t0; t < fim - 0.01; t += B / 2) baixo(ac[0] - 24 + ((Math.round((t - t0) / (B / 2)) % 4) === 3 ? 12 : 0), t, B / 2 - 0.04);
  /* arpejo em semicolcheias, brilho sobe ao longo do vídeo */
  const brilho = tenso ? 0.18 : 0.35 + 0.4 * Math.min(1, (t0 - tP0) / (tF - tP0));
  for (let t = t0, i = 0; t < fim - 0.01; t += B / 4, i++) {
    const m = ac[[0, 1, 2, 1, 2, 0, 1, 2][i % 8]] + (i % 8 === 6 ? 24 : 12);
    pluck(m, t + (r() - 0.5) * 0.004, tenso ? 0.5 : 0.75, brilho, (i % 2 ? 0.3 : -0.3), 0.4);
  }
}
/* alerta: o sino de fundo e um pulso grave "de coração" */
for (let t = tAl; t < tEq - 0.1; t += B) { kick(t, 0.35); kick(t + B * 0.35, 0.22); }
/* build: caixa acelerando + riser até a marca */
{ const a = tCt, b = tF - 0.05; let t = a, passo = B / 2; while (t < b) { caixa(t, 0.08 + 0.2 * ((t - a) / (b - a))); t += passo; passo = Math.max(B / 8, passo * 0.9); } riser(tCt, tF - tCt, 0.3); }

/* ---------------- E · marca ---------------- */
impacto(tF, 0.85);
pad([48, 55, 60, 64, 67], tF, DUR - tF, 0.045, 0.55, 0.8);
sub(36, tF, DUR - tF - 0.4, 0.26);
[72, 76, 79, 84, 88].forEach((m, j) => pluck(m, tF + 0.1 + j * B / 4, 0.8, 0.6, -0.4 + j * 0.2, 1.4));
{ const tc = cta === "bio" ? T(abs(10, "link")) : T(abs(10, "saiba")); [84, 88, 91].forEach((m, j) => pluck(m, tc + j * 0.09, 0.7, 0.7, -0.3 + j * 0.3, 1.2)); }

/* ---------------- master ---------------- */
for (let i = 0; i < N; i++) if (!Number.isFinite(secoL[i] + secoR[i] + envioL[i] + envioR[i])) { console.error("NaN na trilha em", (i / 48000).toFixed(3), "s"); process.exit(2); }
const rl = reverb(envioL, [1557, 1617, 1491, 1422].map((d) => Math.round(d * 2.4)), 0.86);
const rr = reverb(envioR, [1580, 1640, 1514, 1445].map((d) => Math.round(d * 2.4)), 0.86);
const Lm = new Float32Array(N), Rm = new Float32Array(N);
const hl = biquad("hp", 28, 0.7), hr = biquad("hp", 28, 0.7);
/* automação de volume do todo */
const pts = [[0, 0.75], [tP0 - 0.05, 0.9], [tP0 + 0.1, 1], [tAl, 1], [tAl + 0.4, 0.8], [tEq, 0.95], [tCt, 0.95], [tF - 0.05, 1.05], [tF + 0.3, 1], [DUR - 0.8, 0.9], [DUR, 0]];
const curva = (t) => { for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, ga] = pts[i - 1], [b, gb] = pts[i]; const x = (t - a) / Math.max(1e-6, b - a); return ga + (gb - ga) * x; } return 0; };
let p = 0;
for (let i = 0; i < N; i++) { const g = curva(i / 48000); Lm[i] = hl(secoL[i] + rl[i] * 0.14) * g; Rm[i] = hr(secoR[i] + rr[i] * 0.14) * g; p = Math.max(p, Math.abs(Lm[i]), Math.abs(Rm[i])); }
const gn = db(-1) / (p || 1);
for (let i = 0; i < N; i++) { Lm[i] = Math.tanh(Lm[i] * gn * 1.3) / Math.tanh(1.3); Rm[i] = Math.tanh(Rm[i] * gn * 1.3) / Math.tanh(1.3); }
gravarWav(path.join(RAIZ, "out", `musica-${cta}.wav`), Lm, Rm);
console.log(`trilha ${cta}: ${DUR.toFixed(2)}s · drop ${tP0.toFixed(2)}s · alerta ${tAl.toFixed(2)}s · marca ${tF.toFixed(2)}s · ${kicks.length} bumbos`);

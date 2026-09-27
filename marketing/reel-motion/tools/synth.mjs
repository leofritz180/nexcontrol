/* MOTOR DE SÍNTESE — extraído de marketing/reel/sfx.mjs (mesmos instrumentos
   do Reel 1/2) e embrulhado numa fábrica, para o reel narrado usar sem
   Playwright. Determinístico (PRNG com seed). */
export function criarSynth(DUR) {
  const SR = 48000, N = Math.round(SR * DUR); // arredondado: SR*DUR fracionario deixava a ultima amostra fora do array (NaN)
  /* ganho global ajustável por cue (o sfx.mjs muda antes de cada instrumento) */
  const ajuste = { ganho: 1 };
/* ---------------- utilidades ---------------- */
function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const PI2 = Math.PI * 2;
const secoL = new Float32Array(N), secoR = new Float32Array(N);
const envioL = new Float32Array(N), envioR = new Float32Array(N);

/** escreve uma voz: gen(i, tempoLocal) → amostra; pan -1..1; rev = quanto vai para o reverb */
function voz(t0, dur, gen, { gan = 1, pan = 0, rev = 0.15 } = {}) {
  const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  const gl = gan * ajuste.ganho * Math.cos(((pan + 1) * Math.PI) / 4), gr = gan * ajuste.ganho * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let k = 0; k < n; k++) {
    const i = i0 + k; if (i < 0 || i >= N) continue;
    const s = gen(k, k / SR);
    secoL[i] += s * gl; secoR[i] += s * gr;
    envioL[i] += s * gl * rev; envioR[i] += s * gr * rev;
  }
}
/* biquad (RBJ) */
function biquad(tipo, f, q) {
  const w = (PI2 * f) / SR, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (tipo === "lp") { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
  else if (tipo === "hp") { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
  else { b0 = al; b1 = 0; b2 = -al; }
  a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
  const c = [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const f_ = (x) => { const y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
  f_.set = (nf, nq = q) => { const w2 = (PI2 * nf) / SR, cw2 = Math.cos(w2), sw2 = Math.sin(w2), al2 = sw2 / (2 * nq); let bb0, bb1, bb2; if (tipo === "lp") { bb0 = (1 - cw2) / 2; bb1 = 1 - cw2; bb2 = bb0; } else if (tipo === "hp") { bb0 = (1 + cw2) / 2; bb1 = -(1 + cw2); bb2 = bb0; } else { bb0 = al2; bb1 = 0; bb2 = -al2; } const aa0 = 1 + al2; c[0] = bb0 / aa0; c[1] = bb1 / aa0; c[2] = bb2 / aa0; c[3] = (-2 * cw2) / aa0; c[4] = (1 - al2) / aa0; };
  return f_;
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const ESCALA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36]; // pentatônica
const hz = (semi, base = 523.25) => base * Math.pow(2, semi / 12);

/* ---------------- instrumentos ---------------- */
const INSTR = {
  tecla(c) {
    /* "tic" de teclado de CELULAR (referência do dono: som de digitação no
       celular): estalo seco e curtíssimo, brilho em ~3 kHz e um corpinho de
       plástico. Uma batida por LETRA, no instante em que ela aparece.
       Espaço soa um tom abaixo, como no teclado do iPhone. */
    const r = prng(1000 + c.i), nz = prng(c.i * 31 + 7);
    const var_ = 0.94 + r() * 0.12;
    const fc = (c.espaco ? 1700 : 3100) * var_;
    const bp = biquad("bp", fc, 2.2), hp = biquad("hp", 900, 0.7);
    const ftom = (c.espaco ? 1150 : 1900) * var_, fcorpo = (c.espaco ? 260 : 380) * var_;
    const gan = (c.espaco ? 0.42 : 0.5) * (0.85 + r() * 0.3);
    voz(c.t, 0.045, (k, t) => {
      const estalo = bp((nz() * 2 - 1) * env(t, 0.0003, 0.0022));
      const tom = 0.35 * Math.sin(PI2 * ftom * t) * env(t, 0.0004, 0.0045);
      const corpo = 0.28 * Math.sin(PI2 * fcorpo * t) * env(t, 0.0008, 0.007);
      return hp(estalo * 1.6 + tom) + corpo;
    }, { gan, pan: (r() - 0.5) * 0.12, rev: 0.02 });
  },
  enter(c) {
    const nz = prng(77), f = biquad("bp", 1800, 1);
    voz(c.t, 0.25, (k, t) => 0.6 * f((nz() * 2 - 1) * env(t, 0.001, 0.012)) + 0.7 * Math.sin(PI2 * (95 - 30 * t) * t) * env(t, 0.002, 0.07), { gan: 0.9, rev: 0.12 });
  },
  whoosh(c) {
    const dur = 0.8, nz = prng(Math.round(c.t * 100)), f = biquad("bp", 400, 0.9);
    voz(c.t - 0.45, dur, (k, t) => { const x = t / dur; f.set(300 + 3200 * Math.sin(Math.PI * Math.min(1, x * 1.1)) ** 2, 0.8); return f(nz() * 2 - 1) * Math.sin(Math.PI * x) ** 2; }, { gan: c.leve ? 0.35 : 0.55, pan: 0, rev: 0.25 });
  },
  sonar(c) {
    voz(c.t, 2.2, (k, t) => (Math.sin(PI2 * (1180 - 40 * t) * t) + 0.25 * Math.sin(PI2 * 2360 * t)) * env(t, 0.003, 0.45), { gan: 0.32, rev: 0.6 });
  },
  blip(c) {
    const f = hz(ESCALA[c.nota % ESCALA.length], c.semSite ? 880 : 440);
    const r = prng(500 + c.nota);
    voz(c.t, 0.5, (k, t) => (Math.sin(PI2 * f * t) + 0.18 * Math.sin(PI2 * f * 2 * t)) * env(t, 0.002, c.semSite ? 0.09 : 0.05), { gan: c.semSite ? 0.26 : 0.14, pan: (r() - 0.5) * 1.2, rev: 0.45 });
  },
  pop(c) {
    const base = hz(ESCALA[(c.tom ?? 0) + 2], 330);
    voz(c.t, 0.18, (k, t) => Math.sin(PI2 * (base * (1 + 2.2 * Math.exp(-t / 0.012))) * t) * env(t, 0.001, 0.045), { gan: 0.5, rev: 0.2 });
  },
  clique(c) {
    const nz = prng(9), f = biquad("hp", 3000, 0.7);
    voz(c.t, 0.06, (k, t) => 0.8 * f((nz() * 2 - 1) * env(t, 0.0003, 0.003)) + 0.5 * Math.sin(PI2 * 1900 * t) * env(t, 0.0005, 0.008), { gan: 0.5, rev: 0.08 });
  },
  tick(c) {
    const f = c.agudo ? 4200 + (c.i ?? 0) * 90 : c.alto ? 2600 : 3100 + (c.i ?? 0) * 25;
    voz(c.t, 0.05, (k, t) => Math.sin(PI2 * f * t) * env(t, 0.0005, 0.007), { gan: c.leve ? 0.16 : c.alto ? 0.4 : 0.26, pan: ((c.i ?? 0) % 3 - 1) * 0.3, rev: 0.15 });
  },
  riser(c) {
    const nz = prng(4), f = biquad("bp", 500, 2);
    voz(c.t, c.dur + 0.2, (k, t) => { const x = Math.min(1, t / c.dur); f.set(400 + 3500 * x * x, 2.5); return (0.5 * f(nz() * 2 - 1) + 0.12 * Math.sin(PI2 * (180 + 260 * x) * t)) * x * x * (t > c.dur ? Math.exp(-(t - c.dur) / 0.05) : 1); }, { gan: 0.16, rev: 0.3 });
  },
  bloco(c) {
    const nz = prng(60 + c.i), f = biquad("bp", 900, 1.2);
    voz(c.t - 0.25, 0.45, (k, t) => { const x = t / 0.45; f.set(600 + 2400 * x, 1.2); return f(nz() * 2 - 1) * Math.sin(Math.PI * x) ** 3 * 0.8; }, { gan: 0.22, rev: 0.2 });
    INSTR.pop({ t: c.t, tom: c.i + 1 });
  },
  bolha(c) {
    voz(c.t, 0.3, (k, t) => Math.sin(PI2 * (420 + 900 * (1 - Math.exp(-t / 0.03))) * t) * env(t, 0.002, 0.06), { gan: 0.35, rev: 0.25 });
  },
  chime(c) {
    for (const [j, n] of c.notas.entries()) {
      const f = hz(n, 1046.5);
      voz(c.t + j * 0.085, 2.2, (k, t) => (Math.sin(PI2 * f * t) + 0.35 * Math.sin(PI2 * f * 2.76 * t) * Math.exp(-t / 0.2) + 0.12 * Math.sin(PI2 * f * 5.4 * t) * Math.exp(-t / 0.08)) * env(t, 0.002, 0.55), { gan: c.leve ? 0.12 : 0.2, pan: (j - 1) * 0.35, rev: 0.55 });
    }
  },
  contador(c) {
    /* ticks que desaceleram (a curva outExpo do número) */
    const n = c.dinheiro ? 26 : 22;
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1);
      const tt = c.t + c.dur * (-Math.log2(1 - x * 0.999) / 10);
      voz(tt, 0.03, (k, t) => Math.sin(PI2 * (c.dinheiro ? 2400 + i * 30 : 3000) * t) * env(t, 0.0004, 0.005), { gan: 0.16, pan: (i % 2 ? 0.2 : -0.2), rev: 0.1 });
    }
  },
  plink(c) {
    const f = hz(ESCALA[c.i % ESCALA.length], 660);
    voz(c.t, 0.25, (k, t) => Math.sin(PI2 * f * t) * env(t, 0.001, 0.04), { gan: 0.08, pan: -0.6 + c.i * 0.1, rev: 0.35 });
  },
  varredura(c) {
    voz(c.t, c.dur, (k, t) => { const x = t / c.dur; const f = 300 + 700 * x; return Math.sin(PI2 * f * t) * Math.sin(Math.PI * x) * 0.5; }, { gan: 0.05, rev: 0.4 });
  },
  swoosh(c) {
    const nz = prng(88 + Math.round(c.t * 10)), f = biquad("bp", 800, 1);
    voz(c.t, 0.85, (k, t) => { const x = t / 0.85; f.set(500 + 2500 * Math.sin(Math.PI * x), 1); return f(nz() * 2 - 1) * Math.sin(Math.PI * x) ** 2; }, { gan: 0.35, pan: c.pan ?? 0.3, rev: 0.25 });
  },
  pouso(c) {
    voz(c.t, 0.4, (k, t) => Math.sin(PI2 * (110 - 50 * t) * t) * env(t, 0.002, 0.08), { gan: 0.6, rev: 0.15 });
    INSTR.pop({ t: c.t, tom: 5 });
  },
  notificacao(c) {
    [[0, 0], [0.11, 7]].forEach(([dt, n]) => { const f = hz(n, 1318.5); voz(c.t + dt, 1.2, (k, t) => (Math.sin(PI2 * f * t) + 0.2 * Math.sin(PI2 * f * 3 * t) * Math.exp(-t / 0.05)) * env(t, 0.002, 0.28), { gan: 0.22, rev: 0.4 }); });
  },
  caixa(c) {
    /* "ka": clique metálico; "ching": parciais inarmônicas brilhantes */
    const nz = prng(55), f = biquad("hp", 2500, 0.7);
    voz(c.t, 0.05, (k, t) => f((nz() * 2 - 1) * env(t, 0.0005, 0.01)), { gan: 0.45, rev: 0.1 });
    const parc = [2093, 3136, 4186, 5274, 6272];
    voz(c.t + 0.07, 1.8, (k, t) => parc.reduce((s, p, j) => s + Math.sin(PI2 * p * t) * Math.exp(-t / (0.5 - j * 0.07)) / (j + 1), 0), { gan: 0.26, rev: 0.5 });
    voz(c.t, 0.5, (k, t) => Math.sin(PI2 * (80 - 30 * t) * t) * env(t, 0.003, 0.12), { gan: 0.45, rev: 0.1 });
  },
  confete(c) {
    const r = prng(303);
    for (let i = 0; i < 70; i++) {
      const tt = c.t + 0.05 + Math.pow(r(), 1.8) * 1.6, f = 3000 + r() * 5000, pan = (r() - 0.5) * 1.6;
      voz(tt, 0.02, (k, t) => Math.sin(PI2 * f * t) * env(t, 0.0003, 0.003), { gan: 0.06 * (1 - (tt - c.t) / 1.8), pan, rev: 0.3 });
    }
  },
  check(c) {
    const f = hz(ESCALA[c.i + 4], 880);
    voz(c.t, 0.6, (k, t) => (Math.sin(PI2 * f * t) + 0.3 * Math.sin(PI2 * f * 2 * t)) * env(t, 0.002, 0.12), { gan: 0.2, rev: 0.4 });
  },
  drone(c) {
    const fl = biquad("lp", 200, 0.9), fr = biquad("lp", 200, 0.9);
    const saw = (f, t) => 2 * ((f * t) % 1) - 1;
    voz(c.t, c.dur + 0.6, (k, t) => {
      const x = Math.min(1, t / c.dur);
      fl.set(180 + 1800 * x * x, 1.1);
      const s = fl(0.5 * saw(55, t) + 0.5 * saw(55.4, t)) + 0.5 * Math.sin(PI2 * 55 * t);
      const e = Math.min(1, t / 1.2) * (t > c.dur ? Math.exp(-(t - c.dur) / 0.15) : 1);
      return s * e * (0.4 + 0.6 * x);
    }, { gan: 0.14, rev: 0.25 });
    void fr;
  },
  lapis(c) {
    const nz = prng(707), f = biquad("bp", 3500, 3);
    const r = prng(708);
    let mod = 0, alvo = 0;
    voz(c.t, c.dur, (k, t) => { if (k % 480 === 0) alvo = 0.3 + r() * 0.7; mod += (alvo - mod) * 0.002; return f(nz() * 2 - 1) * mod * Math.sin(Math.PI * t / c.dur); }, { gan: 0.12, pan: -0.2, rev: 0.15 });
  },
  reverso(c) {
    const nz = prng(909), f = biquad("hp", 1500, 0.7);
    voz(c.t, c.dur, (k, t) => f(nz() * 2 - 1) * Math.pow(t / c.dur, 3), { gan: 0.35, rev: 0.5 });
  },
  impacto(c) {
    const nz = prng(1111), f = biquad("lp", 900, 0.7);
    voz(c.t, 2.6, (k, t) => Math.sin(PI2 * (38 + 45 * Math.exp(-t / 0.08)) * t) * env(t, 0.002, 0.55), { gan: 0.55, rev: 0.35 });
    voz(c.t, 0.6, (k, t) => f(nz() * 2 - 1) * env(t, 0.001, 0.09), { gan: 0.35, rev: 0.6 });
    INSTR.chime({ t: c.t + 0.02, notas: [0, 7, 12, 16], leve: true });
  },
  /* ---- reel 2 ---- */
  slam(c) {
    /* impacto de texto: sub grave + tapa de ruído + estalo */
    const nz = prng(2000 + c.i), f = biquad("lp", 1400, 0.8);
    voz(c.t, 0.5, (k, t) => Math.sin(PI2 * (72 + 60 * Math.exp(-t / 0.05)) * t) * env(t, 0.002, 0.16), { gan: 0.6, rev: 0.2 });
    voz(c.t, 0.14, (k, t) => f((nz() * 2 - 1) * env(t, 0.0008, 0.035)), { gan: 0.45, rev: 0.35 });
    INSTR.tick({ t: c.t, alto: true });
  },
  risco(c) {
    /* marcador riscando: ruído em banda que sobe e range */
    const nz = prng(3000 + c.i), f = biquad("bp", 1900, 3), dur = 0.34;
    voz(c.t, dur, (k, t) => { const x = t / dur; f.set(1500 + 1400 * x + 300 * Math.sin(t * 90), 3); return f(nz() * 2 - 1) * Math.pow(Math.sin(Math.PI * x), 0.6); }, { gan: 0.4, pan: -0.2 + 0.2 * (c.i ?? 0), rev: 0.15 });
  },
  queda(c) {
    /* três quedas em cascata: whoosh descendo + "wobble" */
    for (let i = 0; i < 3; i++) {
      const nz = prng(4000 + i), f = biquad("bp", 1200, 1), dur = 0.6, t0 = c.t + i * 0.08;
      voz(t0, dur, (k, t) => { const x = t / dur; f.set(1400 - 1100 * x, 1); return f(nz() * 2 - 1) * Math.sin(Math.PI * x) ** 2; }, { gan: 0.3, pan: (i - 1) * 0.4, rev: 0.3 });
      voz(t0, 0.5, (k, t) => Math.sin(PI2 * (520 - 380 * Math.min(1, t / 0.45)) * t) * env(t, 0.01, 0.18), { gan: 0.08, pan: (i - 1) * 0.4, rev: 0.4 });
    }
  },
  faisca(c) {
    const r = prng(5000 + c.i), f = 4200 + r() * 3200;
    voz(c.t, 0.05, (k, t) => Math.sin(PI2 * f * t) * env(t, 0.0004, 0.008), { gan: 0.07 + r() * 0.05, pan: (r() - 0.5) * 1.2, rev: 0.5 });
  },
  carimbo(c) {
    const nz = prng(6000), f = biquad("lp", 2200, 0.8);
    voz(c.t, 0.6, (k, t) => Math.sin(PI2 * (95 - 55 * Math.min(1, t / 0.2)) * t) * env(t, 0.002, 0.14), { gan: 0.6, rev: 0.2 });
    voz(c.t, 0.12, (k, t) => f((nz() * 2 - 1) * env(t, 0.0005, 0.03)), { gan: 0.4, rev: 0.4 });
    INSTR.chime({ t: c.t + 0.05, notas: [0, 7, 12], leve: true });
  },
  brilho(c) {
    [0, 4, 7, 12, 16].forEach((n, j) => { const f = hz(n, 1568); voz(c.t + j * 0.07, 1.4, (k, t) => Math.sin(PI2 * f * t) * env(t, 0.002, 0.3), { gan: 0.1, pan: -0.5 + j * 0.25, rev: 0.7 }); });
  },
};

/* ---------------- reverb (Schroeder) ---------------- */
function reverb(entrada, atrasos, ganho) {
  const out = new Float32Array(N);
  for (const d of atrasos) {
    const buf = new Float32Array(d); let p = 0, lp = 0;
    for (let i = 0; i < N; i++) { const y = buf[p]; lp = y * 0.7 + lp * 0.3; buf[p] = entrada[i] + lp * ganho; p = (p + 1) % d; out[i] += y; }
  }
  for (const d of [556, 441]) {
    const buf = new Float32Array(d); let p = 0;
    for (let i = 0; i < N; i++) { const b = buf[p]; const y = -out[i] + b; buf[p] = out[i] + b * 0.5; p = (p + 1) % d; out[i] = y; }
  }
  return out;
}


  return { SR, N, ajuste, prng, PI2, voz, biquad, env, ESCALA, hz, INSTR, reverb, secoL, secoR, envioL, envioR };
}

/* SOUND DESIGN — sintetizado, sem sample, determinístico. Cada cue sai da
   palavra narrada ou do frame exato da animação (mesma matemática das cenas).
     node tools/sfx.mjs bio|saiba   → out/sfx-<cta>.wav */
import path from "node:path";
import { criarSynth } from "./synth.mjs";
import { linha, RAIZ, FPS } from "./tempo.mjs";
import { gravarWav, db } from "./audio.mjs";

const cta = process.argv[2] || "bio";
const L = linha(cta);
const { abs, cenas, DUR, P0, F } = L;
const T = (fr) => fr / FPS;           // frame absoluto → s
const W = (i, w, oc) => T(abs(i, w, oc));
const S = (i) => T(cenas[i].from);

const synth = criarSynth(DUR);
const { PI2, voz, biquad, env, INSTR, prng, hz, reverb, secoL, secoR, envioL, envioR, N } = synth;

/* ---------------- instrumentos deste vídeo ---------------- */
Object.assign(INSTR, {
  obturador(c) { /* clique de câmera: dois estalos + sopro curto */
    const nz = prng(71), hp = biquad("hp", 2000, 0.7), bp = biquad("bp", 5000, 1.5);
    voz(c.t, 0.05, (k, t) => hp((nz() * 2 - 1) * env(t, 0.0004, 0.006)), { gan: 0.7, rev: 0.1 });
    voz(c.t + 0.06, 0.06, (k, t) => hp((nz() * 2 - 1) * env(t, 0.0004, 0.008)), { gan: 0.55, rev: 0.1 });
    voz(c.t, 0.18, (k, t) => bp(nz() * 2 - 1) * env(t, 0.002, 0.05), { gan: 0.25, rev: 0.2 });
  },
  vidro(c) { /* a planilha rachando: estalo grave + estilhaços agudos espalhados */
    const r = prng(808);
    voz(c.t, 0.5, (k, t) => Math.sin(PI2 * (70 + 50 * Math.exp(-t / 0.04)) * t) * env(t, 0.001, 0.12), { gan: 0.55, rev: 0.2 });
    const nz = prng(809), hp = biquad("hp", 3500, 0.7);
    voz(c.t, 0.25, (k, t) => hp((nz() * 2 - 1) * env(t, 0.0005, 0.05)), { gan: 0.5, rev: 0.4 });
    for (let i = 0; i < 40; i++) {
      const tt = c.t + Math.pow(r(), 1.6) * 0.9, fq = 2500 + r() * 6000, pan = (r() - 0.5) * 1.8;
      voz(tt, 0.08, (k, t) => (Math.sin(PI2 * fq * t) + 0.5 * Math.sin(PI2 * fq * 1.47 * t)) * env(t, 0.0003, 0.012 + r() * 0.01), { gan: 0.06 * (1 - (tt - c.t)), pan, rev: 0.5 });
    }
  },
  erro(c) { /* "não bate": dois tons dissonantes descendo */
    [0, 0.13].forEach((dt, j) => { const f0 = j ? 233 : 247; voz(c.t + dt, 0.32, (k, t) => { const f1 = f0 * (1 - 0.18 * t); const s = Math.sign(Math.sin(PI2 * f1 * t)) * 0.4 + Math.sin(PI2 * f1 * t) * 0.6; return s * env(t, 0.003, 0.09); }, { gan: 0.18, pan: j ? 0.2 : -0.2, rev: 0.15 }); });
  },
  sino(c) { /* sino de notificação (parciais de sino) */
    const parc = [[1, 1], [2.02, 0.5], [2.76, 0.35], [5.4, 0.15]];
    voz(c.t, 1.6, (k, t) => parc.reduce((s, [m, g]) => s + g * Math.sin(PI2 * 880 * m * t) * Math.exp(-t / (0.5 / m)), 0) * Math.min(1, t / 0.002), { gan: 0.2, rev: 0.45 });
    voz(c.t + 0.16, 1.4, (k, t) => parc.reduce((s, [m, g]) => s + g * Math.sin(PI2 * 1174.7 * m * t) * Math.exp(-t / (0.45 / m)), 0) * Math.min(1, t / 0.002), { gan: 0.16, rev: 0.45 });
  },
  vibra(c) { /* celular vibrando na mesa */
    voz(c.t, c.dur, (k, t) => { const on = Math.floor(t / 0.2) % 2 === 0 ? 1 : 0.15; return (Math.sin(PI2 * 155 * t) + 0.4 * Math.sin(PI2 * 310 * t)) * on * Math.min(1, t / 0.02) * Math.min(1, (c.dur - t) / 0.05); }, { gan: 0.3, rev: 0.05 });
  },
  trava(c) { /* cadeado fechando: dois cliques metálicos */
    const nz = prng(900 + (c.i ?? 0)), bp = biquad("bp", 3800, 3);
    [0, 0.045].forEach((dt) => voz(c.t + dt, 0.05, (k, t) => bp(nz() * 2 - 1) * env(t, 0.0003, 0.006) + 0.4 * Math.sin(PI2 * 2100 * t) * env(t, 0.0004, 0.01), { gan: 0.35, rev: 0.1 }));
  },
  ding(c) { const f = hz(c.n ?? 7, 1046.5); voz(c.t, 1.0, (k, t) => (Math.sin(PI2 * f * t) + 0.25 * Math.sin(PI2 * f * 2 * t)) * env(t, 0.002, 0.22), { gan: 0.18, rev: 0.45 }); },
});

const cues = [];
const add = (t, tipo, o = {}) => { if (Number.isFinite(t) && t >= 0 && t < DUR) cues.push({ t, tipo, ...o }); };
const faiscas = (t0, n, seed) => { const r = prng(seed); for (let i = 0; i < n; i++) add(t0 + Math.floor(r() * 6) / FPS + r() * 0.05, "faisca", { i: seed + i }); };

/* ---------- 0 · gancho ---------- */
add(0.02, "pouso", { ganho: 0.7 });
add(0.0, "swoosh", { pan: 0, ganho: 0.6 });
for (const [j, w] of ["Sua", "operação", "ainda", "vive", "em"].entries()) add(W(0, w) - 1 / FPS, "tick", { leve: true, i: j });
add(W(0, "planilha") - 2 / FPS, "slam", { i: 1 });
add(W(0, "print"), "obturador");
for (let i = 0; i < 3; i++) add(W(0, "print") + (i * 3) / FPS, "swoosh", { pan: [-0.5, 0.5, 0][i], ganho: 0.5 });
add(W(0, "print") - 1 / FPS, "slam", { i: 2, ganho: 0.6 });
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) add(W(0, "WhatsApp") + (i * 2 + j * 3) / FPS, "bolha", { ganho: 0.55 });
add(W(0, "WhatsApp") - 1 / FPS, "slam", { i: 3, ganho: 0.6 });
add(W(0, "WhatsApp") + 0.05, "notificacao", { ganho: 0.7 });

/* grade da planilha se desenhando: chiado de dados (tiques leves e rápidos) */
for (let fr = 0; fr < 26; fr += 2) add(T(fr), "tick", { agudo: true, leve: true, i: fr, ganho: 0.5 });
/* prints de vidro caindo em 3D */
for (let i = 0; i < 3; i++) add(W(0, "print") + (i * 3 + 8) / FPS, "pouso", { ganho: 0.35 });

/* ---------- 1 · chute ---------- */
add(S(1), "reverso", { dur: 0.35, ganho: 0.6 });
add(S(1) + 0.1, "drone", { dur: T(P0) - S(1) - 0.1 });
{ const a = abs(1, "lucro"), b = abs(1, "chute"); for (let fr = a; fr < b; fr += 2) add(T(fr), "tick", { agudo: true, i: fr % 7, leve: true }); }
add(W(1, "chute"), "erro"); add(W(1, "chute"), "slam", { i: 4, ganho: 0.7 });
/* o cartão trinca (luz lime vazando) */
add(W(1, "chute") + 2 / FPS, "risco", { i: 2, ganho: 0.8 }); add(W(1, "chute") + 3 / FPS, "brilho", { ganho: 0.35 });
add(T(abs(1, "lucro") - 6), "reverso", { dur: 0.25, ganho: 0.5 });

/* ---------- virada: a planilha racha e vira o painel ---------- */
add(T(P0) - 0.7, "riser", { dur: 0.7 });
add(T(P0), "vidro");
add(T(P0) + 0.05, "impacto", { ganho: 0.75 });
add(W(2, "Nex"), "brilho", { ganho: 0.7 });

/* ---------- 2 · meta tem dono ---------- */
add(W(2, "meta") - 1 / FPS, "swoosh", { pan: 0.2, ganho: 0.45 }); add(W(2, "meta"), "pop", { tom: 2 });
add(W(2, "dono"), "carimbo", { ganho: 0.8 });

/* ---------- 3 · remessa ---------- */
{ const f3 = cenas[3].from, digita = f3 + 1, salvaF = abs(3, "entra");
  const passo = Math.max(0.6, (salvaF - 3 - digita) / 20), dep = digita + 2 * passo, saq = digita + 11 * passo;
  add(T(f3 - 2), "swoosh", { pan: 0, ganho: 0.5 });
  const tecla = (ini, txt, base) => { for (let k = 1; k <= txt.length; k++) add(T(ini + k * passo), "tecla", { i: base + k, espaco: txt[k - 1] === " " }); };
  tecla(digita, "10", 100); tecla(dep, "R$ 350,00", 120); tecla(saq, "R$ 420,00", 140);
  add(T(saq + 9 * passo), "check", { i: 1 });
  const salva = abs(3, "entra"); add(T(salva), "clique"); add(T(salva) + 0.03, "pop", { tom: 5 }); add(T(salva + 6), "check", { i: 3 });
  /* o pulso viaja do celular ao notebook */
  add(T(salva + 4) + 0.2, "whoosh", { ganho: 0.8 });
  add(T(abs(3, "hora") - 2) + 0.35, "swoosh", { pan: -0.4, ganho: 0.5 });
}

/* ---------- 4 · tempo real ---------- */
add(W(4, "lucro"), "pouso", { ganho: 0.6 }); add(W(4, "lucro") + 0.02, "ding", { n: 7 });
add(T(abs(4, "lucro") + 2), "contador", { dur: 24 / FPS, dinheiro: true });
add(W(4, "prejuízo"), "erro", { ganho: 0.7 });
add(T(abs(4, "prejuízo") + 2), "contador", { dur: 22 / FPS });

/* ---------- 5 · fechamento ---------- */
add(S(5) + 0.07, "swoosh", { pan: 0, ganho: 0.5 }); add(S(5) + 0.15, "pop", { tom: 1 });
add(T(cenas[5].from + 8), "pop", { tom: 2, ganho: 0.7 });
[["Salário", 3], ["baú", 4], ["custos", 0]].forEach(([w, tom], j) => { add(W(5, w), "pop", { tom }); add(W(5, w) + 0.02, "tick", { alto: true, i: j }); });

/* ---------- 6 · lucro final ---------- */
add(W(6, "lucro"), "contador", { dur: 24 / FPS, dinheiro: true });
add(W(6, "final") + 0.1, "lapis", { dur: 0.35 });
add(W(6, "calculado"), "carimbo"); faiscas(W(6, "calculado") + 20 / FPS, 10, 600);
add(W(6, "calculado") + 0.05, "chime", { notas: [0, 4, 7, 12] });

/* ---------- 7 · alerta ---------- */
add(S(7) - 2 / FPS + 0.3, "swoosh", { pan: 0.4, ganho: 0.55 });
add(W(7, "parada"), "notificacao"); add(W(7, "vermelho"), "notificacao", { ganho: 0.9 });
add(W(7, "Alerta"), "sino"); add(W(7, "Alerta"), "vibra", { dur: 0.8 });

/* ---------- 8 · equipe ---------- */
add(S(8) - 2 / FPS + 0.3, "swoosh", { pan: -0.4, ganho: 0.55 });
for (let i = 0; i < 3; i++) add(T(cenas[8].from - 4 + i * 4), "pop", { tom: i, ganho: 0.6 });
for (let i = 0; i < 3; i++) add(T(abs(8, "acesso") + i * 4), "trava", { i });
add(W(8, "ranking"), "swoosh", { pan: 0, ganho: 0.5 }); add(W(8, "ranking") + 0.55, "ding", { n: 12 }); add(T(abs(8, "ranking") + 12), "pop", { tom: 6 });

/* ---------- 9 · controle ---------- */
add(S(9) - 2 / FPS + 0.2, "whoosh", { ganho: 0.7 });
add(W(9, "sob"), "slam", { i: 9, ganho: 0.55 });
add(T(F) - 0.9, "riser", { dur: 0.9 });

/* ---------- 10 · marca e CTA ---------- */
add(T(F), "impacto", { ganho: 0.9 });
for (let i = 0; i < 3; i++) add(T(F + 2 + i * 3), "swoosh", { pan: [-0.6, 0.6, 0][i], ganho: 0.4 });
faiscas(T(F + 16), 12, 700);
add(W(10, "Nex"), "brilho");
{ const tc = cta === "bio" ? W(10, "link") : W(10, "saiba"); add(tc - 2 / FPS, "pop", { tom: 6 }); add(tc, "chime", { notas: [0, 4, 7, 12] }); add(tc + 0.25, "tick", { alto: true }); }

cues.sort((a, b) => a.t - b.t);
for (const c of cues) { const fn = INSTR[c.tipo]; if (!fn) { console.warn("sem instrumento:", c.tipo); continue; } synth.ajuste.ganho = c.ganho ?? 1; fn(c); synth.ajuste.ganho = 1; }

/* guarda contra NaN: um NaN envenena os filtros e silencia o resto */
for (let i = 0; i < N; i++) if (!Number.isFinite(secoL[i] + secoR[i] + envioL[i] + envioR[i])) { const t = i / 48000; console.error("NaN em", t.toFixed(3), "s:", JSON.stringify(cues.filter((c) => Math.abs(c.t - t) < 0.4))); process.exit(2); }

const rl = reverb(envioL, [1557, 1617, 1491, 1422].map((d) => Math.round(d * 1.9)), 0.84);
const rr = reverb(envioR, [1580, 1640, 1514, 1445].map((d) => Math.round(d * 1.9)), 0.84);
const Lc = new Float32Array(N), Rc = new Float32Array(N);
const hl = biquad("hp", 40, 0.7), hr = biquad("hp", 40, 0.7);
let p = 0;
for (let i = 0; i < N; i++) { Lc[i] = hl(secoL[i] + rl[i] * 0.09); Rc[i] = hr(secoR[i] + rr[i] * 0.09); p = Math.max(p, Math.abs(Lc[i]), Math.abs(Rc[i])); }
const g = db(-1) / (p || 1);
for (let i = 0; i < N; i++) { Lc[i] = Math.tanh(Lc[i] * g * 1.15) / Math.tanh(1.15); Rc[i] = Math.tanh(Rc[i] * g * 1.15) / Math.tanh(1.15); }
gravarWav(path.join(RAIZ, "out", `sfx-${cta}.wav`), Lc, Rc);
console.log(`sfx ${cta}: ${cues.length} cues, ${DUR.toFixed(2)}s`);

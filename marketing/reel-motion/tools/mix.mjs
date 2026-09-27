/* MIXAGEM — três versões por CTA:
     narrado          voz (-1,5 dB) + efeitos (-9 dB, abaixam 5 dB sob a voz)
     narrado-musica   + trilha a -12 dB, que abaixa mais ~6 dB enquanto a voz fala
     sem-narracao     trilha na frente + efeitos (sem voz: nada de ducking)
   O limitador fica no fim de cada uma; o volume final (-14 LUFS) é no mux.
     node tools/mix.mjs bio|saiba */
import path from "node:path";
import { linha, RAIZ } from "./tempo.mjs";
import { SR, gravarWav, lerWav, lerVoz, pico, db } from "./audio.mjs";

const cta = process.argv[2] || "bio";
const { DUR } = linha(cta);
const n = Math.round(DUR * SR);
const out = (x) => path.join(RAIZ, "out", x);
const [sl, sr] = lerWav(out(`sfx-${cta}.wav`), n);
const [ml, mr] = lerWav(out(`musica-${cta}.wav`), n);
const [vl, vr] = lerVoz(path.join(RAIZ, "public", `voice-${cta}.mp3`), n);
const gv = db(-1.5) / (pico(vl, vr) || 1);

/* envelope da voz (ataque 4 ms, soltura 250 ms) → quanto abaixar o resto */
const envV = new Float32Array(n);
{ let e = 0; const at = 1 - Math.exp(-1 / (0.004 * SR)), rel = 1 - Math.exp(-1 / (0.25 * SR)); for (let i = 0; i < n; i++) { const v = Math.max(Math.abs(vl[i]), Math.abs(vr[i])) * gv; e += (v > e ? at : rel) * (v - e); envV[i] = Math.min(1, e * 4); } }

function limitar(L, R) {
  /* limitador suave com lookahead curto: ganho segue o pico, saturação tanh no fim */
  const teto = db(-1), la = Math.round(0.003 * SR);
  let g = 1;
  const oL = new Float32Array(n), oR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let pk = 0; for (let j = i; j < Math.min(n, i + la); j += 8) pk = Math.max(pk, Math.abs(L[j]), Math.abs(R[j]));
    const alvo = pk > teto ? teto / pk : 1;
    g = alvo < g ? alvo : g + (alvo - g) * 0.0006;
    oL[i] = Math.tanh(L[i] * g * 1.02) / Math.tanh(1.02); oR[i] = Math.tanh(R[i] * g * 1.02) / Math.tanh(1.02);
  }
  return [oL, oR];
}

const versoes = {
  narrado: (i) => { const d = 1 - 0.44 * envV[i]; return [vl[i] * gv + sl[i] * db(-9) * d, vr[i] * gv + sr[i] * db(-9) * d]; },
  "narrado-musica": (i) => { const d = 1 - 0.44 * envV[i], dm = 1 - 0.5 * envV[i]; return [vl[i] * gv + sl[i] * db(-9) * d + ml[i] * db(-12) * dm, vr[i] * gv + sr[i] * db(-9) * d + mr[i] * db(-12) * dm]; },
  "sem-narracao": (i) => [ml[i] * db(-2) + sl[i] * db(-7), mr[i] * db(-2) + sr[i] * db(-7)],
};
for (const [nome, fn] of Object.entries(versoes)) {
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const [a, b] = fn(i); L[i] = a; R[i] = b; }
  const [oL, oR] = limitar(L, R);
  gravarWav(out(`mix-${cta}-${nome}.wav`), oL, oR);
  console.log(`mix ${cta} ${nome}: pico ${(20 * Math.log10(pico(oL, oR))).toFixed(1)} dBFS`);
}

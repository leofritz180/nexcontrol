/* VERSÕES COM TRILHA CINEMÁTICA — usa o vídeo já renderizado (out/video-<cta>.mp4),
   gera a trilha (musica-cine.mjs), mixa e faz o mux:
     cine-sem-narracao   trilha cinemática + efeitos
     cine-so-musica      só a trilha cinemática
     cine-narrado        voz + efeitos + trilha cinemática por baixo (abaixa sob a voz)
     node tools/cine.mjs [bio,saiba] */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { linha, RAIZ } from "./tempo.mjs";
import { SR, FF, gravarWav, lerWav, lerVoz, pico, db } from "./audio.mjs";

const CTAS = (process.argv[2] || "bio,saiba").split(",");
const out = (x) => path.join(RAIZ, "out", x);
for (const cta of CTAS) {
  if (spawnSync("node", ["tools/musica-cine.mjs", cta], { cwd: RAIZ, stdio: "inherit" }).status !== 0) process.exit(1);
  if (!fs.existsSync(out(`sfx-${cta}.wav`))) spawnSync("node", ["tools/sfx.mjs", cta], { cwd: RAIZ, stdio: "inherit" });
  const n = Math.round(linha(cta).DUR * SR);
  const [ml, mr] = lerWav(out(`musica-cine-${cta}.wav`), n);
  const [sl, sr] = lerWav(out(`sfx-${cta}.wav`), n);
  const [vl, vr] = lerVoz(path.join(RAIZ, "public", `voice-${cta}.mp3`), n);
  const gv = db(-1.5) / (pico(vl, vr) || 1);
  const envV = new Float32Array(n);
  { let e = 0; const at = 1 - Math.exp(-1 / (0.004 * SR)), rel = 1 - Math.exp(-1 / (0.3 * SR)); for (let i = 0; i < n; i++) { const v = Math.max(Math.abs(vl[i]), Math.abs(vr[i])) * gv; e += (v > e ? at : rel) * (v - e); envV[i] = Math.min(1, e * 4); } }
  const versoes = {
    "cine-sem-narracao": (i) => [ml[i] * db(-1) + sl[i] * db(-9), mr[i] * db(-1) + sr[i] * db(-9)],
    "cine-so-musica": (i) => [ml[i], mr[i]],
    "cine-narrado": (i) => { const d = 1 - 0.44 * envV[i], dm = 1 - 0.55 * envV[i]; return [vl[i] * gv + sl[i] * db(-10) * d + ml[i] * db(-9) * dm, vr[i] * gv + sr[i] * db(-10) * d + mr[i] * db(-9) * dm]; },
  };
  for (const [nome, fn] of Object.entries(versoes)) {
    const L = new Float32Array(n), R = new Float32Array(n);
    let p = 0;
    for (let i = 0; i < n; i++) { const [a, b] = fn(i); L[i] = a; R[i] = b; p = Math.max(p, Math.abs(a), Math.abs(b)); }
    const g = p > db(-1) ? db(-1) / p : 1;
    for (let i = 0; i < n; i++) { L[i] = Math.tanh(L[i] * g * 1.02) / Math.tanh(1.02); R[i] = Math.tanh(R[i] * g * 1.02) / Math.tanh(1.02); }
    const wav = out(`mix-${cta}-${nome}.wav`);
    gravarWav(wav, L, R);
    const dest = out(`nexcontrol-reel-${cta}-${nome}.mp4`);
    /* loudnorm: -14 LUFS, o padrão dos apps */
    const r = spawnSync(FF, ["-nostdin", "-y", "-loglevel", "error", "-i", out(`video-${cta}.mp4`), "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-profile:v", "high", "-level", "4.1", "-crf", "17", "-preset", "slow", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", dest], { stdio: "inherit" });
    if (r.status !== 0) process.exit(1);
    console.log("pronto:", path.relative(RAIZ, dest));
  }
}

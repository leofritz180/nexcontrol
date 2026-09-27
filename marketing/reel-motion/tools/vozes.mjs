/* AMOSTRAS DE VOZ — narra o roteiro em várias vozes grátis (Edge TTS) e mixa
   cada uma sobre a trilha do reel, para o dono ouvir no celular e escolher.
     node tools/vozes.mjs → out/vozes/N-nome.mp3 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { RAIZ } from "./tempo.mjs";
import { FF } from "./audio.mjs";

const VOZES = [
  ["1-antonio-atual", "pt-BR-AntonioNeural", "+8%", "+0Hz"],
  ["2-antonio-grave", "pt-BR-AntonioNeural", "+2%", "-10Hz"],
  ["3-thalita", "pt-BR-ThalitaMultilingualNeural", "+6%", "+0Hz"],
  ["4-thalita-fina", "pt-BR-ThalitaMultilingualNeural", "-2%", "+8Hz"],
  ["5-francisca", "pt-BR-FranciscaNeural", "+6%", "+0Hz"],
  ["6-andrew", "en-US-AndrewMultilingualNeural", "+4%", "+0Hz"],
  ["7-brian", "en-US-BrianMultilingualNeural", "+6%", "+0Hz"],
];
const OUT = path.join(RAIZ, "out", "vozes");
for (const [id, voz, rate, pitch] of VOZES) {
  const tmp = path.join(OUT, "tmp-" + id);
  fs.mkdirSync(path.join(tmp, "public"), { recursive: true }); fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
  const r = spawnSync("node", ["tools/narrar.mjs", "bio"], { cwd: RAIZ, env: { ...process.env, VOZ: voz, RATE: rate, PITCH: pitch, OUTDIR: tmp }, encoding: "utf8" });
  if (r.status !== 0) { console.error(id, "falhou:", r.stderr.slice(0, 200)); continue; }
  const m = spawnSync(FF, ["-nostdin", "-y", "-loglevel", "error", "-i", path.join(tmp, "public", "voice-bio.mp3"), "-i", path.join(RAIZ, "out", "musica-bio.wav"),
    "-filter_complex", "[0:a]aformat=channel_layouts=stereo[v];[1:a]volume=0.16[m];[v][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[o]",
    "-map", "[o]", "-c:a", "libmp3lame", "-b:a", "160k", path.join(OUT, id + ".mp3")], { stdio: "inherit" });
  console.log(id, r.stdout.split("\n")[0], m.status === 0 ? "ok" : "mix falhou");
}

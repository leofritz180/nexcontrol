/* PIPELINE FINAL — por CTA (bio, saiba): vídeo mudo + capa, efeitos, trilha,
   três mixagens e o mux em 3 MP4 (narrado+música, narrado, sem narração).
     node tools/final.mjs            tudo
     node tools/final.mjs --so-som   não re-renderiza o vídeo, só som e mux
   O mux sai em yuv420p / bt709 / +faststart: o yuvj420p do Remotion NÃO abre
   no celular do dono (lição do reel da Valy). */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { RAIZ } from "./tempo.mjs";
import { FF } from "./audio.mjs";

const SO_SOM = process.argv.includes("--so-som");
const CTAS = (process.argv.find((a) => a.startsWith("--cta=")) || "--cta=bio,saiba").slice(6).split(",");
const OUT = path.join(RAIZ, "out");
fs.mkdirSync(OUT, { recursive: true });
const roda = (args) => { const r = spawnSync("node", args, { stdio: "inherit", cwd: RAIZ }); if (r.status !== 0) process.exit(r.status ?? 1); };

let serveUrl = null;
for (const cta of CTAS) {
  const inputProps = { cta };
  if (!SO_SOM) {
    serveUrl ??= await bundle({ entryPoint: path.join(RAIZ, "src", "index.ts") });
    const comp = await selectComposition({ serveUrl, id: "Video", inputProps });
    let ult = -1;
    await renderMedia({
      composition: comp, serveUrl, inputProps, codec: "h264", crf: 14, muted: true, concurrency: 4,
      outputLocation: path.join(OUT, `video-${cta}.mp4`), colorSpace: "bt709",
      onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p !== ult) { ult = p; process.stdout.write(`${cta} ${p * 10}%  `); } },
    });
    console.log("");
    await renderStill({ composition: comp, serveUrl, inputProps, frame: comp.durationInFrames - 1, output: path.join(OUT, `capa-${cta}.png`), imageFormat: "png" });
  }
  roda(["tools/sfx.mjs", cta]);
  roda(["tools/musica.mjs", cta]);
  roda(["tools/mix.mjs", cta]);
  for (const v of ["narrado-musica", "narrado", "sem-narracao"]) {
    const destino = path.join(OUT, `nexcontrol-reel-${cta}-${v}.mp4`);
    const r = spawnSync(FF, ["-y", "-loglevel", "error", "-i", path.join(OUT, `video-${cta}.mp4`), "-i", path.join(OUT, `mix-${cta}-${v}.wav`), "-map", "0:v", "-map", "1:a",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
      "-profile:v", "high", "-level", "4.1", "-crf", "17", "-preset", "slow", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", destino], { stdio: "inherit" });
    if (r.status !== 0) process.exit(1);
    console.log(`pronto: ${path.relative(RAIZ, destino)} (${(fs.statSync(destino).size / 1048576).toFixed(1)} MB)`);
  }
}

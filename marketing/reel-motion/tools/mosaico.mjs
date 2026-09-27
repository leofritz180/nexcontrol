/* CONFERÊNCIA VISUAL — renderiza 1 quadro a cada N (escala reduzida) e
   monta mosaicos numerados em out/mosaico/, para OLHAR antes de mostrar.
     node tools/mosaico.mjs [cta=bio] [de=0] [ate=fim] [passo=15] [escala=0.3] */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import ffmpeg from "ffmpeg-static";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [cta = "bio", de = "0", ate = "-1", passo = "15", escala = "0.3"] = process.argv.slice(2);
const pasta = path.join(RAIZ, "out", "mosaico", `${cta}-${de}`);
fs.rmSync(pasta, { recursive: true, force: true });
fs.mkdirSync(pasta, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src", "index.ts") });
const inputProps = { cta };
const comp = await selectComposition({ serveUrl, id: "Video", inputProps });
const fim = Number(ate) < 0 ? comp.durationInFrames - 1 : Math.min(Number(ate), comp.durationInFrames - 1);
const P = Number(passo);
/* renderFrames com everyNthFrame conta a partir do início do range */
await renderFrames({
  composition: comp, serveUrl, inputProps, outputDir: pasta, imageFormat: "jpeg", jpegQuality: 80,
  scale: Number(escala), frameRange: [Number(de), fim], everyNthFrame: P, concurrency: 4,
  onStart: () => {}, onFrameUpdate: () => {},
});
const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith(".jpeg")).sort();
/* numera cada quadro com o frame e o segundo, depois junta de 6 em 6 */
const rot = path.join(pasta, "rot");
fs.mkdirSync(rot);
arquivos.forEach((a, i) => {
  const fr = Number(de) + i * P;
  spawnSync(ffmpeg, ["-y", "-loglevel", "error", "-i", path.join(pasta, a), "-vf", `drawtext=text='f${fr} ${(fr / 30).toFixed(1)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6`, path.join(rot, `q${String(i).padStart(4, "0")}.jpg`)]);
});
const n = arquivos.length, porFolha = 12;
for (let k = 0; k * porFolha < n; k++) {
  const saida = path.join(RAIZ, "out", "mosaico", `${cta}-${de}-folha${k + 1}.jpg`);
  spawnSync(ffmpeg, ["-y", "-loglevel", "error", "-start_number", String(k * porFolha), "-i", path.join(rot, "q%04d.jpg"), "-frames:v", "1", "-vf", `tile=6x2:padding=6:color=0x333333`, saida]);
  console.log(saida);
}

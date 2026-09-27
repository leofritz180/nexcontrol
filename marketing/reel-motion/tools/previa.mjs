/* PRÉVIA — renderiza um trecho (padrão: 0–8 s) com o som do mix narrado+música.
     node tools/previa.mjs [cta=bio] [de=0] [ate=240] */
import path from "node:path";
import { spawnSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { RAIZ } from "./tempo.mjs";
import { FF } from "./audio.mjs";
const [cta = "bio", de = "0", ate = "240"] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.join(RAIZ, "src", "index.ts") });
const inputProps = { cta };
const comp = await selectComposition({ serveUrl, id: "Video", inputProps });
const bruto = path.join(RAIZ, "out", "previa-bruto.mp4");
await renderMedia({ composition: comp, serveUrl, inputProps, codec: "h264", crf: 16, muted: true, concurrency: 4, frameRange: [Number(de), Number(ate)], outputLocation: bruto });
const dest = path.join(RAIZ, "out", `previa-${cta}-${de}-${ate}.mp4`);
const ss = String(Number(de) / 30), dur = String((Number(ate) - Number(de) + 1) / 30);
spawnSync(FF, ["-nostdin", "-y", "-loglevel", "error", "-i", bruto, "-ss", ss, "-t", dur, "-i", path.join(RAIZ, "out", `mix-${cta}-narrado-musica.wav`), "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-crf", "19", "-preset", "slow", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", dest], { stdio: "inherit" });
console.log(dest);

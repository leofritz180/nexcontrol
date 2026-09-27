/* NARRAÇÃO — voz neural pt-BR (Microsoft Edge TTS, sem chave) com o tempo
   exato de cada palavra. Gera public/voice.mp3 e src/narracao.json.
     node tools/narrar.mjs bio|saiba   → public/voice-<cta>.mp3 + src/narracao-<cta>.json
   (voz: env VOZ, padrão pt-BR-AntonioNeural) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CTA = process.argv[2] || "bio";
const VOZ = process.env.VOZ || "pt-BR-AntonioNeural";
const RATE = process.env.RATE || "+8%", PITCH = process.env.PITCH || "+0Hz";
const OUTDIR = process.env.OUTDIR || RAIZ; // pasta que recebe public/voice.mp3 e src/narracao.json

import { trechos } from "./roteiro.mjs";
const TRECHOS = trechos(CTA);


const texto = TRECHOS.join(" ");
const tts = new MsEdgeTTS();
await tts.setMetadata(VOZ, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });

/* O endpoint do Edge fecha a conexão com QUALQUER elemento SSML extra
   (<lang>, <prosody> próprio): testado em 24/09. A troca de idioma da voz
   multilíngue em palavra isolada se resolve no roteiro (frase corrida). */
const { audioStream, metadataStream } = tts.toStream(texto, { rate: RATE, pitch: PITCH });

const pedacos = [];
audioStream.on("data", (d) => pedacos.push(d));
const palavras = [];
metadataStream.on("data", (d) => {
  /* a biblioteca entrega objetos já parseados (objectMode) */
  const j = Buffer.isBuffer(d) || typeof d === "string" ? JSON.parse(d.toString()) : d;
  for (const m of j.Metadata ?? []) if (m.Type === "WordBoundary") palavras.push({ t: m.Data.Offset / 1e7, dur: m.Data.Duration / 1e7, w: m.Data.text.Text });
});
await new Promise((ok, err) => { audioStream.on("end", ok); audioStream.on("error", err); });
await new Promise((ok) => setTimeout(ok, 300));

fs.mkdirSync(path.join(OUTDIR, "public"), { recursive: true });
fs.writeFileSync(path.join(OUTDIR, "public", `voice-${CTA}.mp3`), Buffer.concat(pedacos));

/* casa cada trecho com as palavras, em ordem */
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
let i = 0;
const cenas = TRECHOS.map((trecho, idx) => {
  const toks = trecho.split(/\s+/).map(norm).filter(Boolean);
  const ini = i;
  for (const tk of toks) {
    while (i < palavras.length && norm(palavras[i].w) !== tk) i++;
    if (i < palavras.length) i++;
  }
  const lista = palavras.slice(ini, i);
  return { idx, texto: trecho, ini: lista[0]?.t ?? 0, fim: (lista.at(-1)?.t ?? 0) + (lista.at(-1)?.dur ?? 0), palavras: lista };
});
fs.mkdirSync(path.join(OUTDIR, "src"), { recursive: true });
fs.writeFileSync(path.join(OUTDIR, "src", `narracao-${CTA}.json`), JSON.stringify({ voz: VOZ, rate: RATE, pitch: PITCH, duracao: cenas.at(-1).fim, cenas }, null, 1));
console.log(`voz ${VOZ}: ${palavras.length} palavras, ${cenas.at(-1).fim.toFixed(2)}s`);
for (const c of cenas) console.log(`${c.ini.toFixed(2).padStart(6)}–${c.fim.toFixed(2).padStart(6)}  ${c.texto}`);

/* A MESMA linha do tempo de src/script.ts, para o áudio cair no frame exato
   da animação. Mudou lá, muda aqui. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FPS = 30, LEAD = 4, CAUDA = 2.6;
export const f = (s) => Math.round(s * FPS);
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export function linha(cta) {
  const N = JSON.parse(fs.readFileSync(path.join(RAIZ, "src", `narracao-${cta}.json`), "utf8"));
  const total = f(N.duracao + CAUDA);
  const cenas = N.cenas.map((c, i, arr) => ({ ...c, from: Math.max(0, f(c.ini) - LEAD), to: i + 1 < arr.length ? Math.max(0, f(arr[i + 1].ini) - LEAD) : total }));
  /** frame absoluto da palavra */
  const abs = (i, w, oc = 0) => { const l = cenas[i].palavras.filter((p) => norm(p.w) === norm(w)); const p = l[oc] ?? l[0]; return p ? f(p.t) : cenas[i].from; };
  /** em segundos */
  const s = (fr) => fr / FPS;
  return { N, cenas, total, abs, s, DUR: total / FPS, P0: cenas[2].from, F: cenas[10].from };
}

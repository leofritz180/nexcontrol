/* LINHA DO TEMPO — sai da narração (tools/narrar.mjs). As cenas 0..9 são
   idênticas nas duas variantes (conferido: 0 ms de diferença); só o fecho
   muda. Tudo na tela entra no frame da palavra que o descreve. */
import bio from "./narracao-bio.json";
import saiba from "./narracao-saiba.json";

export type Cta = "bio" | "saiba";
export const FPS = 30;
export const LEAD = 4;
export const CAUDA_S = 2.6;
export const OVER = 10;
export const f = (s: number) => Math.round(s * FPS);

type Palavra = { t: number; dur: number; w: string };
type CenaN = { idx: number; texto: string; ini: number; fim: number; palavras: Palavra[] };
const NARR = { bio, saiba } as const;

export const duracaoTotal = (cta: Cta) => f(NARR[cta].duracao + CAUDA_S);

export function linha(cta: Cta) {
  const n = NARR[cta];
  const total = duracaoTotal(cta);
  const cenas = (n.cenas as CenaN[]).map((c, i, arr) => {
    const from = Math.max(0, f(c.ini) - LEAD);
    const to = i + 1 < arr.length ? Math.max(0, f(arr[i + 1].ini) - LEAD) : total;
    return { ...c, from, to, dur: to - from };
  });
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  /** frame ABSOLUTO em que a palavra é dita na cena */
  const abs = (cena: number, palavra: string, oc = 0) => {
    const c = cenas[cena];
    const l = c.palavras.filter((p) => norm(p.w) === norm(palavra));
    const p = l[oc] ?? l[0];
    return p ? f(p.t) : c.from;
  };
  return { cenas, total, abs };
}
export type Linha = ReturnType<typeof linha>;

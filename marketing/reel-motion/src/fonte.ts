import { continueRender, delayRender, staticFile } from "remotion";

/* Inter (texto) e JetBrains Mono (números), as mesmas do painel e da landing. */
let carregada = false;
export function carregarFontes() {
  if (carregada || typeof document === "undefined") return;
  carregada = true;
  const h = delayRender("fontes");
  const faces = [
    new FontFace("Inter", `url(${staticFile("fonts/Inter-latin-var.woff2")}) format("woff2")`, { weight: "100 900" }),
    new FontFace("JetBrains Mono", `url(${staticFile("fonts/JetBrainsMono-var.woff2")}) format("woff2")`, { weight: "100 800" }),
  ];
  Promise.all(faces.map((f) => f.load().then((ff) => (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff))))
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
}

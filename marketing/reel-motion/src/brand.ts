/* IDENTIDADE — paleta da landing 2.0 (app/v2/estilo.js e tokens --k-* de
   app/globals.css no tema escuro). Conferido em 26/09/2026.
   Proibido: azul, amarelo, roxo, dourado, gradiente colorido, emoji. */
export const C = {
  bg: "#080909",
  fundo2: "#050606",
  graf: "#111314",
  graf2: "#161819",
  graf3: "#1C1E20",
  tinta: "#F4F4F1",
  t2: "#B9BCBD",
  cinza: "#999D9F",
  t4: "#6F7375",
  linha: "rgba(255,255,255,0.08)",
  linha2: "rgba(255,255,255,0.14)",
  lime: "#C8F21D",
  lime2: "#DDFB5A",
  limeEsc: "#9ed40e",
  laranja: "#FF6B1A",
  laranja2: "#FF9150",
  perda: "#FF5A52",
  /* planilha do gancho: "o jeito antigo", claro e sem vida */
  papel: "#F4F4F1",
  papel2: "#E4E5E1",
  papelLinha: "#CFD1CC",
} as const;

export const FONTE = `Inter, system-ui, sans-serif`;
export const MONO = `"JetBrains Mono", ui-monospace, monospace`;

/* safe zones do Instagram/Status (px em 1080×1920) */
export const SAFE = { topo: 250, base: 420, lado: 90 };
export const W = 1080, H = 1920;

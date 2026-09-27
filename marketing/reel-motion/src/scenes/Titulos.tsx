/* TÍTULOS — a mensagem escrita na tela, palavra a palavra, no instante em
   que ela é falada. É o que sustenta a versão SEM narração. Ficam no topo,
   abaixo da safe zone do Instagram (250 px), alinhados à esquerda como o
   hero da landing. Frames absolutos (a Sequence começa em 0). */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, SAFE } from "../brand";
import { Frase, Olho, lin, type Item } from "../components/base";
import type { Linha } from "../script";

const TOPO = SAFE.topo + 20;

const Bloco: React.FC<{ de: number; ate: number; olho?: { t: string; em: number; ponto?: string }; itens: Item[]; tamanho?: number; alinhar?: "left" | "center"; top?: number }> = ({ de, ate, olho, itens, tamanho = 104, alinhar = "left", top = TOPO }) => {
  const frame = useCurrentFrame();
  if (frame < de - 2 || frame > ate + 10) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.lado, right: SAFE.lado, top, display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : "flex-start", gap: 18 }}>
      {olho ? <Olho texto={olho.t} inicio={olho.em} ponto={olho.ponto} style={{ opacity: 1 - lin(frame, ate, ate + 8) }} /> : null}
      <Frase itens={itens} tamanho={tamanho} alinhar={alinhar} maxW={1080 - SAFE.lado * 2} sai={ate} />
    </div>
  );
};

export const Titulos: React.FC<{ L: Linha }> = ({ L }) => {
  const frame = useCurrentFrame();
  const a = L.abs, c = L.cenas;
  const fimDe = (i: number) => c[i + 1].from - 4;
  /* véu escuro atrás do texto: garante leitura sobre a planilha clara e sobre o palco */
  const veu = frame < c[10].from ? 1 : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: frame < c[2].from ? 780 : 600, background: `linear-gradient(180deg, ${C.bg} 0%, ${C.bg}F2 60%, ${C.bg}00 100%)`, opacity: veu }} />
      {/* 0 — gancho */}
      <Bloco de={c[0].from} ate={fimDe(0)} tamanho={112} itens={[
        { t: "Sua", em: 1, tam: 58, peso: 500, cor: C.t2 },
        { t: "operação", em: a(0, "operação") - 1, tam: 58, peso: 500, cor: C.t2 },
        { t: "ainda", em: a(0, "ainda") - 1, tam: 58, peso: 500, cor: C.t2 },
        { t: "vive", em: a(0, "vive") - 1, tam: 58, peso: 500, cor: C.t2 },
        { t: "em:", em: a(0, "em") - 1, tam: 58, peso: 500, cor: C.t2 },
        { t: "Planilha.", em: a(0, "planilha") - 2, quebra: true },
        { t: "Print.", em: a(0, "print") - 1, quebra: true },
        { t: "WhatsApp.", em: a(0, "WhatsApp") - 1, quebra: true },
      ]} />
      {/* 1 — chute */}
      <Bloco de={c[1].from} ate={fimDe(1)} tamanho={112} itens={[
        { t: "Lucro", em: a(1, "lucro") - 1 },
        { t: "do", em: a(1, "do") },
        { t: "dia:", em: a(1, "dia") },
        { t: "no", em: a(1, "vira"), quebra: true },
        { t: "chute.", em: a(1, "chute") - 1, cor: C.perda },
      ]} />
      {/* 2 — dono */}
      <Bloco de={c[2].from} ate={fimDe(2)} olho={{ t: "Nex Control", em: a(2, "Nex") }} itens={[
        { t: "Cada", em: a(2, "cada") - 1 },
        { t: "meta", em: a(2, "meta") - 1 },
        { t: "tem", em: a(2, "tem"), quebra: true },
        { t: "dono.", em: a(2, "dono") - 1, destaque: true },
      ]} />
      {/* 3 — remessa */}
      <Bloco de={c[3].from} ate={fimDe(3)} itens={[
        { t: "Remessa", em: a(3, "remessa") - 1 },
        { t: "entra", em: a(3, "entra") - 1, quebra: true },
        { t: "na", em: a(3, "na") },
        { t: "hora.", em: a(3, "hora") - 1, sublinhado: true },
      ]} />
      {/* 4 — tempo real */}
      <Bloco de={c[4].from} ate={fimDe(4)} olho={{ t: "Valores ilustrativos", em: c[4].from + 4, ponto: C.t4 }} itens={[
        { t: "Lucro", em: a(4, "lucro") - 1, cor: C.lime },
        { t: "e", em: a(4, "e", 1) },
        { t: "prejuízo", em: a(4, "prejuízo") - 1, cor: C.perda },
        { t: "em", em: a(4, "em"), quebra: true },
        { t: "tempo", em: a(4, "tempo") },
        { t: "real.", em: a(4, "real") },
      ]} />
      {/* 5 — fechou */}
      <Bloco de={c[5].from} ate={fimDe(5)} tamanho={80} itens={[
        { t: "E", em: a(5, "E") - 1 },
        { t: "quando", em: a(5, "quando") - 1 },
        { t: "fecha", em: a(5, "fecha") - 1 },
        { t: "a", em: a(5, "a") },
        { t: "meta?", em: a(5, "meta") },
        { t: "+ salário", em: a(5, "Salário"), quebra: true, mono: true, cor: C.t2 },
        { t: "+ baú", em: a(5, "baú"), mono: true, cor: C.t2 },
        { t: "− custos", em: a(5, "custos"), mono: true, cor: C.t2 },
      ]} />
      {/* 6 — lucro final */}
      <Bloco de={c[6].from} ate={fimDe(6)} itens={[
        { t: "Lucro", em: a(6, "lucro") - 1 },
        { t: "final", em: a(6, "final") - 1, quebra: true },
        { t: "calculado.", em: a(6, "calculado") - 1, sublinhado: true },
      ]} />
      {/* 7 — alerta (duas frases em sequência) */}
      <Bloco de={c[7].from} ate={a(7, "Alerta") - 4} tamanho={100} itens={[
        { t: "Meta", em: a(7, "Meta") - 1 },
        { t: "parada?", em: a(7, "parada") - 1, cor: C.laranja },
        { t: "Remessa", em: a(7, "remessa") - 1, quebra: true },
        { t: "no", em: a(7, "no") },
        { t: "vermelho?", em: a(7, "vermelho") - 1, cor: C.perda },
      ]} />
      <Bloco de={a(7, "Alerta") - 2} ate={fimDe(7)} itens={[
        { t: "Alerta", em: a(7, "Alerta") - 1 },
        { t: "no", em: a(7, "no", 1), quebra: true },
        { t: "celular.", em: a(7, "celular") - 1, destaque: true },
      ]} />
      {/* 8 — equipe */}
      <Bloco de={c[8].from} ate={fimDe(8)} itens={[
        { t: "Acesso", em: a(8, "acesso") - 1 },
        { t: "próprio.", em: a(8, "próprio") - 1 },
        { t: "Ranking", em: a(8, "ranking") - 1, quebra: true, cor: C.lime },
        { t: "da", em: a(8, "da") },
        { t: "equipe.", em: a(8, "equipe") },
      ]} />
      {/* 9 — controle (frase do hero da landing) */}
      <Bloco de={c[9].from} ate={c[10].from + 2} tamanho={116} itens={[
        { t: "Sua", em: a(9, "Sua") - 1 },
        { t: "operação", em: a(9, "operação") - 1 },
        { t: "inteira.", em: a(9, "inteira") - 1, quebra: true },
        { t: "Sob", em: a(9, "sob") - 1, quebra: true, cor: C.lime },
        { t: "controle.", em: a(9, "controle") - 1, cor: C.lime },
      ]} />
    </AbsoluteFill>
  );
};

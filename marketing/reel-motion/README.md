# Reel motion narrado do Nex Control

Vídeo vertical 1080x1920, 36 s, feito em código com Remotion. Tem narração neural em pt-BR, efeitos sintetizados e trilha original. Não depende de nenhum outro projeto: tem `package.json` e `node_modules` próprios.

## Refazer do zero

```bash
cd marketing/reel-motion
npm install
node tools/narrar.mjs bio      # voz + tempo de cada palavra → public/voice-bio.mp3, src/narracao-bio.json
node tools/narrar.mjs saiba
node tools/final.mjs           # 2 vídeos, capas, efeitos, trilha, 3 mixagens e 6 MP4 em out/
```

`node tools/final.mjs --so-som` refaz só o áudio e o mux, sem renderizar o vídeo de novo.
`npx remotion studio src/index.ts` abre o editor visual. Passe `voz: true` nas props para ouvir a narração.

## Conferir antes de mostrar

```bash
node tools/mosaico.mjs bio 0 -1 15 0.3   # 1 quadro a cada 15, em folhas de 12 em out/mosaico/
```

## Onde mexer

| O quê | Arquivo |
|---|---|
| Texto narrado | `tools/roteiro.mjs` (depois rode `narrar.mjs` de novo) |
| Cores e safe zone | `src/brand.ts` (paleta da landing 2.0) |
| Títulos na tela | `src/scenes/Titulos.tsx` |
| Câmera e aparelhos | `src/scenes/Palco.tsx` |
| Telas do produto | `src/components/Nex.tsx` |
| Efeitos sonoros | `tools/sfx.mjs` |
| Trilha | `tools/musica.mjs` |

## Regras que valem aqui

- **Valores de exemplo.** Os números são redondos e ilustrativos, e a tela avisa isso. Os nomes são genéricos.
- **Fórmula real.** O lucro final segue a fórmula do produto: resultado das remessas + salário + baú − custos.
- **Alertas reais.** Os textos das notificações são os de `lib/notificacoes.js`, na voz séria.
- **Mux para celular.** O MP4 final tem que sair em yuv420p, bt709 e +faststart. O yuvj420p do Remotion não abre no celular.
- **Nada de piso em 3D.** Um plano 3D que cruza os aparelhos faz o Chrome recortar a tela. O chão fica plano, no fundo.

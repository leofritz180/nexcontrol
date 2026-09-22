'use client'
// ─────────────────────────────────────────────────────────────────────────
// ESTILO DA LANDING 2.0 — tudo escopado em `.nv2`.
//
// POR QUE CLASSE E NÃO ESTILO INLINE: esta rota é pública, mas um admin
// logado também pode abri-la — e aí o <html> carrega `.nx-bento`/`.nx-light`,
// cuja camada de tradução troca "color: rgb(255,255,255)" inline por texto
// escuro. Numa página de fundo #080909 isso apagaria metade do conteúdo.
// Cor em classe não é alcançada por aquela regra.
//
// PALETA (identidade 2.0):
//   #080909  fundo
//   #161819  grafite  ·  #1C1E20  grafite claro
//   #F4F4F1  off-white (texto)
//   #999D9F  cinza (texto secundário)
//   #C8F21D  acid lime — ACENTO, 3-5% da página
//
// O lime aparece só em: eyebrow (o ponto), botão primário, número do
// contador, marcador de lista e o traço do "2.0". Em mais nada.
// ─────────────────────────────────────────────────────────────────────────
export default function EstiloV2() {
  return (
    <style>{`
      html, html body { background: #080909 !important; }

      .nv2 {
        --bg: #080909;
        --graf: #161819;
        --graf2: #1C1E20;
        --tinta: #F4F4F1;
        --cinza: #999D9F;
        --lime: #C8F21D;
        --linha: rgba(255,255,255,0.08);
        --linha2: rgba(255,255,255,0.14);
        background: var(--bg);
        color: var(--tinta);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-feature-settings: 'cv11', 'ss01';
        -webkit-font-smoothing: antialiased;
        min-height: 100vh; position: relative; z-index: 1;
        overflow-x: clip;
      }
      .nv2 *, .nv2 *::before, .nv2 *::after { box-sizing: border-box; }
      .nv2 p, .nv2 h1, .nv2 h2, .nv2 h3, .nv2 ul, .nv2 li, .nv2 figure { margin: 0; padding: 0; }
      .nv2 ul { list-style: none; }
      .nv2 a { color: inherit; text-decoration: none; }
      .nv2 ::selection { background: var(--lime); color: #080909; }

      /* BLINDAGEM CONTRA O CSS DO PAINEL.
         A rota e publica, mas um admin LOGADO tambem abre — e ai o <html>
         carrega .nx-bento/.nx-aqua/.nx-light, que pintam todo svg de
         vermelho, arredondam todo botao em 14px e colam borda vermelha a
         esquerda de quem tem canto 12/14. Aqui a landing retoma o controle. */
      .nv2 svg { stroke: currentColor !important; color: inherit !important; }
      .nv2 .nv2-btn { border-radius: 10px !important; }
      .nv2 .nv2-btn--g { border-radius: 11px !important; }
      /* A camada .nx-aqua so alcanca quem tem borda solid var(--b1) INLINE,
         e nada aqui usa estilo inline de borda. O que desenhava listras
         brancas verticais pela pagina era a MINHA blindagem: ela punha
         border-left-width em TODO elemento .nv2-*, criando borda onde nao
         havia nenhuma. O problema era a defesa, nao o ataque. */
      .nv2 p, .nv2 span, .nv2 b, .nv2 em, .nv2 h1, .nv2 h2, .nv2 h3, .nv2 a, .nv2 li { color: inherit; }

      /* ── LARGURA E RITMO ─────────────────────────────────────────────── */
      .nv2-larg { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 28px; }
      .nv2-sec { padding: 120px 0; position: relative; }
      .nv2-sec--curta { padding: 88px 0; }
      .nv2-regua { border-top: 1px solid var(--linha); }

      /* ── TIPOGRAFIA ──────────────────────────────────────────────────── */
      .nv2-olho {
        display: inline-flex; align-items: center; gap: 9px;
        font-size: 11px; font-weight: 600; letter-spacing: 0.16em;
        text-transform: uppercase; color: var(--cinza);
      }
      .nv2-olho i {
        width: 5px; height: 5px; border-radius: 50%; background: var(--lime);
        flex-shrink: 0; display: block;
      }
      .nv2-h1 {
        font-size: clamp(42px, 7.2vw, 84px);
        font-weight: 600; letter-spacing: -0.045em; line-height: 0.98;
        color: var(--tinta); text-wrap: balance;
      }
      .nv2-h2 {
        font-size: clamp(31px, 4.4vw, 52px);
        font-weight: 600; letter-spacing: -0.04em; line-height: 1.04;
        color: var(--tinta); text-wrap: balance;
      }
      .nv2-h3 {
        font-size: 17px; font-weight: 600; letter-spacing: -0.02em;
        color: var(--tinta);
      }
      .nv2-lead {
        font-size: clamp(15.5px, 1.5vw, 18px); line-height: 1.6;
        color: var(--cinza); font-weight: 400; max-width: 54ch;
      }
      .nv2-corpo { font-size: 14.5px; line-height: 1.62; color: var(--cinza); }
      .nv2-mono {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--cinza); font-weight: 500;
      }

      /* ── BOTÕES ──────────────────────────────────────────────────────── */
      .nv2-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        height: 46px; padding: 0 22px; border-radius: 10px;
        font-size: 14.5px; font-weight: 550; letter-spacing: -0.01em;
        border: 1px solid transparent; cursor: pointer; font-family: inherit;
        transition: background-color .16s ease, border-color .16s ease, transform .16s ease, color .16s ease;
        white-space: nowrap;
      }
      .nv2-btn--lime { background: var(--lime); color: #080909; font-weight: 600; }
      .nv2-btn--lime:hover { background: #D4F93C; transform: translateY(-1px); }
      .nv2-btn--linha { background: transparent; color: var(--tinta); border-color: var(--linha2); }
      .nv2-btn--linha:hover { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.03); }
      .nv2-btn--fant { background: transparent; color: var(--cinza); height: 38px; padding: 0 12px; }
      .nv2-btn--fant:hover { color: var(--tinta); }
      .nv2-btn--g { height: 52px; padding: 0 28px; font-size: 15px; border-radius: 11px; }
      .nv2-btn:active { transform: translateY(0) scale(0.99); }

      /* ── CABEÇALHO ───────────────────────────────────────────────────── */
      .nv2-topo {
        position: fixed; top: 0; left: 0; right: 0; z-index: 60;
        transition: background-color .28s ease, border-color .28s ease, backdrop-filter .28s ease;
        border-bottom: 1px solid transparent;
      }
      .nv2-topo[data-preso='1'] {
        background: rgba(8,9,9,0.72);
        -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
        border-bottom-color: var(--linha);
      }
      .nv2-topo-in { display: flex; align-items: center; gap: 20px; height: 62px; }
      .nv2-marca { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
      .nv2-marca-nome { font-size: 15px; font-weight: 600; letter-spacing: -0.03em; color: var(--tinta); }
      .nv2-marca-v { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 0.1em; color: var(--cinza); border: 1px solid var(--linha); border-radius: 5px; padding: 3px 6px; }
      .nv2-nav { display: flex; align-items: center; gap: 4px; margin: 0 auto; }
      .nv2-nav a { font-size: 13.5px; color: var(--cinza); padding: 8px 12px; border-radius: 8px; transition: color .16s ease, background-color .16s ease; }
      .nv2-nav a:hover { color: var(--tinta); background: rgba(255,255,255,0.04); }
      .nv2-topo-acoes { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }

      /* ── HERO ────────────────────────────────────────────────────────── */
      .nv2-hero { padding: 150px 0 0; position: relative; }
      .nv2-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 56px; }
      .nv2-provas { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
      .nv2-prova { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--cinza); }
      .nv2-prova i { width: 4px; height: 4px; border-radius: 50%; background: var(--lime); flex-shrink: 0; }

      /* a captura do produto sangra pela direita de propósito: o corte sugere
         que tem mais sistema do que cabe na tela */
      .nv2-palco {
        position: relative; margin-top: 12px;
        border-radius: 14px 0 0 14px;
        border: 1px solid var(--linha); border-right: none;
        overflow: hidden; background: var(--graf);
        box-shadow: 0 40px 120px rgba(0,0,0,0.6);
      }
      .nv2-palco img { display: block; width: 100%; height: auto; }
      .nv2-palco-bleed { margin-right: calc(-1 * max(28px, (100vw - 1180px) / 2 + 28px)); }

      /* ── O "N" DE FUNDO ──────────────────────────────────────────────── */
      .nv2-n {
        position: absolute; pointer-events: none; user-select: none;
        opacity: 0.045; z-index: 0;
      }
      .nv2-n img { display: block; width: 100%; height: auto; }

      /* ── FAIXA DE NÚMEROS ────────────────────────────────────────────── */
      .nv2-nums { display: grid; grid-template-columns: repeat(3, 1fr); }
      .nv2-num { padding: 34px 26px; border-left: 1px solid var(--linha); }
      .nv2-num:first-child { border-left: none; padding-left: 0; }
      .nv2-num b {
        display: block; font-size: clamp(30px, 4vw, 44px); font-weight: 600;
        letter-spacing: -0.045em; color: var(--tinta); line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .nv2-num b em { font-style: normal; color: var(--lime); }
      .nv2-num span { display: block; margin-top: 10px; font-size: 13px; color: var(--cinza); }

      /* ── CARTÕES / BENTO ─────────────────────────────────────────────── */
      .nv2-card {
        background: var(--graf); border: 1px solid var(--linha);
        border-radius: 18px; overflow: hidden; position: relative;
        transition: border-color .2s ease, background-color .2s ease;
      }
      .nv2-card:hover { border-color: var(--linha2); background: var(--graf2); }
      .nv2-card-pad { padding: 26px; }
      /* recorte de interface dentro de cartao: a moldura corta, a imagem nao
         precisa caber inteira. O enquadramento mora aqui e nao no next/image
         porque com width em % o navegador calcula o tamanho antes da imagem
         existir, e o bloco fica vazio. */
      .nv2-recorte { position: relative; overflow: hidden; border-radius: 14px 0 0 0; border: 1px solid var(--linha); border-right: none; border-bottom: none; margin-left: 26px; height: 176px; }
      /* cover + object-position enquadra por PROPORCAO, entao o recorte nao
         quebra quando a largura do cartao muda. 58% na vertical cai na tira
         de indicadores — depositado, sacado, resultado e custos. */
      .nv2-recorte img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; object-fit: cover; object-position: 50% 58%; }
      .nv2-bento { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
      .nv2-bento > .col6 { grid-column: span 6; }
      .nv2-bento > .col4 { grid-column: span 4; }
      .nv2-bento > .col3 { grid-column: span 3; }
      .nv2-bento > .col2 { grid-column: span 2; }

      /* ── LISTA DE MARCADORES ─────────────────────────────────────────── */
      .nv2-marcas li { display: flex; gap: 12px; padding: 13px 0; border-top: 1px solid var(--linha); }
      .nv2-marcas li:first-child { border-top: none; }
      .nv2-marcas i {
        width: 5px; height: 5px; border-radius: 50%; background: var(--lime);
        flex-shrink: 0; margin-top: 8px; display: block;
      }
      .nv2-marcas b { display: block; font-size: 14.5px; font-weight: 550; color: var(--tinta); letter-spacing: -0.01em; }
      .nv2-marcas span { display: block; font-size: 13.5px; color: var(--cinza); margin-top: 3px; line-height: 1.5; }

      /* ── SEÇÃO PROBLEMA: só tipografia ───────────────────────────────── */
      .nv2-frases p {
        font-size: clamp(22px, 3.1vw, 36px); font-weight: 500;
        letter-spacing: -0.035em; line-height: 1.25; color: var(--tinta);
        padding: 30px 0; border-top: 1px solid var(--linha);
        text-wrap: balance;
      }
      .nv2-frases p:first-child { border-top: none; }

      /* ── ALERTAS (Nex Intelligence) ──────────────────────────────────── */
      .nv2-alerta { display: flex; gap: 14px; padding: 18px 20px; align-items: flex-start; }
      .nv2-alerta + .nv2-alerta { border-top: 1px solid var(--linha); }
      .nv2-alerta-ico {
        width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
        background: rgba(200,242,29,0.09); border: 1px solid rgba(200,242,29,0.22);
        display: inline-flex; align-items: center; justify-content: center; color: var(--lime);
      }

      /* ── FLUXO DA CAPTURA ────────────────────────────────────────────── */
      .nv2-fluxo { display: flex; align-items: stretch; gap: 0; flex-wrap: wrap; }
      .nv2-fluxo-no { flex: 1 1 200px; padding: 22px 24px; border: 1px solid var(--linha); background: var(--graf); }
      .nv2-fluxo-no:first-child { border-radius: 14px 0 0 14px; }
      .nv2-fluxo-no:last-child { border-radius: 0 14px 14px 0; border-left: none; }
      .nv2-fluxo-no + .nv2-fluxo-no { border-left: none; }
      .nv2-fluxo-seta { display: flex; align-items: center; justify-content: center; padding: 0 4px; color: var(--cinza); }

      /* ── TELEFONE ────────────────────────────────────────────────────── */
      .nv2-fone {
        width: 268px; border-radius: 34px; padding: 9px;
        background: #1a1c1d; border: 1px solid var(--linha2);
        box-shadow: 0 40px 100px rgba(0,0,0,0.6); flex-shrink: 0;
      }
      .nv2-fone-tela { border-radius: 26px; overflow: hidden; background: #f0f0f3; display: block; }
      .nv2-fone-tela img { display: block; width: 100%; height: auto; }

      /* ── PREÇO ───────────────────────────────────────────────────────── */
      .nv2-preco { display: flex; align-items: baseline; gap: 10px; }
      .nv2-preco b { font-size: 52px; font-weight: 600; letter-spacing: -0.05em; color: var(--tinta); line-height: 1; }
      .nv2-preco span { font-size: 15px; color: var(--cinza); }

      /* ── FAQ ─────────────────────────────────────────────────────────── */
      .nv2-faq-item { border-top: 1px solid var(--linha); }
      .nv2-faq-item:last-child { border-bottom: 1px solid var(--linha); }
      .nv2-faq-b {
        width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 18px;
        padding: 22px 0; background: none; border: none; cursor: pointer;
        font-family: inherit; font-size: 16px; font-weight: 500; letter-spacing: -0.02em;
        color: var(--tinta); text-align: left;
      }
      .nv2-faq-b:hover { color: var(--lime); }
      .nv2-faq-sinal { flex-shrink: 0; color: var(--cinza); transition: transform .22s ease; }
      .nv2-faq-b[aria-expanded='true'] .nv2-faq-sinal { transform: rotate(45deg); }
      .nv2-faq-r { overflow: hidden; }
      .nv2-faq-r p { padding: 0 0 24px; max-width: 62ch; }

      /* ── RODAPÉ ──────────────────────────────────────────────────────── */
      .nv2-rod { border-top: 1px solid var(--linha); padding: 40px 0 48px; }
      .nv2-rod-in { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
      .nv2-rod-links { display: inline-flex; gap: 22px; flex-wrap: wrap; margin-left: auto; }
      .nv2-rod-links a { font-size: 13px; color: var(--cinza); }
      .nv2-rod-links a:hover { color: var(--tinta); }

      /* ══ TABLET ══════════════════════════════════════════════════════ */
      @media (max-width: 1024px) {
        .nv2-sec { padding: 96px 0; }
        .nv2-nav { display: none; }
        .nv2-bento > .col4, .nv2-bento > .col3, .nv2-bento > .col2 { grid-column: span 3; }
        .nv2-palco-bleed { margin-right: -28px; }
      }

      /* ══ CELULAR ═════════════════════════════════════════════════════
         Não é empilhar: a manchete continua grande, o CTA aparece antes da
         dobra e a captura do produto segue sendo o elemento dominante —
         cortada de propósito, não reduzida a uma miniatura. */
      @media (max-width: 768px) {
        .nv2-larg { padding: 0 20px; }
        .nv2-sec { padding: 76px 0; }
        .nv2-sec--curta { padding: 56px 0; }
        .nv2-hero { padding: 116px 0 0; }
        .nv2-hero-grid { gap: 40px; }
        .nv2-h1 { font-size: clamp(38px, 11vw, 52px); line-height: 1.0; }
        .nv2-h2 { font-size: clamp(28px, 8vw, 38px); }
        .nv2-lead { font-size: 15.5px; }
        .nv2-topo-in { height: 56px; gap: 12px; }
        .nv2-cta-col { display: flex; flex-direction: column; align-items: stretch; gap: 10px; }
        .nv2-cta-col > .nv2-btn { width: 100%; }
        .nv2-nums { grid-template-columns: 1fr; }
        .nv2-num { border-left: none; border-top: 1px solid var(--linha); padding: 22px 0; }
        .nv2-num:first-child { border-top: none; padding-top: 0; }
        .nv2-bento { grid-template-columns: 1fr; gap: 12px; }
        .nv2-bento > .col6, .nv2-bento > .col4, .nv2-bento > .col3, .nv2-bento > .col2 { grid-column: span 1; }
        .nv2-card-pad { padding: 20px; }
        .nv2-frases p { font-size: clamp(21px, 6.6vw, 28px); padding: 22px 0; }
        /* A captura tinha 235px de altura no telefone: a tela inteira
           reduzida a uma miniatura, que e o oposto de impressionar. Aqui ela
           vira um RECORTE grande — 430px de altura, enquadrado no canto de
           cima a esquerda, onde ficam o menu e o numero do lucro. Corta de
           proposito: o corte sugere que tem mais sistema do que cabe. */
        .nv2-palco { border-radius: 12px 0 0 12px; height: 430px; }
        .nv2-palco img { height: 100%; object-fit: cover; object-position: 0% 0%; }
        .nv2-palco-bleed { margin-right: -20px; }

        /* cabecalho: no telefone sobra espaco pra UMA acao. "Entrar" continua
           alcancavel no rodape e no fim da pagina. */
        .nv2-topo .nv2-btn--fant { display: none; }
        .nv2-topo .nv2-marca-nome { font-size: 14.5px; }
        .nv2-topo .nv2-btn--lime { height: 38px; padding: 0 16px; font-size: 13.5px; }
        .nv2-fluxo-no { flex: 1 1 100%; border-radius: 14px !important; border-left: 1px solid var(--linha) !important; }
        .nv2-fluxo-seta { transform: rotate(90deg); padding: 8px 0; width: 100%; }
        .nv2-recorte { margin-left: 20px; height: 132px; }
        .nv2-recorte img { object-position: 30% 58%; }
        .nv2-fone { width: 232px; }
        .nv2-preco b { font-size: 42px; }
        .nv2-rod-links { margin-left: 0; gap: 16px; }
        .nv2-esconde-mob { display: none !important; }
      }
      @media (max-width: 400px) {
        .nv2-larg { padding: 0 16px; }
        .nv2-palco-bleed { margin-right: -16px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .nv2 *, .nv2 *::before, .nv2 *::after {
          animation-duration: 0.01ms !important; transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  )
}

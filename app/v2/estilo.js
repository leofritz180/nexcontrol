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

      /* Um admin LOGADO tambem abre esta rota — e ai o painel monta os seus
         flutuantes (voz, sino, avisos, chat, checklist) e a barra de abas do
         celular por cima da landing. Numa pagina de venda isso e ruido que o
         visitante nem entende. Some so aqui. */
      body:has(.nv2) .nx-dock-item,
      body:has(.nv2) .nx-chat-bolha,
      body:has(.nv2) .nx-checklist,
      body:has(.nv2) .nx-barra-app,
      body:has(.nv2) .sidebar-mobile-toggle,
      body:has(.nv2) [aria-label="Refazer tour desta aba"] { display: none !important; }

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

      /* palco de FILME: o 3D ja vem com o proprio fundo preto e a propria
         sombra, entao nao leva moldura nem borda — encostar uma borda nele
         viraria um retangulo dentro de outro. Sangra pros dois lados. */
      .nv2-palco-filme {
        position: relative; overflow: hidden;
        width: calc(100% + 2 * max(28px, (100vw - 1180px) / 2 + 28px));
        margin-left: calc(-1 * max(28px, (100vw - 1180px) / 2 + 28px));
        margin-top: -18px;
      }
      /* apaga a emenda entre o preto do filme e o preto da pagina */
      .nv2-palco-filme::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background:
          linear-gradient(90deg, #080909 0%, transparent 14%, transparent 86%, #080909 100%),
          linear-gradient(180deg, #080909 0%, transparent 12%, transparent 88%, #080909 100%);
      }

      /* base de todo filme; quem precisar de outro posicionamento
         sobrescreve pela classe, nao por estilo em linha */
      .nv2-filme { position: relative; overflow: hidden; aspect-ratio: var(--prop, 16 / 9); }

      /* ── O N ANIMADO ─────────────────────────────────────────────────
         Substitui marca.mp4 (2,31 MB) por geometria. Nao intercepta
         clique nenhum: quem escuta o ponteiro e a SECAO inteira, nao a
         peca — assim o N vira com o mouse em qualquer ponto do bloco.
         O marca.mp4 continua em public/landing/v2/, sem referencia: e
         material de marca do dono, nao lixo meu pra apagar. */
      .nxn {
        position: relative; display: grid; place-items: center;
        pointer-events: none; /* quem escuta o ponteiro e a secao inteira */
      }
      /* a perspectiva mora no palco. Sem ela o rotateY vira achatamento,
         nao giro. */
      .nxn-palco { position: relative; width: min(300px, 58vw); perspective: 1000px; }
      .nxn-corpo {
        position: relative; width: 100%; aspect-ratio: 100 / 106;
        transform-style: preserve-3d; will-change: transform;
      }
      /* cada faceta ocupa o mesmo quadro; o que as separa e o translateZ */
      .nxn-faceta {
        position: absolute; inset: 0; width: 100%; height: 100%;
        overflow: visible;
      }
      /* o halo lime da identidade, atras da peca. E ele que amarra o N a
         2.0 sem pintar a marca de verde. */
      .nxn-halo {
        position: absolute; left: 50%; top: 50%; width: 132%; height: 118%;
        transform: translate(-50%, -50%) translateZ(-70px);
        background: radial-gradient(ellipse at 52% 48%,
          rgba(200,242,29,0.16) 0%, rgba(200,242,29,0.05) 34%, transparent 68%);
        filter: blur(14px); pointer-events: none;
      }
      /* a sombra no chao: desliza pro lado oposto ao giro */
      .nxn-chao {
        position: absolute; left: 50%; bottom: -7%; width: 74%; height: 13%;
        transform: translateX(-50%);
        background: radial-gradient(ellipse at 50% 50%,
          rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 44%, transparent 72%);
        filter: blur(9px); pointer-events: none;
      }
      /* a peca na secao institucional, no lugar do filme */
      .nv2-marca-n { margin: 52px 0 10px; }

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
      /* PRECISA DO .nv2 NA FRENTE: alguns cartoes sao <li>, e o reset de
         lista (0,1,1) vencia a classe sozinha (0,1,0) zerando o padding —
         o texto encostava na borda do cartao.
         E nao ponha BACKTICK em comentario deste arquivo: o CSS inteiro
         mora num template literal e um backtick solto fecha a string. */
      .nv2 .nv2-card-pad { padding: 26px; }
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
      /* dois telefones: o de tras recuado e menor, pra ler como profundidade
         e nao como dois selos lado a lado */
      .nv2-fones { display: flex; align-items: center; justify-content: center; gap: 0; }
      /* o 3D ja traz o proprio celular, a propria sombra e o proprio fundo
         escuro. A mascara apaga as quatro bordas pra ele nascer da pagina
         em vez de virar um retangulo colado atras do outro telefone. */
      .nv2-cena-atras {
        width: 318px; flex-shrink: 0;
        margin-left: -84px; transform: translateY(20px);
        z-index: -1; opacity: 0.95;
        -webkit-mask-image: radial-gradient(ellipse 62% 60% at 54% 50%, #000 52%, transparent 92%);
                mask-image: radial-gradient(ellipse 62% 60% at 54% 50%, #000 52%, transparent 92%);
      }

      .nv2-fone {
        width: 268px; border-radius: 34px; padding: 9px;
        background: #1a1c1d; border: 1px solid var(--linha2);
        box-shadow: 0 40px 100px rgba(0,0,0,0.6); flex-shrink: 0;
      }
      .nv2-fone-tela { border-radius: 26px; overflow: hidden; background: #f0f0f3; display: block; width: 100%; }
      /* VEU DO RODAPE. A gravacao de tela corta os rotulos da barra inferior
         na ultima faixa de pixels, e texto fatiado parece defeito de
         renderizacao. A barra ja e quase preta, entao um degrade curto pro
         preto engole a faixa quebrada e le como profundidade. Para em 34%
         de opacidade no topo pra nao apagar o botao central. */
      .nv2-fone-tela::after {
        content: ''; position: absolute; left: 0; right: 0; bottom: 0;
        height: 4.6%; pointer-events: none; z-index: 2;
        background: linear-gradient(to top, #0a0b0b 0%, rgba(10,11,11,0.94) 26%, rgba(10,11,11,0) 100%);
      }
      /* ancora no topo: quando o recorte acontece, ele sai por baixo */
      .nv2-fone-tela img, .nv2-fone-tela video { display: block; width: 100%; object-position: 50% 0%; }

      /* ── PREÇO ───────────────────────────────────────────────────────── */
      .nv2-preco { display: flex; align-items: baseline; gap: 10px; }
      .nv2-preco b { font-size: 52px; font-weight: 600; letter-spacing: -0.05em; color: var(--tinta); line-height: 1; }
      .nv2-preco span { font-size: 15px; color: var(--cinza); }

      /* ── DUAS COLUNAS ────────────────────────────────────────────────
         Estas quatro secoes (problema, equipes, inteligencia, celular)
         tinham o grid em estilo INLINE, que nenhuma media query alcanca.
         No telefone ficavam em duas colunas de ~170px, uma palavra por
         linha. A definicao mora aqui agora, e empilha junto com o resto. */
      .nv2-duas {
        display: grid; gap: 56px; align-items: center;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
      .nv2-duas--prob { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 48px; align-items: start; }
      .nv2-duas--eq   { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); }
      .nv2-duas--fone { grid-template-columns: minmax(0, 1fr) auto; }

      /* ── PLANOS ──────────────────────────────────────────────────────
         Regra de cor aqui: TODOS os cartoes sao iguais em cor. O unico que
         se diferencia e o recomendado, e ele se diferencia por UMA coisa
         so — a borda puxando pro lime e o fundo um grau mais claro. Sem
         gradiente, sem cor por plano, sem segunda borda. */
      .nv2-seletor {
        display: inline-flex; gap: 4px; padding: 4px;
        border-radius: 999px; background: var(--graf);
        border: 1px solid var(--linha);
      }
      .nv2-seletor button {
        appearance: none; border: none; cursor: pointer; font: inherit;
        height: 44px; padding: 0 26px; border-radius: 999px;
        background: transparent; color: var(--cinza);
        font-size: 14px; font-weight: 550; letter-spacing: -0.01em;
        white-space: nowrap;
        transition: color .18s ease, background-color .22s ease;
      }
      .nv2-seletor button:hover { color: var(--tinta); }
      .nv2-seletor button[data-on='1'] { background: var(--tinta); color: #080909; }

      /* a frase que traduz a aba em uma linha. E ela que faz a diferenca
         entre Solo e Solo Pro caber na cabeca de quem le. */
      .nv2 .nv2-estagio { font-size: 15px; color: var(--cinza); margin-top: 22px; line-height: 1.55; }
      .nv2-estagio b { color: var(--tinta); font-weight: 550; }

      .nv2-planos {
        display: grid; gap: 14px; margin-top: 30px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: stretch;
      }
      /* dois cartoes nao esticam pelos 1180px: ficariam largos e vazios */
      .nv2-planos[data-n='2'] { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 760px; }
      .nv2-planos[data-n='4'] { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }

      .nv2-plano { display: flex; flex-direction: column; padding: 30px 26px 26px; }
      .nv2-plano--top { background: var(--graf2); border-color: rgba(200,242,29,0.30); }
      .nv2-plano--top:hover { background: var(--graf2); border-color: rgba(200,242,29,0.48); }

      .nv2-plano-topo { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 23px; }
      .nv2-plano-nome { font-size: 15.5px; font-weight: 600; letter-spacing: -0.01em; color: var(--tinta); }
      /* min-height alinha o preco dos cartoes na mesma linha mesmo com
         frases de tamanhos diferentes */
      .nv2 .nv2-plano-linha { font-size: 14.5px; line-height: 1.55; color: var(--cinza); margin-top: 14px; min-height: 68px; }
      .nv2-plano .nv2-preco { margin-top: 18px; }
      .nv2-plano .nv2-preco b { font-size: 40px; }
      .nv2-plano-vagas { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--cinza); margin-top: 12px; }
      .nv2-plano-vagas i { width: 4px; height: 4px; border-radius: 50%; background: var(--lime); display: block; flex-shrink: 0; }
      .nv2 .nv2-plano-herda { font-size: 12.5px; font-weight: 550; color: var(--tinta); margin-top: 26px; }
      .nv2-plano .nv2-marcas { margin-top: 10px; }
      /* margin-top auto cola o botao no rodape: os CTAs ficam na mesma
         linha mesmo com listas de tamanhos diferentes */
      .nv2-plano-fim { margin-top: auto; padding-top: 26px; }

      .nv2-selo {
        display: inline-flex; align-items: center; height: 23px; padding: 0 10px;
        border-radius: 999px; background: var(--lime); color: #080909;
        font-size: 10px; font-weight: 650; letter-spacing: 0.09em;
        text-transform: uppercase; white-space: nowrap;
      }

      .nv2-provas--meio { justify-content: center; margin-top: 26px; }

      /* ── COMPARATIVO ─────────────────────────────────────────────────
         Tabela de verdade (thead/th scope) porque e tabela mesmo: leitor
         de tela anuncia a coluna junto com o valor. */
      .nv2-comp { width: 100%; border-collapse: collapse; margin-top: 64px; }
      .nv2-comp th, .nv2-comp td { padding: 15px 10px; text-align: center; border-top: 1px solid var(--linha); }
      .nv2-comp thead th {
        border-top: none; padding-bottom: 14px; color: var(--cinza);
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500;
      }
      .nv2-comp tbody th {
        text-align: left; color: var(--tinta); font-weight: 450;
        font-size: 14px; letter-spacing: -0.01em; width: 46%;
      }
      .nv2-comp thead th:first-child { text-align: left; }
      .nv2-comp .sim { color: var(--lime); display: inline-flex; }
      .nv2-comp .nao { color: rgba(255,255,255,0.20); }

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
        .nv2-planos[data-n='4'] { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
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
        .nv2 .nv2-card-pad { padding: 20px; }
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
        /* o logo tambem e link: 44px de area de toque, sem mexer no visual */
        .nv2-topo .nv2-marca { padding: 8px 0; margin: -8px 0; }
        /* 44px e o minimo pra um alvo de toque nao errar o dedo */
        .nv2-topo .nv2-btn--lime { height: 44px; padding: 0 18px; font-size: 13.5px; }
        .nv2-fluxo-no { flex: 1 1 100%; border-radius: 14px !important; border-left: 1px solid var(--linha) !important; }
        .nv2-fluxo-seta { transform: rotate(90deg); padding: 8px 0; width: 100%; }
        /* O RECORTE PRECISA APROXIMAR, NAO ENCOLHER. Com cover, os 3200px
           da captura cabiam nos 335px do cartao: a interface inteira em 10%
           do tamanho, texto de 3px, ilegivel — parecia defeito. O zoom traz
           uma FATIA legivel, que e o que um recorte deve fazer. */
        .nv2-recorte { margin-left: 20px; height: 172px; }
        .nv2-recorte img { object-position: 50% 50%; transform: scale(3.2); transform-origin: 24% 46%; }
        /* NO TELEFONE fica UM telefone. Dois viram dois selos ilegiveis. */
        .nv2-fones .nv2-cena-atras { display: none; }
        .nv2-fone { width: 244px; }
        /* o filme que sobra sangra menos: em 390px o corte lateral come o painel */
        .nv2-palco-filme {
          width: calc(100% + 40px); margin-left: -20px; margin-top: -8px;
        }
        .nv2-palco-filme::after {
          background:
            linear-gradient(90deg, #080909 0%, transparent 8%, transparent 92%, #080909 100%),
            linear-gradient(180deg, #080909 0%, transparent 8%, transparent 92%, #080909 100%);
        }
        /* AS QUATRO SECOES DE DUAS COLUNAS EMPILHAM. Sem isto, o texto
           fica com uma palavra por linha — era o pior defeito do mobile. */
        .nv2-duas,
        .nv2-duas--prob,
        .nv2-duas--eq,
        .nv2-duas--fone { grid-template-columns: 1fr; gap: 36px; align-items: start; }

        /* ENQUADRAMENTO FECHADO NO TELEFONE. O render 3D tem ~16% de preto
           morto de cada lado; em 5/4 o corte tira o vazio e o painel passa
           a ocupar quase a largura toda, sem perder nenhuma borda dele.
           Quem nao declara proporcaoMob cai no --prop de sempre. */
        .nv2-filme { aspect-ratio: var(--prop-fone, var(--prop, 16 / 9)); }

        .nxn-palco { width: min(224px, 62vw); perspective: 760px; }
        .nv2-marca-n { margin: 40px 0 6px; }

        .nv2-preco b { font-size: 42px; }

        /* PLANOS NO TELEFONE: nada de cinco cartoes miniatura. O seletor
           ocupa a largura toda e os cartoes empilham em tamanho cheio,
           na ordem da escada — Solo, depois Solo Pro. */
        .nv2-seletor { display: flex; width: 100%; }
        .nv2-seletor button { flex: 1; padding: 0 10px; font-size: 13.5px; }
        .nv2 .nv2-estagio { font-size: 14.5px; }
        .nv2-planos, .nv2-planos[data-n='2'], .nv2-planos[data-n='4'] { grid-template-columns: 1fr; max-width: none; }
        .nv2-plano { padding: 26px 22px 22px; }
        /* sem altura minima: empilhado, nao ha o que alinhar */
        .nv2 .nv2-plano-linha { min-height: 0; }
        .nv2-plano .nv2-preco b { font-size: 38px; }
        .nv2-provas--meio { justify-content: flex-start; }

        /* o comparativo cabe em 390px reduzindo a coluna do recurso e o
           respiro lateral; a tabela nao vira rolagem horizontal */
        .nv2-comp { margin-top: 48px; }
        .nv2-comp th, .nv2-comp td { padding: 13px 3px; }
        .nv2-comp tbody th { width: 46%; font-size: 12.8px; line-height: 1.35; padding-right: 8px; }
        .nv2-comp thead th { font-size: 9px; letter-spacing: 0.06em; }
        /* o padding com margem negativa amplia a area de toque pra 43px
           sem mexer no espacamento visual */
        .nv2-rod-links { margin-left: 0; gap: 16px; }
        .nv2-rod-links a { padding: 11px 0; margin: -11px 0; }
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

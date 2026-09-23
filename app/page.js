'use client'
// ─────────────────────────────────────────────────────────────────────────
// A HOME — desde 24/09/2026 é a landing 2.0.
//
// Até aqui nexcpa.com.br servia a página antiga e a 2.0 vivia em /v2, sem
// link em lugar nenhum e fora do sitemap: só chegava nela quem tinha a URL.
// Todo visitante novo, todo clique de anúncio e todo link compartilhado
// caíam na versão velha — que além de velha, anunciava R$ 59,90 com "acesso
// completo ao PRO" (hoje isso é o Solo Pro, a R$ 99,90) e um teste grátis
// que acabou em 20/08.
//
// POR QUE ISTO É UM RE-EXPORT e não uma cópia: a landing inteira mora em
// app/v2/ junto com os arquivos que ela usa (estilo, filme, marca-n, peças),
// todos por caminho relativo. Mover o arquivo quebraria os quatro imports
// por ganho nenhum. Aqui a home aponta pra ela, e o /v2 redireciona pra cá
// (next.config.js) — uma página, um endereço, sem conteúdo duplicado.
//
// A página antiga não foi jogada fora: ela está no histórico do git, no
// commit anterior a este.
// ─────────────────────────────────────────────────────────────────────────
export { default } from './v2/page'

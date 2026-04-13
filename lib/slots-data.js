// ═══════════════════════════════════════
// NexControl — Slots Premium Data
// Imagens: colocar em /public/slots/[slug].webp
// ═══════════════════════════════════════

function slug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function s(id, name, provider, performance, rating, tags) {
  const sl = slug(name)
  return { id, name, provider, performance, rating, tags, slug: sl, image: `/slots/${sl}.webp` }
}

export const PROVIDERS = [
  { id: 'all', label: 'Todos' },
  { id: 'pg', label: 'PG' },
  { id: 'pp', label: 'PP' },
  { id: 'wg', label: 'WG' },
  { id: 'mg', label: 'MG' },
  { id: 'jili', label: 'JILI' },
  { id: 'jdb', label: 'JDB' },
  { id: 'fc', label: 'FC' },
  { id: 'pescaria', label: 'Pescaria' },
]

export const SLOTS = [
  // ── PG ──
  s(1, 'Chicky Run', 'pg', 'baixa', 3, ['Comida']),
  s(2, 'Gem Saviour', 'pg', 'media', 3, ['Aventura']),
  s(3, 'Fortune Dragon', 'pg', 'media', 2, ['Ganho Certo 2.00']),
  s(4, 'Plushie Frenzy', 'pg', 'alta', 3, ['Casual']),
  s(5, 'Prosperity Lion', 'pg', 'alta', 3, ['Favorito']),
  s(6, 'Win Win Won', 'pg', 'alta', 3, ['Popular']),
  s(7, 'Piggy Gold', 'pg', 'media', 3, ['Favorito']),
  s(8, 'Mr Hallow Jackpot', 'pg', 'alta', 3, ['Jackpot']),

  // ── PP ──
  s(9, '888 Gold', 'pp', 'media', 3, ['Ouro']),
  s(10, 'Fire Strike', 'pp', 'alta', 2, ['Fogo']),
  s(11, 'Diamond Strike', 'pp', 'media', 3, ['Diamante']),
  s(12, 'Irish Charms', 'pp', 'media', 3, ['Trevo']),
  s(13, 'Plush WINS', 'pp', 'media', 2, ['Clássico']),
  s(14, 'Diamonds Are Forever', 'pp', 'media', 3, ['Diamante']),
  s(15, 'Jade Butterfly', 'pp', 'baixa', 3, ['Média/Montante']),

  // ── WG ──
  s(16, 'Dragon vs Tiger', 'wg', 'alta', 3, ['Cartas', 'Rápido']),
  s(17, 'Lucky Dog', 'wg', 'media', 2, ['Animal']),
  s(18, 'Dragon Treasure II', 'wg', 'alta', 3, ['Dragão']),
  s(19, 'Mais Fortuna & Riqueza', 'wg', 'media', 3, ['Slots']),
  s(20, 'Fishing Master', 'wg', 'media', 3, ['Pescaria']),
  s(21, 'Treasure Bowl', 'wg', 'media', 3, ['Pote']),

  // ── MG ──
  s(22, 'Lucky Twins', 'mg', 'alta', 3, ['Asiático']),
  s(23, '777 Mega Deluxe', 'mg', 'media', 2, ['Clássico']),
  s(24, '777 BIG', 'mg', 'media', 3, ['Jackpot']),

  // ── JILI ──
  s(25, 'FaFaFa', 'jili', 'baixa', 2, ['Simples']),
  s(26, 'XIYANGYANG', 'jili', 'alta', 3, ['Cartas']),
  s(27, 'Jungle King', 'jili', 'alta', 3, ['Aventura']),
  s(28, 'Crazy Hunter', 'jili', 'media', 3, ['Pulso']),
  s(29, 'Golden Joker', 'jili', 'baixa', 2, ['Simples']),
  s(30, 'Crazy 777', 'jili', 'baixa', 3, ['Rápido']),

  // ── JDB ──
  s(31, 'Super Niubi', 'jdb', 'alta', 3, ['Popular']),
  s(32, 'Crazy King Kong', 'jdb', 'alta', 3, ['Ação']),
  s(33, 'Funky King Kong', 'jdb', 'media', 3, ['Ação']),
  s(34, 'Fruity Bonanza', 'jdb', 'media', 3, ['Frutas']),
  s(35, 'Triple King Kong', 'jdb', 'alta', 3, ['Ação']),
  s(36, 'Lucky Color', 'jdb', 'media', 3, ['Casual']),
  s(37, 'Treasure Bowl', 'jdb', 'media', 3, ['Pote']),
  s(38, 'Bulls Treasure', 'jdb', 'media', 3, ['Aventura']),

  // ── FC ──
  s(39, 'Gladiatriz de Roma', 'fc', 'alta', 2, ['Batalha']),
  s(40, 'Golden Panther', 'fc', 'alta', 2, ['Pantera']),
  s(41, 'Rich Man', 'fc', 'alta', 3, ['Magnata']),
  s(42, 'Treasure Raiders', 'fc', 'media', 3, ['Tumba']),
  s(43, 'Color Game', 'fc', 'baixa', 3, ['Dados']),
  s(44, 'Cowboys', 'fc', 'alta', 2, ['Oeste']),
  s(45, 'Fortune Sheep', 'fc', 'baixa', 2, ['Ovelha']),

  // ── PESCARIA ──
  s(46, 'Boom Legend', 'pescaria', 'alta', 3, ['Montante']),
  s(47, 'Mega Fishing', 'pescaria', 'alta', 3, ['Média Alta']),
  s(48, 'Dragon Fortune', 'pescaria', 'alta', 3, ['Montante']),
  s(49, 'Happy Fishing', 'pescaria', 'alta', 3, ['Montante']),
]

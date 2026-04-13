// ═══════════════════════════════════════
// NexControl — Slots Premium Data
// ═══════════════════════════════════════

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
  // ── PG (primeiros: Chicky Run, Gem Saviour, Fortune Dragon) ──
  { id: 4, name: 'Chicky Run', provider: 'pg', performance: 'baixa', rating: 3, tags: ['Comida'] },
  { id: 2, name: 'Gem Saviour', provider: 'pg', performance: 'media', rating: 3, tags: ['Aventura'] },
  { id: 1, name: 'Fortune Dragon', provider: 'pg', performance: 'media', rating: 2, tags: ['Ganho Certo 2.00'] },
  { id: 7, name: 'Plushie Frenzy', provider: 'pg', performance: 'alta', rating: 3, tags: ['Casual'] },
  { id: 5, name: 'Prosperity Lion', provider: 'pg', performance: 'alta', rating: 3, tags: ['Favorito'] },
  { id: 8, name: 'Win Win Won', provider: 'pg', performance: 'alta', rating: 3, tags: ['Popular'] },
  { id: 3, name: 'Piggy Gold', provider: 'pg', performance: 'media', rating: 3, tags: ['Favorito'] },
  { id: 6, name: 'Mr Hallow Jackpot', provider: 'pg', performance: 'alta', rating: 3, tags: ['Jackpot'] },

  // ── PP (primeiros: 888 Gold, Fire Strike, Diamond Strike) ──
  { id: 10, name: '888 Gold', provider: 'pp', performance: 'media', rating: 3, tags: ['Ouro'] },
  { id: 12, name: 'Fire Strike', provider: 'pp', performance: 'alta', rating: 2, tags: ['Fogo'] },
  { id: 15, name: 'Diamond Strike', provider: 'pp', performance: 'media', rating: 3, tags: ['Diamante'] },
  { id: 13, name: 'Irish Charms', provider: 'pp', performance: 'media', rating: 3, tags: ['Trevo'] },
  { id: 9, name: 'Plush WINS', provider: 'pp', performance: 'media', rating: 2, tags: ['Clássico'] },
  { id: 14, name: 'Diamonds Are Forever', provider: 'pp', performance: 'media', rating: 3, tags: ['Diamante'] },
  { id: 11, name: 'Jade Butterfly', provider: 'pp', performance: 'baixa', rating: 3, tags: ['Média/Montante'] },

  // ── WG (primeiros: Dragon vs Tiger, Lucky Dog) ──
  { id: 16, name: 'Dragon vs Tiger', provider: 'wg', performance: 'alta', rating: 3, tags: ['Cartas', 'Rápido'] },
  { id: 18, name: 'Lucky Dog', provider: 'wg', performance: 'media', rating: 2, tags: ['Animal'] },
  { id: 20, name: 'Dragon Treasure II', provider: 'wg', performance: 'alta', rating: 3, tags: ['Dragão'] },
  { id: 17, name: 'Mais Fortuna & Riqueza', provider: 'wg', performance: 'media', rating: 3, tags: ['Slots'] },
  { id: 21, name: 'Fishing Master', provider: 'wg', performance: 'media', rating: 3, tags: ['Pescaria'] },
  { id: 19, name: 'Treasure Bowl', provider: 'wg', performance: 'media', rating: 3, tags: ['Pote'] },

  // ── MG (embaralhado) ──
  { id: 23, name: 'Lucky Twins', provider: 'mg', performance: 'alta', rating: 3, tags: ['Asiático'] },
  { id: 22, name: '777 Mega Deluxe', provider: 'mg', performance: 'media', rating: 2, tags: ['Clássico'] },
  { id: 24, name: '777 BIG', provider: 'mg', performance: 'media', rating: 3, tags: ['Jackpot'] },

  // ── JILI (primeiro: FaFaFa) ──
  { id: 29, name: 'FaFaFa', provider: 'jili', performance: 'baixa', rating: 2, tags: ['Simples'] },
  { id: 28, name: 'XIYANGYANG', provider: 'jili', performance: 'alta', rating: 3, tags: ['Cartas'] },
  { id: 25, name: 'Jungle King', provider: 'jili', performance: 'alta', rating: 3, tags: ['Aventura'] },
  { id: 27, name: 'Crazy Hunter', provider: 'jili', performance: 'media', rating: 3, tags: ['Pulso'] },
  { id: 30, name: 'Golden Joker', provider: 'jili', performance: 'baixa', rating: 2, tags: ['Simples'] },
  { id: 26, name: 'Crazy 777', provider: 'jili', performance: 'baixa', rating: 3, tags: ['Rápido'] },

  // ── JDB (primeiro: Super Niubi) ──
  { id: 34, name: 'Super Niubi', provider: 'jdb', performance: 'alta', rating: 3, tags: ['Popular'] },
  { id: 35, name: 'Crazy King Kong', provider: 'jdb', performance: 'alta', rating: 3, tags: ['Ação'] },
  { id: 32, name: 'Funky King Kong', provider: 'jdb', performance: 'media', rating: 3, tags: ['Ação'] },
  { id: 38, name: 'Fruity Bonanza', provider: 'jdb', performance: 'media', rating: 3, tags: ['Frutas'] },
  { id: 31, name: 'Triple King Kong', provider: 'jdb', performance: 'alta', rating: 3, tags: ['Ação'] },
  { id: 36, name: 'Lucky Color', provider: 'jdb', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 33, name: 'Treasure Bowl', provider: 'jdb', performance: 'media', rating: 3, tags: ['Pote'] },
  { id: 37, name: 'Bulls Treasure', provider: 'jdb', performance: 'media', rating: 3, tags: ['Aventura'] },

  // ── FC (primeiros: Gladiatriz de Roma, Golden Panther) ──
  { id: 45, name: 'Gladiatriz de Roma', provider: 'fc', performance: 'alta', rating: 2, tags: ['Batalha'] },
  { id: 42, name: 'Golden Panther', provider: 'fc', performance: 'alta', rating: 2, tags: ['Pantera'] },
  { id: 43, name: 'Rich Man', provider: 'fc', performance: 'alta', rating: 3, tags: ['Magnata'] },
  { id: 39, name: 'Treasure Raiders', provider: 'fc', performance: 'media', rating: 3, tags: ['Tumba'] },
  { id: 44, name: 'Color Game', provider: 'fc', performance: 'baixa', rating: 3, tags: ['Dados'] },
  { id: 40, name: 'Cowboys', provider: 'fc', performance: 'alta', rating: 2, tags: ['Oeste'] },
  { id: 41, name: 'Fortune Sheep', provider: 'fc', performance: 'baixa', rating: 2, tags: ['Ovelha'] },

  // ── PESCARIA (embaralhado) ──
  { id: 48, name: 'Boom Legend', provider: 'pescaria', performance: 'alta', rating: 3, tags: ['Montante'] },
  { id: 46, name: 'Mega Fishing', provider: 'pescaria', performance: 'alta', rating: 3, tags: ['Média Alta'] },
  { id: 49, name: 'Dragon Fortune', provider: 'pescaria', performance: 'alta', rating: 3, tags: ['Montante'] },
  { id: 47, name: 'Happy Fishing', provider: 'pescaria', performance: 'alta', rating: 3, tags: ['Montante'] },
]

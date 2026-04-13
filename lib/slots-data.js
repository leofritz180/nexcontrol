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
  // WG
  { id: 1, name: 'Dragon vs Tiger', provider: 'wg', performance: 'alta', rating: 5, tags: ['Cartas'] },
  { id: 2, name: 'Lucky Dog', provider: 'wg', performance: 'media', rating: 4, tags: ['Casual'] },
  { id: 3, name: 'Treasure Bowl', provider: 'wg', performance: 'alta', rating: 4, tags: ['Clássico'] },
  { id: 4, name: '777 Mega Deluxe', provider: 'wg', performance: 'alta', rating: 5, tags: ['Premium'] },
  { id: 5, name: 'Lucky Twins', provider: 'wg', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 6, name: '777 BIG', provider: 'wg', performance: 'alta', rating: 4, tags: ['Rápido'] },

  // MG
  { id: 7, name: 'Mais Fortuna & Riqueza', provider: 'mg', performance: 'alta', rating: 5, tags: ['Premium'] },
  { id: 8, name: 'Dragon Treasure II', provider: 'mg', performance: 'alta', rating: 4, tags: ['Aventura'] },
  { id: 9, name: 'Golden Joker', provider: 'mg', performance: 'media', rating: 4, tags: ['Clássico'] },
  { id: 10, name: 'FaFaFa', provider: 'mg', performance: 'media', rating: 3, tags: ['Rápido'] },

  // JILI
  { id: 11, name: 'Jungle King', provider: 'jili', performance: 'alta', rating: 5, tags: ['Aventura'] },
  { id: 12, name: 'Crazy 777', provider: 'jili', performance: 'alta', rating: 4, tags: ['Rápido'] },
  { id: 13, name: 'Crazy Hunter', provider: 'jili', performance: 'alta', rating: 5, tags: ['Ação'] },
  { id: 14, name: 'XIYANGYANG', provider: 'jili', performance: 'alta', rating: 4, tags: ['Popular'] },
  { id: 15, name: 'Super Niubi', provider: 'jili', performance: 'media', rating: 4, tags: ['Casual'] },
  { id: 16, name: 'Crazy King Kong', provider: 'jili', performance: 'alta', rating: 4, tags: ['Ação'] },
  { id: 17, name: 'Triple King Kong', provider: 'jili', performance: 'alta', rating: 5, tags: ['Premium'] },
  { id: 18, name: 'Funky King Kong', provider: 'jili', performance: 'media', rating: 4, tags: ['Ação'] },
  { id: 19, name: 'Color Game', provider: 'jili', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 20, name: 'Lucky Color', provider: 'jili', performance: 'media', rating: 3, tags: ['Rápido'] },
  { id: 21, name: 'Rich Man', provider: 'jili', performance: 'alta', rating: 4, tags: ['Premium'] },
  { id: 22, name: 'Gladiatriz de Roma', provider: 'jili', performance: 'alta', rating: 5, tags: ['Premium'] },
  { id: 23, name: 'Bulls Treasure', provider: 'jili', performance: 'media', rating: 4, tags: ['Aventura'] },

  // JDB
  { id: 24, name: 'Treasure Raiders', provider: 'jdb', performance: 'alta', rating: 5, tags: ['Aventura'] },
  { id: 25, name: 'Cowboys', provider: 'jdb', performance: 'media', rating: 4, tags: ['Ação'] },
  { id: 26, name: 'Fortune Sheep', provider: 'jdb', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 27, name: 'Golden Panther', provider: 'jdb', performance: 'alta', rating: 4, tags: ['Premium'] },
  { id: 28, name: 'Fruity Bonanza', provider: 'jdb', performance: 'media', rating: 4, tags: ['Rápido'] },

  // PG
  { id: 29, name: 'Fortune Dragon', provider: 'pg', performance: 'alta', rating: 5, tags: ['Premium'] },
  { id: 30, name: 'Gem Saviour', provider: 'pg', performance: 'media', rating: 4, tags: ['Aventura'] },
  { id: 31, name: 'Piggy Gold', provider: 'pg', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 32, name: 'Chicky Run', provider: 'pg', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 33, name: 'Prosperity Lion', provider: 'pg', performance: 'alta', rating: 4, tags: ['Premium'] },
  { id: 34, name: 'Mr Hallow Jackpot', provider: 'pg', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 35, name: 'Plushie Frenzy', provider: 'pg', performance: 'media', rating: 4, tags: ['Rápido'] },
  { id: 36, name: 'Win Win Won', provider: 'pg', performance: 'alta', rating: 4, tags: ['Popular'] },
  { id: 37, name: 'Plush WINS', provider: 'pg', performance: 'media', rating: 3, tags: ['Novo'] },

  // PP
  { id: 38, name: '888 Gold', provider: 'pp', performance: 'media', rating: 4, tags: ['Clássico'] },
  { id: 39, name: 'Jade Butterfly', provider: 'pp', performance: 'media', rating: 4, tags: ['Casual'] },
  { id: 40, name: 'Fire Strike', provider: 'pp', performance: 'alta', rating: 4, tags: ['Ação'] },
  { id: 41, name: 'Irish Charms', provider: 'pp', performance: 'media', rating: 3, tags: ['Casual'] },
  { id: 42, name: 'Diamonds Are Forever', provider: 'pp', performance: 'alta', rating: 5, tags: ['Premium'] },
  { id: 43, name: 'Diamond Strike', provider: 'pp', performance: 'alta', rating: 4, tags: ['Rápido'] },

  // FC
  { id: 44, name: 'Dragon Fortune', provider: 'fc', performance: 'alta', rating: 5, tags: ['Premium'] },
  { id: 45, name: 'Fishing Master', provider: 'fc', performance: 'alta', rating: 4, tags: ['Pescaria'] },
  { id: 46, name: 'Mega Fishing', provider: 'fc', performance: 'alta', rating: 5, tags: ['Pescaria'] },

  // Pescaria
  { id: 47, name: 'Happy Fishing', provider: 'pescaria', performance: 'alta', rating: 4, tags: ['Pescaria'] },
  { id: 48, name: 'Boom Legend', provider: 'pescaria', performance: 'alta', rating: 5, tags: ['Ação'] },
]

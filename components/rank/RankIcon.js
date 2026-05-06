'use client'

/**
 * SVG icons custom pra cada rank.
 * Cada um é distinto visualmente — escudo simples → gema → coroa → cosmic.
 */
export default function RankIcon({ name, size = 20, color = 'currentColor' }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'shield': return (
      <svg {...props}><path d="M12 2L4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3z" /></svg>
    )
    case 'shield-star': return (
      <svg {...props}><path d="M12 2L4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3z" /><path d="M12 8l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 14l-2.4 1.2.5-2.6L8.2 10.8l2.6-.4z" fill={color} fillOpacity="0.3"/></svg>
    )
    case 'shield-stars': return (
      <svg {...props}><path d="M12 2L4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3z" /><circle cx="9" cy="11" r="1" fill={color}/><circle cx="15" cy="11" r="1" fill={color}/><circle cx="12" cy="14" r="1" fill={color}/></svg>
    )
    case 'crown-shield': return (
      <svg {...props}><path d="M12 2L4 5v7c0 5 3.5 9 8 10 4.5-1 8-5 8-10V5l-8-3z" /><path d="M8 10l1.5 3 2.5-2 2.5 2 1.5-3v3H8z" fill={color} fillOpacity="0.4"/></svg>
    )
    case 'crystal': return (
      <svg {...props}><path d="M12 2L6 9l6 13 6-13-6-7z" /><path d="M6 9l6 4 6-4" /><path d="M12 2v20" /></svg>
    )
    case 'gem-emerald': return (
      <svg {...props}><path d="M12 2L4 8v8l8 6 8-6V8l-8-6z" /><path d="M4 8l8 6 8-6" /><path d="M12 2v20" /></svg>
    )
    case 'gem-sapphire': return (
      <svg {...props}><path d="M5 8l3-5h8l3 5-7 13z" /><path d="M5 8h14" /><path d="M9 8l3 13 3-13" /></svg>
    )
    case 'gem-ruby': return (
      <svg {...props}><path d="M12 2l-7 6 7 14 7-14z" /><path d="M5 8h14" /><path d="M9.5 8L12 22M14.5 8L12 22" /></svg>
    )
    case 'diamond': return (
      <svg {...props}><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18" /><path d="M8 9l4 12L16 9" /><path d="M9 3l3 6 3-6" /></svg>
    )
    case 'crown': return (
      <svg {...props}><path d="M3 8l3 10h12l3-10-5 4-4-7-4 7z" /><circle cx="12" cy="4" r="1.5" fill={color}/><circle cx="3" cy="8" r="1.2" fill={color}/><circle cx="21" cy="8" r="1.2" fill={color}/></svg>
    )
    case 'lightning': return (
      <svg {...props}><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill={color} fillOpacity="0.2"/></svg>
    )
    case 'flame': return (
      <svg {...props}><path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3-1-3-1-5-3-9-3 4-5 8-5 13 0 4 3 7 7 7z" fill={color} fillOpacity="0.15"/></svg>
    )
    case 'eye': return (
      <svg {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" fill={color}/></svg>
    )
    case 'crown-stars': return (
      <svg {...props}><path d="M3 9l3 9h12l3-9-5 3-4-6-4 6z" fill={color} fillOpacity="0.2"/><circle cx="12" cy="3" r="1" fill={color}/><circle cx="6" cy="6" r="0.7" fill={color}/><circle cx="18" cy="6" r="0.7" fill={color}/><circle cx="2" cy="11" r="0.5" fill={color}/><circle cx="22" cy="11" r="0.5" fill={color}/></svg>
    )
    case 'apex': return (
      <svg {...props}><circle cx="12" cy="12" r="9" stroke={color} fill={color} fillOpacity="0.05"/><path d="M12 3l2 6 6 1-4.5 4.5L17 21l-5-3-5 3 1.5-6.5L4 10l6-1z" fill={color} fillOpacity="0.4"/><circle cx="12" cy="12" r="2" fill={color}/></svg>
    )
    default: return (
      <svg {...props}><circle cx="12" cy="12" r="10"/></svg>
    )
  }
}

/**
 * NexControl Video — Configuration v3
 */

export const V = {
  w: 1080,
  h: 1920,
  fps: 60,
  dur: 8,
  get frames() { return this.fps * this.dur },
  bitrate: 10_000_000,
  format: 'video/webm;codecs=vp9',
}

// Timeline in seconds
export const T = {
  // Scene 1: Entrance
  bgFade:     [0,    0.8 ],
  particles:  [0.3,  1.2 ],
  glowRise:   [0,    1.0 ],
  titleIn:    [0.4,  0.7 ],
  titleOut:   [2.0,  0.4 ],

  // Scene 2: Ring construction
  ringOuter:  [1.0,  1.2 ],
  ringDeco:   [1.2,  1.0 ],
  ringMain:   [1.4,  1.0 ],
  ringInner:  [1.6,  0.8 ],

  // Scene 3: Value impact
  countUp:    [2.3,  1.8 ],
  impact:     [3.8,  0.5 ],
  metaText:   [4.0,  0.5 ],

  // Scene 4: Complementary data
  dataIn:     [4.5,  0.4 ],
  dataStagger: 0.15, // delay between each data item

  // Scene 5: Brand
  brandIn:    [6.0,  0.6 ],

  // Master fade
  fadeOut:     [7.0,  1.0 ],
}

export const C = {
  profit: { r:34, g:197, b:94, hex:'#22C55E' },
  loss:   { r:239, g:68, b:68, hex:'#EF4444' },
  brand:  '#e53935',
  bg:     '#050505',
}

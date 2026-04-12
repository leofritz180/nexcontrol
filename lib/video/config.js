/**
 * NexControl Video — Configuration v3
 */

export const WIDTH = 1080
export const HEIGHT = 1920
export const FPS = 60
export const DURATION = 8
export const TOTAL_FRAMES = FPS * DURATION // 480
export const BITRATE = 10_000_000

// Timeline in seconds [start, duration]
export const T = {
  bgFade:     [0,    0.8 ],
  particles:  [0.3,  1.2 ],
  glowRise:   [0,    1.0 ],
  titleIn:    [0.4,  0.7 ],
  titleOut:   [2.0,  0.4 ],

  ringOuter:  [1.0,  1.2 ],
  ringDeco:   [1.2,  1.0 ],
  ringMain:   [1.4,  1.0 ],
  ringInner:  [1.6,  0.8 ],

  countUp:    [2.3,  1.8 ],
  impact:     [3.8,  0.5 ],
  metaText:   [4.0,  0.5 ],

  dataIn:     [4.5,  0.4 ],
  dataStagger: 0.15,

  brandIn:    [6.0,  0.6 ],

  fadeOut:     [7.0,  1.0 ],
}

export const C = {
  profit: { r:34, g:197, b:94, hex:'#22C55E' },
  loss:   { r:239, g:68, b:68, hex:'#EF4444' },
  brand:  '#e53935',
  bg:     '#050505',
}

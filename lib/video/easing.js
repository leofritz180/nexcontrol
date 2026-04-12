/**
 * NexControl Video — Easing v3
 */
export const out3 = t => 1 - Math.pow(1-t, 3)
export const out4 = t => 1 - Math.pow(1-t, 4)
export const inOut3 = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2
export const outExpo = t => t===1 ? 1 : 1-Math.pow(2,-10*t)
export const outBack = t => {
  const c=2.70158
  return 1 + c*Math.pow(t-1,3) + (c-1)*Math.pow(t-1,2)
}

/** Phase: 0→1 within [start, start+dur] */
export const ph = (sec, start, dur) => Math.max(0, Math.min(1, (sec-start)/dur))
/** Phase from timeline array [start, dur] */
export const pt = (sec, t) => ph(sec, t[0], t[1])

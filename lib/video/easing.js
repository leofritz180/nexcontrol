/**
 * NexControl Video — Easing functions
 */

export const out4 = t => 1 - Math.pow(1-t, 4)
export const out3 = t => 1 - Math.pow(1-t, 3)
export const inOut3 = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2
export const outExpo = t => t===1 ? 1 : 1 - Math.pow(2, -10*t)
export const outBack = t => {
  const c1=1.70158, c3=c1+1
  return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2)
}

/** Get phase progress: 0→1 within a time window */
export const phase = (sec, start, dur) => Math.max(0, Math.min(1, (sec-start)/dur))

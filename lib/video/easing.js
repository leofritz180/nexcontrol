export const out3 = t => 1-Math.pow(1-t,3)
export const out4 = t => 1-Math.pow(1-t,4)
export const outExpo = t => t===1?1:1-Math.pow(2,-10*t)
export const inOut3 = t => t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2
export const outBack = t => {const c=2.5;return 1+c*Math.pow(t-1,3)+(c-1)*Math.pow(t-1,2)}
export const ph = (sec,s,d) => Math.max(0,Math.min(1,(sec-s)/d))

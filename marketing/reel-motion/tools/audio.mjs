/* utilidades de áudio: WAV 48 kHz estéreo 16 bit, leitura da voz via ffmpeg */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

export const SR = 48000;
export const FF = ffmpeg;

export function gravarWav(p, l, r) {
  const n = l.length, d = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const a = Number.isFinite(l[i]) ? l[i] : 0, b = Number.isFinite(r[i]) ? r[i] : 0;
    d.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(a * 32767))), i * 4);
    d.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(b * 32767))), i * 4 + 2);
  }
  const c = Buffer.alloc(44);
  c.write("RIFF", 0); c.writeUInt32LE(36 + d.length, 4); c.write("WAVE", 8); c.write("fmt ", 12); c.writeUInt32LE(16, 16); c.writeUInt16LE(1, 20); c.writeUInt16LE(2, 22); c.writeUInt32LE(SR, 24); c.writeUInt32LE(SR * 4, 28); c.writeUInt16LE(4, 32); c.writeUInt16LE(16, 34); c.write("data", 36); c.writeUInt32LE(d.length, 40);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, Buffer.concat([c, d]));
}
export function lerWav(p, n) {
  const b = fs.readFileSync(p);
  const m = (b.length - 44) / 4;
  const l = new Float32Array(n), r = new Float32Array(n);
  for (let i = 0; i < Math.min(n, m); i++) { l[i] = b.readInt16LE(44 + i * 4) / 32768; r[i] = b.readInt16LE(46 + i * 4) / 32768; }
  return [l, r];
}
/** narração decodificada em estéreo float, do tamanho pedido */
export function lerVoz(mp3, n) {
  const raw = mp3 + ".f32";
  const r = spawnSync(FF, ["-y", "-loglevel", "error", "-i", mp3, "-ac", "2", "-ar", String(SR), "-f", "f32le", raw], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg falhou lendo " + mp3);
  const b = fs.readFileSync(raw); fs.unlinkSync(raw);
  const f = new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4));
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = f[i * 2] ?? 0; R[i] = f[i * 2 + 1] ?? 0; }
  return [L, R];
}
export const pico = (l, r) => { let p = 0; for (let i = 0; i < l.length; i++) p = Math.max(p, Math.abs(l[i]), Math.abs(r[i])); return p; };
export const db = (x) => Math.pow(10, x / 20);

/**
 * NexControl Video — Configuration
 * Central config for video rendering
 */

export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 60,
  duration: 7, // seconds
  get totalFrames() { return this.fps * this.duration },
  bitrate: 8_000_000,
  format: 'video/webm;codecs=vp9',
}

export const TIMELINE = {
  intro:    { start: 0,   dur: 1.2 },
  title:    { start: 0.3, dur: 0.8 },
  build:    { start: 0.8, dur: 2.0 },
  countup:  { start: 1.5, dur: 2.0 },
  impact:   { start: 3.0, dur: 0.6 },
  stable:   { start: 3.5, dur: 1.0 },
  confirm:  { start: 4.8, dur: 0.6 },
  brand:    { start: 5.5, dur: 0.6 },
  fade:     { start: 6.0, dur: 1.0 },
}

export const COLORS = {
  profit: { hex: '#22C55E', r: 34, g: 197, b: 94 },
  loss:   { hex: '#EF4444', r: 239, g: 68, b: 68 },
  brand:  { hex: '#e53935' },
  bg:     '#010204',
}

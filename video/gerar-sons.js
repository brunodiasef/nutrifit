// Gera os efeitos sonoros do vídeo (WAV 16 bits, 44,1 kHz) — determinístico, sem downloads.
const fs = require('fs');
const SR = 44100;
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
function wav(nome, dur, fn){
  const n = Math.round(dur * SR), buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  let lp = 0;
  for (let i = 0; i < n; i++){ const t = i / SR; let v = fn(t, t / dur, x => (lp += (x - lp) * 0.08));
    v = Math.max(-1, Math.min(1, v)); buf.writeInt16LE(Math.round(v * 32000), 44 + i * 2); }
  fs.writeFileSync(`public/sfx/${nome}.wav`, buf);
}
const env = (p, a = 0.05) => Math.min(1, p / a) * Math.pow(1 - p, 2);
// sopro de entrada: ruído filtrado subindo
wav('whoosh', 0.55, (t, p, low) => low(rnd()) * 3.2 * Math.sin(Math.PI * p) ** 2);
// "puxada": bumbo grave com queda de altura
wav('thump', 0.32, (t, p) => Math.sin(2 * Math.PI * (55 + 120 * Math.exp(-t * 28)) * t) * Math.exp(-t * 11) * 0.95);
// impacto: grave longo + estalo
wav('impact', 0.9, (t, p) => Math.sin(2 * Math.PI * (42 + 90 * Math.exp(-t * 18)) * t) * Math.exp(-t * 4.5) * 0.9 + rnd() * Math.exp(-t * 60) * 0.5);
// brilho metálico: senos agudos desafinados com ataque suave
wav('shimmer', 0.8, (t, p) => [2093, 2637, 3136, 4186].reduce((a, f, k) => a + Math.sin(2 * Math.PI * f * (1 + k * 0.002) * t), 0) * 0.12 * env(p, 0.15));
// pop da frase
wav('pop', 0.18, (t, p) => Math.sin(2 * Math.PI * (900 * Math.exp(-t * 30) + 260) * t) * Math.exp(-t * 26) * 0.7);
// saída
wav('swoosh-out', 0.4, (t, p, low) => low(rnd()) * 2.6 * Math.sin(Math.PI * (1 - p)) ** 2 * (1 - p));
// fundo: acorde suave (Ré maior) com entrada e saída
wav('pad', 4.5, (t, p) => [146.8, 220, 293.7, 370].reduce((a, f, k) => a + Math.sin(2 * Math.PI * f * t + k) * (k === 3 ? 0.5 : 1), 0) * 0.13
  * Math.min(1, t / 0.8) * Math.min(1, (4.5 - t) / 0.5) * (0.85 + 0.15 * Math.sin(t * 5)));
console.log('sons gerados');

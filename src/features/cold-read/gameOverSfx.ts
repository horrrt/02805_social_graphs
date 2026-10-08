// Game-over sounds. playGameOver(n) plays card n's effect, then its spoken
// line. The effect is a CC0 recording from Freesound (fx-NNN.mp3, listed in
// fx-credits.json) and falls back to the Web Audio synth below if it fails to
// load; the line is go-NNN.mp3. Both are under public/play/cold-read/audio/,
// made by scripts/cold-read-voices/. Silent where the browser has no Web Audio,
// as in tests.
import { asset } from "@/scripts/site.js";

type ToneOpts = { f?: number; to?: number; d?: number; type?: OscillatorType; v?: number; at?: number; vib?: [number, number]; attack?: number; lp?: number };
type NoiseOpts = { d?: number; f?: number; to?: number; q?: number; type?: BiquadFilterType; v?: number; at?: number; attack?: number; am?: number };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function ac(): AudioContext | null {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A tone: freq may slide to `to`; vib adds vibrato (rate Hz, depth Hz); lp low-passes it. */
function tone({ f = 440, to, d = 0.2, type = "sine", v = 0.3, at = 0, vib, attack = 0.005, lp }: ToneOpts) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  if (vib) {
    const l = c.createOscillator();
    const lg = c.createGain();
    l.frequency.value = vib[0];
    lg.gain.value = vib[1];
    l.connect(lg).connect(o.frequency);
    l.start(t);
    l.stop(t + d + 0.05);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  if (lp) {
    const fl = c.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.value = lp;
    g.connect(fl).connect(master);
  } else g.connect(master);
  o.start(t);
  o.stop(t + d + 0.05);
}

/** Filtered noise; f to `to` sweeps the filter; am pulses the level. */
function noise({ d = 0.2, f = 1000, to, q = 1, type = "lowpass", v = 0.3, at = 0, attack = 0.005, am }: NoiseOpts) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + at;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const a = noiseBuf.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  const fl = c.createBiquadFilter();
  const g = c.createGain();
  s.buffer = noiseBuf;
  s.loop = true;
  fl.type = type;
  fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t);
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  if (am) {
    const l = c.createOscillator();
    const lg = c.createGain();
    l.frequency.value = am;
    lg.gain.value = v * 0.8;
    l.connect(lg).connect(g.gain);
    l.start(t);
    l.stop(t + d);
  }
  s.connect(fl).connect(g).connect(master);
  s.start(t);
  s.stop(t + d + 0.05);
}

// Building blocks.
const B = {
  thud: (at = 0) => { tone({ f: 120, to: 40, d: 0.35, v: 0.6, at }); noise({ d: 0.15, f: 300, v: 0.4, at }); },
  splat: (at = 0) => { noise({ d: 0.28, f: 1400, to: 200, v: 0.55, at }); tone({ f: 160, to: 50, d: 0.25, v: 0.4, at }); },
  whoosh: (at = 0, d = 0.3) => noise({ d, f: 600, to: 3000, type: "bandpass", q: 2, v: 0.5, at, attack: d * 0.6 }),
  slash: (at = 0) => { noise({ d: 0.18, f: 4000, to: 800, type: "bandpass", q: 3, v: 0.6, at }); tone({ f: 2400, to: 900, d: 0.12, type: "sawtooth", v: 0.08, at }); },
  pop: (at = 0) => { tone({ f: 500, to: 1400, d: 0.06, v: 0.4, at }); noise({ d: 0.04, f: 3000, type: "highpass", v: 0.3, at }); },
  boing: (at = 0) => tone({ f: 180, to: 520, d: 0.5, v: 0.35, at, vib: [18, 40] }),
  honk: (at = 0) => tone({ f: 240, d: 0.35, type: "square", v: 0.2, at, vib: [30, 12], lp: 1200 }),
  squeak: (at = 0) => tone({ f: 1300, to: 2000, d: 0.12, v: 0.25, at, vib: [40, 80] }),
  clap: (at = 0) => noise({ d: 0.09, f: 1200, type: "highpass", v: 0.6, at }),
  crunch: (at = 0) => { for (let i = 0; i < 4; i++) noise({ d: 0.05, f: 2500, type: "bandpass", q: 1, v: 0.4, at: at + i * 0.06 }); },
  ding: (at = 0, f = 1320) => { tone({ f, d: 0.8, v: 0.25, at }); tone({ f: f * 2.01, d: 0.4, v: 0.08, at }); },
  buzzer: (at = 0) => tone({ f: 110, d: 0.6, type: "square", v: 0.18, at, lp: 900 }),
  sad: (at = 0) => { [392, 370, 349].forEach((f, i) => tone({ f, d: 0.45, type: "sawtooth", v: 0.12, at: at + i * 0.45, lp: 1400 })); tone({ f: 330, d: 1.2, type: "sawtooth", v: 0.12, at: at + 1.35, vib: [6, 8], lp: 1400 }); },
  pew: (at = 0) => tone({ f: 1400, to: 180, d: 0.18, type: "square", v: 0.12, at }),
  blip: (at = 0, f = 660) => tone({ f, to: f * 1.6, d: 0.1, type: "square", v: 0.1, at }),
  crack: (at = 0) => { noise({ d: 0.12, f: 5000, type: "highpass", v: 0.5, at }); noise({ d: 0.3, f: 800, v: 0.3, at: at + 0.02 }); },
  sip: (at = 0) => noise({ d: 0.4, f: 2500, to: 4000, type: "bandpass", q: 4, v: 0.2, at, attack: 0.2 }),
  hiss: (at = 0, d = 0.6) => noise({ d, f: 5000, type: "highpass", v: 0.12, at, attack: 0.1 }),
  tick: (at = 0) => noise({ d: 0.03, f: 4000, type: "bandpass", q: 6, v: 0.5, at }),
  plink: (at = 0) => tone({ f: 900 + Math.random() * 500, to: 500, d: 0.12, v: 0.15, at }),
  note: (f: number, at = 0, d = 0.3, type: OscillatorType = "triangle", v = 0.2) => tone({ f, d, type, v, at }),
  party: (at = 0) => tone({ f: 300, to: 520, d: 0.45, type: "sawtooth", v: 0.12, at, vib: [25, 15], lp: 2500 }),
  sparkle: (at = 0) => [1568, 2093, 2637, 3136].forEach((f, i) => tone({ f, d: 0.25, v: 0.08, at: at + i * 0.06 })),
  laugh: (at = 0, n = 5) => { for (let i = 0; i < n; i++) { tone({ f: 330 - i * 12, d: 0.12, type: "sawtooth", v: 0.12, at: at + i * 0.17, lp: 1800 }); noise({ d: 0.1, f: 1500, type: "bandpass", q: 2, v: 0.15, at: at + i * 0.17 }); } },
  sob: (at = 0) => { for (let i = 0; i < 3; i++) tone({ f: 420, to: 300, d: 0.25, type: "sawtooth", v: 0.08, at: at + i * 0.3, vib: [9, 20], lp: 1500 }); },
  snore: (at = 0) => { noise({ d: 1.1, f: 300, v: 0.35, at, attack: 0.5, am: 30 }); tone({ f: 300, to: 700, d: 0.6, v: 0.06, at: at + 1.2 }); },
  step: (at = 0) => { tone({ f: 90, to: 50, d: 0.08, v: 0.4, at }); noise({ d: 0.05, f: 600, v: 0.2, at }); },
  kazoo: (f: number, at = 0, d = 0.4) => tone({ f, d, type: "sawtooth", v: 0.12, at, vib: [7, 10], lp: 1600 }),
  shutter: (at = 0) => { noise({ d: 0.03, f: 3000, type: "highpass", v: 0.6, at }); noise({ d: 0.05, f: 2000, type: "highpass", v: 0.5, at: at + 0.09 }); },
  bell: (at = 0) => { tone({ f: 220, d: 2, v: 0.25, at }); tone({ f: 441, d: 1.5, v: 0.1, at }); tone({ f: 662, d: 1, v: 0.06, at }); },
  boom: (at = 0) => { tone({ f: 80, to: 30, d: 1.2, v: 0.6, at }); noise({ d: 0.9, f: 400, to: 60, v: 0.5, at }); },
  pour: (at = 0, d = 2) => noise({ d, f: 500, to: 250, v: 0.25, at, attack: 0.4, am: 9 }),
};
const R: Record<number, () => void> = {
  1: () => { B.boing(); B.thud(0.4); },
  2: () => { B.crack(); B.sad(0.3); },
  3: () => { tone({ f: 600, to: 300, d: 0.2, v: 0.25 }); tone({ f: 300, to: 600, d: 0.2, v: 0.25, at: 0.25 }); B.boing(0.5); },
  4: () => { B.thud(); [2400, 2800, 2400, 3000].forEach((f, i) => tone({ f, to: f * 1.2, d: 0.08, v: 0.1, at: 0.3 + i * 0.12 })); },
  5: () => { noise({ d: 0.5, f: 900, to: 200, type: "bandpass", q: 3, v: 0.3 }); B.plink(0.6); },
  6: () => { tone({ f: 90, d: 0.7, type: "sawtooth", v: 0.25, vib: [35, 30], lp: 900 }); noise({ d: 0.7, f: 700, v: 0.2, am: 35 }); },
  7: () => { B.blip(0, 988); B.blip(0.08, 1319); tone({ f: 300, to: 1200, d: 0.6, type: "triangle", v: 0.1, at: 0.2, vib: [20, 100] }); },
  8: () => { B.whoosh(0, 0.25); B.slash(0.3); B.splat(0.45); for (let i = 0; i < 6; i++) B.plink(0.8 + i * 0.18); B.pour(1.2, 1.6); },
  9: () => { B.crack(); B.sad(0.3); },
  10: () => { B.crunch(); B.crunch(0.4); tone({ f: 220, to: 330, d: 0.25, v: 0.15, at: 0.9 }); },
  11: () => { B.hiss(0, 0.35); tone({ f: 1400, to: 2200, d: 0.15, v: 0.15, at: 0.5 }); tone({ f: 2200, to: 1400, d: 0.2, v: 0.15, at: 0.65 }); },
  12: () => { B.pew(); B.pew(0.45); B.pew(0.9); },
  13: () => { tone({ f: 110, d: 1, type: "sawtooth", v: 0.12, vib: [40, 20], lp: 2000 }); B.splat(0.6); B.splat(0.75); },
  14: () => { B.blip(0, 520); B.blip(0.3, 620); B.blip(0.6, 740); tone({ f: 110, d: 0.4, type: "sawtooth", v: 0.1, at: 0.9, lp: 2000 }); B.splat(1.0); },
  15: () => { B.whoosh(0, 0.3); B.crack(0.35); B.boom(0.4); B.splat(0.5); },
  16: () => { tone({ f: 1200, d: 0.05, v: 0.1 }); B.shutter(0.3); B.ding(0.8, 1760); },
  17: () => { B.party(); B.sparkle(0.5); for (let i = 0; i < 6; i++) B.step(0.2 + i * 0.15); },
  18: () => { B.buzzer(); },
  19: () => { [988, 0, 784, 0, 659, 523, 392].forEach((f, i) => f && tone({ f, d: 0.12, type: "square", v: 0.1, at: i * 0.12 })); tone({ f: 600, to: 100, d: 0.6, type: "square", v: 0.1, at: 1 }); },
  20: () => { tone({ f: 400, to: 900, d: 0.3, type: "square", v: 0.04 }); B.thud(0.5); tone({ f: 2800, d: 0.5, v: 0.05, at: 0.55 }); },
  21: () => { [110, 104, 98].forEach((f, i) => tone({ f, d: i === 2 ? 1.4 : 0.4, type: "sawtooth", v: 0.2, at: i * 0.6, lp: 900, vib: i === 2 ? [5, 3] : undefined })); },
  22: () => { tone({ f: 55, d: 3, type: "sawtooth", v: 0.2, lp: 300, attack: 0.6 }); B.bell(0.4); },
  23: () => { tone({ f: 200, to: 40, d: 1.6, type: "sawtooth", v: 0.15, lp: 800 }); B.boom(1.4); },
  24: () => [659, 622, 587, 554, 523].forEach((f, i) => tone({ f, d: 0.55, type: "sawtooth", v: 0.07, at: i * 0.5, vib: [5.5, 6], lp: 2500, attack: 0.15 })),
  25: () => { for (let i = 0; i < 12; i++) noise({ d: 0.04, f: 2000 + Math.random() * 3000, type: "bandpass", q: 3, v: 0.25, at: Math.random() * 1.5 }); B.sip(0.6); },
  26: () => { for (let i = 0; i < 8; i++) { tone({ f: 65, to: 45, d: 0.15, v: 0.4, at: i * 0.25 }); noise({ d: 0.04, f: 8000, type: "highpass", v: 0.15, at: i * 0.25 + 0.125 }); } [392, 392, 440, 349].forEach((f, i) => tone({ f, d: 0.22, type: "square", v: 0.05, at: i * 0.5 })); },
  27: () => { B.whoosh(0, 0.2); tone({ f: 300, to: 120, d: 0.25, type: "square", v: 0.15, at: 0.22 }); B.thud(0.22); [2400, 2800, 2400].forEach((f, i) => tone({ f, d: 0.1, v: 0.08, at: 0.5 + i * 0.12 })); },
  28: () => { noise({ d: 0.6, f: 3000, type: "bandpass", q: 1, v: 0.15, am: 12 }); tone({ f: 98, d: 1.6, type: "sawtooth", v: 0.15, at: 0.5, lp: 700, attack: 0.3 }); },
  29: () => { for (let i = 0; i < 5; i++) { tone({ f: 880, d: 0.12, type: "triangle", v: 0.18, at: i * 0.35 }); tone({ f: 660, d: 0.25, type: "triangle", v: 0.18, at: i * 0.35 + 0.1 }); } },
  30: () => { noise({ d: 2, f: 400, to: 3000, type: "bandpass", q: 0.8, v: 0.25, attack: 0.8 }); },
  31: () => { for (let i = 0; i < 6; i++) B.step(0.4 + i * 0.3); tone({ f: 220, to: 330, d: 0.2, v: 0.08 }); },
  32: () => { B.clap(); B.clap(1.2); B.clap(2.4); },
  33: () => { tone({ f: 300, to: 700, d: 0.3, v: 0.1 }); B.crunch(0.5); },
  34: () => { noise({ d: 0.08, f: 2500, type: "highpass", v: 0.7, at: 0.3 }); tone({ f: 150, to: 80, d: 0.15, v: 0.3, at: 0.3 }); },
  35: () => { for (let i = 0; i < 10; i++) noise({ d: 0.05, f: 5000, type: "bandpass", q: 2, v: 0.2, at: i * 0.08 }); B.pop(1.0); },
  36: () => { for (let i = 0; i < 6; i++) tone({ f: 180 + (i % 3) * 40, d: 0.12, type: "sawtooth", v: 0.08, at: i * 0.15, lp: 700 }); },
  37: () => B.laugh(0, 8),
  38: () => { B.party(); B.pop(0.5); B.pop(0.6); B.pop(0.75); B.sparkle(0.8); },
  39: () => { tone({ f: 300, to: 500, d: 0.2, v: 0.15 }); tone({ f: 500, to: 300, d: 0.25, v: 0.15, at: 0.25 }); },
  40: () => { B.buzzer(); tone({ f: 220, to: 110, d: 0.6, type: "sawtooth", v: 0.08, at: 0.1, lp: 900 }); },
  41: () => { tone({ f: 900, to: 400, d: 0.18, v: 0.2 }); B.pop(0.2); B.sparkle(0.5); },
  42: () => { B.sip(); tone({ f: 1800, d: 0.15, v: 0.06, at: 0.5 }); },
  43: () => { B.hiss(0, 1.2); [0, 0.3, 0.6].forEach(t => tone({ f: 400, to: 700, d: 0.12, v: 0.12, at: t })); },
  44: () => { tone({ f: 200, to: 400, d: 1.4, v: 0.04, attack: 1 }); B.pop(1.5); },
  45: () => { B.snore(); B.snore(1.9); },
  46: () => { noise({ d: 0.2, f: 3000, type: "bandpass", q: 1, v: 0.3, attack: 0.1 }); B.tick(0.4); B.tick(0.6); B.tick(0.8); },
  47: () => { tone({ f: 120, d: 0.6, type: "sawtooth", v: 0.15, vib: [8, 6], lp: 600 }); },
  48: () => { B.whoosh(0, 0.18); B.whoosh(0.6, 0.18); },
  49: () => [82, 82, 110, 98, 82].forEach((f, i) => { tone({ f, d: 0.25, type: "sawtooth", v: 0.12, at: i * 0.22, lp: 2000 }); tone({ f: f * 1.5, d: 0.25, type: "sawtooth", v: 0.08, at: i * 0.22, lp: 2000 }); }),
  50: () => { [140, 150, 160, 135].forEach(f => tone({ f, to: f * 0.8, d: 1.2, type: "sawtooth", v: 0.06, vib: [5, 4], lp: 900, attack: 0.2 })); },
  51: () => { B.sob(); B.honk(1.0); },
  52: () => { [1500, 1500, 1500, 1500].forEach((f, i) => tone({ f, d: 0.05, type: "square", v: 0.06, at: i * 0.12 })); B.buzzer(0.7); },
  53: () => { tone({ f: 300, to: 260, d: 0.6, type: "triangle", v: 0.15, vib: [6, 6] }); B.ding(0.7, 1046); },
  54: () => { B.pop(); tone({ f: 600, to: 120, d: 0.8, type: "sawtooth", v: 0.06, at: 0.05, lp: 1500 }); },
  55: () => { [523, 659, 784, 1046].forEach((f, i) => tone({ f, d: 0.2, type: "triangle", v: 0.15, at: i * 0.1 })); },
  56: () => { B.crunch(); B.crunch(0.5); },
  57: () => { B.sip(); noise({ d: 0.4, f: 2000, type: "bandpass", q: 0.7, v: 0.6, at: 0.5 }); },
  58: () => { tone({ f: 200, to: 900, d: 0.5, type: "sawtooth", v: 0.05, lp: 1500 }); B.ding(0.6, 1568); },
  59: () => { noise({ d: 0.2, f: 600, v: 0.4, at: 0.6 }); tone({ f: 200, to: 90, d: 0.2, v: 0.2, at: 0.6 }); B.sad(0.9); },
  60: () => { for (let i = 0; i < 14; i++) B.tick(i * 0.07 + Math.random() * 0.03); B.ding(1.2, 880); },
  61: () => { noise({ d: 0.8, f: 3000, type: "bandpass", q: 8, v: 0.15, am: 25 }); noise({ d: 0.4, f: 1200, to: 300, v: 0.5, at: 0.9 }); },
  62: () => { noise({ d: 1.2, f: 800, v: 0.2, am: 14 }); B.sad(0.4); },
  63: () => { B.squeak(); B.squeak(0.35); },
  64: () => { tone({ f: 1500, to: 300, d: 0.5, v: 0.12 }); B.thud(0.55); },
  65: () => { for (let i = 0; i < 6; i++) B.tick(i * 0.25); B.ding(1.6); },
  66: () => B.bell(),
  67: () => tone({ f: 300, to: 600, d: 1.6, type: "sine", v: 0.15, vib: [5, 30], attack: 0.4 }),
  68: () => { B.party(); noise({ d: 0.4, f: 1500, type: "bandpass", v: 0.3, at: 0.6 }); B.sparkle(1.0); },
  69: () => { for (let i = 0; i < 4; i++) B.whoosh(i * 0.25, 0.2); },
  70: () => { tone({ f: 300, to: 900, d: 0.3, type: "triangle", v: 0.12 }); tone({ f: 900, to: 300, d: 0.3, type: "triangle", v: 0.12, at: 0.35 }); },
  71: () => { for (let i = 0; i < 6; i++) B.whoosh(i * 0.18, 0.15); },
  72: () => { for (let i = 0; i < 5; i++) B.pop(0.2 + i * 0.25 + Math.random() * 0.1); },
  73: () => noise({ d: 0.8, f: 1500, to: 400, type: "bandpass", q: 2, v: 0.25, attack: 0.1 }),
  74: () => { B.ding(0, 1760); noise({ d: 0.3, f: 4000, type: "highpass", v: 0.15, at: 0.6, am: 40 }); },
  75: () => [523, 494, 440, 392].forEach((f, i) => tone({ f, d: 0.55, type: "triangle", v: 0.15, at: i * 0.5, vib: [5, 4] })),
  76: () => { tone({ f: 130, d: 2.5, type: "sawtooth", v: 0.08, lp: 500, attack: 0.6 }); tone({ f: 195, d: 2.5, v: 0.06, attack: 0.6 }); },
  77: () => { for (let i = 0; i < 8; i++) B.tick(i * 0.25); },
  78: () => { B.sparkle(); [523, 659, 784].forEach((f, i) => tone({ f, d: 0.3, type: "triangle", v: 0.15, at: 0.4 + i * 0.12 })); B.buzzer(1.0); },
  79: () => { for (let i = 0; i < 4; i++) { B.clap(i * 0.25); } B.pop(1.1); },
  80: () => { tone({ f: 400, to: 600, d: 0.25, type: "triangle", v: 0.15 }); tone({ f: 600, to: 900, d: 0.25, type: "triangle", v: 0.15, at: 0.3 }); },
  81: () => { noise({ d: 2.2, f: 6000, type: "highpass", v: 0.12, attack: 0.3, am: 18 }); B.boom(0.8); },
  82: () => { for (let i = 0; i < 4; i++) { B.whoosh(i * 0.25, 0.1); noise({ d: 0.06, f: 1500, v: 0.5, at: i * 0.25 + 0.1 }); } },
  83: () => { for (let i = 0; i < 8; i++) noise({ d: 0.05, f: 4000, type: "bandpass", q: 2, v: 0.2, at: 0.3 + i * 0.07 }); },
  84: () => { noise({ d: 0.35, f: 1500, type: "bandpass", q: 1, v: 0.3, attack: 0.15 }); noise({ d: 0.35, f: 1500, type: "bandpass", q: 1, v: 0.3, at: 0.45, attack: 0.15 }); },
  85: () => { tone({ f: 110, d: 0.8, type: "sawtooth", v: 0.12, vib: [9, 8], lp: 600 }); tone({ f: 1800, d: 0.5, type: "triangle", v: 0.1, at: 0.8 }); B.thud(0.8); },
  86: () => { B.whoosh(0, 0.3); noise({ d: 0.25, f: 2000, to: 400, v: 0.5, at: 0.35 }); },
  87: () => [392, 349, 330, 294].forEach((f, i) => B.kazoo(f, i * 0.4, i === 3 ? 0.9 : 0.35)),
  88: () => { for (let i = 0; i < 3; i++) B.pop(0.3 + i * 0.4); },
  89: () => { for (let i = 0; i < 8; i++) noise({ d: 0.08, f: 800, v: 0.25, at: i * 0.18 }); },
  90: () => { [0, 0.5, 1].forEach(t => { noise({ d: 0.06, f: 3500, type: "bandpass", v: 0.3, at: t }); tone({ f: 1046, d: 0.1, v: 0.1, at: t + 0.05 }); }); },
  91: () => { noise({ d: 0.3, f: 900, to: 300, v: 0.4, at: 0.4 }); tone({ f: 330, to: 220, d: 1, type: "sawtooth", v: 0.08, at: 0.7, lp: 1200, vib: [6, 6] }); },
  92: () => { tone({ f: 60, d: 2, type: "sawtooth", v: 0.06, lp: 200, attack: 1 }); noise({ d: 0.9, f: 2500, type: "bandpass", q: 1.5, v: 0.6, at: 2.3 }); tone({ f: 700, to: 1300, d: 0.9, type: "sawtooth", v: 0.25, at: 2.3, vib: [14, 60], lp: 4000 }); },
  93: () => { tone({ f: 1000, d: 0.1, type: "square", v: 0.06 }); tone({ f: 1000, d: 0.1, type: "square", v: 0.06, at: 0.25 }); noise({ d: 1.4, f: 800, to: 4000, type: "bandpass", v: 0.15, at: 0.6, attack: 1 }); B.ding(2.2, 1568); },
  94: () => { for (let i = 0; i < 12; i++) B.tick(i * 0.12); B.sad(1.5); },
  95: () => { [523, 659, 784, 1046].forEach((f, i) => tone({ f, d: 0.2, type: "triangle", v: 0.15, at: i * 0.1 })); B.buzzer(0.8); },
  96: () => { tone({ f: 48, d: 3.5, type: "sawtooth", v: 0.1, lp: 160, attack: 1 }); [0.6, 0.85, 1.6, 1.85, 2.6, 2.85].forEach(t => tone({ f: 60, to: 40, d: 0.15, v: 0.5, at: t })); },
  97: () => { noise({ d: 2.5, f: 3000, type: "bandpass", q: 0.5, v: 0.25, am: 6 }); tone({ f: 70, to: 140, d: 2.5, type: "sawtooth", v: 0.08, lp: 400, at: 0.4 }); },
  98: () => { for (let k = 0; k < 6; k++) B.laugh(k * 0.05 + Math.random() * 0.1, 6); },
  99: () => { B.thud(0.9); tone({ f: 523, d: 0.25, type: "triangle", v: 0.18, at: 1.2 }); tone({ f: 392, d: 0.5, type: "triangle", v: 0.18, at: 1.45 }); },
  100: () => { noise({ d: 2.2, f: 1500, to: 200, type: "bandpass", q: 1, v: 0.45, attack: 0.3 }); tone({ f: 400, to: 80, d: 2, type: "sine", v: 0.1, vib: [8, 30] }); },
  102: () => { [523, 659, 784, 1046].forEach((f, i) => tone({ f, d: 0.12, type: "square", v: 0.08, at: i * 0.09 })); tone({ f: 180, to: 520, d: 0.4, v: 0.25, at: 0.45, vib: [18, 40] }); noise({ d: 0.2, f: 1200, to: 300, v: 0.35, at: 0.9 }); },
  101: () => { tone({ f: 120, d: 0.5, type: "sawtooth", v: 0.14, vib: [9, 8], lp: 600 }); B.note(523, 0.6, 0.25, "square", 0.08); B.note(392, 1.6, 0.4, "square", 0.08); B.thud(1.9); },
};

// Cards with no spoken line: the drawing and the recording carry the joke.
const SILENT = new Set([3, 5, 6, 7, 13, 19, 21, 22, 23, 24, 26, 27, 29, 37, 44, 48, 60, 63, 70, 71, 72, 75, 87, 92, 97, 98, 100, 133, 144]);

// When the recorded effect and the spoken line start, in seconds from the card's
// first frame, so each lands on its animation's beat: the stamp, the snap, the
// bonk, the line after the punchline. Other cards play the effect at once and
// the line just after it. The clips are trimmed to start on their first sound.
const SYNC: Record<number, [number, number]> = { 1: [0, 1.2], 2: [1.2, 1.7], 4: [0, 0.8], 8: [1.1, 1.7], 9: [1.2, 1.7], 10: [0.6, 1.5], 11: [0.6, 1.1], 12: [0.13, 1.2], 13: [1.2, 0], 14: [1.54, 1.8], 15: [1.2, 2.3], 16: [1.08, 0.3], 17: [0, 1], 18: [0.75, 0.9], 19: [0.7, 0], 20: [2.03, 0.3], 21: [0.9, 0], 22: [1.4, 0], 23: [0.6, 0], 25: [0, 0.6], 27: [0.82, 0], 28: [1.6, 2.6], 30: [1.4, 0.4], 31: [1.8, 1.4], 32: [0.6, 1.3], 33: [0.8, 1], 34: [1.14, 1.4], 35: [0, 2.1], 36: [0, 0.5], 40: [1.5, 1.7], 41: [1.1, 0.2], 42: [1, 1.9], 44: [1.92, 0], 54: [1.92, 2.2], 57: [0.6, 1], 59: [1.8, 2], 61: [1.2, 1.5], 64: [1.5, 1.8], 66: [0, 2.2], 74: [0.8, 0.3], 83: [1.2, 0.3], 84: [0.3, 2.2], 86: [0.98, 0.3], 91: [0.9, 1], 92: [2.28, 0], 94: [0, 2.8], 96: [0, 0.4], 99: [1.2, 1.6], 100: [0.3, 0], 103: [1.4, 1.4], 104: [1, 2.1], 106: [3.35, 3.5], 107: [1.3, 1.5], 108: [0, 2.5], 110: [1.6, 0.6], 111: [1.5, 2.2], 113: [0.88, 1], 114: [0, 1.7], 115: [1.6, 1.3], 116: [2.6, 2.9], 117: [1.4, 0.2], 118: [1.4, 0.3], 119: [0.45, 2], 120: [0, 1.3], 121: [1, 1.5], 122: [0.3, 1], 123: [1.2, 1.3], 124: [0, 0.2], 125: [2.7, 2.9], 127: [2.5, 0.4], 128: [0, 4], 129: [0, 1.9], 130: [1.3, 1.4], 131: [0, 0.72], 132: [2.8, 0.6], 134: [0, 1.6], 136: [1.83, 1.3], 137: [2.5, 2.9], 138: [0, 2.6], 139: [0, 1.4], 140: [0, 1.6], 142: [2.2, 1.6], 143: [1.1, 1.7], 144: [2.28, 0], 145: [0, 1.0] };

const audioFile = (kind: "fx" | "go", n: number) => String(asset(`play/cold-read/audio/${kind}-${String(n).padStart(3, "0")}.mp3`));

function playLater(src: string, at: number, volume: number, onFail?: () => void) {
  const a = new Audio(src);
  a.volume = volume;
  a.addEventListener("error", () => onFail?.(), { once: true });
  window.setTimeout(() => void a.play().catch(() => onFail?.()), at * 1000);
}

/**
 * The score moving during play: a rising coin chime for points won, a falling
 * buzz for points lost. A bigger change gets one more step, up to three.
 */
export function playPoints(delta: number) {
  if (!delta || !ac()) return;
  const steps = Math.min(3, 1 + Math.floor(Math.log10(Math.abs(delta) + 1) - 1));
  if (delta > 0) {
    [988, 1319, 1760].slice(0, Math.max(steps, 1) + 1).forEach((f, i) => tone({ f, d: 0.12, type: "square", v: 0.06, at: i * 0.07 }));
  } else {
    tone({ f: 330, to: 110, d: 0.32, type: "sawtooth", v: 0.07, lp: 1400 });
    if (steps > 1) tone({ f: 220, to: 80, d: 0.3, type: "sawtooth", v: 0.06, at: 0.14, lp: 1200 });
  }
}

/** Plays the effect and the spoken line for game-over card n. */
export function playGameOver(n: number) {
  if (!ac()) return;
  let synthed = false;
  const synth = () => {
    if (synthed) return;
    synthed = true;
    (R[n] ?? B.pop)();
  };
  const [fxAt, voiceAt] = SYNC[n] ?? [0, 0.45];
  playLater(audioFile("fx", n), fxAt, 0.8, synth);
  if (!SILENT.has(n)) playLater(audioFile("go", n), voiceAt, 0.9);
}

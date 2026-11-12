// Alle lyder lages med Web Audio, så appen trenger ingen lydfiler.
// iPhone krever at lyden startes av et trykk, og stillebryteren demper Web Audio.
import { getState } from './store.js';

let context = null;
let lastTick = 0;

function audio() {
  if (!context) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}

/** Kobles på første berøring, slik at iOS lar oss spille lyd senere. */
export function primeAudio() {
  const unlock = () => {
    const ctx = audio();
    if (ctx) {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    }
  };
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('touchend', unlock, { once: true, capture: true });
}

function tone(ctx, { frequency, start = 0, duration = 0.2, type = 'sine', gain = 0.1, attack = 0.005, filter = null }) {
  const at = ctx.currentTime + start;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(gain, at + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  let node = oscillator;
  if (filter) {
    const biquad = ctx.createBiquadFilter();
    biquad.type = 'bandpass';
    biquad.frequency.value = filter;
    biquad.Q.value = 4;
    oscillator.connect(biquad);
    node = biquad;
  }
  node.connect(envelope).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

const SOUNDS = {
  tick: (ctx) => tone(ctx, { frequency: 2600, duration: 0.025, type: 'square', gain: 0.05, attack: 0.001, filter: 3200 }),
  hour: (ctx) => {
    tone(ctx, { frequency: 1500, duration: 0.03, type: 'square', gain: 0.05, attack: 0.001, filter: 1800 });
    tone(ctx, { frequency: 880, duration: 0.12, gain: 0.06 });
  },
  correct: (ctx) => {
    tone(ctx, { frequency: 659.25, duration: 0.18, gain: 0.12 });
    tone(ctx, { frequency: 987.77, start: 0.09, duration: 0.32, gain: 0.12 });
  },
  wrong: (ctx) => {
    tone(ctx, { frequency: 392, duration: 0.2, type: 'triangle', gain: 0.07 });
    tone(ctx, { frequency: 329.63, start: 0.12, duration: 0.3, type: 'triangle', gain: 0.06 });
  },
  tap: (ctx) => tone(ctx, { frequency: 1200, duration: 0.04, gain: 0.05 }),
  complete: (ctx) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
      tone(ctx, { frequency, start: index * 0.08, duration: 0.5, gain: 0.08 }),
    );
  },
  unlock: (ctx) => {
    [783.99, 987.77, 1174.66, 1567.98, 1975.53].forEach((frequency, index) =>
      tone(ctx, { frequency, start: index * 0.06, duration: 0.6, type: 'triangle', gain: 0.06 }),
    );
    tone(ctx, { frequency: 2637, start: 0.32, duration: 0.8, gain: 0.03 });
  },
};

export function play(name) {
  if (!getState().sound) return;
  // Raske drag kan krysse mange minutter på en gang; for tette tikk blir bare støy.
  if (name === 'tick' || name === 'hour') {
    const now = performance.now();
    if (now - lastTick < 28) return;
    lastTick = now;
  }
  const ctx = audio();
  if (ctx) SOUNDS[name]?.(ctx);
}

/**
 * Lightweight combat audio — fully synthesized with the Web Audio API so the
 * game ships no binary sound assets. Lazily initialized on the first user
 * gesture to satisfy browser autoplay policies, and globally mutable via a
 * persisted mute flag. Groundwork for a future music bed / richer sound design.
 */

const MUTE_KEY = 'nm-muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
let lastHitAt = 0;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  to?: number;
  delay?: number;
}

function tone(o: ToneOpts): void {
  const c = ensure();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + o.dur);
  const peak = o.gain ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.03);
}

function noise(dur: number, gain: number, filterHz: number): void {
  const c = ensure();
  if (!c || !master || muted) return;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = filterHz;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(lp).connect(g).connect(master);
  src.start();
}

export const sfx = {
  /** Create + resume the context from within a user gesture. */
  unlock(): void {
    ensure();
  },

  hit(crit = false): void {
    const now = performance.now();
    if (now - lastHitAt < 45) return; // throttle dense multi-hit volleys
    lastHitAt = now;
    noise(crit ? 0.14 : 0.09, crit ? 0.32 : 0.2, crit ? 3200 : 1800);
    tone({ freq: crit ? 280 : 180, to: crit ? 90 : 70, dur: crit ? 0.16 : 0.1, type: 'triangle', gain: 0.22 });
  },

  heal(): void {
    tone({ freq: 440, to: 740, dur: 0.22, type: 'sine', gain: 0.18 });
  },

  shield(): void {
    tone({ freq: 320, to: 520, dur: 0.16, type: 'square', gain: 0.12 });
  },

  sudden(): void {
    tone({ freq: 140, to: 60, dur: 0.5, type: 'sawtooth', gain: 0.22 });
  },

  win(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, dur: 0.3, type: 'triangle', gain: 0.22, delay: i * 0.1 }),
    );
  },

  lose(): void {
    [392, 311, 233, 175].forEach((f, i) =>
      tone({ freq: f, dur: 0.36, type: 'sawtooth', gain: 0.2, delay: i * 0.12 }),
    );
  },

  isMuted(): boolean {
    return muted;
  },

  setMuted(value: boolean): void {
    muted = value;
    try {
      localStorage.setItem(MUTE_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (master && ctx) master.gain.setTargetAtTime(value ? 0 : 0.5, ctx.currentTime, 0.02);
  },

  toggleMute(): boolean {
    this.setMuted(!muted);
    return muted;
  },
};

/** Attach a one-time listener that unlocks audio on the first user gesture. */
export function initAudioUnlock(): void {
  const handler = (): void => {
    sfx.unlock();
    removeEventListener('pointerdown', handler);
    removeEventListener('keydown', handler);
  };
  addEventListener('pointerdown', handler);
  addEventListener('keydown', handler);
}

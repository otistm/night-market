/**
 * Combat and shop audio — sample playback plus synthesized UI stingers.
 * Lazily initialized on the first user gesture to satisfy browser autoplay policies.
 */

const MUTE_KEY = 'nm-muted';

const SAMPLES = {
  hit: '/Audio/hit.wav',
  burn: '/Audio/burn.wav',
  poison: '/Audio/poison.wav',
  buy: '/Audio/buy.wav',
} as const;

type SampleKey = keyof typeof SAMPLES;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
const lastSampleAt: Partial<Record<SampleKey, number>> = {};
const sampleThrottleMs: Record<SampleKey, number> = {
  hit: 45,
  burn: 120,
  poison: 120,
  buy: 80,
};

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

function preloadSamples(): void {
  for (const path of Object.values(SAMPLES)) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.load();
  }
}

function playSample(key: SampleKey, volume = 1): void {
  if (muted) return;
  ensure();
  const now = performance.now();
  const throttle = sampleThrottleMs[key];
  if (now - (lastSampleAt[key] ?? 0) < throttle) return;
  lastSampleAt[key] = now;

  const audio = new Audio(SAMPLES[key]);
  audio.volume = 0.5 * volume;
  void audio.play().catch(() => {});
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

export const sfx = {
  /** Create + resume the context from within a user gesture. */
  unlock(): void {
    ensure();
    preloadSamples();
  },

  hit(crit = false): void {
    playSample('hit', crit ? 1.15 : 1);
  },

  burn(): void {
    playSample('burn');
  },

  poison(): void {
    playSample('poison');
  },

  buy(): void {
    playSample('buy');
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

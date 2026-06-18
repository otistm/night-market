import { reduceMotion } from '@/fx/animations';

/**
 * A living fire painted on a <canvas> overlaid on an existing `.hpbar`: rising
 * flames (with a hot-core→cool-red heat ramp), flickering embers, a molten base
 * glow seating the fire over the HP fill, a smolder of smoke as it dies down,
 * and a warm flash on each burn tick. The bar keeps its size; the canvas adds a
 * band of headroom *above* the bar so the flames lick up past the top edge
 * instead of being clipped by the bar's rounded mask.
 *
 * One shared rAF loop drives every active bar. Bars fade in when ignited and
 * fade out (then detach from the loop) once the burn clears, letting the plain
 * green HP fill show through again.
 */

interface Particle {
  kind: 0 | 1 | 2; // 0 flame, 1 ember, 2 smoke
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  sway: number;
  swayAmp: number;
  swaySpd: number;
}

/* Soft additive sprites, baked once and shared across every bar. */
let RAMP: HTMLCanvasElement[] | null = null;
let SMOKE: HTMLCanvasElement | null = null;
function makeSprite(r: number, g: number, b: number, peak: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g2 = c.getContext('2d')!;
  const grd = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, `rgba(${r},${g},${b},${peak})`);
  grd.addColorStop(0.45, `rgba(${r},${g},${b},${peak * 0.45})`);
  grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  g2.fillStyle = grd;
  g2.fillRect(0, 0, 64, 64);
  return c;
}
function getRamp(): HTMLCanvasElement[] {
  if (!RAMP) {
    RAMP = [
      makeSprite(255, 246, 214, 0.95),
      makeSprite(255, 212, 90, 0.85),
      makeSprite(255, 140, 32, 0.72),
      makeSprite(236, 84, 16, 0.6),
      makeSprite(150, 30, 6, 0.5),
    ];
  }
  return RAMP;
}
function getSmoke(): HTMLCanvasElement {
  if (!SMOKE) SMOKE = makeSprite(96, 90, 86, 0.4);
  return SMOKE;
}

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

class BurnBar {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private barH = 0;
  private headroom = 0;
  private dpr = 1;

  private fillFrac = 1;
  private stacks = 0;
  private vis = 0; // master fade 0..1
  private flare = 0; // transient intensity boost on a tick
  private flash = 0; // warm-white flash on a tick

  private P: Particle[] = [];

  constructor(private host: HTMLElement) {
    const canvas = document.createElement('canvas');
    canvas.className = 'burn-fx';
    const hp = host.querySelector('.hp');
    host.insertBefore(canvas, hp ? hp.nextSibling : host.firstChild);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  /** Push the latest HP fraction + burn stacks from the combat tick. */
  update(fillFrac: number, stacks: number): void {
    this.fillFrac = Math.max(0, Math.min(1, fillFrac));
    this.stacks = stacks;
    if (stacks > 0) register(this);
  }

  /** A burn tick just landed — flare up and flash. */
  pulse(): void {
    if (this.stacks <= 0) return;
    this.flare = 1;
    this.flash = 0.7;
    register(this);
  }

  private fillPx(): number {
    return this.W * this.fillFrac;
  }
  private bottom(): number {
    return this.headroom + this.barH;
  }
  private crit(): number {
    return this.fillFrac > 0 && this.fillFrac < 0.25 ? 1 : 0;
  }

  private resize(): void {
    const w = Math.round(this.host.clientWidth);
    const h = Math.round(this.host.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (w === this.W && h === this.barH && this.dpr === dpr) return;
    this.W = w;
    this.barH = h;
    this.dpr = dpr;
    this.headroom = Math.round(h * 2);
    const totalH = h + this.headroom;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = totalH + 'px';
    this.canvas.style.top = -this.headroom + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(totalH * dpr);
  }

  private emitFlame(crit: number): void {
    const fx = this.fillPx();
    if (fx < 4 || this.P.length > 200) return;
    const h = this.barH;
    const life = rnd(0.5, 0.95);
    this.P.push({
      kind: 0,
      x: rnd(0, fx),
      y: this.bottom() - rnd(0, h * 0.3),
      vx: rnd(-h * 0.85, h * 0.85),
      vy: -rnd(h * 2.4, h * 5) - crit * h * 1.5 - this.flare * h * 2,
      life,
      max: life,
      size: rnd(h * 0.55, h * 1.05),
      sway: Math.random() * 6.28,
      swayAmp: rnd(h * 0.5, h * 1.5),
      swaySpd: rnd(2.2, 5),
    });
  }
  private emitEmber(crit: number): void {
    const fx = this.fillPx();
    if (fx < 4 || this.P.length > 200) return;
    const h = this.barH;
    const life = rnd(0.7, 1.3);
    this.P.push({
      kind: 1,
      x: rnd(0, fx),
      y: this.bottom() - rnd(0, h * 0.4),
      vx: rnd(-h * 1.1, h * 1.1),
      vy: -rnd(h * 4, h * 7.5) - crit * h * 2,
      life,
      max: life,
      size: rnd(h * 0.12, h * 0.24),
      sway: Math.random() * 6.28,
      swayAmp: rnd(h * 0.8, h * 2),
      swaySpd: rnd(3, 6),
    });
  }
  private emitSmoke(): void {
    if (this.P.length > 200) return;
    const h = this.barH;
    const life = rnd(1.2, 2.2);
    this.P.push({
      kind: 2,
      x: rnd(0, Math.max(10, this.W * 0.5)),
      y: this.bottom() - rnd(0, h * 0.3),
      vx: rnd(-h * 0.5, h * 0.5),
      vy: -rnd(h * 0.7, h * 1.8),
      life,
      max: life,
      size: rnd(h * 0.65, h * 1.05),
      sway: Math.random() * 6.28,
      swayAmp: rnd(h * 0.45, h * 1.1),
      swaySpd: rnd(1, 2.5),
    });
  }

  private emit(): void {
    const fx = this.fillPx();
    const dens = fx / Math.max(1, this.W);
    const crit = this.crit();
    const rm = reduceMotion ? 0.45 : 1;
    if (this.stacks > 0 && fx >= 4) {
      const intensity = Math.min(1.5, 0.55 + this.stacks * 0.14);
      let nf = dens * 11 * rm * intensity * (1 + this.flare * 2 + crit * 0.5);
      let whole = Math.floor(nf);
      if (Math.random() < nf - whole) whole++;
      for (let i = 0; i < whole; i++) this.emitFlame(crit);

      let ne = dens * 1.6 * rm * intensity * (1 + this.flare * 2.5 + crit * 0.8);
      let we = Math.floor(ne);
      if (Math.random() < ne - we) we++;
      for (let i = 0; i < we; i++) this.emitEmber(crit);
    } else if (this.vis > 0.02 && fx >= 4) {
      // Cleansed: a brief smolder of smoke as the fire dies.
      if (Math.random() < (reduceMotion ? 0.25 : 0.55)) this.emitSmoke();
    }
  }

  private integrate(dt: number): void {
    for (let i = this.P.length - 1; i >= 0; i--) {
      const p = this.P[i];
      p.sway += dt * p.swaySpd;
      p.x += (p.vx + Math.sin(p.sway) * p.swayAmp) * dt;
      p.y += p.vy * dt;
      if (p.kind === 0) p.vy *= 1 - dt * 0.6;
      else if (p.kind === 1) p.vy *= 1 - dt * 0.3;
      p.life -= dt;
      if (p.life <= 0 || p.y < -8) this.P.splice(i, 1);
    }
  }

  private clipBar(ctx: CanvasRenderingContext2D): void {
    const r = Math.min(this.barH / 2, 14);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, this.headroom, this.W, this.barH, r);
    else ctx.rect(0, this.headroom, this.W, this.barH);
    ctx.clip();
  }

  private render(): void {
    const ctx = this.ctx;
    const fx = this.fillPx();
    const barTop = this.headroom;
    const bottom = this.bottom();
    const ramp = getRamp();

    // Molten base glow seating the flames over the HP fill.
    if (this.stacks > 0 && fx > 2) {
      ctx.save();
      this.clipBar(ctx);
      ctx.globalCompositeOperation = 'lighter';
      const bg = ctx.createLinearGradient(0, barTop - 4, 0, bottom);
      bg.addColorStop(0, 'rgba(255,150,40,0)');
      bg.addColorStop(1, 'rgba(255,120,30,0.5)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, barTop - 4, fx, this.barH + 4);
      ctx.restore();
    }

    // Smoke under the flames (normal blend).
    ctx.globalCompositeOperation = 'source-over';
    const smoke = getSmoke();
    for (const p of this.P) {
      if (p.kind !== 2) continue;
      let lf = p.life / p.max;
      lf = lf > 1 ? 1 : lf > 0 ? lf : 0.001;
      const sz = p.size * (1 + (1 - lf) * 1.8);
      ctx.globalAlpha = Math.min(1, lf * 1.4) * 0.5;
      ctx.drawImage(smoke, p.x - sz / 2, p.y - sz / 2, sz, sz);
    }

    // Flames + embers, additive.
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.P) {
      if (p.kind === 2) continue;
      let lf = p.life / p.max;
      lf = lf > 1 ? 1 : lf > 0 ? lf : 0.001;
      if (p.kind === 0) {
        let idx = Math.floor((1 - lf) * ramp.length);
        idx = idx < 0 ? 0 : idx > ramp.length - 1 ? ramp.length - 1 : idx;
        const sz = p.size * (1 + (1 - lf) * 1.1);
        ctx.globalAlpha = Math.min(1, lf * 1.5);
        ctx.drawImage(ramp[idx], p.x - sz / 2, p.y - sz / 2, sz, sz);
      } else {
        const sz = p.size;
        ctx.globalAlpha = Math.min(1, lf * 1.8);
        ctx.drawImage(ramp[lf > 0.5 ? 0 : 1], p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;

    // Warm flash over the fill on a tick.
    if (this.flash > 0.01 && fx > 2) {
      ctx.save();
      this.clipBar(ctx);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,238,200,${this.flash * 0.5})`;
      ctx.fillRect(0, barTop, fx, this.barH);
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  /** @returns true while the bar still needs the shared loop. */
  step(_t: number, dt: number): boolean {
    this.resize();
    const target = this.stacks > 0 ? 1 : 0;
    const fade = dt * 3;
    this.vis += Math.sign(target - this.vis) * Math.min(fade, Math.abs(target - this.vis));
    this.flare = Math.max(0, this.flare - dt * 2.2);
    this.flash = Math.max(0, this.flash - dt * 3);

    if (this.W < 2 || this.barH < 2) return this.stacks > 0 || this.vis > 0.01;

    this.canvas.style.opacity = this.vis.toFixed(3);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.barH + this.headroom);

    if (this.vis <= 0.01 && target === 0 && this.P.length === 0) {
      return false;
    }

    this.emit();
    this.integrate(dt);
    this.render();
    return true;
  }
}

/* ----------------------------- shared loop ----------------------------- */

const bars = new WeakMap<HTMLElement, BurnBar>();
const active = new Set<BurnBar>();
let rafId = 0;
let lastTs = 0;

function register(bar: BurnBar): void {
  active.add(bar);
  if (!rafId) {
    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);
  }
}

function loop(now: number): void {
  const dt = Math.min(0.05, (now - lastTs) / 1000);
  lastTs = now;
  const t = now / 1000;
  for (const bar of active) {
    if (!bar.step(t, dt)) active.delete(bar);
  }
  rafId = active.size ? requestAnimationFrame(loop) : 0;
}

function barFor(host: HTMLElement): BurnBar {
  let bar = bars.get(host);
  if (!bar) {
    bar = new BurnBar(host);
    bars.set(host, bar);
  }
  return bar;
}

/** Sync a bar's fill + burn stacks (call from the combat render tick). */
export function updateBurnBar(host: HTMLElement, fillFrac: number, stacks: number): void {
  barFor(host).update(fillFrac, stacks);
}

/** Flare + flash when a burn tick lands. */
export function pulseBurnBar(host: HTMLElement): void {
  barFor(host).pulse();
}

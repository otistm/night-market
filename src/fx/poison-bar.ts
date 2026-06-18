import { reduceMotion } from '@/fx/animations';

/**
 * A churning, bubbling venom-liquid effect painted on a <canvas> overlaid on
 * an existing `.hpbar`. The bar keeps its own size; this just draws the toxic
 * fill (wavy surface, rising bubbles, ripples, a wet leading edge and a flash
 * on each poison tick) clipped to the current HP width — plus a band of
 * headroom *above* the bar so the wavy crest and the smoke/mist coming off the
 * surface aren't clipped by the bar's rounded mask.
 *
 * One shared rAF loop drives every active bar so we never spin up a loop per
 * fighter. Bars fade in when poisoned and fade out (then detach from the loop)
 * once cleansed, letting the plain green HP fill show through again.
 */

/** Pixels of clear space drawn above the bar for the crest + rising mist. */
const HEADROOM = 22;

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  wob: number;
  wobAmp: number;
}
interface Mote {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  life: number;
  sway: number;
}
interface Ripple {
  x: number;
  y: number;
  r: number;
  life: number;
}

/** Soft radial green sprite reused for the drifting miasma motes. */
let gasSprite: HTMLCanvasElement | null = null;
function getGasSprite(): HTMLCanvasElement {
  if (gasSprite) return gasSprite;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(120,235,120,0.5)');
  grd.addColorStop(0.5, 'rgba(80,200,90,0.2)');
  grd.addColorStop(1, 'rgba(60,160,70,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  gasSprite = c;
  return c;
}

class PoisonBar {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private barH = 0;
  private dpr = 1;

  private fillFrac = 1;
  private stacks = 0;
  private vis = 0; // master fade 0..1
  private throb = 0;
  private surfaceFlash = 0;

  private bubbles: Bubble[] = [];
  private motes: Mote[] = [];
  private ripples: Ripple[] = [];

  constructor(private host: HTMLElement) {
    const canvas = document.createElement('canvas');
    canvas.className = 'poison-fx';
    const hp = host.querySelector('.hp');
    host.insertBefore(canvas, hp ? hp.nextSibling : host.firstChild);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  /** Push the latest HP fraction + poison stacks from the combat tick. */
  update(fillFrac: number, stacks: number): void {
    this.fillFrac = Math.max(0, Math.min(1, fillFrac));
    this.stacks = stacks;
    if (stacks > 0) register(this);
  }

  /** A poison damage tick just landed — flash the surface and erupt bubbles. */
  pulse(): void {
    if (this.stacks <= 0) return;
    this.surfaceFlash = 1;
    register(this);
    const fx = this.fillPx();
    const n = Math.min(14, 3 + this.stacks * 2);
    for (let i = 0; i < n; i++) {
      this.bubbles.push({
        x: 3 + Math.random() * Math.max(6, fx - 6),
        y: this.bottom() - 2,
        r: 1.5 + Math.random() * 2.5,
        vy: -(0.5 + Math.random() * 0.6 + this.stacks * 0.05),
        wob: Math.random() * 6.28,
        wobAmp: 0.5,
      });
    }
    // A little puff of mist erupts off the surface on each tick.
    const mistN = Math.min(8, 2 + this.stacks);
    for (let i = 0; i < mistN; i++) this.spawnMote(fx);
  }

  private fillPx(): number {
    return this.W * this.fillFrac;
  }

  /** Y of the liquid floor (bar bottom in canvas space). */
  private bottom(): number {
    return HEADROOM + this.barH;
  }

  private surfaceY(x: number, t: number): number {
    const amp = Math.min(2.6, 1.1 + this.stacks * 0.28);
    return (
      HEADROOM + 2 + Math.sin(x * 0.06 + t * 1.6) * amp + Math.sin(x * 0.15 - t * 2.3) * amp * 0.5
    );
  }

  private spawnMote(fx: number): void {
    if (this.motes.length >= 60) return;
    this.motes.push({
      x: Math.random() * Math.max(2, fx),
      y: HEADROOM + 1,
      r: 4 + Math.random() * 6 + this.stacks * 0.4,
      vy: -(0.3 + Math.random() * 0.4),
      vx: (Math.random() - 0.5) * 0.25,
      life: 1,
      sway: Math.random() * 6.28,
    });
  }

  private resize(): void {
    const w = Math.round(this.host.clientWidth);
    const h = Math.round(this.host.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (w === this.W && h === this.barH && this.dpr === dpr) return;
    this.W = w;
    this.barH = h;
    this.dpr = dpr;
    const totalH = h + HEADROOM;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = totalH + 'px';
    this.canvas.style.top = -HEADROOM + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(totalH * dpr);
  }

  /** @returns true while the bar still needs the shared loop. */
  step(t: number, dt: number): boolean {
    this.resize();
    const target = this.stacks > 0 ? 1 : 0;
    const fade = dt * 3;
    this.vis += Math.sign(target - this.vis) * Math.min(fade, Math.abs(target - this.vis));
    this.throb += dt * (1.2 + this.stacks * 0.4);
    this.surfaceFlash = Math.max(0, this.surfaceFlash - dt * 2.5);

    if (this.W < 2 || this.barH < 2) return this.stacks > 0 || this.vis > 0.01;

    this.canvas.style.opacity = this.vis.toFixed(3);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.barH + HEADROOM);

    if (this.vis <= 0.01 && target === 0) {
      this.bubbles.length = 0;
      this.motes.length = 0;
      this.ripples.length = 0;
      return false;
    }

    this.spawn(dt);
    this.drawLiquid(t, dt);
    this.drawMiasma(dt);

    return true;
  }

  private spawn(_dt: number): void {
    const fx = this.fillPx();
    if (fx < 8 || this.stacks <= 0) return;
    const rm = reduceMotion ? 0.4 : 1;
    let rate = (0.35 + this.stacks * 0.6) * rm;
    while (rate > 0) {
      if (Math.random() < rate && this.bubbles.length < 80) {
        this.bubbles.push({
          x: 3 + Math.random() * (fx - 6),
          y: this.bottom() - 1 - Math.random() * 4,
          r: 1.2 + Math.random() * 2.4 + this.stacks * 0.2,
          vy: -(0.22 + Math.random() * 0.45 + this.stacks * 0.04),
          wob: Math.random() * 6.28,
          wobAmp: 0.25 + Math.random() * 0.5,
        });
      }
      rate--;
    }
    // Steady wisps of mist lift off the surface so the bar always "smokes".
    let mist = (0.25 + this.stacks * 0.35) * rm;
    while (mist > 0) {
      if (Math.random() < mist) this.spawnMote(fx);
      mist--;
    }
  }

  /** Clip to the bar's rounded pill so the liquid keeps the bar's shape. */
  private clipBar(ctx: CanvasRenderingContext2D): void {
    const r = Math.min(this.barH / 2, 14);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, HEADROOM, this.W, this.barH, r);
    else ctx.rect(0, HEADROOM, this.W, this.barH);
    ctx.clip();
  }

  private drawLiquid(t: number, dt: number): void {
    const ctx = this.ctx;
    const fx = this.fillPx();
    const bottom = this.bottom();
    const barH = this.barH;
    if (fx <= 1) return;

    ctx.save();
    // Keep the rounded bar silhouette, then clip to the toxic fill region:
    // wavy top surface down to the bar floor.
    this.clipBar(ctx);
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    ctx.lineTo(0, this.surfaceY(0, t));
    const stepN = Math.max(8, (fx / 6) | 0);
    for (let i = 1; i <= stepN; i++) {
      const x = (fx * i) / stepN;
      ctx.lineTo(x, this.surfaceY(x, t));
    }
    ctx.lineTo(fx, bottom);
    ctx.closePath();
    ctx.clip();

    const pulse = 0.5 + 0.5 * Math.sin(this.throb);
    const lift = (0.12 + this.stacks * 0.05) * pulse + this.surfaceFlash * 0.5;
    const grd = ctx.createLinearGradient(0, HEADROOM, 0, bottom);
    grd.addColorStop(0, `rgba(${(120 + lift * 120) | 0},255,${(90 + lift * 60) | 0},0.95)`);
    grd.addColorStop(0.4, `rgba(40,${(190 + lift * 40) | 0},70,0.95)`);
    grd.addColorStop(1, 'rgba(8,46,20,0.97)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, HEADROOM - 4, fx, barH + 8);

    // Roaming inner sheen.
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(150,255,120,0.05)';
    const cx = ((t * 40) % (fx + 80)) - 40;
    ctx.beginPath();
    ctx.ellipse(cx, HEADROOM + barH * 0.4, 36, barH * 0.3, 0, 0, 6.283);
    ctx.fill();

    // Bubbles.
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.wob += dt * 3;
      b.x += Math.sin(b.wob) * b.wobAmp;
      b.y += b.vy;
      b.vy -= dt * 0.15;
      const sy = this.surfaceY(b.x, t);
      if (b.y - b.r <= sy || b.x > fx) {
        this.ripples.push({ x: b.x, y: sy, r: b.r, life: 1 });
        if (Math.random() < 0.6 && this.motes.length < 60) {
          this.motes.push({
            x: b.x,
            y: sy,
            r: b.r * 2,
            vy: -(0.3 + Math.random() * 0.4),
            vx: (Math.random() - 0.5) * 0.3,
            life: 1,
            sway: Math.random() * 6.28,
          });
        }
        this.bubbles.splice(i, 1);
        continue;
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.283);
      ctx.fillStyle = 'rgba(180,255,150,0.10)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(200,255,120,0.55)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, Math.max(0.5, b.r * 0.28), 0, 6.283);
      ctx.fillStyle = 'rgba(235,255,210,0.7)';
      ctx.fill();
    }
    ctx.restore();

    // Wavy bright surface line (drawn outside the fill clip so the crest is
    // free to ride above the bar's top edge into the headroom).
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(0, this.surfaceY(0, t));
    const sN = Math.max(8, (fx / 5) | 0);
    for (let i = 1; i <= sN; i++) {
      const x = (fx * i) / sN;
      ctx.lineTo(x, this.surfaceY(x, t));
    }
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = `rgba(${(190 + this.surfaceFlash * 60) | 0},255,${(120 + this.surfaceFlash * 80) | 0},${0.6 + this.surfaceFlash * 0.3})`;
    ctx.stroke();
    ctx.restore();

    // Wet leading edge.
    ctx.save();
    this.clipBar(ctx);
    const eg = ctx.createLinearGradient(fx - 8, 0, fx, 0);
    eg.addColorStop(0, 'rgba(120,255,90,0)');
    eg.addColorStop(1, 'rgba(190,255,120,0.55)');
    ctx.fillStyle = eg;
    ctx.fillRect(fx - 8, HEADROOM, 8, barH);
    ctx.strokeStyle = 'rgba(210,255,150,0.8)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(fx, this.surfaceY(fx, t));
    ctx.lineTo(fx, bottom);
    ctx.stroke();
    ctx.restore();

    // Ripples where bubbles popped.
    ctx.save();
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.r += dt * 26;
      r.life -= 0.04;
      if (r.life <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.4, 0, 0, 6.283);
      ctx.strokeStyle = `rgba(200,255,140,${0.5 * r.life})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawMiasma(dt: number): void {
    const ctx = this.ctx;
    const sprite = getGasSprite();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      m.sway += dt * 2;
      m.x += m.vx + Math.sin(m.sway) * 0.3;
      m.y += m.vy;
      m.r += dt * 6;
      m.life -= 0.018;
      if (m.life <= 0 || m.y < -6) {
        this.motes.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = m.life * 0.4;
      ctx.drawImage(sprite, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

/* ----------------------------- shared loop ----------------------------- */

const bars = new WeakMap<HTMLElement, PoisonBar>();
const active = new Set<PoisonBar>();
let rafId = 0;
let lastTs = 0;

function register(bar: PoisonBar): void {
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

function barFor(host: HTMLElement): PoisonBar {
  let bar = bars.get(host);
  if (!bar) {
    bar = new PoisonBar(host);
    bars.set(host, bar);
  }
  return bar;
}

/** Sync a bar's fill + poison stacks (call from the combat render tick). */
export function updatePoisonBar(host: HTMLElement, fillFrac: number, stacks: number): void {
  barFor(host).update(fillFrac, stacks);
}

/** Flash + erupt bubbles when a poison tick lands. */
export function pulsePoisonBar(host: HTMLElement): void {
  barFor(host).pulse();
}

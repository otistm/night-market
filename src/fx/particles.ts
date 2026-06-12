import { pick, rnd } from '@/utils/math';
import { reduceMotion } from '@/fx/animations';
import { relPos } from '@/ui/dom';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  t: number;
  c: string;
  s: number;
}

interface Shot {
  a: { x: number; y: number };
  b: { x: number; y: number };
  t: number;
  dur: number;
  c: string;
}

export interface FxSystem {
  burst(el: HTMLElement | null, color: string, n?: number): void;
  confettiBurst(): void;
  shootProjectile(from: HTMLElement | null, to: HTMLElement | null, color: string, speed: number): void;
}

export function createFxSystem(appEl: HTMLElement, canvas: HTMLCanvasElement): FxSystem {
  const ctx = canvas.getContext('2d')!;
  let parts: Particle[] = [];
  let shots: Shot[] = [];

  function sizeCanvas(): void {
    const r = appEl.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  addEventListener('resize', sizeCanvas);
  sizeCanvas();

  function fxLoop(): void {
    const dt = 1 / 60;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    parts = parts.filter((p) => {
      p.t += dt;
      if (p.t > p.life) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, 7);
      ctx.fill();
      return true;
    });

    shots = shots.filter((s) => {
      s.t += dt;
      const k = Math.min(1, s.t / s.dur);
      const mx = (s.a.x + s.b.x) / 2;
      const x = (1 - k) * (1 - k) * s.a.x + 2 * (1 - k) * k * mx + k * k * s.b.x;
      const y =
        (1 - k) * (1 - k) * s.a.y +
        2 * (1 - k) * k * (Math.min(s.a.y, s.b.y) - 44) +
        k * k * s.b.y;

      ctx.globalAlpha = 1;
      ctx.fillStyle = s.c;
      ctx.shadowColor = s.c;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, 7);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(x - (s.b.x - s.a.x) * 0.05, y - (s.b.y - s.a.y) * 0.05, 3, 0, 7);
      ctx.fill();

      if (k >= 1) {
        parts.push({ x: s.b.x, y: s.b.y, vx: 0, vy: 0, life: 0.18, t: 0, c: s.c, s: 7 });
        return false;
      }
      return true;
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(fxLoop);
  }

  requestAnimationFrame(fxLoop);

  return {
    burst(el, color, n = 10) {
      if (reduceMotion || !el) return;
      const p = relPos(el, appEl);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 50 + Math.random() * 150;
        parts.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 40,
          life: 0.55 + Math.random() * 0.4,
          t: 0,
          c: color,
          s: 2.5 + Math.random() * 3.5,
        });
      }
    },

    confettiBurst() {
      if (reduceMotion) return;
      const r = appEl.getBoundingClientRect();
      for (let i = 0; i < 80; i++) {
        parts.push({
          x: Math.random() * r.width,
          y: -10,
          vx: (Math.random() - 0.5) * 70,
          vy: 70 + Math.random() * 140,
          life: 1.6 + Math.random(),
          t: 0,
          c: pick(['#ffd75e', '#ffae34', '#8b5cf6', '#6cc7ff', '#ff4d6a']),
          s: 3 + Math.random() * 3.5,
        });
      }
    },

    shootProjectile(from, to, color, speed) {
      if (reduceMotion || !from || !to) return;
      shots.push({
        a: relPos(from, appEl),
        b: relPos(to, appEl),
        t: 0,
        dur: 0.3 / Math.max(1, speed * 0.8),
        c: color,
      });
    },
  };
}

export function createDamagePop(
  appEl: HTMLElement,
  el: HTMLElement,
  txt: string,
  color: string,
  size = 16,
): HTMLElement {
  const p = relPos(el, appEl);
  const d = document.createElement('div');
  d.className = 'dmgpop';
  d.textContent = txt;
  d.style.left = `${p.x + rnd(-18, 18)}px`;
  d.style.top = `${p.y - 26}px`;
  d.style.color = color;
  d.style.fontSize = `${size}px`;
  appEl.appendChild(d);
  return d;
}

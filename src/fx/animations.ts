import gsap from 'gsap';
import type { ScreenId } from '@/game/types';

export const reduceMotion =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export function showScreen(id: ScreenId, skipChildren = false): void {
  document.querySelectorAll('.screen').forEach((s) => {
    s.classList.remove('on');
    if (!reduceMotion) {
      gsap.killTweensOf(s);
      gsap.killTweensOf([...s.children]);
      gsap.set([s, ...s.children], { clearProps: 'all' });
    }
  });

  const screen = document.getElementById(id);
  if (!screen) return;
  screen.classList.add('on');

  if (reduceMotion) return;

  gsap.fromTo(screen, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity' });

  if (!skipChildren) {
    gsap.fromTo(
      [...screen.children],
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.06,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        delay: 0.03,
      },
    );
  }
}

export function punch(el: Element | null, _scale = 1.16): void {
  if (!el || reduceMotion) return;
  gsap.fromTo(el, { scale: _scale }, { scale: 1, duration: 0.45, ease: 'elastic.out(1,.45)', clearProps: 'transform' });
}

export function shakeApp(power = 8): void {
  if (reduceMotion) return;
  gsap.fromTo('#app', { x: 0 }, {
    x: power,
    duration: 0.05,
    yoyo: true,
    repeat: 5,
    ease: 'sine.inOut',
    clearProps: 'transform',
    onComplete: () => {
      gsap.set('#app', { x: 0, clearProps: 'transform' });
    },
  });
}

export function countUp(el: HTMLElement | null, to: number, prefix = ''): void {
  if (!el) return;
  if (reduceMotion) {
    el.textContent = prefix + String(to);
    return;
  }
  const obj = { v: 0 };
  gsap.to(obj, {
    v: to,
    duration: 0.9,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = prefix + String(Math.round(obj.v));
    },
  });
}

export function shopEntrance(): void {
  if (reduceMotion) return;
  gsap.fromTo(
    '#carousel .shop-card',
    { y: 34, opacity: 0, rotate: -3 },
    { y: 0, opacity: 1, rotate: 0, duration: 0.5, stagger: 0.07, ease: 'back.out(1.6)', clearProps: 'transform,opacity' },
  );
}

export function titleIntro(): void {
  if (reduceMotion) return;
  gsap.fromTo(
    '#title-screen > *',
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out', delay: 0.15, clearProps: 'transform,opacity' },
  );
}

export function animateSheet(sheet: HTMLElement): void {
  if (reduceMotion) return;
  gsap.fromTo(sheet, { y: 60 }, { y: 0, duration: 0.35, ease: 'power3.out', clearProps: 'transform' });
}

export function animateBattleEntrance(onComplete?: () => void): void {
  if (reduceMotion) {
    const burst = document.getElementById('vs-burst');
    if (burst) {
      burst.style.opacity = '0';
      burst.classList.add('done');
    }
    onComplete?.();
    return;
  }

  const tl = gsap.timeline({ onComplete });
  tl.fromTo('#e-panel', { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0)
    .fromTo('#e-board .item', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)' }, 0.15)
    .fromTo('#player-dock', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0)
    .fromTo('#p-board .item', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)' }, 0.15)
    .fromTo('#vs-burst', { scale: 0.3, opacity: 0 }, { scale: 1.25, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 0.55)
    .to('#vs-burst', { scale: 1, duration: 0.15 }, 0.85)
    .to('#vs-burst', { opacity: 0, scale: 1.4, duration: 0.3 }, 1.15)
    .call(() => document.getElementById('vs-burst')?.classList.add('done'))
    .set('#e-panel,#player-dock,#e-board .item,#p-board .item', { clearProps: 'transform,opacity' });
}

export function animateResultChildren(container: HTMLElement): void {
  if (reduceMotion) return;
  gsap.fromTo(
    container.children,
    { y: 36, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' },
  );
}

export function flashGold(el: HTMLElement): void {
  if (reduceMotion) {
    punch(el, 1.3);
    return;
  }
  gsap.fromTo(el, { color: '#ff4d6a' }, { color: '#f5ecd9', duration: 0.7 });
  punch(el, 1.3);
}

export function animateDragGhost(
  ghost: HTMLElement,
  x: number,
  y: number,
  rotate: number,
): void {
  gsap.set(ghost, { x, y, rotate });
}

export function removeGhost(ghost: HTMLElement, onComplete: () => void): void {
  if (reduceMotion) {
    ghost.remove();
    onComplete();
    return;
  }
  gsap.to(ghost, { scale: 0.6, opacity: 0, duration: 0.18, onComplete: () => {
    ghost.remove();
    onComplete();
  }});
}

export function animateLogLine(line: HTMLElement): void {
  if (reduceMotion) return;
  gsap.fromTo(line, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, clearProps: 'transform' });
}

export function animateHpBar(el: HTMLElement, widthPct: number): void {
  if (reduceMotion) {
    el.style.width = `${widthPct}%`;
    return;
  }
  gsap.to(el, { width: `${widthPct}%`, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
}

export function animateShieldBar(el: HTMLElement, widthPct: number): void {
  if (reduceMotion) {
    el.style.width = `${widthPct}%`;
    return;
  }
  gsap.to(el, { width: `${widthPct}%`, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
}

export function animateDamagePop(el: HTMLElement, onComplete: () => void): void {
  if (reduceMotion) {
    setTimeout(() => {
      el.remove();
      onComplete();
    }, 900);
    return;
  }
  gsap.fromTo(el, { scale: 0.4, opacity: 0, y: 0 }, { scale: 1.15, opacity: 1, y: -16, duration: 0.18, ease: 'back.out(2)' });
  gsap.to(el, { y: -58, opacity: 0, scale: 0.9, duration: 0.8, delay: 0.18, ease: 'power1.in', onComplete: () => {
    el.remove();
    onComplete();
  }});
}

import gsap from 'gsap';
import type { ScreenId } from '@/game/types';

export const reduceMotion =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export function showScreen(id: ScreenId, skipChildren = false, instant = false): void {
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

  if (reduceMotion || instant) {
    if (!reduceMotion) gsap.set(screen, { opacity: 1 });
    return;
  }

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

/** Wait until every <img> in `root` has loaded (or `timeoutMs` elapses). */
export function awaitImages(root: ParentNode, timeoutMs = 900): Promise<void> {
  const imgs = [...root.querySelectorAll('img')];
  const pending = imgs.filter((img) => !img.complete);
  if (pending.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    let left = pending.length;
    const finish = (): void => {
      if (done) return;
      done = true;
      resolve();
    };
    const tick = (): void => {
      if (--left <= 0) finish();
    };
    for (const img of pending) {
      img.addEventListener('load', tick, { once: true });
      img.addEventListener('error', tick, { once: true });
    }
    window.setTimeout(finish, timeoutMs);
  });
}

/**
 * Fade the screen to black, run `prepare()` (swap/render the next screen) while
 * the curtain hides it, wait for its art to load, then fade back in and run
 * `reveal()`. Prevents the player from watching the shop's images/UI pop in.
 */
export async function fadeThroughBlack(
  prepare: () => void,
  reveal?: () => void,
  opts: { settle?: () => Promise<void> } = {},
): Promise<void> {
  const el = document.getElementById('screen-fade');
  if (!el || reduceMotion) {
    prepare();
    if (opts.settle) await opts.settle();
    reveal?.();
    return;
  }

  el.classList.add('on');
  await new Promise<void>((res) => {
    gsap.to(el, { opacity: 1, duration: 0.28, ease: 'power2.out', onComplete: () => res() });
  });

  prepare();
  if (opts.settle) await opts.settle();
  // One more frame so freshly-rendered tiles paint before we lift the curtain.
  await new Promise<void>((res) => requestAnimationFrame(() => res()));

  reveal?.();
  await new Promise<void>((res) => {
    gsap.to(el, {
      opacity: 0,
      duration: 0.42,
      ease: 'power2.in',
      onComplete: () => {
        el.classList.remove('on');
        res();
      },
    });
  });
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
    onComplete?.();
    return;
  }

  const tl = gsap.timeline({ onComplete });
  tl.fromTo('#e-panel', { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0)
    .fromTo('#e-board .item', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)' }, 0.15)
    .fromTo('#player-dock', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0)
    .fromTo('#p-board .item', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)' }, 0.15)
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

/** Show victory/defeat splash, then fade it and reveal action buttons. */
export function animateResultReveal(
  splash: HTMLElement,
  actions: HTMLElement,
  screen: HTMLElement,
): void {
  if (reduceMotion) {
    splash.hidden = true;
    screen.classList.add('backdrop-clear', 'actions-ready');
    gsap.set(actions, { opacity: 1, y: 0 });
    return;
  }

  animateResultChildren(splash);

  const hold = 2.4;
  const fade = 0.55;
  gsap
    .timeline({ delay: 0.75 })
    .to({}, { duration: hold })
    .to(splash, { opacity: 0, y: -28, duration: fade, ease: 'power2.in' })
    .add(() => screen.classList.add('backdrop-clear'), '<')
    .set(splash, { display: 'none' })
    .fromTo(
      actions,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.48, ease: 'power3.out' },
    )
    .call(() => screen.classList.add('actions-ready'));
}

export function flashGold(el: HTMLElement): void {
  if (reduceMotion) {
    punch(el, 1.3);
    return;
  }
  gsap.fromTo(el, { color: '#ff4d6a' }, { color: '#f5ecd9', duration: 0.7 });
  punch(el, 1.3);
}

export function showCombatTicker(
  el: HTMLElement,
  msg: string,
  tone: 'normal' | 'crit' | 'sudden' = 'normal',
): void {
  el.textContent = msg;
  el.classList.toggle('crit', tone === 'crit');
  el.classList.toggle('sudden', tone === 'sudden');
  if (reduceMotion) {
    el.style.opacity = '1';
    gsap.killTweensOf(el);
    gsap.to(el, { opacity: 0, duration: 0.3, delay: 1.2 });
    return;
  }
  gsap.killTweensOf(el);
  gsap.fromTo(
    el,
    { opacity: 0, y: 10, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(2)', overwrite: true },
  );
  gsap.to(el, { opacity: 0, y: -8, duration: 0.4, delay: 1.1, ease: 'power1.in' });
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

export function animateDamagePop(el: HTMLElement, onComplete: () => void, speed = 1): void {
  if (reduceMotion) {
    setTimeout(() => {
      el.remove();
      onComplete();
    }, 900);
    return;
  }
  const k = 1 / Math.max(1, Math.sqrt(speed));
  gsap.fromTo(
    el,
    { scale: 0.4, opacity: 0, y: 0 },
    { scale: 1.15, opacity: 1, y: -16, duration: 0.18 * k, ease: 'back.out(2)' },
  );
  gsap.to(el, {
    y: -58,
    opacity: 0,
    scale: 0.9,
    duration: 0.8 * k,
    delay: 0.18 * k,
    ease: 'power1.in',
    onComplete: () => {
      el.remove();
      onComplete();
    },
  });
}

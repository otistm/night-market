import gsap from 'gsap';
import type { HeroDef } from '@/game/types';
import { reduceMotion } from '@/fx/animations';
import { vibrate } from '@/ui/dom';

interface HeroCarouselOptions {
  track: HTMLElement;
  heroes: readonly HeroDef[];
  onChange(hero: HeroDef, index: number): void;
  onConfirm(hero: HeroDef, card: HTMLElement): void;
}

export interface HeroCarousel {
  destroy(): void;
  getActive(): { hero: HeroDef; card: HTMLElement };
}

const TAP_SLOP = 8;

export function createHeroCarousel(opts: HeroCarouselOptions): HeroCarousel {
  const { track, heroes, onChange, onConfirm } = opts;
  const cards: HTMLElement[] = [];

  track.innerHTML = '';
  heroes.forEach((hero, i) => {
    const card = document.createElement('div');
    card.className = 'hero-cf-card';
    card.dataset.index = String(i);
    card.setAttribute('role', 'option');
    card.setAttribute('aria-label', `${hero.tag} — ${hero.nm}`);
    const art = hero.img
      ? `<img src="${hero.img}" alt="${hero.nm}" draggable="false" />`
      : `<span class="hero-cf-face">${hero.face}</span>`;
    card.innerHTML = `${art}<span class="cf-shade" aria-hidden="true"></span>`;
    track.appendChild(card);
    cards.push(card);
  });

  let current = 0;
  let viewFloat = 0;
  let spacing = 1;
  let tween: gsap.core.Tween | null = null;

  let dragging = false;
  let pointerId = -1;
  let startX = 0;
  let startFloat = 0;
  let moved = false;

  function measure(): void {
    const w = cards[0]?.offsetWidth ?? track.clientWidth * 0.5;
    spacing = Math.max(64, w * 0.6);
  }

  function render(float: number): void {
    viewFloat = float;
    const activeIdx = Math.round(float);
    cards.forEach((card, i) => {
      const off = i - float;
      const abs = Math.abs(off);
      const clamped = Math.max(-3.2, Math.min(3.2, off));
      const translate = clamped * spacing;
      const depth = -abs * 130;
      const scale = Math.max(0.64, 1 - abs * 0.16);
      const rot = Math.max(-32, Math.min(32, -off * 20));
      const opacity = abs > 2.7 ? 0 : Math.max(0.18, 1 - abs * 0.32);
      card.style.transform = `translate3d(${translate}px, 0, ${depth}px) rotateY(${rot}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(100 - Math.round(abs * 10));
      card.style.pointerEvents = abs > 2.7 ? 'none' : 'auto';
      card.classList.toggle('active', i === activeIdx);
    });
  }

  function clampIndex(i: number): number {
    return Math.max(0, Math.min(heroes.length - 1, i));
  }

  function settleTo(index: number, animate: boolean): void {
    const target = clampIndex(index);
    const changed = target !== current;
    current = target;
    tween?.kill();
    if (animate && !reduceMotion) {
      const o = { v: viewFloat };
      tween = gsap.to(o, {
        v: target,
        duration: 0.46,
        ease: 'power3.out',
        onUpdate: () => render(o.v),
      });
    } else {
      render(target);
    }
    if (changed) vibrate(8);
    onChange(heroes[target], target);
  }

  function onPointerDown(e: PointerEvent): void {
    measure();
    dragging = true;
    moved = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startFloat = viewFloat;
    tween?.kill();
    track.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > TAP_SLOP) moved = true;
    let v = startFloat - dx / spacing;
    // Rubber-band beyond the ends.
    const min = 0;
    const max = heroes.length - 1;
    if (v < min) v = min - (min - v) * 0.35;
    else if (v > max) v = max + (v - max) * 0.35;
    render(v);
  }

  function endDrag(e: PointerEvent, cancelled: boolean): void {
    if (!dragging) return;
    dragging = false;
    if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);

    if (!moved && !cancelled) {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.hero-cf-card');
      if (card) {
        const idx = Number(card.dataset.index);
        if (idx === current) {
          onConfirm(heroes[current], cards[current]);
          return;
        }
        settleTo(idx, true);
        return;
      }
    }
    settleTo(Math.round(viewFloat), true);
  }

  function onPointerUp(e: PointerEvent): void {
    endDrag(e, false);
  }

  function onPointerCancel(e: PointerEvent): void {
    endDrag(e, true);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!track.closest('.screen.on')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      settleTo(current + 1, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      settleTo(current - 1, true);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onConfirm(heroes[current], cards[current]);
    }
  }

  function onResize(): void {
    measure();
    render(current);
  }

  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', onPointerUp);
  track.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('keydown', onKeyDown);
  addEventListener('resize', onResize);

  requestAnimationFrame(() => {
    measure();
    render(0);
  });
  onChange(heroes[0], 0);

  return {
    destroy() {
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', onPointerUp);
      track.removeEventListener('pointercancel', onPointerCancel);
      document.removeEventListener('keydown', onKeyDown);
      removeEventListener('resize', onResize);
      tween?.kill();
      track.innerHTML = '';
    },
    getActive() {
      return { hero: heroes[current], card: cards[current] };
    },
  };
}

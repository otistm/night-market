import gsap from 'gsap';
import type { HeroDef } from '@/game/types';
import { reduceMotion } from '@/fx/animations';
import { vibrate } from '@/ui/dom';

export type HeroCarouselSlide =
  | { kind: 'intro' }
  | { kind: 'hero'; hero: HeroDef; heroIndex: number };

interface HeroCarouselOptions {
  track: HTMLElement;
  heroes: readonly HeroDef[];
  initialIndex?: number;
  onChange(slide: HeroCarouselSlide): void;
  onConfirmHero(hero: HeroDef, card: HTMLElement): void;
}

export interface HeroCarousel {
  destroy(): void;
  getActive(): { slide: HeroCarouselSlide; card: HTMLElement };
  confirmActive(): void;
  goToIndex(index: number, animate?: boolean): void;
}

const TAP_SLOP = 8;
const INTRO_INDEX = 0;

function slideAt(index: number, heroes: readonly HeroDef[]): HeroCarouselSlide {
  if (index === INTRO_INDEX) return { kind: 'intro' };
  const heroIndex = index - 1;
  return { kind: 'hero', hero: heroes[heroIndex], heroIndex };
}

function buildIntroCard(): HTMLElement {
  const card = document.createElement('div');
  card.className = 'hero-cf-card hero-cf-intro';
  card.dataset.index = String(INTRO_INDEX);
  card.setAttribute('role', 'option');
  card.setAttribute('aria-label', 'Night Market — Code of Conduct');
  card.innerHTML = `
    <div class="hero-cf-intro-body">
      <h3 class="hero-cf-intro-title">Night Market</h3>
      <p class="hero-cf-intro-sub">Code of Conduct</p>
      <ul class="hero-cf-intro-list">
        <li>Head to the shops and buy things to fight with</li>
        <li>Defeat &ldquo;The 10 Lords&rdquo;</li>
        <li>Rise Through the Ranks</li>
      </ul>
      <p class="hero-cf-intro-tag">Who knows&hellip;you might one day become the 11th Lord.</p>
    </div>`;
  return card;
}

export function createHeroCarousel(opts: HeroCarouselOptions): HeroCarousel {
  const { track, heroes, onChange, onConfirmHero, initialIndex = INTRO_INDEX } = opts;
  const cards: HTMLElement[] = [];

  track.innerHTML = '';
  cards.push(buildIntroCard());
  track.appendChild(cards[0]);

  heroes.forEach((hero, i) => {
    const card = document.createElement('div');
    card.className = 'hero-cf-card';
    card.dataset.index = String(i + 1);
    card.setAttribute('role', 'option');
    card.setAttribute('aria-label', `${hero.tag} — ${hero.nm}`);
    const art = hero.img
      ? `<img src="${hero.img}" alt="${hero.nm}" draggable="false" />`
      : `<span class="hero-cf-face">${hero.face}</span>`;
    card.innerHTML = `${art}<span class="cf-shade" aria-hidden="true"></span>`;
    track.appendChild(card);
    cards.push(card);
  });

  const lastIndex = cards.length - 1;
  let current = clampIndex(initialIndex);
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

  function cardIndexAt(clientX: number, clientY: number): number {
    let bestIdx = current;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      if (parseFloat(card.style.opacity || '1') < 0.25) return;
      const r = card.getBoundingClientRect();
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return;
      const dist = Math.abs(clientX - (r.left + r.width / 2));
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    return bestIdx;
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
      card.classList.toggle('active', i === activeIdx);
    });
  }

  function clampIndex(i: number): number {
    return Math.max(0, Math.min(lastIndex, i));
  }

  function notify(index: number): void {
    onChange(slideAt(index, heroes));
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
    notify(target);
  }

  function confirmActive(): void {
    if (current === INTRO_INDEX) settleTo(1, true);
    else {
      const slide = slideAt(current, heroes);
      if (slide.kind === 'hero') onConfirmHero(slide.hero, cards[current]);
    }
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    measure();
    dragging = true;
    moved = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startFloat = viewFloat;
    tween?.kill();
    track.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch') e.preventDefault();
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > TAP_SLOP) moved = true;
    let v = startFloat - dx / spacing;
    if (v < 0) v = 0 - (0 - v) * 0.35;
    else if (v > lastIndex) v = lastIndex + (v - lastIndex) * 0.35;
    render(v);
  }

  function endDrag(e: PointerEvent, cancelled: boolean): void {
    if (!dragging) return;
    dragging = false;
    if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);

    if (!moved && !cancelled) {
      const idx = cardIndexAt(e.clientX, e.clientY);
      if (idx === current) {
        confirmActive();
        return;
      }
      settleTo(idx, true);
      return;
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
      confirmActive();
    }
  }

  function onResize(): void {
    measure();
    render(current);
  }

  track.addEventListener('pointerdown', onPointerDown, { passive: false });
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', onPointerUp);
  track.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('keydown', onKeyDown);
  addEventListener('resize', onResize);

  requestAnimationFrame(() => {
    measure();
    render(current);
  });
  notify(current);

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
      return { slide: slideAt(current, heroes), card: cards[current] };
    },
    confirmActive,
    goToIndex(index: number, animate = true) {
      settleTo(index, animate);
    },
  };
}

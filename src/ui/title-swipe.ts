import gsap from 'gsap';
import { reduceMotion } from '@/fx/animations';
import { vibrate } from '@/ui/dom';

const THRESHOLD = 0.72;

export function bindTitleSwipe(
  gate: HTMLElement,
  thumb: HTMLElement,
  track: HTMLElement,
  onEnter: () => void,
): { destroy(): void; reset(): void } {
  let active = false;
  let startX = 0;
  let dragX = 0;
  let maxDrag = 0;
  let entered = false;
  let tween: gsap.core.Tween | null = null;

  function measure(): void {
    maxDrag = Math.max(48, track.clientWidth - thumb.offsetWidth - 12);
  }

  function setProgress(progress: number): void {
    const p = Math.max(0, Math.min(1, progress));
    dragX = p * maxDrag;
    thumb.style.transform = `translateX(${dragX}px)`;
    gate.style.setProperty('--swipe-progress', String(p));
    gate.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  }

  function snapBack(): void {
    tween?.kill();
    const obj = { p: maxDrag > 0 ? dragX / maxDrag : 0 };
    tween = gsap.to(obj, {
      p: 0,
      duration: 0.42,
      ease: 'elastic.out(1,.55)',
      onUpdate: () => setProgress(obj.p),
    });
  }

  function complete(): void {
    if (entered) return;
    entered = true;
    vibrate(18);
    tween?.kill();
    gsap.to(gate, {
      opacity: 0,
      x: 24,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: onEnter,
    });
  }

  function onPointerDown(e: PointerEvent): void {
    if (entered) return;
    tween?.kill();
    measure();
    active = true;
    startX = e.clientX;
    thumb.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!active || entered) return;
    setProgress((e.clientX - startX) / maxDrag);
  }

  function onPointerUp(e: PointerEvent): void {
    if (!active) return;
    active = false;
    thumb.releasePointerCapture(e.pointerId);
    if (entered) return;
    if (reduceMotion || dragX / maxDrag >= THRESHOLD) complete();
    else snapBack();
  }

  function onPointerCancel(): void {
    if (!active) return;
    active = false;
    if (!entered) snapBack();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (entered || !gate.closest('.screen.on')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      complete();
    }
  }

  thumb.addEventListener('pointerdown', onPointerDown);
  thumb.addEventListener('pointermove', onPointerMove);
  thumb.addEventListener('pointerup', onPointerUp);
  thumb.addEventListener('pointercancel', onPointerCancel);
  document.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      thumb.removeEventListener('pointerdown', onPointerDown);
      thumb.removeEventListener('pointermove', onPointerMove);
      thumb.removeEventListener('pointerup', onPointerUp);
      thumb.removeEventListener('pointercancel', onPointerCancel);
      document.removeEventListener('keydown', onKeyDown);
      tween?.kill();
    },
    reset() {
      entered = false;
      active = false;
      tween?.kill();
      gsap.set(gate, { clearProps: 'opacity,transform' });
      setProgress(0);
    },
  };
}

import gsap from 'gsap';
import { reduceMotion } from '@/fx/animations';
import { romans } from '@/utils/romans';
import { $ } from '@/ui/dom';

export function showShopOpening(day: number, onComplete: () => void): void {
  const overlay = $('shop-opening');
  const title = $('shop-opening-night');

  title.textContent = `Night ${romans(day)}`;
  overlay.classList.add('on');
  overlay.setAttribute('aria-hidden', 'false');

  if (reduceMotion) {
    onComplete();
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden', 'true');
    return;
  }

  gsap.killTweensOf(overlay);
  gsap.killTweensOf(title);

  const tl = gsap.timeline({
    onComplete: () => {
      overlay.classList.remove('on');
      overlay.setAttribute('aria-hidden', 'true');
      gsap.set([overlay, title], { clearProps: 'opacity,transform' });
    },
  });

  gsap.set(overlay, { opacity: 0 });
  gsap.set(title, { opacity: 0, y: 18 });

  tl.to(overlay, { opacity: 1, duration: 0.55, ease: 'power2.out' })
    .to(title, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.18)
    .to({}, { duration: 1.15 })
    .call(onComplete)
    .to(title, { opacity: 0, y: -14, duration: 0.32, ease: 'power2.in' })
    .to(overlay, { opacity: 0, duration: 0.65, ease: 'power2.in' }, '-=0.12');
}

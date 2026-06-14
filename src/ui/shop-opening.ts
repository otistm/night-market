import gsap from 'gsap';
import { reduceMotion } from '@/fx/animations';
import { $ } from '@/ui/dom';

export function showShopOpening(onComplete: () => void): void {
  const overlay = $('shop-opening');
  const caption = $('shop-opening-caption');

  overlay.classList.add('on');
  overlay.setAttribute('aria-hidden', 'false');

  if (reduceMotion) {
    onComplete();
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden', 'true');
    return;
  }

  gsap.killTweensOf(overlay);
  gsap.killTweensOf(caption);

  const tl = gsap.timeline({
    onComplete: () => {
      overlay.classList.remove('on');
      overlay.setAttribute('aria-hidden', 'true');
      gsap.set([overlay, caption], { clearProps: 'opacity,transform' });
    },
  });

  gsap.set(overlay, { opacity: 0 });
  gsap.set(caption, { opacity: 0, y: 18 });

  tl.to(overlay, { opacity: 1, duration: 0.55, ease: 'power2.out' })
    .to(caption, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.18)
    .to({}, { duration: 1.15 })
    .call(onComplete)
    .to(caption, { opacity: 0, y: -14, duration: 0.32, ease: 'power2.in' })
    .to(overlay, { opacity: 0, duration: 0.65, ease: 'power2.in' }, '-=0.12');
}

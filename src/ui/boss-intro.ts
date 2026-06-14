import gsap from 'gsap';
import type { FiendDef } from '@/game/types';
import { reduceMotion } from '@/fx/animations';
import { $ } from '@/ui/dom';

export function showBossIntro(fiend: FiendDef, onComplete: () => void): void {
  const overlay = $('boss-intro');
  const img = $('boss-intro-img') as HTMLImageElement;
  const name = $('boss-intro-name');
  const threat = $('boss-intro-threat');

  name.textContent = fiend.nm;
  threat.textContent = fiend.threat ?? '';
  if (fiend.img) {
    img.src = fiend.img;
    img.alt = fiend.nm;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  overlay.classList.add('on');
  overlay.setAttribute('aria-hidden', 'false');

  if (reduceMotion) {
    onComplete();
    overlay.classList.remove('on');
    overlay.setAttribute('aria-hidden', 'true');
    return;
  }

  gsap.killTweensOf(overlay);
  gsap.killTweensOf(name);
  gsap.killTweensOf(threat);

  let battleStarted = false;
  const startBattle = (): void => {
    if (battleStarted) return;
    battleStarted = true;
    onComplete();
  };

  const tl = gsap.timeline({
    onComplete: () => {
      overlay.classList.remove('on');
      overlay.setAttribute('aria-hidden', 'true');
      gsap.set([overlay, name, threat], { clearProps: 'opacity,transform' });
    },
  });

  gsap.set(overlay, { opacity: 0 });
  gsap.set(name, { opacity: 0, y: 24 });
  gsap.set(threat, { opacity: 0, y: 18 });

  tl.to(overlay, { opacity: 1, duration: 0.45, ease: 'power2.out' })
    .to(name, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0.2)
    .to(threat, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.55)
    .to({}, { duration: 1.35 })
    .call(startBattle)
    .to([name, threat], { opacity: 0, y: -16, duration: 0.35, ease: 'power2.in' })
    .to(overlay, { opacity: 0, duration: 0.55, ease: 'power2.in' }, '-=0.15');
}

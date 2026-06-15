import { FIENDS } from '@/data/fiends';
import gsap from 'gsap';
import { reduceMotion } from '@/fx/animations';
import { $ } from '@/ui/dom';

export interface LordsGalleryOptions {
  /** After a victory, cross off the latest lord and dismiss automatically. */
  autoDismiss?: boolean;
}

function renderGrid(defeatedCount: number, holdLatestCross: boolean): void {
  const grid = $('lords-gallery-grid');
  grid.innerHTML = FIENDS.map((fiend, i) => {
    const defeated = i < defeatedCount;
    const pendingCross = holdLatestCross && defeated && i === defeatedCount - 1;
    const showCross = defeated && !pendingCross;
    const classes = [
      'lord-card',
      defeated ? 'defeated' : '',
      pendingCross ? 'pending-cross' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `
      <figure class="${classes}" data-index="${i}">
        <div class="lord-portrait-wrap">
          <img src="${fiend.img ?? ''}" alt="" draggable="false" />
          <figcaption class="lord-name">${fiend.nm}</figcaption>
          ${showCross ? '<span class="lord-cross" aria-hidden="true"></span>' : ''}
        </div>
      </figure>`;
  }).join('');

  const sub = $('lords-gallery-sub');
  sub.textContent =
    defeatedCount >= FIENDS.length
      ? 'All ten lords vanquished.'
      : defeatedCount === 0
        ? 'No lords vanquished yet.'
        : `${defeatedCount} of ${FIENDS.length} lords vanquished.`;
}

function animateCrossOn(card: HTMLElement): void {
  const wrap = card.querySelector('.lord-portrait-wrap');
  const cross = document.createElement('span');
  cross.className = 'lord-cross';
  cross.setAttribute('aria-hidden', 'true');
  wrap?.appendChild(cross);
  card.classList.remove('pending-cross');
  card.classList.add('focus-lord');

  if (reduceMotion) return;

  gsap.fromTo(cross, { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });
}

/** Seconds to hold on the crossed lord before auto-dismiss. */
const HOLD_AFTER_CROSS_S = 2.6;
const FADE_OUT_S = 0.55;

function animateReveal(defeatedCount: number, autoDismiss: boolean, finish: () => void): void {
  const overlay = $('lords-gallery');
  const cards = overlay.querySelectorAll('.lord-card');

  if (reduceMotion) {
    gsap.set(overlay, { opacity: 1 });
    if (autoDismiss && defeatedCount > 0) {
      const latest = overlay.querySelector(`.lord-card[data-index="${defeatedCount - 1}"]`);
      if (latest instanceof HTMLElement) animateCrossOn(latest);
      gsap.delayedCall(2.8, finish);
    }
    return;
  }

  const tl = gsap.timeline();

  tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }).fromTo(
    cards,
    { opacity: 0, scale: 0.96 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.38,
      stagger: 0.025,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    },
    0.05,
  );

  if (!autoDismiss || defeatedCount <= 0) return;

  const latestIdx = defeatedCount - 1;
  const latest = overlay.querySelector(`.lord-card[data-index="${latestIdx}"]`);
  if (!(latest instanceof HTMLElement)) {
    tl.to({}, { duration: 1.2 });
    tl.to(overlay, { opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: finish });
    return;
  }

  tl.to(latest, { scale: 1.04, duration: 0.28, ease: 'power2.out' }, 0.55);
  tl.add(() => animateCrossOn(latest), 0.78);
  tl.to(latest, { scale: 1, duration: 0.35, ease: 'power2.inOut' }, 1.05);
  tl.to({}, { duration: HOLD_AFTER_CROSS_S });
  tl.to(overlay, { opacity: 0, duration: FADE_OUT_S, ease: 'power2.in', onComplete: finish });
}

export function showLordsGallery(
  defeatedCount: number,
  onComplete: () => void,
  options: LordsGalleryOptions = {},
): void {
  const { autoDismiss = false } = options;
  const overlay = $('lords-gallery');
  const holdLatestCross = autoDismiss && defeatedCount > 0;

  renderGrid(defeatedCount, holdLatestCross);

  let done = false;

  const finish = (): void => {
    if (done) return;
    done = true;
    gsap.killTweensOf(overlay);
    overlay.classList.remove('on', 'focus-reveal');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.removeEventListener('pointerdown', onTap);
    onComplete();
  };

  const onTap = (): void => finish();

  overlay.classList.add('on');
  if (autoDismiss) overlay.classList.add('focus-reveal');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.addEventListener('pointerdown', onTap);

  animateReveal(defeatedCount, autoDismiss, finish);
}

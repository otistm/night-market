import { STARTING_LIVES, WIN_TARGET } from '@/config/constants';
import { showLordsGallery } from '@/ui/lords-gallery';
import { reduceMotion } from '@/fx/animations';
import gsap from 'gsap';
import { $ } from '@/ui/dom';

export type StatHintKind = 'wins' | 'lives';

function hintContent(kind: StatHintKind): { icon: string; title: string; body: string } {
  if (kind === 'wins') {
    return {
      icon: '⚔',
      title: 'The 10 Lords',
      body: `Win battles against rival lords to fill this counter. Defeat ${WIN_TARGET} lords to conquer the Night Market and win the run.`,
    };
  }
  return {
    icon: '❤',
    title: 'Hearts',
    body: `You start with ${STARTING_LIVES} hearts. Lose a battle and one goes out — when they're all gone, your run ends.`,
  };
}

function animateStatHint(card: HTMLElement): void {
  if (reduceMotion) return;
  gsap.fromTo(
    card,
    { y: 12, scale: 0.96, opacity: 0 },
    { y: 0, scale: 1, opacity: 1, duration: 0.28, ease: 'power3.out', clearProps: 'transform,opacity' },
  );
}

export function openStatHint(kind: StatHintKind): void {
  const { icon, title, body } = hintContent(kind);
  const card = $('stat-hint-card');

  card.innerHTML = `
    <span class="stat-hint-ico" aria-hidden="true">${icon}</span>
    <h3 class="stat-hint-title" id="stat-hint-title">${title}</h3>
    <p class="stat-hint-body">${body}</p>
    <button type="button" class="btn ghost btn-compact stat-hint-close">Got it</button>`;

  card.setAttribute('aria-labelledby', 'stat-hint-title');
  $('stat-hint-overlay').classList.add('on');
  animateStatHint(card);

  card.querySelector('.stat-hint-close')?.addEventListener('click', closeStatHint, { once: true });
}

export function closeStatHint(): void {
  $('stat-hint-overlay').classList.remove('on');
}

export function isStatHintOpen(): boolean {
  return $('stat-hint-overlay').classList.contains('on');
}

export function bindStatHintOverlay(onBackdropClose: () => void): void {
  $('stat-hint-overlay').addEventListener('pointerdown', (e) => {
    if (e.target === $('stat-hint-overlay')) onBackdropClose();
  });
}

export function bindStatHints(
  isActive: () => boolean,
  getDefeatedCount?: () => number,
): void {
  $('hud-wins').addEventListener('click', () => {
    if (!isActive()) return;
    if (getDefeatedCount) {
      showLordsGallery(getDefeatedCount(), () => {});
      return;
    }
    openStatHint('wins');
  });
  $('hud-lives').addEventListener('click', () => {
    if (!isActive()) return;
    openStatHint('lives');
  });
  bindStatHintOverlay(closeStatHint);
}

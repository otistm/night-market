import { reduceMotion } from '@/fx/animations';
import gsap from 'gsap';
import { $ } from '@/ui/dom';

export interface NewRunPromptCallbacks {
  onConfirm(): void;
  onCancel(): void;
}

function animatePrompt(card: HTMLElement): void {
  if (reduceMotion) return;
  gsap.fromTo(
    card,
    { y: 12, scale: 0.96, opacity: 0 },
    { y: 0, scale: 1, opacity: 1, duration: 0.28, ease: 'power3.out', clearProps: 'transform,opacity' },
  );
}

export function openNewRunPrompt(callbacks: NewRunPromptCallbacks): void {
  const card = $('new-run-card');

  card.innerHTML = `
    <h3 class="new-run-title" id="new-run-title">Start a new run?</h3>
    <p class="new-run-body">Your current stall and progress will be lost.</p>
    <div class="new-run-actions">
      <button type="button" class="btn ghost btn-compact" data-action="cancel">Keep playing</button>
      <button type="button" class="btn primary btn-compact" data-action="confirm">Yes, new run</button>
    </div>`;

  card.setAttribute('aria-labelledby', 'new-run-title');
  $('new-run-overlay').classList.add('on');
  animatePrompt(card);

  card.querySelector('[data-action="cancel"]')?.addEventListener('click', callbacks.onCancel, { once: true });
  card.querySelector('[data-action="confirm"]')?.addEventListener('click', callbacks.onConfirm, { once: true });
}

export function closeNewRunPrompt(): void {
  $('new-run-overlay').classList.remove('on');
}

export function isNewRunPromptOpen(): boolean {
  return $('new-run-overlay').classList.contains('on');
}

export function bindNewRunPromptOverlay(onBackdropClose: () => void): void {
  $('new-run-overlay').addEventListener('pointerdown', (e) => {
    if (e.target === $('new-run-overlay')) onBackdropClose();
  });
}

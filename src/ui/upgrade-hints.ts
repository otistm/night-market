import type { RunState } from '@/game/types';
import { findUpgradePairs } from '@/game/economy';

const HINT_CLASS = 'upgrade-hint';
const ARROW_CLASS = 'upgrade-arrow';

function clearHintMarks(): void {
  document.querySelectorAll(`.${HINT_CLASS}`).forEach((el) => {
    el.classList.remove(HINT_CLASS);
    el.querySelector(`.${ARROW_CLASS}`)?.remove();
  });
}

function markElement(el: HTMLElement): void {
  el.classList.add(HINT_CLASS);
  if (!el.querySelector(`.${ARROW_CLASS}`)) {
    const arrow = document.createElement('span');
    arrow.className = ARROW_CLASS;
    arrow.setAttribute('aria-hidden', 'true');
    el.appendChild(arrow);
  }
}

export function updateUpgradeHints(run: RunState): void {
  clearHintMarks();

  const pairs = findUpgradePairs(run);
  if (!pairs.length) return;

  const shopUids = new Set(pairs.map((p) => p.shopUid));
  const boardUids = new Set(pairs.map((p) => p.boardUid));

  for (const uid of shopUids) {
    // On the reward screen the offered ware lives in the (visible) reward panel
    // rather than the (hidden) shop carousel — prefer it so the arrow shows there.
    const el =
      document.querySelector(`#reward-overlay.on #reward-wares [data-uid="${uid}"]`) ??
      document.querySelector(`#carousel [data-uid="${uid}"]`);
    if (el instanceof HTMLElement) markElement(el);
  }
  for (const uid of boardUids) {
    const el = document.querySelector(`#board [data-uid="${uid}"]`);
    if (el instanceof HTMLElement) markElement(el);
  }
}

export function clearUpgradeHints(): void {
  clearHintMarks();
}

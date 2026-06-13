import { STALL_CAP, STARTING_LIVES, WIN_TARGET } from '@/config/constants';
import type { RunState } from '@/game/types';
import { usedBoardCap } from '@/game/economy';
import { createItemElement, createShopCard, toggleScrollable } from '@/ui/components/cards';
import { resetAppShellOffset, scrollChildIntoView } from '@/ui/scroll-utils';
import { romans } from '@/utils/romans';
import { $ } from '@/ui/dom';

export function renderShop(run: RunState): void {
  $('hud-day').textContent = `NIGHT ${romans(run.day)}`;
  $('hud-gold').textContent = String(run.gold);
  $('reroll-cost').textContent = String(run.rerollCost);
  ($('btn-reroll') as HTMLButtonElement).disabled = run.gold < run.rerollCost;

  $('p-face').textContent = run.hero.face;

  $('hud-wins-val').textContent = `${run.wins} / ${WIN_TARGET}`;
  $('hud-lives-val').textContent = `${Math.max(0, run.lives)} / ${STARTING_LIVES}`;

  const carousel = $('carousel');
  carousel.innerHTML = '';
  let any = false;
  for (const it of run.shop) {
    if (!it) continue;
    any = true;
    carousel.appendChild(createShopCard(it, run.hero));
  }
  if (!any) {
    carousel.innerHTML = '<div class="sold-out">Sold out — reroll for fresh wares</div>';
  }

  const board = $('board');
  board.innerHTML = '';
  if (run.board.length === 0) {
    board.innerHTML = '<div class="empty-hint">your stall is empty — drag wares here</div>';
  } else {
    for (const it of run.board) {
      board.appendChild(createItemElement(it, 'board'));
    }
  }

  renderStallSlots(run.board);

  if (run.revealUid != null) {
    const tgt = board.querySelector(`[data-uid="${run.revealUid}"]`);
    if (tgt) scrollChildIntoView(board, tgt);
    run.revealUid = undefined;
  }

  toggleScrollable(board);
  toggleScrollable(carousel);

  requestAnimationFrame(() => {
    resetAppShellOffset();
  });
}

function renderStallSlots(board: RunState['board']): void {
  const el = $('cap-label');
  const used = usedBoardCap(board);
  el.innerHTML = '';
  el.setAttribute('aria-label', `${used} of ${STALL_CAP} stall slots filled`);

  for (let i = 0; i < STALL_CAP; i++) {
    const dot = document.createElement('span');
    dot.className = 'stall-slot';
    if (i < used) dot.classList.add('filled');
    el.appendChild(dot);
  }
}

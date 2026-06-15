import { STARTING_LIVES, WIN_TARGET } from '@/config/constants';
import type { RunState } from '@/game/types';
import { usedBoardCap } from '@/game/economy';
import {
  createItemElement,
  createShopCard,
  fillStallSlots,
  toggleScrollable,
} from '@/ui/components/cards';
import { syncRerollButton } from '@/ui/components/item-sheet';
import { resetAppShellOffset, scrollChildIntoView } from '@/ui/scroll-utils';
import { updateUpgradeHints } from '@/ui/upgrade-hints';
import { romans } from '@/utils/romans';
import { $ } from '@/ui/dom';

export function renderShop(run: RunState): void {
  $('hud-day').textContent = `NIGHT ${romans(run.day)}`;
  $('hud-gold').textContent = String(run.gold);
  $('reroll-cost').textContent = String(run.rerollCost);
  syncRerollButton();

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
  for (const it of run.board) {
    board.appendChild(createItemElement(it, 'board'));
  }
  fillStallSlots(board, usedBoardCap(run.board));

  if (run.revealUid != null) {
    const tgt = board.querySelector(`[data-uid="${run.revealUid}"]`);
    if (tgt) scrollChildIntoView(board, tgt);
    run.revealUid = undefined;
  }

  toggleScrollable(board);
  toggleScrollable($('shop-carousel-scroll'));

  requestAnimationFrame(() => {
    resetAppShellOffset();
    updateUpgradeHints(run);
  });
}

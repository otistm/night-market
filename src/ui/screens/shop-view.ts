import { STARTING_LIVES, WIN_TARGET } from '@/config/constants';
import type { RunState } from '@/game/types';
import { createShopCard, renderStall, toggleScrollable } from '@/ui/components/cards';
import { syncRerollButton } from '@/ui/components/item-sheet';
import { resetAppShellOffset } from '@/ui/scroll-utils';
import { updateUpgradeHints } from '@/ui/upgrade-hints';
import { romans } from '@/utils/romans';
import { $ } from '@/ui/dom';

export function renderShop(run: RunState): void {
  // Theme the shared stall to the chosen hero. Set on #app so the accent
  // persists across the shop, battle and reward screens (one stall, everywhere).
  $('app').style.setProperty('--stall-accent', run.hero.accent);

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
  renderStall(board, run.board, run.revealUid);
  run.revealUid = undefined;

  toggleScrollable($('shop-carousel-scroll'));

  requestAnimationFrame(() => {
    resetAppShellOffset();
    updateUpgradeHints(run);
  });
}

import type { HeroDef, ItemInstance, ItemLocation } from '@/game/types';
import { getItemDef, itemPrice } from '@/game/economy';
import { itemIconHtml } from '@/ui/item-icon';
import { STALL_CAP } from '@/config/constants';
import { tierStarHtml, tierStarLabel } from '@/ui/tier-star';

export function createItemElement(it: ItemInstance, where: ItemLocation): HTMLElement {
  const def = getItemDef(it);
  const el = document.createElement('div');
  el.className = `item sz${def.sz} t${it.tier}`;
  el.dataset.uid = String(it.uid);
  el.dataset.where = where;
  el.setAttribute('aria-label', `${def.nm}, ${tierStarLabel(it.tier)}`);
  el.innerHTML = `${tierStarHtml(it.tier)}<span class="ico">${itemIconHtml(def.ico, def.nm)}</span><div class="cdbar"><i></i></div>`;
  return el;
}

export function createShopCard(it: ItemInstance, hero?: HeroDef): HTMLElement {
  const def = getItemDef(it);
  const el = document.createElement('div');
  el.className = `shop-card frost-surface t${it.tier}`;
  el.dataset.uid = String(it.uid);
  el.dataset.where = 'shop';
  el.setAttribute('aria-label', `${def.nm}, ${tierStarLabel(it.tier)}`);
  el.innerHTML = `
    ${tierStarHtml(it.tier)}
    <span class="ico">${itemIconHtml(def.ico, def.nm)}</span>
    <span class="size-pips">${'<i></i>'.repeat(def.sz)}</span>
    <footer class="shop-card-foot"><span class="price">${itemPrice(it, hero)}</span></footer>`;
  return el;
}

/**
 * Append empty placeholder slots so the stall always reads as STALL_CAP slots.
 * `usedSlots` is the number of slots already occupied by wares (sum of sizes).
 */
export function fillStallSlots(boardEl: HTMLElement, usedSlots: number): void {
  for (let i = usedSlots; i < STALL_CAP; i++) {
    const slot = document.createElement('div');
    slot.className = 'stall-empty';
    slot.setAttribute('aria-hidden', 'true');
    boardEl.appendChild(slot);
  }
}

export function toggleScrollable(track: HTMLElement): void {
  requestAnimationFrame(() => {
    const scrollable = track.scrollWidth > track.clientWidth + 4;
    track.classList.toggle('scrollable', scrollable);
  });
}

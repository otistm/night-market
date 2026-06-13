import type { HeroDef, ItemInstance, ItemLocation } from '@/game/types';
import { getItemDef, itemPrice } from '@/game/economy';

export function createItemElement(it: ItemInstance, where: ItemLocation): HTMLElement {
  const def = getItemDef(it);
  const el = document.createElement('div');
  el.className = `item sz${def.sz} t${it.tier}`;
  el.dataset.uid = String(it.uid);
  el.dataset.where = where;
  el.setAttribute('aria-label', def.nm);
  el.innerHTML = `<span class="tdot"></span><span class="ico">${def.ico}</span><div class="cdbar"><i></i></div>`;
  return el;
}

export function createShopCard(it: ItemInstance, hero?: HeroDef): HTMLElement {
  const def = getItemDef(it);
  const el = document.createElement('div');
  el.className = `shop-card t${it.tier}`;
  el.dataset.uid = String(it.uid);
  el.dataset.where = 'shop';
  el.setAttribute('aria-label', def.nm);
  el.innerHTML = `
    <span class="ico">${def.ico}</span>
    <span class="size-pips">${'<i></i>'.repeat(def.sz)}</span>
    <footer class="shop-card-foot"><span class="price">${itemPrice(it, hero)}</span></footer>`;
  return el;
}

export function toggleScrollable(track: HTMLElement): void {
  requestAnimationFrame(() => {
    const scrollable = track.scrollWidth > track.clientWidth + 4;
    track.classList.toggle('scrollable', scrollable);
  });
}

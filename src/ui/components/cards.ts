import type { HeroDef, ItemInstance, ItemLocation, Tier } from '@/game/types';
import { getItemDef, itemPrice } from '@/game/economy';
import { itemIconHtml } from '@/ui/item-icon';
import { STALL_CAP } from '@/config/constants';
import { tierStarHtml, tierStarLabel } from '@/ui/tier-star';

function itemInnerHtml(def: ReturnType<typeof getItemDef>, tier: Tier): string {
  return `${tierStarHtml(tier)}<span class="ico">${itemIconHtml(def.ico, def.nm)}</span><div class="cdbar"><i></i></div>`;
}

export function createItemElement(it: ItemInstance, where: ItemLocation): HTMLElement {
  const def = getItemDef(it);
  const el = document.createElement('div');
  el.className = `item sz${def.sz} t${it.tier}`;
  el.dataset.uid = String(it.uid);
  el.dataset.where = where;
  el.setAttribute('aria-label', `${def.nm}, ${tierStarLabel(it.tier)}`);
  el.innerHTML = itemInnerHtml(def, it.tier);
  return el;
}

export function createShopCard(it: ItemInstance, hero?: HeroDef): HTMLElement {
  const def = getItemDef(it);
  const el = document.createElement('div');
  el.className = `shop-card frost-surface t${it.tier}`;
  el.dataset.uid = String(it.uid);
  el.dataset.where = 'shop';
  el.setAttribute('aria-label', `${def.nm}, ${tierStarLabel(it.tier)}`);
  const foot = it.free
    ? `<footer class="shop-card-foot reward-foot"><span class="reward-pill">Reward</span></footer>`
    : `<footer class="shop-card-foot"><span class="price">${itemPrice(it, hero)}</span></footer>`;
  el.innerHTML = `
    ${tierStarHtml(it.tier)}
    <span class="ico">${itemIconHtml(def.ico, def.nm)}</span>
    <span class="size-pips">${'<i></i>'.repeat(def.sz)}</span>
    ${foot}`;
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

/* ------------------------------------------------------------------ *
 * The stall tray — a fixed STALL_CAP-slot felt board. Wares are
 * absolutely positioned tiles that glide between slots, so a swap or
 * displacement reads as a smooth slide rather than a snap.
 * ------------------------------------------------------------------ */

export interface SlotGeo {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A stall tile built for the absolute-positioned tray overlay. */
function createStallTile(it: ItemInstance): HTMLElement {
  const def = getItemDef(it);
  const el = document.createElement('div');
  el.className = `item sz${def.sz} t${it.tier}`;
  el.dataset.uid = String(it.uid);
  el.dataset.where = 'board';
  el.dataset.tier = String(it.tier);
  el.setAttribute('aria-label', `${def.nm}, ${tierStarLabel(it.tier)}`);
  el.innerHTML = itemInnerHtml(def, it.tier);
  return el;
}

/** Last items rendered into each tray, so we can re-lay-out on resize/show. */
const stallItems = new WeakMap<HTMLElement, ItemInstance[]>();
const observedBoards = new WeakSet<HTMLElement>();

/**
 * Re-place existing tiles from fresh slot geometry (no glide). Used when the
 * board gains a real size — e.g. when the shop screen becomes visible after a
 * battle, where the initial render happened while the screen was display:none
 * (and so measured as zero-size).
 */
function repositionStall(boardEl: HTMLElement): void {
  const items = stallItems.get(boardEl);
  const overlay = boardEl.querySelector<HTMLElement>('.tray-items');
  if (!items || !overlay) return;
  const geo = measureStallSlots(boardEl);
  if (geo.length < STALL_CAP || geo[0].width < 1) return; // still hidden / no layout yet
  const starts = packedStarts(items);
  items.forEach((it, i) => {
    const tile = overlay.querySelector<HTMLElement>(`.item[data-uid="${it.uid}"]`);
    if (!tile) return;
    const span = stallSlotSpan(geo, starts[i], getItemDef(it).sz);
    const prev = tile.style.transition;
    tile.style.transition = 'none';
    tile.style.left = `${span.left}px`;
    tile.style.top = `${span.top}px`;
    tile.style.width = `${span.width}px`;
    tile.style.height = `${span.height}px`;
    void tile.offsetWidth;
    tile.style.transition = prev;
  });
}

/** Lazily build the slot backdrops + the tile overlay inside the board. */
export function ensureTray(boardEl: HTMLElement): HTMLElement {
  if (typeof ResizeObserver !== 'undefined' && !observedBoards.has(boardEl)) {
    observedBoards.add(boardEl);
    new ResizeObserver(() => repositionStall(boardEl)).observe(boardEl);
  }
  let overlay = boardEl.querySelector<HTMLElement>('.tray-items');
  if (overlay) return overlay;
  boardEl.innerHTML = '';
  for (let i = 0; i < STALL_CAP; i++) {
    const slot = document.createElement('div');
    slot.className = 'stall-slot';
    slot.dataset.slot = String(i);
    slot.setAttribute('aria-hidden', 'true');
    boardEl.appendChild(slot);
  }
  overlay = document.createElement('div');
  overlay.className = 'tray-items';
  boardEl.appendChild(overlay);
  return overlay;
}

/** Measure each slot relative to the tile overlay (handles resize / rotate). */
export function measureStallSlots(boardEl: HTMLElement): SlotGeo[] {
  const overlay = ensureTray(boardEl);
  const base = overlay.getBoundingClientRect();
  return [...boardEl.querySelectorAll<HTMLElement>('.stall-slot')].map((s) => {
    const r = s.getBoundingClientRect();
    return { left: r.left - base.left, top: r.top - base.top, width: r.width, height: r.height };
  });
}

/** The bounding box a ware of `size` occupies starting at slot `start`. */
export function stallSlotSpan(geo: SlotGeo[], start: number, size: number): SlotGeo {
  const a = geo[start];
  const b = geo[Math.min(start + size - 1, geo.length - 1)];
  return { left: a.left, top: a.top, width: b.left + b.width - a.left, height: a.height };
}

/**
 * UIDs whose adjacency synergy is currently satisfied for this tray order, so
 * the stall can glow as players arrange neighbours. Mirrors the combat engine's
 * `applyAdjacency` conditions (order-based left/right neighbours).
 */
function synergyActive(items: ItemInstance[]): Set<number> {
  const active = new Set<number>();
  if (items.length < 2) return active;
  const defs = items.map((it) => getItemDef(it));
  const tagsAt = (j: number): readonly string[] | null =>
    j >= 0 && j < items.length ? defs[j].tags : null;

  for (let i = 0; i < items.length; i++) {
    const adj = defs[i].adj;
    if (!adj) continue;
    const lt = tagsAt(i - 1);
    const rt = tagsAt(i + 1);
    let ok = false;
    if (adj.mode === 'aura') {
      ok = [i - 1, i + 1].some(
        (j) =>
          j >= 0 && j < items.length && (!adj.targetTag || defs[j].tags.includes(adj.targetTag)),
      );
    } else if (adj.perTag) {
      ok = !!(lt?.includes(adj.perTag) || rt?.includes(adj.perTag));
    } else if (adj.flanked) {
      ok = !!(lt && rt);
    } else if (adj.needTag) {
      ok = !!(lt?.includes(adj.needTag) || rt?.includes(adj.needTag));
    } else {
      ok = true;
    }
    if (ok) active.add(items[i].uid);
  }
  return active;
}

/** Left-packed start slot for each ware (cumulative sizes). */
export function packedStarts(items: ItemInstance[]): number[] {
  let acc = 0;
  return items.map((it) => {
    const start = acc;
    acc += getItemDef(it).sz;
    return start;
  });
}

/**
 * Lay out the tray to match `items`, reusing tiles by uid so survivors glide
 * to their new slots. `animateUid` plays the settle squash on that tile.
 */
export function renderStall(boardEl: HTMLElement, items: ItemInstance[], animateUid?: number): void {
  const overlay = ensureTray(boardEl);
  stallItems.set(boardEl, items);
  const geo = measureStallSlots(boardEl);
  if (!geo.length) return;
  const starts = packedStarts(items);
  const active = synergyActive(items);
  const seen = new Set<string>();

  items.forEach((it, i) => {
    const def = getItemDef(it);
    const span = stallSlotSpan(geo, starts[i], def.sz);
    const uid = String(it.uid);
    let tile = overlay.querySelector<HTMLElement>(`.item[data-uid="${uid}"]`);
    const fresh = !tile;
    if (!tile) {
      tile = createStallTile(it);
      overlay.appendChild(tile);
    } else if (tile.dataset.tier !== String(it.tier)) {
      tile.dataset.tier = String(it.tier);
      tile.className = `item sz${def.sz} t${it.tier}`;
      tile.innerHTML = itemInnerHtml(def, it.tier);
    }

    const apply = (): void => {
      tile!.style.left = `${span.left}px`;
      tile!.style.top = `${span.top}px`;
      tile!.style.width = `${span.width}px`;
      tile!.style.height = `${span.height}px`;
    };

    if (fresh) {
      // place new tiles instantly (no glide from 0,0), then re-enable transitions
      tile.style.transition = 'none';
      apply();
      void tile.offsetWidth;
      tile.style.transition = '';
    } else {
      apply();
    }

    tile.classList.toggle('synergy-active', def.adj ? active.has(it.uid) : false);

    if (uid === String(animateUid)) {
      tile.classList.remove('settling');
      void tile.offsetWidth;
      tile.classList.add('settling');
      tile.addEventListener('animationend', () => tile!.classList.remove('settling'), { once: true });
    }
    seen.add(uid);
  });

  [...overlay.children].forEach((ch) => {
    if (!seen.has((ch as HTMLElement).dataset.uid ?? '')) ch.remove();
  });
}

/** Nearest valid start slot for a ware of `size` given the overlay-relative left edge. */
export function nearestStartSlot(geo: SlotGeo[], relLeft: number, size: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let s = 0; s <= geo.length - size; s++) {
    const d = Math.abs(relLeft - geo[s].left);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

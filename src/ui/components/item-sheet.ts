import { TIER_COLORS } from '@/config/constants';
import type { ItemInstance, RunState } from '@/game/types';
import { describeItem, getItemDef, itemPrice, sellValue, itemStats } from '@/game/economy';
import { animateSheet } from '@/fx/animations';
import { $ } from '@/ui/dom';
import { itemIconHtml } from '@/ui/item-icon';
import { tierStarCount, tierStarHtml } from '@/ui/tier-star';

export interface ItemSheetCallbacks {
  onClose(): void;
  onBuy?(it: ItemInstance): void;
  onSell?(it: ItemInstance): void;
}

let swipeStartY = 0;
let swipeActive = false;

function bindSheetSwipe(sheet: HTMLElement, onClose: () => void): void {
  const grab = sheet.querySelector('.grab') as HTMLElement | null;
  const target = grab ?? sheet;

  target.addEventListener(
    'pointerdown',
    (e) => {
      swipeStartY = e.clientY;
      swipeActive = true;
    },
    { passive: true },
  );

  target.addEventListener(
    'pointermove',
    (e) => {
      if (!swipeActive) return;
      const dy = e.clientY - swipeStartY;
      if (dy > 72) {
        swipeActive = false;
        onClose();
      }
    },
    { passive: true },
  );

  target.addEventListener('pointerup', () => {
    swipeActive = false;
  });
}

export function isItemSheetOpen(): boolean {
  return (
    $('sheet-overlay').classList.contains('on') ||
    $('app').classList.contains('item-sheet-open')
  );
}

export function syncRerollButton(): void {
  const btn = $('btn-reroll') as HTMLButtonElement;
  if (isItemSheetOpen()) {
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
    return;
  }
  btn.removeAttribute('aria-disabled');
  const cost = Number($('reroll-cost').textContent);
  const gold = Number($('hud-gold').textContent);
  btn.disabled = gold < cost;
}

function setItemSheetLock(locked: boolean): void {
  const app = $('app');
  app.classList.toggle('item-sheet-open', locked);
  for (const child of app.children) {
    if (child.id === 'sheet-overlay') continue;
    if (locked) child.setAttribute('inert', '');
    else child.removeAttribute('inert');
  }
  syncRerollButton();
}

export function openItemSheet(
  it: ItemInstance,
  run: RunState | null,
  options: { shopMode?: boolean; where?: 'shop' | 'board' } & ItemSheetCallbacks,
): void {
  setItemSheetLock(true);

  const { shopMode = false, where, onClose, onBuy, onSell } = options;
  const mine = shopMode || (run?.board.some((b) => b.uid === it.uid) ?? false);
  const def = getItemDef(it);
  const st = itemStats(it, mine ? run?.hero : undefined);
  const sheet = $('item-sheet');

  let actions = `<div class="actions"><button class="btn ghost" data-action="close">Close</button></div>`;

  if (shopMode && where === 'shop') {
    actions = `<div class="actions">
      <button class="btn ghost" data-action="close">Close</button>
      <button class="btn primary" data-action="buy">Buy · ${itemPrice(it, run?.hero)}</button></div>`;
  } else if (shopMode && where === 'board') {
    actions = `<div class="actions">
      <button class="btn ghost" data-action="close">Close</button>
      <button class="btn" data-action="sell">Sell · ${sellValue(it)}</button></div>`;
  }

  sheet.innerHTML = `
    <div class="grab" aria-hidden="true"></div>
    <div class="sheet-head">
      <h3>
        <span class="big-ico">${itemIconHtml(def.ico, def.nm)}</span>
        <span class="sheet-title">${def.nm}</span>
        ${tierStarHtml(it.tier, `sheet-tier-star t${it.tier}`)}
      </h3>
    </div>
    <div class="sheet-body">
      <div class="item-tags">${def.tags.map((t) => `<span class="tag-pill">${t}</span>`).join('')}</div>
      <div class="desc">${describeItem(it, mine, run ?? undefined)}</div>
      <div class="stats">
        <span class="chip">size ${def.sz} slot${def.sz > 1 ? 's' : ''}</span>
        ${def.cd > 0 ? `<span class="chip">⏱ ${st.cd.toFixed(1)}s</span>` : ''}
        ${
          it.tier < 3
            ? `<span class="chip" style="color:${TIER_COLORS[it.tier + 1]}">duplicate → upgrade ⤴</span>`
            : `<span class="chip" style="color:${TIER_COLORS[3]}">${tierStarCount(it.tier)}★ max</span>`
        }
      </div>
      <div class="flav">"${def.flav}"</div>
    </div>
    <div class="sheet-foot">${actions}</div>`;

  $('sheet-overlay').classList.add('on');
  animateSheet(sheet);
  bindSheetSwipe(sheet, onClose);

  sheet.querySelector('[data-action="close"]')?.addEventListener('click', onClose);
  sheet.querySelector('[data-action="buy"]')?.addEventListener('click', () => onBuy?.(it));
  sheet.querySelector('[data-action="sell"]')?.addEventListener('click', () => onSell?.(it));
}

export function closeItemSheet(): void {
  $('sheet-overlay').classList.remove('on');
  setItemSheetLock(false);
}

export function bindSheetOverlay(onBackdropClose: () => void): void {
  $('sheet-overlay').addEventListener('pointerup', (e) => {
    if (e.target === $('sheet-overlay')) onBackdropClose();
  });
}

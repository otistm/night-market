import gsap from 'gsap';
import type { ItemInstance, RunState } from '@/game/types';
import { canDropOnBoard, buyItem, sellItem } from '@/game/shop-actions';
import { findMergeTarget, getItemDef, itemPrice, sellValue } from '@/game/economy';
import { reduceMotion } from '@/fx/animations';
import { isItemSheetOpen } from '@/ui/components/item-sheet';
import { hit, vibrate, $ } from '@/ui/dom';
import { clamp } from '@/utils/math';

const DRAG_THRESHOLD = 8;
const SELL_LIFT_PX = 42;
const FOLLOW = 0.42;

interface Drag {
  it: ItemInstance;
  where: 'shop' | 'board';
  source: HTMLElement;
  ghost: HTMLElement | null;
  placeholder: HTMLElement | null;
  mergeEl: HTMLElement | null;
  pointerId: number;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  w: number;
  h: number;
  moved: boolean;
  decided: boolean;
  selling: boolean;
  px: number;
  py: number;
  tx: number;
  ty: number;
  vx: number;
  raf: number;
}

export interface DragDropCallbacks {
  getRun(): RunState | null;
  isShopActive(): boolean;
  onShopChanged(): void;
  onTapItem(it: ItemInstance, where: 'shop' | 'board'): void;
  onBuyFailed(): void;
  onSell(): void;
  onMerge(it: ItemInstance): void;
}

export function createDragDrop(callbacks: DragDropCallbacks): { destroy(): void } {
  let drag: Drag | null = null;

  const board = (): HTMLElement => $('board');
  const realItems = (): HTMLElement[] => [...board().querySelectorAll<HTMLElement>('.item:not(.dragging)')];
  const allItems = (): HTMLElement[] => [...board().querySelectorAll<HTMLElement>('.item')];
  const empties = (): HTMLElement[] => [...board().querySelectorAll<HTMLElement>('.stall-empty')];
  const firstEmpty = (): HTMLElement | null => empties()[0] ?? null;
  const lastEmpty = (): HTMLElement | null => {
    const e = empties();
    return e[e.length - 1] ?? null;
  };

  /** First real ware whose midpoint sits to the right of x (i.e. insert before it). */
  function refBeforeAt(x: number): HTMLElement | null {
    for (const el of realItems()) {
      const r = el.getBoundingClientRect();
      if (x < r.left + r.width / 2) return el;
    }
    return null;
  }

  function findItem(run: RunState, uid: number, where: 'shop' | 'board'): ItemInstance | undefined {
    const list = where === 'shop' ? run.shop : run.board;
    return list.find((x) => x?.uid === uid) ?? undefined;
  }

  /**
   * Record board children rects, run a DOM mutation, then animate each surviving
   * child from its previous position to its new one (FLIP). The stall keeps a
   * constant slot count during a drag, so positions shift but widths do not —
   * giving a clean, undistorted "open a gap" reflow.
   */
  function flip(mutate: () => void): void {
    if (reduceMotion) {
      mutate();
      return;
    }
    const kids = [...board().children] as HTMLElement[];
    const before = kids.map((k) => k.getBoundingClientRect());
    mutate();
    kids.forEach((k, i) => {
      if (!k.isConnected || k.parentElement !== board()) return;
      const a = before[i];
      const b = k.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      gsap.fromTo(
        k,
        { x: dx, y: dy },
        { x: 0, y: 0, duration: 0.26, ease: 'power3.out', overwrite: true, clearProps: 'transform' },
      );
    });
  }

  function makePlaceholder(d: Drag): HTMLElement {
    const def = getItemDef(d.it);
    const ph = document.createElement('div');
    ph.className = `item sz${def.sz} t${d.it.tier} dragging drag-placeholder`;
    ph.dataset.where = 'board';
    ph.dataset.uid = String(d.it.uid);
    return ph;
  }

  /** Insert (or move) the gap placeholder so it lands where x points. */
  function placeAt(d: Drag, x: number): void {
    const ph = d.placeholder;
    if (!ph) return;
    const ref = refBeforeAt(x);
    const target = ref ?? firstEmpty();
    if (target === ph || ph.nextSibling === target) return;
    flip(() => board().insertBefore(ph, target ?? null));
  }

  /** Create a gap for a shop ware, consuming trailing empties to keep slot count. */
  function createPlaceholderAt(d: Drag, x: number): void {
    const def = getItemDef(d.it);
    const ph = makePlaceholder(d);
    d.placeholder = ph;
    const ref = refBeforeAt(x);
    flip(() => {
      for (let i = 0; i < def.sz; i++) lastEmpty()?.remove();
      board().insertBefore(ph, ref ?? firstEmpty() ?? null);
    });
  }

  /** Remove a shop ware's gap and restore the empty slots it borrowed. */
  function removePlaceholder(d: Drag): void {
    if (!d.placeholder || d.where !== 'shop') return;
    const def = getItemDef(d.it);
    const ph = d.placeholder;
    d.placeholder = null;
    flip(() => {
      ph.remove();
      for (let i = 0; i < def.sz; i++) {
        const e = document.createElement('div');
        e.className = 'stall-empty';
        e.setAttribute('aria-hidden', 'true');
        board().appendChild(e);
      }
    });
  }

  function showMergeTarget(d: Drag, mt: ItemInstance): void {
    const el = board().querySelector<HTMLElement>(`.item[data-uid="${mt.uid}"]`);
    if (el === d.mergeEl) return;
    clearMergeTarget(d);
    if (el) {
      el.classList.add('merge-target');
      d.mergeEl = el;
    }
  }

  function clearMergeTarget(d: Drag): void {
    d.mergeEl?.classList.remove('merge-target');
    d.mergeEl = null;
  }

  function isSellGesture(d: Drag, x: number, y: number): boolean {
    if (d.where !== 'board') return false;
    const r = board().getBoundingClientRect();
    if (y < r.top - 8) return true;
    return y - d.sy < -SELL_LIFT_PX && !hit(board(), x, y);
  }

  function ensureSellBadge(d: Drag): void {
    if (!d.ghost || d.ghost.querySelector('.ghost-sell')) return;
    const b = document.createElement('div');
    b.className = 'ghost-sell';
    b.textContent = `Sell +${sellValue(d.it)}`;
    d.ghost.appendChild(b);
  }

  function removeSellBadge(d: Drag): void {
    d.ghost?.querySelector('.ghost-sell')?.remove();
  }

  function startFollow(d: Drag): void {
    const f = reduceMotion ? 1 : FOLLOW;
    const step = (): void => {
      d.px += (d.tx - d.px) * f;
      d.py += (d.ty - d.py) * f;
      const lead = d.tx - d.px;
      d.vx = d.vx * 0.8 + lead * 0.2;
      const tilt = reduceMotion ? 0 : clamp(d.vx * 0.12, -12, 12);
      if (d.ghost) gsap.set(d.ghost, { x: d.px, y: d.py, rotation: tilt });
      d.raf = requestAnimationFrame(step);
    };
    d.raf = requestAnimationFrame(step);
  }

  function beginDrag(d: Drag): void {
    d.moved = true;
    d.source.classList.add('dragging');

    const ghost = d.source.cloneNode(true) as HTMLElement;
    ghost.classList.add('drag-clone', 'lifting');
    ghost.classList.remove('dragging', 'drag-placeholder');
    ghost.style.width = `${d.w}px`;
    ghost.style.height = `${d.h}px`;
    document.body.appendChild(ghost);
    d.ghost = ghost;

    d.px = d.tx = d.sx - d.ox;
    d.py = d.ty = d.sy - d.oy;
    gsap.set(ghost, { x: d.px, y: d.py, scale: 1, rotation: 0 });
    if (!reduceMotion) {
      gsap.fromTo(ghost, { scale: 1 }, { scale: 1.08, duration: 0.16, ease: 'back.out(2.2)' });
    }

    if (d.where === 'board') {
      d.source.classList.add('drag-placeholder');
      d.placeholder = d.source;
    }

    try {
      d.source.setPointerCapture(d.pointerId);
    } catch {
      /* pointer may already be captured/released */
    }
    vibrate(12);
    startFollow(d);
  }

  function updatePreview(d: Drag, x: number, y: number, run: RunState): void {
    const b = board();

    if (isSellGesture(d, x, y)) {
      d.selling = true;
      b.classList.remove('hot');
      b.classList.add('sell-hot');
      d.ghost?.classList.add('selling');
      ensureSellBadge(d);
      return;
    }

    if (d.selling) {
      d.selling = false;
      b.classList.remove('sell-hot');
      d.ghost?.classList.remove('selling');
      removeSellBadge(d);
    }

    if (d.where === 'board') {
      b.classList.add('hot');
      placeAt(d, x);
      return;
    }

    if (hit(b, x, y) && canDropOnBoard(run, d.it, 'shop')) {
      b.classList.add('hot');
      const mt = findMergeTarget(run.board, d.it);
      if (mt) {
        removePlaceholder(d);
        showMergeTarget(d, mt);
      } else {
        clearMergeTarget(d);
        if (d.placeholder) placeAt(d, x);
        else createPlaceholderAt(d, x);
      }
    } else {
      b.classList.remove('hot');
      clearMergeTarget(d);
      removePlaceholder(d);
    }
  }

  function settleGhost(ghost: HTMLElement | null, rect: DOMRect | undefined, done: () => void): void {
    if (!ghost || !rect || reduceMotion) {
      done();
      return;
    }
    const w = ghost.offsetWidth || 1;
    const h = ghost.offsetHeight || 1;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    gsap.to(ghost, {
      x: cx - w / 2,
      y: cy - h / 2,
      scale: rect.width / w,
      rotation: 0,
      duration: 0.2,
      ease: 'power3.out',
      onComplete: done,
    });
  }

  function tossGhost(ghost: HTMLElement | null, done: () => void): void {
    if (!ghost || reduceMotion) {
      done();
      return;
    }
    gsap.to(ghost, {
      y: '+=120',
      scale: 0.42,
      opacity: 0,
      rotation: 0,
      duration: 0.26,
      ease: 'power2.in',
      onComplete: done,
    });
  }

  function cleanup(d: Drag): void {
    d.ghost?.remove();
    d.ghost = null;
    d.source.classList.remove('dragging', 'drag-placeholder');
    clearMergeTarget(d);
    board().classList.remove('hot', 'sell-hot');
  }

  function endDrag(d: Drag, e: PointerEvent): void {
    cancelAnimationFrame(d.raf);
    try {
      d.source.releasePointerCapture(d.pointerId);
    } catch {
      /* already released */
    }

    if (!d.moved) {
      cleanup(d);
      callbacks.onTapItem(d.it, d.where);
      return;
    }

    board().classList.remove('hot', 'sell-hot');

    const run = callbacks.getRun();
    if (!run) {
      cleanup(d);
      callbacks.onShopChanged();
      return;
    }

    const finish = (commit?: () => void): void => {
      commit?.();
      callbacks.onShopChanged();
      cleanup(d);
    };

    if (d.where === 'board' && d.selling) {
      vibrate([10, 30]);
      tossGhost(d.ghost, () =>
        finish(() => {
          if (sellItem(run, d.it)) callbacks.onSell();
        }),
      );
      return;
    }

    const overBoard = hit(board(), e.clientX, e.clientY);

    if (d.where === 'board') {
      const slot = d.placeholder?.getBoundingClientRect();
      settleGhost(d.ghost, slot, () => finish(() => commitBoardOrder(run)));
      return;
    }

    // shop origin
    const mt = findMergeTarget(run.board, d.it);
    const canDrop = overBoard && canDropOnBoard(run, d.it, 'shop');
    const affordable = run.gold >= itemPrice(d.it, run.hero);

    if (canDrop && affordable) {
      const targetEl = mt ? board().querySelector<HTMLElement>(`.item[data-uid="${mt.uid}"]`) : d.placeholder;
      const slot = targetEl?.getBoundingClientRect();
      const insertAt = d.placeholder ? allItems().indexOf(d.placeholder) : run.board.length;
      settleGhost(d.ghost, slot, () =>
        finish(() => {
          const res = buyItem(run, d.it, insertAt < 0 ? run.board.length : insertAt);
          if (!res.ok) {
            if (res.reason === 'no_gold') callbacks.onBuyFailed();
          } else if (res.merged) {
            const merged = run.board.find((b) => b.uid === run.revealUid);
            if (merged) callbacks.onMerge(merged);
          }
        }),
      );
      return;
    }

    if (canDrop && !affordable) callbacks.onBuyFailed();

    // invalid drop — drift the ghost back to the source card, then restore
    settleGhost(d.ghost, d.source.getBoundingClientRect(), () => finish());
  }

  /** Reorder the model to match the live DOM order of the stall. */
  function commitBoardOrder(run: RunState): void {
    const order = allItems().map((el) => +el.dataset.uid!);
    run.board.sort((a, b) => order.indexOf(a.uid) - order.indexOf(b.uid));
  }

  function abortDrag(d: Drag): void {
    cancelAnimationFrame(d.raf);
    try {
      d.source.releasePointerCapture(d.pointerId);
    } catch {
      /* already released */
    }
    cleanup(d);
    if (d.moved) callbacks.onShopChanged();
  }

  function onPointerDown(e: PointerEvent): void {
    if (isItemSheetOpen()) return;
    if ((e.target as Element).closest('.cboard .item')) return;
    if ((e.target as Element).closest('#dock-avatar, #player-dock .btn')) return;
    if (!callbacks.isShopActive()) return;

    const el = (e.target as Element).closest<HTMLElement>('.shop-card, #board .item');
    if (!el?.dataset.uid || !el.dataset.where) return;

    const run = callbacks.getRun();
    if (!run) return;

    const uid = +el.dataset.uid;
    const where = el.dataset.where as 'shop' | 'board';
    const it = findItem(run, uid, where);
    if (!it) return;

    const r = el.getBoundingClientRect();
    drag = {
      it,
      where,
      source: el,
      ghost: null,
      placeholder: null,
      mergeEl: null,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      ox: e.clientX - r.left,
      oy: e.clientY - r.top,
      w: r.width,
      h: r.height,
      moved: false,
      decided: where === 'board',
      selling: false,
      px: 0,
      py: 0,
      tx: 0,
      ty: 0,
      vx: 0,
      raf: 0,
    };
  }

  function onPointerMove(e: PointerEvent): void {
    if (isItemSheetOpen()) return;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const run = callbacks.getRun();
    if (!run) return;

    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;

    if (!drag.decided) {
      // shop cards: a mostly-horizontal swipe scrolls the carousel instead.
      if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
        drag = null;
        return;
      }
      if (dy > 12 && dy > Math.abs(dx) * 1.2) drag.decided = true;
      else return;
    }

    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) beginDrag(drag);

    if (drag.moved) {
      drag.tx = e.clientX - drag.ox;
      drag.ty = e.clientY - drag.oy;
      updatePreview(drag, e.clientX, e.clientY, run);
      e.preventDefault();
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (isItemSheetOpen()) {
      abortDrag(drag);
      drag = null;
      return;
    }
    const d = drag;
    drag = null;
    endDrag(d, e);
  }

  function onPointerCancel(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    abortDrag(drag);
    drag = null;
  }

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);

  return {
    destroy() {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
    },
  };
}

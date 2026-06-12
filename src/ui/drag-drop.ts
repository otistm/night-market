import type { DragState, ItemInstance, RunState } from '@/game/types';
import { canDropOnBoard, buyItem, moveItem, sellItem } from '@/game/shop-actions';
import { animateDragGhost, removeGhost } from '@/fx/animations';
import { hit, vibrate, $ } from '@/ui/dom';

const DRAG_THRESHOLD = 9;
const SELL_LIFT_PX = 36;

function isStallSellRelease(e: PointerEvent, d: DragState): boolean {
  if (d.where !== 'board' || !d.moved) return false;
  const board = $('board');
  const r = board.getBoundingClientRect();
  if (e.clientY < r.top - 12) return true;
  const dy = e.clientY - d.sy;
  return dy < -SELL_LIFT_PX && !hit(board, e.clientX, e.clientY);
}

function isStallSellHover(clientX: number, clientY: number, d: DragState): boolean {
  if (d.where !== 'board' || !d.moved) return false;
  const board = $('board');
  const r = board.getBoundingClientRect();
  return clientY < r.top - 8 || (clientY - d.sy < -SELL_LIFT_PX && !hit(board, clientX, clientY));
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
  let drag: DragState | null = null;
  let markEl: HTMLElement | null = null;

  function insertIndexAt(x: number, run: RunState): number {
    const kids = [...$('board').querySelectorAll<HTMLElement>('.item:not(.dragging)')];
    for (const kid of kids) {
      const r = kid.getBoundingClientRect();
      if (x < r.left + r.width / 2) {
        return run.board.findIndex((b) => b.uid === +kid.dataset.uid!);
      }
    }
    return run.board.length;
  }

  function updateInsertMark(x: number | null, run: RunState | null): void {
    if (markEl) {
      markEl.remove();
      markEl = null;
    }
    if (x === null || !run) return;

    markEl = document.createElement('div');
    markEl.className = 'insert-mark';
    const idx = insertIndexAt(x, run);
    const kids = [...$('board').querySelectorAll<HTMLElement>('.item:not(.dragging)')];
    const ref = kids.find((k) => run.board.findIndex((b) => b.uid === +k.dataset.uid!) === idx);
    $('board').insertBefore(markEl, ref ?? null);
  }

  function findItem(run: RunState, uid: number, where: 'shop' | 'board'): ItemInstance | undefined {
    const list = where === 'shop' ? run.shop : run.board;
    return list.find((x) => x?.uid === uid) ?? undefined;
  }

  function clearDragState(d: DragState): void {
    d.el.classList.remove('dragging');
    try {
      d.el.releasePointerCapture(d.pointerId);
    } catch {
      /* pointer may already be released */
    }
  }

  function startGhost(d: DragState): void {
    d.moved = true;
    d.el.classList.add('dragging');
    d.ghost = d.el.cloneNode(true) as HTMLElement;
    d.ghost.classList.add('drag-clone');
    d.ghost.classList.remove('dragging');
    d.ghost.style.width = `${d.el.offsetWidth}px`;
    document.body.appendChild(d.ghost);
    try {
      d.el.setPointerCapture(d.pointerId);
    } catch {
      /* ignore */
    }
    vibrate(8);
  }

  function onPointerDown(e: PointerEvent): void {
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

    drag = {
      it,
      where,
      el,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
      decided: where === 'board',
      ghost: null,
      pointerId: e.pointerId,
    };
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const run = callbacks.getRun();
    if (!run) return;

    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;

    if (!drag.decided) {
      if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
        drag = null;
        return;
      }
      if (dy > 12 && dy > Math.abs(dx) * 1.2) drag.decided = true;
      else return;
    }

    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      startGhost(drag);
    }

    if (drag.moved && drag.ghost) {
      animateDragGhost(
        drag.ghost,
        e.clientX - drag.el.offsetWidth / 2,
        e.clientY - drag.el.offsetHeight * 0.65,
        dx * 0.02,
      );

      const overBoard = hit($('board'), e.clientX, e.clientY);
      const sellHover = isStallSellHover(e.clientX, e.clientY, drag);

      $('board').classList.toggle('hot', overBoard && canDropOnBoard(run, drag.it, drag.where));
      $('board').classList.toggle('sell-hot', sellHover && drag.where === 'board');
      updateInsertMark(overBoard && !sellHover ? e.clientX : null, run);
      e.preventDefault();
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;

    $('board').classList.remove('hot', 'sell-hot');
    updateInsertMark(null, null);

    if (d.ghost) {
      removeGhost(d.ghost, () => {});
    }

    const wasTap = !d.moved;
    clearDragState(d);

    if (wasTap) {
      callbacks.onTapItem(d.it, d.where);
      return;
    }

    const run = callbacks.getRun();
    if (!run) return;

    if (isStallSellRelease(e, d)) {
      if (sellItem(run, d.it)) callbacks.onSell();
      callbacks.onShopChanged();
      return;
    }

    const overBoard = hit($('board'), e.clientX, e.clientY);

    if (overBoard) {
      const idx = insertIndexAt(e.clientX, run);
      if (d.where === 'shop') {
        const result = buyItem(run, d.it, idx);
        if (!result.ok) {
          if (result.reason === 'no_gold') callbacks.onBuyFailed();
        } else if (result.merged) {
          const merged = run.board.find((b) => b.uid === run.revealUid);
          if (merged) callbacks.onMerge(merged);
        }
      } else {
        moveItem(run, d.it, idx);
      }
    }

    callbacks.onShopChanged();
  }

  function onPointerCancel(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.ghost) drag.ghost.remove();
    clearDragState(drag);
    drag = null;
    updateInsertMark(null, null);
    $('board').classList.remove('hot', 'sell-hot');
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

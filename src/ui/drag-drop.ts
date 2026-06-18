import gsap from 'gsap';
import { STALL_CAP } from '@/config/constants';
import type { ItemInstance, RunState } from '@/game/types';
import { buyItem, mergeBoardItems, sellItem } from '@/game/shop-actions';
import { getItemDef, itemPrice, sellValue, usedBoardCap } from '@/game/economy';
import {
  measureStallSlots,
  nearestStartSlot,
  packedStarts,
  renderStall,
  stallSlotSpan,
} from '@/ui/components/cards';
import { reduceMotion } from '@/fx/animations';
import { isItemSheetOpen } from '@/ui/components/item-sheet';
import { itemIconHtml } from '@/ui/item-icon';
import { tierStarHtml } from '@/ui/tier-star';
import { vibrate, $ } from '@/ui/dom';
import { clamp } from '@/utils/math';

const DRAG_THRESHOLD = 8;
const FOLLOW = 0.42;

type Plan = { kind: 'merge'; targetUid: number } | { kind: 'place'; insertIdx: number };

interface Drag {
  it: ItemInstance;
  size: number;
  where: 'shop' | 'board';
  source: HTMLElement;
  ghost: HTMLElement | null;
  pointerId: number;
  sx: number;
  sy: number;
  grabDX: number;
  grabDY: number;
  tileH: number;
  originStart: number;
  moved: boolean;
  decided: boolean;
  selling: boolean;
  valid: boolean;
  target: number;
  plan: Plan | null;
  px: number;
  py: number;
  tx: number;
  ty: number;
  vx: number;
  tilt: number;
  lifted: boolean;
  raf: number;
}

export interface DragDropCallbacks {
  getRun(): RunState | null;
  isShopActive(): boolean;
  onShopChanged(): void;
  onTapItem(it: ItemInstance, where: 'shop' | 'board'): void;
  onBuyFailed(): void;
  onBuy(): void;
  onSell(): void;
  onMerge(it: ItemInstance): void;
}

export function createDragDrop(callbacks: DragDropCallbacks): { destroy(): void } {
  let drag: Drag | null = null;

  const board = (): HTMLElement => $('board');

  const layer = document.createElement('div');
  layer.id = 'drag-layer';
  document.body.appendChild(layer);

  /* ------------------------------------------------------------------ *
   * geometry / planning
   * ------------------------------------------------------------------ */

  function otherItems(run: RunState, d: Drag): ItemInstance[] {
    return d.where === 'board' ? run.board.filter((b) => b.uid !== d.it.uid) : run.board;
  }

  function itemAtSlot(items: ItemInstance[], starts: number[], slot: number): ItemInstance | null {
    for (let k = 0; k < items.length; k++) {
      const st = starts[k];
      if (slot >= st && slot < st + getItemDef(items[k]).sz) return items[k];
    }
    return null;
  }

  function canMerge(a: ItemInstance, b: ItemInstance): boolean {
    return a.uid !== b.uid && a.defId === b.defId && a.tier === b.tier && a.tier < 3;
  }

  /** Evaluate where the ghost would land and stamp the slot hints. */
  function evaluate(d: Drag, run: RunState, ghostLeftClient: number): void {
    const b = board();
    const geo = measureStallSlots(b);
    clearSlotHints(b);
    b.querySelector('.item.merge-target')?.classList.remove('merge-target');
    if (!geo.length) {
      d.valid = false;
      d.plan = null;
      d.target = -1;
      return;
    }

    const overlay = b.querySelector<HTMLElement>('.tray-items')!;
    const relLeft = ghostLeftClient - overlay.getBoundingClientRect().left;
    const start = nearestStartSlot(geo, relLeft, d.size);
    const span = stallSlotSpan(geo, start, d.size);
    const centerRel = relLeft + span.width / 2;

    const others = otherItems(run, d);
    const starts = packedStarts(others);

    // merge takes precedence: is the ghost centred over a matching ware?
    let centerSlot = start;
    let bestD = Infinity;
    for (let s = 0; s < geo.length; s++) {
      const dd = Math.abs(centerRel - (geo[s].left + geo[s].width / 2));
      if (dd < bestD) {
        bestD = dd;
        centerSlot = s;
      }
    }
    const under = itemAtSlot(others, starts, centerSlot);
    if (under && canMerge(d.it, under)) {
      d.plan = { kind: 'merge', targetUid: under.uid };
      d.target = start;
      d.valid = true;
      markMergeTarget(b, under.uid);
      return;
    }

    // plain placement / displacement
    const fits = d.where === 'board' || usedBoardCap(run.board) + d.size <= STALL_CAP;
    let insertIdx = 0;
    for (const st of starts) if (st < start) insertIdx++;
    d.plan = fits ? { kind: 'place', insertIdx } : null;
    d.target = start;
    d.valid = fits;

    const slots = [...b.querySelectorAll<HTMLElement>('.stall-slot')];
    if (!fits) {
      for (let i = start; i < start + d.size && i < slots.length; i++) slots[i]?.classList.add('bad');
      return;
    }
    for (let i = start; i < start + d.size; i++) slots[i]?.classList.add('ok');

    // preview where displaced wares will slide
    const sim = others.slice();
    sim.splice(insertIdx, 0, d.it);
    const simStarts = packedStarts(sim);
    others.forEach((o, k) => {
      const simIdx = sim.indexOf(o);
      if (simStarts[simIdx] === starts[k]) return;
      const ns = simStarts[simIdx];
      for (let i = ns; i < ns + getItemDef(o).sz; i++) slots[i]?.classList.add('move');
    });
  }

  function clearSlotHints(b: HTMLElement): void {
    b.querySelectorAll('.stall-slot.ok, .stall-slot.bad, .stall-slot.move').forEach((s) =>
      s.classList.remove('ok', 'bad', 'move'),
    );
  }

  function markMergeTarget(b: HTMLElement, uid: number): void {
    const el = b.querySelector<HTMLElement>(`.tray-items .item[data-uid="${uid}"]`);
    el?.classList.add('merge-target');
  }

  function overTray(x: number, y: number): boolean {
    const r = board().getBoundingClientRect();
    return x > r.left - 26 && x < r.right + 26 && y > r.top - 32 && y < r.bottom + 32;
  }

  /* ------------------------------------------------------------------ *
   * ghost
   * ------------------------------------------------------------------ */

  function makeGhost(it: ItemInstance, w: number, h: number): HTMLElement {
    const def = getItemDef(it);
    const g = document.createElement('div');
    g.className = `item sz${def.sz} t${it.tier} drag-clone lifting`;
    g.style.width = `${w}px`;
    g.style.height = `${h}px`;
    g.innerHTML = `${tierStarHtml(it.tier)}<span class="ico">${itemIconHtml(def.ico, def.nm)}</span>`;
    layer.appendChild(g);
    return g;
  }

  function startFollow(d: Drag): void {
    const f = reduceMotion ? 1 : FOLLOW;
    const step = (): void => {
      d.px += (d.tx - d.px) * f;
      d.py += (d.ty - d.py) * f;
      const lead = d.tx - d.px;
      d.vx = d.vx * 0.8 + lead * 0.2;
      const targetTilt = reduceMotion ? 0 : clamp(d.vx * 0.16, -10, 10);
      d.tilt += (targetTilt - d.tilt) * 0.25;
      const lift = d.lifted ? 1.07 : 1;
      if (d.ghost) gsap.set(d.ghost, { x: d.px, y: d.py, rotation: d.tilt, scale: lift });
      d.raf = requestAnimationFrame(step);
    };
    d.raf = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ *
   * begin drag
   * ------------------------------------------------------------------ */

  function beginDrag(d: Drag, x: number, y: number): void {
    d.moved = true;
    const b = board();
    const geo = measureStallSlots(b);
    const trayW = stallSlotSpan(geo, 0, d.size).width;
    const trayH = geo.length ? geo[0].height : d.tileH;
    const r = d.source.getBoundingClientRect();

    if (d.where === 'board') {
      // lift the real tile out — others stay put (absolute), the ghost carries it
      d.grabDX = x - r.left;
      d.grabDY = y - r.top;
      d.ghost = makeGhost(d.it, r.width, r.height);
      d.source.remove();
    } else {
      d.source.classList.add('dragging');
      d.grabDX = ((x - r.left) / r.width) * trayW;
      d.grabDY = ((y - r.top) / r.height) * trayH;
      d.ghost = makeGhost(d.it, r.width, r.height);
      // morph from shop-card size to tray-tile size as it lifts
      requestAnimationFrame(() => {
        if (!d.ghost) return;
        d.ghost.style.transition = 'width .16s ease, height .16s ease';
        d.ghost.style.width = `${trayW}px`;
        d.ghost.style.height = `${trayH}px`;
      });
    }
    d.tileH = trayH;

    d.px = d.tx = x - d.grabDX;
    d.py = d.ty = y - d.grabDY;
    gsap.set(d.ghost, { x: d.px, y: d.py, scale: 1, rotation: 0 });
    requestAnimationFrame(() => {
      d.lifted = true;
    });

    try {
      $('shop-screen').setPointerCapture(d.pointerId);
    } catch {
      /* capture is best-effort */
    }
    vibrate(12);
    startFollow(d);
  }

  /* ------------------------------------------------------------------ *
   * move
   * ------------------------------------------------------------------ */

  function moveDrag(d: Drag, x: number, y: number, run: RunState): void {
    d.tx = x - d.grabDX;
    d.ty = y - d.grabDY;

    const b = board();
    if (!overTray(x, y)) {
      d.target = -1;
      d.plan = null;
      d.valid = false;
      clearSlotHints(b);
      b.querySelector('.item.merge-target')?.classList.remove('merge-target');
      b.classList.remove('hot');
      const sellable = d.where === 'board';
      d.selling = sellable;
      b.classList.toggle('sell-hot', sellable);
      d.ghost?.classList.toggle('selling', sellable);
      if (sellable) ensureSellBadge(d);
      else removeSellBadge(d);
      return;
    }

    if (d.selling) {
      d.selling = false;
      b.classList.remove('sell-hot');
      d.ghost?.classList.remove('selling');
      removeSellBadge(d);
    }
    evaluate(d, run, d.tx);
    b.classList.toggle('hot', d.valid && d.plan?.kind === 'place');
  }

  function ensureSellBadge(d: Drag): void {
    if (!d.ghost || d.ghost.querySelector('.ghost-sell')) return;
    const tag = document.createElement('div');
    tag.className = 'ghost-sell';
    tag.textContent = `Sell +${sellValue(d.it)}`;
    d.ghost.appendChild(tag);
  }

  function removeSellBadge(d: Drag): void {
    d.ghost?.querySelector('.ghost-sell')?.remove();
  }

  /* ------------------------------------------------------------------ *
   * drop
   * ------------------------------------------------------------------ */

  function destSpanClient(start: number, size: number): { x: number; y: number; w: number; h: number } {
    const b = board();
    const geo = measureStallSlots(b);
    const overlay = b.querySelector<HTMLElement>('.tray-items')!;
    const base = overlay.getBoundingClientRect();
    const span = stallSlotSpan(geo, start, size);
    return { x: base.left + span.left, y: base.top + span.top, w: span.width, h: span.height };
  }

  function settleGhostTo(
    d: Drag,
    dest: { x: number; y: number; w: number; h: number },
    done: () => void,
  ): void {
    const g = d.ghost;
    if (!g || reduceMotion) {
      done();
      return;
    }
    g.classList.remove('lifting');
    g.style.transition = '';
    gsap.to(g, {
      x: dest.x,
      y: dest.y,
      rotation: 0,
      scale: 1,
      width: dest.w,
      height: dest.h,
      duration: 0.2,
      ease: 'power3.out',
      onComplete: done,
    });
  }

  function endDrag(d: Drag, x: number, y: number): void {
    cancelAnimationFrame(d.raf);
    try {
      $('shop-screen').releasePointerCapture(d.pointerId);
    } catch {
      /* already released */
    }

    if (!d.moved) {
      cleanup(d);
      callbacks.onTapItem(d.it, d.where);
      return;
    }

    const run = callbacks.getRun();
    const b = board();
    b.classList.remove('hot', 'sell-hot');
    clearSlotHints(b);
    b.querySelector('.item.merge-target')?.classList.remove('merge-target');

    if (!run) {
      finishAndRefresh(d);
      return;
    }

    if (!overTray(x, y)) {
      if (d.where === 'board') sellGhost(d, run);
      else bounceBack(d);
      return;
    }

    if (!d.valid || !d.plan) {
      // over the tray but nowhere to go (no space / nothing matches)
      if (d.where === 'shop') callbacks.onBuyFailed();
      bounceBack(d);
      return;
    }

    if (d.plan.kind === 'merge') {
      commitMerge(d, run, d.plan.targetUid);
      return;
    }
    commitPlace(d, run, d.plan.insertIdx);
  }

  function commitPlace(d: Drag, run: RunState, insertIdx: number): void {
    if (d.where === 'shop' && run.gold < itemPrice(d.it, run.hero)) {
      callbacks.onBuyFailed();
      bounceBack(d);
      return;
    }
    const dest = destSpanClient(d.target, d.size);
    settleGhostTo(d, dest, () => {
      if (d.where === 'shop') {
        const res = buyItem(run, d.it, insertIdx);
        if (res.ok) callbacks.onBuy();
      } else {
        // reorder explicitly: drop the dragged ware into the others at insertIdx
        const others = run.board.filter((b) => b.uid !== d.it.uid);
        others.splice(clamp(insertIdx, 0, others.length), 0, d.it);
        run.board.length = 0;
        run.board.push(...others);
      }
      finishAndRefresh(d, d.it.uid, dest);
    });
  }

  function commitMerge(d: Drag, run: RunState, targetUid: number): void {
    if (d.where === 'shop' && run.gold < itemPrice(d.it, run.hero)) {
      callbacks.onBuyFailed();
      bounceBack(d);
      return;
    }
    const targetEl = board().querySelector<HTMLElement>(`.tray-items .item[data-uid="${targetUid}"]`);
    const tr = targetEl?.getBoundingClientRect();
    const dest = tr
      ? { x: tr.left, y: tr.top, w: tr.width, h: tr.height }
      : destSpanClient(d.target, d.size);
    settleGhostTo(d, dest, () => {
      let ok = false;
      if (d.where === 'shop') {
        const res = buyItem(run, d.it, run.board.length, targetUid);
        ok = res.ok && !!res.merged;
        if (res.ok) callbacks.onBuy();
      } else {
        ok = mergeBoardItems(run, d.it.uid, targetUid);
      }
      const merged = ok ? run.board.find((x) => x.uid === run.revealUid) : undefined;
      finishAndRefresh(d, run.revealUid, dest);
      if (merged) callbacks.onMerge(merged);
    });
  }

  function sellGhost(d: Drag, run: RunState): void {
    const g = d.ghost;
    const r = g?.getBoundingClientRect();
    const cx = r ? r.left + r.width / 2 : d.tx;
    const cy = r ? r.top + r.height / 2 : d.ty;
    vibrate([10, 30]);
    if (g && !reduceMotion) {
      gsap.to(g, { y: '+=110', scale: 0.4, opacity: 0, rotation: 0, duration: 0.26, ease: 'power2.in' });
    }
    dustBurst(cx, r ? r.bottom : cy, d.size);
    coinPop(cx, cy, sellValue(d.it));
    if (sellItem(run, d.it)) callbacks.onSell();
    window.setTimeout(() => finishAndRefresh(d), 260);
  }

  function bounceBack(d: Drag): void {
    const g = d.ghost;
    if (!g || reduceMotion) {
      finishAndRefresh(d);
      return;
    }
    if (d.where === 'board' && d.originStart >= 0) {
      const dest = destSpanClient(clamp(d.originStart, 0, STALL_CAP - d.size), d.size);
      settleGhostTo(d, dest, () => finishAndRefresh(d, d.it.uid, dest));
      return;
    }
    const r = d.source.getBoundingClientRect();
    gsap.to(g, {
      x: r.left,
      y: r.top,
      width: r.width,
      height: r.height,
      scale: 0.92,
      opacity: 0,
      rotation: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => finishAndRefresh(d),
    });
  }

  /** Commit-side cleanup: refresh the stall, drop fx, remove ghost. */
  function finishAndRefresh(
    d: Drag,
    animateUid?: number,
    dust?: { x: number; y: number; w: number; h: number },
  ): void {
    callbacks.onShopChanged();
    const run = callbacks.getRun();
    if (run) renderStall(board(), run.board, animateUid);
    if (dust && d.plan?.kind === 'place') dustBurst(dust.x + dust.w / 2, dust.y + dust.h, d.size);
    cleanup(d);
  }

  function cleanup(d: Drag): void {
    d.ghost?.remove();
    d.ghost = null;
    d.source.classList.remove('dragging');
    const b = board();
    b.classList.remove('hot', 'sell-hot');
    clearSlotHints(b);
    b.querySelector('.item.merge-target')?.classList.remove('merge-target');
  }

  function abortDrag(d: Drag): void {
    cancelAnimationFrame(d.raf);
    try {
      $('shop-screen').releasePointerCapture(d.pointerId);
    } catch {
      /* already released */
    }
    cleanup(d);
    if (d.moved) callbacks.onShopChanged();
  }

  /* ------------------------------------------------------------------ *
   * fx
   * ------------------------------------------------------------------ */

  function dustBurst(cx: number, cy: number, weight: number): void {
    if (reduceMotion) return;
    const count = 6 + weight * 5;
    const spread = 14 + weight * 12;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'dust';
      const sz = 3 + Math.random() * (3 + weight * 2);
      p.style.width = p.style.height = `${sz}px`;
      p.style.left = `${cx - sz / 2}px`;
      p.style.top = `${cy - sz / 2}px`;
      layer.appendChild(p);
      const dir = Math.random() < 0.5 ? -1 : 1;
      const ang = Math.random() * 0.5 + 0.05;
      const dist = spread * (0.4 + Math.random() * 0.8);
      const dxp = dir * Math.cos(ang) * dist;
      const lift = -(6 + Math.random() * 10 * (weight / 3));
      const fall = 4 + Math.random() * 8;
      const dur = 420 + Math.random() * 320 + weight * 60;
      p.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 0 },
          { transform: `translate(${dxp * 0.5}px,${lift}px) scale(1)`, opacity: 0.85, offset: 0.25 },
          { transform: `translate(${dxp}px,${fall}px) scale(.4)`, opacity: 0 },
        ],
        { duration: dur, easing: 'cubic-bezier(.2,.6,.3,1)' },
      ).onfinish = () => p.remove();
    }
  }

  function coinPop(x: number, y: number, amount: number): void {
    if (reduceMotion) return;
    const c = document.createElement('div');
    c.className = 'coinpop';
    c.textContent = `+${amount}`;
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    layer.appendChild(c);
    c.animate(
      [
        { transform: 'translate(-50%,0) scale(.8)', opacity: 0 },
        { transform: 'translate(-50%,-14px) scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'translate(-50%,-46px) scale(1)', opacity: 0 },
      ],
      { duration: 780, easing: 'cubic-bezier(.2,.8,.3,1)' },
    ).onfinish = () => c.remove();
  }

  /* ------------------------------------------------------------------ *
   * pointer plumbing
   * ------------------------------------------------------------------ */

  function findItem(run: RunState, uid: number, where: 'shop' | 'board'): ItemInstance | undefined {
    const list = where === 'shop' ? run.shop : run.board;
    return list.find((x) => x?.uid === uid) ?? undefined;
  }

  function onPointerDown(e: PointerEvent): void {
    if (drag) return;
    if (isItemSheetOpen()) return;
    if ((e.target as Element).closest('.cboard .item')) return;
    if ((e.target as Element).closest('#dock-avatar, #player-dock .btn')) return;
    if (!callbacks.isShopActive()) return;

    const el = (e.target as Element).closest<HTMLElement>('.shop-card, #board .item');
    if (!el?.dataset.uid || !el.dataset.where) return;

    const run = callbacks.getRun();
    if (!run) return;

    const where = el.dataset.where as 'shop' | 'board';
    const it = findItem(run, +el.dataset.uid, where);
    if (!it) return;

    const r = el.getBoundingClientRect();
    const originStart =
      where === 'board' ? packedStarts(run.board)[run.board.findIndex((b) => b.uid === it.uid)] ?? -1 : -1;

    drag = {
      it,
      size: getItemDef(it).sz,
      where,
      source: el,
      ghost: null,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      grabDX: 0,
      grabDY: 0,
      tileH: r.height,
      originStart,
      moved: false,
      decided: where === 'board',
      selling: false,
      valid: false,
      target: -1,
      plan: null,
      px: 0,
      py: 0,
      tx: 0,
      ty: 0,
      vx: 0,
      tilt: 0,
      lifted: false,
      raf: 0,
    };
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (isItemSheetOpen()) return;
    const run = callbacks.getRun();
    if (!run) return;

    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;

    if (!drag.decided) {
      // a mostly-horizontal swipe on a shop card scrolls the carousel instead
      if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
        drag = null;
        return;
      }
      if (dy > 12 && dy > Math.abs(dx) * 1.2) drag.decided = true;
      else return;
    }

    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) beginDrag(drag, e.clientX, e.clientY);

    if (drag.moved) {
      moveDrag(drag, e.clientX, e.clientY, run);
      e.preventDefault();
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;
    if (isItemSheetOpen()) {
      abortDrag(d);
      return;
    }
    endDrag(d, e.clientX, e.clientY);
  }

  function onPointerCancel(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;
    abortDrag(d);
  }

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);

  return {
    destroy() {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
      layer.remove();
    },
  };
}

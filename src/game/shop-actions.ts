import { STALL_CAP } from '@/config/constants';
import type { ItemInstance, RunState } from '@/game/types';
import { findMergeTarget, getItemDef, itemPrice, sellValue } from '@/game/economy';
import { usedBoardCap } from '@/game/economy';
import { clamp } from '@/utils/math';

export interface ShopActionResult {
  ok: boolean;
  reason?: 'no_gold' | 'no_space';
  merged?: boolean;
}

export function buyItem(run: RunState, it: ItemInstance, idx: number): ShopActionResult {
  const price = itemPrice(it);
  if (run.gold < price) return { ok: false, reason: 'no_gold' };

  const mergeTarget = findMergeTarget(run.board, it);
  const def = getItemDef(it);

  if (!mergeTarget && usedBoardCap(run.board) + def.sz > STALL_CAP) {
    return { ok: false, reason: 'no_space' };
  }

  run.gold -= price;
  const shopIdx = run.shop.findIndex((x) => x?.uid === it.uid);
  if (shopIdx >= 0) run.shop[shopIdx] = null;

  if (mergeTarget) {
    mergeTarget.tier = (mergeTarget.tier + 1) as 0 | 1 | 2 | 3;
    run.revealUid = mergeTarget.uid;
    return { ok: true, merged: true };
  }

  run.board.splice(clamp(idx, 0, run.board.length), 0, it);
  return { ok: true, merged: false };
}

export function moveItem(run: RunState, it: ItemInstance, idx: number): void {
  const cur = run.board.findIndex((b) => b.uid === it.uid);
  if (cur < 0) return;
  run.board.splice(cur, 1);
  let target = idx;
  if (target > cur) target--;
  run.board.splice(clamp(target, 0, run.board.length), 0, it);
}

export function sellItem(run: RunState, it: ItemInstance): boolean {
  const i = run.board.findIndex((b) => b.uid === it.uid);
  if (i < 0) return false;
  run.gold += sellValue(it);
  run.board.splice(i, 1);
  return true;
}

export function rerollShop(run: RunState): boolean {
  if (run.gold < run.rerollCost) return false;
  run.gold -= run.rerollCost;
  return true;
}

export function canDropOnBoard(run: RunState, it: ItemInstance, from: 'shop' | 'board'): boolean {
  if (from === 'board') return true;
  return usedBoardCap(run.board) + getItemDef(it).sz <= STALL_CAP || !!findMergeTarget(run.board, it);
}

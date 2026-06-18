import { STALL_CAP } from '@/config/constants';
import type { ItemInstance, RunState, Tier } from '@/game/types';
import { findMergeTarget, getItemDef, itemPrice, sellValue } from '@/game/economy';
import { usedBoardCap } from '@/game/economy';
import { clamp } from '@/utils/math';

export interface ShopActionResult {
  ok: boolean;
  reason?: 'no_gold' | 'no_space';
  merged?: boolean;
}

function canMergeInto(a: ItemInstance, b: ItemInstance): boolean {
  return a.uid !== b.uid && a.defId === b.defId && a.tier === b.tier && a.tier < 3;
}

/**
 * Buy a shop ware and place it at `idx`, or — when `mergeTargetUid` names a
 * matching stall ware — merge into it instead. Placement is positional now:
 * the caller decides whether the drop should merge, so we never auto-merge
 * behind the player's back.
 */
export function buyItem(
  run: RunState,
  it: ItemInstance,
  idx: number,
  mergeTargetUid?: number,
): ShopActionResult {
  const price = itemPrice(it, run.hero);
  if (run.gold < price) return { ok: false, reason: 'no_gold' };

  const mergeTarget =
    mergeTargetUid != null
      ? run.board.find((b) => b.uid === mergeTargetUid && canMergeInto(it, b))
      : undefined;
  const def = getItemDef(it);

  if (!mergeTarget && usedBoardCap(run.board) + def.sz > STALL_CAP) {
    return { ok: false, reason: 'no_space' };
  }

  run.gold -= price;
  run.goldSpentThisNight += price;
  const shopIdx = run.shop.findIndex((x) => x?.uid === it.uid);
  if (shopIdx >= 0) run.shop[shopIdx] = null;

  if (mergeTarget) {
    mergeTarget.tier = (mergeTarget.tier + 1) as Tier;
    run.revealUid = mergeTarget.uid;
    return { ok: true, merged: true };
  }

  run.board.splice(clamp(idx, 0, run.board.length), 0, it);
  return { ok: true, merged: false };
}

/** Merge one stall ware into another matching stall ware (drag-to-merge). */
export function mergeBoardItems(run: RunState, srcUid: number, targetUid: number): boolean {
  const target = run.board.find((b) => b.uid === targetUid);
  const srcIdx = run.board.findIndex((b) => b.uid === srcUid);
  if (!target || srcIdx < 0) return false;
  if (!canMergeInto(run.board[srcIdx], target)) return false;
  run.board.splice(srcIdx, 1);
  target.tier = (target.tier + 1) as Tier;
  run.revealUid = target.uid;
  return true;
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
  const cost = run.rerollCost;
  run.gold -= cost;
  run.goldSpentThisNight += cost;
  // Each reroll within a night costs more, so fishing is a real decision.
  // Goblin rerolls stay free (reset to 0 each night in result-view).
  if (!run.hero.freeReroll) run.rerollCost = cost + 1;
  return true;
}

export function canDropOnBoard(run: RunState, it: ItemInstance, from: 'shop' | 'board'): boolean {
  if (from === 'board') return true;
  return usedBoardCap(run.board) + getItemDef(it).sz <= STALL_CAP || !!findMergeTarget(run.board, it);
}

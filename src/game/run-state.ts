import { ITEMS } from '@/data/items';
import { STALL_CAP, STARTING_GOLD, STARTING_HP, STARTING_LIVES } from '@/config/constants';
import type { HeroDef, ItemInstance, RunState, Tier } from '@/game/types';
import { pick } from '@/utils/math';
import { isValidTier } from '@/config/constants';

let uidCounter = 0;

export function createItemInstance(defId: string, tier: Tier): ItemInstance {
  return { uid: ++uidCounter, defId, tier };
}

export function resetUidCounter(): void {
  uidCounter = 0;
}

function rollTier(day: number): Tier {
  const r = Math.random();
  if (day >= 9 && r < 0.12) return 3;
  if (day >= 6 && r < 0.32) return 2;
  if (day >= 3 && r < 0.55) return 1;
  return 0;
}

export function rollShop(run: RunState): void {
  run.shop = Array.from({ length: 4 }, () =>
    createItemInstance(pick(ITEMS).id, rollTier(run.day)),
  );
}

export function createRun(hero: HeroDef): RunState {
  resetUidCounter();
  const run: RunState = {
    hero,
    day: 1,
    wins: 0,
    lives: STARTING_LIVES,
    gold: STARTING_GOLD,
    maxHp: STARTING_HP,
    board: [],
    shop: [],
    rerollCost: 1,
    speed: 1,
  };
  rollShop(run);
  return run;
}

export function canPlaceItem(board: ItemInstance[], item: ItemInstance): boolean {
  const def = ITEMS.find((i) => i.id === item.defId)!;
  return usedCap(board) + def.sz <= STALL_CAP;
}

function usedCap(board: ItemInstance[]): number {
  return board.reduce((acc, it) => {
    const def = ITEMS.find((i) => i.id === it.defId)!;
    return acc + def.sz;
  }, 0);
}

export function upgradeTier(tier: Tier): Tier | null {
  const next = tier + 1;
  return isValidTier(next) ? next : null;
}

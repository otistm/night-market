import { ITEM_BY_ID, MARKET_ITEMS } from '@/data/items';
import { STALL_CAP, STARTING_GOLD, STARTING_HP, STARTING_LIVES } from '@/config/constants';
import type { HeroDef, ItemInstance, RunState, Tier } from '@/game/types';
import { pick } from '@/utils/math';
import { isValidTier } from '@/config/constants';

/** Chance each shop slot is stocked from the chosen peddler's own wares. */
const HERO_POOL_WEIGHT = 0.65;

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
  const heroPool = MARKET_ITEMS.filter((d) => d.heroId === run.hero.id);
  const otherPool = MARKET_ITEMS.filter((d) => d.heroId !== run.hero.id);

  run.shop = Array.from({ length: 4 }, () => {
    const pool = heroPool.length > 0 && Math.random() < HERO_POOL_WEIGHT ? heroPool : otherPool;
    return createItemInstance(pick(pool).id, rollTier(run.day));
  });
}

export function createRun(hero: HeroDef): RunState {
  resetUidCounter();
  const run: RunState = {
    hero,
    day: 1,
    wins: 0,
    lives: STARTING_LIVES,
    bossAttempts: 0,
    gold: STARTING_GOLD,
    maxHp: STARTING_HP,
    board: [],
    shop: [],
    rerollCost: hero.freeReroll ? 0 : 1,
    speed: 1,
  };
  rollShop(run);
  return run;
}

export function canPlaceItem(board: ItemInstance[], item: ItemInstance): boolean {
  const def = ITEM_BY_ID[item.defId];
  return usedCap(board) + def.sz <= STALL_CAP;
}

export function usedCap(board: ItemInstance[]): number {
  return board.reduce((acc, it) => acc + ITEM_BY_ID[it.defId].sz, 0);
}

/** Boss rewards lean one tier richer than the shop at the same night. */
function bossRewardTier(day: number): Tier {
  const r = Math.random();
  if (day >= 7 && r < 0.3) return 3;
  if (day >= 4 && r < 0.55) return 2;
  if (day >= 2 && r < 0.7) return 1;
  return 0;
}

/** A hero-pool-weighted ware offered as the item half of a boss reward. */
export function rollBossReward(run: RunState): ItemInstance {
  const heroPool = MARKET_ITEMS.filter((d) => d.heroId === run.hero.id);
  const otherPool = MARKET_ITEMS.filter((d) => d.heroId !== run.hero.id);
  const pool = heroPool.length > 0 && Math.random() < HERO_POOL_WEIGHT ? heroPool : otherPool;
  return createItemInstance(pick(pool).id, bossRewardTier(run.day));
}

/**
 * Roll `n` distinct (by ware) boss-reward choices, each flagged `free` so it
 * can be claimed from the stall at no gold cost. Falls back to allowing repeats
 * only if the pool is too small to fill `n` unique wares.
 */
export function rollBossRewards(run: RunState, n: number): ItemInstance[] {
  const out: ItemInstance[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < n && guard++ < 60) {
    const item = rollBossReward(run);
    if (seen.has(item.defId)) continue;
    seen.add(item.defId);
    item.free = true;
    out.push(item);
  }
  // Pool exhausted (shouldn't happen with the real catalogue): allow repeats.
  while (out.length < n) {
    const item = rollBossReward(run);
    item.free = true;
    out.push(item);
  }
  return out;
}

export function upgradeTier(tier: Tier): Tier | null {
  const next = tier + 1;
  return isValidTier(next) ? next : null;
}

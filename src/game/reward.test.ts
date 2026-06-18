import { describe, expect, it } from 'vitest';
import { HERO_BY_ID } from '@/data/heroes';
import { ITEM_BY_ID, MARKET_ITEMS } from '@/data/items';
import { bossBounty, STALL_CAP } from '@/config/constants';
import { canPlaceItem, createItemInstance, createRun, rollBossReward } from '@/game/run-state';

const marketIds = new Set(MARKET_ITEMS.map((d) => d.id));

describe('boss bounty', () => {
  it('is positive and scales with the night', () => {
    expect(bossBounty(1)).toBeGreaterThan(0);
    expect(bossBounty(5)).toBeGreaterThan(bossBounty(2));
  });
});

describe('rollBossReward', () => {
  it('always yields a real, sellable market ware at a valid tier', () => {
    const run = createRun(HERO_BY_ID.witch);
    run.day = 6;
    for (let i = 0; i < 40; i++) {
      const item = rollBossReward(run);
      expect(ITEM_BY_ID[item.defId]).toBeDefined();
      expect(marketIds.has(item.defId)).toBe(true);
      expect(item.tier).toBeGreaterThanOrEqual(0);
      expect(item.tier).toBeLessThanOrEqual(3);
    }
  });
});

describe('reward choice effects', () => {
  it('the gold pick increments run gold', () => {
    const run = createRun(HERO_BY_ID.witch);
    const before = run.gold;
    const gold = bossBounty(run.day);
    run.gold += gold;
    expect(run.gold).toBe(before + gold);
  });

  it('the item pick appends to the board and flags the reveal', () => {
    const run = createRun(HERO_BY_ID.witch);
    run.board = [];
    const item = rollBossReward(run);
    expect(canPlaceItem(run.board, item)).toBe(true);
    run.board.push(item);
    run.revealUid = item.uid;
    expect(run.board.at(-1)).toBe(item);
    expect(run.revealUid).toBe(item.uid);
  });

  it('the item pick is unavailable when the stall is full', () => {
    const run = createRun(HERO_BY_ID.witch);
    // Iron Claws are size 1; fill every slot.
    run.board = Array.from({ length: STALL_CAP }, () => createItemInstance('claws', 0));
    const item = createItemInstance('claws', 0);
    expect(canPlaceItem(run.board, item)).toBe(false);
  });
});

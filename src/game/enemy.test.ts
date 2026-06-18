import { describe, expect, it } from 'vitest';
import { FIENDS } from '@/data/fiends';
import { ITEM_BY_ID } from '@/data/items';
import { HEROES } from '@/data/heroes';
import type { RunState } from '@/game/types';
import { buildEnemy, getFiendForRun, RETRY_HP_PCT, RETRY_TIER_AT } from '@/game/enemy';
import { createRun } from '@/game/run-state';

function runAtDay(day: number, bossAttempts = 0): RunState {
  const run = createRun(HEROES[0]);
  run.day = day;
  run.bossAttempts = bossAttempts;
  return run;
}

describe('scripted fiends', () => {
  it('every fiend ware references a real item def', () => {
    for (const fiend of FIENDS) {
      for (const w of fiend.wares) {
        expect(ITEM_BY_ID[w.defId], `${fiend.nm} → ${w.defId}`).toBeDefined();
      }
    }
  });

  it('every fiend has boss portrait art', () => {
    for (const fiend of FIENDS) {
      expect(fiend.img, fiend.nm).toBeTruthy();
    }
  });

  it('Night 1 is the Grinning Lantern with its compendium loadout', () => {
    const enemy = buildEnemy(runAtDay(1));
    expect(enemy.nm).toBe('The Grinning Lantern');
    expect(enemy.hp).toBe(80);
    expect(enemy.board.map((b) => b.defId)).toEqual(['furnaceheart', 'bellows']);
    expect(enemy.board.every((b) => b.tier === 0)).toBe(true);
  });

  it('Night 5 Gravemaw tanks behind the Tombstone but now bites back', () => {
    const enemy = buildEnemy(runAtDay(5));
    expect(enemy.nm).toBe('Gravemaw');
    expect(enemy.hp).toBe(140);
    // The ward tank keeps its Tombstone but gains real offence so the long
    // fight actually costs the player HP.
    expect(enemy.board.map((b) => b.defId)).toEqual(['tombstone', 'furnaceheart', 'claws']);
  });

  it('Night 10 is Moloch with 300 HP', () => {
    const enemy = buildEnemy(runAtDay(10));
    expect(enemy.nm).toBe('Moloch, the Hungering Dark');
    expect(enemy.hp).toBe(300);
  });

  it('boss HP is monotonically non-decreasing across the ten nights', () => {
    let prev = 0;
    for (let day = 1; day <= FIENDS.length; day++) {
      const hp = buildEnemy(runAtDay(day)).hp;
      expect(hp, `Night ${day}`).toBeGreaterThanOrEqual(prev);
      prev = hp;
    }
  });

  it('carries threat and hint text', () => {
    const enemy = buildEnemy(runAtDay(2));
    expect(enemy.threat).toContain('weeps your strength');
    expect(enemy.hint).toContain('burst it down');
  });
});

describe('boss retry scaling', () => {
  it('failed attempts add a gentle percentage of HP, scaled to the boss', () => {
    const fiend = FIENDS[2];
    const enemy = buildEnemy(runAtDay(3, 2));
    expect(getFiendForRun(runAtDay(3)).nm).toBe('The Bog Hag');
    expect(enemy.hp).toBe(Math.round(fiend.baseHp * (1 + RETRY_HP_PCT * 2)));
  });

  it('does not roughly double the boss: only the primary ware gains a single tier', () => {
    // Bog Hag: [cauldron t1 (primary), hexpin t1, cursedoll t0, toadstool t1].
    const enemy = buildEnemy(runAtDay(3, RETRY_TIER_AT));
    expect(enemy.board[0].defId).toBe('cauldron');
    expect(enemy.board[0].tier).toBe(2); // primary +1
    expect(enemy.board.find((b) => b.defId === 'hexpin')?.tier).toBe(1); // unchanged
    expect(enemy.board.find((b) => b.defId === 'toadstool')?.tier).toBe(1); // unchanged
  });

  it('leaves ware tiers untouched before the retry-tier threshold', () => {
    const enemy = buildEnemy(runAtDay(3, RETRY_TIER_AT - 1));
    expect(enemy.board[0].tier).toBe(1);
  });

  it('does not advance to the next Lord until the run day increases', () => {
    const run = runAtDay(2, 3);
    expect(getFiendForRun(run).nm).toBe('The Hollow Mourner');
    expect(buildEnemy(run).hp).toBe(Math.round(100 * (1 + RETRY_HP_PCT * 3)));
  });

  it('caps the primary ware at 4 stars', () => {
    const enemy = buildEnemy(runAtDay(8, 4));
    // Carrion Choir primary is silverbone t1 → +1 = t2 (never exceeds 3).
    expect(enemy.board[0].tier).toBeLessThanOrEqual(3);
  });
});

import { describe, expect, it } from 'vitest';
import { FIENDS } from '@/data/fiends';
import { ITEM_BY_ID } from '@/data/items';
import { HEROES } from '@/data/heroes';
import type { RunState } from '@/game/types';
import { buildEnemy, HP_PER_LOOP } from '@/game/enemy';
import { createRun } from '@/game/run-state';

function runAtDay(day: number): RunState {
  const run = createRun(HEROES[0]);
  run.day = day;
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

  it('Night 1 is the Grinning Lantern with its compendium loadout', () => {
    const enemy = buildEnemy(runAtDay(1));
    expect(enemy.nm).toBe('The Grinning Lantern');
    expect(enemy.hp).toBe(80);
    expect(enemy.board.map((b) => b.defId)).toEqual(['furnaceheart', 'bellows']);
    expect(enemy.board.every((b) => b.tier === 0)).toBe(true);
  });

  it('Night 5 Gravemaw wields only the Tombstone Bulwark', () => {
    const enemy = buildEnemy(runAtDay(5));
    expect(enemy.nm).toBe('Gravemaw');
    expect(enemy.hp).toBe(140);
    expect(enemy.board.map((b) => b.defId)).toEqual(['tombstone']);
  });

  it('Night 10 is Moloch with 320 HP', () => {
    const enemy = buildEnemy(runAtDay(10));
    expect(enemy.nm).toBe('Moloch, the Hungering Dark');
    expect(enemy.hp).toBe(320);
  });

  it('carries threat and hint text', () => {
    const enemy = buildEnemy(runAtDay(2));
    expect(enemy.threat).toContain('weeps your strength');
    expect(enemy.hint).toContain('burst it down');
  });
});

describe('loop scaling', () => {
  it('Night 11 loops back to the first fiend, stronger', () => {
    const enemy = buildEnemy(runAtDay(11));
    expect(enemy.nm).toBe('The Grinning Lantern');
    expect(enemy.hp).toBe(80 + HP_PER_LOOP);
    expect(enemy.board.every((b) => b.tier === 1)).toBe(true);
  });

  it('caps ware tiers at Diamond', () => {
    // Night 28 = Carrion Choir on cycle 2: Gold Iron Claws +2 would exceed Diamond.
    const enemy = buildEnemy(runAtDay(28));
    expect(enemy.nm).toBe('The Carrion Choir');
    const claws = enemy.board.find((b) => b.defId === 'claws')!;
    expect(claws.tier).toBe(3);
  });
});

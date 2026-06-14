import { describe, expect, it } from 'vitest';
import { HERO_BY_ID } from '@/data/heroes';
import type { EnemyMeta, RunState, Tier } from '@/game/types';
import { createCombat, tickCombat, type CombatEvent } from '@/game/combat';
import { createItemInstance, createRun } from '@/game/run-state';
import { itemStats } from '@/game/economy';

function makeRun(heroId: string, defIds: string[]): RunState {
  const run = createRun(HERO_BY_ID[heroId]);
  run.board = defIds.map((id) => createItemInstance(id, 0));
  return run;
}

function makeEnemy(
  hp: number,
  wares: [string, Tier][] = [],
  regen = 0,
  gimmick?: EnemyMeta['gimmick'],
): EnemyMeta {
  return {
    nm: 'Test Fiend',
    face: '👹',
    hp,
    board: wares.map(([defId, tier]) => createItemInstance(defId, tier)),
    regen,
    gimmick,
  };
}

function runFor(combat: ReturnType<typeof createCombat>, seconds: number): CombatEvent[] {
  const all: CombatEvent[] = [];
  const step = 0.05;
  for (let t = 0; t < seconds; t += step) {
    all.push(...tickCombat(combat, step));
  }
  return all;
}

describe('battle report', () => {
  it('tracks triggers and damage per ware', () => {
    const combat = createCombat(makeRun('witch', ['claws']), makeEnemy(30));
    runFor(combat, 15);
    expect(combat.over).toBe(true);
    expect(combat.report).toBeDefined();
    const row = combat.report!.player.rows.find((r) => r.defId === 'claws');
    expect(row!.triggers).toBeGreaterThan(0);
    expect(row!.damage).toBeGreaterThan(0);
  });
});

describe('boss gimmicks', () => {
  it('ward reduces non-pierce damage but pierce bypasses it', () => {
    // Iron Claws: 6 dmg every 2.4s, no pierce → ward 0.5 makes it 3.
    const warded = createCombat(makeRun('witch', ['claws']), makeEnemy(140, [], 0, { kind: 'ward', pct: 0.5 }));
    runFor(warded, 2.5);
    expect(warded.e.hp).toBe(137);

    // Glacial Spike pierces → ward is ignored (8 dmg lands in full).
    const pierced = createCombat(makeRun('witch', ['glacialspike']), makeEnemy(140, [], 0, { kind: 'ward', pct: 0.5 }));
    runFor(pierced, 5.2);
    expect(pierced.e.hp).toBe(132);
  });

  it('shieldwall periodically grants the boss shield', () => {
    const combat = createCombat(makeRun('witch', []), makeEnemy(140, [], 0, { kind: 'shieldwall', every: 5, amount: 16 }));
    runFor(combat, 5.2);
    expect(combat.e.shield).toBe(16);
  });
});

describe('pierce', () => {
  it('ignores shields and hits health directly', () => {
    // Glacial Spike: every 5.0s deal 8 damage, pierce.
    const combat = createCombat(makeRun('witch', ['glacialspike']), makeEnemy(140));
    combat.e.shield = 50;
    runFor(combat, 5.2);
    expect(combat.e.shield).toBe(50);
    expect(combat.e.hp).toBe(132);
  });
});

describe('curse', () => {
  it('halves healing while active', () => {
    // Sanguine Rose: every 5.0s restore 7 health → 4 while cursed.
    const combat = createCombat(makeRun('witch', []), makeEnemy(140, [['rose', 0]]));
    combat.e.hp = 90;
    combat.e.curse = 10;
    runFor(combat, 5.2);
    expect(combat.e.hp).toBe(94);
  });

  it('halves shield gain while active', () => {
    // Nightcloak: every 4.4s gain 7 shield → 4 while cursed.
    const combat = createCombat(makeRun('witch', []), makeEnemy(140, [['nightcloak', 0]]));
    combat.e.curse = 10;
    runFor(combat, 4.5);
    expect(combat.e.shield).toBe(4);
  });

  it('is applied by curse wares and expires over time', () => {
    // Wax Curse-Doll: every 5.0s curse the foe 3s.
    const combat = createCombat(makeRun('witch', ['cursedoll']), makeEnemy(140));
    runFor(combat, 5.2);
    expect(combat.e.curse).toBeGreaterThan(0);
    runFor(combat, 3.5);
    expect(combat.e.curse).toBe(0);
  });
});

describe('execute', () => {
  it('adds bonus damage below 30% health', () => {
    // Bloodletter Fang: every 3.6s deal 6 damage, +10 below 30%.
    const combat = createCombat(makeRun('witch', ['bloodfang']), makeEnemy(100));
    combat.e.hp = 20;
    runFor(combat, 3.7);
    expect(combat.e.hp).toBe(4);
  });

  it('deals no bonus above the threshold', () => {
    const combat = createCombat(makeRun('witch', ['bloodfang']), makeEnemy(100));
    runFor(combat, 3.7);
    expect(combat.e.hp).toBe(94);
  });
});

describe('ramp', () => {
  it('permanently gains damage each time it fires', () => {
    // Silvered Bone: every 4.2s deal 6 damage, +3 per fire → 6, 9, 12.
    const combat = createCombat(makeRun('witch', ['silverbone']), makeEnemy(140));
    runFor(combat, 13);
    expect(combat.e.hp).toBe(140 - (6 + 9 + 12));
  });
});

describe('multistrike', () => {
  it('fires all hits in a single trigger', () => {
    // Swarm of Bats: every 4.0s deal 3 × 3 hits.
    const combat = createCombat(makeRun('witch', ['bats']), makeEnemy(140));
    runFor(combat, 4.1);
    expect(combat.e.hp).toBe(131);
  });
});

describe('thorns', () => {
  it('reflects damage to attackers on direct hits', () => {
    // Molten Plating grants thorns 4; Iron Claws strikes at 2.4s.
    const combat = createCombat(makeRun('witch', ['claws']), makeEnemy(140, [['moltenplate', 0]]));
    runFor(combat, 2.5);
    expect(combat.p.hp).toBe(combat.p.maxHp - 4);
  });
});

describe('coin bomb', () => {
  it('scales damage with gold held at battle start', () => {
    // Coin Bomb: every 5.0s deal 6 damage, +1 per 3 gold.
    const run = makeRun('witch', ['coinbomb']);
    run.gold = 30;
    const combat = createCombat(run, makeEnemy(140));
    runFor(combat, 5.1);
    expect(combat.e.hp).toBe(140 - 16);
  });

  it('the Goblin scales gold-wares harder (+1 per 2 gold)', () => {
    const run = makeRun('goblin', ['coinbomb']);
    run.gold = 30;
    const combat = createCombat(run, makeEnemy(140));
    runFor(combat, 5.1);
    expect(combat.e.hp).toBe(140 - (6 + 15));
  });
});

describe('damage-over-time identity', () => {
  it('burn ticks twice a second and smoulders out (decays 1/sec)', () => {
    const combat = createCombat(makeRun('witch', []), makeEnemy(140));
    combat.e.burn = 4;
    runFor(combat, 2.2);
    // Decays 1/sec → ~2 gone after ~2s; two ticks/sec means it front-loads damage.
    expect(combat.e.burn).toBe(2);
    expect(140 - combat.e.hp).toBeGreaterThanOrEqual(12);
  });

  it('poison never decays, rewarding long fights', () => {
    const combat = createCombat(makeRun('witch', []), makeEnemy(140));
    combat.e.poison = 3;
    runFor(combat, 3.05);
    expect(combat.e.poison).toBe(3);
    expect(combat.e.hp).toBe(140 - 9);
  });

  it('curse amplifies burn & poison ticks (curse ↔ DoT synergy)', () => {
    const combat = createCombat(makeRun('witch', []), makeEnemy(140));
    combat.e.poison = 4;
    combat.e.curse = 10;
    runFor(combat, 1.05);
    // round(4 × 1.5) = 6
    expect(combat.e.hp).toBe(134);
  });
});

describe('tempo tier scaling', () => {
  it('haste gains a gentle additive bonus per tier', () => {
    expect(itemStats(createItemInstance('packtotem', 2)).haste).toBeCloseTo(1.8);
  });

  it('curse gains +1s per tier', () => {
    expect(itemStats(createItemInstance('cursedoll', 2)).curse).toBe(5);
  });
});

describe('regen', () => {
  it('heals the bearer every second', () => {
    const combat = createCombat(makeRun('witch', []), makeEnemy(140, [], 3));
    combat.e.hp = 100;
    runFor(combat, 3.1);
    expect(combat.e.hp).toBe(109);
  });
});

describe('hero passives', () => {
  it('griffin grants bonus crit chance via item stats', () => {
    const run = makeRun('griffin', ['talon']);
    const combat = createCombat(run, makeEnemy(140));
    expect(combat.p.items[0].st.crit).toBeCloseTo(0.2);
  });

  it('vampire boosts lifesteal fraction', () => {
    const run = makeRun('vampire', ['chalice']);
    const combat = createCombat(run, makeEnemy(140));
    expect(combat.p.items[0].st.life).toBeCloseTo(0.75);
  });

  it('queen boosts shields and damage', () => {
    const run = makeRun('queen', ['lanternguard']);
    const combat = createCombat(run, makeEnemy(140));
    expect(combat.p.items[0].st.shield).toBe(12); // 9 × 1.3 rounded
    expect(combat.p.items[0].st.dmg).toBe(3); // 3 × 1.1 rounded
  });
});

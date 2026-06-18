import { describe, expect, it } from 'vitest';
import { HERO_BY_ID } from '@/data/heroes';
import type { EnemyMeta, RunState, Tier } from '@/game/types';
import { createCombat, getBattleReportTracker, tickCombat, type CombatEvent } from '@/game/combat';
import { createItemInstance, createRun } from '@/game/run-state';
import { itemStats, statsWithAdjacency } from '@/game/economy';

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
  it('scales damage with gold spent this night', () => {
    // Coin Bomb: every 5.0s deal 6 damage, +1 per 3 gold spent this night.
    const run = makeRun('witch', ['coinbomb']);
    run.goldSpentThisNight = 30;
    const combat = createCombat(run, makeEnemy(140));
    runFor(combat, 5.1);
    expect(combat.e.hp).toBe(140 - 16);
  });

  it('the Goblin scales gold-wares harder (+1 per 2 gold spent)', () => {
    const run = makeRun('goblin', ['coinbomb']);
    run.goldSpentThisNight = 30;
    const combat = createCombat(run, makeEnemy(140));
    runFor(combat, 5.1);
    expect(combat.e.hp).toBe(140 - (6 + 15));
  });
});

describe('damage-over-time identity', () => {
  it('burn ticks twice a second and smoulders out via percentage decay', () => {
    const combat = createCombat(makeRun('witch', []), makeEnemy(140));
    combat.e.burn = 4;
    runFor(combat, 2.2);
    // BURN_DECAY 0.4: 4 → 2 (−round(1.6)=2) at 1s, → 1 (−max(1,round(0.8)=1)) at 2s.
    // The stack smoulders out fast (ends at 1) instead of the old flat −1/sec tail.
    expect(combat.e.burn).toBe(1);
    // Front-loaded burst: high early ticks, quickly fading (totals 9 over ~2.2s).
    expect(140 - combat.e.hp).toBe(9);
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
    // round(4 × 1.3) = 5
    expect(combat.e.hp).toBe(135);
  });

  it('shield soaks up to half of an elemental tick, the rest hits HP', () => {
    const combat = createCombat(makeRun('witch', []), makeEnemy(140));
    combat.e.poison = 4;
    combat.e.shield = 50;
    runFor(combat, 1.05);
    // floor(4 × 0.5) = 2 soaked from shield, 2 bleeds to HP.
    expect(combat.e.shield).toBe(48);
    expect(combat.e.hp).toBe(138);
  });

  it('the Vampire heals from the burn & poison his foes suffer', () => {
    const run = makeRun('vampire', []);
    const combat = createCombat(run, makeEnemy(140));
    combat.p.hp = 50;
    combat.e.poison = 10;
    runFor(combat, 1.05);
    // Foe takes 10 poison; Vampire dotLifesteal 0.3 → heals round(10 × 0.3) = 3.
    expect(combat.e.hp).toBe(130);
    expect(combat.p.hp).toBe(53);
  });
});

describe('consume (detonate)', () => {
  it('deals damage equal to the foe’s poison, then clears it', () => {
    // Plague Jar: every 5.0s deal 6, then detonate the foe's poison (12).
    const combat = createCombat(makeRun('witch', ['plaguejar']), makeEnemy(400));
    const uid = combat.p.items[0].it.uid;
    combat.e.poison = 12;
    runFor(combat, 5.1);
    expect(combat.e.poison).toBe(0);
    // First trigger: 6 direct + 12 detonate = 18 attributed to Plague Jar.
    const row = getBattleReportTracker(combat)!.rows.p.get(uid)!;
    expect(row.damage).toBe(18);
  });

  it('the Vampire’s detonate also heals via DoT lifesteal', () => {
    // Nocturne Bell: every 5.0s deal 4, detonate poison, Vampire heals from it.
    const run = makeRun('vampire', ['nocturnebell']);
    const combat = createCombat(run, makeEnemy(400));
    combat.p.hp = 50;
    combat.e.poison = 20;
    runFor(combat, 5.1);
    // Detonate deals 20; Vampire dotLifesteal 0.3 → heals round(20 × 0.3) = 6 from it
    // (plus heals from the per-second poison ticks too, so just assert it gained HP).
    expect(combat.p.hp).toBeGreaterThan(50);
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

describe('adjacency synergies', () => {
  // The Witch has no damage multiplier, so base values stay clean:
  // Iron Claws = 5, Gorge Fang = 6, Rending Maw = 4.
  const dmgOf = (combat: ReturnType<typeof createCombat>, defId: string): number =>
    combat.p.items.find((ci) => ci.it.defId === defId)!.st.dmg ?? 0;

  it('an aura ware buffs a neighbour’s damage', () => {
    // Pack Brand (aura +2 dmg) sits left of Iron Claws (5) → 7.
    const combat = createCombat(makeRun('witch', ['packbrand', 'claws']), makeEnemy(140));
    expect(dmgOf(combat, 'claws')).toBe(7);
  });

  it('a passive (cd 0) ware still counts as an aura source', () => {
    // Pickpocket Rig never fires but its aura grants the neighbour +1 dmg.
    const combat = createCombat(makeRun('witch', ['pickpocket', 'claws']), makeEnemy(140));
    expect(dmgOf(combat, 'claws')).toBe(6);
  });

  it('a self+needTag ware only triggers beside the required tag', () => {
    // Gorge Fang: +3 ramp beside a Damage ware (base ramp 2 → 5).
    const rampOf = (combat: ReturnType<typeof createCombat>, defId: string): number =>
      combat.p.items.find((ci) => ci.it.defId === defId)!.st.ramp;
    const beside = createCombat(makeRun('witch', ['gorgefang', 'claws']), makeEnemy(140));
    expect(rampOf(beside, 'gorgefang')).toBe(5);

    // Sporecap is Poison, not Damage → no bonus.
    const apart = createCombat(makeRun('witch', ['gorgefang', 'sporecap']), makeEnemy(140));
    expect(rampOf(apart, 'gorgefang')).toBe(2);
  });

  it('an aura can grant ramp to Damage neighbours (Alpha Howl — the pack grows)', () => {
    const rampOf = (combat: ReturnType<typeof createCombat>, defId: string): number =>
      combat.p.items.find((ci) => ci.it.defId === defId)!.st.ramp;
    // Alpha Howl (aura +2 ramp to Damage) beside Silvered Bone (base ramp 3) → 5.
    const combat = createCombat(makeRun('witch', ['alphahowl', 'silverbone']), makeEnemy(140));
    expect(rampOf(combat, 'silverbone')).toBe(5);
  });

  it('a perTag self scales with each matching neighbour (Echo Crystal go-wide)', () => {
    // Echo Crystal: +4 dmg per adjacent Damage ware (base 8).
    const one = createCombat(makeRun('witch', ['echocrystal', 'claws']), makeEnemy(140));
    expect(dmgOf(one, 'echocrystal')).toBe(12);
    const two = createCombat(makeRun('witch', ['claws', 'echocrystal', 'claws']), makeEnemy(140));
    expect(dmgOf(two, 'echocrystal')).toBe(16);
  });

  it('a curse-granting adjacency lengthens the curse applied (Evil Eye)', () => {
    // Evil Eye: base curse 2s, +2s beside a Poison ware → 4s.
    const curseOf = (combat: ReturnType<typeof createCombat>, defId: string): number =>
      combat.p.items.find((ci) => ci.it.defId === defId)!.st.curse ?? 0;
    const beside = createCombat(makeRun('witch', ['evileye', 'cauldron']), makeEnemy(140));
    expect(curseOf(beside, 'evileye')).toBe(4);
    const apart = createCombat(makeRun('witch', ['evileye', 'claws']), makeEnemy(140));
    expect(curseOf(apart, 'evileye')).toBe(2);
  });

  it('a flanked ware needs both sides occupied', () => {
    // Rending Maw: +4 dmg when flanked (base 4).
    const flanked = createCombat(makeRun('witch', ['claws', 'rendingmaw', 'claws']), makeEnemy(140));
    expect(dmgOf(flanked, 'rendingmaw')).toBe(8);

    const edge = createCombat(makeRun('witch', ['rendingmaw', 'claws']), makeEnemy(140));
    expect(dmgOf(edge, 'rendingmaw')).toBe(4);
  });

  it('resolves for the enemy side too', () => {
    // Enemy wares carry no hero, so Iron Claws stays 5; Pack Brand aura → 7.
    const combat = createCombat(makeRun('witch', []), makeEnemy(140, [['packbrand', 0], ['claws', 0]]));
    expect(combat.e.items.find((ci) => ci.it.defId === 'claws')!.st.dmg).toBe(7);
  });

  it('statsWithAdjacency previews the same boosted numbers the sheet shows', () => {
    const run = makeRun('witch', ['packbrand', 'claws']);
    // Claws (index 1) sits beside Pack Brand's +2 dmg aura → 5 + 2 = 7.
    expect(statsWithAdjacency(run.board, 1, run.hero).dmg).toBe(7);
    // Pack Brand itself (index 0) is unbuffed here.
    expect(statsWithAdjacency(run.board, 0, run.hero).dmg).toBe(itemStats(run.board[0], run.hero).dmg);
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
    // Crimson Chalice base lifesteal 0.55 × 1.5 = 0.825.
    expect(combat.p.items[0].st.life).toBeCloseTo(0.825);
  });

  it('queen boosts shields and damage', () => {
    const run = makeRun('queen', ['lanternguard']);
    const combat = createCombat(run, makeEnemy(140));
    expect(combat.p.items[0].st.shield).toBe(12); // 9 × 1.3 rounded
    expect(combat.p.items[0].st.dmg).toBe(3); // 3 × 1.1 rounded
  });
});

import { COMBAT_SUDDEN_DEATH_AT } from '@/config/constants';
import type {
  CombatItem,
  CombatSide,
  CombatState,
  EnemyMeta,
  HeroDef,
  ItemInstance,
  RunState,
} from '@/game/types';
import { getItemDef, itemStats } from '@/game/economy';
import { weaponRampMult, arcaneSlowDamage } from '@/game/hero-passives';

export type CombatEvent =
  | { type: 'damage'; side: 'p' | 'e'; amount: number; crit: boolean }
  | { type: 'raw'; side: 'p' | 'e'; amount: number; kind: 'burn' | 'poison' | 'thorns' | 'sudden' }
  | { type: 'heal'; side: 'p' | 'e'; amount: number }
  | { type: 'shield'; side: 'p' | 'e'; amount: number }
  | { type: 'burn'; side: 'p' | 'e'; amount: number }
  | { type: 'poison'; side: 'p' | 'e'; amount: number }
  | { type: 'curse'; side: 'p' | 'e'; duration: number }
  | { type: 'haste'; side: 'p' | 'e' }
  | { type: 'slow'; side: 'p' | 'e' }
  | { type: 'trigger'; side: 'p' | 'e'; itemUid: number; crit?: boolean }
  | { type: 'log'; message: string }
  | { type: 'sudden_death'; damage: number }
  | { type: 'end'; won: boolean };

function mkSide(
  hp: number,
  board: ItemInstance[],
  isPlayer: boolean,
  hero?: HeroDef,
  regen = 0,
): CombatSide {
  const items = board
    .filter((it) => getItemDef(it).cd > 0)
    .map((it) => ({
      it,
      st: itemStats(it, hero),
      t: 0,
      rampBonus: 0,
      el: null,
    }));

  return {
    hp,
    maxHp: hp,
    shield: 0,
    burn: 0,
    poison: 0,
    curse: 0,
    thorns: items.reduce((acc, ci) => acc + ci.st.thorns, 0),
    regen,
    isPlayer,
    hero,
    burnT: 0,
    poisonT: 0,
    regenT: 0,
    items,
  };
}

export function createCombat(run: RunState, enemy: EnemyMeta): CombatState {
  return {
    t: 0,
    over: false,
    sudden: false,
    sdT: 0,
    goldAtStart: run.gold,
    p: mkSide(run.maxHp, run.board, true, run.hero),
    e: mkSide(enemy.hp, enemy.board, false, undefined, enemy.regen ?? 0),
    enemyMeta: enemy,
  };
}

export function resolveBattle(combat: CombatState): boolean {
  if (combat.e.hp <= 0 && combat.p.hp > 0) return true;
  if (combat.p.hp <= 0 && combat.e.hp > 0) return false;
  return combat.p.hp >= combat.e.hp;
}

function dealDamage(
  side: CombatSide,
  amt: number,
  events: CombatEvent[],
  key: 'p' | 'e',
  crit: boolean,
  pierce = false,
): number {
  let left = amt;
  if (!pierce && side.shield > 0) {
    const absorbed = Math.min(side.shield, left);
    side.shield -= absorbed;
    left -= absorbed;
    if (absorbed > 0) events.push({ type: 'shield', side: key, amount: -absorbed });
  }
  if (left > 0) {
    side.hp -= left;
    events.push({ type: 'damage', side: key, amount: left, crit });
  }
  return left;
}

/** Heals are halved while the side is cursed. */
function healSide(side: CombatSide, amt: number, events: CombatEvent[], key: 'p' | 'e'): number {
  if (side.curse > 0) amt = Math.round(amt / 2);
  const before = side.hp;
  side.hp = Math.min(side.maxHp, side.hp + amt);
  const got = Math.round(side.hp - before);
  if (got > 0) events.push({ type: 'heal', side: key, amount: got });
  return got;
}

function gainShield(side: CombatSide, amt: number, events: CombatEvent[], key: 'p' | 'e'): void {
  if (side.curse > 0) amt = Math.round(amt / 2);
  if (amt <= 0) return;
  side.shield += amt;
  events.push({ type: 'shield', side: key, amount: amt });
}

function trigger(
  combat: CombatState,
  side: CombatSide,
  foe: CombatSide,
  ci: CombatItem,
  events: CombatEvent[],
  sideKey: 'p' | 'e',
  foeKey: 'p' | 'e',
): void {
  const st = ci.st;
  const def = getItemDef(ci.it);
  events.push({ type: 'trigger', side: sideKey, itemUid: ci.it.uid });
  const triggerIdx = events.length - 1;

  if (st.dmg) {
    let anyCrit = false;

    for (let hit = 0; hit < st.hits; hit++) {
      let dmg = st.dmg + ci.rampBonus;
      if (st.goldScale && side.isPlayer) dmg += Math.floor(combat.goldAtStart / 3);
      dmg *= weaponRampMult(side.hero, combat.t);
      // Execute bonus applies once per trigger, on the first hit.
      if (st.execute && hit === 0 && foe.hp / foe.maxHp < 0.3) dmg += st.execute;

      let crit = false;
      if (st.crit && Math.random() < st.crit) {
        dmg *= 2;
        crit = true;
        anyCrit = true;
      }
      dmg = Math.round(dmg);

      const dealt = dealDamage(foe, dmg, events, foeKey, crit, st.pierce);
      if (st.life && dealt > 0) healSide(side, Math.round(dealt * st.life), events, sideKey);

      if (foe.thorns > 0) {
        side.hp -= foe.thorns;
        events.push({ type: 'raw', side: sideKey, amount: foe.thorns, kind: 'thorns' });
      }
    }

    if (st.ramp) ci.rampBonus += st.ramp;
    if (anyCrit) {
      events[triggerIdx] = { type: 'trigger', side: sideKey, itemUid: ci.it.uid, crit: true };
      events.push({ type: 'log', message: `${def.nm} strikes true!` });
    }
  }

  if (st.burn) {
    foe.burn += st.burn;
    events.push({ type: 'burn', side: foeKey, amount: st.burn });
  }
  if (st.poison) {
    foe.poison += st.poison;
    events.push({ type: 'poison', side: foeKey, amount: st.poison });
  }
  if (st.shield) gainShield(side, st.shield, events, sideKey);
  if (st.heal) healSide(side, st.heal, events, sideKey);
  if (st.cleanse) {
    side.burn = 0;
    side.poison = 0;
  }
  if (st.curse) {
    foe.curse = Math.max(foe.curse, st.curse);
    events.push({ type: 'curse', side: foeKey, duration: st.curse });
    events.push({ type: 'log', message: `${def.nm} lays a curse — heals & shields falter!` });
  }
  if (st.haste) {
    for (const o of side.items) {
      if (o !== ci) o.t = Math.min(o.st.cd, o.t + (st.haste ?? 0));
    }
    events.push({ type: 'haste', side: sideKey });
  }
  if (st.slow) {
    for (const o of foe.items) {
      o.t = Math.max(0, o.t - (st.slow ?? 0));
    }
    events.push({ type: 'slow', side: foeKey });

    const arcane = arcaneSlowDamage(side.hero, st.slow);
    if (arcane > 0) dealDamage(foe, arcane, events, foeKey, false);
  }
}

export function tickCombat(combat: CombatState, dt: number): CombatEvent[] {
  if (combat.over) return [];

  const events: CombatEvent[] = [];
  combat.t += dt;

  for (const side of [combat.p, combat.e] as const) {
    const foe = side === combat.p ? combat.e : combat.p;
    const sideKey = side === combat.p ? 'p' : 'e';
    const foeKey = side === combat.p ? 'e' : 'p';

    for (const ci of side.items) {
      ci.t += dt;
      if (ci.t >= ci.st.cd) {
        ci.t -= ci.st.cd;
        trigger(combat, side, foe, ci, events, sideKey, foeKey);
      }
    }

    side.curse = Math.max(0, side.curse - dt);

    side.burnT += dt;
    if (side.burnT >= 0.5) {
      side.burnT -= 0.5;
      if (side.burn > 0) {
        side.hp -= side.burn;
        events.push({ type: 'raw', side: sideKey, amount: side.burn, kind: 'burn' });
        side.burn = Math.max(0, side.burn - 1);
      }
    }

    side.poisonT += dt;
    if (side.poisonT >= 1) {
      side.poisonT -= 1;
      if (side.poison > 0) {
        side.hp -= side.poison;
        events.push({ type: 'raw', side: sideKey, amount: side.poison, kind: 'poison' });
      }
    }

    if (side.regen > 0) {
      side.regenT += dt;
      if (side.regenT >= 1) {
        side.regenT -= 1;
        healSide(side, side.regen, events, sideKey);
      }
    }
  }

  if (combat.t > COMBAT_SUDDEN_DEATH_AT) {
    if (!combat.sudden) combat.sudden = true;
    combat.sdT += dt;
    if (combat.sdT >= 1) {
      combat.sdT -= 1;
      const d = Math.ceil(combat.t - COMBAT_SUDDEN_DEATH_AT);
      combat.p.hp -= d;
      combat.e.hp -= d;
      events.push({ type: 'sudden_death', damage: d });
      events.push({
        type: 'log',
        message: `The lanterns gutter — the night itself bites for ${d}!`,
      });
    }
  }

  if (combat.p.hp <= 0 || combat.e.hp <= 0) {
    combat.over = true;
    events.push({ type: 'end', won: resolveBattle(combat) });
  }

  return events;
}

export function findCombatItem(combat: CombatState, uid: number): ItemInstance | null {
  for (const side of [combat.p, combat.e]) {
    const found = side.items.find((ci) => ci.it.uid === uid);
    if (found) return found.it;
  }
  return null;
}

import { COMBAT_SUDDEN_DEATH_AT } from '@/config/constants';
import type {
  CombatItem,
  CombatSide,
  CombatState,
  EnemyMeta,
  ItemInstance,
  RunState,
} from '@/game/types';
import { getItemDef, itemStats, battleBoard } from '@/game/economy';

export type CombatEvent =
  | { type: 'damage'; side: 'p' | 'e'; amount: number; crit: boolean }
  | { type: 'raw'; side: 'p' | 'e'; amount: number; kind: 'burn' | 'poison' | 'sudden' }
  | { type: 'heal'; side: 'p' | 'e'; amount: number }
  | { type: 'shield'; side: 'p' | 'e'; amount: number }
  | { type: 'burn'; side: 'p' | 'e'; amount: number }
  | { type: 'poison'; side: 'p' | 'e'; amount: number }
  | { type: 'haste'; side: 'p' | 'e' }
  | { type: 'slow'; side: 'p' | 'e' }
  | { type: 'trigger'; side: 'p' | 'e'; itemUid: number; crit?: boolean }
  | { type: 'log'; message: string }
  | { type: 'sudden_death'; damage: number }
  | { type: 'end'; won: boolean };

function mkSide(hp: number, board: ItemInstance[], isPlayer: boolean, hero?: RunState['hero']): CombatSide {
  return {
    hp,
    maxHp: hp,
    shield: 0,
    burn: 0,
    poison: 0,
    isPlayer,
    burnT: 0,
    poisonT: 0,
    items: board
      .filter((it) => getItemDef(it).cd > 0)
      .map((it) => ({
        it,
        st: itemStats(it, isPlayer ? hero : undefined),
        t: 0,
        el: null,
      })),
  };
}

export function createCombat(run: RunState, enemy: EnemyMeta): CombatState {
  return {
    t: 0,
    over: false,
    sudden: false,
    sdT: 0,
    p: mkSide(run.maxHp, battleBoard(run.board), true, run.hero),
    e: mkSide(enemy.hp, enemy.board, false),
    enemyMeta: enemy,
  };
}

export function resolveBattle(combat: CombatState): boolean {
  if (combat.e.hp <= 0 && combat.p.hp > 0) return true;
  if (combat.p.hp <= 0 && combat.e.hp > 0) return false;
  return combat.p.hp >= combat.e.hp;
}

function dealDamage(side: CombatSide, amt: number, events: CombatEvent[], key: 'p' | 'e', crit: boolean): number {
  let left = amt;
  if (side.shield > 0) {
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

function healSide(side: CombatSide, amt: number, events: CombatEvent[], key: 'p' | 'e'): number {
  const before = side.hp;
  side.hp = Math.min(side.maxHp, side.hp + amt);
  const got = Math.round(side.hp - before);
  if (got > 0) events.push({ type: 'heal', side: key, amount: got });
  return got;
}

function trigger(
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

  if (st.dmg) {
    let dmg = st.dmg;
    let crit = false;
    if (def.crit && Math.random() < def.crit) {
      dmg *= 2;
      crit = true;
    }
    events[events.length - 1] = { type: 'trigger', side: sideKey, itemUid: ci.it.uid, crit };
    const dealt = dealDamage(foe, dmg, events, foeKey, crit);
    if (def.life) healSide(side, Math.round(dealt * def.life), events, sideKey);
    if (crit) events.push({ type: 'log', message: `${def.nm} strikes true — ${dmg}!` });
  }

  if (st.burn) {
    foe.burn += st.burn;
    events.push({ type: 'burn', side: foeKey, amount: st.burn });
  }
  if (st.poison) {
    foe.poison += st.poison;
    events.push({ type: 'poison', side: foeKey, amount: st.poison });
  }
  if (st.shield) {
    side.shield += st.shield;
    events.push({ type: 'shield', side: sideKey, amount: st.shield });
  }
  if (st.heal) healSide(side, st.heal, events, sideKey);
  if (st.cleanse) {
    side.burn = 0;
    side.poison = 0;
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
        trigger(side, foe, ci, events, sideKey, foeKey);
      }
    }

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

import {
  BURN_DECAY,
  COMBAT_SUDDEN_DEATH_AT,
  CURSE_DOT_MULT,
  ELEMENTAL_SHIELD_SOAK,
} from '@/config/constants';
import { BattleReportTracker } from '@/game/battle-report';
import type {
  CombatItem,
  CombatSide,
  CombatState,
  EnemyMeta,
  HeroDef,
  ItemInstance,
  RunState,
} from '@/game/types';
import { applyAdjBonus, getItemDef, itemStats } from '@/game/economy';
import { weaponRampMult, arcaneSlowDamage } from '@/game/hero-passives';

const reportTrackers = new WeakMap<CombatState, BattleReportTracker>();

export function getBattleReportTracker(combat: CombatState): BattleReportTracker | undefined {
  return reportTrackers.get(combat);
}

export function finalizeBattleReport(combat: CombatState): void {
  const tracker = reportTrackers.get(combat);
  if (tracker) combat.report = tracker.finalize(combat);
}

export type CombatEvent =
  | { type: 'damage'; side: 'p' | 'e'; amount: number; crit: boolean }
  | { type: 'raw'; side: 'p' | 'e'; amount: number; kind: 'burn' | 'poison' | 'thorns' }
  | { type: 'heal'; side: 'p' | 'e'; amount: number }
  | { type: 'shield'; side: 'p' | 'e'; amount: number }
  | { type: 'burn'; side: 'p' | 'e'; amount: number }
  | { type: 'poison'; side: 'p' | 'e'; amount: number }
  | { type: 'curse'; side: 'p' | 'e'; duration: number }
  | { type: 'haste'; side: 'p' | 'e' }
  | { type: 'slow'; side: 'p' | 'e' }
  | { type: 'trigger'; side: 'p' | 'e'; itemUid: number; crit?: boolean }
  | { type: 'log'; message: string }
  | { type: 'enrage'; side: 'p' | 'e' }
  | { type: 'shieldwall'; side: 'p' | 'e' }
  | { type: 'sudden_death'; damage: number }
  | { type: 'end'; won: boolean };

/**
 * Resolve bespoke adjacency synergies from stall (board) order, baking the
 * bonuses into each ware's combat stats. Passive (cd===0) wares have no
 * CombatItem but still count as neighbours (aura sources / condition targets).
 */
function applyAdjacency(board: ItemInstance[], items: CombatItem[]): void {
  if (board.length < 2) return;
  const byUid = new Map<number, CombatItem>();
  for (const ci of items) byUid.set(ci.it.uid, ci);
  const defs = board.map((it) => getItemDef(it));
  const tagsAt = (j: number): readonly string[] | null =>
    j >= 0 && j < board.length ? defs[j].tags : null;

  for (let i = 0; i < board.length; i++) {
    const adj = defs[i].adj;
    if (!adj) continue;
    const lt = tagsAt(i - 1);
    const rt = tagsAt(i + 1);

    if (adj.mode === 'aura') {
      for (const j of [i - 1, i + 1]) {
        if (j < 0 || j >= board.length) continue;
        if (adj.targetTag && !defs[j].tags.includes(adj.targetTag)) continue;
        const ci = byUid.get(board[j].uid);
        if (ci) applyAdjBonus(ci.st, adj.add, adj.cdMult);
      }
      continue;
    }

    const self = byUid.get(board[i].uid);
    if (!self) continue;
    let mult = 1;
    if (adj.perTag) {
      mult = (lt?.includes(adj.perTag) ? 1 : 0) + (rt?.includes(adj.perTag) ? 1 : 0);
      if (mult === 0) continue;
    } else if (adj.flanked) {
      if (!(lt && rt)) continue;
    } else if (adj.needTag) {
      if (!(lt?.includes(adj.needTag) || rt?.includes(adj.needTag))) continue;
    }
    applyAdjBonus(self.st, adj.add, adj.cdMult, mult);
  }
}

function mkSide(
  hp: number,
  board: ItemInstance[],
  isPlayer: boolean,
  hero?: HeroDef,
  regen = 0,
  gimmick?: import('@/game/types').BossGimmick,
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

  applyAdjacency(board, items);

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
    gimmick,
    gimmickT: 0,
    enraged: false,
    items,
  };
}

export function createCombat(run: RunState, enemy: EnemyMeta): CombatState {
  const combat: CombatState = {
    t: 0,
    over: false,
    sudden: false,
    sdT: 0,
    goldSpent: run.goldSpentThisNight,
    p: mkSide(run.maxHp, run.board, true, run.hero),
    e: mkSide(enemy.hp, enemy.board, false, undefined, enemy.regen ?? 0, enemy.gimmick),
    enemyMeta: enemy,
  };
  reportTrackers.set(combat, new BattleReportTracker(combat));
  return combat;
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
  if (!pierce && side.gimmick?.kind === 'ward') {
    left = Math.max(1, Math.round(left * (1 - side.gimmick.pct)));
  }
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

/**
 * Resolve one burn/poison tick on `side`. Shields blunt elemental damage
 * (soaking up to ELEMENTAL_SHIELD_SOAK of the tick), and any hero on the
 * attacking side with `dotLifesteal` heals from the damage that lands.
 */
function dotTick(
  side: CombatSide,
  foe: CombatSide,
  base: number,
  kind: 'burn' | 'poison',
  events: CombatEvent[],
  sideKey: 'p' | 'e',
  foeKey: 'p' | 'e',
  tracker: BattleReportTracker | undefined,
): void {
  let dmg = side.curse > 0 ? Math.round(base * CURSE_DOT_MULT) : base;

  if (side.shield > 0) {
    const absorbed = Math.min(side.shield, Math.floor(dmg * ELEMENTAL_SHIELD_SOAK));
    if (absorbed > 0) {
      side.shield -= absorbed;
      dmg -= absorbed;
      events.push({ type: 'shield', side: sideKey, amount: -absorbed });
    }
  }

  if (dmg <= 0) return;

  side.hp -= dmg;
  events.push({ type: 'raw', side: sideKey, amount: dmg, kind });
  tracker?.recordDotTick(foeKey, kind, dmg);

  if (foe.hero?.dotLifesteal && foe.hp > 0) {
    healSide(foe, Math.round(dmg * foe.hero.dotLifesteal), events, foeKey);
  }
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
  const tracker = reportTrackers.get(combat);
  const uid = ci.it.uid;
  events.push({ type: 'trigger', side: sideKey, itemUid: uid });
  tracker?.recordTrigger(sideKey, uid);
  const triggerIdx = events.length - 1;

  if (st.dmg) {
    let anyCrit = false;

    for (let hit = 0; hit < st.hits; hit++) {
      let dmg = st.dmg + ci.rampBonus;
      if (st.goldScale && side.isPlayer) {
        dmg += Math.floor(combat.goldSpent / (side.hero?.goldScaleDiv ?? 3));
      }
      dmg *= weaponRampMult(side.hero, combat.t);
      if (st.execute && hit === 0 && foe.hp / foe.maxHp < 0.3) dmg += st.execute;
      if (side.gimmick?.kind === 'enrage' && side.hp / side.maxHp < side.gimmick.at) {
        dmg *= side.gimmick.mult;
      }

      let crit = false;
      if (st.crit && Math.random() < st.crit) {
        dmg *= 2;
        crit = true;
        anyCrit = true;
      }
      dmg = Math.round(dmg);

      const dealt = dealDamage(foe, dmg, events, foeKey, crit, st.pierce);
      if (dealt > 0) tracker?.recordDamage(sideKey, uid, dealt);
      if (st.life && dealt > 0) {
        const healed = healSide(side, Math.round(dealt * st.life), events, sideKey);
        if (healed > 0) tracker?.recordHeal(sideKey, uid, healed);
      }

      if (foe.thorns > 0) {
        side.hp -= foe.thorns;
        events.push({ type: 'raw', side: sideKey, amount: foe.thorns, kind: 'thorns' });
        tracker?.recordThorns(foeKey, foe, foe.thorns);
      }
    }

    if (st.ramp) ci.rampBonus += st.ramp;
    if (anyCrit) {
      events[triggerIdx] = { type: 'trigger', side: sideKey, itemUid: uid, crit: true };
      events.push({ type: 'log', message: `${def.nm} strikes true!` });
    }
  }

  if (def.consume) {
    const stock = def.consume === 'burn' ? foe.burn : foe.poison;
    if (stock > 0) {
      if (def.consume === 'burn') foe.burn = 0;
      else foe.poison = 0;
      const dealt = dealDamage(foe, Math.round(stock), events, foeKey, false);
      if (dealt > 0) {
        tracker?.recordDamage(sideKey, uid, dealt);
        if (side.hero?.dotLifesteal && side.hp > 0) {
          healSide(side, Math.round(dealt * side.hero.dotLifesteal), events, sideKey);
        }
      }
    }
  }

  if (st.burn) {
    foe.burn += st.burn;
    events.push({ type: 'burn', side: foeKey, amount: st.burn });
    tracker?.recordBurnApplied(sideKey, uid, st.burn);
  }
  if (st.poison) {
    foe.poison += st.poison;
    events.push({ type: 'poison', side: foeKey, amount: st.poison });
    tracker?.recordPoisonApplied(sideKey, uid, st.poison);
  }
  if (st.shield) {
    const before = side.shield;
    gainShield(side, st.shield, events, sideKey);
    tracker?.recordShield(sideKey, uid, side.shield - before);
  }
  if (st.heal) {
    const healed = healSide(side, st.heal, events, sideKey);
    if (healed > 0) tracker?.recordHeal(sideKey, uid, healed);
  }
  if (st.cleanse) {
    side.burn = 0;
    side.poison = 0;
  }
  if (st.curse) {
    foe.curse = Math.max(foe.curse, st.curse);
    events.push({ type: 'curse', side: foeKey, duration: st.curse });
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
    if (arcane > 0) {
      const dealt = dealDamage(foe, arcane, events, foeKey, false);
      if (dealt > 0) tracker?.recordDamage(sideKey, uid, dealt);
    }
  }
}

export function tickCombat(combat: CombatState, dt: number): CombatEvent[] {
  if (combat.over) return [];

  const events: CombatEvent[] = [];
  const tracker = reportTrackers.get(combat);
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

    // Burn is a front-loaded burst: it ticks fast (every 0.5s) but smoulders out,
    // decaying a percentage of its stack each second so high stacks fade fast.
    side.burnT += dt;
    if (side.burnT >= 0.5) {
      side.burnT -= 0.5;
      if (side.burn > 0) {
        dotTick(side, foe, side.burn, 'burn', events, sideKey, foeKey, tracker);
      }
    }

    // Poison is the long game: it never decays, so its total damage ramps the
    // longer the fight drags on (tamed by lower base values + the shield soak).
    side.poisonT += dt;
    if (side.poisonT >= 1) {
      side.poisonT -= 1;
      if (side.poison > 0) {
        dotTick(side, foe, side.poison, 'poison', events, sideKey, foeKey, tracker);
      }
      if (side.burn > 0) {
        side.burn = Math.max(0, side.burn - Math.max(1, Math.round(side.burn * BURN_DECAY)));
      }
    }

    if (side.regen > 0) {
      side.regenT += dt;
      if (side.regenT >= 1) {
        side.regenT -= 1;
        healSide(side, side.regen, events, sideKey);
      }
    }

    if (side.gimmick?.kind === 'shieldwall' && side.hp > 0) {
      side.gimmickT += dt;
      if (side.gimmickT >= side.gimmick.every) {
        side.gimmickT -= side.gimmick.every;
        gainShield(side, side.gimmick.amount, events, sideKey);
        events.push({ type: 'shieldwall', side: sideKey });
      }
    }

    if (
      side.gimmick?.kind === 'enrage' &&
      !side.enraged &&
      side.hp > 0 &&
      side.hp / side.maxHp < side.gimmick.at
    ) {
      side.enraged = true;
      events.push({ type: 'enrage', side: sideKey });
      events.push({ type: 'log', message: side.gimmick.label ?? 'The fiend enrages!' });
    }
  }

  if (combat.t > COMBAT_SUDDEN_DEATH_AT) {
    if (!combat.sudden) {
      combat.sudden = true;
      events.push({ type: 'log', message: 'The lanterns gutter — sudden death!' });
    }
    combat.sdT += dt;
    if (combat.sdT >= 1) {
      combat.sdT -= 1;
      const d = Math.ceil(combat.t - COMBAT_SUDDEN_DEATH_AT);
      combat.p.hp -= d;
      combat.e.hp -= d;
      events.push({ type: 'sudden_death', damage: d });
    }
  }

  if (combat.p.hp <= 0 || combat.e.hp <= 0) {
    combat.over = true;
    finalizeBattleReport(combat);
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

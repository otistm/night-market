import { getItemDef } from '@/game/economy';
import type { CombatSide, CombatState, ItemInstance } from '@/game/types';

export interface ItemReportRow {
  uid: number;
  defId: string;
  nm: string;
  ico: string;
  tier: number;
  triggers: number;
  damage: number;
  burnDamage: number;
  poisonDamage: number;
  burnApplied: number;
  poisonApplied: number;
  heal: number;
  shield: number;
  thornsDamage: number;
}

export interface SideBattleReport {
  label: string;
  rows: ItemReportRow[];
}

export interface BattleReport {
  duration: number;
  player: SideBattleReport;
  enemy: SideBattleReport;
}

type SideKey = 'p' | 'e';

function mkRow(it: ItemInstance): ItemReportRow {
  const def = getItemDef(it);
  return {
    uid: it.uid,
    defId: it.defId,
    nm: def.nm,
    ico: def.ico,
    tier: it.tier,
    triggers: 0,
    damage: 0,
    burnDamage: 0,
    poisonDamage: 0,
    burnApplied: 0,
    poisonApplied: 0,
    heal: 0,
    shield: 0,
    thornsDamage: 0,
  };
}

export class BattleReportTracker {
  readonly rows: Record<SideKey, Map<number, ItemReportRow>> = {
    p: new Map(),
    e: new Map(),
  };

  constructor(combat: CombatState) {
    for (const it of combat.p.items.map((ci) => ci.it)) {
      this.rows.p.set(it.uid, mkRow(it));
    }
    for (const ci of combat.e.items) {
      this.rows.e.set(ci.it.uid, mkRow(ci.it));
    }
  }

  private row(side: SideKey, uid: number): ItemReportRow | undefined {
    return this.rows[side].get(uid);
  }

  recordTrigger(side: SideKey, uid: number): void {
    const r = this.row(side, uid);
    if (r) r.triggers++;
  }

  recordDamage(side: SideKey, uid: number, amount: number): void {
    const r = this.row(side, uid);
    if (r) r.damage += amount;
  }

  recordBurnApplied(side: SideKey, uid: number, stacks: number): void {
    const r = this.row(side, uid);
    if (r) r.burnApplied += stacks;
  }

  recordPoisonApplied(side: SideKey, uid: number, stacks: number): void {
    const r = this.row(side, uid);
    if (r) r.poisonApplied += stacks;
  }

  recordHeal(side: SideKey, uid: number, amount: number): void {
    const r = this.row(side, uid);
    if (r) r.heal += amount;
  }

  recordShield(side: SideKey, uid: number, amount: number): void {
    const r = this.row(side, uid);
    if (r) r.shield += amount;
  }

  /** Attribute DoT tick damage to attackers by cumulative stacks applied. */
  recordDotTick(attacker: SideKey, kind: 'burn' | 'poison', amount: number): void {
    const map = this.rows[attacker];
    let total = 0;
    for (const r of map.values()) {
      total += kind === 'burn' ? r.burnApplied : r.poisonApplied;
    }
    if (total <= 0) return;
    for (const r of map.values()) {
      const weight = (kind === 'burn' ? r.burnApplied : r.poisonApplied) / total;
      if (weight <= 0) continue;
      const share = Math.round(amount * weight);
      if (kind === 'burn') r.burnDamage += share;
      else r.poisonDamage += share;
    }
  }

  recordThorns(defender: SideKey, side: CombatSide, amount: number): void {
    let total = 0;
    for (const ci of side.items) {
      total += ci.st.thorns;
    }
    if (total <= 0) return;
    for (const ci of side.items) {
      if (ci.st.thorns <= 0) continue;
      const r = this.row(defender, ci.it.uid);
      if (r) r.thornsDamage += Math.round(amount * (ci.st.thorns / total));
    }
  }

  finalize(combat: CombatState): BattleReport {
    const sortRows = (side: SideKey) =>
      [...this.rows[side].values()].sort((a, b) => b.triggers - a.triggers || b.damage - a.damage);

    return {
      duration: combat.t,
      player: { label: combat.p.hero?.nm ?? 'You', rows: sortRows('p') },
      enemy: { label: combat.enemyMeta.nm, rows: sortRows('e') },
    };
  }
}

export function totalDamage(row: ItemReportRow): number {
  return row.damage + row.burnDamage + row.poisonDamage + row.thornsDamage;
}

export function sideTotals(rows: ItemReportRow[]) {
  return rows.reduce(
    (acc, r) => ({
      triggers: acc.triggers + r.triggers,
      damage: acc.damage + r.damage,
      burnDamage: acc.burnDamage + r.burnDamage,
      poisonDamage: acc.poisonDamage + r.poisonDamage,
      heal: acc.heal + r.heal,
      shield: acc.shield + r.shield,
      thornsDamage: acc.thornsDamage + r.thornsDamage,
    }),
    { triggers: 0, damage: 0, burnDamage: 0, poisonDamage: 0, heal: 0, shield: 0, thornsDamage: 0 },
  );
}

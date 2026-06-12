import { ITEM_BY_ID } from '@/data/items';
import { BATTLE_CAP, PRICE_MULT, SCALABLE_EFFECTS, TIER_MULT } from '@/config/constants';
import type { HeroDef, ItemInstance, ItemStats, RunState } from '@/game/types';

export function getItemDef(it: ItemInstance) {
  return ITEM_BY_ID[it.defId];
}

export function usedBoardCap(board: ItemInstance[]): number {
  return board.reduce((acc, item) => acc + getItemDef(item).sz, 0);
}

/** Items that actually fight, in stall order, up to BATTLE_CAP size units. */
export function battleBoard(board: ItemInstance[]): ItemInstance[] {
  const out: ItemInstance[] = [];
  let used = 0;
  for (const item of board) {
    const sz = getItemDef(item).sz;
    if (used + sz > BATTLE_CAP) break;
    out.push(item);
    used += sz;
  }
  return out;
}

export function usedBattleCap(board: ItemInstance[]): number {
  return usedBoardCap(battleBoard(board));
}

export function itemPrice(it: ItemInstance): number {
  const def = getItemDef(it);
  return Math.round(def.sz * 3 * PRICE_MULT[it.tier]);
}

export function sellValue(it: ItemInstance): number {
  return Math.max(1, Math.ceil(itemPrice(it) / 2));
}

export function itemStats(it: ItemInstance, hero?: HeroDef): ItemStats {
  const def = getItemDef(it);
  const tierMult = TIER_MULT[it.tier];
  const out: ItemStats = { cd: Math.max(1, def.cd * (1 - it.tier * 0.04)) };

  for (const key of Object.keys(def.eff) as (keyof typeof def.eff)[]) {
    let value = def.eff[key];
    if (value === undefined) continue;

    if (SCALABLE_EFFECTS.includes(key)) {
      value = Math.round(value * tierMult);
    }
    const heroMult = hero?.mult[key as keyof typeof hero.mult];
    if (heroMult) {
      value = Math.round(value * heroMult);
    }
    out[key] = value;
  }

  return out;
}

export function describeItem(it: ItemInstance, withHero: boolean, run?: RunState): string {
  const hero = withHero ? run?.hero : undefined;
  const st = itemStats(it, hero);
  const def = getItemDef(it);
  const bits: string[] = [];

  if (st.dmg) {
    bits.push(
      `deal <b style="color:var(--blood)">${st.dmg} damage</b>${
        def.crit ? ` (${Math.round(def.crit * 100)}% chance to crit ×2)` : ''
      }`,
    );
  }
  if (st.burn) bits.push(`inflict <b style="color:var(--ember)">${st.burn} burn</b>`);
  if (st.poison) bits.push(`inflict <b style="color:var(--venom)">${st.poison} poison</b>`);
  if (st.shield) bits.push(`gain <b style="color:var(--frost)">${st.shield} shield</b>`);
  if (st.heal) bits.push(`restore <b style="color:#9be08a">${st.heal} health</b>`);
  if (st.haste) bits.push(`<b style="color:var(--goldt)">haste</b> your other wares ${st.haste}s`);
  if (st.slow) bits.push(`<b style="color:var(--frost)">slow</b> enemy wares ${st.slow}s`);
  if (st.cleanse) bits.push('cleanse your burn & poison');
  if (def.life) bits.push(`heal for ${Math.round(def.life * 100)}% of damage dealt`);
  if (st.income) {
    return `Earns <b style="color:var(--goldt)">+${st.income} gold</b> at the start of each night. Does nothing in battle.`;
  }

  return `Every <b>${st.cd.toFixed(1)}s</b>: ${bits.join(', ')}.`;
}

export function nightIncome(run: RunState): number {
  const passive = run.board.reduce((acc, item) => acc + (itemStats(item).income ?? 0), 0);
  return 6 + run.day + passive;
}

export function findMergeTarget(board: ItemInstance[], it: ItemInstance): ItemInstance | undefined {
  return board.find(
    (b) => b.defId === it.defId && b.tier === it.tier && b.tier < 3 && b.uid !== it.uid,
  );
}

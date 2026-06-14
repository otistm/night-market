import { ITEM_BY_ID } from '@/data/items';
import {
  CURSE_TIER_STEP,
  HASTE_SLOW_TIER_STEP,
  PRICE_MULT,
  SCALABLE_EFFECTS,
  TIER_MULT,
} from '@/config/constants';
import type { HeroDef, ItemInstance, ItemStats, RunState } from '@/game/types';

export function getItemDef(it: ItemInstance) {
  return ITEM_BY_ID[it.defId];
}

export function usedBoardCap(board: ItemInstance[]): number {
  return board.reduce((acc, item) => acc + getItemDef(item).sz, 0);
}

export function itemPrice(it: ItemInstance, hero?: HeroDef): number {
  const def = getItemDef(it);
  const base = Math.round(def.sz * 3 * PRICE_MULT[it.tier]);
  return Math.max(1, base - (hero?.discount ?? 0));
}

export function sellValue(it: ItemInstance): number {
  return Math.max(1, Math.ceil(itemPrice(it) / 2));
}

export function itemStats(it: ItemInstance, hero?: HeroDef): ItemStats {
  const def = getItemDef(it);
  const tierMult = TIER_MULT[it.tier];
  const out: ItemStats = {
    cd: Math.max(1, def.cd * (1 - it.tier * 0.04)),
    crit: Math.min(1, (def.crit ?? 0) + (hero?.critBonus ?? 0)),
    life: (def.life ?? 0) * (hero?.lifestealMult ?? 1),
    pierce: def.pierce ?? false,
    execute: def.execute ? Math.round(def.execute * tierMult) : 0,
    ramp: def.ramp ? Math.round(def.ramp * tierMult) : 0,
    hits: def.hits ?? 1,
    thorns: def.thorns ? Math.round(def.thorns * tierMult) : 0,
    goldScale: def.goldScale ?? false,
  };

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

  // Tempo effects (haste/slow/curse) don't use TIER_MULT — that would be absurd —
  // but they should still reward upgrading, so give them a gentle additive bump.
  if (it.tier > 0) {
    if (out.haste) out.haste = round1(out.haste + it.tier * HASTE_SLOW_TIER_STEP);
    if (out.slow) out.slow = round1(out.slow + it.tier * HASTE_SLOW_TIER_STEP);
    if (out.curse) out.curse = out.curse + it.tier * CURSE_TIER_STEP;
  }

  return out;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function describeItem(it: ItemInstance, withHero: boolean, run?: RunState): string {
  const hero = withHero ? run?.hero : undefined;
  const def = getItemDef(it);
  const st = itemStats(it, hero);
  const bits: string[] = [];

  if (st.income && def.cd === 0) {
    return `Earns <b style="color:var(--goldt)">+${st.income} gold</b> at the start of each night. Does nothing in battle.`;
  }

  if (st.dmg) {
    const hits = st.hits > 1 ? ` × ${st.hits} hits` : '';
    const pierce = st.pierce ? ' (pierces shields)' : '';
    const crit = st.crit ? ` (${Math.round(st.crit * 100)}% chance to crit ×2)` : '';
    bits.push(`deal <b style="color:var(--blood)">${st.dmg}${hits} damage</b>${pierce}${crit}`);
  }
  if (st.goldScale) bits.push(`<b style="color:var(--goldt)">+1 damage per 3 gold</b> you hold`);
  if (st.execute)
    bits.push(`bonus <b style="color:var(--blood)">+${st.execute} damage</b> to foes below 30% health`);
  if (st.ramp)
    bits.push(`permanently gains <b style="color:var(--blood)">+${st.ramp} damage</b> each time it fires`);
  if (st.burn) bits.push(`inflict <b style="color:var(--ember)">${st.burn} burn</b>`);
  if (st.poison) bits.push(`inflict <b style="color:var(--venom)">${st.poison} poison</b>`);
  if (st.shield) bits.push(`gain <b style="color:var(--frost)">${st.shield} shield</b>`);
  if (st.heal) bits.push(`restore <b style="color:#9be08a">${st.heal} health</b>`);
  if (st.curse)
    bits.push(
      `<b style="color:var(--venom)">curse</b> the foe ${st.curse}s (their heals & shields are halved)`,
    );
  if (st.haste) bits.push(`<b style="color:var(--goldt)">haste</b> your other wares ${st.haste}s`);
  if (st.slow) bits.push(`<b style="color:var(--frost)">slow</b> enemy wares ${st.slow}s`);
  if (st.cleanse) bits.push('cleanse your burn & poison');
  if (st.life) bits.push(`heal for ${Math.round(st.life * 100)}% of damage dealt`);

  let text = `Every <b>${st.cd.toFixed(1)}s</b>: ${bits.join('; ')}.`;
  if (st.thorns) {
    text += ` Aura — <b style="color:var(--ember)">thorns ${st.thorns}</b>: reflects ${st.thorns} damage to attackers.`;
  }
  if (st.income && def.cd !== 0) {
    text += ` Also earns <b style="color:var(--goldt)">+${st.income} gold</b> each night.`;
  }
  return text;
}

export function nightIncome(run: RunState): number {
  const passive = run.board.reduce((acc, item) => acc + (itemStats(item).income ?? 0), 0);
  return 6 + run.day + passive + (run.hero.bonusGold ?? 0);
}

export function findMergeTarget(board: ItemInstance[], it: ItemInstance): ItemInstance | undefined {
  return board.find(
    (b) => b.defId === it.defId && b.tier === it.tier && b.tier < 3 && b.uid !== it.uid,
  );
}

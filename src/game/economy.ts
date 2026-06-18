import { ITEM_BY_ID } from '@/data/items';
import {
  CURSE_TIER_STEP,
  HASTE_SLOW_TIER_STEP,
  PRICE_MULT,
  SCALABLE_EFFECTS,
  TIER_MULT,
} from '@/config/constants';
import type { AdjBonus, HeroDef, ItemInstance, ItemStats, ItemTag, RunState } from '@/game/types';

export function getItemDef(it: ItemInstance) {
  return ITEM_BY_ID[it.defId];
}

export function usedBoardCap(board: ItemInstance[]): number {
  return board.reduce((acc, item) => acc + getItemDef(item).sz, 0);
}

export function itemPrice(it: ItemInstance, hero?: HeroDef): number {
  if (it.free) return 0;
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

/**
 * Apply one adjacency payload onto a ware's stats (mutates `st`). Shared by the
 * combat engine and the item sheet so previewed and fought numbers always match.
 */
export function applyAdjBonus(
  st: ItemStats,
  add: AdjBonus | undefined,
  cdMult?: number,
  mult = 1,
): void {
  if (add) {
    if (add.dmg) st.dmg = (st.dmg ?? 0) + add.dmg * mult;
    if (add.burn) st.burn = (st.burn ?? 0) + add.burn * mult;
    if (add.poison) st.poison = (st.poison ?? 0) + add.poison * mult;
    if (add.shield) st.shield = (st.shield ?? 0) + add.shield * mult;
    if (add.heal) st.heal = (st.heal ?? 0) + add.heal * mult;
    if (add.thorns) st.thorns += add.thorns * mult;
    if (add.execute) st.execute += add.execute * mult;
    if (add.haste) st.haste = (st.haste ?? 0) + add.haste * mult;
    if (add.slow) st.slow = (st.slow ?? 0) + add.slow * mult;
    if (add.life) st.life += add.life * mult;
    if (add.hits) st.hits += Math.round(add.hits * mult);
    if (add.crit) st.crit = Math.min(1, st.crit + add.crit * mult);
    if (add.ramp) st.ramp += add.ramp * mult;
    if (add.curse) st.curse = (st.curse ?? 0) + add.curse * mult;
  }
  if (cdMult) st.cd = Math.max(1, st.cd * cdMult);
}

/**
 * Effective stats for the ware at `board[index]`, folding in the adjacency
 * synergies that would resolve for its current left/right neighbours: its own
 * `self` ability plus any neighbouring `aura` that targets it. Mirrors the
 * combat engine's resolution, but focused on a single ware for the item sheet.
 */
export function statsWithAdjacency(
  board: ItemInstance[],
  index: number,
  hero?: HeroDef,
): ItemStats {
  const st = itemStats(board[index], hero);
  if (index < 0 || index >= board.length || board.length < 2) return st;

  const defs = board.map((it) => getItemDef(it));
  const myTags = defs[index].tags;
  const tagsAt = (j: number): readonly ItemTag[] | null =>
    j >= 0 && j < board.length ? defs[j].tags : null;
  const lt = tagsAt(index - 1);
  const rt = tagsAt(index + 1);

  const self = defs[index].adj;
  if (self && self.mode === 'self') {
    let mult = 1;
    let ok = true;
    if (self.perTag) {
      mult = (lt?.includes(self.perTag) ? 1 : 0) + (rt?.includes(self.perTag) ? 1 : 0);
      ok = mult > 0;
    } else if (self.flanked) {
      ok = !!(lt && rt);
    } else if (self.needTag) {
      ok = !!(lt?.includes(self.needTag) || rt?.includes(self.needTag));
    }
    if (ok) applyAdjBonus(st, self.add, self.cdMult, mult);
  }

  for (const j of [index - 1, index + 1]) {
    if (j < 0 || j >= board.length) continue;
    const a = defs[j].adj;
    if (a && a.mode === 'aura' && (!a.targetTag || myTags.includes(a.targetTag))) {
      applyAdjBonus(st, a.add, a.cdMult);
    }
  }
  return st;
}

/**
 * @param effStats Effective stats to render (e.g. with adjacency folded in).
 *   When omitted, base stats are used. Numbers that exceed the ware's base
 *   value (or a faster cooldown) are flagged with a synergy marker.
 */
export function describeItem(
  it: ItemInstance,
  withHero: boolean,
  run?: RunState,
  effStats?: ItemStats,
): string {
  const hero = withHero ? run?.hero : undefined;
  const def = getItemDef(it);
  const base = itemStats(it, hero);
  const st = effStats ?? base;
  const bits: string[] = [];

  // A small amber arrow marking a trait currently boosted by a neighbour.
  const up = (boosted: boolean): string =>
    boosted ? ' <span class="syn-up" title="Boosted by a neighbouring ware">▲</span>' : '';
  const more = (key: keyof ItemStats): boolean => (st[key] as number) > ((base[key] as number) ?? 0);

  if (st.income && def.cd === 0) {
    return `Earns <b style="color:var(--goldt)">+${st.income} gold</b> at the start of each night. Does nothing in battle.`;
  }

  if (st.dmg) {
    const hits = st.hits > 1 ? ` × ${st.hits} hits` : '';
    const pierce = st.pierce ? ' (pierces shields)' : '';
    const crit = st.crit ? ` (${Math.round(st.crit * 100)}% chance to crit ×2)` : '';
    const boosted = more('dmg') || more('hits') || more('crit');
    bits.push(`deal <b style="color:var(--blood)">${st.dmg}${hits} damage</b>${pierce}${crit}${up(boosted)}`);
  }
  if (st.goldScale) bits.push(`<b style="color:var(--goldt)">+1 damage per 3 gold</b> you hold`);
  if (st.execute)
    bits.push(`bonus <b style="color:var(--blood)">+${st.execute} damage</b> to foes below 30% health${up(more('execute'))}`);
  if (st.ramp)
    bits.push(
      `permanently gains <b style="color:var(--blood)">+${st.ramp} damage</b> each time it fires${up(more('ramp'))}`,
    );
  if (st.burn) bits.push(`inflict <b style="color:var(--ember)">${st.burn} burn</b>${up(more('burn'))}`);
  if (st.poison) bits.push(`inflict <b style="color:var(--venom)">${st.poison} poison</b>${up(more('poison'))}`);
  if (st.shield) bits.push(`gain <b style="color:var(--frost)">${st.shield} shield</b>${up(more('shield'))}`);
  if (st.heal) bits.push(`restore <b style="color:#9be08a">${st.heal} health</b>${up(more('heal'))}`);
  if (st.curse)
    bits.push(
      `<b style="color:var(--venom)">curse</b> the foe ${st.curse}s (their heals & shields are halved)${up(more('curse'))}`,
    );
  if (st.haste) bits.push(`<b style="color:var(--goldt)">haste</b> your other wares ${st.haste}s${up(more('haste'))}`);
  if (st.slow) bits.push(`<b style="color:var(--frost)">slow</b> enemy wares ${st.slow}s${up(more('slow'))}`);
  if (st.cleanse) bits.push('cleanse your burn & poison');
  if (st.life) bits.push(`heal for ${Math.round(st.life * 100)}% of damage dealt${up(more('life'))}`);
  if (def.consume) {
    const col = def.consume === 'burn' ? 'var(--ember)' : 'var(--venom)';
    bits.push(
      `<b style="color:${col}">detonate ${def.consume}</b>: deal damage equal to the foe's ${def.consume}, then clear it`,
    );
  }

  const fasterCd = st.cd < base.cd - 0.001;
  let text = `Every <b>${st.cd.toFixed(1)}s</b>${up(fasterCd)}: ${bits.join('; ')}.`;
  if (st.thorns) {
    text += ` Aura — <b style="color:var(--ember)">thorns ${st.thorns}</b>${up(more('thorns'))}: reflects ${st.thorns} damage to attackers.`;
  }
  if (st.shield) {
    text += ` Shields also blunt incoming <b style="color:var(--ember)">burn</b> & <b style="color:var(--venom)">poison</b>.`;
  }
  if (st.income && def.cd !== 0) {
    text += ` Also earns <b style="color:var(--goldt)">+${st.income} gold</b> each night.`;
  }
  return text;
}

/** Synergy text for the item sheet, or null if the ware has no adjacency ability. */
export function describeAdjacency(it: ItemInstance): string | null {
  return getItemDef(it).adj?.desc ?? null;
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

export interface UpgradePair {
  shopUid: number;
  boardUid: number;
}

/** Shop wares that can merge into a matching stall ware (same def + tier, tier < 3). */
export function findUpgradePairs(run: RunState): UpgradePair[] {
  const pairs: UpgradePair[] = [];
  for (const it of run.shop) {
    if (!it) continue;
    const target = findMergeTarget(run.board, it);
    if (target) pairs.push({ shopUid: it.uid, boardUid: target.uid });
  }
  return pairs;
}

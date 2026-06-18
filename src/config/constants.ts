import type { Tier } from '@/game/types';

export const STALL_CAP = 5;
export const WIN_TARGET = 10;
export const STARTING_LIVES = 3;
export const STARTING_GOLD = 13;
export const STARTING_HP = 100;

export const TIER_COLORS: readonly string[] = ['#cd8d4f', '#cdd9e5', '#ffd75e', '#8ef0ff'];
export const TIER_MULT: readonly number[] = [1, 2, 4, 8];
export const PRICE_MULT: readonly number[] = [1, 1.8, 3.2, 5.5];

export const SCALABLE_EFFECTS: readonly (keyof import('@/game/types').ItemEffects)[] = [
  'dmg',
  'shield',
  'heal',
  'burn',
  'poison',
  'income',
];

export const COMBAT_SUDDEN_DEATH_AT = 30;

/** Lump-sum gold offered as a boss-defeat reward, scaling with the night. */
export function bossBounty(day: number): number {
  return 5 + day;
}

/** A cursed side takes amplified burn & poison ticks (curse ↔ DoT synergy). */
export const CURSE_DOT_MULT = 1.3;

/**
 * Shields are an investable counter to elemental damage: each burn/poison tick
 * can be soaked by shield up to this fraction (the remainder always bleeds
 * through to HP, so DoT is mitigated, never hard-countered).
 */
export const ELEMENTAL_SHIELD_SOAK = 0.5;

/**
 * Burn is a front-loaded burst that smoulders out: each second it loses this
 * fraction of its stack (min 1), so high stacks fade fast instead of carrying a
 * long super-linear tail.
 */
export const BURN_DECAY = 0.4;

/** Gentle additive per-tier scaling for tempo effects that don't use TIER_MULT. */
export const HASTE_SLOW_TIER_STEP = 0.15;
export const CURSE_TIER_STEP = 1;

export function isValidTier(n: number): n is Tier {
  return n >= 0 && n <= 3;
}

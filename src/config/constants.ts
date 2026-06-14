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

/** A cursed side takes amplified burn & poison ticks (curse ↔ DoT synergy). */
export const CURSE_DOT_MULT = 1.5;

/** Gentle additive per-tier scaling for tempo effects that don't use TIER_MULT. */
export const HASTE_SLOW_TIER_STEP = 0.15;
export const CURSE_TIER_STEP = 1;

export function isValidTier(n: number): n is Tier {
  return n >= 0 && n <= 3;
}

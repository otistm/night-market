import type { HeroDef } from '@/game/types';

/**
 * Werewolf: weapon damage ramps as the fight goes on.
 * Returns a multiplier applied to direct damage at battle time `t`.
 */
export function weaponRampMult(hero: HeroDef | undefined, t: number): number {
  if (!hero?.dmgRampPerSec) return 1;
  return 1 + hero.dmgRampPerSec * t;
}

/**
 * Sorcerer: slows also deal arcane damage.
 * Returns bonus damage for a slow of `slowSec` seconds.
 */
export function arcaneSlowDamage(hero: HeroDef | undefined, slowSec: number): number {
  if (!hero?.slowArcane) return 0;
  return Math.round(slowSec * hero.slowArcane);
}

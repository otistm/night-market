import { FIENDS } from '@/data/fiends';
import type { EnemyMeta, FiendDef, RunState, Tier } from '@/game/types';
import { createItemInstance } from '@/game/run-state';
import { clamp } from '@/utils/math';

/**
 * Retry escalation is deliberately gentle so a losing player isn't death-spiralled.
 * Each failed attempt adds a percentage of the boss's base HP (so it scales with
 * boss size) up to a cap, instead of bumping every ware's tier (which roughly
 * doubled boss output via TIER_MULT). Damage pressure only nudges up after a
 * couple of losses, and then only on the boss's single primary ware.
 */
export const RETRY_HP_PCT = 0.1;
export const RETRY_MAX_STACKS = 5;
/** Failed attempts before the boss's primary ware gains a single tier. */
export const RETRY_TIER_AT = 2;

export function getFiendForRun(run: RunState): FiendDef {
  const idx = clamp(run.day - 1, 0, FIENDS.length - 1);
  return FIENDS[idx];
}

export function buildEnemy(run: RunState): EnemyMeta {
  const fiend = getFiendForRun(run);
  const attempts = run.bossAttempts;
  const stacks = Math.min(attempts, RETRY_MAX_STACKS);
  const hp = Math.round(fiend.baseHp * (1 + RETRY_HP_PCT * stacks));
  const board = fiend.wares.map((w, i) => {
    const bump = i === 0 && attempts >= RETRY_TIER_AT ? 1 : 0;
    return createItemInstance(w.defId, Math.min(3, w.tier + bump) as Tier);
  });

  return {
    nm: fiend.nm,
    face: fiend.face,
    img: fiend.img,
    hp,
    board,
    threat: fiend.threat,
    hint: fiend.hint,
    regen: fiend.regen,
    gimmick: fiend.gimmick,
  };
}

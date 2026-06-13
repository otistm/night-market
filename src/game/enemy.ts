import { FIENDS } from '@/data/fiends';
import type { EnemyMeta, RunState, Tier } from '@/game/types';
import { createItemInstance } from '@/game/run-state';

/** Extra fiend HP per completed 10-night loop. */
export const HP_PER_LOOP = 14;

export function buildEnemy(run: RunState): EnemyMeta {
  const fiend = FIENDS[(run.day - 1) % FIENDS.length];
  const cycle = Math.floor((run.day - 1) / FIENDS.length);
  const hp = fiend.baseHp + cycle * HP_PER_LOOP;
  const board = fiend.wares.map((w) =>
    createItemInstance(w.defId, Math.min(3, w.tier + cycle) as Tier),
  );

  return {
    nm: fiend.nm,
    face: fiend.face,
    hp,
    board,
    threat: fiend.threat,
    hint: fiend.hint,
    regen: fiend.regen,
  };
}

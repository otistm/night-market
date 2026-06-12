import { ITEMS } from '@/data/items';
import { RIVALS } from '@/data/rivals';
import { BATTLE_CAP } from '@/config/constants';
import type { EnemyMeta, ItemInstance, RunState } from '@/game/types';
import { pick } from '@/utils/math';
import { createItemInstance } from '@/game/run-state';
import { itemPrice } from '@/game/economy';

export function buildEnemy(run: RunState): EnemyMeta {
  const rival = RIVALS[(run.day - 1) % RIVALS.length];
  const budget = 4 + run.day * 4;
  const hp = 76 + run.day * 14;
  const board: ItemInstance[] = [];
  let cap = BATTLE_CAP;
  let spend = 0;
  let guard = 40;

  while (spend < budget && cap > 0 && guard-- > 0) {
    const pool = ITEMS.filter((d) => d.sz <= cap && !d.eff.income);
    const def = pick(pool);
    let tier: 0 | 1 | 2 | 3 = 0;
    if (run.day >= 5 && Math.random() < 0.45) tier = 1;
    if (run.day >= 8 && Math.random() < 0.35) tier = 2;
    if (run.day >= 11 && Math.random() < 0.25) tier = 3;

    const it = createItemInstance(def.id, tier);
    board.push(it);
    cap -= def.sz;
    spend += itemPrice(it);
  }

  return { nm: rival.nm, face: rival.face, hp, board };
}

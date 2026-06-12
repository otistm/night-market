import { STARTING_LIVES, WIN_TARGET } from '@/config/constants';
import type { CombatState, RunState } from '@/game/types';
import { nightIncome } from '@/game/economy';
import { romans } from '@/utils/romans';
import { animateResultChildren, countUp } from '@/fx/animations';
import { $ } from '@/ui/dom';

export interface ResultCallbacks {
  onContinue(): void;
  onRunEnd(): void;
}

export function showResultScreen(
  run: RunState,
  combat: CombatState,
  won: boolean,
  fx: { confettiBurst(): void },
  bg: { setMood(m: 'win' | 'shop'): void },
  callbacks: ResultCallbacks,
): void {
  if (won) run.wins++;
  else run.lives--;

  const runWon = run.wins >= WIN_TARGET;
  const runLost = run.lives <= 0;
  const income = nightIncome(run);

  let kick: string;
  let title: string;
  let body: string;
  let btn = 'Next Night';
  let reward = '';

  if (runWon) {
    kick = 'A perfect run';
    title = 'MASTER OF<br>THE MARKET';
    body = `Ten rivals beaten. The Night Market bows to ${run.hero.nm}.`;
    btn = 'New Run';
  } else if (runLost) {
    kick = 'The run ends';
    title = 'THE LANTERNS<br>GO DARK';
    body = `${combat.enemyMeta.nm} claims your last stall. The market forgets quickly.`;
    btn = 'Try Again';
  } else if (won) {
    kick = `Night ${romans(run.day)}`;
    title = 'VICTORY';
    body = `${combat.enemyMeta.nm} packs up in disgrace.`;
    reward = '<span>+<b id="rw-gold">0</b> gold</span><span>+10 max HP</span>';
  } else {
    kick = `Night ${romans(run.day)}`;
    title = 'DEFEAT';
    body = `${combat.enemyMeta.nm} picks your pockets on the way out.`;
    reward = '<span>+<b id="rw-gold">0</b> gold</span><span>−1 lantern</span>';
  }

  const sc = $('result-screen');
  sc.className = won || runWon ? 'win' : 'loss';
  sc.classList.add('on');
  sc.innerHTML = `
    <div class="r-kick">${kick}</div>
    <h2>${title}</h2>
    <p>${body}</p>
    ${reward ? `<div class="reward">${reward}</div>` : ''}
    <div class="meta">WINS ${run.wins}/${WIN_TARGET} &nbsp;·&nbsp; LANTERNS ${Math.max(0, run.lives)}/${STARTING_LIVES}</div>
    <button class="btn primary" id="btn-next">${btn}</button>`;

  animateResultChildren(sc);

  if (won || runWon) {
    bg.setMood('win');
    fx.confettiBurst();
  }

  countUp(document.getElementById('rw-gold'), income);

  $('btn-next').addEventListener('click', () => {
    sc.classList.remove('on');
    if (runWon || runLost) {
      callbacks.onRunEnd();
    } else {
      run.day++;
      run.maxHp += 10;
      run.gold += income;
      run.rerollCost = 1;
      callbacks.onContinue();
    }
  }, { once: true });
}

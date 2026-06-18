import { STARTING_LIVES, WIN_TARGET } from '@/config/constants';
import type { CombatState, RunState } from '@/game/types';
import { nightIncome } from '@/game/economy';
import { romans } from '@/utils/romans';
import { animateResultReveal, countUp } from '@/fx/animations';
import { openBattleReport, closeBattleReport } from '@/ui/components/battle-report-sheet';
import { openRewardChoice } from '@/ui/components/reward-choice';
import { showLordsGallery } from '@/ui/lords-gallery';
import { $ } from '@/ui/dom';

export interface ResultCallbacks {
  onContinue(): void;
  onRunEnd(): void;
}

export function hideBattleHeaderActions(): void {
  const actions = $('battle-header-actions');
  actions.hidden = true;
  actions.style.opacity = '';
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
  let btn = 'Continue';
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
    body = `${combat.enemyMeta.nm} picks your pockets on the way out. You must face them again — and they grow stronger.`;
    if (combat.enemyMeta.hint) {
      body += `<br><i class="fiend-hint">${combat.enemyMeta.hint}</i>`;
    }
    reward = '<span>+<b id="rw-gold">0</b> gold</span><span>−1 lantern</span>';
  }

  const sc = $('result-screen');
  sc.className = won || runWon ? 'win' : 'loss';
  sc.classList.remove('actions-ready', 'backdrop-clear');
  sc.classList.add('on');
  sc.innerHTML = `
    <div class="result-splash">
      <div class="r-kick">${kick}</div>
      <h2>${title}</h2>
      <p>${body}</p>
      ${reward ? `<div class="reward">${reward}</div>` : ''}
      <div class="meta">WINS ${run.wins}/${WIN_TARGET} &nbsp;·&nbsp; LANTERNS ${Math.max(0, run.lives)}/${STARTING_LIVES}</div>
    </div>`;

  const splash = sc.querySelector('.result-splash') as HTMLElement;
  const headerActions = $('battle-header-actions');
  const reportBtn = $('btn-report');
  const continueBtn = $('btn-continue');

  reportBtn.hidden = !combat.report;
  continueBtn.textContent = btn;
  headerActions.hidden = false;
  headerActions.style.opacity = '0';

  animateResultReveal(splash, headerActions, sc);

  if (won || runWon) {
    bg.setMood('win');
    fx.confettiBurst();
  }

  countUp(document.getElementById('rw-gold'), income);

  reportBtn.onclick = () => {
    if (combat.report) openBattleReport(combat.report);
  };

  continueBtn.onclick = () => {
    closeBattleReport();
    hideBattleHeaderActions();
    sc.classList.remove('on', 'actions-ready', 'backdrop-clear');

    const proceedRunEnd = (): void => {
      callbacks.onRunEnd();
    };

    const proceedNight = (): void => {
      run.day++;
      run.bossAttempts = 0;
      run.maxHp += 10;
      run.gold += income;
      run.rerollCost = run.hero.freeReroll ? 0 : 1;
      callbacks.onContinue();
    };

    const proceedRetry = (): void => {
      run.bossAttempts++;
      run.gold += income;
      run.rerollCost = run.hero.freeReroll ? 0 : 1;
      callbacks.onContinue();
    };

    if (runWon) {
      showLordsGallery(run.wins, proceedRunEnd, { autoDismiss: true });
    } else if (runLost) {
      proceedRunEnd();
    } else if (won) {
      openRewardChoice({
        run,
        onDone: () => showLordsGallery(run.wins, proceedNight, { autoDismiss: true }),
      });
    } else {
      proceedRetry();
    }
  };
}

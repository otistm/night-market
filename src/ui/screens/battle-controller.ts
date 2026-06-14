import type { CombatState, RunState } from '@/game/types';
import { createCombat, findCombatItem, tickCombat, type CombatEvent } from '@/game/combat';
import { buildEnemy, getFiendForRun } from '@/game/enemy';
import { createItemElement, fillStallSlots, toggleScrollable } from '@/ui/components/cards';
import { getItemDef } from '@/game/economy';
import {
  animateBattleEntrance,
  animateHpBar,
  animateShieldBar,
  punch,
  reduceMotion,
  showCombatTicker,
  showScreen,
} from '@/fx/animations';
import { createDamagePop, type FxSystem } from '@/fx/particles';
import { animateDamagePop, shakeApp } from '@/fx/animations';
import { sfx } from '@/fx/sfx';
import { closeItemSheet, openItemSheet } from '@/ui/components/item-sheet';
import { showDockBattle } from '@/ui/player-dock';
import { hideBattleHeaderActions } from '@/ui/screens/result-view';
import { showBossIntro } from '@/ui/boss-intro';
import { $, vibrate } from '@/ui/dom';
import { clamp } from '@/utils/math';
type SideKey = 'p' | 'e';

export interface BattleController {
  start(): void;
  stop(): void;
  getCombat(): CombatState | null;
  openCombatItemSheet(uid: number): void;
}

export function createBattleController(
  getRun: () => RunState | null,
  fx: FxSystem,
  bg: { setMood(m: 'battle' | 'sudden' | 'shop'): void; pulse(): void },
  onEnd: (combat: CombatState, won: boolean) => void,
): BattleController {
  let combat: CombatState | null = null;
  let rafId = 0;
  let lastTs = 0;
  const appEl = $('app');

  function drawSide(key: SideKey): void {
    if (!combat) return;
    const s = combat[key];
    const hpPct = clamp((s.hp / s.maxHp) * 100, 0, 100);
    const shPct = clamp((s.shield / s.maxHp) * 100, 0, 100);

    const hpEl = $(key + '-hp');
    animateHpBar(hpEl, hpPct);
    animateShieldBar($(key + '-sh'), shPct);

    hpEl.classList.toggle('burning', s.burn > 0);
    hpEl.classList.toggle('poisoned', s.poison > 0);

    $(key + '-hpt').textContent =
      `${Math.max(0, Math.ceil(s.hp))}${s.shield > 0 ? ` +${Math.round(s.shield)}` : ''}`;
    $(key + '-hpnum').textContent = `${Math.max(0, Math.ceil(s.hp))} / ${s.maxHp}`;

    setStatus(key, 'burn', s.burn);
    setStatus(key, 'poison', s.poison);
    setStatus(key, 'shield', Math.round(s.shield));
    setStatus(key, 'curse', s.curse);
    setStatus(key, 'thorns', s.thorns);

    $(key + '-face').classList.toggle('cursed', s.curse > 0);
  }

  function setStatus(key: SideKey, st: string, v: number): void {
    const el = $(`${key}-${st}`);
    el.style.display = v > 0 ? 'inline-flex' : 'none';
    el.querySelector('b')!.textContent = String(Math.ceil(v));
  }

  function flashWare(el: HTMLElement, cls: string): void {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function handleEvents(events: CombatEvent[]): void {
    const run = getRun();
    if (!combat || !run) return;

    for (const ev of events) {
      switch (ev.type) {
        case 'damage': {
          const face = $(ev.side + '-face');
          const pop = createDamagePop(
            appEl,
            face,
            `${ev.crit ? '✦' : ''}-${ev.amount}`,
            ev.crit ? '#ffd75e' : 'var(--blood)',
            ev.crit ? 24 : 18,
          );
          punch(face, 0.82);
          fx.burst(face, ev.crit ? '#ffd75e' : '#ff4d6a', ev.crit ? 26 : 10);
          sfx.hit(ev.crit);
          animateDamagePop(pop, () => {}, run.speed);
          if (ev.amount >= 20 || ev.crit) {
            shakeApp(ev.crit ? 10 : 7);
            bg.pulse();
            vibrate(ev.crit ? 30 : 15);
          }
          break;
        }
        case 'raw': {
          const face = $(ev.side + '-face');
          if (ev.kind === 'thorns') {
            const pop = createDamagePop(appEl, face, `💢-${ev.amount}`, '#ff8d7a', 14);
            animateDamagePop(pop, () => {}, run.speed);
            fx.burst(face, '#ff8d7a', 8);
            face.classList.remove('fx-thorns');
            void face.offsetWidth;
            face.classList.add('fx-thorns');
          } else if (ev.kind === 'burn') {
            const pop = createDamagePop(appEl, face, `-${ev.amount}`, 'var(--ember)', 13);
            animateDamagePop(pop, () => {}, run.speed);
            sfx.burn();
          } else if (ev.kind === 'poison') {
            const pop = createDamagePop(appEl, face, `-${ev.amount}`, 'var(--venom)', 13);
            animateDamagePop(pop, () => {}, run.speed);
            sfx.poison();
          }
          break;
        }
        case 'heal': {
          const face = $(ev.side + '-face');
          const pop = createDamagePop(appEl, face, `+${ev.amount}`, '#9be08a', 15);
          animateDamagePop(pop, () => {}, run.speed);
          fx.burst(face, '#9be08a', 8);
          sfx.heal();
          break;
        }
        case 'shield': {
          const face = $(ev.side + '-face');
          if (ev.amount > 0) {
            fx.burst(face, '#6cc7ff', 12);
            sfx.shield();
          }
          break;
        }
        case 'curse': {
          const face = $(ev.side + '-face');
          fx.burst(face, '#c58aff', 12);
          break;
        }
        case 'burn':
        case 'poison': {
          const face = $(ev.side + '-face');
          const sym = ev.type === 'burn' ? '🔥' : '☠';
          const col = ev.type === 'burn' ? 'var(--ember)' : 'var(--venom)';
          const pop = createDamagePop(appEl, face, `+${ev.amount}${sym}`, col, 14);
          animateDamagePop(pop, () => {}, run.speed);
          if (ev.type === 'burn') sfx.burn();
          else sfx.poison();
          break;
        }
        case 'trigger': {
          const ci = [...combat.p.items, ...combat.e.items].find((c) => c.it.uid === ev.itemUid);
          if (ci?.el) {
            punch(ci.el, ev.crit ? 1.32 : 1.18);
            const foeKey = ev.side === 'p' ? 'e' : 'p';
            const ownFace = $(ev.side + '-face');
            const foeFace = $(foeKey + '-face');
            const st = ci.st;

            if (ev.crit) flashWare(ci.el, 'fx-crit');

            if (st.dmg) {
              const foe = combat[foeKey];
              const executing = !!st.execute && foe.hp / foe.maxHp < 0.3;
              const hits = Math.max(1, Math.min(st.hits ?? 1, 4));
              const color = ev.crit
                ? '#ffd75e'
                : executing
                  ? '#5ef0c8'
                  : st.pierce
                    ? '#bfefff'
                    : '#ff6d5e';
              for (let h = 0; h < hits; h++) {
                const fire = () => fx.shootProjectile(ci.el!, foeFace, color, run.speed);
                if (h === 0) fire();
                else setTimeout(fire, (h * 70) / Math.max(1, run.speed));
              }
              if (executing) flashWare(ci.el, 'fx-exec');
            }
            if (st.burn || st.poison) {
              fx.shootProjectile(ci.el, foeFace, st.burn ? '#ff8a3d' : '#7ee06a', run.speed);
            }
            if (!st.dmg && !st.burn && !st.poison) {
              if (st.shield) fx.shootProjectile(ci.el, ownFace, '#6cc7ff', run.speed);
              else if (st.heal) fx.shootProjectile(ci.el, ownFace, '#9be08a', run.speed);
            }
          }
          break;
        }
        case 'haste': {
          const board = $(ev.side + '-board');
          fx.burst(board, '#ffd75e', 12);
          board.classList.remove('fx-haste');
          void board.offsetWidth;
          board.classList.add('fx-haste');
          break;
        }
        case 'slow': {
          const board = $(ev.side + '-board');
          fx.burst(board, '#6cc7ff', 14);
          board.classList.remove('fx-slow');
          void board.offsetWidth;
          board.classList.add('fx-slow');
          break;
        }
        case 'log': {
          const tone = /sudden death/i.test(ev.message)
            ? 'sudden'
            : /strikes true|crit/i.test(ev.message)
              ? 'crit'
              : 'normal';
          showCombatTicker($('combat-ticker'), ev.message, tone);
          break;
        }
        case 'sudden_death': {
          if (!combat.over) bg.setMood('sudden');
          for (const sideKey of ['p', 'e'] as const) {
            const face = $(sideKey + '-face');
            const pop = createDamagePop(appEl, face, `-${ev.damage}`, '#ff6d6a', 16);
            animateDamagePop(pop, () => {}, run.speed);
            face.classList.remove('fx-sudden');
            void face.offsetWidth;
            face.classList.add('fx-sudden');
          }
          shakeApp(5);
          sfx.sudden();
          break;
        }
        case 'end': {
          if (ev.won) $('e-face').classList.add('fx-ko');
          shakeApp(9);
          vibrate(ev.won ? 24 : [40, 30, 40]);
          if (ev.won) sfx.win();
          else sfx.lose();
          cancelAnimationFrame(rafId);
          setTimeout(() => onEnd(combat!, ev.won), 750);
          break;
        }
      }
    }
  }

  function tick(ts: number): void {
    if (!combat || combat.over) return;
    const run = getRun();
    if (!run) return;

    const dt = Math.min((ts - lastTs) / 1000, 0.1) * run.speed;
    lastTs = ts;

    const events = tickCombat(combat, dt);
    handleEvents(events);

    $('bt-timer').textContent = combat.t.toFixed(1);
    $('bt-timer').classList.toggle('sudden', combat.sudden);

    for (const side of [combat.p, combat.e]) {
      for (const ci of side.items) {
        const frac = ci.t / ci.st.cd;
        const bar = ci.el?.querySelector<HTMLElement>('.cdbar i');
        if (bar) bar.style.width = `${clamp(frac * 100, 0, 100)}%`;
        ci.el?.classList.toggle('charged', frac >= 0.9);
      }
    }

    drawSide('p');
    drawSide('e');

    if (!combat.over) rafId = requestAnimationFrame(tick);
  }

  function beginBattle(): void {
    const run = getRun();
    if (!run) return;

    showScreen('battle-screen', true, true);

    const enemy = buildEnemy(run);
    combat = createCombat(run, enemy);

    $('bt-timer').textContent = '0.0';
    $('bt-timer').classList.remove('sudden');
    hideBattleHeaderActions();

    $('p-face').textContent = run.hero.face;
    $('p-name').textContent = run.hero.nm;
    // The enemy "face" is the full boss portrait used as the battle backdrop.
    // It doubles as the FX anchor so hits, curse tints and the KO moment land on
    // the boss art itself.
    const eFace = $('e-face');
    eFace.textContent = '';
    eFace.style.backgroundImage = enemy.img ? `url('${enemy.img}')` : '';
    $('e-name').textContent = enemy.nm;
    for (const fk of ['p', 'e'] as const) {
      $(fk + '-face').classList.remove('fx-ko', 'cursed', 'fx-thorns', 'fx-sudden');
    }

    // Enemy board: combat wares only, scrolling (a boss may exceed the 5-slot cap).
    const eBoard = $('e-board');
    eBoard.innerHTML = '';
    combat.e.items.forEach((ci) => {
      ci.el = createItemElement(ci.it, 'combat');
      eBoard.appendChild(ci.el);
    });
    if (combat.e.items.length === 0) {
      eBoard.innerHTML = '<div class="empty-hint">— bare stall —</div>';
    }
    toggleScrollable(eBoard);

    // Player board: render every ware from the stall (including non-combat income
    // wares) so the 5-slot layout is identical to the shop, then wire combat FX
    // elements to the wares that actually fire.
    const pBoard = $('p-board');
    pBoard.innerHTML = '';
    let usedSlots = 0;
    for (const it of run.board) {
      const el = createItemElement(it, 'combat');
      pBoard.appendChild(el);
      usedSlots += getItemDef(it).sz;
      const ci = combat.p.items.find((c) => c.it.uid === it.uid);
      if (ci) ci.el = el;
    }
    fillStallSlots(pBoard, usedSlots);

    showDockBattle();
    bg.setMood('battle');
    drawSide('p');
    drawSide('e');

    animateBattleEntrance(() => {
      cancelAnimationFrame(rafId);
      setTimeout(
        () => {
          lastTs = performance.now();
          rafId = requestAnimationFrame(tick);
        },
        reduceMotion ? 100 : 750,
      );
    });
  }

  return {
    getCombat: () => combat,

    start() {
      const run = getRun();
      if (!run) return;

      showScreen('battle-screen', true, true);
      const fiend = getFiendForRun(run);
      showBossIntro(fiend, beginBattle);
    },

    stop() {
      cancelAnimationFrame(rafId);
      combat = null;
    },

    openCombatItemSheet(uid: number) {
      if (!combat) return;
      const it = findCombatItem(combat, uid);
      if (!it) return;
      openItemSheet(it, getRun(), {
        onClose: closeItemSheet,
      });
    },
  };
}

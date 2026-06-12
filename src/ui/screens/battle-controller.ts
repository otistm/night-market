import type { CombatState, RunState } from '@/game/types';
import { createCombat, findCombatItem, tickCombat, type CombatEvent } from '@/game/combat';
import { buildEnemy } from '@/game/enemy';
import { createItemElement, toggleScrollable } from '@/ui/components/cards';
import {
  animateBattleEntrance,
  animateHpBar,
  animateLogLine,
  animateShieldBar,
  punch,
  reduceMotion,
  showScreen,
} from '@/fx/animations';
import { createDamagePop, type FxSystem } from '@/fx/particles';
import { animateDamagePop, shakeApp } from '@/fx/animations';
import { closeItemSheet, openItemSheet } from '@/ui/components/item-sheet';
import { showDockBattle } from '@/ui/player-dock';
import { $, vibrate } from '@/ui/dom';
import { clamp } from '@/utils/math';
import { romans } from '@/utils/romans';
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

    animateHpBar($(key + '-hp'), hpPct);
    animateShieldBar($(key + '-sh'), shPct);

    $(key + '-hpt').textContent =
      `${Math.max(0, Math.ceil(s.hp))}${s.shield > 0 ? ` +${Math.round(s.shield)}` : ''}`;
    $(key + '-hpnum').textContent = `${Math.max(0, Math.ceil(s.hp))} / ${s.maxHp}`;

    setStatus(key, 'burn', s.burn);
    setStatus(key, 'poison', s.poison);
    setStatus(key, 'shield', Math.round(s.shield));
  }

  function setStatus(key: SideKey, st: string, v: number): void {
    const el = $(`${key}-${st}`);
    el.style.display = v > 0 ? 'inline-flex' : 'none';
    el.querySelector('b')!.textContent = String(Math.ceil(v));
  }

  function log(msg: string): void {
    const l = $('combat-log');
    const d = document.createElement('div');
    d.textContent = msg;
    l.appendChild(d);
    while (l.children.length > 2) l.removeChild(l.firstChild!);
    animateLogLine(d);
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
          animateDamagePop(pop, () => {});
          if (ev.amount >= 20 || ev.crit) {
            shakeApp(ev.crit ? 10 : 7);
            bg.pulse();
            vibrate(ev.crit ? 30 : 15);
          }
          break;
        }
        case 'raw': {
          const face = $(ev.side + '-face');
          const col =
            ev.kind === 'burn' ? 'var(--ember)' : ev.kind === 'poison' ? 'var(--venom)' : '#cccccc';
          const pop = createDamagePop(appEl, face, `-${ev.amount}`, col, 13);
          animateDamagePop(pop, () => {});
          break;
        }
        case 'heal': {
          const face = $(ev.side + '-face');
          const pop = createDamagePop(appEl, face, `+${ev.amount}`, '#9be08a', 15);
          animateDamagePop(pop, () => {});
          fx.burst(face, '#9be08a', 8);
          break;
        }
        case 'shield': {
          const face = $(ev.side + '-face');
          if (ev.amount > 0) {
            const pop = createDamagePop(appEl, face, `+${ev.amount}🛡`, 'var(--frost)', 14);
            animateDamagePop(pop, () => {});
            fx.burst(face, '#6cc7ff', 12);
          } else {
            const pop = createDamagePop(appEl, face, String(ev.amount), 'var(--frost)', 14);
            animateDamagePop(pop, () => {});
          }
          break;
        }
        case 'burn':
        case 'poison': {
          const face = $(ev.side + '-face');
          const sym = ev.type === 'burn' ? '🔥' : '☠';
          const col = ev.type === 'burn' ? 'var(--ember)' : 'var(--venom)';
          const pop = createDamagePop(appEl, face, `+${ev.amount}${sym}`, col, 14);
          animateDamagePop(pop, () => {});
          break;
        }
        case 'trigger': {
          const ci = [...combat.p.items, ...combat.e.items].find((c) => c.it.uid === ev.itemUid);
          if (ci?.el) {
            punch(ci.el, 1.18);
            const foeKey = ev.side === 'p' ? 'e' : 'p';
            const st = ci.st;
            if (st.dmg) {
              fx.shootProjectile(
                ci.el,
                $(foeKey + '-face'),
                ev.crit ? '#ffd75e' : '#ff6d5e',
                run.speed,
              );
            }
            if (st.burn || st.poison) {
              fx.shootProjectile(
                ci.el,
                $(foeKey + '-face'),
                st.burn ? '#ff8a3d' : '#7ee06a',
                run.speed,
              );
            }
          }
          break;
        }
        case 'haste': {
          const ci = combat[ev.side].items.find((c) => c.el);
          if (ci?.el) fx.burst(ci.el, '#ffd75e', 10);
          break;
        }
        case 'slow': {
          fx.burst($(`${ev.side === 'p' ? 'e' : 'p'}-board`), '#6cc7ff', 14);
          break;
        }
        case 'sudden_death':
          bg.setMood('sudden');
          break;
        case 'log':
          log(ev.message);
          break;
        case 'end':
          cancelAnimationFrame(rafId);
          setTimeout(() => onEnd(combat!, ev.won), 750);
          break;
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
        const bar = ci.el?.querySelector<HTMLElement>('.cdbar i');
        if (bar) bar.style.width = `${clamp((ci.t / ci.st.cd) * 100, 0, 100)}%`;
      }
    }

    drawSide('p');
    drawSide('e');

    if (!combat.over) rafId = requestAnimationFrame(tick);
  }

  return {
    getCombat: () => combat,

    start() {
      const run = getRun();
      if (!run) return;

      const enemy = buildEnemy(run);
      combat = createCombat(run, enemy);

      $('bt-day').textContent = `NIGHT ${romans(run.day)}`;
      $('bt-timer').textContent = '0.0';
      $('bt-timer').classList.remove('sudden');
      $('btn-speed').textContent = `${run.speed}×`;

      $('p-face').textContent = run.hero.face;
      $('p-name').textContent = run.hero.nm;
      $('e-face').textContent = enemy.face;
      $('e-name').textContent = enemy.nm;
      $('combat-log').innerHTML = '';

      for (const side of ['p', 'e'] as const) {
        const boardEl = $(side + '-board');
        boardEl.innerHTML = '';
        combat[side].items.forEach((ci) => {
          ci.el = createItemElement(ci.it, 'combat');
          boardEl.appendChild(ci.el);
        });
        if (combat[side].items.length === 0) {
          boardEl.innerHTML = '<div class="empty-hint">— bare stall —</div>';
        }
        toggleScrollable(boardEl);
      }

      const burst = document.getElementById('vs-burst');
      burst?.classList.remove('done');

      showScreen('battle-screen', true);
      showDockBattle();
      bg.setMood('battle');
      drawSide('p');
      drawSide('e');

      animateBattleEntrance(() => {
        log(`${enemy.nm} unrolls their wares across from yours…`);
        cancelAnimationFrame(rafId);
        setTimeout(
          () => {
            lastTs = performance.now();
            rafId = requestAnimationFrame(tick);
          },
          reduceMotion ? 100 : 1200,
        );
      });
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

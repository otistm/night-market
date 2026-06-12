import { HEROES } from '@/data/heroes';
import type { HeroDef, ItemInstance, RunState } from '@/game/types';
import { createRun, rollShop } from '@/game/run-state';
import { buyItem, rerollShop, sellItem } from '@/game/shop-actions';
import { TIER_COLORS } from '@/config/constants';
import { createBackground3D } from '@/fx/background3d';
import { createFxSystem } from '@/fx/particles';
import {
  flashGold,
  punch,
  shopEntrance,
  showScreen,
  titleIntro,
} from '@/fx/animations';
import { closeItemSheet, bindSheetOverlay, openItemSheet } from '@/ui/components/item-sheet';
import { bindHeroOverlay, closeHeroSheet, openHeroSheet } from '@/ui/components/hero-sheet';
import { createDragDrop } from '@/ui/drag-drop';
import { bindCombatBoardTap } from '@/ui/combat-board-tap';
import { bindAllScrollLanes } from '@/ui/scroll-lane';
import { hideDock, showDockShop } from '@/ui/player-dock';
import { createBattleController } from '@/ui/screens/battle-controller';
import { showResultScreen } from '@/ui/screens/result-view';
import { renderShop } from '@/ui/screens/shop-view';
import { $, vibrate } from '@/ui/dom';

export class NightMarketApp {
  private run: RunState | null = null;
  private readonly appEl = $('app');
  private readonly bg = createBackground3D(this.appEl, $('bg3d') as HTMLCanvasElement);
  private readonly fx = createFxSystem(this.appEl, $('fx-canvas') as HTMLCanvasElement);
  private readonly battle = createBattleController(
    () => this.run,
    this.fx,
    this.bg,
    (combat, won) => this.onBattleEnd(combat, won),
  );

  constructor() {
    bindAllScrollLanes();
    this.bindEvents();
    bindSheetOverlay(closeItemSheet);
    bindHeroOverlay(closeHeroSheet);
    titleIntro();
    hideDock();

    createDragDrop({
      getRun: () => this.run,
      isShopActive: () => $('shop-screen').classList.contains('on'),
      onShopChanged: () => this.refreshShop(),
      onTapItem: (it, where) => this.openSheet(it, where),
      onBuyFailed: () => flashGold($('hud-gold')),
      onSell: () => {
        punch($('hud-gold'));
        vibrate([10, 30, 10]);
      },
      onMerge: (it) => this.playMergeFx(it),
    });

    bindCombatBoardTap((uid) => this.battle.openCombatItemSheet(uid));
  }

  private bindEvents(): void {
    $('btn-start').addEventListener('click', () => this.showHeroSelect());
    $('btn-reroll').addEventListener('click', () => this.handleReroll());
    $('btn-fight').addEventListener('click', () => this.battle.start());
    $('btn-speed').addEventListener('click', () => this.cycleSpeed());
    $('dock-avatar').addEventListener('click', () => this.openHeroInfo());
  }

  private openHeroInfo(): void {
    if (!this.run) return;
    openHeroSheet(this.run, closeHeroSheet);
  }

  private showHeroSelect(): void {
    hideDock();
    const container = $('hero-cards');
    container.innerHTML = '';

    for (const hero of HEROES) {
      const el = document.createElement('div');
      el.className = 'hero-card';
      el.innerHTML = `
        <span class="face">${hero.face}</span>
        <div>
          <div class="tag">${hero.tag}</div>
          <h3>${hero.nm}</h3>
          <p>${hero.pass}</p>
        </div>`;
      el.addEventListener('click', () => this.selectHero(hero, el));
      container.appendChild(el);
    }

    showScreen('hero-screen');
  }

  private selectHero(hero: HeroDef, el: HTMLElement): void {
    this.fx.burst(el, '#ffae34', 18);
    punch(el, 1.05);
    setTimeout(() => {
      this.run = createRun(hero);
      this.refreshShop();
      showDockShop();
      showScreen('shop-screen');
      this.bg.setMood('shop');
      shopEntrance();
    }, 170);
  }

  private handleReroll(): void {
    if (!this.run || !rerollShop(this.run)) return;
    rollShop(this.run);
    this.refreshShop();
    shopEntrance();
  }

  private cycleSpeed(): void {
    if (!this.run) return;
    this.run.speed = this.run.speed === 1 ? 2 : this.run.speed === 2 ? 4 : 1;
    $('btn-speed').textContent = `${this.run.speed}×`;
    punch($('btn-speed'));
  }

  private refreshShop(): void {
    if (!this.run) return;
    renderShop(this.run);
  }

  private openSheet(it: ItemInstance, where: 'shop' | 'board'): void {
    openItemSheet(it, this.run, {
      shopMode: true,
      where,
      onClose: closeItemSheet,
      onBuy: (item) => {
        if (!this.run) return;
        const result = buyItem(this.run, item, this.run.board.length);
        if (!result.ok) flashGold($('hud-gold'));
        else if (result.merged) {
          const merged = this.run.board.find((b) => b.uid === this.run!.revealUid);
          if (merged) this.playMergeFx(merged);
        } else {
          vibrate(12);
          this.bg.pulse();
        }
        closeItemSheet();
        this.refreshShop();
      },
      onSell: (item) => {
        if (!this.run) return;
        sellItem(this.run, item);
        punch($('hud-gold'));
        vibrate([10, 30, 10]);
        closeItemSheet();
        this.refreshShop();
      },
    });
  }

  private playMergeFx(it: ItemInstance): void {
    requestAnimationFrame(() => {
      const el = $('board').querySelector(`[data-uid="${it.uid}"]`);
      if (el) {
        punch(el, 1.3);
        this.fx.burst(el as HTMLElement, TIER_COLORS[it.tier], 22);
      }
    });
    vibrate(12);
    this.bg.pulse();
  }

  private onBattleEnd(combat: import('@/game/types').CombatState, won: boolean): void {
    if (!this.run) return;
    hideDock();
    showResultScreen(this.run, combat, won, this.fx, this.bg, {
      onContinue: () => {
        rollShop(this.run!);
        this.refreshShop();
        showDockShop();
        showScreen('shop-screen');
        shopEntrance();
        this.bg.setMood('shop');
        this.battle.stop();
      },
      onRunEnd: () => {
        this.run = null;
        this.battle.stop();
        hideDock();
        this.bg.setMood('shop');
        showScreen('title-screen');
      },
    });
  }
}

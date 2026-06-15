import { HEROES } from '@/data/heroes';
import type { HeroDef, ItemInstance, RunState } from '@/game/types';
import { createRun, rollShop } from '@/game/run-state';
import { buyItem, rerollShop, sellItem } from '@/game/shop-actions';
import { TIER_COLORS } from '@/config/constants';
import { createBackground3D } from '@/fx/background3d';
import { createFxSystem } from '@/fx/particles';
import { initAudioUnlock, sfx } from '@/fx/sfx';
import {
  flashGold,
  punch,
  shopEntrance,
  showScreen,
  titleIntro,
} from '@/fx/animations';
import { closeItemSheet, bindSheetOverlay, openItemSheet, isItemSheetOpen } from '@/ui/components/item-sheet';
import { bindReportOverlay, closeBattleReport } from '@/ui/components/battle-report-sheet';
import { bindHeroOverlay, closeHeroSheet, openHeroSheet } from '@/ui/components/hero-sheet';
import { bindCombatBoardTap } from '@/ui/combat-board-tap';
import { createDragDrop } from '@/ui/drag-drop';
import { showShopOpening } from '@/ui/shop-opening';
import { bindTitleSwipe } from '@/ui/title-swipe';
import { createHeroCarousel, type HeroCarousel } from '@/ui/hero-carousel';
import { bindAllScrollLanes } from '@/ui/scroll-lane';
import { preloadGameImages } from '@/ui/preload';
import { hideDock, showDockShop } from '@/ui/player-dock';
import { createBattleController } from '@/ui/screens/battle-controller';
import { showResultScreen } from '@/ui/screens/result-view';
import { renderShop } from '@/ui/screens/shop-view';
import { $, vibrate } from '@/ui/dom';

export class NightMarketApp {
  private run: RunState | null = null;
  private heroCarousel: HeroCarousel | null = null;
  private readonly appEl = $('app');
  private readonly bg = createBackground3D(this.appEl, $('bg3d') as HTMLCanvasElement);
  private readonly fx = createFxSystem(this.appEl, $('fx-canvas') as HTMLCanvasElement);
  private readonly battle = createBattleController(
    () => this.run,
    this.fx,
    this.bg,
    (combat, won) => this.onBattleEnd(combat, won),
  );
  private readonly titleSwipe = bindTitleSwipe(
    $('title-enter'),
    $('title-enter-thumb'),
    $('title-enter-track'),
    () => this.showHeroSelect(),
  );

  constructor() {
    bindAllScrollLanes();
    initAudioUnlock();
    preloadGameImages();
    this.bindEvents();
    bindSheetOverlay(closeItemSheet);
    bindReportOverlay(closeBattleReport);
    bindHeroOverlay(closeHeroSheet);
    titleIntro();
    hideDock();

    createDragDrop({
      getRun: () => this.run,
      isShopActive: () => $('shop-screen').classList.contains('on'),
      onShopChanged: () => this.refreshShop(),
      onTapItem: (it, where) => this.openSheet(it, where),
      onBuyFailed: () => flashGold($('hud-gold')),
      onBuy: () => sfx.buy(),
      onSell: () => {
        sfx.buy();
        punch($('hud-gold'));
        vibrate([10, 30, 10]);
      },
      onMerge: (it) => this.playMergeFx(it),
    });

    bindCombatBoardTap((uid) => this.battle.openCombatItemSheet(uid));
    this.bg.setMood('shop');
    this.bg.setBackdropMode('title');
  }

  private bindEvents(): void {
    $('btn-reroll').addEventListener('click', () => this.handleReroll());
    $('btn-fight').addEventListener('click', () => this.battle.start());
    $('dock-avatar').addEventListener('click', () => this.openHeroInfo());
    $('btn-pledge').addEventListener('click', () => {
      this.heroCarousel?.confirmActive();
    });
  }

  private openHeroInfo(): void {
    if (!this.run) return;
    openHeroSheet(this.run, closeHeroSheet);
  }

  private showHeroSelect(): void {
    hideDock();

    const nameEl = $('hero-name');
    const classEl = $('hero-class');
    const passEl = $('hero-pass');
    const pledge = $('btn-pledge');
    const heroScreen = $('hero-screen');

    pledge.hidden = true;
    heroScreen.classList.add('hero-screen--intro');

    this.heroCarousel?.destroy();
    this.heroCarousel = createHeroCarousel({
      track: $('hero-coverflow'),
      heroes: HEROES,
      onChange: (slide) => {
        if (slide.kind === 'intro') {
          nameEl.textContent = '';
          classEl.textContent = '';
          passEl.textContent = '';
          pledge.hidden = true;
          heroScreen.classList.add('hero-screen--intro');
        } else {
          nameEl.textContent = slide.hero.nm;
          classEl.textContent = slide.hero.tag;
          passEl.textContent = slide.hero.pass;
          pledge.hidden = false;
          heroScreen.classList.remove('hero-screen--intro');
          pledge.textContent = 'Pledge your loyalty';
        }
      },
      onConfirmHero: (hero, card) => this.selectHero(hero, card),
    });

    this.bg.setBackdropMode('default');
    showScreen('hero-screen');
  }

  private selectHero(hero: HeroDef, el: HTMLElement): void {
    this.fx.burst(el, '#ffae34', 18);
    punch(el, 1.05);
    setTimeout(() => {
      this.heroCarousel?.destroy();
      this.heroCarousel = null;
      this.run = createRun(hero);
      this.refreshShop();
      showScreen('shop-screen', true, true);
      this.bg.setMood('shop');
      showShopOpening(() => {
        showDockShop();
        shopEntrance();
      });
    }, 170);
  }

  private handleReroll(): void {
    if (isItemSheetOpen()) return;
    if (!this.run || !rerollShop(this.run)) return;
    rollShop(this.run);
    this.refreshShop();
    shopEntrance();
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
        else {
          sfx.buy();
          if (result.merged) {
            const merged = this.run.board.find((b) => b.uid === this.run!.revealUid);
            if (merged) this.playMergeFx(merged);
          } else {
            vibrate(12);
            this.bg.pulse();
          }
        }
        closeItemSheet();
        this.refreshShop();
      },
      onSell: (item) => {
        if (!this.run) return;
        if (!sellItem(this.run, item)) return;
        sfx.buy();
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
        this.bg.setBackdropMode('title');
        this.titleSwipe.reset();
        showScreen('title-screen');
        titleIntro();
      },
    });
  }
}

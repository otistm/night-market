import type { RunState } from '@/game/types';
import { animateSheet } from '@/fx/animations';
import { $ } from '@/ui/dom';

export function openHeroSheet(run: RunState, onClose: () => void): void {
  const sheet = $('hero-sheet');
  const hero = run.hero;

  sheet.innerHTML = `
    <div class="grab" aria-hidden="true"></div>
    <div class="sheet-head">
      <h3>
        <span class="big-ico">${hero.face}</span>
        <span class="sheet-title">${hero.nm}</span>
      </h3>
      <div class="hero-tag">${hero.tag}</div>
    </div>
    <div class="sheet-body">
      <div class="desc">${hero.pass}</div>
      <div class="stats">
        <span class="chip">❤ ${run.maxHp} HP</span>
        <span class="chip">Night ${run.day}</span>
      </div>
    </div>
    <div class="sheet-foot">
      <div class="actions">
        <button class="btn ghost" data-action="close">Close</button>
      </div>
    </div>`;

  $('hero-overlay').classList.add('on');
  animateSheet(sheet);
  sheet.querySelector('[data-action="close"]')?.addEventListener('click', onClose);
}

export function closeHeroSheet(): void {
  $('hero-overlay').classList.remove('on');
}

export function bindHeroOverlay(onBackdropClose: () => void): void {
  $('hero-overlay').addEventListener('pointerdown', (e) => {
    if (e.target === $('hero-overlay')) onBackdropClose();
  });
}

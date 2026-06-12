import { $ } from '@/ui/dom';

export type DockMode = 'hidden' | 'shop' | 'battle';

export function setDockMode(mode: DockMode): void {
  const dock = $('player-dock');
  dock.classList.remove('hidden', 'dock-mode-shop', 'dock-mode-battle');

  if (mode === 'hidden') {
    dock.classList.add('hidden');
    return;
  }

  dock.classList.add(mode === 'shop' ? 'dock-mode-shop' : 'dock-mode-battle');
}

export function showDockShop(): void {
  setDockMode('shop');
}

export function showDockBattle(): void {
  setDockMode('battle');
}

export function hideDock(): void {
  setDockMode('hidden');
}

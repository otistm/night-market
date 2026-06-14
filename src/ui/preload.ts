import { ITEMS } from '@/data/items';
import { FIENDS } from '@/data/fiends';

let warmed = false;

/**
 * Warm the browser cache for ware icons and boss art so they don't pop in the
 * first time a shop, stall or battle is shown. Runs during idle time so it never
 * competes with the initial render.
 */
export function preloadGameImages(): void {
  if (warmed) return;
  warmed = true;

  const urls = new Set<string>();
  for (const it of ITEMS) {
    if (it.ico.startsWith('/') || it.ico.startsWith('http')) urls.add(it.ico);
  }
  for (const f of FIENDS) {
    if (f.img) urls.add(f.img);
  }

  const warm = (): void => {
    const img = new Image();
    img.src = '/Images/shop_opening.png';
    for (const url of urls) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    }
  };

  const ric = (window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;

  if (typeof ric === 'function') ric(warm, { timeout: 1500 });
  else setTimeout(warm, 200);
}

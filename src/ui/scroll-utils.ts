function clampScrollLeft(scroller: HTMLElement, left: number): number {
  const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  return Math.min(Math.max(0, left), max);
}

/** Scroll a child element into view within a horizontal scroll container only. */
export function scrollChildIntoView(
  scroller: HTMLElement,
  child: Element,
  behavior: ScrollBehavior = 'smooth',
): void {
  const pad = 12;
  const scrollerRect = scroller.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  const childLeft = childRect.left - scrollerRect.left + scroller.scrollLeft;
  const childRight = childLeft + childRect.width;
  const viewLeft = scroller.scrollLeft;
  const viewRight = viewLeft + scroller.clientWidth;

  if (childLeft < viewLeft + pad) {
    scroller.scrollTo({
      left: clampScrollLeft(scroller, childLeft - pad),
      behavior,
    });
  } else if (childRight > viewRight - pad) {
    scroller.scrollTo({
      left: clampScrollLeft(scroller, childRight - scroller.clientWidth + pad),
      behavior,
    });
  }
}

/** Reset any stray horizontal offset on the app shell (GSAP shake, scroll chaining). */
export function resetAppShellOffset(): void {
  const app = document.getElementById('app');
  if (app) {
    app.style.transform = '';
    app.style.translate = '';
  }

  const shopBody = document.getElementById('shop-body');
  if (shopBody) shopBody.scrollLeft = 0;

  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
}

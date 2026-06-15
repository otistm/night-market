import type { RunState } from '@/game/types';
import { findUpgradePairs } from '@/game/economy';
import { $ } from '@/ui/dom';

const HINT_CLASS = 'upgrade-hint';
const ARROW_CLASS = 'upgrade-arrow';

let layer: HTMLElement | null = null;
let svg: SVGSVGElement | null = null;
let lastRun: RunState | null = null;
let scheduled = false;
let listenersBound = false;

function bindListeners(): void {
  if (listenersBound) return;
  listenersBound = true;

  const redraw = () => scheduleRedraw();
  $('shop-body').addEventListener('scroll', redraw, { passive: true });
  $('shop-carousel-scroll').addEventListener('scroll', redraw, { passive: true });
  $('board').addEventListener('scroll', redraw, { passive: true });
  window.addEventListener('resize', redraw, { passive: true });
}

function ensureLayer(): SVGSVGElement {
  const body = $('shop-body');
  if (!layer || !body.contains(layer)) {
    layer = document.createElement('div');
    layer.id = 'upgrade-hints-layer';
    layer.setAttribute('aria-hidden', 'true');
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    layer.appendChild(svg);
    body.appendChild(layer);
    bindListeners();
  }
  return svg!;
}

function clearHintMarks(): void {
  document.querySelectorAll(`.${HINT_CLASS}`).forEach((el) => {
    el.classList.remove(HINT_CLASS);
    el.querySelector(`.${ARROW_CLASS}`)?.remove();
  });
  if (svg) svg.innerHTML = '';
}

function markElement(el: HTMLElement): void {
  el.classList.add(HINT_CLASS);
  if (!el.querySelector(`.${ARROW_CLASS}`)) {
    const arrow = document.createElement('span');
    arrow.className = ARROW_CLASS;
    arrow.setAttribute('aria-hidden', 'true');
    el.appendChild(arrow);
  }
}

function relCenterBottom(rect: DOMRect, origin: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2 - origin.left,
    y: rect.bottom - origin.top - 6,
  };
}

function relCenterTop(rect: DOMRect, origin: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2 - origin.left,
    y: rect.top - origin.top + 6,
  };
}

function paintPaths(pairs: ReturnType<typeof findUpgradePairs>): void {
  if (!pairs.length) {
    if (svg) svg.innerHTML = '';
    return;
  }

  const body = $('shop-body');
  const bodyRect = body.getBoundingClientRect();
  if (bodyRect.width <= 0 || bodyRect.height <= 0) return;

  const svgEl = ensureLayer();
  svgEl.setAttribute('width', String(bodyRect.width));
  svgEl.setAttribute('height', String(bodyRect.height));
  svgEl.setAttribute('viewBox', `0 0 ${bodyRect.width} ${bodyRect.height}`);

  const defs = `<defs>
    <marker id="upgrade-arrowhead" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
      <path d="M0,0 L7,3.5 L0,7 Z" fill="#ffae34"/>
    </marker>
  </defs>`;

  const paths: string[] = [];
  for (const { shopUid, boardUid } of pairs) {
    const shopEl = document.querySelector(`#carousel [data-uid="${shopUid}"]`);
    const boardEl = document.querySelector(`#board [data-uid="${boardUid}"]`);
    if (!shopEl || !boardEl) continue;

    const from = relCenterBottom(shopEl.getBoundingClientRect(), bodyRect);
    const to = relCenterTop(boardEl.getBoundingClientRect(), bodyRect);
    const midY = (from.y + to.y) / 2;
    const d = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
    paths.push(`<path class="upgrade-hint-path" d="${d}" marker-end="url(#upgrade-arrowhead)"/>`);
  }

  svgEl.innerHTML = defs + paths.join('');
}

function scheduleRedraw(): void {
  if (!lastRun) return;
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    if (!lastRun) return;
    const pairs = findUpgradePairs(lastRun);
    if (!pairs.length) {
      clearHintMarks();
      return;
    }
    paintPaths(pairs);
  });
}

export function updateUpgradeHints(run: RunState): void {
  lastRun = run;
  clearHintMarks();

  const pairs = findUpgradePairs(run);
  if (!pairs.length) return;

  const shopUids = new Set(pairs.map((p) => p.shopUid));
  const boardUids = new Set(pairs.map((p) => p.boardUid));

  for (const uid of shopUids) {
    const el = document.querySelector(`#carousel [data-uid="${uid}"]`);
    if (el instanceof HTMLElement) markElement(el);
  }
  for (const uid of boardUids) {
    const el = document.querySelector(`#board [data-uid="${uid}"]`);
    if (el instanceof HTMLElement) markElement(el);
  }

  requestAnimationFrame(() => paintPaths(pairs));
}

export function clearUpgradeHints(): void {
  lastRun = null;
  clearHintMarks();
}

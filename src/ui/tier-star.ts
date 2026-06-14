import type { Tier } from '@/game/types';

/** Display rarity as 1–4 stars (internal tier 0–3). */
export function tierStarCount(tier: Tier): number {
  return tier + 1;
}

export function tierStarLabel(tier: Tier): string {
  const n = tierStarCount(tier);
  return `${n} star${n > 1 ? 's' : ''}`;
}

/** Single star glyph with the star count centered inside. */
export function tierStarHtml(tier: Tier, extraClass = ''): string {
  const n = tierStarCount(tier);
  const cls = extraClass ? `tier-star ${extraClass}` : 'tier-star';
  return `<span class="${cls}" aria-hidden="true"><span class="tier-star-num">${n}</span></span>`;
}

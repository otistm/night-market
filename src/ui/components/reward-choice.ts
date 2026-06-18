import { reduceMotion } from '@/fx/animations';
import gsap from 'gsap';
import type { ItemInstance, RunState } from '@/game/types';
import { bossBounty } from '@/config/constants';
import { rollBossRewards } from '@/game/run-state';
import { createShopCard, renderStall } from '@/ui/components/cards';
import { sfx } from '@/fx/sfx';
import { $ } from '@/ui/dom';

export interface RewardChoiceOptions {
  run: RunState;
  onDone(): void;
}

interface ActiveReward {
  run: RunState;
  items: ItemInstance[];
  gold: number;
  /** Where `#board` lived before we borrowed it, so we can put it back. */
  boardHome: { parent: HTMLElement; next: ChildNode | null };
  onDone(): void;
  resolved: boolean;
}

let active: ActiveReward | null = null;

/**
 * Offer the post-Lord reward. Everything but the player's real stall is cleared
 * away: the two ware choices appear in the space above the stall as draggable
 * shop cards, and a gold option sits beside them. The player drags a ware into
 * the stall exactly as they buy from the shop (selling/rearranging wares to make
 * room), or takes the gold. Claiming either way restores the stall, closes the
 * overlay and calls `onDone`.
 *
 * The ware cards are real shop cards backed by `run.shop`, so the shared
 * drag-and-drop and `buyItem` flow handle placement/merge — the wares are
 * flagged `free`, so they cost no gold.
 */
export function openRewardChoice({ run, onDone }: RewardChoiceOptions): void {
  const card = $('reward-card');
  const overlay = $('reward-overlay');
  const gold = bossBounty(run.day);
  // Two rewards to choose between: one ware or the gold.
  const items = rollBossRewards(run, 1);

  // Back the cards with the shop so the existing drag-drop can claim them.
  run.shop = items.slice();

  const board = $('board');
  active = {
    run,
    items,
    gold,
    boardHome: { parent: board.parentElement as HTMLElement, next: board.nextSibling },
    onDone,
    resolved: false,
  };

  card.innerHTML = `
    <div class="reward-head">
      <div class="reward-kick">Spoils of the Lord</div>
      <h3 class="reward-title" id="reward-title">Choose your reward</h3>
    </div>
    <div class="reward-choices">
      <div class="reward-wares" id="reward-wares"></div>
      <button type="button" class="reward-gold" id="reward-gold">
        <span class="reward-gold-ico">🪙</span>
        <span class="reward-gold-amt">+${gold}</span>
        <span class="reward-gold-label">Take gold</span>
      </button>
    </div>`;

  const wares = card.querySelector('#reward-wares') as HTMLElement;
  for (const it of items) wares.appendChild(createShopCard(it, run.hero));

  card.setAttribute('aria-labelledby', 'reward-title');
  // Mount the real stall natively beneath the panel (not inside it), so it looks
  // and behaves exactly as it does on the shop and battle screens.
  overlay.appendChild(board);

  (card.querySelector('#reward-gold') as HTMLButtonElement).onclick = () => resolveGold();

  overlay.classList.add('on');
  renderStall(board, run.board);
  refreshRewardChoice();

  if (!reduceMotion) {
    gsap.fromTo(
      card,
      { y: 12, scale: 0.96, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.28, ease: 'power3.out', clearProps: 'transform,opacity' },
    );
  }
}

function resolveGold(): void {
  if (!active || active.resolved) return;
  active.resolved = true;
  active.run.gold += active.gold;
  sfx.buy();
  const onDone = active.onDone;
  closeRewardChoice();
  onDone();
}

/** A ware was dragged into the stall (claimed via buyItem). Wrap things up. */
function resolveClaimed(): void {
  if (!active || active.resolved) return;
  active.resolved = true;
  const onDone = active.onDone;
  closeRewardChoice();
  onDone();
}

/**
 * Called after every stall change while the reward is open. If the ware has left
 * the shop it was claimed (placed or merged into the stall), so we resolve.
 */
export function refreshRewardChoice(): void {
  if (!active || active.resolved) return;
  const { run, items } = active;

  const claimed = items.some((it) => !run.shop.some((s) => s?.uid === it.uid));
  if (claimed) resolveClaimed();
}

export function closeRewardChoice(): void {
  if (active) {
    // Drop any free flags so a claimed ware behaves like a normal stall ware,
    // and clear the borrowed shop slots before the night's real shop rolls.
    for (const it of active.run.board) delete it.free;
    active.run.shop = [];
    // Return the borrowed stall to the shop before anything else renders it.
    const board = $('board');
    active.boardHome.parent.insertBefore(board, active.boardHome.next);
    active = null;
  }
  // Hide the battle arena now so the lords gallery and fade-to-shop never reveal
  // it again — once the reward is chosen, the next thing the player sees is the
  // shop (the battle screen is re-shown only when the next battle begins).
  $('battle-screen').classList.remove('on');
  $('reward-overlay').classList.remove('on');
}

export function isRewardChoiceOpen(): boolean {
  return $('reward-overlay').classList.contains('on');
}

export function bindRewardOverlay(): void {
  // The reward is modal and must be claimed via a ware or the gold button; the
  // backdrop intentionally does nothing so dragging wares in the embedded stall
  // can't accidentally dismiss the choice.
}

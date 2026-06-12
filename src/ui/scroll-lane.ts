import { toggleScrollable } from '@/ui/components/cards';

const NUDGE_RATIO = 0.72;

function nudge(track: HTMLElement, direction: -1 | 1): void {
  track.scrollBy({ left: direction * track.clientWidth * NUDGE_RATIO, behavior: 'smooth' });
}

export function bindScrollLane(track: HTMLElement): void {
  const lane = track.closest('.scroll-lane') as HTMLElement | null;
  if (!lane || lane.dataset.bound === '1') return;
  lane.dataset.bound = '1';

  lane.querySelector('.scroll-nudge.prev')?.addEventListener('click', () => nudge(track, -1));
  lane.querySelector('.scroll-nudge.next')?.addEventListener('click', () => nudge(track, 1));
}

export function bindAllScrollLanes(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.scroll-lane__track').forEach((track) => {
    bindScrollLane(track);
    toggleScrollable(track);
  });
}

export function refreshScrollLane(track: HTMLElement): void {
  toggleScrollable(track);
}

import { $ } from '@/ui/dom';

const TAP_THRESHOLD = 10;

export function bindCombatBoardTap(onTap: (uid: number) => void): { destroy(): void } {
  let active: { uid: number; sx: number; sy: number; moved: boolean } | null = null;

  function onPointerDown(e: PointerEvent): void {
    if (!$('battle-screen').classList.contains('on')) return;
    const item = (e.target as Element).closest<HTMLElement>('.cboard .item');
    if (!item?.dataset.uid) return;
    active = { uid: +item.dataset.uid, sx: e.clientX, sy: e.clientY, moved: false };
  }

  function onPointerMove(e: PointerEvent): void {
    if (!active) return;
    if (
      Math.abs(e.clientX - active.sx) > TAP_THRESHOLD ||
      Math.abs(e.clientY - active.sy) > TAP_THRESHOLD
    ) {
      active.moved = true;
    }
  }

  function onPointerUp(): void {
    if (!active) return;
    const { uid, moved } = active;
    active = null;
    if (!moved) onTap(uid);
  }

  function onPointerCancel(): void {
    active = null;
  }

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);

  return {
    destroy() {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerCancel);
    },
  };
}

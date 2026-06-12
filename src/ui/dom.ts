export function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

export function query<T extends HTMLElement = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector<T>(selector);
}

export function queryAll<T extends HTMLElement = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] {
  return [...root.querySelectorAll<T>(selector)];
}

export function hit(el: HTMLElement, clientX: number, clientY: number): boolean {
  const r = el.getBoundingClientRect();
  return (
    clientX >= r.left &&
    clientX <= r.right &&
    clientY >= r.top - 16 &&
    clientY <= r.bottom + 16
  );
}

export function relPos(el: HTMLElement, app: HTMLElement): { x: number; y: number } {
  const appRect = app.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    x: r.left - appRect.left + r.width / 2,
    y: r.top - appRect.top + r.height / 2,
  };
}

export function vibrate(pattern: number | number[]): void {
  navigator.vibrate?.(pattern);
}

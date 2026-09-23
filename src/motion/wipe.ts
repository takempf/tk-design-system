import { flushSync } from 'react-dom';

/**
 * Swap something page-wide — usually the theme — behind a view transition that
 * reveals the new state from `origin` (a click position). The only transition
 * here that captures the whole page; the rest of the system animates elements.
 */
export function wipe(
  update: () => void,
  origin?: { readonly x: number; readonly y: number },
): void {
  const root = document.documentElement;
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  const x = origin?.x ?? innerWidth / 2;
  const y = origin?.y ?? innerHeight / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty('--tk-wipe-x', `${x}px`);
  root.style.setProperty('--tk-wipe-y', `${y}px`);
  root.style.setProperty('--tk-wipe-r', `${radius}px`);
  root.dataset.tkWipe = '';
  const transition = document.startViewTransition(() => flushSync(update));
  transition.finished.finally(() => {
    delete root.dataset.tkWipe;
  });
}

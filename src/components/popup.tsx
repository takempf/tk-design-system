import { type RefObject, useCallback, useState } from 'react';
import { morph } from '../motion/morph';

/**
 * A positioner `sideOffset` that pulls the popup back over its trigger: its near
 * edge lands on the trigger's near edge, so the popup's first row (last, when it
 * opens upward) covers the trigger and the popup grows out of it.
 */
export const overTrigger = ({
  side,
  anchor,
}: {
  side: string;
  anchor: { width: number; height: number };
}) => -(side === 'top' || side === 'bottom' ? anchor.height : anchor.width);

/** The trigger's fill, edge and corners as they settle, not part-way through a transition. */
function lookOf(trigger: HTMLElement) {
  const { transition } = trigger.style;
  trigger.style.transition = 'none';
  const style = getComputedStyle(trigger);
  const look = {
    bg: style.backgroundColor,
    border: style.borderTopColor,
    radius: style.borderTopLeftRadius,
  };
  trigger.style.transition = transition;
  return look;
}

const inMorph = () => {
  try {
    return document.documentElement.matches(':active-view-transition');
  } catch {
    return false;
  }
};

/**
 * For the popup's ref: makes the popup and its trigger one frame. The popup is
 * marked `data-tk-grow` and keeps the trigger's box (in the popup's own
 * coordinates) and look as `--tk-from-*`, so CSS can move the frame from the
 * trigger's place to the popup's and back, its fill and edge changing on the
 * way. Laid over its trigger the frame starts as the trigger itself; set apart
 * from it, it fades in as it leaves (`--tk-from-opacity`).
 *
 * Without a `trigger`, it is the element whose `aria-controls` names the popup.
 * `whenMorphing: false` leaves a popup opened inside a `morph()` to that morph.
 *
 * Base UI places the popup after it mounts and resizes it as the list scrolls,
 * so every style change on the popup or its positioner re-measures — before
 * paint, as a mutation record — and opening and closing read the trigger's
 * look again.
 */
export function useGrowFrom(
  trigger?: RefObject<HTMLElement | null>,
  { whenMorphing = true }: { whenMorphing?: boolean } = {},
) {
  return useCallback(
    (popup: HTMLElement | null) => {
      if (!popup || (!whenMorphing && inMorph())) return;
      const find = () =>
        trigger?.current ??
        (popup.id
          ? document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(popup.id)}"]`)
          : null);
      let last = '';
      const place = () => {
        const from = find()?.getBoundingClientRect();
        if (!from?.width || !from.height) return;
        const box = popup.getBoundingClientRect();
        const x = from.left - box.left;
        const y = from.top - box.top;
        // Laid over the trigger when the popup's box holds the trigger's (to a pixel).
        const over = x > -1 && y > -1 && from.right < box.right + 1 && from.bottom < box.bottom + 1;
        const values = [x, y, from.width, from.height].map((n) => `${n}px`);
        // Our own writes are style changes too; stop once nothing moves.
        const key = `${values.join()} ${over}`;
        if (key === last) return;
        last = key;
        ['x', 'y', 'w', 'h'].forEach((name, i) => {
          popup.style.setProperty(`--tk-from-${name}`, values[i]!);
        });
        popup.style.setProperty('--tk-from-opacity', over ? '1' : '0');
        popup.dataset.tkGrow = '';
      };
      const look = () => {
        const from = find();
        if (!from) return;
        const { bg, border, radius } = lookOf(from);
        popup.style.setProperty('--tk-from-bg', bg);
        popup.style.setProperty('--tk-from-border', border);
        popup.style.setProperty('--tk-from-radius', radius);
      };
      look();
      place();
      // A select stays mounted between openings, so each opening looks again too.
      const turns = ['data-starting-style', 'data-ending-style'];
      const watch = new MutationObserver((records) => {
        if (records.some((record) => turns.includes(record.attributeName!))) look();
        place();
      });
      watch.observe(popup, { attributes: true, attributeFilter: ['style', ...turns] });
      if (popup.parentElement) {
        watch.observe(popup.parentElement, { attributes: true, attributeFilter: ['style'] });
      }
      return () => watch.disconnect();
    },
    [trigger, whenMorphing],
  );
}

/**
 * Popup open state that changes inside morph(), so named <Morph>s on both sides
 * of the change (trigger ↔ popup) animate between each other. `onOpen: false`
 * morphs only on close, for popups that open with nothing to carry. Anything
 * after `open` (Base UI's event details) is handed on to `onOpenChange`.
 */
export function useMorphingOpen<Rest extends unknown[] = []>(
  open: boolean | undefined,
  onOpenChange: ((open: boolean, ...rest: Rest) => void) | undefined,
  scope: string,
  { onOpen = true, initial = false }: { onOpen?: boolean; initial?: boolean } = {},
) {
  const [inner, setInner] = useState(initial);
  const current = open ?? inner;
  const set = (next: boolean, ...rest: Rest) => {
    const update = () => {
      setInner(next);
      onOpenChange?.(next, ...rest);
    };
    if (next && !onOpen) update();
    else morph(update, { type: next ? 'open' : 'close', scope });
  };
  return [current, set] as const;
}

/** Controlled-or-uncontrolled value, like every Base UI root. */
export function useControllable<T>(value: T | undefined, defaultValue: T) {
  const [inner, setInner] = useState(defaultValue);
  return [value === undefined ? inner : value, setInner] as const;
}

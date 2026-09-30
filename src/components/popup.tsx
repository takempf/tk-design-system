import { type RefObject, useCallback, useRef, useState } from 'react';
import { morph } from '../motion/morph';

const sides = ['top', 'right', 'bottom', 'left'] as const;

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

/**
 * For a popup laid over its trigger: keeps `--tk-unfold-{top,right,bottom,left}`
 * on the popup at the trigger's box, in the popup's own coordinates, so CSS can
 * open the popup out of the trigger and fold it back in. Base UI places the popup
 * after it mounts and resizes it as the list scrolls, so every style change on
 * the popup or its positioner re-measures — before paint, as a mutation record.
 */
export function useUnfoldFrom(trigger: RefObject<HTMLElement | null>) {
  const observer = useRef<MutationObserver | null>(null);
  return useCallback(
    (popup: HTMLElement | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!popup) return;
      let last = '';
      const place = () => {
        const from = trigger.current?.getBoundingClientRect();
        if (!from) return;
        const box = popup.getBoundingClientRect();
        const insets = [
          from.top - box.top,
          box.right - from.right,
          box.bottom - from.bottom,
          from.left - box.left,
        ].map((inset) => `${Math.max(0, inset)}px`);
        // Our own writes are style changes too; stop once nothing moves.
        if (insets.join() === last) return;
        last = insets.join();
        sides.forEach((side, i) => {
          popup.style.setProperty(`--tk-unfold-${side}`, insets[i]!);
        });
      };
      place();
      const watch = new MutationObserver(place);
      for (const element of [popup, popup.parentElement]) {
        if (element) watch.observe(element, { attributes: true, attributeFilter: ['style'] });
      }
      observer.current = watch;
      return () => {
        watch.disconnect();
        observer.current = null;
      };
    },
    [trigger],
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

import { useState } from 'react';
import { PopupMorph, type PopupMorphPartProps } from '../motion/popupMorph';

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

/** Controlled-or-uncontrolled value, like every Base UI root. */
export function useControllable<T>(value: T | undefined, defaultValue: T) {
  const [inner, setInner] = useState(defaultValue);
  return [value === undefined ? inner : value, setInner] as const;
}

/**
 * Something shown in both a trigger and its popup (an icon, a picture, a
 * title), carried from one to the other above the container. Pair
 * `side="trigger"` with `side="popup"` under one `name`. It scales by default;
 * `fit="text"` keeps letters at their size.
 */
export function SharedElement({ fit = 'box', ...props }: PopupMorphPartProps) {
  return <PopupMorph.Part fit={fit} {...props} />;
}

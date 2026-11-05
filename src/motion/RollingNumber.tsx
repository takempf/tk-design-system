import { useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../utils';
import { reducedMotion } from './reducedMotion';

/** The most numbers a roll shows on its way, its first and last among them. */
const MAX_STEPS = 12;
/** How long the number stays green or red once it's arrived, before it fades back. */
const HOLD_MS = 900;
/** easeOutQuart: quick to start, settling into the number it arrives at. */
const EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';

/**
 * How long a roll takes: 700ms for a step of one, longer the further it goes
 * (1.1s for two, about 2.1s for ten), up to 2.6s.
 */
export const rollDuration = (delta: number): number =>
  Math.min(2600, 700 + 400 * Math.log2(Math.max(1, Math.abs(delta))));

/**
 * The numbers a roll from `from` to `to` passes, in order: each one on the
 * way, or for a long way, `MAX_STEPS` of them spread evenly along it.
 */
export function rollSteps(from: number, to: number): number[] {
  const distance = Math.abs(to - from);
  if (distance < MAX_STEPS)
    return Array.from({ length: distance + 1 }, (_, step) => from + Math.sign(to - from) * step);
  const steps = Array.from({ length: MAX_STEPS }, (_, step) =>
    Math.round(from + ((to - from) * step) / (MAX_STEPS - 1)),
  );
  return steps.filter((step, index) => step !== steps[index - 1]);
}

interface Roll {
  from: number;
  to: number;
  /** The numbers on the way, from `from` to `to`. */
  steps: number[];
}

export interface RollingNumberProps {
  readonly value: number;
  readonly className?: string;
}

/**
 * A number that rolls to its new value when it changes, sliding up through
 * the numbers on the way when it goes up and down when it goes down, green or
 * red until a moment after it arrives. A longer way takes longer. Its first
 * value just shows; with reduced motion, a change only colors it.
 */
export function RollingNumber({ value, className }: RollingNumberProps) {
  const previous = useRef(value);
  const strip = useRef<HTMLSpanElement>(null);
  const [roll, setRoll] = useState<Roll | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);

  // A change rolls from the number it was last headed to.
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    setTrend(value > from ? 'up' : 'down');
    setRoll(reducedMotion() ? null : { from, to: value, steps: rollSteps(from, value) });
  }, [value]);

  // Roll the strip to the new number, then show it alone.
  useLayoutEffect(() => {
    const element = strip.current;
    if (!roll || !element) return;
    // Up, the strip runs from → to downward and slides up; down, the other way.
    const span = (100 * (roll.steps.length - 1)) / roll.steps.length;
    const [start, end] = roll.to > roll.from ? [0, -span] : [-span, 0];
    const animation = element.animate(
      [{ transform: `translateY(${start}%)` }, { transform: `translateY(${end}%)` }],
      { duration: rollDuration(roll.to - roll.from), easing: EASING, fill: 'forwards' },
    );
    animation.finished.then(
      () => setRoll(null),
      () => {},
    );
    return () => animation.cancel();
  }, [roll]);

  // Once it's arrived, its color holds a moment, then fades back.
  useLayoutEffect(() => {
    if (!trend || roll) return;
    const hold = setTimeout(() => setTrend(null), HOLD_MS);
    return () => clearTimeout(hold);
  }, [trend, roll]);

  const shown = roll && roll.to < roll.from ? [...roll.steps].reverse() : (roll?.steps ?? []);
  // While it rolls, the widest number on the way holds the space, so none is cut off.
  const held = roll
    ? roll.steps.map(String).reduce((wide, step) => (step.length > wide.length ? step : wide))
    : String(value);
  return (
    <span className={cx('tk-rolling-number', className)} data-trend={trend ?? undefined}>
      <span className="tk-visually-hidden">{value}</span>
      <span
        className="tk-rolling-number-held"
        data-rolling={roll ? '' : undefined}
        aria-hidden="true"
      >
        {held}
      </span>
      {roll && (
        <span ref={strip} className="tk-rolling-number-strip" aria-hidden="true">
          {shown.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </span>
      )}
    </span>
  );
}

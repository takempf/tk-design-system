import { type ReactElement, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../utils';
import { reducedMotion } from './reducedMotion';

/** How long the number stays green or red once it's arrived, before it fades back. */
const HOLD_MS = 900;
/** easeOutQuart: quick to start, settling into the number it arrives at. */
const EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
/** Holds a line's height where a place has no character, as a digit appears or goes. */
const BLANK = '​';

/**
 * How long a roll takes, by the most steps any place rolls: 700ms for one,
 * longer the further it goes (1.1s for two, about 2s for nine), up to 2.6s.
 */
export const rollDuration = (steps: number): number =>
  Math.min(2600, 700 + 400 * Math.log2(Math.max(1, Math.abs(steps))));

/**
 * One place in a number as it rolls, from the left: a character that stays,
 * or the characters a changing one rolls through, from its old one to its new.
 */
export type RollPlace = string | string[];

/**
 * The places of a roll from `from` to `to`, lined up from the right. A digit
 * that stays holds still. One that changes rolls through the digits on its way,
 * upward as the number grows (9 turning over to 0) and downward as it shrinks.
 * A place only one number has rolls in from blank or out to it ('').
 */
export function rollPlaces(from: number, to: number): RollPlace[] {
  const before = Array.from(String(from));
  const after = Array.from(String(to));
  const width = Math.max(before.length, after.length);
  const pad = (chars: string[]): string[] => [
    ...Array.from({ length: width - chars.length }, () => ''),
    ...chars,
  ];
  const was = pad(before);
  const growing = Math.abs(to) >= Math.abs(from);
  return pad(after).map((char, index) => {
    const old = was[index] ?? '';
    if (old === char) return char;
    if (!/\d/.test(old) || !/\d/.test(char)) return [old, char];
    const steps = [old];
    for (let digit = Number(old); String(digit) !== char; ) {
      digit = (digit + (growing ? 1 : 9)) % 10;
      steps.push(String(digit));
    }
    return steps;
  });
}

function animateStrip(
  strip: HTMLSpanElement,
  stepsCount: number,
  growing: boolean,
  duration: number,
): Animation {
  const span = (100 * (stepsCount - 1)) / stepsCount;
  const [start, end] = growing ? [0, -span] : [-span, 0];
  return strip.animate(
    [{ transform: `translateY(${start}%)` }, { transform: `translateY(${end}%)` }],
    { duration, easing: EASING, fill: 'forwards' },
  );
}

function animatePlaceWidth(
  node: HTMLSpanElement,
  steps: string[],
  duration: number,
): Animation | null {
  const isEntering = steps[0] === '';
  const isLeaving = steps[steps.length - 1] === '';
  if (!isEntering && !isLeaving) return null;

  const fullWidth = node.getBoundingClientRect().width;
  if (fullWidth <= 0) return null;

  const keyframes = isEntering
    ? [
        { width: '0px', opacity: 0 },
        { width: `${fullWidth}px`, opacity: 1 },
      ]
    : [
        { width: `${fullWidth}px`, opacity: 1 },
        { width: '0px', opacity: 0 },
      ];

  return node.animate(keyframes, {
    duration,
    easing: EASING,
    fill: 'forwards',
  });
}

interface Roll {
  readonly places: RollPlace[];
  /** Whether the places roll upward through their digits, the number growing. */
  readonly growing: boolean;
}

export interface RollingNumberProps {
  readonly value: number;
  readonly className?: string;
}

/**
 * A number that rolls to its new value when it changes, like an odometer: only
 * the digits that change move, each sliding through the digits on its way, up
 * as the number grows and down as it shrinks, green or red until a moment after
 * it arrives. Digits that stay hold still; entering and leaving places smoothly
 * transition their width so digits never jump.
 */
export function RollingNumber({ value, className }: RollingNumberProps): ReactElement {
  const previous = useRef(value);
  const places = useRef<(HTMLSpanElement | null)[]>([]);
  const strips = useRef<(HTMLSpanElement | null)[]>([]);
  const [roll, setRoll] = useState<Roll | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);

  // A change rolls from the number it was last headed to.
  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;
    setTrend(value > from ? 'up' : 'down');
    setRoll(
      reducedMotion()
        ? null
        : { places: rollPlaces(from, value), growing: Math.abs(value) >= Math.abs(from) },
    );
  }, [value]);

  // Roll each changing place to its new digit and smoothly transition place widths.
  useLayoutEffect(() => {
    if (!roll) return;
    const rolling = roll.places.filter((place): place is string[] => Array.isArray(place));
    const duration = rollDuration(Math.max(...rolling.map((steps) => steps.length - 1)));
    const animations: Animation[] = [];

    rolling.forEach((steps, index) => {
      const strip = strips.current[index];
      if (strip && typeof strip.animate === 'function') {
        animations.push(animateStrip(strip, steps.length, roll.growing, duration));
      }
      const placeNode = places.current[index];
      if (placeNode && typeof placeNode.animate === 'function') {
        const placeAnim = animatePlaceWidth(placeNode, steps, duration);
        if (placeAnim) animations.push(placeAnim);
      }
    });

    let current = true;
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        if (current) setRoll(null);
      },
      () => {},
    );
    return () => {
      current = false;
      for (const animation of animations) animation.cancel();
    };
  }, [roll]);

  // Once it's arrived, its color holds a moment, then fades back.
  useLayoutEffect(() => {
    if (!trend || roll) return;
    const hold = setTimeout(() => setTrend(null), HOLD_MS);
    return () => clearTimeout(hold);
  }, [trend, roll]);

  let changingPlaceIndex = 0;
  return (
    <span className={cx('tk-rolling-number', className)} data-trend={trend ?? undefined}>
      <span className="tk-visually-hidden">{value}</span>
      <span aria-hidden="true">
        {roll
          ? roll.places.map((place, index) => {
              // Places are keyed from the right, where digits line up between numbers.
              const key = roll.places.length - index;
              if (!Array.isArray(place)) return <span key={key}>{place}</span>;
              const at = changingPlaceIndex++;
              const shown = roll.growing ? place : [...place].reverse();
              // The place holds the widest of its characters, so none is cut off.
              const held = place.find((char) => /\d/.test(char)) ?? place.find(Boolean) ?? '';
              const entering = place[0] === '';
              const leaving = place[place.length - 1] === '';
              return (
                <span
                  key={key}
                  ref={(node) => {
                    places.current[at] = node;
                  }}
                  className="tk-rolling-number-place"
                  data-entering={entering ? '' : undefined}
                  data-leaving={leaving ? '' : undefined}
                >
                  <span className="tk-rolling-number-held">{held || BLANK}</span>
                  <span
                    ref={(node) => {
                      strips.current[at] = node;
                    }}
                    className="tk-rolling-number-strip"
                  >
                    {shown.map((char, step) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: a strip's characters repeat (9 → 0 → 9) and never reorder
                      <span key={step}>{char || BLANK}</span>
                    ))}
                  </span>
                </span>
              );
            })
          : value}
      </span>
    </span>
  );
}

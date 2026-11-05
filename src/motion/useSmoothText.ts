import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from './reducedMotion';

export interface SmoothTextOptions {
  /** Characters a second at an even pace; it speeds up the further it falls behind. */
  readonly cps?: number;
  /** False shows the text at once. With reduced motion it always does. */
  readonly enabled?: boolean;
}

export interface SmoothText {
  /** As much of the text as has been revealed. */
  readonly text: string;
  /** Whether all of it has. */
  readonly done: boolean;
}

/**
 * Reveal `target` at a steady pace, however it arrives. A model streams in
 * bursts; this smooths them into an even typewriter, and catches up when it
 * falls far behind. Text that stops starting with what's shown starts over.
 */
export function useSmoothText(
  target: string,
  { cps = 70, enabled = true }: SmoothTextOptions = {},
): SmoothText {
  const [shown, setShown] = useState(enabled ? 0 : target.length);
  const shownRef = useRef(shown);
  const previous = useRef(target);

  useEffect(() => {
    if (!target.startsWith(previous.current.slice(0, shownRef.current))) {
      shownRef.current = 0;
      setShown(0);
    }
    previous.current = target;
    if (!enabled || reducedMotion()) {
      shownRef.current = target.length;
      setShown(target.length);
      return;
    }
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number): void => {
      const backlog = target.length - shownRef.current;
      if (backlog <= 0) return;
      const rate = cps * (1 + backlog / 160);
      carry += ((now - last) / 1000) * rate;
      last = now;
      const step = Math.floor(carry);
      if (step > 0) {
        carry -= step;
        shownRef.current = Math.min(target.length, shownRef.current + step);
        setShown(shownRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, cps, enabled]);

  const count = Math.min(shown, target.length);
  return { text: target.slice(0, count), done: count >= target.length };
}

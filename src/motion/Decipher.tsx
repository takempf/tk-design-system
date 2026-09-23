import { type ElementType, useLayoutEffect, useRef } from 'react';
import { cx } from '../utils';

export interface DecipherProps {
  readonly children: string;
  readonly as?: ElementType;
  readonly className?: string;
  /** Milliseconds for the whole string to resolve. Defaults from the theme's motion. */
  readonly duration?: number;
  /** Resolve on first mount too, not only when the text changes. */
  readonly initial?: boolean;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const readGlyphs = (element: Element): string[] => {
  const raw = getComputedStyle(element).getPropertyValue('--tk-decipher-glyphs').trim();
  const glyphs = Array.from(raw.replace(/^['"]|['"]$/g, '').replace(/\\\\/g, '\\'));
  return glyphs.length ? glyphs : ['·'];
};

const readDuration = (element: Element): number => {
  const raw = getComputedStyle(element).getPropertyValue('--tk-duration-3').trim();
  const value = Number.parseFloat(raw);
  return (raw.endsWith('ms') ? value : value * 1000) * 2.4 || 600;
};

/**
 * Text that resolves through the theme's glyphs (shapes in Grove, digits in Bureau)
 * when it changes. The real text keeps its space and stays readable to assistive
 * tech; the scramble is a presentational layer over it.
 */
export function Decipher({
  children,
  as: Tag = 'span',
  className,
  duration,
  initial = false,
}: DecipherProps) {
  const overlay = useRef<HTMLSpanElement>(null);
  const previous = useRef<string | null>(initial ? '' : children);

  useLayoutEffect(() => {
    const node = overlay.current;
    const from = previous.current;
    previous.current = children;
    if (!node || from === children || reducedMotion()) {
      if (node) node.textContent = '';
      return;
    }
    const glyphs = readGlyphs(node);
    const total = duration ?? readDuration(node);
    const target = Array.from(children);
    // Each character settles at its own moment, left to right with some jitter.
    const settle = target.map(
      (_, i) => (i / Math.max(1, target.length)) * 0.7 + Math.random() * 0.3,
    );
    const start = performance.now();
    let frame = 0;
    let lastPaint = 0;
    const paint = (now: number) => {
      const t = (now - start) / total;
      if (t >= 1) {
        node.textContent = '';
        return;
      }
      if (now - lastPaint > 45) {
        lastPaint = now;
        node.textContent = target
          .map((char, i) =>
            char.trim() === '' || t >= settle[i]!
              ? char
              : glyphs[Math.floor(Math.random() * glyphs.length)],
          )
          .join('');
      }
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => {
      cancelAnimationFrame(frame);
      node.textContent = '';
    };
  }, [children, duration]);

  return (
    <Tag className={cx('tk-decipher', className)}>
      <span className="tk-decipher-text">{children}</span>
      <span ref={overlay} className="tk-decipher-overlay" aria-hidden="true" />
    </Tag>
  );
}

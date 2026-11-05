import { type ElementType, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '../utils';
import { reducedMotion } from './reducedMotion';

/** How text deciphers where it sits, from the theme's `--tk-decipher-*` tokens. */
export interface DecipherSettings {
  /** The glyphs a glitching letter cycles through (`--tk-decipher-glyphs`). */
  readonly glyphs: readonly string[];
  /** About how many of a word's letters glitch, from 0 to 1; at least one does (`--tk-decipher-share`). */
  readonly share: number;
  /** Milliseconds between a glitching letter's glyphs (`--tk-decipher-flicker`). */
  readonly flicker: number;
  /** Milliseconds for a word to settle (`--tk-decipher-duration`). */
  readonly duration: number;
}

/** The base theme's settings, for where there are no styles to read. */
export const decipherDefaults: DecipherSettings = {
  glyphs: ['·'],
  share: 0.35,
  flicker: 120,
  duration: 650,
};

/** Milliseconds from a CSS time (`650ms`, `0.65s`), or `fallback`. */
const readTime = (raw: string, fallback: number): number => {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith('ms') || !raw.endsWith('s') ? value : value * 1000;
};

/** The decipher settings the theme gives `element`. */
export function readDecipher(element: Element): DecipherSettings {
  if (typeof getComputedStyle !== 'function') return decipherDefaults;
  const style = getComputedStyle(element);
  const read = (name: string): string => style.getPropertyValue(name).trim();
  const glyphs = Array.from(
    read('--tk-decipher-glyphs')
      .replace(/^['"]|['"]$/g, '')
      .replace(/\\\\/g, '\\'),
  );
  const share = Number.parseFloat(read('--tk-decipher-share'));
  return {
    glyphs: glyphs.length ? glyphs : decipherDefaults.glyphs,
    share: Number.isFinite(share) ? Math.min(1, Math.max(0, share)) : decipherDefaults.share,
    flicker: Math.max(16, readTime(read('--tk-decipher-flicker'), decipherDefaults.flicker)),
    duration: Math.max(0, readTime(read('--tk-decipher-duration'), decipherDefaults.duration)),
  };
}

/**
 * A word that glitches in when it first shows: a share of its letters cycle
 * through the theme's glyphs, faint in `--tk-decipher-ink`, and settle one by
 * one. The word keeps its place and stays readable to assistive tech; the
 * glitch is a layer over it, clipped to it, so a wide glyph never moves the line.
 */
function GlitchWord({
  children,
  duration,
}: {
  readonly children: string;
  readonly duration?: number;
}) {
  const layer = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const overlay = layer.current;
    if (!overlay || reducedMotion()) return;
    const settings = readDecipher(overlay);
    const total = duration ?? settings.duration;
    const { glyphs } = settings;
    const glyph = (): string => glyphs[Math.floor(Math.random() * glyphs.length)] ?? '·';
    const letters = Array.from(children);
    const order = letters.map((_, index) => index).sort(() => Math.random() - 0.5);
    const glitching = new Set(
      order.slice(0, Math.max(1, Math.round(letters.length * settings.share))),
    );
    // The overlay is the word, with a glyph in place of each glitching letter.
    const glitches: { span: HTMLSpanElement; letter: string; settles: number }[] = [];
    overlay.replaceChildren(
      ...letters.map((letter, index) => {
        if (!glitching.has(index)) return letter;
        const span = document.createElement('span');
        span.className = 'tk-decipher-glyph';
        span.textContent = glyph();
        glitches.push({ span, letter, settles: total * (0.35 + Math.random() * 0.65) });
        return span;
      }),
    );
    const start = performance.now();
    const timer = setInterval(() => {
      const elapsed = performance.now() - start;
      let left = 0;
      for (const item of glitches) {
        if (elapsed >= item.settles) item.span.replaceWith(item.letter);
        else {
          item.span.textContent = glyph();
          left += 1;
        }
      }
      if (!left) {
        clearInterval(timer);
        overlay.replaceChildren();
      }
    }, settings.flicker);
    return () => {
      clearInterval(timer);
      overlay.replaceChildren();
    };
  }, [children, duration]);

  return (
    <span className="tk-decipher-word">
      <span className="tk-decipher-word-text">{children}</span>
      <span ref={layer} className="tk-decipher-word-overlay" aria-hidden="true" />
    </span>
  );
}

/**
 * Text word by word, each word glitching in when it first shows. Whitespace
 * stays outside the words, so prose wraps across lines as it would anyway.
 * Words are kept by position, so text that grows at its end glitches in only
 * its new words.
 */
export function DecipherWords({
  children,
  duration,
}: {
  readonly children: string;
  /** Milliseconds for each word to settle. Defaults to the theme's. */
  readonly duration?: number;
}) {
  const tokens = children.match(/\S+|\s+/g);
  if (!tokens) return <>{children}</>;

  return (
    <>
      {tokens.map((token, index) =>
        /^\s+$/.test(token) ? (
          token
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: text only grows at its end, so a word's position is its identity
          <GlitchWord key={index} duration={duration}>
            {token}
          </GlitchWord>
        ),
      )}
    </>
  );
}

export interface DecipherProps {
  readonly children: string;
  readonly as?: ElementType;
  readonly className?: string;
  /** Milliseconds for each word to settle. Defaults to the theme's `--tk-decipher-duration`. */
  readonly duration?: number;
  /** Decipher on first mount too, not only when the text changes. */
  readonly initial?: boolean;
}

/**
 * Text that deciphers when it changes: every word glitches in through the
 * theme's glyphs (shapes in Grove, digits in Bureau) and settles, as the
 * `--tk-decipher-*` tokens set it.
 */
export function Decipher({
  children,
  as: Tag = 'span',
  className,
  duration,
  initial = false,
}: DecipherProps) {
  // Each change of text is a new turn, and every word of it glitches in afresh.
  const [shown, setShown] = useState({ text: children, turn: initial ? 1 : 0 });
  if (shown.text !== children) setShown({ text: children, turn: shown.turn + 1 });

  return (
    <Tag className={cx('tk-decipher', className)}>
      {shown.turn ? (
        <DecipherWords key={shown.turn} duration={duration}>
          {children}
        </DecipherWords>
      ) : (
        children
      )}
    </Tag>
  );
}

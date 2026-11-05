import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { readGlyphs } from './Decipher';
import { reducedMotion } from './reducedMotion';

/** Milliseconds for each streamed word to settle. */
const WORD_MS = 650;
/** Milliseconds between a glitching letter's glyphs. */
const FLICKER_MS = 120;
/** About how many of a word's letters glitch: at least one. */
const GLITCHING = 0.35;

/**
 * `text` up to its last whole word, for text still arriving. A word resolves
 * once, when it first shows, and starts over whenever its text changes, so a
 * word shown as it types in would scramble again with every letter. Holding
 * it back until the space after it arrives lets each word resolve once.
 */
export const wholeWords = (text: string): string => text.slice(0, text.search(/\s\S*$/) + 1);

export interface StreamDecipherOptions {
  /** Milliseconds for each word to settle. */
  readonly duration?: number;
  /** False shows the text plainly, as when it should arrive without motion. */
  readonly enabled?: boolean;
}

/**
 * Whether streamed text deciphers: while it is `streaming`, and for one word's
 * settle afterward, so its last words finish resolving instead of snapping to
 * plain text on the last frame. Never with reduced motion.
 */
export function useStreamDecipher(
  streaming: boolean,
  { duration = WORD_MS, enabled = true }: StreamDecipherOptions = {},
): boolean {
  const on = enabled && !reducedMotion();
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    if (!on) {
      setSettling(false);
      return;
    }
    if (streaming) {
      setSettling(true);
      return;
    }
    const timer = setTimeout(() => setSettling(false), duration);
    return () => clearTimeout(timer);
  }, [streaming, on, duration]);

  return on && (streaming || settling);
}

/**
 * A word that glitches in when it first shows: a few of its letters cycle
 * slowly through the theme's glyphs, in `--tk-decipher-ink`, and settle one by
 * one over `duration`. Like <Decipher>, the word keeps its place and stays
 * readable to assistive tech, and the glitch is a layer over it; this one is
 * smaller and slower, for text that arrives a word at a time.
 */
function GlitchWord({
  children,
  duration,
}: {
  readonly children: string;
  readonly duration: number;
}) {
  const layer = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const overlay = layer.current;
    if (!overlay || reducedMotion()) return;
    const glyphs = readGlyphs(overlay);
    const glyph = (): string => glyphs[Math.floor(Math.random() * glyphs.length)] ?? '·';
    const letters = Array.from(children);
    const order = letters.map((_, index) => index).sort(() => Math.random() - 0.5);
    const glitching = new Set(order.slice(0, Math.max(1, Math.round(letters.length * GLITCHING))));
    // The overlay is the word, with a glyph in place of each glitching letter.
    const glitches: { span: HTMLSpanElement; letter: string; settles: number }[] = [];
    overlay.replaceChildren(
      ...letters.map((letter, index) => {
        if (!glitching.has(index)) return letter;
        const span = document.createElement('span');
        span.className = 'tk-decipher-glyph';
        span.textContent = glyph();
        glitches.push({ span, letter, settles: duration * (0.35 + Math.random() * 0.65) });
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
    }, FLICKER_MS);
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
 * stays outside the words so prose wraps naturally across lines.
 */
function DecipherWords({
  children,
  duration = WORD_MS,
}: {
  readonly children: string;
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
          // biome-ignore lint/suspicious/noArrayIndexKey: streamed tokens only append at the tail, keeping earlier word indices fixed
          <GlitchWord key={index} duration={duration}>
            {token}
          </GlitchWord>
        ),
      )}
    </>
  );
}

export interface DecipherStreamProps extends StreamDecipherOptions {
  readonly children: string;
  /** Whether the text is still arriving. */
  readonly active?: boolean;
}

/**
 * Streamed text, such as a model's reply, each word glitching in as it shows
 * while `active`, the text still arriving, and for a moment after. Until then,
 * its last word shows only once it's whole (`wholeWords`).
 */
export function DecipherStream({
  children,
  active = true,
  duration = WORD_MS,
  enabled = true,
}: DecipherStreamProps) {
  const deciphering = useStreamDecipher(active, { duration, enabled });
  if (!deciphering || !children) return <>{children}</>;
  return (
    <DecipherWords duration={duration}>{active ? wholeWords(children) : children}</DecipherWords>
  );
}

/**
 * Deciphers the string leaves of rendered children, such as a markdown
 * renderer's, while `active`. It holds nothing back: a caller that knows the
 * text is still arriving trims it with `wholeWords` first. It goes into plain
 * elements such as `em` and `strong`, never into a component's, so components
 * that decipher their own children (a paragraph, a list item, a quote) can
 * nest without deciphering a word twice.
 */
export function decipherChildren(children: ReactNode, active: boolean): ReactNode {
  if (!active) return children;
  return Children.map(children, (child) => {
    if (typeof child === 'string') return <DecipherWords>{child}</DecipherWords>;
    if (
      isValidElement<{ children?: ReactNode }>(child) &&
      typeof child.type === 'string' &&
      child.props.children !== undefined
    ) {
      return cloneElement(
        child as ReactElement<{ children?: ReactNode }>,
        undefined,
        decipherChildren(child.props.children, active),
      );
    }
    return child;
  });
}

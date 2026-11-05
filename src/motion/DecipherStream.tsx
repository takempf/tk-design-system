import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DecipherWords, decipherDefaults, readDecipher } from './Decipher';
import { reducedMotion } from './reducedMotion';

/**
 * `text` up to its last whole word, for text still arriving. A word resolves
 * once, when it first shows, and starts over whenever its text changes, so a
 * word shown as it types in would scramble again with every letter. Holding
 * it back until the space after it arrives lets each word resolve once.
 */
export const wholeWords = (text: string): string => text.slice(0, text.search(/\s\S*$/) + 1);

export interface StreamDecipherOptions {
  /** Milliseconds for each word to settle. Defaults to the theme's `--tk-decipher-duration`. */
  readonly duration?: number;
  /** False shows the text plainly, as when it should arrive without motion. */
  readonly enabled?: boolean;
  /** Where the text sits, for the theme's settle time; the document's if not given. */
  readonly scope?: RefObject<Element | null>;
}

/**
 * Whether streamed text deciphers: while it is `streaming`, and for one word's
 * settle afterward, so its last words finish resolving instead of snapping to
 * plain text on the last frame. Never with reduced motion.
 */
export function useStreamDecipher(
  streaming: boolean,
  { duration, enabled = true, scope }: StreamDecipherOptions = {},
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
    const where =
      scope?.current ?? (typeof document === 'undefined' ? null : document.documentElement);
    const settle = duration ?? (where ? readDecipher(where) : decipherDefaults).duration;
    const timer = setTimeout(() => setSettling(false), settle);
    return () => clearTimeout(timer);
  }, [streaming, on, duration, scope]);

  return on && (streaming || settling);
}

export interface DecipherStreamProps extends Omit<StreamDecipherOptions, 'scope'> {
  readonly children: string;
  /** Whether the text is still arriving. */
  readonly active?: boolean;
}

/**
 * Streamed text, such as a model's reply, each word glitching in as it shows
 * while `active`, the text still arriving, and for a moment after, as the
 * `--tk-decipher-*` tokens set it. Until then, its last word shows only once
 * it's whole (`wholeWords`).
 */
export function DecipherStream({
  children,
  active = true,
  duration,
  enabled = true,
}: DecipherStreamProps) {
  const scope = useRef<HTMLSpanElement>(null);
  const deciphering = useStreamDecipher(active, { duration, enabled, scope });
  return (
    <span ref={scope} className="tk-decipher-stream">
      {deciphering && children ? (
        <DecipherWords duration={duration}>
          {active ? wholeWords(children) : children}
        </DecipherWords>
      ) : (
        children
      )}
    </span>
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

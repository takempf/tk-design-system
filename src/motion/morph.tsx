import {
  Children,
  type CSSProperties,
  cloneElement,
  type ReactElement,
  useCallback,
  useId,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { holdScenery } from '../scenery/hold';

/**
 * Transition types the bundled CSS understands, matched with
 * `:active-view-transition-type()`. Pass your own for your own CSS.
 */
export type MorphType = 'forward' | 'back' | 'open' | 'close' | (string & {});

export interface MorphOptions {
  readonly type?: MorphType;
  /**
   * Only <Morph>s and <Reveal>s declared with the same `scope` take part. Scope a
   * morph when the change is local — opening a popup should animate the popup's
   * text, not capture the whole page. Unscoped morphs involve unscoped elements.
   */
  readonly scope?: string;
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Narrows a part's selector to the parts of one scope. */
function inScope(scope: string | undefined): string {
  return scope ? `[data-tk-scope="${CSS.escape(scope)}"]` : ':not([data-tk-scope])';
}

// Names exist only for the lifetime of the morph that uses them, as rules in a
// constructable stylesheet: idle names never leak into another transition.
function nameRules(scope: string | undefined): string {
  const within = inScope(scope);
  return `
    [data-tk-morph]${within} { view-transition-name: var(--tk-morph-name); view-transition-class: tk-morph; }
    [data-tk-morph="text"]${within} { view-transition-class: tk-morph-text; }
    [data-tk-reveal]${within} { view-transition-name: var(--tk-reveal-name); view-transition-class: tk-reveal; }
    [data-tk-reveal="directional"]${within} { view-transition-class: tk-reveal tk-directional; }
  `;
}

/**
 * How deeply each named part sits inside the other parts of the morph: the
 * number of named elements around it. Deepest wins for a name whose two ends
 * nest differently.
 */
function measureNesting(scope: string | undefined, depths: Map<string, number>): void {
  const within = inScope(scope);
  const parts = `[data-tk-morph]${within}, [data-tk-reveal]${within}`;
  for (const element of document.querySelectorAll<HTMLElement>(parts)) {
    const name =
      element.style.getPropertyValue('--tk-morph-name') ||
      element.style.getPropertyValue('--tk-reveal-name');
    if (!name) continue;
    let depth = 0;
    let around = element.parentElement?.closest(parts);
    while (around) {
      depth++;
      around = around.parentElement?.closest(parts);
    }
    depths.set(name, Math.max(depths.get(name) ?? 0, depth));
  }
}

/**
 * Stacks each moving part over the parts it is nested in, the way the page
 * paints them. Left to itself the browser stacks them by when it first saw
 * them, the old state's first, so a box that only the new state has (a tab
 * being opened) would cover a part arriving in it from the old one (the title
 * it takes from a list row).
 */
function nestingRules(depths: Map<string, number>): string {
  return [...depths]
    .filter(([, depth]) => depth > 0)
    .map(([name, depth]) => `::view-transition-group(${CSS.escape(name)}) { z-index: ${depth}; }`)
    .join('\n');
}

/**
 * Apply a state change inside a view transition. <Morph>s that trade a name glide
 * from the old box to the new; <Reveal>s that mount rise in, those that unmount
 * sink away, and those that merely move slide to their new place.
 *
 * The update runs synchronously (flushSync) inside the transition, so it works
 * with any state — React, an external store, or a Base UI popup's open state.
 *
 * Returns the transition, for work that should wait on it, or `null` when the
 * update was applied on the spot (no view transitions, or reduced motion).
 */
export function morph(
  update: () => void,
  options: MorphType | MorphOptions = {},
): ViewTransition | null {
  const { type, scope } =
    typeof options === 'string' ? { type: options, scope: undefined } : options;
  if (!document.startViewTransition || reducedMotion()) {
    update();
    return null;
  }
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(nameRules(scope));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  // The old state is captured by the time the update runs, and the moving
  // parts are only built once it has: the nesting of both ends is known then,
  // and in time to stack them by it.
  const run = () => {
    const depths = new Map<string, number>();
    measureNesting(scope, depths);
    flushSync(update);
    measureNesting(scope, depths);
    sheet.replaceSync(`${nameRules(scope)}\n${nestingRules(depths)}`);
  };
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition({ update: run, types: type ? [type] : [] });
  } catch {
    transition = document.startViewTransition(run);
  }
  // A morph that starts before this one is done skips it (closing a popup while
  // it opens); that is expected, not an error to report.
  transition.ready.catch(() => {});
  holdScenery(transition.finished);
  transition.finished.finally(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((each) => each !== sheet);
  });
  return transition;
}

/** `useState`, except every set goes through `morph`. */
export function useMorphState<T>(
  initial: T | (() => T),
  options?: (next: T) => MorphType | MorphOptions,
) {
  const [value, setValue] = useState(initial);
  const set = useCallback(
    (next: T) => {
      morph(() => setValue(next), options?.(next));
    },
    [options],
  );
  return [value, set] as const;
}

/** An identifier safe for view-transition names and scopes, unique per instance. */
export function useMorphName(prefix = 'morph'): string {
  return `tk-${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

type Styled = ReactElement<{ style?: CSSProperties }>;

function tag(
  child: Styled,
  attributes: Record<string, string | undefined>,
  variables: Record<string, string>,
) {
  const element = Children.only(child);
  return cloneElement(element, {
    ...attributes,
    style: { ...element.props.style, ...variables } as CSSProperties,
  });
}

export interface MorphProps {
  /** Elements with the same name in consecutive states become one moving element. */
  readonly name: string;
  /**
   * Only one element may hold a name at a time. Turn the source off in the state
   * where the destination holds it, e.g. `active={!open}` on a trigger's label.
   */
  readonly active?: boolean;
  /**
   * `box` (default) stretches the snapshot as the shape changes — right for cards
   * and panels. `text` never scales, so letters glide at their true size.
   */
  readonly fit?: 'box' | 'text';
  /** Take part only in morphs with this scope. */
  readonly scope?: string;
  /** One element that renders a box (and accepts `style`). */
  readonly children: Styled;
}

/**
 * A shared element. When one `Morph` gives up a name and another takes it within
 * the same `morph()`, the browser carries one into the other.
 */
export function Morph({ name, active = true, fit = 'box', scope, children }: MorphProps) {
  if (!active) return children;
  return tag(
    children,
    { 'data-tk-morph': fit, 'data-tk-scope': scope },
    { '--tk-morph-name': name },
  );
}

export interface RevealProps {
  /** One element that renders a box (and accepts `style`). */
  readonly children: Styled;
  /** Slide in the direction of travel when the morph has a `forward`/`back` type. */
  readonly directional?: boolean;
  /** Take part only in morphs with this scope. */
  readonly scope?: string;
}

/**
 * Content that rises in when a `morph()` mounts it and sinks away when one removes
 * it. Siblings that merely move glide to their new places. Key it to replace it.
 */
export function Reveal({ children, directional = false, scope }: RevealProps) {
  const name = useMorphName('reveal');
  return tag(
    children,
    { 'data-tk-reveal': directional ? 'directional' : '', 'data-tk-scope': scope },
    { '--tk-reveal-name': name },
  );
}

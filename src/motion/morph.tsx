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

/** The parts of one scope's morph: the elements its names go on. */
function partsOf(scope: string | undefined): string {
  const within = inScope(scope);
  return `[data-tk-morph]${within}, [data-tk-reveal]${within}`;
}

/** A part's name, from the custom property its <Morph> or <Reveal> sets. */
function nameOf(element: HTMLElement): string {
  return (
    element.style.getPropertyValue('--tk-morph-name') ||
    element.style.getPropertyValue('--tk-reveal-name')
  );
}

/** Which morph last named an element, so an earlier one never unnames it. */
const namedBy = new WeakMap<HTMLElement, object>();

/**
 * Names exist only for the lifetime of the morph that uses them: idle names
 * never leak into another transition. They go on each part inline (the
 * classes are always set, in motion.css, and do nothing without a name). A
 * stylesheet of names, adopted for the morph and dropped after it, would do
 * the same, but WebKit restyles the whole document for each change to it:
 * 60–90ms a time on a page of a few thousand elements, at both ends of every
 * popup opening.
 */
function nameParts(scope: string | undefined, owner: object): Set<HTMLElement> {
  const named = new Set<HTMLElement>();
  for (const element of document.querySelectorAll<HTMLElement>(partsOf(scope))) {
    const name = nameOf(element);
    if (!name) continue;
    element.style.setProperty('view-transition-name', name);
    namedBy.set(element, owner);
    named.add(element);
  }
  return named;
}

function unnameParts(named: Iterable<HTMLElement>, owner: object): void {
  for (const element of named) {
    if (namedBy.get(element) !== owner) continue;
    element.style.removeProperty('view-transition-name');
    namedBy.delete(element);
  }
}

/**
 * How deeply each named part sits inside the other parts of the morph: the
 * number of named elements around it. Deepest wins for a name whose two ends
 * nest differently.
 */
function measureNesting(scope: string | undefined, depths: Map<string, number>): void {
  const parts = partsOf(scope);
  for (const element of document.querySelectorAll<HTMLElement>(parts)) {
    const name = nameOf(element);
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

/** A view-transition pseudo-element of the document, by its name. */
const pseudo = (part: 'group' | 'old' | 'new', name: string) =>
  `::view-transition-${part}(${CSS.escape(name)})`;

type Timing = { readonly duration: number; readonly easing?: string };

/**
 * Animates one of the transition's pseudo-elements alongside the browser's own
 * animations. Filled both ways, so it holds from the first frame; cancelled
 * with the transition, so it never touches the next one's pseudo-elements.
 */
function follow(
  name: string,
  part: 'group' | 'old' | 'new',
  keyframes: Keyframe[],
  timing: Timing,
  into: Animation[],
): void {
  try {
    into.push(
      document.documentElement.animate(keyframes, {
        ...timing,
        fill: 'both',
        pseudoElement: pseudo(part, name),
      }),
    );
  } catch {
    // Browsers that can't animate the transition's pseudo-elements keep the CSS defaults.
  }
}

/**
 * Stacks each moving part over the parts it is nested in, the way the page
 * paints them. Left to itself the browser stacks them by when it first saw
 * them, the old state's first, so a box that only the new state has (a tab
 * being opened) would cover a part arriving in it from the old one (the title
 * it takes from a list row). Set by animation rather than by a stylesheet: in
 * WebKit, adopting a sheet restyles the whole document. A finished animation
 * still holds its value, and doesn't keep the transition waiting for it.
 */
function stackByNesting(depths: Map<string, number>, animations: Animation[]): void {
  for (const [name, depth] of depths) {
    if (depth > 0) {
      follow(name, 'group', [{ zIndex: depth }, { zIndex: depth }], { duration: 0 }, animations);
    }
  }
}

/* Containers ---------------------------------------------------------------- */

/**
 * The part of a container that has its look: the container itself, or the
 * child it marks `data-tk-frame` (a combobox's trigger, inside the control that
 * also holds its clear button).
 */
const frameOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(':scope > [data-tk-frame]') ?? container;

interface Look {
  readonly fill: string;
  readonly edge: string;
  readonly width: string;
  /** The focus ring round the frame: its outline, transparent when it has none. */
  readonly ring: { readonly color: string; readonly width: string; readonly offset: string };
  readonly corners: readonly string[];
  readonly shape: string;
}

/** One end of a container's morph: the element holding the name, and its look there. */
interface End {
  readonly element: HTMLElement;
  readonly look: Look;
  rect: DOMRect;
}

const corners = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
] as const;

/** A frame's fill, edge and corners as they settle, not part-way through a transition. */
function lookOf(frame: HTMLElement): Look {
  const { transition } = frame.style;
  frame.style.transition = 'none';
  const style = getComputedStyle(frame);
  const look = {
    fill: style.backgroundColor,
    edge: style.borderTopColor,
    width: style.borderTopWidth,
    ring:
      style.outlineStyle === 'none'
        ? { color: 'transparent', width: '0px', offset: '0px' }
        : { color: style.outlineColor, width: style.outlineWidth, offset: style.outlineOffset },
    corners: corners.map((corner) => style[corner]),
    shape: style.getPropertyValue('corner-shape'),
  };
  frame.style.transition = transition;
  return look;
}

/** A corner's radius in pixels, no rounder than the box allows (so a pill shrinks evenly). */
function cornerIn(radius: string, rect: DOMRect): string {
  const most = Math.min(rect.width, rect.height) / 2;
  const value = parseFloat(radius) || 0;
  const px = radius.trim().endsWith('%') ? (value / 100) * most * 2 : value;
  return `${Math.min(px, most)}px`;
}

/**
 * The frame the moving group paints: its fill, edge and ring, then its
 * corners. Snapshots are taken without their own (`data-tk-frameless`), so the
 * frame can change size without stretching, and turn from one end's look to
 * the other's: a field's focus ring goes round the whole of it as it grows,
 * and fades as it shrinks back if focus has gone.
 */
const fillOf = ({ look }: End): Keyframe => ({
  backgroundColor: look.fill,
  boxShadow: `inset 0 0 0 ${look.width} ${look.edge}`,
  outlineStyle: 'solid',
  outlineColor: look.ring.color,
  outlineWidth: look.ring.width,
  outlineOffset: look.ring.offset,
});

const shapeOf = ({ look, rect }: End): Keyframe => ({
  borderRadius: look.corners.map((corner) => cornerIn(corner, rect)).join(' '),
  ...(look.shape && { cornerShape: look.shape }),
});

const area = (rect: DOMRect) => rect.width * rect.height;

/**
 * Each end's content holds still on the page while the frame moves over it:
 * the trigger's stays where the trigger is, the popup's where the popup will
 * be, and the frame uncovers one and covers the other on its way. Each
 * snapshot keeps its own size inside the moving frame, offset by where the
 * frame has got to (an object-position that eases with it).
 */
function holdStill(name: string, from: DOMRect, to: DOMRect, timing: Timing, into: Animation[]) {
  const x = to.left - from.left;
  const y = to.top - from.top;
  const at = (dx: number, dy: number) => ({ objectPosition: `${dx}px ${dy}px` });
  follow(name, 'old', [at(0, 0), at(-x, -y)], timing, into);
  follow(name, 'new', [at(x, y), at(0, 0)], timing, into);
}

/**
 * Cuts the destination itself to the moving frame. Chrome draws a destination
 * only into its snapshot; WebKit also paints it in place, whole, beneath the
 * transition (and its snapshot is that same painting, so it can't be hidden
 * apart from it). Cut to the frame, the copy in place is the very part the
 * frame shows, in the same place, and nothing shows outside the frame.
 */
function cutToFrame(from: End, to: End, timing: Timing, into: Animation[]) {
  const inset = (a: DOMRect, b: DOMRect) =>
    [a.top - b.top, b.right - a.right, b.bottom - a.bottom, a.left - b.left]
      .map((side) => `${Math.max(0, side)}px`)
      .join(' ');
  const round = (end: End) => shapeOf(end).borderRadius;
  into.push(
    to.element.animate(
      {
        clipPath: [
          `inset(${inset(from.rect, to.rect)} round ${round(from)})`,
          `inset(0 round ${round(to)})`,
        ],
      },
      { ...timing, fill: 'both' },
    ),
  );
}

/** Which morph last stripped a frame, so an earlier one never restores it. */
const framedBy = new WeakMap<HTMLElement, object>();

/** A container with no fill of its own, whose content never fades (see motion.css). */
const isHollow = (element: HTMLElement) =>
  getComputedStyle(element)
    .getPropertyValue('view-transition-class')
    .split(/\s+/)
    .includes('tk-hollow');

/**
 * Reads each named container's look, then strips its frame for the snapshot.
 * Read first: the look is the frame's own, and the snapshot is everything else.
 *
 * The browser shows the frame it captures the old state from, so a frame
 * stripped for that capture blinks out for a frame. The old content fades as
 * the frame sets off, where its own frame matches the moving one, so it keeps
 * it. Only a hollow container's is stripped, since its content never fades.
 */
function captureContainers(
  named: Iterable<HTMLElement>,
  owner: object,
  old = false,
): Map<string, End> {
  const ends = new Map<string, End>();
  const containers = [...named].filter((element) => element.dataset.tkMorph === 'container');
  for (const element of containers) {
    ends.set(nameOf(element), {
      element,
      look: lookOf(frameOf(element)),
      rect: element.getBoundingClientRect(),
    });
  }
  for (const element of containers) {
    if (old && !isHollow(element)) continue;
    const frame = frameOf(element);
    frame.dataset.tkFrameless = '';
    framedBy.set(frame, owner);
  }
  return ends;
}

function restoreFrames(ends: Map<string, End>, owner: object): void {
  for (const { element } of ends.values()) {
    const frame = frameOf(element);
    if (framedBy.get(frame) !== owner) continue;
    delete frame.dataset.tkFrameless;
    framedBy.delete(frame);
  }
}

function parseTime(value: string): number {
  const time = parseFloat(value);
  return value.trim().endsWith('ms') ? time : time * 1000;
}

/** When, as a share of the duration, an easing first reaches `progress`. */
function timeAt(easing: string, progress: number): number {
  try {
    const effect = new KeyframeEffect(null, null, { duration: 100, easing, fill: 'both' });
    const probe = new Animation(effect);
    for (let time = 0; time <= 100; time++) {
      probe.currentTime = time;
      if ((effect.getComputedTiming().progress ?? 0) >= progress) return time / 100;
    }
  } catch {}
  return progress;
}

/**
 * The fill and edge turn with the frame's travel rather than its time: by
 * half-way out of a trigger the frame has the popup's look, and on the way
 * home it keeps the popup's until the last stretch. A frame shrinking onto a
 * trigger with little fill of its own would otherwise all but vanish before
 * it had moved, and show the page through it; and one that has landed on a
 * filled button would sit there in the popup's color.
 */
function turnFill(from: End, to: End, easing: string): Keyframe[] {
  const [start, end] = area(to.rect) < area(from.rect) ? [0.6, 0.95] : [0, 0.5];
  return [
    { ...fillOf(from), offset: 0 },
    { ...fillOf(from), offset: timeAt(easing, start) },
    { ...fillOf(to), offset: timeAt(easing, end) },
    { ...fillOf(to), offset: 1 },
  ];
}

/**
 * Moves each container's frame from one end to the other, in step with the
 * browser's own move of its box (both read the root's morph tokens). A
 * container with only one end — a popup with nothing to grow out of — fades in
 * or out in place, frame and content together.
 */
function moveFrames(before: Map<string, End>, after: Map<string, End>, animations: Animation[]) {
  if (!before.size && !after.size) return;
  const root = getComputedStyle(document.documentElement);
  const duration = parseTime(root.getPropertyValue('--tk-duration-morph')) || 320;
  const easing = root.getPropertyValue('--tk-ease-morph').trim() || 'ease';
  const fade = (name: string, end: End, from: number, to: number, share: number) =>
    follow(
      name,
      'group',
      [
        { ...fillOf(end), ...shapeOf(end), opacity: from },
        { ...fillOf(end), ...shapeOf(end), opacity: to },
      ],
      { duration: duration * share },
      animations,
    );
  for (const [name, to] of after) {
    to.rect = to.element.getBoundingClientRect();
    const from = before.get(name);
    if (!from) {
      fade(name, to, 0, 1, 0.6);
      continue;
    }
    const timing = { duration, easing };
    follow(name, 'group', [shapeOf(from), shapeOf(to)], timing, animations);
    follow(name, 'group', turnFill(from, to, easing), { duration }, animations);
    holdStill(name, from.rect, to.rect, timing, animations);
    cutToFrame(from, to, timing, animations);
  }
  for (const [name, from] of before) {
    if (!after.has(name)) fade(name, from, 1, 0, 0.5);
  }
}

/** Set while a morph applies its update: a morph started from inside it joins it. */
let updating = 0;

/**
 * Whether a change made now is carried by a view transition: they are
 * supported and motion isn't reduced, or a morph is applying its update (which
 * the change joins). When it isn't, a change that would have morphed should
 * fade where it stands instead.
 */
export function willMorph(): boolean {
  return updating > 0 || (typeof document.startViewTransition === 'function' && !reducedMotion());
}

/**
 * Apply a state change inside a view transition. <Morph>s that trade a name glide
 * from the old box to the new; <Reveal>s that mount rise in, those that unmount
 * sink away, and those that merely move slide to their new place.
 *
 * A `fit="container"` part is one frame in two places (a trigger, then its
 * popup): the frame moves and resizes between them, its fill, edge and corners
 * turning from one end's to the other's. The content inside never stretches
 * or slides: it holds still, fading out as the frame sets off and in as it
 * lands (motion.css times the fades).
 *
 * The update runs synchronously (flushSync) inside the transition, so it works
 * with any state — React, an external store, or a Base UI popup's open state.
 * A morph started while another applies its update (a handler that morphs,
 * called from a component that does too) is part of that one.
 *
 * Returns the transition, for work that should wait on it, or `null` when the
 * update was applied on the spot (no view transitions, reduced motion, or
 * inside another morph).
 */
export function morph(
  update: () => void,
  options: MorphType | MorphOptions = {},
): ViewTransition | null {
  const { type, scope } =
    typeof options === 'string' ? { type: options, scope: undefined } : options;
  if (updating || !document.startViewTransition || reducedMotion()) {
    update();
    return null;
  }
  const owner = {};
  // Named now, so the old state is captured with them.
  let named = nameParts(scope, owner);
  let before = captureContainers(named, owner, true);
  let after = new Map<string, End>();
  const depths = new Map<string, number>();
  const animations: Animation[] = [];
  let captured = false;
  let done = false;
  // Named again just before the old state is captured (animation frame
  // callbacks run first): a change made alongside this morph has landed by
  // then. A select's new value is set as its list closes, so it's the newly
  // chosen row, not the one chosen before, that flies home.
  requestAnimationFrame(() => {
    if (captured || done) return;
    unnameParts(named, owner);
    restoreFrames(before, owner);
    named = nameParts(scope, owner);
    before = captureContainers(named, owner, true);
  });
  // The old state is captured by the time the update runs, and the moving
  // parts are only built once it has: the nesting of both ends is known then.
  const run = () => {
    captured = true;
    measureNesting(scope, depths);
    updating++;
    try {
      flushSync(update);
    } finally {
      updating--;
    }
    // A part may have left the morph while staying on the page (a trigger's
    // label, once its popup holds the name); only the new state's are named.
    unnameParts(named, owner);
    restoreFrames(before, owner);
    named = nameParts(scope, owner);
    after = captureContainers(named, owner);
    measureNesting(scope, depths);
  };
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition({ update: run, types: type ? [type] : [] });
  } catch {
    transition = document.startViewTransition(run);
  }
  transition.ready.then(
    () => {
      stackByNesting(depths, animations);
      moveFrames(before, after, animations);
    },
    // A morph that starts before this one is done skips it (closing a popup
    // while it opens); that is expected, not an error to report.
    () => {},
  );
  holdScenery(transition.finished);
  transition.finished.finally(() => {
    done = true;
    for (const animation of animations) animation.cancel();
    unnameParts(named, owner);
    restoreFrames(before, owner);
    restoreFrames(after, owner);
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
   * `box` (default) stretches the snapshot as the shape changes — right for
   * pictures. `icon` scales the same way, and its two ends add up rather than
   * layer, so a glyph that stays (a chevron) never dims mid-way and one that
   * changes (a chevron becoming a check) turns cleanly. `text` never scales, so
   * letters glide at their true size. `container` moves the element's frame
   * (fill, edge, corners) between its two shapes and looks, and never scales
   * what is inside it: a trigger becoming its popup, a card becoming a dialog.
   */
  readonly fit?: 'box' | 'icon' | 'text' | 'container';
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

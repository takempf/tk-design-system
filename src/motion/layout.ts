import { type RefCallback, useCallback, useLayoutEffect, useMemo, useRef } from 'react';

/** Where a child sat in the layout, in the frame: its offset and size, with no motion applied. */
interface Place {
  readonly node: HTMLElement;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Where a newcomer sets out from: an element's box and type size, read before the change. */
interface Source {
  readonly rect: DOMRect;
  readonly fontSize: number;
  readonly at: number;
}

/** A source older than this belongs to a change that never came (a cancelled pick). */
const sourceLifetime = 1000;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function readTime(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const raw = style.getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith('ms') ? value : value * 1000;
}

/**
 * Where an element sits in `frame`, by layout alone. Offsets ignore
 * transforms, so a child already gliding is measured where the layout puts it.
 */
function offsetIn(node: HTMLElement, frame: HTMLElement): readonly [number, number] {
  let x = 0;
  let y = 0;
  for (let at: HTMLElement | null = node; at && at !== frame; ) {
    x += at.offsetLeft;
    y += at.offsetTop;
    at = at.offsetParent as HTMLElement | null;
  }
  return [x, y];
}

/** The container's marked children, by key, placed in the frame. */
function measure(box: HTMLElement, frame: HTMLElement): Map<string, Place> {
  const places = new Map<string, Place>();
  for (const node of box.querySelectorAll<HTMLElement>(':scope > [data-tk-layout]')) {
    const key = node.dataset.tkLayout;
    if (!key) continue;
    const [x, y] = offsetIn(node, frame);
    places.set(key, { node, x, y, width: node.offsetWidth, height: node.offsetHeight });
  }
  return places;
}

/** How far a running glide has a child from its place in the layout. */
function offsetOf(node: HTMLElement): readonly [number, number] {
  const value = getComputedStyle(node).translate;
  if (!value || value === 'none') return [0, 0];
  const [x = '0', y = '0'] = value.split(' ');
  return [Number.parseFloat(x) || 0, Number.parseFloat(y) || 0];
}

/**
 * A copy of a child that only moves and fades: out of reach of pointer, focus
 * and assistive tech, and with no ids to clash with the original's.
 */
function copyOf(node: HTMLElement, style: Partial<CSSStyleDeclaration>): HTMLElement {
  const copy = node.cloneNode(true) as HTMLElement;
  for (const element of [copy, ...copy.querySelectorAll('[id]')]) element.removeAttribute('id');
  copy.removeAttribute('data-tk-layout');
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  Object.assign(copy.style, {
    margin: '0',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    ...style,
  });
  return copy;
}

/** A child's motion: its own animations, and the copy flying in its stead. */
interface Flight {
  readonly animations: readonly Animation[];
  readonly standIn?: HTMLElement;
}

export interface LayoutMorph {
  /**
   * For the container's ref. Its children marked `data-tk-layout="<key>"` take
   * part. Optional, for a frame that only grows and shrinks (an editor).
   */
  readonly ref: RefCallback<HTMLElement>;
  /**
   * For the frame's ref: the box the change makes taller or shorter (a field
   * whose chips wrap onto another line). Its height glides to its new one
   * instead of jumping, the page around it moving in step. Optional; without
   * it, the container is the frame and keeps its size as it changes.
   */
  readonly frame: RefCallback<HTMLElement>;
  /**
   * The newcomer keyed `key` in the next change sets out from `source` (the
   * row it was picked from), at that element's type size. Call it just before
   * the change.
   */
  readonly from: (key: string, source: Element) => void;
}

/**
 * Layout morphing for live content. After each change of `signature`, the
 * frame's height glides to its new one, the container's marked children glide
 * from where they were to where they are now, a newcomer sets out from its
 * source (see `from`) or fades in where it lands, and one that has gone fades
 * where it stood, as a copy that can't be reached. Moves ride
 * `--tk-duration-morph` and `--tk-ease-morph`, like a `morph()`.
 *
 * A newcomer from elsewhere may set out from under something drawn above the
 * container (a popup's row, for a chip in its field). A stand-in makes that
 * journey in `layer`, above popups — a portal container, so it keeps the
 * theme — and the newcomer shows as it lands.
 *
 * Unlike `morph()`, nothing is captured. The elements stay live and usable
 * throughout, so typing never waits on it, and the change can come from
 * anywhere — a controlled parent included — since the old places are read
 * after the previous change rather than just before this one.
 */
export function useLayoutMorph(signature: string, layer?: HTMLElement | null): LayoutMorph {
  const container = useRef<HTMLElement | null>(null);
  const framed = useRef<HTMLElement | null>(null);
  const places = useRef(new Map<string, Place>());
  const height = useRef<string | null>(null);
  const sources = useRef(new Map<string, Source>());
  const flights = useRef(new WeakMap<Element, Flight>());
  const growth = useRef<Animation | null>(null);
  const above = useRef(layer);
  above.current = layer;

  // Where everything sits at rest, for the next change to start from. Not
  // while the frame glides: its height then is neither the old nor the new.
  const record = useCallback(() => {
    if (growth.current?.playState === 'running') return;
    const box = container.current;
    const frame = framed.current ?? box;
    places.current = box && frame ? measure(box, frame) : new Map();
    height.current = framed.current ? getComputedStyle(framed.current).height : null;
  }, []);

  const ref = useCallback(
    (box: HTMLElement | null) => {
      container.current = box;
      if (!box) return;
      record();
      // Reflowed with nothing changed (the page resized): the next change starts from here.
      const resize = new ResizeObserver(record);
      resize.observe(box);
      return () => {
        resize.disconnect();
        container.current = null;
      };
    },
    [record],
  );

  const frame = useCallback(
    (element: HTMLElement | null) => {
      framed.current = element;
      record();
    },
    [record],
  );

  const from = useCallback((key: string, source: Element) => {
    sources.current.set(key, {
      rect: source.getBoundingClientRect(),
      fontSize: Number.parseFloat(getComputedStyle(source).fontSize) || 0,
      at: performance.now(),
    });
  }, []);

  useLayoutEffect(() => {
    const box = container.current;
    const outer = framed.current;
    const frame = outer ?? box;
    if (!frame) return;
    const before = places.current;
    // Interrupted mid-glide, the frame carries on from the height it has on screen.
    const shown = growth.current?.playState === 'running' ? getComputedStyle(frame).height : null;
    growth.current?.cancel();
    growth.current = null;
    const was = shown ?? height.current;
    const after = box ? measure(box, frame) : new Map<string, Place>();
    const now = outer ? getComputedStyle(outer).height : null;
    places.current = after;
    height.current = now;
    const arriving = sources.current;
    sources.current = new Map();
    if (reducedMotion() || typeof frame.animate !== 'function') return;

    const style = getComputedStyle(frame);
    const morphTime = readTime(style, '--tk-duration-morph', 320);
    const move = { duration: morphTime, easing: style.getPropertyValue('--tk-ease-morph').trim() };
    const fade = {
      duration: morphTime * 0.6,
      easing: style.getPropertyValue('--tk-ease-fade').trim(),
    };
    const leave = {
      duration: readTime(style, '--tk-duration-1', 110),
      easing: style.getPropertyValue('--tk-ease-in').trim(),
    };
    const enterScale = style.getPropertyValue('--tk-enter-scale').trim() || '1';

    // A newcomer flying in lands where it will rest, once the frame has grown.
    const landing = new Map<string, DOMRect>();
    for (const [key, place] of after) {
      if (!before.has(key) && arriving.has(key)) {
        landing.set(key, place.node.getBoundingClientRect());
      }
    }

    // The frame glides first, so each child is then measured where it sits as
    // the glide starts: the frame centres or stretches its content, so that
    // isn't where it will rest. Gliding from there, a child's own move and the
    // frame's add up to one steady move from its old place to its new one.
    // What grows past the frame on the way is uncovered as it grows. Its size
    // is held between a floor and a ceiling, not set as a height, which a
    // flex parent would override.
    let start = after;
    if (outer && was && now && was !== now) {
      growth.current = outer.animate(
        [
          { minHeight: was, maxHeight: was, overflow: 'clip' },
          { minHeight: now, maxHeight: now, overflow: 'clip' },
        ],
        move,
      );
      if (box) start = measure(box, frame);
    }

    // A child moving again mid-flight starts afresh from where it is now.
    const fly = (node: HTMLElement, flight: Flight) => {
      const previous = flights.current.get(node);
      for (const animation of previous?.animations ?? []) animation.cancel();
      previous?.standIn?.remove();
      flights.current.set(node, flight);
    };

    for (const [key, place] of start) {
      const { node } = place;
      const old = before.get(key);
      if (old) {
        if (old.x === place.x && old.y === place.y) continue;
        // Interrupted mid-glide: carry on from where it is on screen now.
        const [ox, oy] = offsetOf(node);
        const dx = old.x + ox - place.x;
        const dy = old.y + oy - place.y;
        fly(node, {
          animations: [
            node.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], move),
          ],
        });
        continue;
      }
      const source = arriving.get(key);
      const rect = landing.get(key);
      if (source && rect && performance.now() - source.at < sourceLifetime) {
        // Its text sets out where the source's is, at the source's size: left
        // edges and middles meet. Its frame (fill, edge) comes in on the way.
        const own = getComputedStyle(node);
        const scale = source.fontSize / (Number.parseFloat(own.fontSize) || 1) || 1;
        const inset =
          (Number.parseFloat(own.paddingLeft) || 0) + (Number.parseFloat(own.borderLeftWidth) || 0);
        const dx = source.rect.left - rect.left - inset * scale;
        const dy = source.rect.top + source.rect.height / 2 - (rect.top + rect.height / 2);
        const standIn = copyOf(node, {
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          zIndex: 'calc(var(--tk-z-popup) + 1)',
        });
        (above.current ?? document.body).append(standIn);
        const travel = standIn.animate(
          [
            { translate: `${dx}px ${dy}px`, scale: `${scale}`, transformOrigin: 'left center' },
            { translate: '0px 0px', scale: '1', transformOrigin: 'left center' },
          ],
          move,
        );
        const turn = standIn.animate(
          [
            { backgroundColor: 'transparent', borderColor: 'transparent' },
            { backgroundColor: own.backgroundColor, borderColor: own.borderTopColor },
          ],
          fade,
        );
        // The newcomer itself waits, unseen, where the stand-in will land.
        const wait = node.animate([{ opacity: 0 }, { opacity: 0 }], { duration: move.duration });
        fly(node, { animations: [wait], standIn });
        const land = () => {
          if (flights.current.get(node)?.standIn !== standIn) return;
          standIn.remove();
          wait.cancel();
        };
        travel.finished.then(land, land);
        turn.finished.catch(() => {});
        continue;
      }
      fly(node, {
        animations: [
          node.animate(
            [
              { opacity: 0, scale: enterScale },
              { opacity: 1, scale: '1' },
            ],
            fade,
          ),
        ],
      });
    }

    // Gone from the page: a copy fades where it stood, then goes too. It is
    // placed in the frame, which holds still while the container moves in it.
    for (const [key, old] of before) {
      if (after.has(key)) continue;
      flights.current.get(old.node)?.standIn?.remove();
      const ghost = copyOf(old.node, {
        position: 'absolute',
        left: `${old.x}px`,
        top: `${old.y}px`,
        width: `${old.width}px`,
        height: `${old.height}px`,
      });
      // First, so the children gliding into its place pass over it.
      frame.prepend(ghost);
      const exit = ghost.animate([{ opacity: 1 }, { opacity: 0, scale: enterScale }], {
        ...leave,
        fill: 'forwards',
      });
      exit.finished.then(
        () => ghost.remove(),
        () => ghost.remove(),
      );
    }
  }, [signature]);

  return useMemo(() => ({ ref, frame, from }), [ref, frame, from]);
}

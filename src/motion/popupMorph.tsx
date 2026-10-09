import {
  Children,
  type CSSProperties,
  cloneElement,
  createContext,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { mergeRefs } from '../utils';
import { Morph, morph, useMorphName, willMorph } from './morph';

/** What a popup's parts need to share one container with its trigger. */
export interface PopupMorphState {
  /** The container's name: the morph's scope, and the prefix of its parts' names. */
  readonly name: string;
  readonly open: boolean;
  /**
   * The last change wasn't carried by a morph (no view transitions, or a
   * controlled `open` the parent changed itself): the trigger and its popup
   * crossfade where they stand instead.
   */
  readonly instant: boolean;
  /** The trigger's container, while it is on the page. */
  readonly trigger: RefObject<HTMLElement | null>;
}

const PopupMorphContext = createContext<PopupMorphState | null>(null);

/** Inside a trigger container, a trigger doesn't become a second one. */
const InTriggerContext = createContext(false);

export interface PopupMorphOptions<Rest extends unknown[]> {
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  /** Base UI's, with its event details; cancelling them keeps the popup as it is. */
  readonly onOpenChange?: (open: boolean, ...rest: Rest) => void;
  /** Called once the popup has finished opening or closing, morph included. */
  readonly onOpenChangeComplete?: (open: boolean) => void;
  /** Names the container `tk-<prefix>-…`. */
  readonly prefix?: string;
}

export interface PopupMorph<Rest extends unknown[]> {
  readonly open: boolean;
  /** For the root's `onOpenChange`. */
  readonly setOpen: (open: boolean, ...rest: Rest) => void;
  /** For the root's `onOpenChangeComplete`. */
  readonly onOpenChangeComplete: (open: boolean) => void;
  /** For `<PopupMorph.Provider value>`. */
  readonly state: PopupMorphState;
}

/**
 * Open state for a popup that is its trigger's container in another place.
 * Each change runs inside a `morph()` scoped to the pair, so the container
 * moves between the trigger's box and look and the popup's, and every part
 * shown on both sides travels with it. With no trigger on the page there is
 * nothing to grow out of, and the popup comes and goes on its own.
 */
export function usePopupMorph<Rest extends unknown[] = []>({
  open,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  prefix = 'popup',
}: PopupMorphOptions<Rest> = {}): PopupMorph<Rest> {
  const name = useMorphName(prefix);
  const trigger = useRef<HTMLElement>(null);
  const [inner, setInner] = useState(defaultOpen);
  const current = open ?? inner;
  const latest = useRef({ onOpenChange, onOpenChangeComplete });
  latest.current = { onOpenChange, onOpenChangeComplete };
  const flight = useRef<ViewTransition | null>(null);
  const turn = useRef(0);
  const [faded, setFaded] = useState(false);
  // What this hook last asked for: a controlled `open` that differs changed on its own.
  const requested = useRef(current);

  const setOpen = useCallback(
    (next: boolean, ...rest: Rest) => {
      const onPage = Boolean(trigger.current?.isConnected);
      const carried = onPage && willMorph();
      const update = () => {
        latest.current.onOpenChange?.(next, ...rest);
        const details = rest[0] as { isCanceled?: boolean } | undefined;
        if (details?.isCanceled) return;
        requested.current = next;
        setInner(next);
        setFaded(onPage && !carried);
      };
      turn.current++;
      if (onPage) {
        flight.current = morph(update, { type: next ? 'open' : 'close', scope: name });
      } else {
        flight.current = null;
        update();
      }
    },
    [name],
  );
  // Judged once per change of `open`, so a parent that turns a change down
  // doesn't make the trigger fade with nothing changing.
  const settled = useRef({ open: current, instant: false });
  if (settled.current.open !== current) {
    settled.current = { open: current, instant: faded || current !== requested.current };
  }
  const { instant } = settled.current;

  // Base UI reports the change complete when the popup's own animations end,
  // and the morph is not one of them.
  const complete = useCallback((next: boolean) => {
    const current = turn.current;
    const done = () => {
      if (current === turn.current) latest.current.onOpenChangeComplete?.(next);
    };
    if (flight.current) flight.current.finished.then(done);
    else done();
  }, []);

  const state = useMemo(
    () => ({ name, open: current, instant, trigger }),
    [name, current, instant],
  );
  return { open: current, setOpen, onOpenChangeComplete: complete, state };
}

/** The nearest popup morph, or `null` outside one. */
export function usePopupMorphState(): PopupMorphState | null {
  return useContext(PopupMorphContext);
}

type Part = ReactElement<{ ref?: Ref<HTMLElement>; style?: CSSProperties }>;

export interface PopupMorphTriggerProps {
  /** One element that renders the trigger's container (and accepts `ref` and `style`). */
  readonly children: Part;
  /**
   * Hidden while open, since the container is the popup then. Turn it off for a
   * trigger that stays in use beside its popup.
   */
  readonly hide?: boolean;
}

/** The trigger's side of the container: it holds the name while closed. */
function Trigger({ children, hide = true }: PopupMorphTriggerProps) {
  const state = useContext(PopupMorphContext);
  const inside = useContext(InTriggerContext);
  const child = Children.only(children);
  const own = child.props.ref;
  const triggerRef = state?.trigger;
  const ref = useMemo(() => mergeRefs(own, triggerRef), [own, triggerRef]);
  if (!state || inside) return children;
  return (
    <InTriggerContext value={true}>
      <Morph name={state.name} active={!state.open} fit="container" scope={state.name}>
        {cloneElement(child, {
          ref,
          'data-tk-container': 'trigger',
          'data-tk-open': hide && state.open ? '' : undefined,
          'data-tk-fade': hide && state.instant ? '' : undefined,
        } as Partial<Part['props']>)}
      </Morph>
    </InTriggerContext>
  );
}

/**
 * The popup's side of the container: it holds the name while open. Marked
 * `data-tk-fade` when it came without a morph, for a surface that has no
 * entrance of its own to fade in by.
 */
function Popup({ children }: { readonly children: Part }) {
  const state = useContext(PopupMorphContext);
  if (!state) return children;
  return (
    <Morph name={state.name} active={state.open} fit="container" scope={state.name}>
      {cloneElement(Children.only(children), {
        'data-tk-container': 'popup',
        'data-tk-fade': state.instant ? '' : undefined,
      } as Partial<Part['props']>)}
    </Morph>
  );
}

export interface PopupMorphPartProps {
  /** Pairs this part with its counterpart on the other side. */
  readonly name?: string;
  readonly side: 'trigger' | 'popup';
  /** Whether this element is the part's place on its side (the chosen row, say). */
  readonly when?: boolean;
  /**
   * `text` (default) keeps letters at their size. `icon` scales and turns one
   * glyph into the other (a chevron into a check); `box` scales, for pictures.
   */
  readonly fit?: 'text' | 'icon' | 'box';
  readonly children: Part;
}

/**
 * Something shown on both sides, like the trigger's value and its row in the
 * list: the trigger's holds the name while closed and the popup's while open,
 * so it travels from one place to the other, above the container.
 */
function SharedPart({
  name = 'value',
  side,
  when = true,
  fit = 'text',
  children,
}: PopupMorphPartProps) {
  const state = useContext(PopupMorphContext);
  if (!state) return children;
  const active = when && (side === 'popup' ? state.open : !state.open);
  return (
    <Morph name={`${state.name}-${name}`} active={active} fit={fit} scope={state.name}>
      {children}
    </Morph>
  );
}

/** Clears the popup morph for what's inside, such as a submenu. */
function Detach({ children }: { readonly children: ReactNode }) {
  return <PopupMorphContext value={null}>{children}</PopupMorphContext>;
}

/**
 * A trigger and its popup as one container in two places (see `usePopupMorph`).
 *
 *   const popup = usePopupMorph({ open, onOpenChange });
 *   <PopupMorph.Provider value={popup.state}>
 *     <Base.Root open={popup.open} onOpenChange={popup.setOpen}>
 *       <PopupMorph.Trigger><Base.Trigger>
 *         <PopupMorph.Part side="trigger"><span>{label}</span></PopupMorph.Part>
 *       </Base.Trigger></PopupMorph.Trigger>
 *       <PopupMorph.Popup><Base.Popup>
 *         <PopupMorph.Part side="popup"><span>{label}</span></PopupMorph.Part>
 *       </Base.Popup></PopupMorph.Popup>
 */
export const PopupMorph = {
  Provider: PopupMorphContext,
  Trigger,
  Popup,
  Part: SharedPart,
  Detach,
};

import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

/** Suggestions under a heading. Pass `groups` instead of `items` to show them. */
export interface ComboboxGroup<V> {
  readonly id: string;
  readonly label: string;
  readonly items: V[];
}

/** Scrolls a virtualized list until the row at `index` (of the filtered rows) is in view. */
export type Reveal = (index: number) => void;

interface Place {
  readonly index: number;
  readonly count: number;
  readonly style: CSSProperties;
}

export interface RowsProps<T> {
  /** The root's `items` are `ComboboxGroup`s, each shown under its label. */
  readonly grouped: boolean;
  /** Renders only the rows in view. For flat lists whose rows share one height. */
  readonly virtualized?: boolean;
  /** Filled with a virtualized list's `Reveal`, for the root's `onItemHighlighted`. */
  readonly reveal?: RefObject<Reveal | null>;
  /** A virtualized list opens scrolled to this row (the chosen one), so it is rendered. */
  readonly initialIndex?: number;
  readonly keyOf: (item: T) => string;
  readonly disabledOf?: (item: T) => boolean | undefined;
  readonly ariaLabelOf?: (item: T) => string | undefined;
  readonly className: string;
  /** A row's content; the row itself is a `Combobox.Item` for `item`. */
  readonly children: (item: T) => ReactNode;
}

/** The rows of a combobox list, flat, grouped or virtualized. Goes inside `Combobox.List`. */
export function Rows<T>({
  grouped,
  virtualized,
  reveal,
  initialIndex,
  keyOf,
  disabledOf,
  ariaLabelOf,
  className,
  children,
}: RowsProps<T>) {
  const row = (item: T, place?: Place) => (
    <BaseCombobox.Item
      key={keyOf(item)}
      value={item}
      index={place?.index}
      aria-setsize={place?.count}
      aria-posinset={place && place.index + 1}
      style={place?.style}
      disabled={disabledOf?.(item)}
      aria-label={ariaLabelOf?.(item)}
      className={className}
    >
      {children(item)}
    </BaseCombobox.Item>
  );

  if (virtualized) {
    return <VirtualRows row={row} reveal={reveal} initialIndex={initialIndex} />;
  }
  if (grouped) {
    return (
      <BaseCombobox.Collection>
        {(group: ComboboxGroup<T>) => (
          <BaseCombobox.Group key={group.id} items={group.items} className="tk-combobox-group">
            {group.label && (
              <BaseCombobox.GroupLabel className="tk-list-group-label">
                {group.label}
              </BaseCombobox.GroupLabel>
            )}
            <BaseCombobox.Collection>{(item: T) => row(item)}</BaseCombobox.Collection>
          </BaseCombobox.Group>
        )}
      </BaseCombobox.Collection>
    );
  }
  return <BaseCombobox.Collection>{(item: T) => row(item)}</BaseCombobox.Collection>;
}

/** Rows drawn beyond each edge of the view, so arrow keys always land on a rendered row. */
const overscan = 8;
/** A row's height until the first one is measured. */
const estimate = 36;

/** The spacer's top within the scroller's content. */
const startOf = (box: HTMLElement, scroller: HTMLElement) =>
  box.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

/**
 * Only the filtered rows in view (and a few either side), laid at their place in
 * a spacer as tall as all of them; the list around it is the scroller. Every row
 * takes the first row's height. Base UI walks the whole list by `index`, and
 * scrolls rendered rows into view itself; `reveal` reaches the rest.
 */
function VirtualRows<T>({
  row,
  reveal,
  initialIndex = 0,
}: {
  readonly row: (item: T, place: Place) => ReactNode;
  readonly reveal?: RefObject<Reveal | null>;
  readonly initialIndex?: number;
}) {
  const items = BaseCombobox.useFilteredItems<T>();
  const spacer = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(0);
  const height = rowHeight || estimate;
  const [view, setView] = useState({ top: initialIndex * estimate, size: 0 });
  const opening = useRef(initialIndex);

  useLayoutEffect(() => {
    const box = spacer.current;
    const scroller = box?.parentElement;
    if (!box || !scroller) return;
    const update = () =>
      setView({ top: scroller.scrollTop - startOf(box, scroller), size: scroller.clientHeight });
    if (opening.current) scroller.scrollTop = startOf(box, scroller) + opening.current * estimate;
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(scroller);
    return () => {
      scroller.removeEventListener('scroll', update);
      resize.disconnect();
    };
  }, []);

  // Once a row is measured, keep the scroll on the same row as everything moves to fit.
  useLayoutEffect(() => {
    const box = spacer.current;
    const scroller = box?.parentElement;
    const first = box?.firstElementChild as HTMLElement | null;
    if (!box || !scroller || !first || rowHeight) return;
    const measured = first.offsetHeight;
    if (!measured) return;
    const start = startOf(box, scroller);
    scroller.scrollTop = start + ((scroller.scrollTop - start) * measured) / estimate;
    setRowHeight(measured);
  });

  useImperativeHandle(
    reveal,
    () => (index: number) => {
      const box = spacer.current;
      const scroller = box?.parentElement;
      if (!box || !scroller) return;
      const top = startOf(box, scroller) + index * height;
      const pad = parseFloat(getComputedStyle(scroller).paddingTop) || 0;
      if (top - pad < scroller.scrollTop) scroller.scrollTop = top - pad;
      else if (top + height + pad > scroller.scrollTop + scroller.clientHeight) {
        scroller.scrollTop = top + height + pad - scroller.clientHeight;
      }
    },
    [height],
  );

  const first = Math.max(0, Math.floor(view.top / height) - overscan);
  const last = Math.min(items.length, Math.ceil((view.top + view.size) / height) + overscan);
  return (
    <div
      ref={spacer}
      role="presentation"
      className="tk-list-spacer"
      style={{ height: items.length * height }}
    >
      {items.slice(first, last).map((item, offset) => {
        const index = first + offset;
        return row(item, { index, count: items.length, style: { top: index * height } });
      })}
    </div>
  );
}

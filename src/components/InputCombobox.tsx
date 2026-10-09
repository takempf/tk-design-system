import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon } from '../icons/Icon';
import { useLayoutMorph } from '../motion/layout';
import { PopupMorph, usePopupMorph } from '../motion/popupMorph';
import { usePortalContainer } from '../theme/Theme';
import { cx, mergeRefs } from '../utils';
import { type ComboboxGroup, type Reveal, Rows } from './comboboxList';
import { overTrigger, useControllable } from './popup';

type Details = BaseCombobox.Root.ChangeEventDetails;

interface InputComboboxBase<V> {
  readonly variant: 'input';
  /** Suggestions as one list… */
  readonly items?: readonly V[];
  /** …or under headings. */
  readonly groups?: readonly ComboboxGroup<V>[];
  readonly inputValue?: string;
  readonly defaultInputValue?: string;
  readonly onInputValueChange?: (query: string, details: Details) => void;
  /** Defaults to an item's `label`, or the item itself as a string. */
  readonly itemToStringLabel?: (item: V) => string;
  /** Defaults to an item's `value`, or its label. */
  readonly itemToStringValue?: (item: V) => string;
  readonly isItemEqualToValue?: (a: V, b: V) => boolean;
  readonly isItemDisabled?: (item: V) => boolean;
  /** Whether an item matches the query. `null` when `items` are already filtered, as by a search. */
  readonly filter?: ((item: V, query: string) => boolean) | null;
  /** Shows at most this many suggestions. */
  readonly limit?: number;
  /** Renders only the suggestions in view, for long flat lists whose rows share one height. */
  readonly virtualized?: boolean;
  readonly renderItem?: (item: V) => ReactNode;
  readonly renderChip?: (item: V) => ReactNode;
  readonly itemAriaLabel?: (item: V) => string | undefined;
  readonly chipAriaLabel?: (item: V) => string;
  readonly removeAriaLabel?: (item: V) => string;
  readonly chipsLabel?: string;
  /** Enter with no highlighted suggestion, for free text or a pasted reference. */
  readonly onSubmit?: () => void;
  /**
   * Offers to create the query when no item is called exactly that. Its row ends
   * the list; choosing it calls this instead of selecting anything.
   */
  readonly onCreate?: (query: string) => void;
  readonly createLabel?: (query: string) => ReactNode;
  /** Suggestions stay closed until this many non-whitespace characters are typed. */
  readonly minQueryLength?: number;
  /** A button that clears the value (every chip, in a multiselect) and the query. */
  readonly clearable?: boolean;
  /** A button that opens every suggestion, before anything is typed. So does the down arrow. */
  readonly browsable?: boolean;
  /** Announced, and shown above the suggestions: progress, errors, counts. */
  readonly status?: ReactNode;
  /** Suggestions are on their way: the field shows it, and an empty list says nothing yet. */
  readonly loading?: boolean;
  readonly placeholder?: string;
  readonly selectedPlaceholder?: string;
  readonly emptyMessage?: ReactNode;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly name?: string;
  readonly id?: string;
  readonly className?: string;
  /** Not needed inside a `Field.Root` with a `Field.Label`. */
  readonly 'aria-label'?: string;
}

/** Selected values become removable chips, and the typed query survives dismissal. */
export interface MultipleInputComboboxProps<V> extends InputComboboxBase<V> {
  readonly multiple?: true;
  readonly value?: V[];
  readonly defaultValue?: V[];
  readonly onValueChange?: (value: V[], details: Details) => void;
}

/** The field shows the chosen item's label; leaving it restores that label. */
export interface SingleInputComboboxProps<V> extends InputComboboxBase<V> {
  readonly multiple: false;
  readonly value?: V | null;
  readonly defaultValue?: V | null;
  readonly onValueChange?: (value: V | null, details: Details) => void;
}

/** An editable combobox: type to filter, pick one value or several. */
export type InputComboboxProps<V> = MultipleInputComboboxProps<V> | SingleInputComboboxProps<V>;

/** The row that offers to create the query. Never selected; see `onCreate`. */
const create = { tkCreate: true } as const;
type Row<V> = V | typeof create;
const isCreate = (item: unknown): item is typeof create => item === create;

const field = (item: unknown, key: 'label' | 'value') =>
  typeof item === 'object' && item !== null && key in item
    ? String((item as Record<string, unknown>)[key])
    : undefined;
const labelOf = (item: unknown) => field(item, 'label') ?? String(item);
// One empty list, so Base UI isn't handed new items on every render.
const none: never[] = [];

/** Layout keys for the chips and the field after them, which glide as chips come and go. */
const chipKey = (value: string) => `chip:${value}`;
const inputKey = 'input';

export function InputCombobox<V>(props: InputComboboxProps<V>) {
  const {
    items = none,
    groups,
    itemToStringLabel = labelOf,
    itemToStringValue = (item: V) => field(item, 'value') ?? itemToStringLabel(item),
    isItemEqualToValue,
    isItemDisabled,
    filter,
    limit,
    virtualized,
    renderItem,
    renderChip = itemToStringLabel,
    itemAriaLabel,
    chipAriaLabel = itemToStringLabel,
    removeAriaLabel = (item) => `Remove ${itemToStringLabel(item)}`,
    chipsLabel = 'Selected filters',
    onSubmit,
    onCreate,
    createLabel = (query) => `Create “${query}”`,
    minQueryLength = 1,
    clearable,
    browsable,
    status,
    loading,
    placeholder = 'Search…',
    selectedPlaceholder = placeholder,
    emptyMessage = 'Nothing matches.',
    size = 'md',
    disabled,
    readOnly,
    required,
    name,
    id,
    className,
    'aria-label': ariaLabel,
  } = props;
  const multiple = props.multiple !== false;
  const portal = usePortalContainer();
  const [value, setValue] = useControllable<V[] | V | null>(
    props.value,
    props.defaultValue ?? (multiple ? [] : null),
  );
  const chosen = multiple ? (value as V[]) : [];
  const [query, setQuery] = useControllable(props.inputValue, props.defaultInputValue ?? '');
  const [requestedOpen, setOpen] = useState(false);
  // Opened from the button or the down arrow: everything, whatever has been typed.
  const [browsing, setBrowsing] = useState(false);
  const typed = query.trim();
  const open = requestedOpen && !disabled && (browsing || typed.length >= minQueryLength);
  const highlighted = useRef<Row<V> | undefined>(undefined);
  const inputGroup = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const actions = useRef<BaseCombobox.Root.Actions>(null);
  const reveal = useRef<Reveal>(null);
  // Chips make room for each other, and one picked from the list sets out from
  // its row, above the list (in the portal, which keeps the theme). The field
  // is their frame: it grows and shrinks smoothly as they wrap onto more lines
  // or fewer.
  const chips = useLayoutMorph(chosen.map((item) => itemToStringValue(item)).join('\n'), portal);
  const fieldRef = useMemo(() => mergeRefs(inputGroup, chips.frame), [chips.frame]);

  // The suggestions follow `open` through a morph, a frame behind it, so the
  // transition never holds up the typing that opens them.
  const popup = usePopupMorph({ prefix: 'field' });
  const { setOpen: setShown } = popup;
  const wanted = useRef(false);
  useLayoutEffect(() => {
    if (wanted.current === open) return;
    wanted.current = open;
    setShown(open);
  }, [open, setShown]);

  useEffect(() => {
    if (!popup.open) {
      highlighted.current = undefined;
      setBrowsing(false);
      // This editable variant leaves focus in the field and has no exit delay.
      actions.current?.unmount();
    }
  }, [popup.open]);

  // Open, the field squares its corners on the side its suggestions carry on from.
  const followSide = useCallback((element: HTMLDivElement | null) => {
    const positioner = element?.parentElement;
    if (!positioner) return;
    const sync = () => {
      if (inputGroup.current) inputGroup.current.dataset.side = positioner.dataset.side ?? 'bottom';
    };
    sync();
    const watch = new MutationObserver(sync);
    watch.observe(positioner, { attributes: true, attributeFilter: ['data-side'] });
    return () => watch.disconnect();
  }, []);

  const changeQuery = (next: string, details: Details) => {
    setQuery(next);
    props.onInputValueChange?.(next, details);
  };
  // A pick clears the query. When the pick also closes the suggestions, the
  // query waits until they have folded away: cleared any sooner, the list would
  // show every row on its way out.
  const pendingClear = useRef<Details | null>(null);
  useLayoutEffect(() => {
    const details = pendingClear.current;
    if (!details || (!open && popup.open)) return;
    pendingClear.current = null;
    changeQuery('', details);
  });
  const close = () => {
    highlighted.current = undefined;
    setOpen(false);
  };

  const all = groups ? groups.flatMap((group) => group.items) : items;
  const lowered = typed.toLowerCase();
  const creatable =
    onCreate !== undefined &&
    typed !== '' &&
    !all.some((item) => itemToStringLabel(item).trim().toLowerCase() === lowered);
  const rows: readonly (Row<V> | ComboboxGroup<Row<V>>)[] = groups
    ? creatable
      ? [...groups, { id: 'tk-create', label: '', items: [create] }]
      : groups
    : creatable
      ? [...items, create]
      : items;

  const matches = (item: V, text: string) =>
    filter
      ? filter(item, text)
      : itemToStringLabel(item).toLowerCase().includes(text.trim().toLowerCase());

  const content = (item: Row<V>) =>
    isCreate(item) ? (
      <>
        <span className="tk-list-text">{createLabel(typed)}</span>
        <span className="tk-list-indicator">
          <Icon name="plus" />
        </span>
      </>
    ) : (
      <>
        {renderItem ? (
          <span className="tk-list-content">{renderItem(item)}</span>
        ) : (
          <span className="tk-list-text">{itemToStringLabel(item)}</span>
        )}
        <BaseCombobox.ItemIndicator className="tk-list-indicator">
          <Icon name="check" />
        </BaseCombobox.ItemIndicator>
      </>
    );

  const input = (
    <BaseCombobox.Input
      className="tk-combobox-field-input"
      placeholder={readOnly ? undefined : chosen.length ? selectedPlaceholder : placeholder}
      aria-label={ariaLabel}
      data-tk-layout={multiple ? inputKey : undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventBaseUIHandler();
          event.preventDefault();
          event.stopPropagation();
          close();
        } else if (
          event.key === 'Enter' &&
          !event.nativeEvent.isComposing &&
          !highlighted.current &&
          (multiple || onSubmit)
        ) {
          event.preventBaseUIHandler();
          event.preventDefault();
          close();
          onSubmit?.();
        }
      }}
    />
  );

  return (
    <PopupMorph.Provider value={popup.state}>
      <BaseCombobox.Root<Row<V>, boolean>
        multiple={multiple}
        modal={false}
        // Searched results arrive after the query that asked for them, and the
        // suggestions a typed query opens arrive a frame after it (they follow
        // `open` through a morph), so both are highlighted as they land
        // ('always', which Base UI's Combobox types omit). Browsing highlights
        // nothing until the arrows move.
        autoHighlight={
          (filter === null || (typed !== '' && !browsing) ? 'always' : true) as boolean
        }
        virtualized={virtualized}
        limit={limit}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        name={name}
        id={id}
        actionsRef={actions}
        items={rows as Row<V>[]}
        value={value as Row<V>[] | Row<V> | null}
        inputValue={query}
        open={popup.open}
        onOpenChange={(next, details) => {
          setOpen(next);
          if (!next) highlighted.current = undefined;
          else if (browsable && ['trigger-press', 'list-navigation'].includes(details.reason)) {
            setBrowsing(true);
          }
        }}
        onItemHighlighted={(item, details) => {
          highlighted.current = item;
          if (item !== undefined && details.reason !== 'pointer') reveal.current?.(details.index);
        }}
        onInputValueChange={(next, details) => {
          // In a multiselect, free text is meaningful and survives dismissal; a
          // pick clears it once the suggestions have folded away (see pendingClear).
          if (multiple && details.reason === 'input-clear') {
            details.cancel();
            if (details.isItemPress) pendingClear.current = details;
            return;
          }
          if (details.reason === 'input-change') setBrowsing(false);
          changeQuery(next, details);
        }}
        onValueChange={(next, details) => {
          const picked = multiple ? (next as Row<V>[]).includes(create) : next === create;
          if (picked) {
            details.cancel();
            close();
            onCreate?.(typed);
            if (multiple) changeQuery('', details);
            return;
          }
          if (multiple) {
            const values = next as V[];
            // A chip picked from the list sets out from its row's label: the row
            // pressed, or the one highlighted when it was picked with the keyboard.
            const target = details.event?.target;
            const row =
              (target instanceof Element && target.closest('[role="option"]')) ||
              surface.current?.querySelector('[role="option"][data-highlighted]');
            const label = row?.querySelector(':scope > :is(.tk-list-text, .tk-list-content)');
            const had = new Set(chosen.map((item) => itemToStringValue(item)));
            const picked = values.find((item) => !had.has(itemToStringValue(item)));
            if (label && picked !== undefined && details.reason === 'item-press') {
              chips.from(chipKey(itemToStringValue(picked)), label);
            }
            (props as MultipleInputComboboxProps<V>).onValueChange?.(values, details);
            if (details.isCanceled) return;
            setValue(values);
            if (values.length > chosen.length) pendingClear.current = details;
          } else {
            (props as SingleInputComboboxProps<V>).onValueChange?.(next as V | null, details);
            if (!details.isCanceled) setValue(next as V | null);
          }
        }}
        itemToStringLabel={(item) => (isCreate(item) ? typed : itemToStringLabel(item))}
        itemToStringValue={(item) => (isCreate(item) ? '' : itemToStringValue(item))}
        isItemEqualToValue={(a, b) =>
          isCreate(a) || isCreate(b)
            ? a === b
            : (isItemEqualToValue?.(a, b) ?? itemToStringValue(a) === itemToStringValue(b))
        }
        filter={
          filter === null
            ? null
            : (item, text) =>
                isCreate(item) || (text.trim().length >= minQueryLength && matches(item, text))
        }
      >
        <BaseCombobox.InputGroup
          ref={fieldRef}
          className={cx('tk-combobox-field', className)}
          data-size={size}
          data-loading={loading || undefined}
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget) &&
              !surface.current?.contains(event.relatedTarget)
            ) {
              close();
            }
          }}
        >
          {loading ? (
            <span className="tk-spinner tk-combobox-field-icon" aria-hidden="true" />
          ) : (
            <Icon name="search" className="tk-combobox-field-icon" />
          )}
          {multiple ? (
            <BaseCombobox.Chips
              ref={chips.ref}
              className="tk-combobox-chips"
              aria-label={chipsLabel}
            >
              {chosen.map((item) => (
                <BaseCombobox.Chip
                  key={itemToStringValue(item)}
                  className="tk-combobox-chip"
                  aria-label={chipAriaLabel(item)}
                  data-tk-layout={chipKey(itemToStringValue(item))}
                >
                  {renderChip(item)}
                  <BaseCombobox.ChipRemove
                    className="tk-combobox-chip-remove"
                    aria-label={removeAriaLabel(item)}
                  >
                    <Icon name="close" />
                  </BaseCombobox.ChipRemove>
                </BaseCombobox.Chip>
              ))}
              {input}
            </BaseCombobox.Chips>
          ) : (
            input
          )}
          {(clearable || browsable) && (
            <span className="tk-combobox-actions">
              {clearable && (
                <BaseCombobox.Clear className="tk-combobox-action" aria-label="Clear">
                  <Icon name="close" />
                </BaseCombobox.Clear>
              )}
              {browsable && (
                <BaseCombobox.Trigger className="tk-combobox-action" aria-label="Show all">
                  <Icon name="chevron-down" />
                </BaseCombobox.Trigger>
              )}
            </span>
          )}
          {/* The field stays in use while its suggestions are open, so it can't
            be the container itself: its outline is. Open, the suggestions are
            the field grown — laid over it, seen through, and carried on below
            it, one edge and one ring round the whole — and closing, they shrink
            back into its outline. */}
          <PopupMorph.Trigger>
            <span className="tk-combobox-outline" aria-hidden="true" />
          </PopupMorph.Trigger>
        </BaseCombobox.InputGroup>
        <BaseCombobox.Portal container={portal}>
          <BaseCombobox.Positioner className="tk-positioner" sideOffset={overTrigger} align="start">
            {/* A nonmodal surface keeps the chips accessible while the list is open;
              Base UI's Popup focus manager hides the input's chip siblings. */}
            <PopupMorph.Popup>
              <div
                ref={mergeRefs(surface, followSide)}
                role="presentation"
                data-size={size}
                data-indicator="end"
                className="tk-popup tk-list-popup tk-combobox-suggestions"
              >
                {/* Below the field (or above it): the rest of the field, grown. */}
                <div className="tk-combobox-suggestions-body">
                  <BaseCombobox.Status className="tk-combobox-status">{status}</BaseCombobox.Status>
                  <BaseCombobox.Empty className="tk-list-empty">
                    {loading ? null : emptyMessage}
                  </BaseCombobox.Empty>
                  <BaseCombobox.List
                    className="tk-list tk-combobox-suggestions-list"
                    aria-busy={loading || undefined}
                  >
                    <Rows<Row<V>>
                      grouped={groups !== undefined}
                      virtualized={virtualized}
                      reveal={reveal}
                      keyOf={(item) => (isCreate(item) ? 'tk-create' : itemToStringValue(item))}
                      disabledOf={(item) => !isCreate(item) && isItemDisabled?.(item)}
                      ariaLabelOf={(item) => (isCreate(item) ? undefined : itemAriaLabel?.(item))}
                      className="tk-list-item tk-combobox-suggestion"
                    >
                      {content}
                    </Rows>
                  </BaseCombobox.List>
                </div>
              </div>
            </PopupMorph.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </PopupMorph.Provider>
  );
}

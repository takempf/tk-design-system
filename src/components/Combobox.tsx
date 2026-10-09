import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { PopupMorph, usePopupMorph } from '../motion/popupMorph';
import { usePortalContainer } from '../theme/Theme';
import { cx } from '../utils';
import { type ComboboxGroup, type Reveal, Rows } from './comboboxList';
import { InputCombobox, type InputComboboxProps } from './InputCombobox';
import { overTrigger, useControllable } from './popup';
import type { Option } from './Select';

interface SelectComboboxBase<V> {
  readonly variant?: 'select';
  /** The options as one list… */
  readonly items?: readonly Option<V>[];
  /** …or under headings. */
  readonly groups?: readonly ComboboxGroup<Option<V>>[];
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Shown in the trigger, then carried into the search field when it opens. */
  readonly placeholder?: string;
  readonly emptyMessage?: ReactNode;
  /** A button in the trigger, beside the chevron, that clears the choice. */
  readonly clearable?: boolean;
  /** Renders only the options in view, for long flat lists. */
  readonly virtualized?: boolean;
  /** Shows at most this many options. */
  readonly limit?: number;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  /** Opens and searches as usual, but the choice can't change. */
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly name?: string;
  readonly id?: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

export interface SingleSelectComboboxProps<V> extends SelectComboboxBase<V> {
  readonly multiple?: false;
  readonly value?: V | null;
  readonly defaultValue?: V | null;
  readonly onValueChange?: (value: V | null) => void;
}

/** Checks off several options; the list stays open, and the trigger lists them. */
export interface MultipleSelectComboboxProps<V> extends SelectComboboxBase<V> {
  readonly multiple: true;
  readonly value?: V[];
  readonly defaultValue?: V[];
  readonly onValueChange?: (value: V[]) => void;
}

export type SelectComboboxProps<V> = SingleSelectComboboxProps<V> | MultipleSelectComboboxProps<V>;

const interactions = ['input', 'keydown', 'pointerdown', 'wheel', 'touchstart'] as const;

// Kept outside the component: Base UI memoizes on these and syncs them into its
// store whenever they change, so new ones each render would redo that per keystroke.
const labelOf = (option: Option<unknown>) => option.label;
const sameOption = (a: Option<unknown>, b: Option<unknown>) => Object.is(a.value, b.value);

/**
 * For the list's ref: as the popup opens, scrolls the chosen row to the edge of
 * the list beside the search field, so the value travels the shortest way from
 * the trigger onto its row. It must happen before the view transition captures
 * the open popup; Base UI brings the row into view a frame later, which some
 * browsers would only catch after the value had flown to the row's unscrolled
 * place, often offscreen. Base UI settles the popup's size and side after it
 * mounts, so each change re-aligns — until the list is first used.
 */
function useChosenRowBesideSearch() {
  return useCallback((list: HTMLElement | null) => {
    const popup = list?.closest<HTMLElement>('.tk-combobox-popup');
    if (!list || !popup) return;
    const align = () => {
      const row = list.querySelector<HTMLElement>('[data-selected]');
      if (!row) return;
      const box = list.getBoundingClientRect();
      const top = row.getBoundingClientRect().top - box.top - list.clientTop + list.scrollTop;
      const padding = getComputedStyle(list);
      list.scrollTop =
        popup.dataset.side === 'top'
          ? top + row.offsetHeight + parseFloat(padding.paddingBottom) - list.clientHeight
          : top - parseFloat(padding.paddingTop);
    };
    align();
    const watch = new MutationObserver(align);
    for (const element of [popup, popup.parentElement]) {
      if (element) {
        watch.observe(element, { attributes: true, attributeFilter: ['style', 'data-side'] });
      }
    }
    const stop = () => {
      watch.disconnect();
      for (const type of interactions) popup.removeEventListener(type, stop, true);
    };
    for (const type of interactions) popup.addEventListener(type, stop, true);
    return stop;
  }, []);
}

/**
 * A searchable select: a quiet trigger that opens into a filterable list.
 *
 * The trigger is the popup's container, closed. It opens over itself, and the
 * search field is the trigger made editable: it lands exactly on it, laid out
 * the same, with the clear button and chevron where they were (the chevron
 * closes it again). The frame grows around the list, below it or above when
 * there is no room. With nothing chosen, the placeholder stays where it is,
 * now in the field; with a value, the value slides onto its row in the list,
 * and the chosen row slides back as the list folds away. A multiselect's
 * trigger lists its choices, which stay where they are.
 */
function SelectCombobox<V>(props: SelectComboboxProps<V>) {
  const {
    items,
    groups,
    open,
    onOpenChange,
    placeholder = 'Search…',
    emptyMessage = 'Nothing matches.',
    clearable,
    virtualized,
    limit,
    size = 'md',
    disabled,
    readOnly,
    required,
    name,
    id,
    className,
    'aria-label': ariaLabel,
  } = props;
  const multiple = props.multiple === true;
  const popup = usePopupMorph({ open, onOpenChange, prefix: 'combobox' });
  const [current, setCurrent] = useControllable<V | null | V[]>(
    props.value,
    props.defaultValue ?? (multiple ? [] : null),
  );
  const [query, setQuery] = useState('');
  const options = groups ? groups.flatMap((group) => group.items) : (items ?? []);
  const find = (value: V) => options.find((option) => Object.is(option.value, value));
  const chosen = multiple
    ? (current as V[]).map(find).filter((option) => option !== undefined)
    : [find(current as V)].filter((option) => option !== undefined);
  const selected = multiple ? null : (chosen[0] ?? null);
  const shown = chosen.map((option) => option.label).join(', ');
  // A single value travels to its row and back; several stay in the trigger.
  const carried = !multiple || chosen.length === 0;
  const container = usePortalContainer();
  const alignChosen = useChosenRowBesideSearch();
  const reveal = useRef<Reveal>(null);
  const changeOpen = (next: boolean) => {
    popup.setOpen(next);
    if (!next) setQuery('');
  };

  return (
    <PopupMorph.Provider value={popup.state}>
      <BaseCombobox.Root<Option<V>, boolean>
        multiple={multiple}
        items={(groups ?? items ?? []) as Option<V>[]}
        value={multiple ? chosen : selected}
        onValueChange={(next) => {
          if (multiple) {
            const values = (next as Option<V>[]).map((option) => option.value);
            setCurrent(values);
            (props as MultipleSelectComboboxProps<V>).onValueChange?.(values);
          } else {
            const value = (next as Option<V> | null)?.value ?? null;
            setCurrent(value);
            (props as SingleSelectComboboxProps<V>).onValueChange?.(value);
          }
        }}
        inputValue={query}
        onInputValueChange={setQuery}
        open={popup.open}
        onOpenChange={changeOpen}
        onOpenChangeComplete={popup.onOpenChangeComplete}
        onItemHighlighted={(item, details) => {
          if (item !== undefined && details.reason !== 'pointer') reveal.current?.(details.index);
        }}
        itemToStringLabel={labelOf}
        isItemEqualToValue={sameOption}
        virtualized={virtualized}
        limit={limit}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        name={name}
        id={id}
      >
        {/* The container is the trigger and its clear button; the trigger has the look. */}
        <PopupMorph.Trigger>
          <span className="tk-combobox-control" data-size={size}>
            <BaseCombobox.Trigger
              className={cx('tk-select-trigger tk-combobox-trigger', className)}
              data-size={size}
              data-clearable={clearable || undefined}
              data-tk-frame=""
              aria-label={ariaLabel}
            >
              <span className="tk-select-value" data-placeholder={chosen.length ? undefined : ''}>
                <PopupMorph.Part side="trigger" when={carried}>
                  <span>{shown || placeholder}</span>
                </PopupMorph.Part>
              </span>
              <PopupMorph.Part name="icon" side="trigger" fit="icon">
                <BaseCombobox.Icon className="tk-select-icon">
                  <Icon name="chevron-updown" />
                </BaseCombobox.Icon>
              </PopupMorph.Part>
            </BaseCombobox.Trigger>
            {clearable && (
              <PopupMorph.Part name="clear" side="trigger" fit="icon">
                <BaseCombobox.Clear
                  className="tk-combobox-action tk-combobox-clear"
                  aria-label="Clear"
                >
                  <Icon name="close" />
                </BaseCombobox.Clear>
              </PopupMorph.Part>
            )}
          </span>
        </PopupMorph.Trigger>
        <BaseCombobox.Portal container={container}>
          <BaseCombobox.Positioner className="tk-positioner" sideOffset={overTrigger} align="start">
            <PopupMorph.Popup>
              <BaseCombobox.Popup
                className="tk-popup tk-list-popup tk-combobox-popup"
                data-size={size}
                data-indicator="end"
              >
                {/* The trigger, made editable: laid out like it, so each part stays put. */}
                <div className="tk-combobox-search" data-clearable={clearable || undefined}>
                  <BaseCombobox.Input
                    className="tk-combobox-input"
                    aria-label={ariaLabel ?? placeholder}
                  />
                  {query === '' && (
                    <PopupMorph.Part side="popup" when={chosen.length === 0}>
                      <span className="tk-combobox-placeholder" aria-hidden="true">
                        {placeholder}
                      </span>
                    </PopupMorph.Part>
                  )}
                  {clearable && (
                    <PopupMorph.Part name="clear" side="popup" fit="icon">
                      <BaseCombobox.Clear
                        className="tk-combobox-action tk-combobox-clear"
                        aria-label="Clear"
                      >
                        <Icon name="close" />
                      </BaseCombobox.Clear>
                    </PopupMorph.Part>
                  )}
                  {/* The trigger's chevron, still where it was: pressing it closes. */}
                  <PopupMorph.Part name="icon" side="popup" fit="icon">
                    <span
                      className="tk-select-icon tk-combobox-close"
                      aria-hidden="true"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => changeOpen(false)}
                    >
                      <Icon name="chevron-updown" />
                    </span>
                  </PopupMorph.Part>
                </div>
                <BaseCombobox.Empty className="tk-list-empty">{emptyMessage}</BaseCombobox.Empty>
                <BaseCombobox.List ref={multiple ? undefined : alignChosen} className="tk-list">
                  <Rows<Option<V>>
                    grouped={groups !== undefined}
                    virtualized={virtualized}
                    reveal={reveal}
                    initialIndex={chosen[0] ? options.indexOf(chosen[0]) : 0}
                    keyOf={(option) => String(option.value)}
                    disabledOf={(option) => option.disabled}
                    className="tk-list-item"
                  >
                    {(option) => (
                      <>
                        <PopupMorph.Part
                          side="popup"
                          when={selected !== null && Object.is(option.value, selected.value)}
                        >
                          <span className="tk-list-text">{option.label}</span>
                        </PopupMorph.Part>
                        <BaseCombobox.ItemIndicator className="tk-list-indicator">
                          <Icon name="check" />
                        </BaseCombobox.ItemIndicator>
                      </>
                    )}
                  </Rows>
                </BaseCombobox.List>
              </BaseCombobox.Popup>
            </PopupMorph.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </PopupMorph.Provider>
  );
}

export type ComboboxProps<V> = SelectComboboxProps<V> | InputComboboxProps<V>;

/**
 * A searchable select by default (`multiple` checks off several), or an editable
 * field with `variant="input"` that picks one value or, as chips, several.
 */
export function Combobox<V>(props: SelectComboboxProps<V>): ReactNode;
export function Combobox<V>(props: InputComboboxProps<V>): ReactNode;
export function Combobox<V>(props: ComboboxProps<V>) {
  return props.variant === 'input' ? <InputCombobox {...props} /> : <SelectCombobox {...props} />;
}

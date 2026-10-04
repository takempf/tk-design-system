import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { useCallback, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { Morph, useMorphName } from '../motion/morph';
import { usePortalContainer } from '../theme/Theme';
import { cx } from '../utils';
import { overTrigger, useControllable, useGrowFrom, useMorphingOpen } from './popup';
import type { Option } from './Select';

export interface ComboboxProps<V> {
  readonly items: readonly Option<V>[];
  readonly value?: V | null;
  readonly defaultValue?: V | null;
  readonly onValueChange?: (value: V | null) => void;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** Shown in the trigger, then carried into the search field when it opens. */
  readonly placeholder?: string;
  readonly emptyMessage?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly name?: string;
  readonly id?: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

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
 * It opens over itself: the search field lands on the trigger and the trigger's
 * frame grows into the popup's around the list (below it, or above when there is
 * no room), so the trigger's text is never shown twice. That text travels between the two
 * states. With nothing chosen, the placeholder slides from the trigger into the
 * search field; with a value, the value slides onto its row in the list, and the
 * chosen row slides back as the list folds away.
 */
export function Combobox<V>({
  items,
  value,
  defaultValue = null,
  onValueChange,
  open,
  onOpenChange,
  placeholder = 'Search…',
  emptyMessage = 'Nothing matches.',
  size = 'md',
  disabled,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: ComboboxProps<V>) {
  const morphName = useMorphName('combobox');
  const [isOpen, setOpen] = useMorphingOpen(open, onOpenChange, morphName);
  const [current, setCurrent] = useControllable(value, defaultValue);
  const [query, setQuery] = useState('');
  const selected = items.find((item) => Object.is(item.value, current)) ?? null;
  const container = usePortalContainer();
  const trigger = useRef<HTMLButtonElement>(null);
  const grow = useGrowFrom(trigger);
  const alignChosen = useChosenRowBesideSearch();

  return (
    <BaseCombobox.Root
      items={items as Option<V>[]}
      value={selected}
      onValueChange={(next) => {
        const option = next as Option<V> | null;
        setCurrent(option?.value ?? null);
        onValueChange?.(option?.value ?? null);
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      open={isOpen}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
      itemToStringLabel={labelOf}
      isItemEqualToValue={sameOption}
      disabled={disabled}
      name={name}
      id={id}
    >
      <BaseCombobox.Trigger
        ref={trigger}
        className={cx('tk-select-trigger tk-combobox-trigger', className)}
        data-size={size}
        aria-label={ariaLabel}
      >
        <span className="tk-select-value" data-placeholder={selected ? undefined : ''}>
          <Morph name={morphName} active={!isOpen} fit="text" scope={morphName}>
            <span>{selected?.label ?? placeholder}</span>
          </Morph>
        </span>
        <BaseCombobox.Icon className="tk-select-icon">
          <Icon name="chevron-updown" />
        </BaseCombobox.Icon>
      </BaseCombobox.Trigger>
      <BaseCombobox.Portal container={container}>
        <BaseCombobox.Positioner className="tk-positioner" sideOffset={overTrigger} align="start">
          <BaseCombobox.Popup
            ref={grow}
            className="tk-popup tk-list-popup tk-over-trigger tk-combobox-popup"
            data-size={size}
          >
            <div className="tk-combobox-search">
              <Icon name="search" className="tk-combobox-search-icon" />
              <BaseCombobox.Input
                className="tk-combobox-input"
                aria-label={ariaLabel ?? placeholder}
              />
              {query === '' && (
                <Morph name={morphName} active={isOpen && !selected} fit="text" scope={morphName}>
                  <span className="tk-combobox-placeholder" aria-hidden="true">
                    {placeholder}
                  </span>
                </Morph>
              )}
            </div>
            <BaseCombobox.Empty className="tk-list-empty">{emptyMessage}</BaseCombobox.Empty>
            <BaseCombobox.List ref={alignChosen} className="tk-list">
              {(item: Option<V>) => (
                <BaseCombobox.Item
                  key={String(item.value)}
                  value={item}
                  disabled={item.disabled}
                  className="tk-list-item"
                >
                  <BaseCombobox.ItemIndicator className="tk-list-indicator">
                    <Icon name="check" />
                  </BaseCombobox.ItemIndicator>
                  <Morph
                    name={morphName}
                    active={isOpen && selected !== null && Object.is(item.value, selected.value)}
                    fit="text"
                    scope={morphName}
                  >
                    <span className="tk-list-text">{item.label}</span>
                  </Morph>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

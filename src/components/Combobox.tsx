import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { useState } from 'react';
import { Icon } from '../icons/Icon';
import { Morph, useMorphName } from '../motion/morph';
import { usePortalContainer } from '../theme/Theme';
import { cx } from '../utils';
import { useControllable, useMorphingOpen } from './popup';
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

/**
 * A searchable select: a quiet trigger that opens into a filterable list.
 *
 * The text the two states share travels between them. With nothing chosen, the
 * placeholder slides from the trigger into the search field; with a value, the
 * value slides onto its row in the list, and the chosen row slides back.
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
      itemToStringLabel={(option: Option<V>) => option.label}
      isItemEqualToValue={(a: Option<V>, b: Option<V>) => Object.is(a.value, b.value)}
      disabled={disabled}
      name={name}
      id={id}
    >
      <BaseCombobox.Trigger
        className={cx('tk-select-trigger', className)}
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
        <BaseCombobox.Positioner className="tk-positioner" sideOffset={6} align="start">
          <BaseCombobox.Popup className="tk-popup tk-list-popup tk-combobox-popup">
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
            <BaseCombobox.List className="tk-list">
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

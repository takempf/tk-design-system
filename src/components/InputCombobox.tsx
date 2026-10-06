import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Icon } from '../icons/Icon';
import { usePortalContainer } from '../theme/Theme';
import { cx } from '../utils';

export interface ComboboxGroup<V> {
  readonly id: string;
  readonly label: string;
  readonly items: V[];
}

/** An editable combobox with grouped suggestions and removable selected values. */
export interface InputComboboxProps<V> {
  readonly variant: 'input';
  readonly groups: readonly ComboboxGroup<V>[];
  readonly value: V[];
  readonly inputValue: string;
  readonly onInputValueChange: (query: string) => void;
  readonly onValueChange: NonNullable<BaseCombobox.Root.Props<V, true>['onValueChange']>;
  readonly itemToStringLabel: (item: V) => string;
  readonly itemToStringValue: (item: V) => string;
  readonly isItemEqualToValue?: (a: V, b: V) => boolean;
  readonly filter?: (item: V, query: string) => boolean;
  readonly renderItem?: (item: V) => ReactNode;
  readonly renderChip?: (item: V) => ReactNode;
  readonly itemAriaLabel?: (item: V) => string | undefined;
  readonly chipAriaLabel?: (item: V) => string;
  readonly removeAriaLabel?: (item: V) => string;
  readonly chipsLabel?: string;
  /** Enter with no highlighted suggestion, for free text or a pasted reference. */
  readonly onSubmit?: () => void;
  /** Suggestions stay closed until this many non-whitespace characters are typed. */
  readonly minQueryLength?: number;
  readonly placeholder?: string;
  readonly selectedPlaceholder?: string;
  readonly emptyMessage?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly name?: string;
  readonly id?: string;
  readonly className?: string;
  readonly 'aria-label': string;
}

export function InputCombobox<V>({
  groups,
  value,
  inputValue,
  onInputValueChange,
  onValueChange,
  itemToStringLabel,
  itemToStringValue,
  isItemEqualToValue,
  filter,
  renderItem = itemToStringLabel,
  renderChip = itemToStringLabel,
  itemAriaLabel,
  chipAriaLabel = itemToStringLabel,
  removeAriaLabel = (item) => `Remove ${itemToStringLabel(item)}`,
  chipsLabel = 'Selected filters',
  onSubmit,
  minQueryLength = 1,
  placeholder = 'Search…',
  selectedPlaceholder = placeholder,
  emptyMessage = 'Nothing matches.',
  size = 'md',
  disabled,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: InputComboboxProps<V>) {
  const portal = usePortalContainer();
  const [requestedOpen, setOpen] = useState(false);
  const open = requestedOpen && !disabled && inputValue.trim().length >= minQueryLength;
  const highlighted = useRef<V | undefined>(undefined);
  const surface = useRef<HTMLDivElement>(null);
  const actions = useRef<BaseCombobox.Root.Actions>(null);

  useEffect(() => {
    if (!open) {
      highlighted.current = undefined;
      // This editable variant leaves focus in the field and has no exit delay.
      actions.current?.unmount();
    }
  }, [open]);

  return (
    <BaseCombobox.Root<V, true>
      multiple
      modal={false}
      autoHighlight
      disabled={disabled}
      name={name}
      id={id}
      actionsRef={actions}
      items={groups}
      value={value}
      inputValue={inputValue}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) highlighted.current = undefined;
      }}
      onItemHighlighted={(item) => {
        highlighted.current = item;
      }}
      onInputValueChange={(next, details) => {
        // Unlike a select, free text is meaningful and survives dismissal.
        if (details.reason === 'input-clear' && !details.isItemPress) details.cancel();
        else onInputValueChange(next);
      }}
      onValueChange={(next, details) => {
        onValueChange(next, details);
        if (!details.isCanceled && next.length > value.length) onInputValueChange('');
      }}
      itemToStringLabel={itemToStringLabel}
      itemToStringValue={itemToStringValue}
      isItemEqualToValue={isItemEqualToValue}
      filter={(item, query) =>
        query.trim().length >= minQueryLength &&
        (filter?.(item, query) ??
          itemToStringLabel(item).toLowerCase().includes(query.trim().toLowerCase()))
      }
    >
      <BaseCombobox.InputGroup
        className={cx('tk-combobox-field', className)}
        data-size={size}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget) &&
            !surface.current?.contains(event.relatedTarget)
          ) {
            setOpen(false);
            highlighted.current = undefined;
          }
        }}
      >
        <Icon name="search" className="tk-combobox-field-icon" />
        <BaseCombobox.Chips className="tk-combobox-chips" aria-label={chipsLabel}>
          {value.map((item) => (
            <BaseCombobox.Chip
              key={itemToStringValue(item)}
              className="tk-combobox-chip"
              aria-label={chipAriaLabel(item)}
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
          <BaseCombobox.Input
            className="tk-combobox-field-input"
            placeholder={value.length ? selectedPlaceholder : placeholder}
            aria-label={ariaLabel}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventBaseUIHandler();
                event.preventDefault();
                event.stopPropagation();
                highlighted.current = undefined;
                setOpen(false);
              } else if (
                event.key === 'Enter' &&
                !event.nativeEvent.isComposing &&
                !highlighted.current
              ) {
                event.preventBaseUIHandler();
                event.preventDefault();
                setOpen(false);
                onSubmit?.();
              }
            }}
          />
        </BaseCombobox.Chips>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal container={portal}>
        <BaseCombobox.Positioner className="tk-positioner" sideOffset={4} align="start">
          {/* A nonmodal surface keeps the chips accessible while the list is open;
              Base UI's Popup focus manager hides the input's chip siblings. */}
          <div
            ref={surface}
            role="presentation"
            data-size={size}
            className="tk-popup tk-list-popup tk-combobox-suggestions"
          >
            <BaseCombobox.Empty className="tk-list-empty">{emptyMessage}</BaseCombobox.Empty>
            <BaseCombobox.List className="tk-list tk-combobox-suggestions-list">
              <BaseCombobox.Collection>
                {(group: ComboboxGroup<V>) => (
                  <BaseCombobox.Group
                    key={group.id}
                    items={group.items}
                    className="tk-combobox-group"
                  >
                    <BaseCombobox.GroupLabel className="tk-list-group-label">
                      {group.label}
                    </BaseCombobox.GroupLabel>
                    <BaseCombobox.Collection>
                      {(item: V) => (
                        <BaseCombobox.Item
                          key={itemToStringValue(item)}
                          value={item}
                          className="tk-list-item tk-combobox-suggestion"
                          aria-label={itemAriaLabel?.(item)}
                        >
                          {renderItem(item)}
                        </BaseCombobox.Item>
                      )}
                    </BaseCombobox.Collection>
                  </BaseCombobox.Group>
                )}
              </BaseCombobox.Collection>
            </BaseCombobox.List>
          </div>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

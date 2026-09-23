import { Select as BaseSelect } from '@base-ui/react/select';
import { useRef } from 'react';
import { Icon } from '../icons/Icon';
import { Morph, useMorphName } from '../motion/morph';
import { usePortalContainer } from '../theme/Theme';
import { cx } from '../utils';
import { useControllable, useMorphingOpen, useUnfoldFrom } from './popup';

export interface Option<V> {
  readonly value: V;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps<V> {
  readonly items: readonly Option<V>[];
  readonly value?: V | null;
  readonly defaultValue?: V | null;
  readonly onValueChange?: (value: V | null) => void;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placeholder?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly name?: string;
  readonly id?: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

/**
 * A single-choice list. It opens over its trigger with the chosen row exactly on
 * the trigger's value, unfolding out of the trigger's box; choosing another row
 * carries that label back into the trigger as the list folds away. Where there
 * is no room to overlay (or on touch) it drops below instead.
 */
export function Select<V>({
  items,
  value,
  defaultValue = null,
  onValueChange,
  open,
  onOpenChange,
  placeholder = 'Choose…',
  size = 'md',
  disabled,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: SelectProps<V>) {
  const morphName = useMorphName('select');
  // Opening moves nothing (the row lands on the value), so only closing morphs.
  const [isOpen, setOpen] = useMorphingOpen(open, onOpenChange, morphName, { onOpen: false });
  const [current, setCurrent] = useControllable(value, defaultValue);
  const selected = items.find((item) => Object.is(item.value, current));
  const container = usePortalContainer();
  const trigger = useRef<HTMLButtonElement>(null);
  const unfold = useUnfoldFrom(trigger);

  return (
    <BaseSelect.Root
      items={items as Option<V>[]}
      value={current}
      onValueChange={(next) => {
        setCurrent(next as V | null);
        onValueChange?.(next as V | null);
      }}
      open={isOpen}
      onOpenChange={setOpen}
      disabled={disabled}
      name={name}
      id={id}
    >
      <BaseSelect.Trigger
        ref={trigger}
        className={cx('tk-select-trigger', className)}
        data-size={size}
        aria-label={ariaLabel}
      >
        <span className="tk-select-value" data-placeholder={selected ? undefined : ''}>
          <Morph
            name={morphName}
            active={!isOpen && Boolean(selected)}
            fit="text"
            scope={morphName}
          >
            {/* Base UI lines the chosen row's text up with this element. */}
            <BaseSelect.Value>{selected?.label ?? placeholder}</BaseSelect.Value>
          </Morph>
        </span>
        <BaseSelect.Icon className="tk-select-icon">
          <Icon name="chevron-updown" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal container={container}>
        <BaseSelect.Positioner className="tk-positioner" sideOffset={6} align="start">
          <BaseSelect.Popup ref={unfold} className="tk-popup tk-list-popup tk-select-popup">
            <BaseSelect.List className="tk-list">
              {items.map((item) => (
                <BaseSelect.Item
                  key={String(item.value)}
                  value={item.value}
                  disabled={item.disabled}
                  className="tk-list-item"
                >
                  <BaseSelect.ItemIndicator className="tk-list-indicator">
                    <Icon name="check" />
                  </BaseSelect.ItemIndicator>
                  <Morph
                    name={morphName}
                    active={isOpen && Object.is(item.value, current)}
                    fit="text"
                    scope={morphName}
                  >
                    <BaseSelect.ItemText className="tk-list-text">{item.label}</BaseSelect.ItemText>
                  </Morph>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

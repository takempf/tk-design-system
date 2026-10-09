import { Select as BaseSelect } from '@base-ui/react/select';
import { Icon } from '../icons/Icon';
import { PopupMorph, usePopupMorph } from '../motion/popupMorph';
import { usePortalContainer } from '../theme/Theme';
import { cx } from '../utils';
import { overTrigger, useControllable } from './popup';

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
 * A single-choice list. The trigger is the list's container, closed: it opens
 * over itself with the chosen row exactly on the trigger — its label on the
 * value, its check on the chevron, which turns into it — and the frame grows
 * up and down around it. Choosing another row carries that label and check
 * back into the trigger as the frame shrinks home, the check turning back into
 * the chevron. Where Base UI can't line the row up (no room, or touch) the list
 * still opens over the trigger, its first row on it.
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
  const popup = usePopupMorph({ open, onOpenChange, prefix: 'select' });
  const [current, setCurrent] = useControllable(value, defaultValue);
  const selected = items.find((item) => Object.is(item.value, current));
  const container = usePortalContainer();

  return (
    <PopupMorph.Provider value={popup.state}>
      <BaseSelect.Root
        items={items as Option<V>[]}
        value={current}
        onValueChange={(next) => {
          setCurrent(next as V | null);
          onValueChange?.(next as V | null);
        }}
        open={popup.open}
        onOpenChange={popup.setOpen}
        onOpenChangeComplete={popup.onOpenChangeComplete}
        disabled={disabled}
        name={name}
        id={id}
      >
        <PopupMorph.Trigger>
          <BaseSelect.Trigger
            className={cx('tk-select-trigger', className)}
            data-size={size}
            aria-label={ariaLabel}
          >
            <span className="tk-select-value" data-placeholder={selected ? undefined : ''}>
              <PopupMorph.Part side="trigger" when={Boolean(selected)}>
                {/* Base UI lines the chosen row's text up with this element. */}
                <BaseSelect.Value>{selected?.label ?? placeholder}</BaseSelect.Value>
              </PopupMorph.Part>
            </span>
            <PopupMorph.Part name="icon" side="trigger" when={Boolean(selected)} fit="icon">
              <BaseSelect.Icon className="tk-select-icon">
                <Icon name="chevron-updown" />
              </BaseSelect.Icon>
            </PopupMorph.Part>
          </BaseSelect.Trigger>
        </PopupMorph.Trigger>
        <BaseSelect.Portal container={container}>
          <BaseSelect.Positioner className="tk-positioner" sideOffset={overTrigger} align="start">
            <PopupMorph.Popup>
              <BaseSelect.Popup
                className="tk-popup tk-list-popup tk-select-popup"
                data-size={size}
                data-indicator="end"
              >
                <BaseSelect.List className="tk-list">
                  {items.map((item) => {
                    const chosen = Object.is(item.value, current);
                    return (
                      <BaseSelect.Item
                        key={String(item.value)}
                        value={item.value}
                        disabled={item.disabled}
                        className="tk-list-item"
                      >
                        <PopupMorph.Part side="popup" when={chosen}>
                          <BaseSelect.ItemText className="tk-list-text">
                            {item.label}
                          </BaseSelect.ItemText>
                        </PopupMorph.Part>
                        <PopupMorph.Part name="icon" side="popup" when={chosen} fit="icon">
                          <BaseSelect.ItemIndicator className="tk-list-indicator">
                            <Icon name="check" />
                          </BaseSelect.ItemIndicator>
                        </PopupMorph.Part>
                      </BaseSelect.Item>
                    );
                  })}
                </BaseSelect.List>
              </BaseSelect.Popup>
            </PopupMorph.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </PopupMorph.Provider>
  );
}

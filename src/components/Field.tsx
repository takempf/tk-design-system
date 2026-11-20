import { Button as BaseButton } from '@base-ui/react/button';
import { Field as BaseField } from '@base-ui/react/field';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { Input as BaseInput } from '@base-ui/react/input';
import { type ComponentProps, type ReactNode, useMemo, useRef } from 'react';
import { cx, mergeRefs, part, withBase } from '../utils';
import { SpinnerIcon } from './SpinnerIcon';

/**
 * Label, control, description and error wired together for accessibility and
 * validation. Any tk control placed inside picks up the field's state.
 */
export const Field = {
  Root: part(BaseField.Root, 'tk-field'),
  Label: part(BaseField.Label, 'tk-field-label'),
  Description: part(BaseField.Description, 'tk-field-description'),
  Error: part(BaseField.Error, 'tk-field-error'),
};

export const Fieldset = {
  Root: part(BaseFieldset.Root, 'tk-fieldset'),
  Legend: part(BaseFieldset.Legend, 'tk-fieldset-legend'),
};

export type InputProps = Omit<ComponentProps<typeof BaseInput>, 'size'> & {
  readonly size?: 'sm' | 'md' | 'lg';
  /**
   * `underline`: no box, only a line to write on, for a value that reads as
   * text where it sits (a name in a row) rather than as a form.
   */
  readonly variant?: 'default' | 'underline';
  /**
   * In the box, before the text: an icon, or a prefix such as `https://`.
   *
   * Given `start` or `end`, even as `null`, the box becomes a wrapper round the
   * input. A string `className` then styles the box; `ref` and the other props
   * still reach the input. To fill a slot only some of the time, keep passing
   * the prop and leave it `null` when empty. Dropping it changes the structure,
   * which replaces the input and loses its focus.
   */
  readonly start?: ReactNode;
  /** In the box, after the text: a unit, or `InputAction` buttons. */
  readonly end?: ReactNode;
};

/** Content that renders as nothing, which leaves its slot out. */
const blank = (node: ReactNode) => node === null || node === undefined || node === false;

export function Input({
  className,
  size = 'md',
  variant = 'default',
  start,
  end,
  ref,
  ...props
}: InputProps) {
  const control = useRef<HTMLInputElement>(null);
  const refs = useMemo(() => mergeRefs(control, ref), [ref]);

  if (start === undefined && end === undefined) {
    return (
      <BaseInput
        {...props}
        ref={ref}
        data-size={size}
        data-variant={variant}
        className={withBase('tk-input', className)}
      />
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut to the input, which the keyboard reaches directly
    <span
      className={cx('tk-input tk-input-group', typeof className === 'string' && className)}
      data-size={size}
      data-variant={variant}
      // The whole box is the field: pressing its padding, or a prefix in it,
      // types in the input. Whatever in it takes focus of its own keeps it.
      onMouseDown={(event) => {
        const target = event.target as Element;
        if (target.closest('input, textarea, select, button, a, label, [tabindex]')) return;
        event.preventDefault();
        control.current?.focus();
      }}
    >
      {!blank(start) && (
        <span className="tk-input-affix" data-side="start">
          {start}
        </span>
      )}
      <BaseInput
        {...props}
        ref={refs}
        className={withBase(
          'tk-input-control',
          typeof className === 'function' ? className : undefined,
        )}
      />
      {!blank(end) && (
        <span className="tk-input-affix" data-side="end">
          {end}
        </span>
      )}
    </span>
  );
}

export type InputActionProps = ComponentProps<typeof BaseButton> & {
  /** It shows only an icon, so this says what it does. */
  readonly 'aria-label': string;
  /**
   * What it started is under way: a spinner in place of its icon, and no
   * pressing it again. It keeps focus, so the keyboard stays where it was.
   */
  readonly loading?: boolean;
};

/**
 * An icon button in a field: in an `Input`'s or a `Combobox` field's `start`
 * or `end`. It matches the field's own clear and show-all buttons.
 */
export function InputAction({
  className,
  loading = false,
  disabled,
  focusableWhenDisabled,
  children,
  ...props
}: InputActionProps) {
  return (
    <BaseButton
      {...props}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled ?? loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      className={withBase('tk-input-action', className)}
    >
      {loading ? <SpinnerIcon /> : children}
    </BaseButton>
  );
}

export type TextareaProps = ComponentProps<'textarea'> & {
  /**
   * Grow and shrink to fit the text (`field-sizing: content`) instead of
   * scrolling inside a fixed box. The page scrolls past a long text.
   */
  readonly grow?: boolean;
};

export function Textarea({ className, grow = false, ...props }: TextareaProps) {
  return (
    <BaseField.Control
      render={<textarea {...props} data-grow={grow ? '' : undefined} />}
      className={withBase('tk-input tk-textarea', className)}
    />
  );
}

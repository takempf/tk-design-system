import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentProps } from 'react';
import { withBase } from '../utils';

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ComponentProps<typeof BaseButton> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Equal width and height, for a lone icon. Give it an aria-label. */
  readonly square?: boolean;
  /**
   * What it started is under way: a spinner in place of its label, at the same size,
   * and no pressing it again. It keeps focus, so the keyboard stays where it was.
   */
  readonly loading?: boolean;
}

export function Button({
  variant = 'default',
  size = 'md',
  square = false,
  loading = false,
  disabled,
  focusableWhenDisabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      {...props}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled ?? loading}
      aria-busy={loading || undefined}
      className={withBase('tk-button', className)}
      data-variant={variant}
      data-size={size}
      data-square={square || undefined}
      data-loading={loading || undefined}
    >
      {loading ? (
        <>
          <span className="tk-button-label">{children}</span>
          <span className="tk-spinner" aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </BaseButton>
  );
}

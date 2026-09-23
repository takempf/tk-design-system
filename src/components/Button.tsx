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
}

export function Button({
  variant = 'default',
  size = 'md',
  square = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      {...props}
      className={withBase('tk-button', className)}
      data-variant={variant}
      data-size={size}
      data-square={square || undefined}
    />
  );
}

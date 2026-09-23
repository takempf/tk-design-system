import { Separator as BaseSeparator } from '@base-ui/react/separator';
import type { ComponentProps, ElementType } from 'react';
import { cx, part } from '../utils';

/** Condensed uppercase section label — the red wayfinding text. */
export function Eyebrow({
  as: Tag = 'p',
  className,
  ...props
}: ComponentProps<'p'> & { readonly as?: ElementType }) {
  return <Tag {...props} className={cx('tk-eyebrow', className)} />;
}

export type BadgeTone = 'neutral' | 'accent' | 'label' | 'danger' | 'warning';

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: ComponentProps<'span'> & { readonly tone?: BadgeTone }) {
  return <span {...props} data-tone={tone} className={cx('tk-badge', className)} />;
}

export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return <kbd {...props} className={cx('tk-kbd', className)} />;
}

export const Separator = part(BaseSeparator, 'tk-separator');

export type PanelVariant = 'plain' | 'raised' | 'outline' | 'sunken';

/** A surface. Put a <SceneryWindow> inside to make it a trapper-keeper window. */
export function Panel({
  variant = 'raised',
  as: Tag = 'div',
  className,
  ...props
}: ComponentProps<'div'> & { readonly variant?: PanelVariant; readonly as?: ElementType }) {
  return <Tag {...props} data-variant={variant} className={cx('tk-panel', className)} />;
}

/** Vertical rhythm without margins. */
export function Stack({
  gap = 4,
  direction = 'column',
  align,
  justify,
  wrap,
  className,
  style,
  ...props
}: ComponentProps<'div'> & {
  readonly gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
  readonly direction?: 'row' | 'column';
  readonly align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  readonly justify?: 'start' | 'center' | 'end' | 'between';
  readonly wrap?: boolean;
}) {
  return (
    <div
      {...props}
      className={cx('tk-stack', className)}
      style={{
        gap: `var(--tk-space-${gap})`,
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify === 'between' ? 'space-between' : justify,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
    />
  );
}

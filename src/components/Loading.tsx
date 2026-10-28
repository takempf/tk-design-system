import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { cx } from '../utils';

export interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** What's under way, set beside the ring in quiet type: "Thinking". */
  readonly children?: ReactNode;
  /** Read out, not shown, when nothing is set beside the ring. */
  readonly label?: string;
}

/**
 * Something under way that has no shape to hold in its place (an answer being written,
 * a lookup): a ring the size of the text, turning. It's a status, so assistive tech
 * announces it. It comes in after a beat, so what's quick never flashes it. Inside a
 * control that already says it's busy, use the bare `.tk-spinner` class instead
 * (`<Button loading>` does).
 */
export function Spinner({ children, label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <span {...props} role="status" className={cx('tk-spinner-status', className)}>
      <span className="tk-spinner" aria-hidden="true" />
      {children ?? <span className="tk-visually-hidden">{label}</span>}
    </span>
  );
}

export type SkeletonShape = 'line' | 'block' | 'circle';

export interface SkeletonProps extends Omit<ComponentProps<'span'>, 'children'> {
  /**
   * `line` stands in for a line of text, at the text's own size and leading; `block` for
   * anything else (a card, a picture), sized by `width` and `height` or by CSS; `circle`
   * for a mark or an avatar.
   */
  readonly shape?: SkeletonShape;
  /** For `line`: this many lines, the last one short, as a paragraph ends. */
  readonly lines?: number;
  readonly width?: CSSProperties['width'];
  readonly height?: CSSProperties['height'];
}

/**
 * The shape of what's coming, held in its place while it loads, so nothing jumps when
 * it lands: a wash of the text color with a soft sheen crossing it (still, with reduced
 * motion). Hidden from assistive tech: say what's loading once, round the lot, with
 * `<Loading>`.
 */
export function Skeleton({
  shape = 'line',
  lines = 1,
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  if (shape === 'line' && lines > 1) {
    return (
      <span
        {...props}
        aria-hidden="true"
        className={cx('tk-skeleton-lines', className)}
        style={style}
      >
        {Array.from({ length: lines }, (_, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: identical bars, in order
            key={i}
            className="tk-skeleton"
            data-shape="line"
            style={{ width: i === lines - 1 ? '60%' : width, height }}
          />
        ))}
      </span>
    );
  }
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cx('tk-skeleton', className)}
      data-shape={shape}
      style={{ width, height, ...style }}
    />
  );
}

export interface LoadingProps extends ComponentProps<'div'> {
  /** What's on its way, read out (not shown): "Loading cards". */
  readonly label?: string;
}

/**
 * A region whose content is on its way. It says so once, to assistive tech, and holds
 * skeletons laid out as the content will be, so it lands where they stood.
 */
export function Loading({ label = 'Loading', className, children, ...props }: LoadingProps) {
  return (
    <div {...props} role="status" className={cx('tk-loading', className)}>
      <span className="tk-visually-hidden">{label}</span>
      {children}
    </div>
  );
}

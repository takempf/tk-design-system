import type { SVGProps } from 'react';
import { cx } from '../utils';

/*
  The tk mark. Every stroke is one weight, 205.5 units: the t's stem and bar,
  and the k's arms, which run at 45° and so measure 205.5·√2 across. Both
  letters share a cap height and a baseline. Solid fills in currentColor, so it
  takes its colour from the text around it; each letter carries a class
  (tk-logo-t, tk-logo-k) for themes that want to pick one out.
*/
export const logoPaths = {
  t: 'M0 0h423.8v542H218.3V205.5H0z',
  k: 'M720.4 0H1011L740 271l271 271H720.4l-271-271z',
} as const;

const width = 1011;
const height = 542;

export interface LogoProps extends SVGProps<SVGSVGElement> {
  /** Accessible name. Pass '' when a visible name sits beside the mark. */
  readonly label?: string;
  /** Height (cap height, since the mark has no descenders); width follows. */
  readonly size?: number | string;
}

export function Logo({ label = 'tk', size = '1em', className, ...rest }: LogoProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      height={size}
      width={typeof size === 'number' ? (size * width) / height : undefined}
      className={cx('tk-logo', className)}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      <path d={logoPaths.t} className="tk-logo-t" />
      <path d={logoPaths.k} className="tk-logo-k" />
    </svg>
  );
}

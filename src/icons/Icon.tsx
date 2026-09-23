import type { SVGProps } from 'react';
import { cx } from '../utils';

/*
  Icons on a 16×16 grid. Outlines share one stroke (--tk-icon-stroke) and the
  theme's caps and joins; solids are filled paths, never thick strokes.

  Marks are plain geometry at one optical size: the circle runs a touch larger
  than the square and the triangle is centred by eye, so all three read the same
  size. Inner solids (dot, square, triangle) share one area, ~12 square units;
  lines inside a triangle end flush on its sides and meet at its centroid.
*/
interface Glyph {
  readonly stroke?: string;
  /** Open strokes that end on another outline: always butt-capped, never joined. */
  readonly inner?: string;
  readonly fill?: string;
}

const dot = 'M8 6.25a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z';
const circle = 'M8 2.75a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5z';
const square = 'M3.25 3.25h9.5v9.5h-9.5z';
const triangle = 'M8 2.9 13.75 12.86H2.25z';

const glyphs = {
  check: { stroke: 'M3 8.5 6.5 12 13 4' },
  close: { stroke: 'M4 4l8 8M12 4l-8 8' },
  plus: { stroke: 'M8 3v10M3 8h10' },
  minus: { stroke: 'M3 8h10' },
  'chevron-down': { stroke: 'M4 6l4 4 4-4' },
  'chevron-up': { stroke: 'M4 10l4-4 4 4' },
  'chevron-left': { stroke: 'M10 4 6 8l4 4' },
  'chevron-right': { stroke: 'M6 4l4 4-4 4' },
  'chevron-updown': { stroke: 'M5 6l3-3 3 3M5 10l3 3 3-3' },
  'arrow-right': { stroke: 'M3 8h10M9 4l4 4-4 4' },
  'arrow-left': { stroke: 'M13 8H3M7 4 3 8l4 4' },
  'arrow-up': { stroke: 'M8 13V3M4 7l4-4 4 4' },
  search: { stroke: 'M7 2.75a4.25 4.25 0 1 1 0 8.5 4.25 4.25 0 0 1 0-8.5zM10.1 10.1l3.4 3.4' },
  menu: { stroke: 'M3 4.5h10M3 8h10M3 11.5h10' },
  sliders: { stroke: 'M3 5h10M3 11h10M6 3v4M10 9v4' },
  info: { stroke: `${circle}M8 7.25v4`, fill: 'M8 4.4a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z' },
  warning: { stroke: `${triangle}M8 6.5v2.75`, fill: 'M8 10.1a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6z' },
  copy: { stroke: 'M5.5 5.5h7v7h-7zM3.5 10.5v-7h7' },
  external: { stroke: 'M9 3h4v4M13 3 7.5 8.5M11 9.5V13H3V5h3.5' },
  ember: { stroke: 'M8 2.25 13.75 8 8 13.75 2.25 8z', fill: 'M8 5.75 10.25 8 8 10.25 5.75 8z' },
  tree: { stroke: 'M8 2.5l4.75 8.25h-9.5zM8 10.75v3' },
  moon: { stroke: 'M10.4 3.2a5.25 5.25 0 1 0 2.4 7.2 4.4 4.4 0 0 1-2.4-7.2z' },
  bolt: { stroke: 'M9.25 2 4.5 9h3.75l-1 5 4.75-7H8.25z' },
  eye: {
    stroke:
      'M1.75 8C3.4 5.2 5.5 3.75 8 3.75s4.6 1.45 6.25 4.25C12.6 10.8 10.5 12.25 8 12.25S3.4 10.8 1.75 8z',
    fill: dot,
  },

  // Marks: ornament and wayfinding rather than meaning.
  dot: { fill: dot },
  circle: { stroke: circle },
  square: { stroke: square },
  triangle: { stroke: triangle },
  diamond: { stroke: 'M8 2.25 13.75 8 8 13.75 2.25 8z' },
  // The inward normals from each side's midpoint, meeting at the centroid.
  'y-in-triangle': { stroke: triangle, inner: 'M5.13 7.88 8 9.54l2.87-1.66M8 9.54v3.32' },
  'circle-in-triangle': { stroke: `${triangle}M8 8.14a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8z` },
  'dot-in-circle': { stroke: circle, fill: dot },
  'dot-in-square': { stroke: square, fill: dot },
  'square-in-circle': { stroke: circle, fill: 'M6.25 6.25h3.5v3.5h-3.5z' },
  'triangle-in-circle': { stroke: circle, fill: 'M8 5.14l2.65 4.59h-5.3z' },
  'circle-in-square': { stroke: `${square}M8 5.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5z` },
} as const satisfies Record<string, Glyph>;

export type IconName = keyof typeof glyphs;
export const iconNames = Object.keys(glyphs) as IconName[];
/** The geometric marks, in order. */
export const markNames = iconNames.slice(iconNames.indexOf('dot'));

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  readonly name: IconName;
  /** Accessible name. Without one the icon is decorative and hidden from AT. */
  readonly label?: string;
  readonly size?: number | string;
}

export function Icon({ name, label, size = '1em', className, ...rest }: IconProps) {
  const glyph: Glyph = glyphs[name];
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={cx('tk-icon', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {glyph.stroke && <path d={glyph.stroke} />}
      {glyph.inner && <path d={glyph.inner} className="tk-icon-inner" />}
      {glyph.fill && <path d={glyph.fill} className="tk-icon-fill" />}
    </svg>
  );
}

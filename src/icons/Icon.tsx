import type { SVGProps } from 'react';
import { cx } from '../utils';

/*
  Icons on a 16×16 grid. Outlines share one stroke (--tk-icon-stroke) and the
  theme's caps and joins; tapered nesting thins the strokes with equal edge-to-edge gaps.
  Solids are filled paths, never thick strokes.

  Marks are plain geometry at one optical size: the circle runs a touch larger
  than the square and the triangle is centred by eye, so all three read the same
  size. Nested inner solids (dot, square, triangle) share one area, ~12 square units;
  lines inside a triangle end flush on its sides and meet at its centroid.
*/
interface Glyph {
  readonly stroke?: string;
  readonly nested?: {
    readonly center: readonly [number, number];
    /** Perpendicular distance from the center to the outer outline. */
    readonly radius: number;
  };
  /** Open strokes that end on another outline: always butt-capped, never joined. */
  readonly inner?: string;
  readonly fill?: string;
}

const dot = 'M8 6.25a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z';
const circle = 'M8 2.75a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5z';
const square = 'M3.25 3.25h9.5v9.5h-9.5z';
const triangle = 'M8 2.9 13.75 12.86H2.25z';

// A 0.4-unit clear gap is 1px at the gallery's 40px size. The inset also includes
// half of each bordering stroke: 0.5 + 0.275, then 0.5 + 0.55 + 0.125.
const nestedLevels = [
  { weight: 0.55, gap: 0.4, strokeInset: 0.775 },
  { weight: 0.25, gap: 0.8, strokeInset: 1.175 },
] as const;

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
  sparkle: {
    stroke:
      'M7.25 3.5C7.6 6.3 9.45 8.15 12.25 8.5 9.45 8.85 7.6 10.7 7.25 13.5 6.9 10.7 5.05 8.85 2.25 8.5 5.05 8.15 6.9 6.3 7.25 3.5zM12.75 1.75v2.5M11.5 3h2.5',
  },
  comment: { stroke: 'M2.75 3.25h10.5v7.5h-5.5l-3 2.5v-2.5h-2z' },
  send: { stroke: 'M13.25 2.75 2.75 6.75l4.5 2 2 4.5zM7.25 8.75l3-3' },
  // The arc ends inside the arrowhead's corner, so it is butt-capped there.
  refresh: {
    stroke: 'M13 2.75v3h-3',
    inner: 'M13 8a5 5 0 1 1-5-5c1.4 0 2.74.56 3.74 1.52L13 5.75',
  },
  download: { stroke: 'M8 2.75v7.5M4.75 7l3.25 3.25L11.25 7M2.75 13.25h10.5' },
  swap: {
    stroke: 'M5 12.75V3.25M2.75 5.5 5 3.25 7.25 5.5M11 3.25v9.5M8.75 10.5 11 12.75l2.25-2.25',
  },
  folder: { stroke: 'M2.25 3.75h4.25l1.5 1.5h5.75v7H2.25z' },
  columns: { stroke: 'M2.75 3.25h10.5v9.5h-10.5zM8 3.25v9.5' },
  rows: { stroke: 'M2.75 3.25h10.5v9.5h-10.5zM2.75 8h10.5' },
  branch: {
    stroke:
      'M4 2a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM4 10.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM12 2a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM4 5.5v5M12 5.5c0 3.75-2.5 6.75-6.25 6.75',
  },
  'pull-request': {
    stroke:
      'M4 2a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM4 10.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM12 10.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM4 5.5v5M12 10.5V5.25a1.5 1.5 0 0 0-1.5-1.5H7.5M9.25 2 7.5 3.75 9.25 5.5',
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

  // Frames and nested forms.
  hexagon: { stroke: 'M5.1 3h5.8l2.9 5-2.9 5H5.1L2.2 8z' },
  'double-circle': { stroke: `${circle}M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z` },
  'diamond-in-circle': { stroke: circle, fill: 'M8 5.5 10.5 8 8 10.5 5.5 8z' },
  'diamond-in-square': { stroke: square, fill: 'M8 5.5 10.5 8 8 10.5 5.5 8z' },
  'triangle-in-square': { stroke: square, fill: 'M8 5.14l2.65 4.59h-5.3z' },
  'nested-diamonds': {
    stroke: 'M8 2.25 13.75 8 8 13.75 2.25 8zM8 5.5 10.5 8 8 10.5 5.5 8z',
  },

  // Divisions meet their enclosing outline with flush, butt-capped ends.
  'split-circle': { stroke: circle, inner: 'M2.75 8h10.5' },
  'quartered-circle': { stroke: circle, inner: 'M2.75 8h10.5M8 2.75v10.5' },
  'y-in-circle': { stroke: circle, inner: 'M3.45 5.375 8 8l4.55-2.625M8 8v5.25' },
  'bars-in-circle': { stroke: circle, inner: 'M3.15 6h9.7M3.15 10h9.7' },
  'split-square': { stroke: square, inner: 'M3.25 8h9.5' },
  'diagonal-square': { stroke: square, inner: 'M3.25 12.75l9.5-9.5' },

  // Repetition: open space between each solid keeps the clusters legible at 16px.
  'paired-bars': { fill: 'M4 2.75h2.5v10.5H4zM9.5 2.75H12v10.5H9.5z' },
  'triple-bar': { fill: 'M3.25 3.25h9.5v2h-9.5zM3.25 7h9.5v2h-9.5zM3.25 10.75h9.5v2h-9.5z' },
  'triple-dot': {
    fill: 'M8 2.75a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM4.7 8.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM11.3 8.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5z',
  },
  'four-dot': {
    fill: 'M5 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM5 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  },
  'triple-triangle': {
    fill: 'M8 2.9l2.4 4.16H5.6zM4.75 8.7l2.4 4.16h-4.8zM11.25 8.7l2.4 4.16h-4.8z',
  },
  'triple-diamond': {
    fill: 'M8 2.25l2.25 2.25L8 6.75 5.75 4.5zM4.75 8l2.25 2.25-2.25 2.25-2.25-2.25zM11.25 8l2.25 2.25-2.25 2.25L9 10.25z',
  },
  'four-diamond': {
    fill: 'M8 1.75 10 4 8 6.25 6 4zM12 5.75 14.25 8 12 10.25 9.75 8zM8 9.75 10 12 8 14.25 6 12zM4 5.75 6.25 8 4 10.25 1.75 8z',
  },

  // Solid crests. Opposite winding cuts the square out without a background fill.
  'square-cutout': { fill: `${circle}M6 6v4h4V6z` },
  hourglass: { fill: 'M3.25 3.25h9.5L8 8l4.75 4.75h-9.5L8 8z' },
  'four-petal': {
    fill: 'M8 2C10.75 3.5 10.75 5 8 6.5 5.25 5 5.25 3.5 8 2zM14 8C12.5 10.75 11 10.75 9.5 8 11 5.25 12.5 5.25 14 8zM8 14C5.25 12.5 5.25 11 8 9.5 10.75 11 10.75 12.5 8 14zM2 8C3.5 5.25 5 5.25 6.5 8 5 10.75 3.5 10.75 2 8z',
  },
  'three-blade': {
    fill: 'M8 2.75h3L9.25 6.5h-2.5zM12.55 10.625l-1.5 2.6-2.38-3.395 1.25-2.165zM3.45 10.625l-1.5-2.6 4.13-.355 1.25 2.16z',
  },
  'stepped-pyramid': { fill: 'M6.5 2.75h3v3.5H12v3.5h2v3H2v-3h2v-3.5h2.5z' },

  // Rotational and reflection symmetry, with clear centers and repeated units.
  'six-spoke': {
    stroke:
      'M8 8 8 2.75M8 8 12.547 5.375M8 8 12.547 10.625M8 8 8 13.25M8 8 3.453 10.625M8 8 3.453 5.375',
  },
  'eight-spoke': {
    stroke:
      'M8 8 8 2.75M8 8 11.712 4.288M8 8 13.25 8M8 8 11.712 11.712M8 8 8 13.25M8 8 4.288 11.712M8 8 2.75 8M8 8 4.288 4.288',
  },
  'six-spoke-in-circle': {
    stroke: circle,
    inner:
      'M8 8 8 2.75M8 8 12.547 5.375M8 8 12.547 10.625M8 8 8 13.25M8 8 3.453 10.625M8 8 3.453 5.375',
  },
  'quartered-diamond': {
    stroke: 'M8 2.25 13.75 8 8 13.75 2.25 8z',
    inner: 'M2.25 8h11.5M8 2.25v11.5',
  },
  'six-dot': {
    fill: 'M8 2.1a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0 -2.6zM11.984 4.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0 -2.6zM11.984 9a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0 -2.6zM8 11.3a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0 -2.6zM4.016 9a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0 -2.6zM4.016 4.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0 -2.6z',
  },
  'eight-dot': {
    fill: 'M8 2.1a1 1 0 1 1 0 2 1 1 0 0 1 0 -2zM11.465 3.535a1 1 0 1 1 0 2 1 1 0 0 1 0 -2zM12.9 7a1 1 0 1 1 0 2 1 1 0 0 1 0 -2zM11.465 10.465a1 1 0 1 1 0 2 1 1 0 0 1 0 -2zM8 11.9a1 1 0 1 1 0 2 1 1 0 0 1 0 -2zM4.535 10.465a1 1 0 1 1 0 2 1 1 0 0 1 0 -2zM3.1 7a1 1 0 1 1 0 2 1 1 0 0 1 0 -2zM4.535 3.535a1 1 0 1 1 0 2 1 1 0 0 1 0 -2z',
  },
  'six-diamond': {
    fill: 'M8 1.75 9.3 4 8 6.25 6.7 4zM13.413 4.875 12.114 7.126 9.516 7.125 10.814 4.874zM13.413 11.125 10.814 11.126 9.516 8.875 12.114 8.874zM8 14.25 6.7 12 8 9.75 9.3 12zM2.587 11.125 3.886 8.874 6.484 8.875 5.186 11.126zM2.587 4.875 5.186 4.874 6.484 7.125 3.886 7.126z',
  },
  'three-petal': {
    fill: 'M8 2C11 3.2 11 4.9 8 6.2 5 4.9 5 3.2 8 2zM13.196 11C10.657 12.998 9.185 12.148 9.559 8.9 12.185 6.952 13.657 7.802 13.196 11zM2.804 11C2.343 7.802 3.815 6.952 6.441 8.9 6.815 12.148 5.343 12.998 2.804 11z',
  },
  'six-petal': {
    fill: 'M8 2C9.8 3.2 9.8 4.9 8 5.6 6.2 4.9 6.2 3.2 8 2zM13.196 5C13.057 7.159 11.585 8.009 10.078 6.8 9.785 4.891 11.257 4.041 13.196 5zM13.196 11C11.257 11.959 9.785 11.109 10.078 9.2 11.585 7.991 13.057 8.841 13.196 11zM8 14C6.2 12.8 6.2 11.1 8 10.4 9.8 11.1 9.8 12.8 8 14zM2.804 11C2.943 8.841 4.415 7.991 5.922 9.2 6.215 11.109 4.743 11.959 2.804 11zM2.804 5C4.743 4.041 6.215 4.891 5.922 6.8 4.415 8.009 2.943 7.159 2.804 5z',
  },
  quatrefoil: {
    stroke: 'M5.5 5.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 1 1 0 5 2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 0-5z',
  },
  'four-kite': {
    fill: 'M8 1.75 10 4.5 8 6.5 6 4.5zM14.25 8 11.5 10 9.5 8 11.5 6zM8 14.25 6 11.5 8 9.5 10 11.5zM1.75 8 4.5 6 6.5 8 4.5 10z',
  },
  'diamond-cross': {
    fill: 'M8 1.75 9.75 6.25 14.25 8 9.75 9.75 8 14.25 6.25 9.75 1.75 8 6.25 6.25z',
  },
  'eight-point': {
    fill: 'M8 2 9.148 5.228 12.243 3.757 10.772 6.852 14 8 10.772 9.148 12.243 12.243 9.148 10.772 8 14 6.852 10.772 3.757 12.243 5.228 9.148 2 8 5.228 6.852 3.757 3.757 6.852 5.228z',
  },
  'sun-ring': {
    stroke:
      'M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8 3.25 8 1.75M11.359 4.641 12.419 3.581M12.75 8 14.25 8M11.359 11.359 12.419 12.419M8 12.75 8 14.25M4.641 11.359 3.581 12.419M3.25 8 1.75 8M4.641 4.641 3.581 3.581',
  },
  'opposed-triangles': { fill: 'M2.75 3.25 6.5 8 2.75 12.75zM13.25 3.25v9.5L9.5 8z' },
  'mirrored-chevrons': { stroke: 'M2.75 3.25 6.5 8 2.75 12.75M13.25 3.25 9.5 8l3.75 4.75' },
  'four-corner': { stroke: 'M3.25 6.25v-3h3M9.75 3.25h3v3M12.75 9.75v3h-3M6.25 12.75h-3v-3' },
  'quartered-square': { stroke: square, inner: 'M3.25 8h9.5M8 3.25v9.5' },
  'diamond-grid': {
    fill: 'M4.5 2.9 6.1 4.5 4.5 6.1 2.9 4.5zM11.5 2.9 13.1 4.5 11.5 6.1 9.9 4.5zM8 6.4 9.6 8 8 9.6 6.4 8zM4.5 9.9 6.1 11.5 4.5 13.1 2.9 11.5zM11.5 9.9 13.1 11.5 11.5 13.1 9.9 11.5z',
  },
  'nested-triangles': { stroke: 'M8 2.9 13.75 12.86H2.25zM8 6.42l2.7 4.68H5.3z' },

  // Geometry accounts for stroke widths so the clear gaps match across shapes and themes.
  'nested-triangles-tapered': { stroke: triangle, nested: { center: [8, 9.54], radius: 3.32 } },
  'nested-circles-tapered': { stroke: circle, nested: { center: [8, 8], radius: 5.25 } },
  'nested-diamonds-tapered': {
    stroke: 'M8 2.25 13.75 8 8 13.75 2.25 8z',
    nested: { center: [8, 8], radius: 5.75 / Math.SQRT2 },
  },

  // Overlapping-circle outlines: clovers keep the outer arcs only.
  // Internal arcs disappear into the shared area; every outline uses the theme stroke.
  'three-circle-clover': {
    stroke:
      'M4.739 6.117A3.35 3.35 0 1 1 11.261 6.117A3.35 3.35 0 1 1 8 11.765A3.35 3.35 0 1 1 4.739 6.117z',
  },
  'four-circle-clover': {
    stroke:
      'M4.711 4.711A3.35 3.35 0 0 1 11.289 4.711A3.35 3.35 0 0 1 11.289 11.289A3.35 3.35 0 0 1 4.711 11.289A3.35 3.35 0 0 1 4.711 4.711z',
  },
  'six-circle-clover': {
    stroke:
      'M5.476 3.628A3 3 0 0 1 10.524 3.628A3 3 0 0 1 13.048 8A3 3 0 0 1 10.524 12.372A3 3 0 0 1 5.476 12.372A3 3 0 0 1 2.952 8A3 3 0 0 1 5.476 3.628z',
  },
  'paired-crescents': {
    stroke:
      'M8 11.464A4 4 0 1 1 8 4.536A4 4 0 0 0 8 11.464zM8 11.464A4 4 0 0 0 8 4.536A4 4 0 1 1 8 11.464z',
  },
  'three-lens': {
    stroke:
      'M13.218 3.595A5.36 5.36 0 0 1 9.546 7.501A5.36 5.36 0 0 0 8 4.824A5.36 5.36 0 0 0 6.454 7.501A5.36 5.36 0 0 0 9.546 7.501A5.36 5.36 0 0 1 8 12.632A5.36 5.36 0 0 1 6.454 7.501A5.36 5.36 0 0 1 2.782 3.595A5.36 5.36 0 0 1 8 4.824A5.36 5.36 0 0 1 13.218 3.595z',
  },
  'three-circle-seal': {
    stroke:
      'M4.739 6.117A3.35 3.35 0 1 1 11.261 6.117A3.35 3.35 0 1 1 8 11.765A3.35 3.35 0 1 1 4.739 6.117zM8 6.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 1 0 0-3.5z',
  },
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
  const nested = glyph.nested;
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
      {nested &&
        nestedLevels.map(({ weight, gap, strokeInset }) => {
          const scale = `calc(1 - (${gap} + var(--tk-icon-stroke) * ${strokeInset}) / ${nested.radius})`;
          return (
            <path
              key={weight}
              d={glyph.stroke}
              style={{
                transformOrigin: `${nested.center[0]}px ${nested.center[1]}px`,
                transform: `scale(${scale})`,
                // Compensate for the geometry's scale to retain the intended stroke taper.
                strokeWidth: `calc(var(--tk-icon-stroke) * ${weight} / ${scale})`,
              }}
            />
          );
        })}
      {glyph.inner && <path d={glyph.inner} className="tk-icon-inner" />}
      {glyph.fill && <path d={glyph.fill} className="tk-icon-fill" />}
    </svg>
  );
}

/** Geometry on the shared 16×16 icon grid. All widths follow the theme stroke. */
export interface Glyph {
  readonly stroke?: string;
  readonly nested?: {
    readonly center: readonly [number, number];
    /** Perpendicular distance from the center to the outer outline. */
    readonly radius: number;
  };
  /** Open strokes that end on another outline: always butt-capped. */
  readonly inner?: string;
  /** Internal structure at 55% of the outline weight. */
  readonly detail?: string;
  readonly fill?: string;
  /** Transparent lines through a solid, at the same 55% detail weight. */
  readonly cutout?: string;
}

import { type ComponentProps, type CSSProperties, useCallback } from 'react';
import { cx } from '../utils';
import { type Attachment, attachScenery } from './renderer';
import type { SceneName } from './scenes';

export interface SceneryProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Override the theme's `--tk-scenery-scene`. */
  readonly scene?: SceneName;
  /**
   * `fixed` (default): one illustration pinned to the viewport, which every window
   * reveals a piece of. `local`: the illustration is framed inside this box.
   */
  readonly attachment?: Attachment;
}

function useSceneryRef() {
  // A React 19 ref callback may return its cleanup; attachScenery returns one.
  return useCallback((node: HTMLDivElement | null) => {
    const canvas = node?.querySelector('canvas');
    if (!node || !canvas) return;
    return attachScenery(canvas, node);
  }, []);
}

function sceneryStyle(
  scene: SceneName | undefined,
  attachment: Attachment | undefined,
  style: CSSProperties | undefined,
) {
  return {
    ...(scene && { '--tk-scenery-scene': `'${scene}'` }),
    ...(attachment && { '--tk-scenery-attachment': attachment }),
    ...style,
  } as CSSProperties;
}

/**
 * A window onto the scenery. Fills its nearest positioned ancestor, behind its
 * siblings — put it first inside a `Panel`, card, or button.
 *
 * Every visual knob is a CSS custom property, so you can also set them inline:
 * `style={{ '--tk-scenery-bayer': 4, '--tk-scenery-pixel': 3 }}`.
 */
export function SceneryWindow({ scene, attachment, className, style, ...props }: SceneryProps) {
  const ref = useSceneryRef();
  return (
    <div
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx('tk-scenery', className)}
      style={sceneryStyle(scene, attachment, style)}
    >
      <canvas className="tk-scenery-canvas" />
    </div>
  );
}

/** The scenery behind the whole page, fixed to the viewport. */
export function SceneryBackdrop({
  scene,
  className,
  style,
  ...props
}: Omit<SceneryProps, 'attachment'>) {
  const ref = useSceneryRef();
  return (
    <div
      {...props}
      ref={ref}
      aria-hidden="true"
      className={cx('tk-scenery tk-scenery-backdrop', className)}
      style={sceneryStyle(scene, 'fixed', style)}
    >
      <canvas className="tk-scenery-canvas" />
    </div>
  );
}

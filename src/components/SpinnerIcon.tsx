import { useLayoutEffect, useRef, useState } from 'react';
import { reducedMotion } from '../motion/reducedMotion';
import { createClock } from '../raster/clock';
import { rgba } from '../raster/ink';
import { bayerMatrix, crispSize, Raster, type Vec4 } from '../raster/raster';
import { renderSpinner } from '../raster/spinner';
import { cx } from '../utils';

/** Every spinner draws off one clock at the scenery's frame rate, so they turn in step. */
const subscribe = createClock(15);
/** One CSS pixel per dither cell: at icon size, two would leave seven or eight cells across. */
const PIXEL = 1;
/** 4×4, since an 8×8 pattern is half as wide as the icon. */
const BAYER = bayerMatrix(4);
const TRANSPARENT: Vec4 = [0, 0, 0, 0];

export interface SpinnerIconProps {
  readonly className?: string;
}

/** A small lit solid tumbling in `--tk-spinner-ink-*`, sized like an icon, for a control that already says it's busy. */
export function SpinnerIcon({ className }: SpinnerIconProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inksRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ cells: 0, width: 0 });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = (): void => {
      const next = crispSize(wrap.clientWidth, PIXEL, window.devicePixelRatio || 1);
      setSize((prev) => (prev.cells === next.cells && prev.width === next.width ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const { cells } = size;
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const inkElements = inksRef.current?.children;
    if (!context || !inkElements || cells === 0) return;

    const raster = new Raster(cells, cells);
    const image = context.createImageData(cells, cells);
    let key = '';
    let inks: Vec4[] = [];
    const draw = (time: number) => {
      // Read every frame, so the inks follow the theme and the control the spinner sits in.
      const colors = Array.from(inkElements, (ink) => getComputedStyle(ink).color);
      const current = colors.join();
      if (current !== key) {
        key = current;
        inks = [TRANSPARENT, ...colors.map(rgba)];
      }
      renderSpinner(raster, time);
      raster.dither(inks, BAYER, image.data);
      context.putImageData(image, 0, 0);
    };

    if (reducedMotion()) {
      draw(0);
      return;
    }
    draw(performance.now() / 1000);
    return subscribe(draw);
  }, [cells]);

  return (
    <span ref={wrapRef} className={cx('tk-spinner', className)} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="tk-spinner-canvas"
        width={cells || 1}
        height={cells || 1}
        style={{ width: size.width, height: size.width }}
      />
      <span ref={inksRef} className="tk-spinner-inks">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

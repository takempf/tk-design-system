import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '../motion/reducedMotion';
import { bayerMatrix, crispSize, Raster, type Vec4 } from '../raster/raster';
import { renderSpinner } from '../raster/spinner';
import { cx } from '../utils';

/** Scenery's frame rate. */
const FRAME_MS = 1000 / 15;
/** One CSS pixel per dither cell: at icon size, two would leave seven or eight cells across. */
const PIXEL = 1;
/** 4×4, since an 8×8 pattern is half as wide as the icon. */
const BAYER = bayerMatrix(4);
const TRANSPARENT: Vec4 = [0, 0, 0, 0];

type Frame = (time: number) => void;

/** Every spinner draws off one clock, so a page of them runs one loop and they turn in step. */
const frames = new Set<Frame>();
let loop = 0;

function subscribe(frame: Frame) {
  frames.add(frame);
  if (frames.size === 1) {
    let last = Number.NEGATIVE_INFINITY;
    loop = requestAnimationFrame(function tick(now) {
      loop = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      last = now;
      for (const draw of frames) draw(now / 1000);
    });
  }
  return () => {
    frames.delete(frame);
    if (frames.size === 0) cancelAnimationFrame(loop);
  };
}

let probe: CanvasRenderingContext2D | null | undefined;
const resolved = new Map<string, Vec4>();

/** Any computed CSS colour as RGBA, resolved once per distinct value through a 2D context. */
function rgba(color: string): Vec4 {
  let value = resolved.get(color);
  if (!value) {
    probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!probe) return [128, 128, 128, 255];
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = probe.getImageData(0, 0, 1, 1).data;
    value = [r, g, b, a];
    resolved.set(color, value);
  }
  return value;
}

export interface SpinnerIconProps {
  readonly className?: string;
}

/** A small lit solid tumbling in `--tk-spinner-ink-*`, sized like an icon, for a control that already says it's busy. */
export function SpinnerIcon({ className }: SpinnerIconProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inksRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ cells: 0, width: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(() =>
      setSize(crispSize(wrap.clientWidth, PIXEL, window.devicePixelRatio || 1)),
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const { cells } = size;
  useEffect(() => {
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

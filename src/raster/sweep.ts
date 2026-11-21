// A placeholder's light: a band of dither cells crossing it, as a picture's reveal is drawn.

import { reducedMotion } from '../motion/reducedMotion';
import { createClock } from './clock';
import { rgba } from './ink';
import { bayerMatrix } from './raster';

/** A little finer than the scenery's 15 a second, since the band travels. */
const subscribe = createClock(24);
/** How fast the light travels down the page's diagonal, in CSS pixels a second. */
const SPEED = 720;
/** How far apart the bands come along the diagonal: one crosses each point every 2.5 s. */
const SPACING = 1800;
/** Half the band's width, along the diagonal. */
const HALF_WIDTH = 150;
/** How much of the band's middle is lit. */
const STRENGTH = 0.75;

function readBayer(style: CSSStyleDeclaration): 2 | 4 | 8 {
  const size = Number.parseInt(style.getPropertyValue('--tk-image-dither-bayer'), 10);
  return size === 2 || size === 4 ? size : 8;
}

/**
 * Draws a band of light across `canvas`, which lies over `frame`, in the cells of the
 * picture's dither (`--tk-image-dither-pixel`, `--tk-image-dither-bayer`) and in the ink
 * of the canvas's own `color`. The band runs down the page's diagonal from the upper left,
 * placed by where the canvas sits in the viewport: every placeholder on the page lies on
 * the same bands, so one crosses a grid of them in turn, the way a picture develops.
 * Nothing moves with reduced motion. Returns a function that stops it.
 */
export function sweep(canvas: HTMLCanvasElement, frame: HTMLElement): () => void {
  if (typeof ResizeObserver === 'undefined' || reducedMotion()) return () => {};
  const context = canvas.getContext('2d');
  if (!context) return () => {};

  let columns = 0;
  let rows = 0;
  let cell = 1;
  let bayer = bayerMatrix(8);
  let size: 2 | 4 | 8 = 8;
  let image: ImageData | null = null;
  // Whether the canvas has nothing lit on it, so a frame the band is nowhere near draws nothing.
  let blank = false;

  // Whole device pixels to a cell, so every cell is the same size; the canvas runs past
  // the frame to the next whole cell, and the frame clips it.
  const measure = () => {
    const style = getComputedStyle(frame);
    const ratio = window.devicePixelRatio || 1;
    const pixel = Number.parseFloat(style.getPropertyValue('--tk-image-dither-pixel')) || 2;
    const device = Math.max(1, Math.round(pixel * ratio));
    size = readBayer(style);
    bayer = bayerMatrix(size);
    cell = device / ratio;
    columns = Math.ceil((frame.clientWidth * ratio) / device);
    rows = Math.ceil((frame.clientHeight * ratio) / device);
    if (columns === 0 || rows === 0) return;
    canvas.width = columns;
    canvas.height = rows;
    canvas.style.width = `${columns * cell}px`;
    canvas.style.height = `${rows * cell}px`;
    image = context.createImageData(columns, rows);
    blank = false;
  };

  const draw = (time: number) => {
    if (!image) return;
    const box = canvas.getBoundingClientRect();
    if (box.bottom < 0 || box.right < 0 || box.top > innerHeight || box.left > innerWidth) return;
    const [r, g, b, a] = rgba(getComputedStyle(canvas).color);
    const center = (time * SPEED) % SPACING;
    // Light depends only on how far down the diagonal a cell is: once per diagonal.
    const light = new Float32Array(columns + rows);
    let lit = false;
    for (let step = 0; step < light.length; step++) {
      const along = box.left + box.top + (step + 1) * cell;
      const offset = (((along - center) % SPACING) + SPACING) % SPACING;
      const t = 1 - Math.min(offset, SPACING - offset) / HALF_WIDTH;
      if (t > 0) {
        light[step] = STRENGTH * t * t * (3 - 2 * t);
        lit = true;
      }
    }
    if (!lit && blank) return;
    blank = !lit;
    const data = image.data;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const on = (light[x + y] as number) > (bayer[(y % size) * size + (x % size)] as number);
        const i = (y * columns + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = on ? a : 0;
      }
    }
    context.putImageData(image, 0, 0);
  };

  measure();
  const observer = new ResizeObserver(measure);
  observer.observe(frame);
  const stop = subscribe(draw);
  return () => {
    observer.disconnect();
    stop();
  };
}

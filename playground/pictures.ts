// Landscapes painted on a canvas, for the Image demos: no network, and each one comes with
// what an image service would send ahead of it, a tiny preview and its average color.

import { useEffect, useRef, useState } from 'react';

interface Palette {
  readonly alt: string;
  readonly sky: readonly [string, string];
  readonly sun: string;
  readonly hills: readonly [string, string, string];
}

const palettes: readonly Palette[] = [
  {
    alt: 'Hills at dawn under a peach sky',
    sky: ['#f4b28b', '#fbe3c4'],
    sun: '#fff2d6',
    hills: ['#b0808a', '#6e4a63', '#3b2a45'],
  },
  {
    alt: 'Green hills at noon under a clear blue sky',
    sky: ['#6ea9df', '#d4ebf7'],
    sun: '#fffbe8',
    hills: ['#8fbf8a', '#4f8a5b', '#2c5a3f'],
  },
  {
    alt: 'A moor at dusk, the sun setting into violet hills',
    sky: ['#3c3b6e', '#e2836a'],
    sun: '#ffd08a',
    hills: ['#6b4a6e', '#432f52', '#21192e'],
  },
  {
    alt: 'Dark ridges under a moonlit night',
    sky: ['#0c1a2c', '#2f4f77'],
    sun: '#e8eef7',
    hills: ['#21374f', '#142538', '#0a1420'],
  },
  {
    alt: 'A valley in fog, grey ridges fading into it',
    sky: ['#c3c9cf', '#eef0f1'],
    sun: '#ffffff',
    hills: ['#b2b9bf', '#8b959d', '#5e6a73'],
  },
  {
    alt: 'Rust-colored ridges under a golden autumn sky',
    sky: ['#f0c46c', '#f9e8c0'],
    sun: '#fff6dc',
    hills: ['#d9894a', '#a6542f', '#5e2f22'],
  },
];

export const paintingCount = palettes.length;

export interface Painting {
  readonly alt: string;
  /** The picture's average color. */
  readonly color: string;
  /** A 16-pixel-wide copy of it, as a data URL. */
  readonly preview: string;
  /** The picture itself: make an object URL of it to show it. */
  readonly blob: Blob;
}

/** A small seeded generator, so each landscape is the same every time. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paint(context: CanvasRenderingContext2D, palette: Palette, seed: number) {
  const { width, height } = context.canvas;
  const random = seeded(seed);
  const sky = context.createLinearGradient(0, 0, 0, height * 0.8);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(1, palette.sky[1]);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const sunX = width * (0.2 + random() * 0.6);
  const sunY = height * (0.22 + random() * 0.2);
  const radius = height * 0.08;
  const glow = context.createRadialGradient(sunX, sunY, radius * 0.5, sunX, sunY, radius * 5);
  glow.addColorStop(0, `${palette.sun}aa`);
  glow.addColorStop(1, `${palette.sun}00`);
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  context.fillStyle = palette.sun;
  context.beginPath();
  context.arc(sunX, sunY, radius, 0, Math.PI * 2);
  context.fill();

  palette.hills.forEach((color, layer) => {
    const base = height * (0.56 + layer * 0.14);
    const amplitude = height * (0.12 - layer * 0.025);
    const [low, high] = [1 + random() * 2, 3 + random() * 4];
    const [shift, turn] = [random() * Math.PI * 2, random() * Math.PI * 2];
    context.beginPath();
    context.moveTo(0, height);
    for (let x = 0; x <= width; x += 4) {
      const t = (x / width) * Math.PI;
      const rise = 0.65 * Math.sin(t * low + shift) + 0.35 * Math.sin(t * high + turn);
      context.lineTo(x, base - amplitude * rise);
    }
    context.lineTo(width, height);
    context.closePath();
    context.fillStyle = color;
    context.fill();
  });
}

const cache = new Map<number, Promise<Painting>>();

/** The landscape at `index`, 480 × 320, painted once. */
export function painting(index: number): Promise<Painting> {
  const palette = palettes[index % palettes.length]!;
  let made = cache.get(index);
  if (!made) {
    made = new Promise<Painting>((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 320;
      const context = canvas.getContext('2d');
      const small = document.createElement('canvas');
      small.width = 16;
      small.height = 11;
      const smallContext = small.getContext('2d', { willReadFrequently: true });
      if (!context || !smallContext) return reject(new Error('No 2D canvas'));
      paint(context, palette, index + 1);
      smallContext.drawImage(canvas, 0, 0, small.width, small.height);
      const pixels = smallContext.getImageData(0, 0, small.width, small.height).data;
      const sum = [0, 0, 0];
      for (let i = 0; i < pixels.length; i += 4) {
        sum[0]! += pixels[i]!;
        sum[1]! += pixels[i + 1]!;
        sum[2]! += pixels[i + 2]!;
      }
      const count = pixels.length / 4;
      const color = `rgb(${sum.map((channel) => Math.round(channel / count)).join(' ')})`;
      const preview = small.toDataURL('image/png');
      canvas.toBlob(
        (blob) =>
          blob ? resolve({ alt: palette.alt, color, preview, blob }) : reject(new Error('No blob')),
        'image/jpeg',
        0.9,
      );
    });
    cache.set(index, made);
  }
  return made;
}

/** A picture that doesn't decode, for a fallback: what a broken link or a deleted file gives. */
export const brokenPicture = 'data:image/png;base64,AAAA';

export interface ArrivingPainting {
  readonly alt: string;
  readonly color: string;
  readonly preview: string;
  /** Not yet known: the server hasn't answered. */
  readonly src?: string;
}

/**
 * The paintings at `indexes`, as if from a slow server: what comes ahead of each (its alt,
 * color and preview) at once, and its src `latency(position)` ms after each change of
 * `indexes` or `round`, as an object URL the browser hasn't seen, so it loads afresh.
 */
export function useSlowPaintings(
  indexes: readonly number[],
  round: number,
  latency: (position: number) => number,
): readonly ArrivingPainting[] {
  const stamp = `${round}|${indexes.join()}`;
  const [made, setMade] = useState<ReadonlyMap<number, Painting>>(new Map());
  const [arrived, setArrived] = useState({ stamp, srcs: [] as readonly (string | undefined)[] });
  const latest = useRef({ indexes, latency });
  latest.current = { indexes, latency };
  const urls = useRef<string[]>([]);
  const ready = indexes.every((index) => made.has(index));

  // All six at once: they're quick to paint, and then any can be asked for.
  useEffect(() => {
    let live = true;
    void Promise.all(Array.from({ length: paintingCount }, (_, i) => painting(i))).then((all) => {
      if (live) setMade(new Map(all.map((one, i) => [i, one])));
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const { indexes, latency } = latest.current;
    const timers = indexes.map((index, position) =>
      window.setTimeout(() => {
        const src = URL.createObjectURL(made.get(index)!.blob);
        urls.current.push(src);
        setArrived((state) => {
          const srcs = state.stamp === stamp ? [...state.srcs] : [];
          srcs[position] = src;
          return { stamp, srcs };
        });
      }, latency(position)),
    );
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [ready, made, stamp]);

  // Let go of every picture made, once nothing here can show them.
  useEffect(() => {
    const made = urls.current;
    return () => {
      for (const url of made) URL.revokeObjectURL(url);
    };
  }, []);

  return indexes.flatMap((index, position) => {
    const one = made.get(index);
    if (!one) return [];
    const src = arrived.stamp === stamp ? arrived.srcs[position] : undefined;
    return [{ alt: one.alt, color: one.color, preview: one.preview, src }];
  });
}

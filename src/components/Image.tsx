import {
  type ComponentProps,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  type SyntheticEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon } from '../icons/Icon';
import { reducedMotion } from '../motion/reducedMotion';
import { bayerMatrix } from '../raster/raster';
import { cx, mergeRefs } from '../utils';

/** How a picture arrives over what held its place. */
export type ImageReveal = 'fade' | 'dither' | 'none';
export type ImageFit = 'cover' | 'contain';
export type ImageShape = 'block' | 'circle';

export interface ImageProps
  extends Omit<ComponentProps<'img'>, 'alt' | 'children' | 'className' | 'style'> {
  /** What the picture shows, read out in its place; `''` for one that only decorates. */
  readonly alt: string;
  /**
   * Width over height, held from the start so nothing moves when the picture lands:
   * `3 / 2`, `'4 / 3'`. Without it, numeric `width` and `height` give it, and a circle is
   * square. A frame with none takes the picture's own height once it's in.
   */
  readonly ratio?: number | string;
  /** `cover` (the default) fills the frame and crops; `contain` shows the whole picture. */
  readonly fit?: ImageFit;
  /** `block` (the default), or `circle` for a face. */
  readonly shape?: ImageShape;
  /**
   * The picture's own color (its average, as many image services report it), held in its
   * place at once instead of the wash, and behind the fallback.
   */
  readonly color?: string;
  /**
   * A small copy of the picture (a data URL, or a thumbnail already loaded), shown blurred
   * in its place at once until the picture is in.
   */
  readonly preview?: string;
  /**
   * How the picture arrives: `fade` (the default) rises over what held its place, `dither`
   * develops it there cell by cell in the theme's ordered dither, `none` simply shows it.
   * A picture the browser already had is shown at once, and so is every picture with
   * reduced motion.
   */
  readonly reveal?: ImageReveal;
  /** Shown in its place when the picture can't load. By default, a picture mark. */
  readonly fallback?: ReactNode;
  /** For the frame, which is what you size. Everything else goes to the `<img>`. */
  readonly className?: string;
  readonly style?: CSSProperties;
}

type Status = 'loading' | 'revealing' | 'loaded' | 'error';

/** One picture, and enough of it to show it again from the browser's cache. */
interface Picture {
  readonly key: string;
  readonly src?: string;
  readonly srcSet?: string;
  readonly sizes?: string;
  readonly crossOrigin?: ImageProps['crossOrigin'];
  readonly referrerPolicy?: ImageProps['referrerPolicy'];
}

interface State {
  readonly picture: Picture;
  readonly status: Status;
  /** The picture shown before this one, held in its place until this one is in. */
  readonly previous: Picture | null;
}

/** Moves a picture on from one status to the next, if it's still the picture shown and still at `from`. */
function step(set: Dispatch<SetStateAction<State>>, key: string, from: Status, to: Status) {
  set((state) =>
    state.picture.key === key && state.status === from
      ? { ...state, status: to, previous: to === 'revealing' ? state.previous : null }
      : state,
  );
}

const isNumeric = (value: unknown) =>
  typeof value === 'number' || (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value));

/**
 * A picture that holds its place while it loads, so nothing moves when it lands. Until
 * it's in, its frame shows the skeleton's wash (after a beat), the picture's own `color`,
 * a blurred `preview`, or the picture it replaces. Then the picture arrives over that,
 * as `reveal` says; if it can't load, the `fallback` takes its place.
 */
export function Image({
  alt,
  ratio,
  fit = 'cover',
  shape = 'block',
  color,
  preview,
  reveal = 'fade',
  fallback,
  className,
  style,
  ref,
  src,
  srcSet,
  sizes,
  crossOrigin,
  referrerPolicy,
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const key = `${src ?? ''}\n${srcSet ?? ''}`;
  const picture: Picture = { key, src, srcSet, sizes, crossOrigin, referrerPolicy };
  const [state, setState] = useState<State>({ picture, status: 'loading', previous: null });
  let current = state;
  if (state.picture.key !== key) {
    // Another picture: the one showing stays until it's in.
    const showing =
      state.status === 'loaded' || state.status === 'revealing' ? state.picture : state.previous;
    current = { picture, status: 'loading', previous: showing };
    setState(current);
  }
  const { status, previous } = current;
  const revealing = status === 'revealing';

  const frameRef = useRef<HTMLSpanElement>(null);
  const pictureRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pictureRefs = useMemo(() => mergeRefs(pictureRef, ref), [ref]);

  // A picture the browser already had is complete before it's ever painted: it's simply there.
  useLayoutEffect(() => {
    const image = pictureRef.current;
    if (image?.complete && image.naturalWidth > 0) step(setState, key, 'loading', 'loaded');
  }, [key]);

  useLayoutEffect(() => {
    if (!revealing) return;
    const frame = frameRef.current;
    const image = pictureRef.current;
    const done = () => step(setState, key, 'revealing', 'loaded');
    if (frame && image && reveal === 'dither')
      return develop(frame, image, canvasRef.current, done);
    if (frame && image && reveal === 'fade') return fadeIn(frame, image, done);
    done();
    return;
  }, [revealing, key, reveal]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onLoad?.(event);
    const image = event.currentTarget;
    const to: Status = reveal === 'none' || reducedMotion() ? 'loaded' : 'revealing';
    // Shown once decoded, so its first frame is whole.
    const arrive = () => step(setState, key, 'loading', to);
    if (typeof image.decode === 'function') image.decode().then(arrive, arrive);
    else arrive();
  };

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);
    step(setState, key, 'loading', 'error');
  };

  const aspectRatio =
    ratio !== undefined
      ? String(ratio)
      : isNumeric(width) && isNumeric(height)
        ? `${width} / ${height}`
        : shape === 'circle'
          ? '1'
          : undefined;
  const waiting = status === 'loading' || revealing;

  return (
    <span
      ref={frameRef}
      className={cx('tk-image', className)}
      data-status={status}
      data-shape={shape}
      data-fit={fit}
      style={
        {
          aspectRatio,
          ...(color ? { '--tk-image-color': color } : undefined),
          ...style,
        } as CSSProperties
      }
    >
      {waiting && previous && (
        <img
          className="tk-image-previous"
          src={previous.src}
          srcSet={previous.srcSet}
          sizes={previous.sizes}
          crossOrigin={previous.crossOrigin}
          referrerPolicy={previous.referrerPolicy}
          alt=""
          aria-hidden="true"
        />
      )}
      {waiting && !previous && (
        <span
          className="tk-image-placeholder"
          data-kind={preview ? 'preview' : color ? 'color' : 'wash'}
          aria-hidden="true"
        >
          {preview && <img className="tk-image-preview" src={preview} alt="" />}
        </span>
      )}
      {(src || srcSet) && (
        <img
          {...props}
          key={key}
          ref={pictureRefs}
          className="tk-image-picture"
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          crossOrigin={crossOrigin}
          referrerPolicy={referrerPolicy}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding={decoding}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      {revealing && reveal === 'dither' && <canvas ref={canvasRef} className="tk-image-dither" />}
      {status === 'error' &&
        // Read out as the picture would have been, under its alt; a decoration stays silent.
        (alt ? (
          <span className="tk-image-fallback" role="img" aria-label={alt}>
            {fallback ?? <Icon name="image" className="tk-image-fallback-mark" />}
          </span>
        ) : (
          <span className="tk-image-fallback" aria-hidden="true">
            {fallback ?? <Icon name="image" className="tk-image-fallback-mark" />}
          </span>
        ))}
    </span>
  );
}

function readTime(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const raw = style.getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith('ms') ? value : value * 1000;
}

/** The picture rising in over its place, on the fade clock (Bureau's flickers). */
function fadeIn(frame: HTMLElement, image: HTMLImageElement, done: () => void) {
  if (typeof image.animate !== 'function') {
    done();
    return;
  }
  const style = getComputedStyle(frame);
  const timing: KeyframeAnimationOptions = {
    duration: readTime(style, '--tk-image-fade-duration', 280),
    easing: style.getPropertyValue('--tk-ease-fade').trim() || 'ease-out',
    fill: 'both',
  };
  const keyframes = [{ opacity: 0 }, { opacity: 1 }];
  let animation: Animation;
  try {
    animation = image.animate(keyframes, timing);
  } catch {
    // An easing this browser can't read, such as linear() in an older one.
    animation = image.animate(keyframes, { ...timing, easing: 'ease-out' });
  }
  let live = true;
  animation.finished.then(
    () => live && done(),
    () => {},
  );
  return () => {
    live = false;
    animation.cancel();
  };
}

/** The dither's clock: finer than the scenery's 15 a second, so the picture develops rather than ticks. */
const DITHER_FRAME_MS = 1000 / 30;
/** How much of a cell's turn comes from a sweep down from the upper left, against the pattern's own order. */
const SWEEP = 0.35;

/** Each cell's turn to show, from 0 to 1: the Bayer pattern's order, leaning into the sweep. */
function thresholds(columns: number, rows: number, size: 2 | 4 | 8): Float32Array {
  const bayer = bayerMatrix(size);
  const order = new Float32Array(columns * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const sweep = (x / Math.max(1, columns - 1) + y / Math.max(1, rows - 1)) / 2;
      const own = bayer[(y % size) * size + (x % size)] as number;
      order[y * columns + x] = own * (1 - SWEEP) + sweep * SWEEP;
    }
  }
  return order;
}

function offset(value: string | undefined, free: number, ratio: number): number {
  const amount = Number.parseFloat(value ?? '');
  if (!value || !Number.isFinite(amount)) return free / 2;
  return value.endsWith('%') ? (free * amount) / 100 : amount * ratio;
}

/** Where the picture lies in a box of device pixels, as its object-fit and object-position lay it. */
function placement(image: HTMLImageElement, width: number, height: number, ratio: number) {
  const style = getComputedStyle(image);
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  if (style.objectFit === 'fill' || !naturalWidth || !naturalHeight) {
    return { x: 0, y: 0, width, height };
  }
  const contain = Math.min(width / naturalWidth, height / naturalHeight);
  const scale =
    style.objectFit === 'cover'
      ? Math.max(width / naturalWidth, height / naturalHeight)
      : style.objectFit === 'none'
        ? ratio
        : style.objectFit === 'scale-down'
          ? Math.min(contain, ratio)
          : contain;
  const drawnWidth = naturalWidth * scale;
  const drawnHeight = naturalHeight * scale;
  const [x, y] = style.objectPosition.split(/\s+/);
  return {
    x: offset(x, width - drawnWidth, ratio),
    y: offset(y, height - drawnHeight, ratio),
    width: drawnWidth,
    height: drawnHeight,
  };
}

/**
 * The picture developing over its place: drawn as the page will show it, through a mask
 * of whole cells that fills in, in the Bayer pattern's order, from the upper left. The
 * cells are the scenery's (`--tk-image-dither-pixel`, `--tk-image-dither-bayer`), so a
 * picture arrives in the same grain as the theme's illustrations.
 */
function develop(
  frame: HTMLElement,
  image: HTMLImageElement,
  canvas: HTMLCanvasElement | null,
  done: () => void,
) {
  const context = canvas?.getContext('2d');
  const mask = document.createElement('canvas');
  const maskContext = mask.getContext('2d');
  const width = frame.clientWidth;
  const height = frame.clientHeight;
  if (!canvas || !context || !maskContext || width === 0 || height === 0) {
    done();
    return;
  }
  const style = getComputedStyle(frame);
  const ratio = window.devicePixelRatio || 1;
  const pixel = Number.parseFloat(style.getPropertyValue('--tk-image-dither-pixel')) || 2;
  const cell = Math.max(1, Math.round(pixel * ratio));
  const bayer = Number.parseInt(style.getPropertyValue('--tk-image-dither-bayer'), 10);
  const duration = readTime(style, '--tk-image-dither-duration', 560);

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const columns = Math.ceil(canvas.width / cell);
  const rows = Math.ceil(canvas.height / cell);
  mask.width = columns;
  mask.height = rows;
  const cells = maskContext.createImageData(columns, rows);
  const order = thresholds(columns, rows, bayer === 2 || bayer === 4 ? bayer : 8);
  const place = placement(image, canvas.width, canvas.height, ratio);

  const draw = (progress: number) => {
    const level = progress * progress * (3 - 2 * progress);
    for (let i = 0; i < order.length; i++) {
      cells.data[i * 4 + 3] = (order[i] as number) < level ? 255 : 0;
    }
    maskContext.putImageData(cells, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, place.x, place.y, place.width, place.height);
    context.globalCompositeOperation = 'destination-in';
    context.imageSmoothingEnabled = false;
    context.drawImage(mask, 0, 0, columns * cell, rows * cell);
  };

  const start = performance.now();
  let last = start;
  let frameId = 0;
  draw(0);
  const tick = (now: number) => {
    if (now - last >= DITHER_FRAME_MS) {
      last = now;
      const progress = Math.min(1, (now - start) / duration);
      draw(progress);
      if (progress === 1) {
        done();
        return;
      }
    }
    frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frameId);
}

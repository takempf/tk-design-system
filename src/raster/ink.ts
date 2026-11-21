import type { Vec4 } from './raster';

let probe: CanvasRenderingContext2D | null | undefined;
const resolved = new Map<string, Vec4>();

/** Any computed CSS colour as RGBA, resolved once per distinct value through a 2D context. */
export function rgba(color: string): Vec4 {
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

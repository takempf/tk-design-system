/** Whether the reader asked for less motion. False where there is no `matchMedia`, as outside a browser. */
export const reducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

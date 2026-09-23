import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { type ComponentProps, createContext, use, useCallback, useRef } from 'react';
import { cx, withBase } from '../utils';

export type ToggleGroupProps = ComponentProps<typeof BaseToggleGroup> & {
  readonly size?: 'sm' | 'md';
};

/** Inside the lit copy, toggles render as plain labels. */
const LitCopy = createContext(false);

const marker = ['x', 'y', 'w', 'h'] as const;

/*
  Single choice: one marker slides from toggle to toggle. Over the toggles sits
  the same row again in the marker's colours, clipped to the marker's box, so a
  label inverts exactly where the marker is, even mid-slide. The pressed toggle
  is measured whenever Base UI moves `data-pressed` or the group resizes; the
  marker and the clip both transition from there.
*/
function useSlidingMarker(enabled: boolean) {
  const stop = useRef<(() => void) | null>(null);
  return useCallback(
    (group: HTMLElement | null) => {
      stop.current?.();
      stop.current = null;
      if (!group || !enabled) return;
      const place = () => {
        const pressed = group.querySelector<HTMLElement>(':scope > .tk-toggle[data-pressed]');
        group.toggleAttribute('data-empty', !pressed);
        if (!pressed) return;
        const box = group.getBoundingClientRect();
        const rect = pressed.getBoundingClientRect();
        const values = [
          rect.left - box.left - group.clientLeft,
          rect.top - box.top - group.clientTop,
          rect.width,
          rect.height,
        ];
        marker.forEach((name, i) => {
          group.style.setProperty(`--tk-marker-${name}`, `${values[i]}px`);
        });
      };
      place();
      const resize = new ResizeObserver(place);
      const press = new MutationObserver(place);
      resize.observe(group);
      press.observe(group, { subtree: true, attributes: true, attributeFilter: ['data-pressed'] });
      // Transitions switch on a frame later, so the marker starts in place.
      const frame = requestAnimationFrame(() => group.setAttribute('data-placed', ''));
      const disconnect = () => {
        resize.disconnect();
        press.disconnect();
        cancelAnimationFrame(frame);
      };
      stop.current = disconnect;
      return () => {
        disconnect();
        stop.current = null;
      };
    },
    [enabled],
  );
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const readTime = (style: CSSStyleDeclaration, name: string): number => {
  const raw = style.getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  return (raw.endsWith('ms') ? value : value * 1000) || 0;
};

/*
  Multiple choice: each toggle fills on its own. The fill grows out of the point
  that was clicked and settles centred on the toggle; released, it shrinks back
  into the click. Centre and size ride one curve, so the fill never spills out
  of the toggle on the way. Keyboard presses grow from the centre.
*/
function useBloomingFill(enabled: boolean) {
  const stop = useRef<(() => void) | null>(null);
  return useCallback(
    (group: HTMLElement | null) => {
      stop.current?.();
      stop.current = null;
      if (!group || !enabled) return;
      const origins = new WeakMap<Element, readonly [number, number]>();
      const running = new WeakMap<Element, Animation>();
      const toggleOf = (target: EventTarget | null) => {
        const toggle = target instanceof Element ? target.closest('.tk-toggle') : null;
        return toggle?.parentElement === group ? toggle : null;
      };
      const aim = (event: PointerEvent) => {
        const toggle = toggleOf(event.target);
        if (!toggle) return;
        const rect = toggle.getBoundingClientRect();
        origins.set(toggle, [
          event.clientX - rect.left - rect.width / 2,
          event.clientY - rect.top - rect.height / 2,
        ]);
      };
      const forget = (event: KeyboardEvent) => {
        const toggle = toggleOf(event.target);
        if (toggle) origins.delete(toggle);
      };
      const press = new MutationObserver((records) => {
        const style = getComputedStyle(group);
        const duration = readTime(style, '--tk-duration-morph');
        const easing = style.getPropertyValue('--tk-ease-morph').trim() || 'ease-out';
        for (const { target } of records) {
          if (!(target instanceof HTMLElement) || target.parentElement !== group) continue;
          const [x, y] = origins.get(target) ?? [0, 0];
          origins.delete(target);
          const point = { translate: `${x}px ${y}px`, scale: '0' };
          const full = { translate: '0px 0px', scale: '1' };
          const pressed = target.hasAttribute('data-pressed');
          // Pressed again mid-flight: carry on from wherever the fill is now.
          const previous = running.get(target);
          let from = pressed ? point : full;
          if (previous?.playState === 'running') {
            const now = getComputedStyle(target, '::after');
            from = { translate: now.translate, scale: now.scale };
          }
          previous?.cancel();
          if (reducedMotion() || !duration) continue;
          running.set(
            target,
            target.animate([from, pressed ? full : point], {
              duration,
              easing,
              pseudoElement: '::after',
            }),
          );
        }
      });
      group.addEventListener('pointerdown', aim);
      group.addEventListener('keydown', forget);
      press.observe(group, { subtree: true, attributes: true, attributeFilter: ['data-pressed'] });
      const disconnect = () => {
        group.removeEventListener('pointerdown', aim);
        group.removeEventListener('keydown', forget);
        press.disconnect();
      };
      stop.current = disconnect;
      return () => {
        disconnect();
        stop.current = null;
      };
    },
    [enabled],
  );
}

/** A segmented control. Single choice unless `multiple`; a single choice slides. */
export function ToggleGroup({
  className,
  size = 'md',
  multiple,
  children,
  ref: forwarded,
  ...props
}: ToggleGroupProps) {
  const sliding = !multiple;
  const slide = useSlidingMarker(sliding);
  const bloom = useBloomingFill(!sliding);
  const ref = useCallback(
    (group: HTMLDivElement | null) => {
      if (typeof forwarded === 'function') forwarded(group);
      else if (forwarded) forwarded.current = group;
      const unslide = slide(group);
      const unbloom = bloom(group);
      return () => {
        unslide?.();
        unbloom?.();
      };
    },
    [forwarded, slide, bloom],
  );
  return (
    <BaseToggleGroup
      {...props}
      ref={ref}
      multiple={multiple}
      data-size={size}
      data-sliding={sliding ? '' : undefined}
      className={withBase('tk-toggle-group', className)}
    >
      {children}
      {sliding && (
        <>
          <span className="tk-toggle-marker" aria-hidden />
          <span className="tk-toggle-lit" aria-hidden>
            <LitCopy value={true}>{children}</LitCopy>
          </span>
        </>
      )}
    </BaseToggleGroup>
  );
}

export type ToggleProps = ComponentProps<typeof BaseToggle>;

export function Toggle({ className, ...props }: ToggleProps) {
  if (use(LitCopy)) {
    return (
      <span className={cx('tk-toggle', typeof className === 'string' && className)}>
        {props.children}
      </span>
    );
  }
  return <BaseToggle {...props} className={withBase('tk-toggle', className)} />;
}

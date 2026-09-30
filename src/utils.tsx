import type { ComponentProps, ComponentType, Ref, RefCallback } from 'react';

/** Base UI accepts `className` as a string or as a function of component state. */
export type ClassName<State = never> = string | ((state: State) => string | undefined) | undefined;

export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');

/** Prefix a Base UI className (string or state function) with our own class. */
export function withBase<State>(base: string, className: ClassName<State>): ClassName<State> {
  if (typeof className === 'function') {
    return (state: State) => cx(base, className(state));
  }
  return cx(base, className);
}

/** One ref callback that feeds several refs (object or function), cleanups included. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
      return undefined;
    });
    return () => {
      refs.forEach((ref, i) => {
        const cleanup = cleanups[i];
        if (typeof cleanup === 'function') cleanup();
        else if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      });
    };
  };
}

/**
 * Wrap a Base UI part so it always carries a `tk-*` class. Every visual rule lives in
 * CSS against that class and the part's own data attributes, so the React layer stays
 * a thin, fully typed pass-through (refs included; React 19 passes them as props).
 */
// biome-ignore lint/suspicious/noExplicitAny: any component; props are recovered via ComponentProps
export function part<C extends ComponentType<any>>(Component: C, base: string) {
  type Props = ComponentProps<C>;
  const Styled = (props: Props) => {
    const { className, ...rest } = props as { className?: ClassName<unknown> };
    const Any = Component as unknown as ComponentType<Record<string, unknown>>;
    return <Any {...rest} className={withBase(base, className)} />;
  };
  Styled.displayName = base;
  return Styled;
}

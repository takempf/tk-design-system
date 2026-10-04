import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { cx } from '../utils';
import type { ThemeName } from './themes';

interface ThemeContextValue {
  readonly name: ThemeName;
  /** Where popups from inside this theme render. `undefined` means document.body. */
  readonly portal: HTMLElement | undefined;
}

const ThemeContext = createContext<ThemeContextValue>({ name: 'base', portal: undefined });

export const useTheme = (): ThemeContextValue => use(ThemeContext);

/** Base UI `Portal` container for the nearest theme. */
export const usePortalContainer = (): HTMLElement | undefined => use(ThemeContext).portal;

type ThemeProps = {
  readonly name: ThemeName;
  readonly children?: ReactNode;
} & (({ readonly scope?: 'element' } & ComponentProps<'div'>) | { readonly scope: 'document' });

/**
 * Apply a theme to a subtree (default) or to the whole document.
 *
 * Tokens are CSS custom properties, so a scoped theme is just an attribute. Popups
 * portal to <body> to escape clipping and stacking, so a scoped theme also keeps a
 * matching empty `display: contents` container there for them to inherit from.
 */
export function Theme(props: ThemeProps) {
  const { name, children } = props;
  const documentScope = props.scope === 'document';
  const [portal, setPortal] = useState<HTMLElement>();

  useLayoutEffect(() => {
    if (!documentScope) return;
    const root = document.documentElement;
    const previous = root.dataset.tkTheme;
    root.dataset.tkTheme = name;
    return () => {
      if (previous === undefined) delete root.dataset.tkTheme;
      else root.dataset.tkTheme = previous;
    };
  }, [documentScope, name]);

  useLayoutEffect(() => {
    if (documentScope) return;
    const node = document.createElement('div');
    node.className = 'tk-portal';
    document.body.append(node);
    setPortal(node);
    return () => {
      node.remove();
      setPortal(undefined);
    };
  }, [documentScope]);

  useLayoutEffect(() => {
    if (portal) portal.dataset.tkTheme = name;
  }, [portal, name]);

  // Every popup reads this context, so it changes only when the theme or portal does.
  const value = useMemo(
    () => ({ name, portal: documentScope ? undefined : portal }),
    [name, documentScope, portal],
  );

  if (props.scope === 'document') {
    return <ThemeContext value={value}>{children}</ThemeContext>;
  }
  const { scope: _scope, name: _name, className, ...rest } = props;
  return (
    <ThemeContext value={value}>
      <div {...rest} data-tk-theme={name} className={cx('tk-theme', className)}>
        {children}
      </div>
    </ThemeContext>
  );
}

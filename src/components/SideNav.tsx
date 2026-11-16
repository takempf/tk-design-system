import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { useRender } from '@base-ui/react/use-render';
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type ReactNode,
  use,
  useCallback,
  useId,
  useMemo,
} from 'react';
import { usePortalContainer } from '../theme/Theme';
import { cx } from '../utils';
import { Eyebrow } from './Primitives';

interface Settings {
  readonly collapsed: boolean;
  readonly numbered: boolean;
}

const Settings = createContext<Settings>({ collapsed: false, numbered: false });

/** Inside the lit copy, items render as plain labels and groups as plain boxes. */
const LitCopy = createContext(false);

const marker = ['x', 'y', 'w', 'h'] as const;

/*
  One marker glides to the current page. Over the links sits the same list again
  in the marker's colours, clipped to the marker's box, so a label inverts exactly
  where the marker is, even mid-glide. The current item is whichever carries
  aria-current="page": set by `active`, or by the link itself (a router's NavLink).

  The current item is measured once the browser has laid the page out: in the
  resize observer (whose first report comes as the list is first laid out) and in
  the frame after aria-current moves. A change of page glides; a resize (the rail
  collapsing, a font arriving) or the first page after none jumps, so the marker
  never trails the item it belongs to.
*/
function useGlidingMarker() {
  return useCallback((track: HTMLElement | null) => {
    const list = track?.firstElementChild;
    if (!track || !list) return;
    let placing = 0;
    let settling = 0;
    const place = (glide: boolean) => {
      const current = list.querySelector<HTMLElement>('.tk-side-nav-item[aria-current="page"]');
      const wasEmpty = track.hasAttribute('data-empty');
      track.toggleAttribute('data-empty', !current);
      if (!current) return;
      if (!glide || wasEmpty) track.removeAttribute('data-placed');
      const box = track.getBoundingClientRect();
      const rect = current.getBoundingClientRect();
      const values = [rect.left - box.left, rect.top - box.top, rect.width, rect.height];
      marker.forEach((name, i) => {
        track.style.setProperty(`--tk-marker-${name}`, `${values[i]}px`);
      });
      // Transitions switch back on a frame later, once the jump has landed.
      cancelAnimationFrame(settling);
      settling = requestAnimationFrame(() => track.setAttribute('data-placed', ''));
    };
    const resize = new ResizeObserver(() => place(false));
    const move = new MutationObserver(() => {
      cancelAnimationFrame(placing);
      placing = requestAnimationFrame(() => place(true));
    });
    resize.observe(track);
    move.observe(list, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-current'],
    });
    return () => {
      resize.disconnect();
      move.disconnect();
      cancelAnimationFrame(placing);
      cancelAnimationFrame(settling);
    };
  }, []);
}

export type SideNavRootProps = ComponentProps<'nav'> & {
  /**
   * An icon rail: labels leave for tooltips and group headings become rules. Give
   * every item an `icon`.
   */
  readonly collapsed?: boolean;
  /** Number the items 01, 02, … down the whole list, across groups. */
  readonly numbered?: boolean;
};

function SideNavRoot({
  collapsed = false,
  numbered = false,
  className,
  children,
  ...props
}: SideNavRootProps) {
  const track = useGlidingMarker();
  const settings = useMemo(() => ({ collapsed, numbered }), [collapsed, numbered]);
  return (
    <nav
      {...props}
      data-collapsed={collapsed || undefined}
      data-numbered={numbered || undefined}
      className={cx('tk-side-nav', className)}
    >
      <Settings value={settings}>
        <div ref={track} className="tk-side-nav-track">
          <div className="tk-side-nav-list">{children}</div>
          <span className="tk-side-nav-marker" aria-hidden />
          <div className="tk-side-nav-list tk-side-nav-lit" aria-hidden inert>
            <LitCopy value={true}>{children}</LitCopy>
          </div>
        </div>
      </Settings>
    </nav>
  );
}

export type SideNavGroupProps = ComponentProps<'div'> & {
  /** A heading over the group's items, in the label face. */
  readonly label?: ReactNode;
};

function SideNavGroup({ label, className, children, id, ...props }: SideNavGroupProps) {
  const lit = use(LitCopy);
  const headingId = useId();
  const labelled = label != null && !lit;
  // Named by its heading. The lit copy is hidden, so it names nothing.
  const group = labelled ? { role: 'group', 'aria-labelledby': headingId } : {};
  return (
    <div
      {...props}
      {...group}
      id={lit ? undefined : id}
      className={cx('tk-side-nav-group', className)}
    >
      {label != null && (
        <Eyebrow id={labelled ? headingId : undefined} className="tk-side-nav-heading">
          {label}
        </Eyebrow>
      )}
      {children}
    </div>
  );
}

export type SideNavItemProps = useRender.ComponentProps<'a'> & {
  /**
   * Marks the current page (aria-current="page"). Leave it unset when the link
   * marks itself, as a router's NavLink does.
   */
  readonly active?: boolean;
  /** Shown before the label, and alone when the nav is collapsed. */
  readonly icon?: ReactNode;
  /** Colours the icon, say to match the kind of page it leads to. */
  readonly iconColor?: string;
};

/**
 * A link in the nav. It renders an `<a>`; pass `render` to make it a router's
 * link instead (`render={<NavLink to="/people" />}`).
 */
function SideNavItem({
  render,
  active,
  icon,
  iconColor,
  className,
  style,
  children,
  id,
  ref,
  ...props
}: SideNavItemProps) {
  const lit = use(LitCopy);
  const { collapsed, numbered } = use(Settings);
  const container = usePortalContainer();

  const itemClassName = cx('tk-side-nav-item', className);
  const itemStyle = iconColor
    ? ({ ...style, '--tk-side-nav-icon-color': iconColor } as CSSProperties)
    : style;
  const content = (
    <>
      {numbered && <span className="tk-side-nav-number" aria-hidden />}
      {icon != null && <span className="tk-side-nav-icon">{icon}</span>}
      <span className="tk-side-nav-label">{children}</span>
    </>
  );
  const itemProps = {
    ...props,
    id,
    className: itemClassName,
    style: itemStyle,
    children: content,
    ...(active === undefined ? {} : { 'aria-current': active ? ('page' as const) : undefined }),
  };

  const element = useRender({
    render,
    ref,
    props: itemProps,
    defaultTagName: 'a',
    enabled: !lit && !collapsed,
  });

  if (lit) {
    return (
      <span className={itemClassName} style={itemStyle}>
        {content}
      </span>
    );
  }
  if (element) return element;

  // Collapsed: the label is only for screen readers, so the tooltip shows it.
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger
        {...(itemProps as ComponentProps<typeof BaseTooltip.Trigger>)}
        ref={ref as ComponentProps<typeof BaseTooltip.Trigger>['ref']}
        render={render ?? ((anchor) => <a {...anchor} />)}
      />
      <BaseTooltip.Portal container={container}>
        <BaseTooltip.Positioner className="tk-positioner" side="right" sideOffset={8}>
          <BaseTooltip.Popup className="tk-popup tk-tooltip">{children}</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/**
 * A side menu: links in optional groups, with one marker that glides to the
 * current page and inverts the label under it.
 */
export const SideNav = {
  Root: SideNavRoot,
  Group: SideNavGroup,
  Item: SideNavItem,
};

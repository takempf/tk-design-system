import { Menu as BaseMenu } from '@base-ui/react/menu';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { PopupMorph, usePopupMorph } from '../motion/popupMorph';
import { usePortalContainer } from '../theme/Theme';
import { cx, part, withBase } from '../utils';
import { overTrigger } from './popup';

/**
 * What a root menu's popup needs to open over its trigger: the trigger's label,
 * to show in its place as the first row. Submenus open beside their row
 * instead, so they clear it.
 */
interface Opener {
  readonly label: ReactNode;
  readonly setLabel: (label: ReactNode) => void;
  readonly close: () => void;
}

const OpenerContext = createContext<Opener | null>(null);

function Root({
  open,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  actionsRef,
  ...props
}: ComponentProps<typeof BaseMenu.Root>) {
  const popup = usePopupMorph({
    open,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    prefix: 'menu',
  });
  const [label, setLabel] = useState<ReactNode>(null);
  const ownActions = useRef<BaseMenu.Root.Actions>(null);
  const actions = actionsRef ?? ownActions;
  const opener = useMemo<Opener>(
    () => ({ label, setLabel, close: () => actions.current?.close() }),
    [label, actions],
  );
  return (
    <PopupMorph.Provider value={popup.state}>
      <OpenerContext.Provider value={opener}>
        <BaseMenu.Root
          {...props}
          open={popup.open}
          onOpenChange={popup.setOpen}
          onOpenChangeComplete={popup.onOpenChangeComplete}
          actionsRef={actions}
        />
      </OpenerContext.Provider>
    </PopupMorph.Provider>
  );
}

function SubmenuRoot(props: ComponentProps<typeof BaseMenu.SubmenuRoot>) {
  return (
    <PopupMorph.Detach>
      <OpenerContext.Provider value={null}>
        <BaseMenu.SubmenuRoot {...props} />
      </OpenerContext.Provider>
    </PopupMorph.Detach>
  );
}

function Trigger({ children, ...props }: ComponentProps<typeof BaseMenu.Trigger>) {
  const opener = useContext(OpenerContext);
  const setLabel = opener?.setLabel;
  useLayoutEffect(() => setLabel?.(children), [setLabel, children]);
  if (!opener) return <BaseMenu.Trigger {...props}>{children}</BaseMenu.Trigger>;
  return (
    <PopupMorph.Trigger>
      <BaseMenu.Trigger {...props}>
        <PopupMorph.Part name="label" side="trigger">
          <span className="tk-menu-label">{children}</span>
        </PopupMorph.Part>
      </BaseMenu.Trigger>
    </PopupMorph.Trigger>
  );
}

type PositionerProps = Pick<
  ComponentProps<typeof BaseMenu.Positioner>,
  'side' | 'align' | 'sideOffset' | 'alignOffset'
>;

type PopupProps = ComponentProps<typeof BaseMenu.Popup> &
  PositionerProps & {
    /** Matches the trigger button's size, so the rows read at its type size. */
    readonly size?: 'sm' | 'md' | 'lg';
  };

function Popup({
  side,
  align = 'start',
  sideOffset = 6,
  alignOffset,
  size = 'md',
  className,
  children,
  ref,
  ...props
}: PopupProps) {
  const container = usePortalContainer();
  const opener = useContext(OpenerContext);
  const menu = (
    <BaseMenu.Popup
      {...props}
      ref={ref}
      className={withBase(
        cx('tk-popup tk-list-popup tk-menu-popup', opener && 'tk-over-trigger'),
        className,
      )}
      data-size={size}
    >
      {opener ? (
        <>
          {/* The trigger, as the popup's own first row: pressing it closes. */}
          <div className="tk-menu-head" aria-hidden="true" onClick={opener.close}>
            <PopupMorph.Part name="label" side="popup">
              <span className="tk-menu-label">{opener.label}</span>
            </PopupMorph.Part>
          </div>
          <div className="tk-menu-items">{children}</div>
        </>
      ) : (
        children
      )}
    </BaseMenu.Popup>
  );
  return (
    <BaseMenu.Portal container={container}>
      <BaseMenu.Positioner
        className="tk-positioner"
        side={side}
        align={align}
        sideOffset={opener ? overTrigger : sideOffset}
        alignOffset={alignOffset}
      >
        {opener ? <PopupMorph.Popup>{menu}</PopupMorph.Popup> : menu}
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

type WithIcon = { readonly icon?: IconName };

function Item({
  icon,
  children,
  className,
  ...props
}: ComponentProps<typeof BaseMenu.Item> & WithIcon) {
  return (
    <BaseMenu.Item {...props} className={withBase('tk-list-item', className)}>
      <span className="tk-list-indicator">{icon && <Icon name={icon} />}</span>
      <span className="tk-list-text">{children}</span>
    </BaseMenu.Item>
  );
}

function LinkItem({
  icon,
  children,
  className,
  ...props
}: ComponentProps<typeof BaseMenu.LinkItem> & WithIcon) {
  return (
    <BaseMenu.LinkItem {...props} className={withBase('tk-list-item', className)}>
      <span className="tk-list-indicator">{icon && <Icon name={icon} />}</span>
      <span className="tk-list-text">{children}</span>
    </BaseMenu.LinkItem>
  );
}

function CheckboxItem({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseMenu.CheckboxItem>) {
  return (
    <BaseMenu.CheckboxItem {...props} className={withBase('tk-list-item', className)}>
      <BaseMenu.CheckboxItemIndicator className="tk-list-indicator">
        <Icon name="check" />
      </BaseMenu.CheckboxItemIndicator>
      <span className="tk-list-text">{children}</span>
    </BaseMenu.CheckboxItem>
  );
}

function RadioItem({ children, className, ...props }: ComponentProps<typeof BaseMenu.RadioItem>) {
  return (
    <BaseMenu.RadioItem {...props} className={withBase('tk-list-item', className)}>
      <BaseMenu.RadioItemIndicator className="tk-list-indicator">
        <Icon name="dot" />
      </BaseMenu.RadioItemIndicator>
      <span className="tk-list-text">{children}</span>
    </BaseMenu.RadioItem>
  );
}

function SubmenuTrigger({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseMenu.SubmenuTrigger>) {
  return (
    <BaseMenu.SubmenuTrigger {...props} className={withBase('tk-list-item', className)}>
      <span className="tk-list-indicator" />
      <span className="tk-list-text">{children}</span>
      <Icon name="chevron-right" className="tk-list-trailing" />
    </BaseMenu.SubmenuTrigger>
  );
}

/**
 * A list of actions. `Menu.Popup` bundles the portal and positioner, and takes
 * the trigger button's `size`; items take an optional `icon` and
 * `data-tone="danger"`.
 *
 * The button is the menu's container, closed: opening, its frame grows into
 * the popup's over it, its own label becomes the first row (press it to
 * close), and the items open below (or above, when there is no room). The
 * label travels between the two, so it is never shown twice. Submenus open
 * beside their row, at `sideOffset`.
 *
 *   <Menu.Root>
 *     <Menu.Trigger render={<Button />}>Options</Menu.Trigger>
 *     <Menu.Popup>
 *       <Menu.Item onClick={rename}>Rename</Menu.Item>
 *     </Menu.Popup>
 *   </Menu.Root>
 */
export const Menu = {
  Root,
  Trigger,
  Popup,
  Item,
  LinkItem,
  Separator: part(BaseMenu.Separator, 'tk-list-separator'),
  Group: BaseMenu.Group,
  GroupLabel: part(BaseMenu.GroupLabel, 'tk-list-group-label'),
  CheckboxItem,
  RadioGroup: BaseMenu.RadioGroup,
  RadioItem,
  SubmenuRoot,
  SubmenuTrigger,
};

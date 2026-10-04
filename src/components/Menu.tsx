import { Menu as BaseMenu } from '@base-ui/react/menu';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { Morph, useMorphName } from '../motion/morph';
import { usePortalContainer } from '../theme/Theme';
import { cx, mergeRefs, part, withBase } from '../utils';
import { overTrigger, useGrowFrom, useMorphingOpen } from './popup';

/**
 * What a root menu's popup needs from its trigger to open over it: the trigger
 * to grow out of, and its label to show in its place. Submenus open beside
 * their row instead, so they clear it.
 */
interface Opener {
  readonly name: string;
  readonly open: boolean;
  readonly trigger: RefObject<HTMLElement | null>;
  readonly label: ReactNode;
  readonly setLabel: (label: ReactNode) => void;
  readonly close: () => void;
}

const OpenerContext = createContext<Opener | null>(null);

function Root({
  open,
  defaultOpen = false,
  onOpenChange,
  actionsRef,
  ...props
}: ComponentProps<typeof BaseMenu.Root>) {
  const name = useMorphName('menu');
  // The label is carried from the trigger into the popup and back.
  const [isOpen, setOpen] = useMorphingOpen(open, onOpenChange, name, { initial: defaultOpen });
  const [label, setLabel] = useState<ReactNode>(null);
  const trigger = useRef<HTMLElement>(null);
  const ownActions = useRef<BaseMenu.Root.Actions>(null);
  const actions = actionsRef ?? ownActions;
  const opener: Opener = {
    name,
    open: isOpen,
    trigger,
    label,
    setLabel,
    close: () => actions.current?.close(),
  };
  return (
    <OpenerContext.Provider value={opener}>
      <BaseMenu.Root {...props} open={isOpen} onOpenChange={setOpen} actionsRef={actions} />
    </OpenerContext.Provider>
  );
}

function SubmenuRoot(props: ComponentProps<typeof BaseMenu.SubmenuRoot>) {
  return (
    <OpenerContext.Provider value={null}>
      <BaseMenu.SubmenuRoot {...props} />
    </OpenerContext.Provider>
  );
}

function Trigger({ children, ref, ...props }: ComponentProps<typeof BaseMenu.Trigger>) {
  const opener = useContext(OpenerContext);
  const setLabel = opener?.setLabel;
  useLayoutEffect(() => setLabel?.(children), [setLabel, children]);
  if (!opener) {
    return (
      <BaseMenu.Trigger {...props} ref={ref}>
        {children}
      </BaseMenu.Trigger>
    );
  }
  return (
    <BaseMenu.Trigger {...props} ref={mergeRefs(ref, opener.trigger)}>
      <Morph name={opener.name} active={!opener.open} fit="text" scope={opener.name}>
        <span className="tk-menu-label">{children}</span>
      </Morph>
    </BaseMenu.Trigger>
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
  const grow = useGrowFrom(opener?.trigger);
  const isRoot = opener !== null;
  const refs = useMemo(() => (isRoot ? mergeRefs(ref, grow) : ref), [isRoot, ref, grow]);
  return (
    <BaseMenu.Portal container={container}>
      <BaseMenu.Positioner
        className="tk-positioner"
        side={side}
        align={align}
        sideOffset={opener ? overTrigger : sideOffset}
        alignOffset={alignOffset}
      >
        <BaseMenu.Popup
          {...props}
          ref={refs}
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
                <Morph name={opener.name} active={opener.open} fit="text" scope={opener.name}>
                  <span className="tk-menu-label">{opener.label}</span>
                </Morph>
              </div>
              <div className="tk-menu-items">{children}</div>
            </>
          ) : (
            children
          )}
        </BaseMenu.Popup>
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
 * A menu opens out of its trigger: the button's frame grows into the popup's,
 * its first row is the button's own label (press it to close), and the items
 * open below (or above, when there is no room). The label travels between the two, so it is
 * never shown twice. Submenus open beside their row, at `sideOffset`.
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

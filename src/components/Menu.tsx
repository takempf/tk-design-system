import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { ComponentProps } from 'react';
import { Icon, type IconName } from '../icons/Icon';
import { usePortalContainer } from '../theme/Theme';
import { part, withBase } from '../utils';

type PositionerProps = Pick<
  ComponentProps<typeof BaseMenu.Positioner>,
  'side' | 'align' | 'sideOffset' | 'alignOffset'
>;

function Popup({
  side,
  align = 'start',
  sideOffset = 6,
  alignOffset,
  className,
  ...props
}: ComponentProps<typeof BaseMenu.Popup> & PositionerProps) {
  const container = usePortalContainer();
  return (
    <BaseMenu.Portal container={container}>
      <BaseMenu.Positioner
        className="tk-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BaseMenu.Popup {...props} className={withBase('tk-popup tk-list-popup', className)} />
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
 * A list of actions. `Menu.Popup` bundles the portal and positioner; items take
 * an optional `icon` and `data-tone="danger"`.
 *
 *   <Menu.Root>
 *     <Menu.Trigger render={<Button />}>Options</Menu.Trigger>
 *     <Menu.Popup>
 *       <Menu.Item onClick={rename}>Rename</Menu.Item>
 *     </Menu.Popup>
 *   </Menu.Root>
 */
export const Menu = {
  Root: BaseMenu.Root,
  Trigger: BaseMenu.Trigger,
  Popup,
  Item,
  LinkItem,
  Separator: part(BaseMenu.Separator, 'tk-list-separator'),
  Group: BaseMenu.Group,
  GroupLabel: part(BaseMenu.GroupLabel, 'tk-list-group-label'),
  CheckboxItem,
  RadioGroup: BaseMenu.RadioGroup,
  RadioItem,
  SubmenuRoot: BaseMenu.SubmenuRoot,
  SubmenuTrigger,
};

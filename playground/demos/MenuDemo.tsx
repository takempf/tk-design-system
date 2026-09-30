import { useState } from 'react';
import { Button, Icon, Menu, toasts } from 'tk-design-system';

export const meta = {
  section: 'actions',
  title: 'Menu',
  description:
    'It opens out of its button, whose label becomes the first row. Groups, checkable and radio items, a submenu and a danger action.',
  order: 3,
};

export default function MenuDemo() {
  const [lantern, setLantern] = useState(true);
  const [path, setPath] = useState('river');
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button />}>
        Pack <Icon name="chevron-down" />
      </Menu.Trigger>
      <Menu.Popup>
        <Menu.Group>
          <Menu.GroupLabel>Supplies</Menu.GroupLabel>
          <Menu.Item icon="plus" onClick={() => toasts.add({ title: 'Bread packed' })}>
            Bread
          </Menu.Item>
          <Menu.CheckboxItem checked={lantern} onCheckedChange={setLantern}>
            Lantern
          </Menu.CheckboxItem>
        </Menu.Group>
        <Menu.Separator />
        <Menu.RadioGroup value={path} onValueChange={setPath}>
          <Menu.GroupLabel>Path</Menu.GroupLabel>
          <Menu.RadioItem value="river">Along the river</Menu.RadioItem>
          <Menu.RadioItem value="ridge">Over the ridge</Menu.RadioItem>
        </Menu.RadioGroup>
        <Menu.Separator />
        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger>Share route</Menu.SubmenuTrigger>
          <Menu.Popup side="right" align="start" sideOffset={4}>
            <Menu.Item icon="copy">Copy link</Menu.Item>
            <Menu.Item icon="external">Send by raven</Menu.Item>
          </Menu.Popup>
        </Menu.SubmenuRoot>
        <Menu.Item icon="close" data-tone="danger">
          Abandon camp
        </Menu.Item>
      </Menu.Popup>
    </Menu.Root>
  );
}

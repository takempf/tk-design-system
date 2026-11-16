import { useState } from 'react';
import { Icon, type IconName, SideNav, Stack, Switch } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'SideNav',
  description:
    'A side menu. The marker glides to the current page and inverts the label under it. Collapsed, it is an icon rail with its labels in tooltips.',
  order: 7,
};

const groups: readonly {
  readonly label?: string;
  readonly items: readonly { id: string; title: string; icon: IconName; color?: string }[];
}[] = [
  { items: [{ id: 'camp', title: 'Camp', icon: 'ember' }] },
  {
    label: 'Field guide',
    items: [
      { id: 'flora', title: 'Flora', icon: 'tree', color: 'var(--tk-green)' },
      { id: 'fauna', title: 'Fauna', icon: 'stag-solid', color: 'var(--tk-orange)' },
      { id: 'weather', title: 'Weather', icon: 'moon', color: 'var(--tk-blue)' },
    ],
  },
  {
    label: 'Journal',
    items: [
      { id: 'entries', title: 'Entries', icon: 'edit' },
      { id: 'maps', title: 'Maps', icon: 'globe' },
    ],
  },
];

export default function SideNavDemo() {
  const [current, setCurrent] = useState('flora');
  const [collapsed, setCollapsed] = useState(false);
  const [numbered, setNumbered] = useState(false);
  return (
    <Stack gap={4}>
      <Stack direction="row" gap={6} wrap>
        <Switch checked={collapsed} onCheckedChange={setCollapsed}>
          Collapsed
        </Switch>
        <Switch checked={numbered} onCheckedChange={setNumbered}>
          Numbered
        </Switch>
      </Stack>
      <div className="demo-side-nav" data-collapsed={collapsed || undefined}>
        <SideNav.Root aria-label="Field notes" collapsed={collapsed} numbered={numbered}>
          {groups.map((group, index) => (
            <SideNav.Group key={group.label ?? index} label={group.label}>
              {group.items.map((item) => (
                <SideNav.Item
                  key={item.id}
                  // A router's link goes here the same way: render={<NavLink to="/flora" />}.
                  render={<button type="button" onClick={() => setCurrent(item.id)} />}
                  active={item.id === current}
                  icon={<Icon name={item.icon} />}
                  iconColor={item.color}
                >
                  {item.title}
                </SideNav.Item>
              ))}
            </SideNav.Group>
          ))}
        </SideNav.Root>
      </div>
    </Stack>
  );
}

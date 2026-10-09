import { Badge, Button, Icon, Popover, Stack } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Popover',
  description:
    'Rich content that grows out of its trigger and folds back into it. The trigger’s icon and label fly to the title rather than fading.',
  order: 3,
};

export default function Popovers() {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button />}>
        <Popover.SharedElement name="icon" side="trigger" fit="icon">
          <Icon name="info" />
        </Popover.SharedElement>
        <Popover.SharedElement name="label" side="trigger" fit="text">
          <span>The Hollow Way</span>
        </Popover.SharedElement>
      </Popover.Trigger>
      <Popover.Popup side="bottom" align="start">
        <Popover.Title className="demo-popover-title">
          <Popover.SharedElement name="icon" side="popup" fit="icon">
            <Icon name="info" />
          </Popover.SharedElement>
          <Popover.SharedElement name="label" side="popup" fit="text">
            <span>The Hollow Way</span>
          </Popover.SharedElement>
        </Popover.Title>
        <Popover.Description>
          Sunk six feet into the hillside by centuries of feet and cartwheels. Muddy after rain.
        </Popover.Description>
        <Stack direction="row" gap={2}>
          <Badge tone="accent">2.4 km</Badge>
          <Badge tone="warning">Steep</Badge>
        </Stack>
      </Popover.Popup>
    </Popover.Root>
  );
}

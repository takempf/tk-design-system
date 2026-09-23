import { Badge, Button, Icon, Popover, Stack } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Popover',
  description: 'Rich content anchored to a trigger.',
  order: 3,
};

export default function Popovers() {
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button />}>
        <Icon name="info" /> About this path
      </Popover.Trigger>
      <Popover.Popup side="bottom" align="start">
        <Popover.Title>The Hollow Way</Popover.Title>
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

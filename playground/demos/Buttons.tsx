import { Button, Icon, Stack } from 'tk-design-system';

export const meta = {
  section: 'actions',
  title: 'Button',
  description: 'Four variants, three sizes. Square buttons hold a lone icon.',
  order: 1,
};

export default function Buttons() {
  return (
    <Stack gap={5}>
      <Stack direction="row" gap={3} wrap align="center">
        <Button variant="primary">Enter the wood</Button>
        <Button>Gather kindling</Button>
        <Button variant="ghost">Rest</Button>
        <Button variant="danger">Put out fire</Button>
      </Stack>
      <Stack direction="row" gap={3} wrap align="center">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg" variant="primary">
          Large <Icon name="arrow-right" />
        </Button>
        <Button square aria-label="Search">
          <Icon name="search" />
        </Button>
        <Button disabled>Disabled</Button>
      </Stack>
    </Stack>
  );
}

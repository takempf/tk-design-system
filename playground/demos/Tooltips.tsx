import { Button, Icon, Stack, Tooltip } from 'tk-design-system';

export const meta = {
  section: 'actions',
  title: 'Tooltip',
  description: 'Short hints on hover and focus. Wrap your app in TooltipProvider.',
  order: 4,
};

const tools = [
  { icon: 'tree', label: 'Plant' },
  { icon: 'ember', label: 'Kindle' },
  { icon: 'moon', label: 'Wait for nightfall' },
  { icon: 'eye', label: 'Keep watch' },
] as const;

export default function Tooltips() {
  return (
    <Stack direction="row" gap={2}>
      {tools.map(({ icon, label }) => (
        <Tooltip key={icon} content={label}>
          <Button square variant="ghost" aria-label={label}>
            <Icon name={icon} />
          </Button>
        </Tooltip>
      ))}
    </Stack>
  );
}

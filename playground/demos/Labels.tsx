import { Badge, Eyebrow, Kbd, Separator, Stack } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Eyebrow, badge, kbd, separator',
  description: 'The small print. Eyebrows are the section labels — red, condensed, spaced.',
  order: 8,
};

export default function Labels() {
  return (
    <Stack gap={4}>
      <Eyebrow>Chapter three · the ford</Eyebrow>
      <Stack direction="row" gap={2} wrap>
        <Badge>Neutral</Badge>
        <Badge tone="accent">Accent</Badge>
        <Badge tone="label">Label</Badge>
        <Badge tone="warning">Warning</Badge>
        <Badge tone="danger">Danger</Badge>
      </Stack>
      <Separator />
      <p>
        Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search the woods.
      </p>
    </Stack>
  );
}

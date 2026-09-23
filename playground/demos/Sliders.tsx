import { Slider, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Slider',
  description: 'One thumb or two; pass an array for a range.',
  order: 3,
};

export default function Sliders() {
  return (
    <Stack gap={4}>
      <Slider label="Fire" defaultValue={40} />
      <Slider label="Hours walked" defaultValue={[2, 6]} min={0} max={12} />
      <Slider label="Pace" defaultValue={3} min={1} max={5} step={1} disabled />
    </Stack>
  );
}

import { useState } from 'react';
import {
  Button,
  Icon,
  Image,
  type ImageReveal,
  Stack,
  Toggle,
  ToggleGroup,
} from 'tk-design-system';
import { useSlowPaintings } from '../pictures';

export const meta = {
  section: 'surfaces',
  title: 'Image',
  description:
    'A picture holds its place while it loads, then arrives over it: rising in on the fade clock, or developing through the theme’s own dither.',
  order: 8,
  wide: true,
};

const landscapes = [0, 1, 2, 3, 4, 5];
// As a slow server answers: one after another, out of order.
const latencies = [900, 500, 1400, 700, 1900, 1100];

export default function Images() {
  const [reveal, setReveal] = useState<ImageReveal>('dither');
  const [round, setRound] = useState(0);
  const paintings = useSlowPaintings(landscapes, round, (i) => latencies[i] ?? 0);
  return (
    <Stack gap={4}>
      <Stack direction="row" gap={3} wrap align="center">
        <ToggleGroup
          size="sm"
          value={[reveal]}
          onValueChange={(value) => value[0] && setReveal(value[0] as ImageReveal)}
        >
          <Toggle value="dither">Dither</Toggle>
          <Toggle value="fade">Fade</Toggle>
          <Toggle value="none">None</Toggle>
        </ToggleGroup>
        <Button size="sm" variant="ghost" onClick={() => setRound((n) => n + 1)}>
          <Icon name="refresh" /> Load again
        </Button>
      </Stack>
      <div
        style={{
          display: 'grid',
          gap: 'var(--tk-space-3)',
          gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
        }}
      >
        {paintings.map(({ src, alt }) => (
          // A new round starts each one afresh, as a new page would.
          <Image key={`${round}-${alt}`} src={src} alt={alt} ratio="3 / 2" reveal={reveal} />
        ))}
      </div>
    </Stack>
  );
}

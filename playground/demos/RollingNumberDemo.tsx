import { useState } from 'react';
import { Button, Eyebrow, RollingNumber, Stack } from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Rolling number',
  description:
    'A number that rolls through the values on its way, up or down, lit green or red as it lands. A longer way takes longer.',
  order: 5,
};

export default function RollingNumberDemo() {
  const [lamp, setLamp] = useState(12);
  return (
    <Stack gap={4} align="start">
      <Stack gap={1}>
        <Eyebrow>Lamp oil</Eyebrow>
        <span className="demo-rolling">
          <RollingNumber value={lamp} />
        </span>
      </Stack>
      <Stack direction="row" gap={2} wrap>
        <Button size="sm" onClick={() => setLamp(lamp - 1)}>
          −1
        </Button>
        <Button size="sm" onClick={() => setLamp(lamp + 1)}>
          +1
        </Button>
        <Button size="sm" onClick={() => setLamp(lamp + 10)}>
          +10
        </Button>
        <Button size="sm" onClick={() => setLamp(lamp - 100)}>
          −100
        </Button>
      </Stack>
    </Stack>
  );
}

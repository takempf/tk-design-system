import { useState } from 'react';
import { Button, Eyebrow, RollingNumber, Stack } from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Rolling number',
  description:
    'An odometer: only the digits that change roll, through the digits on their way, lit green or red as they land. +10 moves only the tens; a carry turns over each place it reaches.',
  order: 5,
};

const steps = [-1, 1, 9, 10, 100, -100];

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
        {steps.map((step) => (
          <Button key={step} size="sm" onClick={() => setLamp(lamp + step)}>
            {step > 0 ? `+${step}` : `−${-step}`}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}

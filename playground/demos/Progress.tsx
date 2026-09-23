import { useEffect, useState } from 'react';
import { Meter, Progress, Stack } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Progress & meter',
  description: 'Progress is a task finishing; a meter is a measurement. Null is indeterminate.',
  order: 6,
};

export default function ProgressDemo() {
  const [done, setDone] = useState(12);
  useEffect(() => {
    const id = setInterval(() => setDone((value) => (value >= 100 ? 0 : value + 4)), 700);
    return () => clearInterval(id);
  }, []);
  return (
    <Stack gap={5}>
      <Progress label="Drying firewood" value={done} />
      <Progress label="Waiting for dawn" value={null} showValue={false} />
      <Meter label="Lantern oil" value={64} />
    </Stack>
  );
}

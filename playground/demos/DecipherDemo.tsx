import { useState } from 'react';
import { Button, Decipher, Stack } from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Decipher',
  description: 'Text that resolves through the theme’s glyphs: shapes in Grove, digits in Bureau.',
  order: 2,
};

const lines = [
  'Here the path divides.',
  'Follow the water downhill.',
  'The old ones kept a light here.',
  'Rest, and listen.',
];

export default function DecipherDemo() {
  const [index, setIndex] = useState(0);
  return (
    <Stack gap={4} align="start">
      <Decipher as="p" className="demo-decipher">
        {lines[index]!}
      </Decipher>
      <Button onClick={() => setIndex((index + 1) % lines.length)}>Next inscription</Button>
    </Stack>
  );
}

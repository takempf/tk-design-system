import { useState } from 'react';
import { Field, Select } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Select',
  description: 'It opens over itself, the chosen row on the value; pick another and it flies home.',
  order: 4,
};

const campsites = [
  { value: 'hollow', label: 'Fern hollow' },
  { value: 'ridge', label: 'Windy ridge' },
  { value: 'birches', label: 'Under the birches' },
  { value: 'mill', label: 'By the old mill' },
  { value: 'pool', label: 'Still pool' },
];

export default function SelectDemo() {
  const [site, setSite] = useState<string | null>('birches');
  return (
    <Field.Root>
      <Field.Label>Campsite</Field.Label>
      <Select items={campsites} value={site} onValueChange={setSite} />
    </Field.Root>
  );
}

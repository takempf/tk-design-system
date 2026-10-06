import { useState } from 'react';
import { Combobox, type ComboboxGroup, Field, type Option } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox, several',
  description:
    'With multiple, options are checked off and the list stays open; the trigger lists them. Options sit under headings, and the cross clears the lot.',
  order: 5.1,
};

const option = (label: string) => ({ value: label.toLowerCase(), label });

const kit: ComboboxGroup<Option<string>>[] = [
  {
    id: 'shelter',
    label: 'Shelter',
    items: ['Tent', 'Tarp', 'Hammock', 'Bivvy bag', 'Sleeping mat'].map(option),
  },
  {
    id: 'cooking',
    label: 'Cooking',
    items: ['Stove', 'Billycan', 'Flint', 'Enamel mug', 'Wooden spoon'].map(option),
  },
  { id: 'light', label: 'Light', items: ['Lantern', 'Head torch', 'Candles'].map(option) },
];

export default function ComboboxSeveral() {
  const [packed, setPacked] = useState(['tent', 'lantern']);
  return (
    <Field.Root>
      <Field.Label>Pack</Field.Label>
      <Combobox
        multiple
        groups={kit}
        value={packed}
        onValueChange={setPacked}
        placeholder="Pack something…"
        clearable
      />
      <Field.Description>
        {packed.length === 0 ? 'Nothing packed yet.' : `${packed.length} packed.`}
      </Field.Description>
    </Field.Root>
  );
}

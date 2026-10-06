import { useState } from 'react';
import { Combobox, type ComboboxGroup, Field, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox field',
  description:
    'variant="input" types straight into the field. Click it or the chevron to see everything; the chosen label fills the field, and the cross clears it. Plain strings need no setup.',
  order: 5.2,
};

const birds = [
  'Blackbird',
  'Blue tit',
  'Bullfinch',
  'Chaffinch',
  'Chiffchaff',
  'Goldcrest',
  'Goldfinch',
  'Jay',
  'Nuthatch',
  'Robin',
  'Song thrush',
  'Tawny owl',
  'Treecreeper',
  'Wren',
];

interface Find {
  readonly id: string;
  readonly label: string;
  readonly poisonous?: boolean;
}

const forage: ComboboxGroup<Find>[] = [
  {
    id: 'berries',
    label: 'Berries',
    items: [
      { id: 'bramble', label: 'Blackberry' },
      { id: 'bilberry', label: 'Bilberry' },
      { id: 'elderberry', label: 'Elderberry' },
      { id: 'rosehip', label: 'Rosehip' },
    ],
  },
  {
    id: 'nuts',
    label: 'Nuts',
    items: [
      { id: 'hazelnut', label: 'Hazelnut' },
      { id: 'sweet-chestnut', label: 'Sweet chestnut' },
      { id: 'beechnut', label: 'Beechnut' },
    ],
  },
  {
    id: 'mushrooms',
    label: 'Mushrooms',
    items: [
      { id: 'chanterelle', label: 'Chanterelle' },
      { id: 'cep', label: 'Cep' },
      { id: 'death-cap', label: 'Death cap', poisonous: true },
      { id: 'puffball', label: 'Giant puffball' },
    ],
  },
];

export default function ComboboxField() {
  const [bird, setBird] = useState<string | null>(null);
  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Bird heard</Field.Label>
        <Combobox
          variant="input"
          multiple={false}
          items={birds}
          value={bird}
          onValueChange={setBird}
          minQueryLength={0}
          placeholder="e.g. Wren"
          clearable
          browsable
        />
        <Field.Description>{bird ? `Logged: ${bird}.` : 'Nothing logged yet.'}</Field.Description>
      </Field.Root>
      <Field.Root>
        <Field.Label>Forage</Field.Label>
        <Combobox
          variant="input"
          multiple={false}
          groups={forage}
          itemToStringValue={(find) => find.id}
          isItemDisabled={(find) => find.poisonous === true}
          minQueryLength={0}
          placeholder="e.g. Hazelnut"
          clearable
          browsable
        />
        <Field.Description>Grouped. The death cap can be found but not picked.</Field.Description>
      </Field.Root>
    </Stack>
  );
}

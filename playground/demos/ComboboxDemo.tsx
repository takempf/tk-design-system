import { useState } from 'react';
import { Combobox, Field, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox',
  description:
    'A searchable select that opens over itself. The placeholder travels into the search field; a chosen value travels to its row.',
  order: 5,
};

const trees = [
  'Alder',
  'Ash',
  'Aspen',
  'Beech',
  'Silver birch',
  'Blackthorn',
  'Cedar',
  'Elder',
  'Elm',
  'Hawthorn',
  'Hazel',
  'Holly',
  'Hornbeam',
  'Juniper',
  'Larch',
  'Lime',
  'Maple',
  'Oak',
  'Rowan',
  'Scots pine',
  'Spruce',
  'Sycamore',
  'Willow',
  'Yew',
].map((label) => ({ value: label.toLowerCase(), label }));

export default function ComboboxDemo() {
  const [chosen, setChosen] = useState<(typeof trees)[number][]>([]);
  const [query, setQuery] = useState('');
  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Tree</Field.Label>
        <Combobox items={trees} placeholder="Choose a tree…" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Favourite (already chosen)</Field.Label>
        <Combobox items={trees} defaultValue="rowan" placeholder="Choose a tree…" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Trees (type to add several)</Field.Label>
        <Combobox
          variant="input"
          groups={[{ id: 'trees', label: 'Trees', items: trees }]}
          value={chosen}
          inputValue={query}
          onInputValueChange={setQuery}
          onValueChange={setChosen}
          itemToStringLabel={(item) => item.label}
          itemToStringValue={(item) => item.value}
          isItemEqualToValue={(a, b) => a.value === b.value}
          filter={(item, query) =>
            !chosen.some((selected) => selected.value === item.value) &&
            item.label.toLowerCase().includes(query.toLowerCase())
          }
          aria-label="Find trees"
          placeholder="Type a tree name…"
          selectedPlaceholder="Add another tree…"
        />
      </Field.Root>
    </Stack>
  );
}

import { Combobox, Field, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox',
  description:
    'A searchable select that opens over itself: the trigger becomes the search field, its clear button and chevron where they were. A chosen value travels to its row. It can be cleared, and some options can be disabled.',
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
].map((label) => ({ value: label.toLowerCase(), label, disabled: label === 'Elm' }));

export default function ComboboxDemo() {
  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Tree</Field.Label>
        <Combobox items={trees} placeholder="Choose a tree…" />
        <Field.Description>Elm is disabled: there are none left.</Field.Description>
      </Field.Root>
      <Field.Root>
        <Field.Label>Favourite</Field.Label>
        <Combobox items={trees} defaultValue="rowan" placeholder="Choose a tree…" clearable />
        <Field.Description>Already chosen, with a button to clear it.</Field.Description>
      </Field.Root>
    </Stack>
  );
}

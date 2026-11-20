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

const landmarks = [
  { value: 'river', label: 'River', glyph: '🏞️' },
  { value: 'mountain', label: 'Mountain', glyph: '⛰️' },
  { value: 'cabin', label: 'Cabin', glyph: '🛖' },
  { value: 'campfire', label: 'Campfire', glyph: '🔥' },
  { value: 'tent', label: 'Tent', glyph: '⛺' },
  { value: 'lake', label: 'Lake', glyph: '🌊' },
];
const glyphOf = (value: string) => landmarks.find((landmark) => landmark.value === value)?.glyph;

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
      {/* Stealth, with renderValue and renderItem: closed, only the glyph; open,
          a search over glyph and name. */}
      <p>
        Planted by the{' '}
        <Combobox
          variant="stealth"
          size="sm"
          items={landmarks}
          defaultValue="river"
          placeholder="Landmark"
          aria-label="Landmark"
          renderValue={(item) => (
            <>
              <span aria-hidden="true">{glyphOf(item.value)}</span>
              <span className="tk-visually-hidden">{item.label}</span>
            </>
          )}
          renderItem={(item) => (
            <>
              <span aria-hidden="true">{glyphOf(item.value)}</span> {item.label}
            </>
          )}
        />
      </p>
    </Stack>
  );
}

import { useState } from 'react';
import { Field, Select, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Select',
  description:
    'It opens over itself, the chosen row on the value and its check on the chevron; pick another and its label and check fly home.',
  order: 4,
};

const campsites = [
  { value: 'hollow', label: 'Fern hollow' },
  { value: 'ridge', label: 'Windy ridge' },
  { value: 'birches', label: 'Under the birches' },
  { value: 'mill', label: 'By the old mill' },
  { value: 'pool', label: 'Still pool' },
];

const skies = [
  { value: 'clear', label: 'Clear', glyph: '☀️' },
  { value: 'cloud', label: 'Cloudy', glyph: '⛅' },
  { value: 'rain', label: 'Rain', glyph: '🌧️' },
  { value: 'snow', label: 'Snow', glyph: '❄️' },
];
const glyphOf = (value: string) => skies.find((sky) => sky.value === value)?.glyph;

const watches = [
  { value: 'first', label: 'First watch' },
  { value: 'middle', label: 'Middle watch' },
  { value: 'morning', label: 'Morning watch' },
];

export default function SelectDemo() {
  const [site, setSite] = useState<string | null>('birches');
  const [watch, setWatch] = useState<string | null>('middle');
  const [sky, setSky] = useState<string | null>('clear');
  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Campsite</Field.Label>
        <Select items={campsites} value={site} onValueChange={setSite} />
      </Field.Root>
      {/* Stealth: just the value and a down chevron, until it's opened. */}
      <p>
        Keeping the{' '}
        <Select
          items={watches}
          value={watch}
          onValueChange={setWatch}
          variant="stealth"
          aria-label="Watch"
        />{' '}
        by the fire.
      </p>
      {/* renderValue and renderItem: closed, only the glyph; open, glyph and name. */}
      <p>
        Tomorrow looks{' '}
        <Select
          items={skies}
          value={sky}
          onValueChange={setSky}
          variant="stealth"
          aria-label="Sky"
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

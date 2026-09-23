import { useState } from 'react';
import {
  Button,
  Decipher,
  Eyebrow,
  Field,
  Icon,
  Input,
  morph,
  Panel,
  Reveal,
  SceneryWindow,
  Select,
  Textarea,
  Theme,
  Toggle,
  ToggleGroup,
  toasts,
} from 'tk-design-system';

interface Entry {
  id: number;
  title: string;
  place: string;
  body: string;
}

const places = [
  { value: 'hollow', label: 'Fern hollow' },
  { value: 'ridge', label: 'Windy ridge' },
  { value: 'stones', label: 'The stone circle' },
];

const seed: Entry[] = [
  { id: 1, title: 'First frost', place: 'hollow', body: 'The bracken went copper overnight.' },
  {
    id: 2,
    title: 'Owl, again',
    place: 'ridge',
    body: 'Two calls, then the answer from the valley.',
  },
  {
    id: 3,
    title: 'Embers till midnight',
    place: 'stones',
    body: 'We let the fire burn down slowly.',
  },
];

/** Grove: a wayfarer's journal. Scenery windows, quiet marks, a slow and misty entrance. */
export function Journal() {
  const [entries, setEntries] = useState(seed);
  const [selected, setSelected] = useState(1);
  const [mood, setMood] = useState(['calm']);
  const entry = entries.find((each) => each.id === selected) ?? entries[0]!;

  const add = () =>
    morph(
      () => {
        const id = Math.max(...entries.map((each) => each.id)) + 1;
        setEntries([{ id, title: 'Untitled walk', place: 'hollow', body: '' }, ...entries]);
        setSelected(id);
      },
      { scope: 'journal' },
    );

  const update = (patch: Partial<Entry>) =>
    setEntries(entries.map((each) => (each.id === entry.id ? { ...each, ...patch } : each)));

  return (
    <Theme name="grove" className="app app-journal">
      <aside className="app-journal-list">
        <Panel className="app-journal-banner">
          <SceneryWindow scene="grove" />
          <Icon name="y-in-triangle" className="app-journal-mark" />
          <span>Wayfarer</span>
        </Panel>
        <Button variant="primary" onClick={add}>
          <Icon name="plus" /> New entry
        </Button>
        <nav>
          {entries.map((each) => (
            <Reveal key={each.id} scope="journal">
              <button
                type="button"
                className="app-journal-item"
                aria-current={each.id === entry.id || undefined}
                onClick={() => setSelected(each.id)}
              >
                <span>{each.title}</span>
                <small>{places.find((place) => place.value === each.place)?.label}</small>
              </button>
            </Reveal>
          ))}
        </nav>
      </aside>
      <main className="app-journal-page">
        <Eyebrow>
          <Decipher>{`Entry ${String(entry.id).padStart(3, '0')}`}</Decipher>
        </Eyebrow>
        <Field.Root>
          <Field.Label>Title</Field.Label>
          <Input
            size="lg"
            value={entry.title}
            onChange={(event) => update({ title: event.target.value })}
          />
        </Field.Root>
        <div className="app-journal-meta">
          <Field.Root>
            <Field.Label>Where</Field.Label>
            <Select
              items={places}
              value={entry.place}
              onValueChange={(place) => place && update({ place })}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Mood</Field.Label>
            <ToggleGroup value={mood} onValueChange={(value) => value.length && setMood(value)}>
              <Toggle value="calm">Calm</Toggle>
              <Toggle value="wild">Wild</Toggle>
              <Toggle value="tired">Tired</Toggle>
            </ToggleGroup>
          </Field.Root>
        </div>
        <Field.Root>
          <Field.Label>Notes</Field.Label>
          <Textarea
            rows={6}
            value={entry.body}
            placeholder="What did the woods say today?"
            onChange={(event) => update({ body: event.target.value })}
          />
        </Field.Root>
        <div className="app-actions">
          <Button variant="ghost">Discard</Button>
          <Button variant="primary" onClick={() => toasts.add({ title: 'Saved to the journal' })}>
            Save entry
          </Button>
        </div>
      </main>
    </Theme>
  );
}

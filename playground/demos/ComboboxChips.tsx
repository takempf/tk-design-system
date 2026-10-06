import { useState } from 'react';
import { Combobox, Field, Kbd, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox chips',
  description:
    'Several values as removable chips. Chosen rows keep their tick, and picking one again removes it. Backspace removes the last chip; Left arrow walks into them.',
  order: 5.3,
};

interface Tree {
  readonly value: string;
  readonly label: string;
}

const trees: Tree[] = [
  'Alder',
  'Ash',
  'Aspen',
  'Beech',
  'Silver birch',
  'Blackthorn',
  'Cedar',
  'Elder',
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

export default function ComboboxChips() {
  const [planted, setPlanted] = useState<Tree[]>([trees[16]!, trees[17]!]);
  const [hedge, setHedge] = useState<Tree[]>([]);
  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Planted</Field.Label>
        <Combobox
          variant="input"
          items={trees}
          value={planted}
          onValueChange={setPlanted}
          chipsLabel="Planted trees"
          placeholder="Type a tree name…"
          selectedPlaceholder="Plant another…"
          clearable
          browsable
        />
        <Field.Description>
          The chevron (or <Kbd>↓</Kbd>) lists every tree; the cross clears every chip.
        </Field.Description>
      </Field.Root>
      <Field.Root>
        <Field.Label>Hedge</Field.Label>
        <Combobox
          variant="input"
          items={trees}
          value={hedge}
          onValueChange={setHedge}
          filter={(tree, query) =>
            !hedge.includes(tree) && tree.label.toLowerCase().includes(query.trim().toLowerCase())
          }
          chipsLabel="Hedge trees"
          placeholder="Type to add…"
          selectedPlaceholder="Add another…"
        />
        <Field.Description>
          Suggestions only once something is typed, leaving out what is already in.
        </Field.Description>
      </Field.Root>
    </Stack>
  );
}

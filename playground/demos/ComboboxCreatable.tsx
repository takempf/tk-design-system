import { type FormEvent, useState } from 'react';
import {
  Button,
  Combobox,
  Dialog,
  Field,
  Fieldset,
  Icon,
  type IconName,
  Input,
  Radio,
  RadioGroup,
  Stack,
} from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox, creatable',
  description:
    'onCreate offers a row for anything that isn’t there yet. The first field opens a dialog to finish the new label; the second adds it at once. Both share one set of labels.',
  order: 5.5,
};

interface Label {
  readonly id: string;
  readonly name: string;
  readonly mark: IconName;
}

const marks: IconName[] = ['dot', 'circle', 'square', 'triangle', 'diamond'];

const initial: Label[] = [
  { id: 'fallen-tree', name: 'Fallen tree', mark: 'triangle' },
  { id: 'flooded', name: 'Flooded', mark: 'diamond' },
  { id: 'nesting', name: 'Nesting birds', mark: 'circle' },
  { id: 'signpost', name: 'Signpost missing', mark: 'square' },
];

const renderLabel = (label: Label) => (
  <Stack direction="row" gap={2} align="center">
    <Icon name={label.mark} />
    {label.name}
  </Stack>
);

export default function ComboboxCreatable() {
  const [labels, setLabels] = useState(initial);
  const [report, setReport] = useState<Label[]>([initial[0]!]);
  const [notes, setNotes] = useState<Label[]>([]);
  const [draft, setDraft] = useState('');
  const [creating, setCreating] = useState(false);

  const add = (name: string, mark: IconName) => {
    const base = name.toLowerCase().replace(/\s+/g, '-');
    let id = base;
    for (let n = 2; labels.some((label) => label.id === id); n++) id = `${base}-${n}`;
    const label = { id, name, mark };
    setLabels((all) => [...all, label]);
    return label;
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = add(String(form.get('name')).trim(), form.get('mark') as IconName);
    setReport((chosen) => [...chosen, label]);
    setCreating(false);
  };

  const common = {
    variant: 'input',
    items: labels,
    itemToStringLabel: (label: Label) => label.name,
    itemToStringValue: (label: Label) => label.id,
    renderItem: renderLabel,
    renderChip: renderLabel,
    placeholder: 'Find or create a label…',
    selectedPlaceholder: 'Add a label…',
  } as const;

  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Trail report</Field.Label>
        <Combobox
          {...common}
          value={report}
          onValueChange={setReport}
          onCreate={(name) => {
            setDraft(name);
            setCreating(true);
          }}
          chipsLabel="Report labels"
          browsable
        />
        <Field.Description>Try “Muddy”: a dialog asks for its mark.</Field.Description>
      </Field.Root>
      <Field.Root>
        <Field.Label>Field notes</Field.Label>
        <Combobox
          {...common}
          value={notes}
          onValueChange={setNotes}
          onCreate={(name) => {
            const label = add(name, 'dot');
            setNotes((chosen) => [...chosen, label]);
          }}
          createLabel={(name) => `Add “${name}”`}
          chipsLabel="Note labels"
        />
        <Field.Description>New labels are added straight away.</Field.Description>
      </Field.Root>

      <Dialog.Root open={creating} onOpenChange={setCreating}>
        <Dialog.Popup>
          <Dialog.Title>New label</Dialog.Title>
          <form onSubmit={save}>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input name="name" defaultValue={draft} required autoFocus />
              </Field.Root>
              <Fieldset.Root render={<RadioGroup name="mark" defaultValue="dot" />}>
                <Fieldset.Legend>Mark</Fieldset.Legend>
                <Stack direction="row" gap={4} wrap>
                  {marks.map((mark) => (
                    <Radio key={mark} value={mark} aria-label={mark}>
                      <Icon name={mark} />
                    </Radio>
                  ))}
                </Stack>
              </Fieldset.Root>
              <Stack direction="row" gap={2} justify="end">
                <Dialog.Close render={<Button variant="ghost" />}>Cancel</Dialog.Close>
                <Button type="submit" variant="primary">
                  Create label
                </Button>
              </Stack>
            </Stack>
          </form>
        </Dialog.Popup>
      </Dialog.Root>
    </Stack>
  );
}

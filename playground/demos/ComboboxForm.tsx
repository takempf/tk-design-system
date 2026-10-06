import { Form } from '@base-ui/react/form';
import { Button, Combobox, Field, Stack, toasts } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox in a form',
  description:
    'With name and required it is a form field: the form gets its value, and in a Base UI Form an empty required one stops the submit and shows its error. Three sizes, read-only and disabled.',
  order: 5.7,
};

const pitches = [
  'Fern hollow',
  'Windy ridge',
  'Under the birches',
  'By the old mill',
  'Still pool',
].map((label) => ({ value: label.toLowerCase().replaceAll(' ', '-'), label }));

const companions = ['Ada', 'Bram', 'Cass', 'Dev', 'Edie', 'Finn'];

export default function ComboboxForm() {
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        toasts.add({
          title: 'Booked',
          description: [...form.entries()].map(([key, value]) => `${key}: ${value}`).join(' · '),
          type: 'success',
        });
      }}
    >
      <Stack gap={5}>
        <Field.Root>
          <Field.Label>Pitch</Field.Label>
          <Combobox items={pitches} name="pitch" required placeholder="Choose a pitch…" />
          <Field.Error match="valueMissing">Choose somewhere to sleep.</Field.Error>
        </Field.Root>
        <Field.Root>
          <Field.Label>Companions</Field.Label>
          <Combobox
            variant="input"
            items={companions}
            name="companions"
            minQueryLength={0}
            placeholder="Who’s coming?"
            chipsLabel="Companions"
            browsable
          />
        </Field.Root>
        <Stack gap={2}>
          <Combobox size="sm" items={pitches} aria-label="Small" placeholder="Small" />
          <Combobox items={pitches} aria-label="Medium" placeholder="Medium" />
          <Combobox size="lg" items={pitches} aria-label="Large" placeholder="Large" />
        </Stack>
        <Field.Root>
          <Field.Label>Ranger on duty</Field.Label>
          <Combobox
            variant="input"
            items={companions}
            defaultValue={['Ada', 'Finn']}
            chipsLabel="Rangers on duty"
            readOnly
          />
          <Field.Description>Read-only: the chips stay put.</Field.Description>
        </Field.Root>
        <Field.Root>
          <Field.Label>Ferry</Field.Label>
          <Combobox items={pitches} placeholder="Not running today" disabled />
        </Field.Root>
        <Stack direction="row" justify="end">
          <Button type="submit" variant="primary">
            Book
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}

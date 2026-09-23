import { Field, Input, Stack, Textarea } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Field',
  description: 'Label, control, description and validation, wired together.',
  order: 1,
};

export default function Fields() {
  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Name for the trail</Field.Label>
        <Input placeholder="The long way round" />
        <Field.Description>Shown on the map legend.</Field.Description>
      </Field.Root>
      <Field.Root validationMode="onChange">
        <Field.Label>Waypoint code</Field.Label>
        <Input required pattern="[A-Z]{3}-[0-9]{2}" placeholder="ASH-07" />
        <Field.Error match="patternMismatch">Three capitals, a dash, two digits.</Field.Error>
        <Field.Error match="valueMissing">Every waypoint needs a code.</Field.Error>
      </Field.Root>
      <Field.Root>
        <Field.Label>Field notes</Field.Label>
        <Textarea placeholder="Heard an owl near the second bridge…" />
      </Field.Root>
    </Stack>
  );
}

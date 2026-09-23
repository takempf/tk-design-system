import { AlertDialog, Button, Dialog, Field, Input, Stack } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Dialog & alert dialog',
  description: 'Modal surfaces; the alert version must be answered.',
  order: 2,
};

export default function Dialogs() {
  return (
    <Stack direction="row" gap={3} wrap>
      <Dialog.Root>
        <Dialog.Trigger render={<Button variant="primary" />}>Name the clearing</Dialog.Trigger>
        <Dialog.Popup>
          <Dialog.Title>Name the clearing</Dialog.Title>
          <Dialog.Description>It will appear on every map drawn from now on.</Dialog.Description>
          <Field.Root>
            <Field.Label>Name</Field.Label>
            <Input autoFocus defaultValue="Moonmeadow" />
          </Field.Root>
          <Stack direction="row" gap={2} justify="end">
            <Dialog.Close render={<Button variant="ghost" />}>Cancel</Dialog.Close>
            <Dialog.Close render={<Button variant="primary" />}>Save</Dialog.Close>
          </Stack>
        </Dialog.Popup>
      </Dialog.Root>

      <AlertDialog.Root>
        <AlertDialog.Trigger render={<Button variant="danger" />}>
          Fell the old oak
        </AlertDialog.Trigger>
        <AlertDialog.Popup>
          <AlertDialog.Title>Fell the old oak?</AlertDialog.Title>
          <AlertDialog.Description>
            It has stood for four hundred years. This cannot be undone.
          </AlertDialog.Description>
          <Stack direction="row" gap={2} justify="end">
            <AlertDialog.Close render={<Button variant="ghost" />}>Leave it be</AlertDialog.Close>
            <AlertDialog.Close render={<Button variant="danger" />}>Fell it</AlertDialog.Close>
          </Stack>
        </AlertDialog.Popup>
      </AlertDialog.Root>
    </Stack>
  );
}

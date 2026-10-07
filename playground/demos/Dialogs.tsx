import { AlertDialog, Button, Dialog, Field, Icon, Input, Stack } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Dialog & alert dialog',
  description:
    'Modal surfaces that grow out of their trigger; the alert version must be answered. The search icon flies to its place in the dialog.',
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

      <Dialog.Root>
        <Dialog.Trigger render={<Button />} aria-label="Search the clearing">
          <Dialog.SharedElement name="search" side="trigger">
            <Icon name="search" />
          </Dialog.SharedElement>
          Search
        </Dialog.Trigger>
        <Dialog.Popup aria-label="Search the clearing">
          <Stack direction="row" align="center" gap={3}>
            <Dialog.SharedElement name="search" side="popup">
              <Icon name="search" size="1.5em" />
            </Dialog.SharedElement>
            <Dialog.Content style={{ flex: 1 }}>
              <Input aria-label="Search text" placeholder="Find a clearing…" />
            </Dialog.Content>
          </Stack>
          <Dialog.Content>
            <Dialog.Description>Search by name, or follow the paths on the map.</Dialog.Description>
            <Dialog.Close render={<Button variant="ghost" />}>Close</Dialog.Close>
          </Dialog.Content>
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

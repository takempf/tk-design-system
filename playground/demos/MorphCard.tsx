import { useState } from 'react';
import {
  Button,
  Dialog,
  Eyebrow,
  Morph,
  morph,
  Panel,
  SceneryWindow,
  Stack,
} from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Card into dialog',
  description:
    'A container transform: the card’s window and title become the dialog’s. Scoped, so nothing else on the page is captured.',
  order: 1,
};

export default function MorphCard() {
  const [open, setOpen] = useState(false);
  const toggle = (next: boolean) =>
    morph(() => setOpen(next), { type: next ? 'open' : 'close', scope: 'clearing' });
  return (
    <Dialog.Root open={open} onOpenChange={toggle}>
      <Morph name="clearing-card" active={!open} scope="clearing">
        <Panel className="demo-morph-card">
          <SceneryWindow scene="stones" />
          <Eyebrow>Place</Eyebrow>
          <Morph name="clearing-title" active={!open} scope="clearing">
            <h3>The stone circle</h3>
          </Morph>
          <Dialog.Trigger render={<Button size="sm" />}>Read more</Dialog.Trigger>
        </Panel>
      </Morph>
      <Dialog.Popup size="lg" className="demo-morph-dialog">
        <Morph name="clearing-card" active={open} scope="clearing">
          <Panel className="demo-morph-hero">
            <SceneryWindow scene="stones" />
            <Eyebrow>Place</Eyebrow>
            <Morph name="clearing-title" active={open} scope="clearing">
              <h3>The stone circle</h3>
            </Morph>
          </Panel>
        </Morph>
        <Dialog.Description>
          Nine stones on a low rise, older than the forest around them. On still nights the marks
          cut into their inward faces seem to hold the firelight a little longer than they should.
        </Dialog.Description>
        <Stack direction="row" justify="end">
          <Dialog.Close render={<Button variant="primary" />}>Close</Dialog.Close>
        </Stack>
      </Dialog.Popup>
    </Dialog.Root>
  );
}

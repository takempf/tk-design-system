import { Button, Dialog, Eyebrow, Panel, SceneryWindow, Stack } from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Card into dialog',
  description:
    'A container transform: the card is the dialog’s container, closed. Its frame grows into the dialog’s while the window and title fly to their places in it.',
  order: 1,
};

export default function MorphCard() {
  return (
    <Dialog.Root>
      <Dialog.Origin>
        <Panel className="demo-morph-card">
          <Dialog.SharedElement name="window" side="trigger">
            <SceneryWindow scene="stones" />
          </Dialog.SharedElement>
          {/* Shared parts fly above the container, so the window's neighbours
              travel as parts too, or it would pass over them. */}
          <Dialog.SharedElement name="eyebrow" side="trigger" fit="text">
            <Eyebrow>Place</Eyebrow>
          </Dialog.SharedElement>
          <Dialog.SharedElement name="title" side="trigger" fit="text">
            <h3>The stone circle</h3>
          </Dialog.SharedElement>
          <Dialog.SharedElement name="more" side="trigger">
            <Dialog.Trigger render={<Button size="sm" />}>Read more</Dialog.Trigger>
          </Dialog.SharedElement>
        </Panel>
      </Dialog.Origin>
      <Dialog.Popup size="lg" className="demo-morph-dialog">
        <Panel className="demo-morph-hero">
          <Dialog.SharedElement name="window" side="popup">
            <SceneryWindow scene="stones" />
          </Dialog.SharedElement>
          <Dialog.SharedElement name="eyebrow" side="popup" fit="text">
            <Eyebrow>Place</Eyebrow>
          </Dialog.SharedElement>
          <Dialog.SharedElement name="title" side="popup" fit="text">
            <h3>The stone circle</h3>
          </Dialog.SharedElement>
        </Panel>
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

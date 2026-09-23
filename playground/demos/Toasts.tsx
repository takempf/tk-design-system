import { Button, Stack, toasts } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Toast',
  description: 'Call toasts.add() from anywhere; mount <Toaster> once.',
  order: 7,
};

export default function Toasts() {
  return (
    <Stack direction="row" gap={3} wrap>
      <Button
        onClick={() =>
          toasts.add({ title: 'Kettle on', description: 'Tea in about four minutes.' })
        }
      >
        Notify
      </Button>
      <Button
        onClick={() =>
          toasts.add({ title: 'Camp made', description: 'Tent up, fire lit.', type: 'success' })
        }
      >
        Success
      </Button>
      <Button
        variant="danger"
        onClick={() =>
          toasts.add({ title: 'Rain', description: 'The kindling got wet.', type: 'danger' })
        }
      >
        Danger
      </Button>
    </Stack>
  );
}

import { useState } from 'react';
import { Button, Loading, Panel, Skeleton, Spinner, Stack, toasts } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Loading',
  description:
    'Skeletons hold the shape of what’s coming; a spinner is for what has none. Both come in after a beat.',
  order: 7,
};

export default function LoadingDemo() {
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1600);
  };
  const forage = () => {
    void toasts.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: 'Foraging for mushrooms…',
      success: 'A basket of chanterelles',
      error: 'Nothing but moss',
    });
  };
  return (
    <Stack gap={5}>
      <Loading label="Loading the ledger">
        <Panel variant="outline">
          <Stack direction="row" gap={4} align="start">
            <Skeleton shape="circle" width="2.5rem" />
            <Stack gap={2} style={{ flex: 1 }}>
              <Skeleton width="40%" />
              <Skeleton lines={3} />
            </Stack>
          </Stack>
        </Panel>
      </Loading>
      <Skeleton shape="block" height="6rem" />
      <Stack direction="row" gap={4} wrap align="center">
        <Spinner />
        <Spinner>Reading the tea leaves</Spinner>
        <Button variant="primary" loading={saving} onClick={save}>
          Save the map
        </Button>
        <Button loading={saving} onClick={save}>
          Pack up
        </Button>
        <Button variant="ghost" onClick={forage}>
          Forage
        </Button>
      </Stack>
    </Stack>
  );
}

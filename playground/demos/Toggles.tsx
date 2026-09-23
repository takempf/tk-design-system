import { useState } from 'react';
import { Icon, Stack, Toggle, ToggleGroup } from 'tk-design-system';

export const meta = {
  section: 'actions',
  title: 'Toggle group',
  description: 'A segmented control; pass multiple for independent toggles.',
  order: 2,
};

export default function Toggles() {
  const [season, setSeason] = useState(['autumn']);
  const [marks, setMarks] = useState<string[]>(['moss']);
  return (
    <Stack gap={4}>
      <ToggleGroup value={season} onValueChange={(value) => value.length && setSeason(value)}>
        <Toggle value="spring">Spring</Toggle>
        <Toggle value="summer">Summer</Toggle>
        <Toggle value="autumn">Autumn</Toggle>
        <Toggle value="winter">Winter</Toggle>
      </ToggleGroup>
      <ToggleGroup multiple value={marks} onValueChange={setMarks} size="sm">
        <Toggle value="moss" aria-label="Moss">
          <Icon name="tree" /> Moss
        </Toggle>
        <Toggle value="ember" aria-label="Ember">
          <Icon name="ember" /> Ember
        </Toggle>
        <Toggle value="moon" aria-label="Moon">
          <Icon name="moon" /> Moon
        </Toggle>
      </ToggleGroup>
    </Stack>
  );
}

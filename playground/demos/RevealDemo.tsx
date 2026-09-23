import { useState } from 'react';
import { Button, Icon, morph, Panel, Reveal, Stack } from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Reveal',
  description: 'Content mounted inside morph() rises in; removed content sinks away.',
  order: 3,
};

const finds = ['A jay feather', 'Flint, knapped', 'A green bottle', 'Deer tracks', 'An acorn cup'];

export default function RevealDemo() {
  const [found, setFound] = useState(['A jay feather']);
  const add = () => {
    const next = finds.find((item) => !found.includes(item));
    if (next) morph(() => setFound([...found, next]), { scope: 'finds' });
  };
  const remove = (item: string) =>
    morph(() => setFound(found.filter((x) => x !== item)), { scope: 'finds' });
  return (
    <Stack gap={3}>
      {found.map((item) => (
        <Reveal key={item} scope="finds">
          <Panel variant="sunken" className="demo-find">
            <span>{item}</span>
            <Button
              size="sm"
              variant="ghost"
              square
              aria-label={`Drop ${item}`}
              onClick={() => remove(item)}
            >
              <Icon name="close" />
            </Button>
          </Panel>
        </Reveal>
      ))}
      <Button onClick={add} disabled={found.length === finds.length}>
        <Icon name="plus" /> Pick something up
      </Button>
    </Stack>
  );
}

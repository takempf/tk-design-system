import { useEffect, useState } from 'react';
import { Button, DecipherStream, Panel, Stack, useSmoothText } from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Streamed text',
  description:
    'Text that arrives in bursts, as a model streams it: smoothed into an even pace, each word glitching in once as it lands.',
  order: 4,
};

const reply =
  'The trail forks at the split oak. Left, the water runs fast and loud over the stones; right, the moss is thick and nothing has walked it in a long while. The lantern gutters when you face the moss.';

export default function DecipherStreamDemo() {
  const [arrived, setArrived] = useState('');
  const [streaming, setStreaming] = useState(false);

  // A model's stream: a burst of a few characters, then a pause, until it's all here.
  useEffect(() => {
    if (!streaming) return;
    let at = 0;
    let timer = 0;
    const burst = () => {
      at = Math.min(reply.length, at + 2 + Math.floor(Math.random() * 14));
      setArrived(reply.slice(0, at));
      if (at < reply.length) timer = window.setTimeout(burst, 40 + Math.random() * 220);
      else setStreaming(false);
    };
    burst();
    return () => clearTimeout(timer);
  }, [streaming]);

  const { text, done } = useSmoothText(arrived);
  return (
    <Stack gap={4} align="start">
      <Panel variant="sunken" className="demo-stream">
        <p>
          <DecipherStream active={streaming || !done}>{text}</DecipherStream>
        </p>
      </Panel>
      <Button
        disabled={streaming}
        onClick={() => {
          setArrived('');
          setStreaming(true);
        }}
      >
        Stream a reply
      </Button>
    </Stack>
  );
}

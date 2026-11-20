import { useState } from 'react';
import { Combobox, Field, Icon, Input, InputAction, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Field, with start and end',
  description:
    'start and end put a prefix, a unit or InputAction buttons inside the box, centred on it at any size. A combobox field takes them too, after its icon and before show-all.',
  order: 1.5,
};

const posts = ['North ridge', 'River crossing', 'Old mill', 'Fire tower', 'Heron pool'];

export default function FieldSlots() {
  const [copied, setCopied] = useState(false);
  const [post, setPost] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [finding, setFinding] = useState(false);

  const findNearest = () => {
    setFinding(true);
    // A stand-in for asking the device where it is. Chosen from outside the
    // list, the post is written into the field too.
    setTimeout(() => {
      setPost('Fire tower');
      setQuery('Fire tower');
      setFinding(false);
    }, 900);
  };

  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Trail page</Field.Label>
        <Input start="https://" placeholder="trails.example/ash-loop" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Length</Field.Label>
        <Input inputMode="decimal" placeholder="12.5" end="km" size="sm" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Share link</Field.Label>
        <Input
          readOnly
          value="https://trails.example/ash-loop"
          end={
            <InputAction
              aria-label={copied ? 'Copied' : 'Copy link'}
              onClick={() => setCopied(true)}
            >
              <Icon name={copied ? 'check' : 'copy'} />
            </InputAction>
          }
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Meet at</Field.Label>
        <Combobox
          variant="input"
          multiple={false}
          items={posts}
          value={post}
          onValueChange={setPost}
          inputValue={query}
          onInputValueChange={setQuery}
          placeholder="Search posts…"
          clearable
          end={
            <InputAction aria-label="Nearest post" loading={finding} onClick={findNearest}>
              <Icon name="dot-in-circle" />
            </InputAction>
          }
        />
      </Field.Root>
    </Stack>
  );
}

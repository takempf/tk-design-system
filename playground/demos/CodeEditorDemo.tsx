import { useState } from 'react';
import { CodeEditor, Field, Kbd, Stack, Toggle, ToggleGroup } from 'tk-design-system';

export const meta = {
  section: 'code',
  title: 'Code editor',
  description:
    'A textarea laid over its own highlight: typing, selection, undo and IME stay native. It grows with the code up to maxLines, then scrolls.',
  order: 3,
  wide: true,
};

const starters: Record<string, string> = {
  tsx: `function light(trail: Stone[]) {
  return trail.filter((stone) => stone.glow > 0.4);
}
`,
  css: `.lantern {
  color: var(--tk-accent-2);
}
`,
  json: `{
  "lit": true
}
`,
  python: `def light(trail):
    return [s for s in trail if s.glow > 0.4]
`,
};

export default function CodeEditorDemo() {
  const [language, setLanguage] = useState('tsx');
  const [code, setCode] = useState(starters.tsx!);
  return (
    <Stack gap={3}>
      <ToggleGroup
        size="sm"
        value={[language]}
        onValueChange={(value) => {
          if (!value[0]) return;
          setLanguage(value[0]);
          setCode(starters[value[0]]!);
        }}
        aria-label="Language"
      >
        {Object.keys(starters).map((name) => (
          <Toggle key={name} value={name}>
            {name}
          </Toggle>
        ))}
      </ToggleGroup>
      <Field.Root>
        <Field.Label>Trail script</Field.Label>
        <CodeEditor
          value={code}
          onValueChange={setCode}
          language={language}
          minLines={6}
          maxLines={16}
          placeholder="Write something the woods can run…"
        />
        <Field.Description>
          <Kbd>Tab</Kbd> indents, <Kbd>⇧</Kbd> <Kbd>Tab</Kbd> outdents, <Kbd>Enter</Kbd> keeps the
          indent. Press <Kbd>Esc</Kbd> then <Kbd>Tab</Kbd> to move on.
        </Field.Description>
      </Field.Root>
    </Stack>
  );
}

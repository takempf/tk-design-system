import { Code, CodeBlock, Stack } from 'tk-design-system';

export const meta = {
  section: 'code',
  title: 'Code block',
  description:
    'Read-only code with a file name, line numbers and marked lines. Numbers are never copied; the button copies the source exactly.',
  order: 1,
  wide: true,
};

const lantern = `import { useState } from 'react';
import { Button, Stack } from 'tk-design-system';

/** A lantern that remembers how long it has been lit. */
export function Lantern({ fuel = 3 }: { readonly fuel?: number }) {
  const [lit, setLit] = useState(false);
  const label = lit ? \`Burning · \${fuel}h left\` : 'Unlit';
  return (
    <Stack direction="row" gap={2}>
      <Button variant="primary" onClick={() => setLit(!lit)}>
        {label}
      </Button>
    </Stack>
  );
}`;

export default function CodeBlockDemo() {
  return (
    <Stack gap={4}>
      <CodeBlock
        title="Lantern.tsx"
        language="tsx"
        code={lantern}
        lineNumbers
        highlightLines="6-8"
      />
      <CodeBlock language="bash" code="npm install ../tk-design-system  # build it there first" />
      <p>
        Inline code — <Code>tokenize(code, 'tsx')</Code> — sits in the line on a faint chip.
      </p>
    </Stack>
  );
}

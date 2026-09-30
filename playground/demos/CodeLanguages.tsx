import { useState } from 'react';
import { CodeBlock, Stack, Toggle, ToggleGroup } from 'tk-design-system';

export const meta = {
  section: 'code',
  title: 'Languages',
  description:
    'Built in: JS/TS/JSX, CSS, HTML and XML, JSON, shell, Python and diffs. Add more with registerLanguage().',
  order: 2,
  wide: true,
};

const samples: Record<string, { title: string; code: string }> = {
  css: {
    title: 'lantern.css',
    code: `/* Lanterns glow in the theme's second accent. */
.lantern {
  --glow: var(--tk-accent-2);
  padding: calc(var(--tk-space-2) * 1.5) 0.75rem;
  box-shadow: 0 0 1.5rem color-mix(in oklab, var(--glow) 40%, transparent);

  &:hover:not([data-dim]) {
    translate: 0 -2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lantern { transition: none !important; }
}`,
  },
  json: {
    title: 'trail.json',
    code: `{
  "name": "north ridge",
  "length_km": 12.4,
  "lit": true,
  "camps": ["ford", "cairn", "hollow"],
  "ranger": null
}`,
  },
  python: {
    title: 'fireflies.py',
    code: `from dataclasses import dataclass

@dataclass
class Firefly:
    """A small light with a schedule."""
    phase: float = 0.0

    def glow(self, t: float) -> bool:
        return (t + self.phase) % 1.0 < 0.2  # brief blinks

swarm = [Firefly(phase=i / 12) for i in range(12)]`,
  },
  html: {
    title: 'index.html',
    code: `<!doctype html>
<html lang="en">
  <body data-tk-theme="grove">
    <!-- the page is one lantern -->
    <main id="root" class="lantern">Tom &amp; the moth</main>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>`,
  },
  bash: {
    title: 'setup.sh',
    code: `#!/usr/bin/env bash
set -euo pipefail
export TRAIL="\${HOME}/trails"
if [ ! -d "$TRAIL" ]; then
  mkdir -p "$TRAIL" && echo "made $TRAIL"
fi
npm run build --workspace lantern | tee build.log`,
  },
  diff: {
    title: 'lantern.patch',
    code: `diff --git a/Lantern.tsx b/Lantern.tsx
@@ -4,3 +4,3 @@ export function Lantern() {
-  const [lit, setLit] = useState(true);
+  const [lit, setLit] = useState(false);
   return <Button onClick={() => setLit(!lit)} />;`,
  },
};

export default function CodeLanguages() {
  const [language, setLanguage] = useState('css');
  const sample = samples[language]!;
  return (
    <Stack gap={3}>
      <ToggleGroup
        size="sm"
        value={[language]}
        onValueChange={(value) => value[0] && setLanguage(value[0])}
        aria-label="Language"
      >
        {Object.keys(samples).map((name) => (
          <Toggle key={name} value={name}>
            {name}
          </Toggle>
        ))}
      </ToggleGroup>
      <CodeBlock title={sample.title} language={language} code={sample.code} lineNumbers />
    </Stack>
  );
}

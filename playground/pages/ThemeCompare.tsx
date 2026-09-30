import { useState } from 'react';
import {
  Badge,
  Button,
  CodeBlock,
  Eyebrow,
  Field,
  Icon,
  Panel,
  SceneryWindow,
  Select,
  Slider,
  Switch,
  Theme,
  type ThemeName,
  themes,
} from 'tk-design-system';
import { Code } from '../Specimen';

const sample = `// the lantern stays lit
const lit = trail.filter((stone) => stone.glow > 0.4);
return <Lantern lit={lit.length} />;`;

const lanterns = [
  { value: 'oil', label: 'Oil lantern' },
  { value: 'candle', label: 'Candle' },
  { value: 'glow', label: 'Glow-worms' },
];

// The same few components, once per theme. Each card is a scoped <Theme>:
// tokens are custom properties, so a subtree re-themes like the whole page.
function Sample({ name, title }: { name: ThemeName; title: string }) {
  const [lantern, setLantern] = useState<string | null>('oil');
  return (
    <Theme name={name} className="pg-compare-card">
      <Panel className="pg-compare-window">
        <SceneryWindow />
        <Eyebrow>{name}</Eyebrow>
        <p className="pg-compare-title">{title}</p>
      </Panel>
      <div className="pg-compare-body">
        <Field.Root>
          <Field.Label>Lantern</Field.Label>
          <Select items={lanterns} value={lantern} onValueChange={setLantern} />
        </Field.Root>
        <Slider label="Brightness" defaultValue={60} />
        <Switch defaultChecked>Keep watch</Switch>
        <div className="pg-compare-row">
          <Badge tone="label">Night</Badge>
          <Badge tone="accent">Clear</Badge>
        </div>
        <CodeBlock code={sample} language="tsx" copyable={false} wrap />
        <div className="pg-compare-row">
          <Button variant="primary">Set out</Button>
          <Button variant="ghost" square aria-label="Map">
            <Icon name="dot-in-circle" />
          </Button>
        </div>
      </div>
    </Theme>
  );
}

const custom = `/* Your own theme: a block of tokens. Anything unset falls back to base. */
[data-tk-theme='tide'] {
  --tk-bg: #0b1622;
  --tk-surface: #08111b;
  --tk-surface-raised: #0f1e2e;
  --tk-fg: #efe6d8;
  --tk-primary: #f28c6a;        /* coral */
  --tk-primary-fg: #0b1622;
  --tk-highlight: #1d3a52;
  --tk-accent: #7fc8c3;         /* sea-glass: focus, links */
  --tk-accent-2: #f28c6a;       /* coral: labels, keywords */
  --tk-red: #f47a7d;            /* hues: status and syntax come from these */
  --tk-yellow: #e9ca80;
  --tk-green: #84d2a5;
  --tk-blue: #79bae4;           /* … orange, teal, purple, pink */
  --tk-radius: 999px;           /* pebbles, not stones */
  --tk-radius-lg: 20px;
  --tk-radius-popup: 20px;      /* menus: soft squares, not pills */
  --tk-knob-radius: 50%;
  --tk-ease-morph: cubic-bezier(0.34, 1.4, 0.64, 1);

  --tk-scenery-scene: 'aurora';
  --tk-scenery-ink-0: oklch(0.135 0.018 248);
  --tk-scenery-ink-1: oklch(0.17 0.026 244);
  --tk-scenery-ink-2: oklch(0.21 0.034 238);
  --tk-scenery-ink-3: oklch(0.25 0.042 230);
  --tk-scenery-ink-4: oklch(0.29 0.05 226);
  --tk-scenery-ember: oklch(0.285 0.065 35);
}`;

export function ThemeCompare() {
  return (
    <div className="pg-compare">
      <div className="pg-compare-grid">
        {themes.map((theme) => (
          <Sample key={theme.id} name={theme.id} title={theme.name} />
        ))}
        <Sample name="tide" title="Tide (yours)" />
      </div>
      <h2 className="pg-subhead">Write your own</h2>
      <p className="pg-lede">
        A theme is a block of custom properties on <code>[data-tk-theme]</code>. The fifth card
        above is defined in the playground's own stylesheet, not the library — exactly what an app
        would do. Apply it with <code>{'<Theme name="tide">'}</code>. Themes can also restyle beyond
        tokens: Bureau swaps the page wipe for a scanline.
      </p>
      <Code source={custom} language="css" />
    </div>
  );
}

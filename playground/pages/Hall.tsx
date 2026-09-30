import { Badge, Code, Eyebrow, Panel, SceneryWindow, useTheme } from 'tk-design-system';
import { Code as Snippet } from '../Specimen';
import { playgroundThemes } from '../themes';

const palette = [
  {
    group: 'Surface & ink',
    swatches: [
      ['bg', 'Page'],
      ['surface', 'Surface'],
      ['surface-raised', 'Raised'],
      ['border', 'Border'],
      ['fg', 'Ink'],
      ['fg-muted', 'Muted'],
      ['primary', 'Primary'],
      ['highlight', 'Highlight'],
    ],
  },
  {
    group: 'Accents',
    swatches: [
      ['accent', 'Accent'],
      ['accent-2', 'Accent 2 · labels'],
    ],
  },
  {
    group: 'Status',
    swatches: [
      ['success', 'Success'],
      ['info', 'Info'],
      ['warning', 'Warning'],
      ['danger', 'Danger'],
    ],
  },
  {
    group: 'Standard hues',
    swatches: [
      ['red', 'Red'],
      ['orange', 'Orange'],
      ['yellow', 'Yellow'],
      ['green', 'Green'],
      ['teal', 'Teal'],
      ['blue', 'Blue'],
      ['purple', 'Purple'],
      ['pink', 'Pink'],
    ],
  },
] as const;

const inks = ['ink-0', 'ink-1', 'ink-2', 'ink-3', 'ink-4', 'ember'] as const;

const setup = `// main.tsx
import 'tk-design-system/fonts.css';   // optional: the faces the themes name
import 'tk-design-system/styles.css';
import { Theme, SceneryBackdrop, Button } from 'tk-design-system';

<Theme scope="document" name="grove">
  <SceneryBackdrop />
  <Button variant="primary">Enter the wood</Button>
</Theme>`;

export function Hall() {
  const { name } = useTheme();
  const info = playgroundThemes.find((theme) => theme.id === name);
  return (
    <div className="pg-hall">
      <Panel className="pg-hero">
        <SceneryWindow />
        <Eyebrow>Active theme</Eyebrow>
        <p className="pg-hero-title">{info?.name ?? name}</p>
        <p className="pg-hero-text">{info?.description}</p>
        <div className="pg-hero-badges">
          <Badge tone="label">React 19</Badge>
          <Badge tone="accent">Base UI</Badge>
          <Badge>WebGL2 scenery</Badge>
          <Badge>View transitions</Badge>
        </div>
      </Panel>

      <div className="pg-hall-grid">
        <Panel variant="outline">
          <Eyebrow>Palette</Eyebrow>
          {palette.map(({ group, swatches }) => (
            <section key={group} className="pg-palette-group">
              <h3>{group}</h3>
              <ul className="pg-swatches">
                {swatches.map(([token, label]) => (
                  <li key={token}>
                    <span className="pg-swatch" style={{ background: `var(--tk-${token})` }} />
                    <span>{label}</span>
                    <code>--tk-{token}</code>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Panel>

        <Panel variant="outline">
          <Eyebrow>Scenery inks</Eyebrow>
          <div className="pg-inks">
            {inks.map((ink) => (
              <span
                key={ink}
                className="pg-ink"
                style={{ background: `var(--tk-scenery-${ink})` }}
                title={`--tk-scenery-${ink}`}
              />
            ))}
          </div>
          <p className="pg-muted">
            Every scene is gradient-mapped onto these five inks by luminance, then ordered-dithered.
            The sixth, ember, marks emissive spots — fireflies, carved marks, neon.
          </p>
          <Eyebrow>Type</Eyebrow>
          <div className="pg-type">
            <p
              style={{
                fontFamily: 'var(--tk-font-display)',
                fontStretch: 'var(--tk-display-stretch)',
                fontSize: 'var(--tk-text-2xl)',
              }}
            >
              Moss on the north side
            </p>
            <p style={{ fontSize: 'var(--tk-text-lg)' }}>
              Quiet paths between tall trunks, lit by a low moon.
            </p>
            <p className="pg-muted">
              Body text is generous — the letterforms have room to be read slowly.
            </p>
            <p>
              Inline, <Code>trail.follow(moonlight)</Code> sits in the line.
            </p>
          </div>
        </Panel>
      </div>

      <Panel variant="outline">
        <Eyebrow>Use it</Eyebrow>
        <Snippet source={setup} />
      </Panel>
    </div>
  );
}

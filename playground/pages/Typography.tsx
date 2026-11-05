import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { cx, Eyebrow, Field, Input, Panel, Toggle, ToggleGroup, useTheme } from 'tk-design-system';
import { Code } from '../Specimen';

interface Role {
  readonly id: string;
  readonly use: string;
  readonly sample: string;
}

const roles: readonly Role[] = [
  { id: 'display', use: 'A page’s opening line', sample: 'Northward' },
  { id: 'h1', use: 'Page titles, and <h1>', sample: 'Moss on the north side' },
  { id: 'h2', use: 'Sections, and <h2>', sample: 'The trail past the split oak' },
  { id: 'h3', use: 'Panels and cards, and <h3>', sample: 'Lantern oil, and where to find it' },
  { id: 'h4', use: 'Small headings, and <h4>', sample: 'Before you set out' },
  {
    id: 'body-lg',
    use: 'Introductions',
    sample: 'Quiet paths between tall trunks, lit by a low moon.',
  },
  {
    id: 'body',
    use: 'Everything else; the document’s own',
    sample: 'The trail forks at the split oak. Left, the water runs fast over the stones.',
  },
  {
    id: 'body-sm',
    use: 'Dense lists and secondary text',
    sample: 'Two days of food, a dry change of clothes, and oil for the lantern.',
  },
  {
    id: 'caption',
    use: 'Figures, timestamps, fine print',
    sample: 'Fig. 3 — The north trail at dusk',
  },
  { id: 'label', use: 'Eyebrows and section labels', sample: 'Field notes' },
  { id: 'code', use: 'Code in running text', sample: 'trail.follow(moonlight, { pace: 0.8 })' },
];

const inks = [
  'muted',
  'subtle',
  'bright',
  'label',
  'accent',
  'success',
  'info',
  'warning',
  'danger',
];

interface Feature {
  readonly className: string;
  readonly name: string;
  readonly faces: string;
  readonly sample: string;
  /** Old-style figures only exist in the serif, so their sample is set in it. */
  readonly serif?: boolean;
}

const features: readonly Feature[] = [
  {
    className: 'tk-nums-tabular',
    name: 'Tabular figures',
    faces: 'Every bundled face',
    sample: '1,111.17\n8,048.90\n4,406.25',
  },
  {
    className: 'tk-nums-oldstyle',
    name: 'Old-style figures',
    faces: 'Geist Serif',
    sample: 'Mapped in 1887; 2,450 walkers since',
    serif: true,
  },
  {
    className: 'tk-fractions',
    name: 'Fractions',
    faces: 'Geist, Geist Mono and Archivo',
    sample: '1/2 a mile, then 3/4 more',
  },
  {
    className: 'tk-small-caps',
    name: 'Small caps',
    faces: 'None, so the browser draws them from capitals',
    sample: 'NASA · UNESCO · 6 PM',
  },
];

const families = [
  { token: '--tk-font-sans', use: 'body and controls' },
  { token: '--tk-font-display', use: 'display and headings' },
  { token: '--tk-font-label', use: 'labels' },
  { token: '--tk-font-mono', use: 'code' },
  { token: '--tk-font-serif', use: 'reading' },
] as const;

interface Axes {
  readonly weight: readonly [number, number];
  readonly width?: readonly [number, number];
}

/** The axes of the faces fonts.css bundles, as their font files declare them. */
const bundledAxes: Record<string, Axes> = {
  'Geist Variable': { weight: [100, 900] },
  'Geist Mono Variable': { weight: [100, 900] },
  'Archivo Variable': { weight: [100, 900], width: [62, 125] },
  'Instrument Sans Variable': { weight: [400, 700], width: [75, 100] },
  'Newsreader Variable': { weight: [200, 800] },
  'Geist Serif': { weight: [400, 400] },
};

const characters =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 &?!@#%()[]“”‘’—…';

interface Spec {
  readonly size: number;
  readonly leading: number | undefined;
  readonly weight: string;
  readonly face: string;
  readonly stretch: string;
  readonly tracking: number;
}

interface Face {
  readonly family: string;
  readonly tokens: readonly (typeof families)[number][];
}

const round = (value: number, digits: number): number => Number(value.toFixed(digits));

const firstFamily = (stack: string): string =>
  (stack.split(',')[0] ?? '').trim().replace(/^['"]|['"]$/g, '');

const faceName = (family: string): string => family.replace(/ Variable$/, '');

function readSpec(element: Element): Spec {
  const style = getComputedStyle(element);
  const size = Number.parseFloat(style.fontSize);
  const leading = Number.parseFloat(style.lineHeight);
  const tracking = Number.parseFloat(style.letterSpacing);
  return {
    size,
    leading: Number.isFinite(leading) ? leading / size : undefined,
    weight: style.fontWeight,
    face: faceName(firstFamily(style.fontFamily)),
    stretch: style.fontStretch,
    tracking: Number.isFinite(tracking) ? tracking / size : 0,
  };
}

function SpecLine({ spec }: { readonly spec: Spec | undefined }) {
  if (!spec) return null;
  const parts = [
    `${round(spec.size, 1)}px / ${spec.leading ? round(spec.leading, 2) : 'normal'}`,
    spec.weight,
    spec.face,
    spec.stretch !== '100%' && `width ${spec.stretch}`,
    spec.tracking !== 0 && `${spec.tracking > 0 ? '+' : ''}${round(spec.tracking, 3)}em`,
  ].filter(Boolean);
  return (
    <p className="tk-type-caption tk-ink-subtle">
      {parts.map((part, index) => (
        <span key={String(part)} className="pg-role-spec">
          {index ? ' · ' : ''}
          {part}
        </span>
      ))}
    </p>
  );
}

function evenlySpaced([min, max]: readonly [number, number], count: number): number[] {
  if (min === max) return [min];
  return Array.from({ length: count }, (_, index) =>
    Math.round(min + ((max - min) * index) / (count - 1)),
  );
}

function FacePanel({ face }: { readonly face: Face }) {
  const axes = bundledAxes[face.family];
  const stack = `var(${face.tokens[0]!.token})`;
  const ranges = axes
    ? [
        axes.weight[0] === axes.weight[1]
          ? `one weight, ${axes.weight[0]}`
          : `weight ${axes.weight[0]}–${axes.weight[1]}`,
        axes.width && `width ${axes.width[0]}–${axes.width[1]}%`,
      ].filter(Boolean)
    : ['not bundled, so its axes are unknown here'];
  return (
    <Panel variant="outline" className="pg-face">
      <header className="pg-face-header">
        <p className="tk-type-h3" style={{ fontFamily: stack, fontStretch: 'normal' }}>
          {faceName(face.family)}
        </p>
        <p className="tk-type-caption tk-ink-subtle">
          {face.tokens.map((family) => (
            <span key={family.token} className="pg-face-token">
              <code>{family.token}</code> {family.use}
            </span>
          ))}
        </p>
        <p className="tk-type-caption tk-ink-muted">{ranges.join(' · ')}</p>
      </header>
      {axes && axes.weight[0] !== axes.weight[1] && (
        <ol className="pg-face-ramp" style={{ fontFamily: stack }} aria-label="Weights">
          {evenlySpaced(axes.weight, Math.min(9, (axes.weight[1] - axes.weight[0]) / 100 + 1)).map(
            (weight) => (
              <li key={weight}>
                <span style={{ fontWeight: weight }}>Ag</span>
                <span className="tk-type-caption tk-ink-subtle">{weight}</span>
              </li>
            ),
          )}
        </ol>
      )}
      {axes?.width && (
        <ol className="pg-face-ramp" style={{ fontFamily: stack }} aria-label="Widths">
          {evenlySpaced(axes.width, 5).map((width) => (
            <li key={width}>
              <span style={{ fontStretch: `${width}%` }}>Ag</span>
              <span className="tk-type-caption tk-ink-subtle">{width}%</span>
            </li>
          ))}
        </ol>
      )}
      <p className="pg-face-characters" style={{ fontFamily: stack }}>
        {characters}
      </p>
    </Panel>
  );
}

const usage = `<p className="tk-type-label tk-ink-label">Field notes</p>
<h2 className="tk-type-h3">A heading set one step down</h2>
<p className="tk-type-caption tk-ink-muted tk-nums-tabular">Updated 4 Nov 2026</p>
<p className="tk-clamp" style={{ '--tk-clamp-lines': 2 } as CSSProperties}>{summary}</p>
<article className="tk-prose tk-serif">{markdown}</article>`;

const themeSnippet = `/* A face changes every role that uses it; a role token changes that role alone. */
[data-tk-theme='tide'] {
  --tk-font-display: var(--tk-font-serif);
  --tk-type-h1-size: var(--tk-text-4xl);
}`;

export function Typography() {
  const { name } = useTheme();
  const page = useRef<HTMLDivElement>(null);
  const [sample, setSample] = useState('');
  const [serif, setSerif] = useState(false);
  const [specs, setSpecs] = useState<Record<string, Spec>>({});
  const [faces, setFaces] = useState<Face[]>([]);

  // The theme sets every value, so they're read again whenever it changes.
  useEffect(() => {
    const element = page.current;
    if (!element) return;
    setSpecs(
      Object.fromEntries(
        [...element.querySelectorAll<HTMLElement>('[data-role]')].map((node) => [
          node.dataset.role!,
          readSpec(node),
        ]),
      ),
    );
    const style = getComputedStyle(element);
    const byFamily = new Map<string, (typeof families)[number][]>();
    for (const family of families) {
      const first = firstFamily(style.getPropertyValue(family.token));
      byFamily.set(first, [...(byFamily.get(first) ?? []), family]);
    }
    setFaces([...byFamily].map(([family, tokens]) => ({ family, tokens })));
  }, [name]);

  return (
    <div className="pg-lab" ref={page}>
      <p className="pg-lede">
        Every piece of text is one of eleven roles, from display down to caption. Each role is six
        tokens (face, size, weight, leading, tracking and width) built on the theme’s faces and
        scale, and a <code>.tk-type-*</code> class that sets them. Headings and body text take their
        roles without a class.
      </p>

      <section aria-label="Roles">
        <Panel variant="outline" className="pg-type-tester">
          <Field.Root>
            <Field.Label>Sample text</Field.Label>
            <Input
              value={sample}
              placeholder="Type to set every role in your own words"
              onChange={(event) => setSample(event.target.value)}
            />
          </Field.Root>
        </Panel>
        {roles.map((role) => (
          <div key={role.id} className="pg-role">
            <div className="pg-role-meta">
              <code>.tk-type-{role.id}</code>
              <p className="tk-type-body-sm tk-ink-muted">{role.use}</p>
              <SpecLine spec={specs[role.id]} />
            </div>
            <p className={`pg-role-sample tk-type-${role.id}`} data-role={role.id}>
              {sample || role.sample}
            </p>
          </div>
        ))}
      </section>

      <Eyebrow>Ink</Eyebrow>
      <ul className="pg-inks-list">
        {inks.map((ink) => (
          <li key={ink} className={`tk-ink-${ink}`}>
            <code>.tk-ink-{ink}</code>
          </li>
        ))}
      </ul>

      <Eyebrow>Numbers and OpenType</Eyebrow>
      <div className="pg-features">
        {features.map((feature) => (
          <Panel key={feature.className} variant="outline" className="pg-feature">
            <header>
              <code>.{feature.className}</code>
              <p className="tk-type-caption tk-ink-subtle">
                {feature.name}. Has them: {feature.faces}.
              </p>
            </header>
            <div className="pg-feature-pair">
              {[false, true].map((on) => (
                <figure key={String(on)}>
                  <p
                    className={cx(
                      'pg-feature-sample',
                      feature.serif && 'tk-serif',
                      on && feature.className,
                    )}
                  >
                    {feature.sample}
                  </p>
                  <figcaption className="tk-type-caption tk-ink-subtle">
                    {on ? 'On' : 'Off'}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <Eyebrow>Truncation</Eyebrow>
      <div className="pg-features">
        <Panel variant="outline" className="pg-feature">
          <header>
            <code>.tk-truncate</code>
            <p className="tk-type-caption tk-ink-subtle">One line, cut with an ellipsis.</p>
          </header>
          <p className="tk-truncate">
            The trail forks at the split oak. Left, the water runs fast and loud over the stones.
          </p>
        </Panel>
        <Panel variant="outline" className="pg-feature">
          <header>
            <code>.tk-clamp</code>
            <p className="tk-type-caption tk-ink-subtle">
              <code>--tk-clamp-lines</code> lines (3 by default), here 2.
            </p>
          </header>
          <p className="tk-clamp" style={{ '--tk-clamp-lines': 2 } as CSSProperties}>
            The trail forks at the split oak. Left, the water runs fast and loud over the stones;
            right, the moss is thick and nothing has walked it in a long while. The lantern gutters
            when you face the moss.
          </p>
        </Panel>
      </div>

      <Eyebrow>Faces</Eyebrow>
      <div className="pg-faces">
        {faces.map((face) => (
          <FacePanel key={face.family} face={face} />
        ))}
      </div>

      <Eyebrow>Prose</Eyebrow>
      <Panel variant="outline" className="pg-prose">
        <ToggleGroup
          value={[serif ? 'serif' : 'sans']}
          onValueChange={(value) => value[0] && setSerif(value[0] === 'serif')}
        >
          <Toggle value="sans">.tk-prose</Toggle>
          <Toggle value="serif">.tk-prose.tk-serif</Toggle>
        </ToggleGroup>
        <article className={cx('tk-prose', serif && 'tk-serif')}>
          <h2>Field notes from the north trail</h2>
          <p>
            The trail forks at the split oak. Take the <strong>left</strong> path when the water is
            low; the stones there are <em>dry by noon</em>. Check the lantern with{' '}
            <code>lantern.oil()</code> before dusk, or press <kbd>L</kbd> to light it. The{' '}
            <a href="#/scenery">scenery</a> changes once you pass the monolith.
          </p>
          <ul>
            <li>Two days of food, packed dry.</li>
            <li>
              Oil for the lantern, and a spare wick.
              <ul>
                <li>The wick burns about 6 hours.</li>
              </ul>
            </li>
            <li>A change of clothes for the river crossing.</li>
          </ul>
          <blockquote>
            <p>“Keep to the stones,” the warden said, “and don’t let the lantern go out.”</p>
          </blockquote>
          <h3>Distances</h3>
          <table>
            <thead>
              <tr>
                <th>Stretch</th>
                <th>Distance</th>
                <th>Climb</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gate to split oak</td>
                <td>4.2 km</td>
                <td>120 m</td>
              </tr>
              <tr>
                <td>Split oak to river</td>
                <td>11.8 km</td>
                <td>45 m</td>
              </tr>
              <tr>
                <td>River to monolith</td>
                <td>7.5 km</td>
                <td>310 m</td>
              </tr>
            </tbody>
          </table>
          <ol>
            <li>Cross where the river is widest; it’s shallowest there.</li>
            <li>Follow the cairns uphill until the trees thin out.</li>
          </ol>
          <pre>
            <code>{'trail.follow(moonlight, {\n  pace: 0.8,\n  rest: "at every cairn",\n});'}</code>
          </pre>
          <hr />
          <p>
            Past the monolith the path is yours to find. Most walkers turn back at the treeline.
          </p>
        </article>
      </Panel>

      <Eyebrow>Use it</Eyebrow>
      <Code source={usage} />
      <Code source={themeSnippet} language="css" />
    </div>
  );
}

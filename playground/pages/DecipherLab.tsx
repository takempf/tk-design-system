import { type CSSProperties, useEffect, useRef, useState } from 'react';
import {
  Button,
  Decipher,
  DecipherStream,
  Eyebrow,
  Field,
  Input,
  Panel,
  readDecipher,
  Slider,
  Toggle,
  ToggleGroup,
  useSmoothText,
  useTheme,
} from 'tk-design-system';
import { Code } from '../Specimen';

interface Settings {
  readonly share: number;
  readonly flicker: number;
  readonly duration: number;
  /** 0–1, shown as a percentage. */
  readonly strength: number;
  readonly ink: string;
  /** The glyphs, or '' for the theme's. */
  readonly glyphs: string;
}

const baseSettings: Settings = {
  share: 0.35,
  flicker: 120,
  duration: 650,
  strength: 0.55,
  ink: 'currentColor',
  glyphs: '',
};

/** The old <Decipher>: every letter, changing fast, at full strength. */
const everyLetter: Partial<Settings> = { share: 1, flicker: 45, strength: 1 };

const inks = [
  { value: 'currentColor', label: 'Text' },
  { value: 'var(--tk-accent)', label: 'Accent' },
  { value: 'var(--tk-accent-2)', label: 'Second' },
];

const inscriptions = [
  'Here the path divides.',
  'Follow the water downhill.',
  'The old ones kept a light here.',
  'Rest, and listen.',
];

const reply =
  'The trail forks at the split oak. Left, the water runs fast and loud over the stones; right, the moss is thick and nothing has walked it in a long while. The lantern gutters when you face the moss.';

const percent = { style: 'percent' } as const;
const milliseconds = { style: 'unit', unit: 'millisecond', unitDisplay: 'narrow' } as const;

/** Glyphs as a CSS string; quotes and backslashes would end it early, so they go. */
const glyphString = (glyphs: string): string => `'${glyphs.replace(/['"\\]/g, '')}'`;

/** A model's stream: bursts of a few characters, with pauses, until it's all here. */
function useStream(text: string) {
  const [arrived, setArrived] = useState('');
  const [streaming, setStreaming] = useState(false);
  useEffect(() => {
    if (!streaming) return;
    let at = 0;
    let timer = 0;
    const burst = () => {
      at = Math.min(text.length, at + 2 + Math.floor(Math.random() * 14));
      setArrived(text.slice(0, at));
      if (at < text.length) timer = window.setTimeout(burst, 40 + Math.random() * 220);
      else setStreaming(false);
    };
    burst();
    return () => clearTimeout(timer);
  }, [streaming, text]);
  const start = () => {
    setArrived('');
    setStreaming(true);
  };
  return { arrived, streaming, start };
}

export function DecipherLab() {
  const { name } = useTheme();
  const lab = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState({ ...baseSettings, themeGlyphs: '' });
  const [overrides, setOverrides] = useState<Partial<Settings>>({});
  const [inscription, setInscription] = useState(0);
  const stream = useStream(reply);
  const { text, done } = useSmoothText(stream.arrived);

  // The theme's own settings, read again whenever the theme changes (after it has).
  useEffect(() => {
    const element = lab.current;
    if (!element) return;
    const settings = readDecipher(element);
    const strength = Number.parseFloat(
      getComputedStyle(element).getPropertyValue('--tk-decipher-strength'),
    );
    setTheme({
      share: settings.share,
      flicker: settings.flicker,
      duration: settings.duration,
      strength: Number.isFinite(strength) ? strength / 100 : baseSettings.strength,
      ink: 'currentColor',
      glyphs: '',
      themeGlyphs: settings.glyphs.join(''),
    });
  }, [name]);

  const current: Settings = { ...theme, ...overrides };
  const set = <Key extends keyof Settings>(key: Key, value: Settings[Key]) =>
    setOverrides((previous) => ({ ...previous, [key]: value }));

  const tokens: [string, string][] = [
    ['--tk-decipher-share', String(current.share)],
    ['--tk-decipher-flicker', `${current.flicker}ms`],
    ['--tk-decipher-duration', `${current.duration}ms`],
    ['--tk-decipher-strength', `${Math.round(current.strength * 100)}%`],
    ['--tk-decipher-ink', current.ink],
    ...(current.glyphs
      ? ([['--tk-decipher-glyphs', glyphString(current.glyphs)]] as [string, string][])
      : []),
  ];
  // Only what was changed goes on the specimens; the rest is the theme's.
  const changed = new Set(Object.keys(overrides).map((key) => `--tk-decipher-${key}`));
  const style = Object.fromEntries(tokens.filter(([token]) => changed.has(token))) as CSSProperties;

  const snippet = `/* On a theme, or on any element whose text deciphers */
.reading {
${tokens.map(([token, value]) => `  ${token}: ${value};`).join('\n')}
}`;

  return (
    <div className="pg-lab-section" ref={lab}>
      <h2 className="pg-subhead">Decipher Effect</h2>
      <p className="pg-lede">
        Text deciphers a word at a time. As each word shows, a share of its letters cycle through
        the theme's glyphs, faint in their ink, and settle one by one. <code>{'<Decipher>'}</code>{' '}
        does it when its text changes; <code>{'<DecipherStream>'}</code> as a model's reply streams
        in, each word once it's whole. With reduced motion, text simply shows.
      </p>

      <div className="pg-lab-grid">
        <div className="pg-decipher-specimens" style={style}>
          <Panel className="pg-decipher-specimen">
            <Eyebrow>When text changes</Eyebrow>
            <Decipher as="p" initial className="pg-decipher-line">
              {inscriptions[inscription]!}
            </Decipher>
            <Button onClick={() => setInscription((inscription + 1) % inscriptions.length)}>
              Next inscription
            </Button>
          </Panel>
          <Panel className="pg-decipher-specimen">
            <Eyebrow>As text streams in</Eyebrow>
            <p className="pg-decipher-stream">
              <DecipherStream active={stream.streaming || !done}>{text}</DecipherStream>
            </p>
            <Button disabled={stream.streaming} onClick={stream.start}>
              Stream a reply
            </Button>
          </Panel>
        </div>

        <Panel variant="outline" className="pg-lab-controls">
          <Slider
            label="Letters that glitch"
            min={0.05}
            max={1}
            step={0.05}
            format={percent}
            value={current.share}
            onValueChange={(value) => set('share', value as number)}
          />
          <Slider
            label="Flicker"
            min={20}
            max={400}
            step={5}
            format={milliseconds}
            value={current.flicker}
            onValueChange={(value) => set('flicker', value as number)}
          />
          <Slider
            label="Settle time"
            min={100}
            max={3000}
            step={50}
            format={milliseconds}
            value={current.duration}
            onValueChange={(value) => set('duration', value as number)}
          />
          <Slider
            label="Glyph strength"
            min={0.1}
            max={1}
            step={0.05}
            format={percent}
            value={current.strength}
            onValueChange={(value) => set('strength', value as number)}
          />
          <Field.Root>
            <Field.Label>Ink</Field.Label>
            <ToggleGroup
              value={[current.ink]}
              onValueChange={(value) => value[0] && set('ink', value[0] as string)}
            >
              {inks.map((ink) => (
                <Toggle key={ink.value} value={ink.value}>
                  {ink.label}
                </Toggle>
              ))}
            </ToggleGroup>
          </Field.Root>
          <Field.Root>
            <Field.Label>Glyphs</Field.Label>
            <Input
              value={current.glyphs}
              placeholder={theme.themeGlyphs}
              onChange={(event) => set('glyphs', event.target.value)}
            />
            <Field.Description>Empty for the theme's own.</Field.Description>
          </Field.Root>
          <div className="pg-lab-actions">
            <Button size="sm" onClick={() => setOverrides({ ...overrides, ...everyLetter })}>
              Every letter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!Object.keys(overrides).length}
              onClick={() => setOverrides({})}
            >
              The theme's own
            </Button>
          </div>
        </Panel>
      </div>
      <p className="pg-muted">
        Every setting is a CSS custom property, so themes set them all: Grove settles slowly, Bureau
        quickly. Changes apply to the next text that deciphers.
      </p>
      <Code source={snippet} language="css" />
    </div>
  );
}

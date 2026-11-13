import { type CSSProperties, type ReactElement, useEffect, useRef, useState } from 'react';
import {
  Accordion,
  Button,
  Checkbox,
  Dialog,
  Eyebrow,
  Field,
  Input,
  Panel,
  Slider,
  Stack,
  Switch,
  Tabs,
  Toggle,
  ToggleGroup,
  useTheme,
} from 'tk-design-system';
import { Code } from '../Specimen';

interface Timings {
  readonly duration1: number;
  readonly duration2: number;
  readonly duration3: number;
  readonly durationMorph: number;
}

const baseTimings: Timings = {
  duration1: 110,
  duration2: 160,
  duration3: 280,
  durationMorph: 320,
};

const milliseconds = { style: 'unit', unit: 'millisecond', unitDisplay: 'narrow' } as const;

function parseMs(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return value.trim().endsWith('s') && !value.trim().endsWith('ms') ? parsed * 1000 : parsed;
}

function readThemeTimings(element: HTMLElement): Timings {
  const style = getComputedStyle(element);
  return {
    duration1: parseMs(style.getPropertyValue('--tk-duration-1'), baseTimings.duration1),
    duration2: parseMs(style.getPropertyValue('--tk-duration-2'), baseTimings.duration2),
    duration3: parseMs(style.getPropertyValue('--tk-duration-3'), baseTimings.duration3),
    durationMorph: parseMs(style.getPropertyValue('--tk-duration-morph'), baseTimings.durationMorph),
  };
}

type TimingKey = keyof Timings;

const tokenNames: Record<TimingKey, string> = {
  duration1: '--tk-duration-1',
  duration2: '--tk-duration-2',
  duration3: '--tk-duration-3',
  durationMorph: '--tk-duration-morph',
};

export function TimingsLab(): ReactElement {
  const { name } = useTheme();
  const lab = useRef<HTMLDivElement>(null);
  const [themeTimings, setThemeTimings] = useState<Timings>(baseTimings);
  const [overrides, setOverrides] = useState<Partial<Timings>>({});
  const [scope, setScope] = useState<'section' | 'global'>('section');
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  useEffect(() => {
    const element = lab.current ?? document.documentElement;
    setThemeTimings(readThemeTimings(element));
  }, [name]);

  const current: Timings = { ...themeTimings, ...overrides };

  const setTiming = (key: TimingKey, value: number): void => {
    setOverrides((previous) => ({ ...previous, [key]: value }));
  };

  const applyMultiplier = (factor: number): void => {
    setOverrides({
      duration1: Math.round(themeTimings.duration1 * factor),
      duration2: Math.round(themeTimings.duration2 * factor),
      duration3: Math.round(themeTimings.duration3 * factor),
      durationMorph: Math.round(themeTimings.durationMorph * factor),
    });
  };

  const resetToTheme = (): void => {
    setOverrides({});
  };

  const tokens: [string, string][] = [
    [tokenNames.duration1, `${current.duration1}ms`],
    [tokenNames.duration2, `${current.duration2}ms`],
    [tokenNames.duration3, `${current.duration3}ms`],
    [tokenNames.durationMorph, `${current.durationMorph}ms`],
  ];

  useEffect(() => {
    const list: [string, string][] = [
      [tokenNames.duration1, `${current.duration1}ms`],
      [tokenNames.duration2, `${current.duration2}ms`],
      [tokenNames.duration3, `${current.duration3}ms`],
      [tokenNames.durationMorph, `${current.durationMorph}ms`],
    ];
    if (scope !== 'global') {
      for (const [prop] of list) {
        document.documentElement.style.removeProperty(prop);
      }
      return;
    }
    for (const [prop, val] of list) {
      document.documentElement.style.setProperty(prop, val);
    }
    return () => {
      for (const [prop] of list) {
        document.documentElement.style.removeProperty(prop);
      }
    };
  }, [scope, current.duration1, current.duration2, current.duration3, current.durationMorph]);

  const changedTokens = new Set(
    (Object.keys(overrides) as TimingKey[]).map((key) => tokenNames[key]),
  );

  const specimenStyle = (
    scope === 'section'
      ? Object.fromEntries(tokens.filter(([token]) => changedTokens.has(token)))
      : {}
  ) as CSSProperties;

  const hasOverrides = Object.keys(overrides).length > 0;

  const snippet = `/* Base animation & transition timing tokens */
:root {
${tokens.map(([token, value]) => `  ${token}: ${value};`).join('\n')}
}`;

  return (
    <div className="pg-lab-section" ref={lab}>
      <h2 className="pg-subhead">Transition &amp; Animation Timings</h2>
      <p className="pg-lede">
        Transitions and view-transition morphs are keyed to four duration tokens.
        Micro-interactions and focus rings complete quickly; switches and fades follow; tabs and
        large reveals take a deliberate beat; containers morph smoothly between their states.
      </p>

      <div className="pg-lab-grid">
        <div className="pg-timing-specimens" style={specimenStyle}>
          <Panel className="pg-timing-specimen">
            <Eyebrow>Micro &amp; Controls (--tk-duration-1 &amp; --tk-duration-2)</Eyebrow>
            <div className="pg-timing-row">
              <Button>Press me</Button>
              <Switch
                checked={switchChecked}
                onCheckedChange={setSwitchChecked}
                aria-label="Toggle demo switch"
              />
              <Checkbox
                checked={checkboxChecked}
                onCheckedChange={setCheckboxChecked}
                aria-label="Demo checkbox"
              />
            </div>
            <Field.Root>
              <Field.Label>Focus ring transition</Field.Label>
              <Input placeholder="Tab or click to watch the focus ring fade in and out" />
            </Field.Root>
          </Panel>

          <Panel className="pg-timing-specimen">
            <Eyebrow>Navigation &amp; Panels (--tk-duration-2 &amp; --tk-duration-3)</Eyebrow>
            <Tabs.Root defaultValue="one">
              <Tabs.List>
                <Tabs.Tab value="one">Flora</Tabs.Tab>
                <Tabs.Tab value="two">Fauna</Tabs.Tab>
                <Tabs.Tab value="three">Weather</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="one">
                Bluebells under the beeches, wood sorrel on the banks.
              </Tabs.Panel>
              <Tabs.Panel value="two">
                A badger sett by the stream; tawny owls calling at dusk.
              </Tabs.Panel>
              <Tabs.Panel value="three">
                Mist until mid-morning, then long low light through the canopy.
              </Tabs.Panel>
            </Tabs.Root>

            <Accordion.Root defaultValue={['details']}>
              <Accordion.Item value="details">
                <Accordion.Trigger>Disclosure panel animation</Accordion.Trigger>
                <Accordion.Panel>
                  The accordion content height and chevron rotation smoothly follow the major
                  transition duration token.
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </Panel>

          <Panel className="pg-timing-specimen">
            <Eyebrow>View-Transition Morph (--tk-duration-morph)</Eyebrow>
            <Stack direction="row" align="center" gap={3}>
              <Dialog.Root>
                <Dialog.Trigger render={<Button variant="primary" />}>
                  <Dialog.SharedElement name="timing-dialog-title" side="trigger" fit="text">
                    <span>Morphing dialog</span>
                  </Dialog.SharedElement>
                </Dialog.Trigger>
                <Dialog.Popup>
                  <Dialog.Title>
                    <Dialog.SharedElement name="timing-dialog-title" side="popup" fit="text">
                      <span>Morphing dialog</span>
                    </Dialog.SharedElement>
                  </Dialog.Title>
                  <Dialog.Description>
                    This container grows smoothly out of its trigger button, morphing its fill,
                    corner radius, and dimensions according to the morph duration token.
                  </Dialog.Description>
                  <Stack direction="row" gap={2} justify="end">
                    <Dialog.Close render={<Button variant="ghost" />}>Close</Dialog.Close>
                  </Stack>
                </Dialog.Popup>
              </Dialog.Root>
            </Stack>
          </Panel>
        </div>

        <Panel variant="outline" className="pg-lab-controls">
          <Slider
            label="Duration 1 · Micro (focus, hover, checks)"
            min={30}
            max={500}
            step={10}
            format={milliseconds}
            value={current.duration1}
            onValueChange={(val) => setTiming('duration1', val as number)}
          />
          <Slider
            label="Duration 2 · Standard (switches, fades, enter)"
            min={50}
            max={800}
            step={10}
            format={milliseconds}
            value={current.duration2}
            onValueChange={(val) => setTiming('duration2', val as number)}
          />
          <Slider
            label="Duration 3 · Major (tabs indicator, panels)"
            min={80}
            max={1500}
            step={10}
            format={milliseconds}
            value={current.duration3}
            onValueChange={(val) => setTiming('duration3', val as number)}
          />
          <Slider
            label="Duration Morph · Containers (dialogs, popups)"
            min={100}
            max={2000}
            step={20}
            format={milliseconds}
            value={current.durationMorph}
            onValueChange={(val) => setTiming('durationMorph', val as number)}
          />

          <Field.Root>
            <Field.Label>Apply to</Field.Label>
            <ToggleGroup
              value={[scope]}
              onValueChange={(val) => val[0] && setScope(val[0] as 'section' | 'global')}
            >
              <Toggle value="section">This section</Toggle>
              <Toggle value="global">Whole page</Toggle>
            </ToggleGroup>
            <Field.Description>
              {scope === 'global'
                ? 'Applied to :root so all components on the page use these timings.'
                : 'Scoped to the specimen preview on the left.'}
            </Field.Description>
          </Field.Root>

          <div className="pg-lab-actions">
            <Button size="sm" onClick={() => applyMultiplier(0.5)}>
              Snappy (0.5×)
            </Button>
            <Button size="sm" onClick={() => applyMultiplier(1.5)}>
              Deliberate (1.5×)
            </Button>
            <Button size="sm" onClick={() => applyMultiplier(3)}>
              Slow-mo (3×)
            </Button>
            <Button size="sm" variant="ghost" disabled={!hasOverrides} onClick={resetToTheme}>
              The theme's own
            </Button>
          </div>
        </Panel>
      </div>

      <p className="pg-muted">
        Tokens are custom properties read by transitions and keyframe animations throughout the
        system.
      </p>
      <Code source={snippet} language="css" />
    </div>
  );
}

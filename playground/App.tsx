import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Button,
  Decipher,
  Eyebrow,
  Icon,
  Kbd,
  Logo,
  morph,
  Popover,
  Reveal,
  resetScenerySettings,
  SceneryWindow,
  Separator,
  Slider,
  Switch,
  setScenerySettings,
  Theme,
  type ThemeName,
  Toaster,
  Toggle,
  ToggleGroup,
  TooltipProvider,
  useScenerySettings,
  wipe,
} from 'tk-design-system';
import { FieldTrips } from './pages/FieldTrips';
import { Glyphs } from './pages/Glyphs';
import { Hall } from './pages/Hall';
import { SceneryLab } from './pages/SceneryLab';
import { ThemeCompare } from './pages/ThemeCompare';
import { demos, Specimen } from './Specimen';
import { type Section, sections } from './sections';
import { playgroundThemes } from './themes';

const pages: Record<string, () => ReactNode> = {
  hall: Hall,
  scenery: SceneryLab,
  glyphs: Glyphs,
  themes: ThemeCompare,
  'field-trips': FieldTrips,
};

const readHash = (): string => {
  const id = location.hash.replace(/^#\/?/, '');
  return sections.some((section) => section.id === id) ? id : 'hall';
};

const readTheme = (): ThemeName => {
  try {
    return localStorage.getItem('tk-playground-theme') ?? 'grove';
  } catch {
    return 'grove';
  }
};

export function App() {
  const [theme, setTheme] = useState<ThemeName>(readTheme);
  const [sectionId, setSectionId] = useState(readHash);
  const pointer = useRef<{ x: number; y: number } | undefined>(undefined);
  const index = sections.findIndex((section) => section.id === sectionId);
  const section = sections[index] ?? sections[0]!;

  // Links and keys only change the hash; this one handler turns that into a morph,
  // so Back and Forward animate too.
  const navigate = (id: string) => {
    const next = sections.findIndex((candidate) => candidate.id === id);
    if (next < 0 || id === sectionId) return;
    morph(() => setSectionId(id), next > index ? 'forward' : 'back');
    window.scrollTo({ top: 0 });
  };
  const go = (id: string) => {
    location.hash = `/${id}`;
  };

  const changeTheme = (next: ThemeName) => {
    if (next === theme) return;
    wipe(() => setTheme(next), pointer.current);
    pointer.current = undefined;
    try {
      localStorage.setItem('tk-playground-theme', next);
    } catch {}
  };

  // A game menu: brackets step through sections, T cycles the theme.
  const keys = useRef({ go, navigate, changeTheme, index, theme });
  keys.current = { go, navigate, changeTheme, index, theme };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (target.closest('input, textarea, select, [contenteditable], [role="dialog"]')) return;
      const { go, changeTheme, index, theme } = keys.current;
      if (event.key === ']') go(sections[(index + 1) % sections.length]!.id);
      if (event.key === '[') go(sections[(index - 1 + sections.length) % sections.length]!.id);
      if (event.key === 't') {
        const at = playgroundThemes.findIndex((candidate) => candidate.id === theme);
        changeTheme(playgroundThemes[(at + 1) % playgroundThemes.length]!.id);
      }
    };
    const onHash = () => keys.current.navigate(readHash());
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const Page = pages[section.id];
  const sectionDemos = demos.filter((demo) => demo.meta.section === section.id);

  return (
    <Theme scope="document" name={theme}>
      <TooltipProvider delay={400}>
        <Toaster>
          <div className="pg">
            <aside className="pg-rail">
              <a className="pg-brand" href="#/hall">
                <SceneryWindow />
                <Logo className="pg-brand-mark" />
                <span className="pg-brand-text">Proving Grounds</span>
              </a>
              <Nav activeId={section.id} />
              <div className="pg-rail-footer">
                <span>
                  <Kbd>[</Kbd> <Kbd>]</Kbd> sections
                </span>
                <span>
                  <Kbd>T</Kbd> theme
                </span>
              </div>
            </aside>

            <main className="pg-main">
              <header className="pg-topbar">
                <Eyebrow>
                  {String(index + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}
                </Eyebrow>
                <div className="pg-topbar-controls">
                  <ToggleGroup
                    size="sm"
                    value={[theme]}
                    onValueChange={(value) => value[0] && changeTheme(value[0] as ThemeName)}
                    onPointerDown={(event) => {
                      pointer.current = { x: event.clientX, y: event.clientY };
                    }}
                    aria-label="Theme"
                  >
                    {playgroundThemes.map((option) => (
                      <Toggle key={option.id} value={option.id}>
                        {option.name}
                      </Toggle>
                    ))}
                  </ToggleGroup>
                  <ScenerySettingsButton />
                </div>
              </header>

              <Reveal key={section.id} directional>
                <div className="pg-page">
                  <header className="pg-page-header">
                    <h1>
                      <Decipher>{section.title}</Decipher>
                    </h1>
                    <p>{section.blurb}</p>
                  </header>
                  {Page && <Page />}
                  {sectionDemos.length > 0 && (
                    <div className="pg-specimens">
                      {sectionDemos.map((demo) => (
                        <Specimen key={demo.id} demo={demo} />
                      ))}
                    </div>
                  )}
                  <footer className="pg-page-footer">
                    <Separator />
                    <div>
                      {index > 0 && (
                        <Button variant="ghost" onClick={() => go(sections[index - 1]!.id)}>
                          <Icon name="arrow-left" /> {sections[index - 1]!.title}
                        </Button>
                      )}
                      {index < sections.length - 1 && (
                        <Button variant="ghost" onClick={() => go(sections[index + 1]!.id)}>
                          {sections[index + 1]!.title} <Icon name="arrow-right" />
                        </Button>
                      )}
                    </div>
                  </footer>
                </div>
              </Reveal>
            </main>
          </div>
        </Toaster>
      </TooltipProvider>
    </Theme>
  );
}

/*
  One marker glides from item to item. Over the links sits the same list again in
  the highlight's colours, clipped to the marker's box, so text inverts exactly
  where the marker is, even mid-glide. The box is measured, then both transition.
*/
function Nav({ activeId }: { activeId: string }) {
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const place = () => {
      const item = element.querySelector<HTMLElement>('[aria-current="page"]');
      if (!item) return;
      const box = item.getBoundingClientRect();
      const origin = element.getBoundingClientRect();
      element.style.setProperty('--pg-marker-x', `${box.left - origin.left}px`);
      element.style.setProperty('--pg-marker-y', `${box.top - origin.top}px`);
      element.style.setProperty('--pg-marker-w', `${box.width}px`);
      element.style.setProperty('--pg-marker-h', `${box.height}px`);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeId]);

  // Transitions switch on a frame after the first placement, so the marker
  // starts where it belongs instead of flying in on load.
  useEffect(() => {
    const frame = requestAnimationFrame(() => track.current?.setAttribute('data-placed', ''));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <nav className="pg-nav" aria-label="Sections">
      <div className="pg-nav-track" ref={track}>
        <div className="pg-nav-list">
          {sections.map((item, i) => (
            <a
              key={item.id}
              href={`#/${item.id}`}
              className="pg-nav-item"
              aria-current={item.id === activeId ? 'page' : undefined}
            >
              <NavLabel item={item} number={i + 1} />
            </a>
          ))}
        </div>
        <span className="pg-nav-marker" />
        <div className="pg-nav-list pg-nav-lit" aria-hidden>
          {sections.map((item, i) => (
            <span key={item.id} className="pg-nav-item">
              <NavLabel item={item} number={i + 1} />
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavLabel({ item, number }: { item: Section; number: number }) {
  return (
    <>
      <span className="pg-nav-number">{String(number).padStart(2, '0')}</span>
      <Icon name={item.mark} className="pg-nav-mark" />
      <span className="pg-nav-title">{item.title}</span>
    </>
  );
}

function ScenerySettingsButton() {
  const settings = useScenerySettings();
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button size="sm" square aria-label="Scenery settings" />}>
        <Icon name="sliders" />
      </Popover.Trigger>
      <Popover.Popup align="end" className="pg-settings">
        <Popover.Title>Scenery</Popover.Title>
        <Popover.Description>Global controls for every window on the page.</Popover.Description>
        <Switch
          checked={!settings.paused}
          onCheckedChange={(on) => setScenerySettings({ paused: !on })}
        >
          Animate
        </Switch>
        <Slider
          label="Speed"
          min={0}
          max={4}
          step={0.1}
          value={settings.speed}
          onValueChange={(speed) => setScenerySettings({ speed: speed as number })}
        />
        <Slider
          label="Scroll parallax"
          min={0}
          max={3}
          step={0.1}
          value={settings.parallax}
          onValueChange={(parallax) => setScenerySettings({ parallax: parallax as number })}
        />
        <Slider
          label="Dither"
          min={0}
          max={1}
          step={0.05}
          value={settings.ditherStrength}
          onValueChange={(ditherStrength) =>
            setScenerySettings({ ditherStrength: ditherStrength as number })
          }
        />
        <ToggleGroup
          size="sm"
          value={[settings.preview]}
          onValueChange={(value) =>
            value[0] && setScenerySettings({ preview: value[0] as 'final' | 'blurred' | 'scene' })
          }
          aria-label="Pipeline stage"
        >
          <Toggle value="final">Dithered</Toggle>
          <Toggle value="blurred">Blurred</Toggle>
          <Toggle value="scene">Raw</Toggle>
        </ToggleGroup>
        <Button size="sm" variant="ghost" onClick={resetScenerySettings}>
          Reset
        </Button>
      </Popover.Popup>
    </Popover.Root>
  );
}

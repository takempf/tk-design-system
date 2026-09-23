# tk-design-system

Base UI components for React 19, themed entirely through CSS custom properties, with
view-transition motion and dithered WebGL "trapper keeper" scenery. Grown out of tk-ai.

```sh
npm install
npm run dev        # the playground — http://localhost:5180
npm run build      # the library → dist/ (ES modules, styles.css, .d.ts)
npm run check      # biome
npm run typecheck
```

## Using it in another app

```sh
npm install ../tk-design-system        # or a git URL; run `npm run build` in here first
```

```tsx
import 'tk-design-system/fonts.css';   // the Fontsource faces the themes name
import 'tk-design-system/styles.css';
import { Theme, SceneryBackdrop, Button, Select } from 'tk-design-system';

export function App() {
  return (
    <Theme scope="document" name="grove">
      <SceneryBackdrop />
      <Button variant="primary">Enter the wood</Button>
    </Theme>
  );
}
```

Peer dependencies are React and React DOM 19. Base UI, zustand and the Fontsource
packages come with the package.

**Type.** Every face is a Fontsource variable font: Geist and Geist Mono (base), Archivo
(labels — its width axis runs 62–125%, narrowed with `--tk-label-stretch`), Instrument
Sans (Grove, also width-variable), Newsreader (Paper display), with Noto Sans KR and Noto
Color Emoji as the shared `--tk-font-fallback`. Stacks end only in a generic family, so
nothing depends on what the OS has installed. Narrowing is always `font-stretch` on a
width axis: `--tk-label-stretch` for labels, `--tk-display-stretch` for headings.

## How it fits together

```
src/
  styles/tokens.css      every token, on :root and every [data-tk-theme]
  themes/*.css           grove, bureau, paper — token overrides (+ anything beyond)
  styles/components/*    one class per part: .tk-button, .tk-list-item, …
  components/            thin typed wrappers over @base-ui/react parts
  motion/                morph(), <Morph>, <Reveal>, <Decipher>, wipe()
  scenery/               the WebGL renderer, scenes, <SceneryWindow>, <SceneryBackdrop>
  theme/                 <Theme>, theme registry
playground/              the proving grounds: every component, its source, every theme
```

**Styling is CSS, not JS.** Components render Base UI parts with a stable `tk-*` class
and style off Base UI's data attributes (`[data-highlighted]`, `[data-starting-style]`,
…). Everything lives in cascade layers — `tk.reset, tk.tokens, tk.base, tk.components,
tk.themes` — so any unlayered CSS in your app overrides it without `!important`.

**Themes are token blocks.** `tokens.css` declares the full set on `:root` *and* on every
`[data-tk-theme]`, so a nested theme starts clean rather than inheriting its parent's
leftovers. A theme only states what differs. Tokens cover color, type, shape (radius,
`corner-shape: bevel` for Grove's cut-stone corners, knob shape), motion (durations,
separate fade/move/morph easings, entrance offset/scale/blur) and scenery.

| Theme    | Feel                                                                       |
| -------- | -------------------------------------------------------------------------- |
| `base`   | tk-ai: neutral dark surfaces, off-white fills, teal focus, red labels      |
| `grove`  | dark cozy forest: phthalo, orange-red ember, pale lavender; runic bevels, misty slow motion |
| `bureau` | brutalist concrete and red wayfinding; fades flicker like a fluorescent tube |
| `paper`  | light: warm stock, serif display, typewriter labels; scenery prints as a negative |

### Writing a theme

```css
[data-tk-theme='tide'] {
  --tk-bg: #0b1622;
  --tk-primary: #f28c6a;
  --tk-radius: 999px;          /* pill controls… */
  --tk-radius-popup: 20px;     /* …but menus stay soft squares */
  --tk-scenery-scene: 'aurora';
  --tk-scenery-ink-0: oklch(0.135 0.018 248); /* … ink-1..4, ember */
}
```

Then `<Theme name="tide">` (a subtree) or `<Theme scope="document" name="tide">`.
Scoped themes keep a matching empty container on `<body>` for popups, so a menu opened
inside a Paper panel is Paper even on a Grove page.

## Components

`Button` · `Toggle`/`ToggleGroup` · `Menu` · `Tooltip` · `Popover` · `Dialog` ·
`AlertDialog` · `Field`/`Fieldset` · `Input` · `Textarea` · `Checkbox` · `Switch` ·
`Radio`/`RadioGroup` · `Slider` · `Select` · `Combobox` · `Tabs` · `Accordion` ·
`Collapsible` · `Progress` · `Meter` · `Toaster`/`toasts` · `Panel` · `Eyebrow` ·
`Badge` · `Kbd` · `Separator` · `Stack` · `Icon` (utility icons plus geometric marks —
dot, circle, square, triangle, diamond and nested pairs — at one stroke weight
and one optical size).

Compound components mirror Base UI's anatomy; their `Popup` part bundles the portal and
positioner. Every part accepts Base UI's props, `render`, and state-function classNames.

## Motion

```tsx
morph(() => setOpen(true), { type: 'open', scope: 'card' });

<Morph name="card" active={!open} scope="card"><Panel>…</Panel></Morph>
<Morph name="card" active={open} scope="card"><Panel>…</Panel></Morph>
```

- `morph(update, { type, scope })` runs the update (synchronously, via `flushSync`)
  inside `document.startViewTransition`. It works with any state source — React state,
  an external store, or a Base UI popup's open state.
- `<Morph>` shares a name between two states; the browser carries one into the other.
  `fit="text"` keeps letters at true size while they travel.
- `<Reveal>` rises in on mount, sinks on unmount, slides when siblings move; `directional`
  follows `forward`/`back` types.
- `scope` keeps a local change local: names only exist for the morph that asks for them,
  so opening a popup never captures (or covers) the rest of the page.
- `Combobox` uses this internally: open it and the shared text (the value, or the
  placeholder) travels from the trigger to its place in the popup.
- `Select` opens over its trigger with the chosen row exactly on the value, unfolding out
  of the trigger's own box, so nothing moves and nothing appears twice. Choosing folds the
  list back into the trigger while the new label is carried home.
- `<Decipher>` resolves changed text through the theme's glyphs (`--tk-decipher-glyphs`):
  geometric shapes in Grove, digits in Bureau.
- `wipe(update, origin)` swaps the theme behind a circular reveal (Bureau scans instead).

All of it respects `prefers-reduced-motion`.

## Scenery

```tsx
<Panel>
  <SceneryWindow />                       {/* the theme's scene, fixed to the viewport */}
  …
</Panel>
<SceneryWindow scene="stones" attachment="local" style={{ '--tk-scenery-bayer': 4 }} />
<SceneryBackdrop />
```

One renderer serves the page. Per scene it ray-marches a low-resolution frame, blurs it,
auto-exposes it toward `--tk-scenery-key`, gradient-maps it onto the theme's five inks
and Bayer-dithers it on a grid fixed to the screen. Scenes mark emissive spots in alpha;
those dither into the sixth ink, `--tk-scenery-ember`. Windows only copy crops of the
finished frame, so many windows cost the same as one, and with `fixed` attachment the
picture holds still while the page scrolls over it (scrolling also nudges the camera).

Scenes: `trapper` (tk-ai's original), `grove`, `stones`, `monolith`, `canopy`,
`contour`, `aurora`. Each is a GLSL file defining `vec4 render(vec2 fragCoord)` on top
of `scenery/shaders/prelude.glsl`; add one by adding to `scenes`.

Knobs, all CSS: `--tk-scenery-scene`, `-attachment`, `-ink-0…4`, `-ember`, `-bayer` (2/4/8),
`-pixel`, `-softness`, `-key`, `-tone-low`, `-tone-high`. Global pause/speed/parallax/debug
live in a zustand store (`setScenerySettings`, `useScenerySettings`).

## Browser notes

WebGL2, view transitions with types, `:active-view-transition-type()`, constructable
stylesheets and CSS nesting are needed for the full effect (current Chrome, Edge,
Safari). `corner-shape: bevel` is Chromium-only for now; elsewhere corners are simply
rounded. Without WebGL2, windows fall back to a flat ink; without view transitions,
changes apply instantly.

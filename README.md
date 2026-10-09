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
| `base`   | tk-ai: neutral dark surfaces, off-white fills, teal focus, red labels and radios |
| `grove`  | dark cozy forest: phthalo, orange-red ember, pale lavender; runic bevels, misty slow motion |
| `bureau` | brutalist concrete and red wayfinding; fades flicker like a fluorescent tube |
| `paper`  | light: warm stock, serif display, typewriter labels; scenery prints as a negative |

### Writing a theme

```css
[data-tk-theme='tide'] {
  --tk-bg: #0b1622;
  --tk-primary: #f28c6a;
  --tk-accent: #7fc8c3;        /* focus, links, tags */
  --tk-accent-2: #f28c6a;      /* labels, keywords */
  --tk-red: #f47a7d;           /* … orange, yellow, green, teal, blue, purple, pink */
  --tk-radius: 999px;          /* pill controls… */
  --tk-radius-popup: 20px;     /* …but menus stay soft squares */
  --tk-scenery-scene: 'aurora';
  --tk-scenery-ink-0: oklch(0.135 0.018 248); /* … ink-1..4, ember */
}
```

Then `<Theme name="tide">` (a subtree) or `<Theme scope="document" name="tide">`.
Scoped themes keep a matching empty container on `<body>` for popups, so a menu opened
inside a Paper panel is Paper even on a Grove page.

### Color

A theme's color comes in four groups, and everything else is derived from them:

- **Surfaces and ink:** `--tk-bg`, `--tk-surface…`, `--tk-fg…`, `--tk-border…`,
  `--tk-primary…`, `--tk-highlight…`.
- **Two accents:** `--tk-accent` for focus and interactive color, and `--tk-accent-2`
  for wayfinding. `--tk-label` (eyebrows, tab indicators) defaults to the second.
- **Eight standard hues:** `--tk-red`, `-orange`, `-yellow`, `-green`, `-teal`,
  `-blue`, `-purple`, `-pink`. Each theme tunes them to one lightness, so all of them
  read as text on `--tk-surface`: pastel on the dark themes, printing inks on Paper.
- **Status:** `--tk-success`, `--tk-info`, `--tk-warning` and `--tk-danger` default to
  green, blue, yellow and red. Each has a `-soft` fill (`--tk-accent-soft` and
  `--tk-accent-2-soft` too).

Syntax colors are drawn from these (see Code), so a theme that retunes its hues
retunes its code too.

## Components

`Button` · `Toggle`/`ToggleGroup` · `Menu` · `Tooltip` · `Popover` · `Dialog` ·
`AlertDialog` · `Field`/`Fieldset` · `Input` · `Textarea` · `Checkbox` · `Switch` ·
`Radio`/`RadioGroup` · `Slider` · `Select` · `Combobox` · `Tabs` · `Accordion` ·
`Collapsible` · `Progress` · `Meter` · `Toaster`/`toasts` · `Panel` · `Eyebrow` ·
`Badge` · `Kbd` · `Separator` · `Stack` · `Code` · `CodeBlock` · `CodeEditor` ·
`Icon` (utility icons plus geometric marks —
dot, circle, square, triangle, diamond and nested pairs — at one stroke weight
and one optical size) · `Logo` (the tk mark, solid in `currentColor`, sized by height;
also shipped as a file at `tk-design-system/logo.svg`).

Compound components mirror Base UI's anatomy; their `Popup` part bundles the portal and
positioner. Every part accepts Base UI's props, `render`, and state-function classNames.

`Combobox` comes in two variants. Both take `items`, or `groups` to show items under
headings, and accept `clearable` (a button that clears the value), `virtualized` (render
only the rows in view, for long flat lists), `limit`, `readOnly`, `required` and `name`.

- **Searchable select** (the default). A trigger that opens over itself into a list, the
  trigger itself turning into the search field. `multiple` checks off several options; the list stays open and the trigger
  lists them.
- **Editable field** (`variant="input"`). The user types straight into the field.
  `multiple={false}` picks one value, and the field shows its label. Otherwise the selected
  values are removable chips: Backspace removes the last one, and Left arrow moves into
  them. Plain strings and `{ value, label }` objects need no converters; other shapes take
  `itemToStringLabel`/`itemToStringValue`. Suggestions open once `minQueryLength`
  non-whitespace characters are typed (one by default; `0` opens them on click). `browsable`
  adds a chevron that opens every suggestion, as does the down arrow. `filter={null}` takes
  `items` as already filtered, for results searched remotely; pair it with `loading` (the
  field's icon spins) and `status` (announced above the list). `onCreate` adds a row that
  offers to create the query when nothing is called exactly that. `onSubmit` handles Enter
  when no suggestion is highlighted. `renderItem` and `renderChip` take rich content; the
  component still owns styling, positioning, keyboard navigation, dismissal and removal.
  Cancel `onValueChange`'s event details to use a result as an action (such as opening a
  tab) instead of selecting it.

The playground has a demo for each: grouped multiselect, single field, chips, remote search,
creatable (with a dialog), ten thousand virtualized rows, and a form with validation.

## Code

```tsx
<Code>tokenize(code)</Code>                                   {/* inline */}

<CodeBlock code={source} language="tsx" title="Lantern.tsx"
  lineNumbers highlightLines="6-8" />                          {/* read */}

<Field.Root>
  <Field.Label>Script</Field.Label>
  <CodeEditor value={code} onValueChange={setCode} language="python" maxLines={20} />
</Field.Root>                                                 {/* write */}
```

- `CodeBlock` has a copy button (`copyable`, `onCopyCode`), `lineNumbers` with a
  `startLine`, `highlightLines` (`"2,5-7"` or an array) and `wrap` for soft-wrapping.
  Line numbers are generated content, so selecting the code never copies them.
- `CodeEditor` is a plain textarea laid exactly over its own highlight, so typing,
  selection, undo and IME all stay native (spellcheck and autocorrect are off). Tab
  indents and Shift+Tab outdents; Escape then Tab moves focus on. Enter keeps the indent
  and opens a line inside a bracket pair. It grows from `minLines` to `maxLines`, then
  scrolls. Inside a `Field.Root` it is the field's control.
- Highlighting is built in and synchronous, with no dependencies: JS/TS/JSX, CSS, HTML
  and XML, JSON, shell, Python and diff. `tokenize(code, language)` returns lines of
  `{ kind, text }` tokens. `registerLanguage(names, grammar)` adds a language: a grammar
  is an ordered list of `[kind, RegExp, inside?]` rules, compiled into one pass.
- Token kinds (`comment`, `keyword`, `string`, `number`, `constant`, `function`, `type`,
  `tag`, `attribute`, `property`, `variable`, `regex`, `operator`, `punctuation`, `meta`,
  `inserted`, `deleted`) are styled by `--tk-code-<kind>` tokens. Any element with
  `data-token="<kind>"` picks them up, so another highlighter's output can use the
  theme's colors too. Frame tokens: `--tk-code-bg`, `-fg`, `-border`, `-gutter`,
  `-caret`, `-selection`, `-line-bg`, `-line-marker`, `-font`, `-text`, `-leading`,
  `-tab-size`.

## Motion

The rules every component follows — nothing appears from nothing, a popup is its trigger
elsewhere, every trigger part has a counterpart — are in [MOTION.md](MOTION.md). This is
the API.

```tsx
morph(() => setOpen(true), { type: 'open', scope: 'card' });

<Morph name="card" active={!open} scope="card"><Panel>…</Panel></Morph>
<Morph name="card" active={open} scope="card"><Panel>…</Panel></Morph>
```

- `morph(update, { type, scope })` runs the update (synchronously, via `flushSync`)
  inside `document.startViewTransition`. It works with any state source — React state,
  an external store, or a Base UI popup's open state.
- `<Morph>` shares a name between two states; the browser carries one into the other.
  `fit="text"` keeps letters at true size while they travel; `fit="icon"` scales and turns
  one glyph into another without dimming between them.
- `<Reveal>` rises in on mount, sinks on unmount, slides when siblings move; `directional`
  follows `forward`/`back` types.
- `scope` keeps a local change local: names only exist for the morph that asks for them,
  so opening a popup never captures (or covers) the rest of the page.
- A part nested in another stays on top of it while both travel, as the page paints them.
  The browser on its own stacks the old state's parts first, so a box that only the new
  state has would cover text arriving into it.
- A popup is its trigger's container in another place. The trigger's container and the
  popup's share one view-transition name (`fit="container"`), and opening and closing are
  morphs between the two: the frame (fill, edge, focus ring, corners) moves and resizes from the
  trigger's box to the popup's, its look turning as it travels, and nothing inside it
  stretches. The content holds still on the page; the frame uncovers the popup's and covers
  the trigger's. While open, the trigger is hidden, because it is the popup.
- Whatever shows on both sides shares a second name and travels between its two places
  above the frame: a select's value and its row, a select's chevron and its row's check, a
  combobox's placeholder and its search field, a menu button's label and the menu's first
  row.
- `Select`, `Combobox` and `Menu` open over their trigger, so the frame grows out of the
  trigger around the list and none of the trigger's parts is shown twice.
  - `Select` lays the chosen row exactly on the trigger: its label on the value and its
    check (value lists mark the chosen row at its end) on the chevron, which turns into it.
    The frame only grows up and down. Choose another row and its label and check fly home,
    the check turning back into the chevron.
  - `Combobox` lands its search field on the trigger, laid out the same: the trigger made
    editable, with its clear button and chevron unmoved (the chevron closes it). The
    placeholder stays put in the field, or the value slides onto its row in the list.
  - `Menu` makes the button's own label the popup's first row (pressing it closes), with the
    items below, or above when there is no room. Submenus open beside their row as usual.
  - The editable `Combobox` keeps its field in use, so the field's outline is the
    container. Open, the suggestions are the field grown: laid over it, seen through a
    window as tall as it, and carried on below (or above) as the list, with one edge and
    one ring round the whole. Closing, they shrink back into the outline; the ring stays if
    focus does and fades if it leaves. A chip picked from the list flies out of its row into
    the field while the other chips and the input make room, and when chips wrap onto
    another line the field glides to its new height. A removed chip fades where it stood as
    the rest close up.
- `useLayoutMorph(signature, layer?)` does that for any live layout: after each change of
  `signature`, children marked `data-tk-layout="<key>"` glide to their new places, and the
  element given `frame` glides to its new height. A newcomer fades in, or sets out from
  the element passed to `from(key, element)`. A leaver fades where it stood. Nothing is
  captured, so the elements stay usable and typing never waits. `CodeEditor` uses a frame
  alone, to grow and shrink a line at a time:

  ```tsx
  const chips = useLayoutMorph(tags.join('\n'), usePortalContainer());
  <div ref={chips.frame} className="field">
    <div ref={chips.ref} style={{ position: 'relative' }}>
      {tags.map((tag) => <Tag key={tag} data-tk-layout={tag} />)}
    </div>
  </div>
  // before adding a tag picked from a list:
  chips.from(tag, rowLabel);
  ```
- `Popover`, `Dialog` and `AlertDialog` grow out of their trigger wherever they open.
  `Origin` makes a larger element the container (a card holding the trigger), and
  `SharedElement name="…" side="trigger" | "popup"` carries an icon, picture or title
  across above it (it scales; `fit="text"` keeps letters at their size). A popup with no
  trigger on the page, opened from elsewhere, rises in on its own. Tooltips and submenus
  don't morph.
- Changes made through Base UI (the trigger, Escape, an outside press, `actionsRef`) morph.
  A controlled `open` that the parent changes on its own can't morph, and neither can
  anything in a browser without view transitions: there the trigger and its popup
  crossfade where they stand. `willMorph()` says which a change made now will get.
- `usePopupMorph` and `PopupMorph` build the same for any popup:

  ```tsx
  const popup = usePopupMorph({ open, onOpenChange });
  <PopupMorph.Provider value={popup.state}>
    <Base.Root open={popup.open} onOpenChange={popup.setOpen}
      onOpenChangeComplete={popup.onOpenChangeComplete}>
      <PopupMorph.Trigger><Base.Trigger>
        <PopupMorph.Part side="trigger"><span>{label}</span></PopupMorph.Part>
      </Base.Trigger></PopupMorph.Trigger>
      <PopupMorph.Popup><Base.Popup>
        <PopupMorph.Part side="popup" when={isChosen}><span>{label}</span></PopupMorph.Part>
      </Base.Popup></PopupMorph.Popup>
  ```

  Everything moves on `--tk-duration-morph` and `--tk-ease-morph`.
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

WebGL2, view transitions with types, `:active-view-transition-type()`, Web Animations
on view-transition pseudo-elements and CSS nesting are needed for the full effect (current Chrome, Edge,
Safari). WebKit paints a view transition's destination in place as well as in its
snapshot, so a morphing container's destination is cut to the moving frame and the two
coincide. `corner-shape: bevel` is Chromium-only for now; elsewhere corners are simply
rounded. Without WebGL2, windows fall back to a flat ink. Without view transitions,
changes apply at once: popups and their triggers crossfade in place, and layout morphs
(plain Web Animations) still glide.

# Motion

How things move in tk-design-system, and the rules every component follows. The
mechanics live in `src/motion/`; the README's Motion section covers the API.

## Principles

1. **One element, many configurations.** An element that exists before and after a
   change is the same element. It travels from its old box to its new one and turns its
   look (fill, edge, corners, glyph) on the way. It is never removed and re-added.

2. **Nothing comes from nothing.** Whatever exists on only one side of a change comes from,
   or goes to, a place: the frame that uncovers or covers it, the row it was picked from,
   the edge it slid in from. When there is no such place, it fades where it stands.
   Nothing pops in or out.

3. **A popup is its trigger, elsewhere.** A trigger and its popup are one container in two
   places. The container's frame (fill, edge, corners) moves and resizes between them.
   Content never stretches, and only shared parts travel. Everything else fades during
   the move: what the frame leaves is gone as it sets off, and what it arrives at fades in
   as it lands. While a popup is open its trigger is hidden, because the popup is the
   trigger.

4. **Same place, same part.** When a popup opens over its trigger, whatever lands on a
   trigger part's spot *is* that part, laid out to match it to the pixel. Every part of a
   trigger has a counterpart in the popup, ideally exactly where it was:

   | Trigger part        | Its counterpart                                          |
   | ------------------- | -------------------------------------------------------- |
   | Select value        | the chosen row's label, laid on it                       |
   | Select chevron      | the chosen row's check, which the chevron turns into     |
   | Combobox trigger    | the search field: the trigger made editable              |
   | Combobox value      | its row's label (the field takes the placeholder)        |
   | Combobox clear, chevron | the same buttons in the search field, unmoved        |
   | Menu button's label | the menu's head row, which closes it                     |
   | A trigger's icon    | wherever the popup shows it (`SharedElement`)            |

   If a design leaves a part with no counterpart, change the design before reaching for
   a fade. Value lists mark the chosen row with a trailing check for this reason: it lands
   on the trigger's chevron. Menus lead with their icons, since their trigger has none.

5. **Shared parts travel above the frame.** A part shown on both sides shares a name and
   flies between its two places, above the container. Text keeps its true size
   (`fit="text"`); icons scale and turn one glyph into the other (`fit="icon"`); pictures
   scale (`fit="box"`).

6. **Live layout glides.** When something is added to or removed from live content (chips
   in a field, a list), its neighbours glide to their new places instead of jumping. An
   arrival comes from where it was picked; a departure fades where it stood. A container
   that grows or shrinks because of it — a field whose chips wrap onto another line, an
   editor gaining a line — glides to its new size too, and the page around it moves in
   step. What it grows to hold is uncovered as it grows.

7. **Typing never waits.** Changes driven by each keystroke — filtering a list, the query
   in a field — apply at once. Motion is for discrete changes: opening, choosing,
   removing, navigating.

8. **One clock.** Moves ride `--tk-duration-morph` and `--tk-ease-morph`. A container's own
   content rides `--tk-ease-fade` within the move: leaving, it fades out over the first
   `--tk-duration-1`; arriving, it fades in over the last `--tk-duration-2`, finishing as the
   frame lands. Leaving is faster than arriving. A dialog's backdrop dims and clears with the
   frame. Themes tune these tokens, never the choreography: Grove settles slowly, Bureau
   snaps and flickers.

9. **Motion is never structure.** DOM order, focus, roles and names are the same with or
   without motion. A copy made for motion (a popup's echo of its trigger's label, a chip
   in flight) is `aria-hidden` and out of reach of pointer and focus. A hidden trigger
   stays in the accessibility tree, and focus returns to it when its popup closes. The
   transition layer never takes pointer events.

10. **Degrade to fades.** Without view transitions, a trigger and its popup crossfade
    where they stand, the popup rising slightly as it comes in. With reduced motion,
    every change applies at once.

## Two mechanisms

**`morph()`, for swapping configurations.** It runs a state change inside
`document.startViewTransition`. Use it when one thing becomes another: a trigger and its
popup, a card and its dialog, one page and the next. Both states are captured as images,
so the change can rearrange anything. While it plays, the parts it carries can't be used.
It needs the old state on the page when it starts, so the component that starts the
morph must own the change.

- `fit="container"` names a frame: `morph()` paints the frame on the moving group itself,
  turning its fill, edge, focus ring and corners from one end's look to the other's. The
  browser on its own would stretch a snapshot, corners and all. A ring that only one end
  has fades as the frame travels: a field's ring stays round the whole while focus does,
  and fades with it if focus leaves.
- A container with no fill of its own, seen through to what is under it, is hollow
  (`view-transition-class: tk-container tk-hollow`): its content isn't faded, or the page
  would show through it, only uncovered and covered by the frame.
- The browser shows the frame it captures the old state from, so `morph()` leaves the old
  end's frame in its snapshot (it matches the moving frame while the content fades out).
  Only a hollow container's is stripped for the capture.
- `PopupMorph.Part` and `SharedElement` name the parts shown on both sides.
- `morph()` names its parts again just before the old state is captured, so a change made
  in the same gesture — a select's new value, set as its list closes — is the one that
  flies.

**`useLayoutMorph()`, for live layout.** A FLIP over live elements. After each change, the
marked children of a container glide from where they were to where they are, and the
frame holding them glides to its new height. Nothing is captured, so the elements stay
usable throughout, typing never waits, and the change can come from anywhere, a controlled
parent included. Use it for content that reflows in place: chips, tags, lists, an editor
that grows.

- Mark children with `data-tk-layout="<key>"`. The container must be positioned.
- `frame` goes on the box that gets taller or shorter (the field round the chips). Its
  height is held between a floor and a ceiling that glide, so a flex parent can't override
  it, and it clips what it is growing to hold. The frame starts first and each child is
  then measured where it begins, so a child's own glide and the frame's add up to one
  steady move even while the frame recentres its content. A frame alone, with no
  children, simply grows and shrinks.
- `from(key, element)`, called just before the change, makes a newcomer set out from
  another element at that element's type size. Because it may set out from under a popup,
  a stand-in makes the journey above popups, in the theme's portal container, and the
  newcomer shows as it lands.
- A child that leaves fades where it stood, as an inert copy beneath its gliding
  neighbours.

## Every popup, at a glance

| Component              | Container                            | Shared parts                                   | Comes and goes in place                    |
| ---------------------- | ------------------------------------ | ---------------------------------------------- | ------------------------------------------ |
| `Select`               | trigger ↔ list                       | value ↔ chosen label; chevron ↔ chosen check   | the other rows                             |
| `Combobox`             | trigger ↔ popup                      | placeholder or value; clear; chevron           | the rows; the placeholder, when a value travels |
| `Combobox variant="input"` | the field's outline ↔ the field grown: laid over it, carried on below as the list | a picked row's label → its chip (layout morph) | the rows (hollow: uncovered, not faded) |
| `Menu`                 | button ↔ menu                        | label ↔ head row                               | the items                                  |
| `Popover`, `Dialog`    | trigger (or `Origin`) ↔ popup        | whatever `SharedElement` pairs                 | the rest of the popup                      |
| `Tooltip`, submenus    | none: they fade and rise on their own | —                                             | everything                                 |

Outside popups: tab panels rise in where the last one was, accordion panels open in place,
checks grow in and shrink away, toasts slide in from the edge, toggle groups slide one
marker between choices.

## Building a component with a popup

1. Hold open state in `usePopupMorph` and wrap the trigger and popup in
   `PopupMorph.Trigger` and `PopupMorph.Popup`.
2. List every part of the trigger. Give each a counterpart in the popup with
   `PopupMorph.Part`, at the same spot when the popup opens over the trigger: match
   padding, type size and row height until the two coincide.
3. Whatever is left fades with its side's content. Check that this is really a design
   choice and not a missing counterpart.
4. Scroll inside the popup (its list, its body), never the popup itself: the frame has to
   stay put.
5. A part that animates in with `[data-starting-style]` must already be in place when a
   morph captures it (`:root:active-view-transition` turns its transition off).
6. Test it four ways: with view transitions; without them (delete
   `Document.prototype.startViewTransition`); with reduced motion; and keyboard only,
   checking where focus goes on open and comes back to on close.

## Reviewing motion

The playground's settings popover has a **Slow motion** switch that stretches every
duration token, so each morph can be watched at reading pace. To study a single frame,
pause `document.getAnimations()` partway through a transition and set their `currentTime`.
View transitions and layout morphs are both Web Animations.

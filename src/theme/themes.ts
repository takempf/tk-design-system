export type ThemeScheme = 'light' | 'dark';

export interface ThemeInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** The color schemes it comes in. With both, it follows the system unless pinned. */
  readonly schemes: readonly ThemeScheme[];
}

/** The bundled themes. Any other string works too: define `[data-tk-theme='yours']`. */
export const themes = [
  {
    id: 'base',
    name: 'Base',
    description: 'The neutral foundation: tk-ai surfaces, off-white fills, teal focus.',
    schemes: ['dark'],
  },
  {
    id: 'grove',
    name: 'Grove',
    description: 'A dark forest at dusk. Phthalo, ember and moonlight; runic bevels.',
    schemes: ['dark'],
  },
  {
    id: 'bureau',
    name: 'Bureau',
    description: 'Brutalist concrete and red wayfinding. Fades that flicker.',
    schemes: ['dark'],
  },
  {
    id: 'lounge',
    name: 'Lounge',
    description: 'A chat app after hours. Ink-indigo panes, blurple controls, a red-orange lamp.',
    schemes: ['dark'],
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Warm grey stock, serif display, typewriter labels.',
    schemes: ['light'],
  },
  {
    id: 'dancheong',
    name: 'Dancheong',
    description:
      'Painted eaves, made plain. Hanji by day, ink-black lacquer by night; verdigris and vermilion.',
    schemes: ['light', 'dark'],
  },
] as const satisfies readonly ThemeInfo[];

export type BundledTheme = (typeof themes)[number]['id'];
export type ThemeName = BundledTheme | (string & {});

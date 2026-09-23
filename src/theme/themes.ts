export interface ThemeInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

/** The bundled themes. Any other string works too: define `[data-tk-theme='yours']`. */
export const themes = [
  {
    id: 'base',
    name: 'Base',
    description: 'The neutral foundation: tk-ai surfaces, off-white fills, teal focus.',
  },
  {
    id: 'grove',
    name: 'Grove',
    description: 'A dark forest at dusk. Phthalo, ember and moonlight; runic bevels.',
  },
  {
    id: 'bureau',
    name: 'Bureau',
    description: 'Brutalist concrete and red wayfinding. Fades that flicker.',
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Warm grey stock, serif display, typewriter labels. The light one.',
  },
] as const satisfies readonly ThemeInfo[];

export type BundledTheme = (typeof themes)[number]['id'];
export type ThemeName = BundledTheme | (string & {});

import { type ThemeInfo, themes } from 'tk-design-system';

/** The bundled themes, plus Tide: defined in playground.css the way an app would. */
export const playgroundThemes: readonly ThemeInfo[] = [
  ...themes,
  {
    id: 'tide',
    name: 'Tide',
    description: 'Yours, not the library’s: coral and sea-glass on deep water, pebble controls.',
  },
];

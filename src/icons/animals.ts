import type { Glyph } from './glyph';

// Animal cues reduced to folds, forks, arcs, and masses on the same 16×16 grid
// as the geometric marks. One gesture carries each design; a lighter line is
// used only when it defines the structure. Open space does the rest.
const beetle = 'M8 3.25a4 4.75 0 1 1 0 9.5 4 4.75 0 0 1 0-9.5z';
const turtle = 'M5.25 5h5.5l2.75 4-2.75 3.5h-5.5L2.5 9z';

export const animalGlyphs = {
  rabbit: {
    stroke: 'M3.75 12V3.25L8 8l4.25-4.75V12',
  },
  squirrel: {
    stroke: 'M12.75 12.25H7a4.75 4.75 0 1 1 4.75-4.75 2.25 2.25 0 1 1-4.5 0',
  },
  'rabbit-solid': {
    fill: 'M3 2.75 7 7.5v5.25H4.5zM13 2.75 9 7.5v5.25h2.5z',
  },
  'raven-flight': {
    stroke: 'M2.25 11.75 8.25 8l-3-4.75M8.25 8l5.5-1.75',
  },
  'owl-solid': {
    fill: 'M3 3.25 8 5.25l5-2v5.5L8 13.25 3 8.75z',
    cutout: 'M3 8 8 10l5-2',
  },
  'stag-solid': {
    fill: 'M2.5 2.25H4v3l3 3v-5h2v5l3-3v-3h1.5V6L9 10.5v3.25H7V10.5L2.5 6z',
  },

  // Twenty paired studies. The animal is a suggestion, not an illustration.
  bull: {
    stroke: 'M2.5 3.25Q2.5 8 8 8t5.5-4.75M8 8v5',
  },
  'bull-solid': {
    fill: 'M2 3.25h2q0 3.5 4 3.5t4-3.5h2q0 5-5 5.5v4.5H7v-4.5q-5-.5-5-5.5z',
  },
  fox: {
    stroke: 'M2.75 3.25 5.25 9 8 6.5 10.75 9l2.5-5.75',
    detail: 'M5.25 9 8 12.25 10.75 9',
  },
  'fox-curled': {
    stroke: 'M12.25 6.25V3.75H7.75a4.5 4.5 0 1 0 4.5 4.5',
  },
  raven: {
    stroke: 'M4 12.75V3.25L13 6.5 4 9.75',
  },
  'raven-spread': {
    fill: 'M2.25 4 7 6.5v5L4.75 8.75zM13.75 4 9 6.5v5l2.25-2.75z',
  },
  stag: {
    stroke: 'M8 13V8L3 5.75v-3M8 8l5-2.25v-3',
    detail: 'M5.5 2.75v4.125M10.5 2.75v4.125',
  },
  'stag-antlers': {
    stroke: 'M6.25 12.75V8l-3.5-3.5M6.25 8V3.25M9.75 12.75V8l3.5-3.5M9.75 8V3.25',
  },
  wolf: {
    stroke: 'M3.25 3.25 8 6.5l4.75-3.25L8 12.75z',
    detail: 'M8 6.5v3.5',
  },
  'wolf-howl': {
    stroke: 'M4 12.75 6.75 7l-1.5-3.75 6.5 3.25-3.5 1.75',
  },
  bear: {
    stroke: 'M3 12.75V5.5a2 2 0 0 1 4 0v1.25M9 6.75V5.5a2 2 0 0 1 4 0v7.25',
  },
  'bear-solid': {
    fill: 'M2.5 12.75V5.5a2.5 2.5 0 0 1 5 0V7H6V5.5a1 1 0 0 0-2 0v7.25zM13.5 12.75V5.5a2.5 2.5 0 0 0-5 0V7H10V5.5a1 1 0 0 1 2 0v7.25z',
  },
  cat: {
    stroke: 'M2.75 9.75 5.25 5.5 8 9.75l2.75-4.25 2.5 4.25',
  },
  'cat-sitting': {
    stroke: 'M9.75 3.25 6.25 12.75h6.5M6.25 12.75H4.5a2.25 2.25 0 0 1 0-4.5',
  },
  lynx: {
    stroke: 'M3 2.75 5 8.5 8 12.5l3-4 2-5.75',
    detail: 'M5 8.5 8 7l3 1.5',
  },
  'lynx-solid': {
    fill: 'M3 2.75 8 7l5-4.25-2.25 7L8 13.25 5.25 9.75z',
  },
  ram: {
    stroke: 'M8 13V6.25a2.75 2.75 0 1 0-2.75 2.75M8 6.25A2.75 2.75 0 1 1 10.75 9',
  },
  'ram-solid': {
    fill: 'M7.25 6.25A2.75 2.75 0 1 0 4.5 9V7.5a1.25 1.25 0 1 1 1.25-1.25V13h1.5zM8.75 6.25A2.75 2.75 0 1 1 11.5 9V7.5a1.25 1.25 0 1 0-1.25-1.25V13h-1.5z',
  },
  horse: {
    stroke: 'M5 2.75 6 6.25v5.5h4v-5.5l1-3.5',
  },
  'horse-profile': {
    stroke: 'M3.75 12.75v-5.5L8 3l4.25 4.25-3 1.5',
  },
  bat: {
    stroke: 'M2.25 5.25 5.25 9 8 7l2.75 2 3-3.75M8 7v5',
  },
  'bat-solid': {
    fill: 'M2 4.25 8 7l6-2.75L11 10 8 8.75 5 10z',
  },
  snake: {
    stroke: 'M12.25 3.25H6.5a2.375 2.375 0 0 0 0 4.75h3a2.375 2.375 0 0 1 0 4.75H3.75',
  },
  'snake-coiled': {
    stroke: 'M12.75 8A4.75 4.75 0 1 0 8 12.75h4',
    detail: 'M10.25 8A2.25 2.25 0 1 0 8 10.25',
  },
  fish: {
    stroke: 'M2.25 4.75 6 8l-3.75 3.25M6 8l4-3.25L13.75 8 10 11.25z',
  },
  'fish-solid': {
    fill: 'M2.25 4.75 5.25 8l-3 3.25zM7 8l3-3.25L13.75 8 10 11.25z',
  },
  whale: {
    stroke: 'M2.25 5.5v3a4 4 0 0 0 4 4h3.5l3.75-6',
  },
  'whale-tail': {
    stroke: 'M2.25 4.75 8 7.5l5.75-2.75M8 7.5v5.75',
  },
  turtle: {
    stroke: turtle,
    detail: 'M8 2.5V5',
  },
  'turtle-solid': {
    fill: turtle,
    detail: 'M8 2.5V5',
  },
  frog: {
    stroke: 'M2.75 11.75 5.25 5.25 8 8l2.75-2.75 2.5 6.5',
  },
  'frog-solid': {
    fill: 'M2.5 12.5 5.25 4.75 8 8l2.75-3.25 2.75 7.75L8 10z',
  },
  moth: {
    stroke: 'M6.25 4 2.75 8l3.5 4zM9.75 4l3.5 4-3.5 4z',
    detail: 'M8 3v10',
  },
  'moth-solid': {
    fill: 'M2.5 3.5 7 8l-4.5 4.5zM13.5 3.5 9 8l4.5 4.5z',
  },
  beetle: {
    stroke: beetle,
    detail: 'M8 3.25v9.5',
  },
  'beetle-solid': {
    fill: beetle,
    cutout: 'M8 3.25v9.5',
  },
  octopus: {
    stroke: 'M3.25 12V7a4.75 4.75 0 0 1 9.5 0v5',
    detail: 'M6.5 8.75V13M9.5 8.75V13',
  },
  'octopus-solid': {
    fill: 'M3.25 12.75V7a4.75 4.75 0 0 1 9.5 0v5.75z',
    cutout: 'M6.25 8.75v4M9.75 8.75v4',
  },
  crane: {
    stroke: 'M5.25 13V9.25L9 3.25h3.75',
    detail: 'M2.25 8.5 7.5 6',
  },
  'crane-flight': {
    stroke: 'M2.25 10.75 7.75 6l6-.75M7.75 6 5.5 3.25',
  },
} as const satisfies Record<string, Glyph>;

/** Forty-six abstract animal marks, with the core six followed by twenty pairs. */
export const animalNames = Object.keys(animalGlyphs) as (keyof typeof animalGlyphs)[];

import type { IconName } from 'tk-design-system';

export interface Section {
  readonly id: string;
  readonly title: string;
  readonly mark: IconName;
  readonly blurb: string;
}

export const sections: readonly Section[] = [
  {
    id: 'hall',
    title: 'The Hall',
    mark: 'dot-in-circle',
    blurb: 'Where everything starts. The active theme, its palette, its type.',
  },
  {
    id: 'actions',
    title: 'Actions',
    mark: 'triangle',
    blurb: 'Buttons, toggles, menus and hints — things you press.',
  },
  {
    id: 'inputs',
    title: 'Inputs',
    mark: 'square',
    blurb: 'Fields and choices. Open a select or a combobox and watch the text travel.',
  },
  {
    id: 'surfaces',
    title: 'Surfaces',
    mark: 'dot-in-square',
    blurb: 'Panels, dialogs, popovers, tabs, disclosure and progress.',
  },
  {
    id: 'code',
    title: 'Code',
    mark: 'triangle-in-circle',
    blurb: 'Code to read and code to write, colored from the theme’s own palette.',
  },
  {
    id: 'motion',
    title: 'Motion',
    mark: 'circle',
    blurb: 'Shared-element morphs, entrances, and text that deciphers itself.',
  },
  {
    id: 'scenery',
    title: 'Scenery',
    mark: 'y-in-triangle',
    blurb: 'Dithered WebGL illustrations fixed behind the page, seen through windows.',
  },
  {
    id: 'glyphs',
    title: 'Glyphs',
    mark: 'dot',
    blurb: 'The logo, icons and marks: plain geometry, one stroke weight, one optical size.',
  },
  {
    id: 'themes',
    title: 'Themes',
    mark: 'circle-in-square',
    blurb: 'Every theme side by side, and how to write your own.',
  },
  {
    id: 'field-trips',
    title: 'Field trips',
    mark: 'diamond',
    blurb: 'Small apps built only from the system, one per theme.',
  },
];

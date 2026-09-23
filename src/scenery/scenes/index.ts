import aurora from './aurora.glsl?raw';
import canopy from './canopy.glsl?raw';
import contour from './contour.glsl?raw';
import grove from './grove.glsl?raw';
import monolith from './monolith.glsl?raw';
import stones from './stones.glsl?raw';
import trapper from './trapper.glsl?raw';

export interface SceneInfo {
  readonly name: string;
  readonly description: string;
  /** GLSL defining `vec4 render(vec2 fragCoord)`; see shaders/prelude.glsl. */
  readonly source: string;
}

/**
 * The bundled scenes. Add your own at runtime — `scenes.mine = { … }` — and point
 * `--tk-scenery-scene` at it; the renderer compiles scenes on first use.
 */
export const scenes: Record<string, SceneInfo> = {
  trapper: {
    name: 'Trapper',
    description: 'Chrome, crystal and neon on a checkerboard — the original binder cover.',
    source: trapper,
  },
  grove: {
    name: 'Grove',
    description: 'A night walk down a trail between pines. Fireflies. Scroll to walk on.',
    source: grove,
  },
  stones: {
    name: 'Stones',
    description: 'A ring of standing stones, marks smouldering on their faces, around a fire.',
    source: stones,
  },
  monolith: {
    name: 'Monolith',
    description: 'A brutalist hall and a black inverted pyramid in a shaft of light.',
    source: monolith,
  },
  canopy: {
    name: 'Canopy',
    description: 'Flat on the forest floor, looking up through swaying leaves.',
    source: canopy,
  },
  contour: {
    name: 'Contour',
    description: 'A survey map of breathing hills, with waypoints on the peaks.',
    source: contour,
  },
  aurora: {
    name: 'Aurora',
    description: 'Northern lights over a pine ridge. One cabin window is lit.',
    source: aurora,
  },
};

export const defaultScene = 'trapper';
export type SceneName = keyof typeof scenes | (string & {});

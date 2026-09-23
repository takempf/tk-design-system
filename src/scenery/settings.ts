import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

/**
 * Global scenery controls. Per-window look (scene, inks, dither, pixel size) comes
 * from CSS custom properties instead, so it follows the theme.
 */
export interface ScenerySettings {
  /** Scene clock multiplier. 0 freezes the scene without stopping scroll parallax. */
  readonly speed: number;
  readonly paused: boolean;
  /** How strongly scrolling moves the camera. */
  readonly parallax: number;
  /** 0 = hard posterized steps, 1 = full ordered dither. */
  readonly ditherStrength: number;
  /** Debug view of the pipeline stages. */
  readonly preview: 'final' | 'blurred' | 'scene';
}

export const defaultScenerySettings: ScenerySettings = {
  speed: 1,
  paused: false,
  parallax: 1,
  ditherStrength: 1,
  preview: 'final',
};

export const scenerySettings = createStore<ScenerySettings>()(() => defaultScenerySettings);

export const setScenerySettings = (patch: Partial<ScenerySettings>): void =>
  scenerySettings.setState(patch);

export const resetScenerySettings = (): void =>
  scenerySettings.setState(defaultScenerySettings, true);

export function useScenerySettings(): ScenerySettings;
export function useScenerySettings<T>(selector: (settings: ScenerySettings) => T): T;
export function useScenerySettings<T>(selector?: (settings: ScenerySettings) => T) {
  return useStore(scenerySettings, selector ?? ((settings) => settings as T));
}

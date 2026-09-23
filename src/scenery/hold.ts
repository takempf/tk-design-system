/*
  Kept apart from the renderer so motion can hold the scenery without importing
  it: an app that morphs but has no scenery never loads a shader.
*/

let holds = 0;

/** True while some transition has asked the scenery to stand still. */
export const sceneryHeld = (): boolean => holds > 0;

/**
 * Freeze the scenery's clock until `until` settles, so a transition's animation
 * gets the GPU to itself. `morph()` and `wipe()` do this already; call it around
 * view transitions of your own. Windows that mount meanwhile still paint.
 */
export function holdScenery(until: Promise<unknown>): void {
  holds++;
  const release = () => {
    holds--;
  };
  until.then(release, release);
}

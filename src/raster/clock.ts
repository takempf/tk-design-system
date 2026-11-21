type Frame = (time: number) => void;

/**
 * One animation loop at `fps` frames a second, shared by everything that subscribes: a
 * page of them runs one loop, and they all move on the same tick. `time` is in seconds.
 */
export function createClock(fps: number) {
  const frameMs = 1000 / fps;
  const frames = new Set<Frame>();
  let loop = 0;
  return function subscribe(frame: Frame): () => void {
    frames.add(frame);
    if (frames.size === 1) {
      let last = Number.NEGATIVE_INFINITY;
      loop = requestAnimationFrame(function tick(now) {
        loop = requestAnimationFrame(tick);
        if (now - last < frameMs) return;
        last = now;
        for (const draw of frames) draw(now / 1000);
      });
    }
    return () => {
      frames.delete(frame);
      if (frames.size === 0) cancelAnimationFrame(loop);
    };
  };
}

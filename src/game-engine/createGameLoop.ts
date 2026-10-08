export function createGameLoop(
  update: (delta: number) => void,
  render: () => void
) {
  let isRunning = false;
  let lastTime = 0;
  let rafId: number;

  const loop = (time: number) => {
    if (!isRunning) return;

    if (lastTime === 0) {
      lastTime = time;
    }

    // Clamp delta to avoid massive jumps if tab was suspended but not paused properly
    let delta = time - lastTime;
    if (delta > 100) delta = 16.66; // max 100ms delta, otherwise pretend 60fps

    update(delta);
    render();

    lastTime = time;
    rafId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      lastTime = 0;
      rafId = requestAnimationFrame(loop);
    },
    stop: () => {
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    },
    get isRunning() {
      return isRunning;
    }
  };
}

/** Keep the render deadline independent of late/jittery animation callbacks. */
export function createFramePacer() {
  let deadline = 0;
  let previousFps = 0;
  return {
    reset() {
      deadline = previousFps = 0;
    },
    shouldRender(now: number, fps: number, force = false) {
      const interval = 1000 / fps;
      // Wake immediately on interaction, resize, or a return from a hidden tab.
      if (force || fps !== previousFps) {
        previousFps = fps;
        deadline = now + interval;
        return true;
      }
      if (now < deadline - 1) return false;
      // Carry the remainder into the next frame instead of starting over at
      // `now`. Skip missed deadlines after a stall; never render a catch-up burst.
      deadline += Math.max(1, Math.floor((now - deadline) / interval) + 1) * interval;
      return true;
    },
  };
}

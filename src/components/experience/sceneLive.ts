/**
 * Pointer position, scroll progress and the time of the last interaction.
 * The page writes them; the 3D scene reads them every frame without a React render.
 */
export type SceneLive = {
  current: {
    x: number;
    y: number;
    hero: number;
    stamp: number;
    /**
     * A time the visitor is dragging the clock to, in thousands of years. The
     * scene follows it directly, without waiting for the page to re-render.
     */
    scrub: number | null;
  };
};

/** Starting values for a `SceneLive` ref. */
export const initialLive: SceneLive["current"] = {
  x: 0,
  y: 0,
  hero: 0,
  stamp: 0,
  scrub: null,
};

export function writeLive(
  live: SceneLive,
  patch: Partial<SceneLive["current"]>,
) {
  Object.assign(live.current, patch);
}

/** Tell the scene a visitor is interacting, so it renders at its full rate. */
export function touchLive(live: SceneLive) {
  live.current.stamp = performance.now();
}

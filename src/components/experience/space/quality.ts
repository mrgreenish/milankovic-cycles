export type GraphicsQuality = "low" | "medium" | "balanced" | "high";

/**
 * Tiers run from the full look down to a minimal one. `balanced` looks exactly
 * like `high` and only caps motion at 30 frames a second, so it is the first
 * step down and costs nothing visible.
 */
export const QUALITY = {
  low: { dpr: 1, fps: 30, segments: 48, detail: 0 },
  medium: { dpr: 1.25, fps: 30, segments: 64, detail: 1 },
  balanced: { dpr: 1.5, fps: 30, segments: 96, detail: 2 },
  high: { dpr: 1.5, fps: 60, segments: 96, detail: 2 },
} as const;

const LADDER: readonly GraphicsQuality[] = ["low", "medium", "balanced", "high"];

/** When nothing is moving fast, 30 frames a second is indistinguishable and half the work. */
export const IDLE_FPS = 30;
export const FRAME_MS_60 = 1000 / 60;

export type QualityHistory = {
  quality: GraphicsQuality;
  slowWindows: number;
  fastWindows: number;
  changes: number;
};

export type DeviceHints = {
  /** Phones and tablets: smaller GPUs, shared memory. */
  coarsePointer?: boolean;
  memoryGb?: number;
  cores?: number;
  /** A software renderer such as SwiftShader. */
  software?: boolean;
};

/** Desktop-class devices start at the full look; the rest start one step down. */
export function initialQuality(hints: DeviceHints = {}): QualityHistory {
  const quality: GraphicsQuality = hints.software
    ? "low"
    : hints.coarsePointer ||
        (hints.memoryGb ?? 8) <= 2 ||
        (hints.cores ?? 8) <= 2
      ? "medium"
      : "high";
  return { quality, slowWindows: 0, fastWindows: 0, changes: 0 };
}

const SLOW_WINDOWS = 3;
const FAST_WINDOWS = 8;

/**
 * Each window spans two seconds. Step down after 6 s of sustained pressure and
 * back up only after 16 s of headroom, and never from `balanced` to `high`:
 * its 30 fps cap hides how much room there really is. Timings are relative to
 * the display's own rhythm (`refreshMs`), so a screen capped at 30 Hz is not
 * mistaken for a struggling GPU.
 */
export function assessQuality(
  state: QualityHistory,
  frameMs: number,
  renderMs: number,
  refreshMs: number = FRAME_MS_60,
): QualityHistory {
  const slow = frameMs > refreshMs * 1.55 || renderMs > refreshMs * 1.15;
  const fast = frameMs < refreshMs * 1.15 && renderMs < refreshMs * 0.7;
  let slowWindows = slow ? state.slowWindows + 1 : 0;
  let fastWindows = fast ? state.fastWindows + 1 : 0;
  let index = LADDER.indexOf(state.quality);
  if (slowWindows >= SLOW_WINDOWS && index > 0) {
    index -= 1;
  } else if (
    fastWindows >= FAST_WINDOWS &&
    state.quality !== "balanced" &&
    index < LADDER.length - 1 &&
    state.changes < 4
  ) {
    index += 1;
  }
  const quality = LADDER[index];
  const changed = quality !== state.quality;
  if (changed) {
    slowWindows = 0;
    fastWindows = 0;
  }
  return {
    quality,
    slowWindows,
    fastWindows,
    changes: state.changes + Number(changed),
  };
}

/**
 * Texture sizes follow the tier, never the view. `full` turns true once the
 * first frame is on screen, which is when the sharper 4K day map is fetched.
 */
export function textureResolution(
  quality: GraphicsQuality,
  maxTextureSize: number,
  full: boolean,
) {
  const detail = quality === "low" || maxTextureSize < 2048 ? 1024 : 2048;
  const sharp =
    (quality === "high" || quality === "balanced") &&
    full &&
    maxTextureSize >= 4096;
  return { detail, day: sharp ? 4096 : detail };
}

export function animationDelta(seconds: number) {
  return Math.min(Math.max(seconds, 0), 0.05);
}

/** The display's frame interval: a low percentile of early frame gaps, kept in a sane range. */
export function refreshInterval(gaps: readonly number[]) {
  if (!gaps.length) return FRAME_MS_60;
  const sorted = [...gaps].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.2)];
  return Math.min(50, Math.max(FRAME_MS_60, low));
}

export type GraphicsQuality = "low" | "medium" | "high";

export const QUALITY = {
  low: { dpr: 1, fps: 30, segments: 40, detail: 0 },
  medium: { dpr: 1.25, fps: 60, segments: 64, detail: 1 },
  high: { dpr: 1.5, fps: 60, segments: 96, detail: 2 },
} as const;

export type QualityHistory = {
  quality: GraphicsQuality;
  slowWindows: number;
  fastWindows: number;
  changes: number;
};

export function initialQuality(): QualityHistory {
  return { quality: "medium", slowWindows: 0, fastWindows: 0, changes: 0 };
}

// Each window spans two seconds. Downgrade after 4 s of sustained pressure;
// upgrade only after 12 s of headroom. Stop probing after repeated instability.
export function assessQuality(
  state: QualityHistory,
  frameMs: number,
  renderMs: number,
): QualityHistory {
  const slow = frameMs > 22 || renderMs > 18;
  const fast = frameMs < 18.5 && renderMs < 11;
  let slowWindows = slow ? state.slowWindows + 1 : 0;
  let fastWindows = fast ? state.fastWindows + 1 : 0;
  let quality = state.quality;
  if (slowWindows >= 2 && quality !== "low") {
    quality = quality === "high" ? "medium" : "low";
  } else if (fastWindows >= 6 && quality !== "high" && state.changes < 4) {
    quality = quality === "low" ? "medium" : "high";
  }
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

export function textureResolution(
  quality: GraphicsQuality,
  closeUp: boolean,
  maxTextureSize: number,
) {
  const detail = quality === "low" || maxTextureSize < 2048 ? 1024 : 2048;
  return {
    detail,
    day:
      quality === "high" && closeUp && maxTextureSize >= 4096 ? 4096 : detail,
  };
}

export function animationDelta(seconds: number) {
  return Math.min(Math.max(seconds, 0), 0.05);
}

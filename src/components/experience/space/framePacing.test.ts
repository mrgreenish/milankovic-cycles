import { describe, expect, it } from "vitest";
import { createFramePacer } from "./framePacing";

describe("scene frame pacing", () => {
  it.each([60, 90, 120, 144])("keeps 60 fps on a %i Hz display", (hz) => {
    const pacer = createFramePacer();
    let rendered = 0;
    for (let i = 0; i < hz * 10; i++) {
      if (pacer.shouldRender((i * 1000) / hz, 60)) rendered++;
    }
    expect(rendered).toBeGreaterThanOrEqual(599);
    expect(rendered).toBeLessThanOrEqual(601);
  });

  it("does not lose the idle frame rate to alternating late callbacks", () => {
    const pacer = createFramePacer();
    let rendered = 0;
    for (let i = 0; i < 600; i++) {
      const now = (i * 1000) / 60 + (i % 4 === 2 ? 2 : 0);
      if (pacer.shouldRender(now, 30)) rendered++;
    }
    expect(rendered).toBe(300);
  });

  it("wakes immediately when the pointer raises the rate, even from paused motion", () => {
    const pacer = createFramePacer();
    expect(pacer.shouldRender(1000, 2)).toBe(true);
    expect(pacer.shouldRender(1016, 2)).toBe(false);
    expect(pacer.shouldRender(1033, 60)).toBe(true);
    expect(pacer.shouldRender(1040, 60)).toBe(false);
    expect(pacer.shouldRender(1050, 60)).toBe(true);
  });

  it("skips missed frames after a stall without a catch-up burst", () => {
    const pacer = createFramePacer();
    pacer.shouldRender(0, 30);
    expect(pacer.shouldRender(1005, 30)).toBe(true);
    expect(pacer.shouldRender(1010, 30)).toBe(false);
    expect(pacer.shouldRender(1033, 30)).toBe(true);
  });

  it("renders resized and newly visible canvases immediately", () => {
    const pacer = createFramePacer();
    pacer.shouldRender(0, 30);
    expect(pacer.shouldRender(5, 30, true)).toBe(true);
    pacer.reset();
    expect(pacer.shouldRender(10, 30)).toBe(true);
  });
});

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__ORBITAL_SCENE_TEST__ = { time: 12, quality: "medium" };
  });
});

test("all scene focuses render and share the unchanged orbital controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /shader|WebGL|texture/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.goto("/lab");
  const viewport = page.locator(".scene-viewport");
  const canvas = viewport.locator("canvas");
  await expect(viewport).toHaveAttribute("data-ready", "true", {
    timeout: 20000,
  });
  await expect(canvas).toHaveAttribute("data-texture-tier", "day-2048");
  for (const [id, focus] of [
    ["lab-eccentricity", "shape"],
    ["lab-obliquity", "tilt"],
    ["lab-precession", "direction"],
  ]) {
    await page.locator(`#${id}`).focus();
    await expect(page.locator(".stage")).toHaveAttribute("data-focus", focus);
    await page.locator(`#${id}`).press("End");
    await expect(viewport).toHaveAttribute("data-ready", "true");
    await page.locator(`#${id}`).press("Home");
    await expect(viewport).toHaveAttribute("data-ready", "true");
  }
  await page.getByRole("button", { name: "True shape", exact: true }).click();
  await expect(page).toHaveURL(/scale=actual/);
  await page.getByRole("button", { name: "Reset all", exact: true }).click();
  await expect(page.locator(".stage")).toHaveAttribute("data-focus", "combined");
  await page.getByRole("button", { name: "Stretched ×5", exact: true }).click();
  await expect(page).toHaveURL(/\/lab$/);
  expect(errors).toEqual([]);
});

test("compressed texture failure uses local image fallback", async ({
  page,
}) => {
  await page.route("**/textures/space/*.ktx2", (route) => route.abort());
  await page.goto("/lab");
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  const fetchedFallback = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .some((entry) => /day-2048\.webp/.test(entry.name)),
  );
  expect(fetchedFallback).toBe(true);
});

test("unrecoverable asset failure leaves a working poster and controls", async ({
  page,
}) => {
  await page.route("**/textures/space/**", (route) => route.abort());
  const assetAttempt = page.waitForRequest("**/textures/space/flow-noise.png");
  await page.goto("/lab");
  await assetAttempt;
  await expect(page.locator(".scene-viewport canvas")).toHaveCount(0, {
    timeout: 20000,
  });
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "false",
  );
  await expect(page.locator(".scene-viewport__poster")).toHaveCSS(
    "opacity",
    "1",
  );
  await page
    .getByRole("slider", { name: "Axis tilt", exact: true })
    .press("ArrowUp");
  await expect(
    page.getByRole("slider", { name: "Axis tilt", exact: true }),
  ).toHaveValue("23.45");
});

test("the poster stays visible until the baseline textures have rendered", async ({
  page,
}) => {
  let releaseAssets: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseAssets = resolve;
  });
  await page.route("**/textures/space/**", async (route) => {
    await gate;
    await route.continue();
  });
  const assetAttempt = page.waitForRequest("**/textures/space/flow-noise.png");
  await page.goto("/lab", { waitUntil: "domcontentloaded" });
  await assetAttempt;
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "false",
  );
  await expect(page.locator(".scene-viewport__poster")).toHaveCSS(
    "opacity",
    "1",
  );
  releaseAssets();
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
});

test("context loss reveals the poster", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  const supported = await page
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) => {
      const extension = canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context");
      if (!extension) return false;
      extension.loseContext();
      return true;
    });
  test.skip(
    !supported,
    "This browser does not expose deliberate context loss.",
  );
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "false",
  );
  await expect(page.locator(".scene-viewport canvas")).toHaveCount(0);
});

test("motion preferences preserve the poster and restore a ready scene", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  await expect(page.locator(".scene-viewport canvas")).toHaveCount(0);
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "false",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".scene-viewport__poster")).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator(".scene-viewport canvas")).toHaveCount(0);
});

test("offscreen rendering pauses and resumes", async ({ page }) => {
  await page.goto("/lab");
  const canvas = page.locator(".scene-viewport canvas");
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  // The sticky desktop panel can remain partly visible beside the footer.
  // Give the page enough scroll room to move its entire containing block out.
  await page.evaluate(() => {
    document.body.style.paddingBottom = "120vh";
    window.scrollTo(0, document.body.scrollHeight);
  });
  await expect(canvas).toHaveAttribute("data-animation", "paused");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(canvas).toHaveAttribute("data-animation", "running");
});

test("quality changes replace textures without retaining old GPU maps", async ({
  page,
}) => {
  await page.goto("/lab");
  const canvas = page.locator("canvas");
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page
    .locator("#lab-obliquity")
    .evaluate((element: HTMLElement) => element.focus({ preventScroll: true }));
  await page.evaluate(() => {
    window.__ORBITAL_SCENE_TEST__ = { time: 12, quality: "high" };
  });
  await expect(canvas).toHaveAttribute("data-texture-tier", "day-4096", {
    timeout: 20000,
  });
  await page.evaluate(() => {
    window.__ORBITAL_SCENE_TEST__ = { time: 12, quality: "low" };
  });
  await expect(canvas).toHaveAttribute("data-texture-tier", "day-1024", {
    timeout: 20000,
  });
  await expect(canvas).toHaveAttribute("data-textures", "5", {
    timeout: 10000,
  });
  await expect(canvas).toHaveAttribute("data-quality", "low");
  // Changing an orbital parameter re-renders Canvas. Its DPR prop must preserve
  // the low tier instead of silently restoring the initial medium resolution.
  await page.locator("#lab-obliquity").press("ArrowUp");
  await expect
    .poll(async () =>
      canvas.evaluate(
        (element: HTMLCanvasElement) =>
          element.width / element.getBoundingClientRect().width,
      ),
    )
    .toBeLessThanOrEqual(1.01);
});

test("pausing ambient motion keeps the controls and camera working", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lab");
  const canvas = page.locator(".scene-viewport canvas");
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Pause motion", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-motion", "paused");
  const frozen = await canvas.getAttribute("data-ambient-time");
  const frames = Number((await canvas.getAttribute("data-frames")) ?? 0);
  await page
    .getByRole("button", { name: "Most tilt · 24.5°", exact: true })
    .click();
  await expect(page.locator(".stage")).toHaveAttribute("data-focus", "tilt");
  await expect(page.getByRole("slider", { name: "Axis tilt" })).toHaveValue(
    "24.5",
  );
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-frames")))
    .toBeGreaterThan(frames);
  await expect(canvas).toHaveAttribute("data-ambient-time", frozen!);
  await page
    .getByRole("button", { name: "Resume motion", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-motion", "running");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-ambient-time")))
    .toBeGreaterThan(Number(frozen));
});

test("the title scene renders behind the headline", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await expect(page.locator(".stage")).toHaveAttribute("data-focus", "hero");
  await page.getByRole("link", { name: "Start the tour", exact: true }).click();
  await expect(page.locator(".stage")).toHaveAttribute("data-focus", "idea");
});

test("pointing at a title card previews that motion", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Hover on desktop");
  await page.goto("/");
  await expect(page.locator(".scene-viewport")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page
    .getByRole("navigation", { name: "Explore a cycle" })
    .getByRole("link", { name: /Stretch/ })
    .hover();
  await expect(page.locator(".stage")).toHaveAttribute("data-focus", "shape");
  await page.mouse.move(700, 100);
  await expect(page.locator(".stage")).toHaveAttribute("data-focus", "hero");
});

test("a rendered globe holds the place of the scene while it loads", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/textures/space/**", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const globe = page.locator(".globe-poster img");
  await expect(globe).toBeVisible();
  // naturalWidth is density-corrected for srcset images, so check the file itself.
  await expect
    .poll(() =>
      globe.evaluate(
        (img: HTMLImageElement) =>
          img.complete && img.naturalWidth > 0 && img.currentSrc,
      ),
    )
    .toMatch(/globe-poster-\d+\.webp$/);
  // It sits where the live Earth will: centred vertically in the stage.
  const box = (await globe.boundingBox())!;
  const stage = (await page.locator(".scene-viewport").boundingBox())!;
  expect(
    Math.abs(box.y + box.height / 2 - (stage.y + stage.height / 2)),
  ).toBeLessThan(stage.height * 0.08);
  await expect(page.locator(".scene-viewport")).toHaveAttribute("data-ready", "false");
  release();
  await expect(page.locator(".scene-viewport")).toHaveAttribute("data-ready", "true", {
    timeout: 20000,
  });
  await expect(page.locator(".scene-viewport__globe")).toHaveCSS("opacity", "0", {
    timeout: 5000,
  });
});

test("the scene idles at a lower frame rate and wakes when the pointer moves", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Pointer wake on desktop");
  await page.goto("/");
  const canvas = page.locator(".scene-viewport canvas");
  await expect(page.locator(".scene-viewport")).toHaveAttribute("data-ready", "true", {
    timeout: 20000,
  });
  await expect(canvas).toHaveAttribute("data-pace", "idle", { timeout: 10000 });
  await page.mouse.move(900, 400);
  await page.mouse.move(1000, 450, { steps: 5 });
  await expect(canvas).toHaveAttribute("data-pace", "full");
  await expect(canvas).toHaveAttribute("data-pace", "idle", { timeout: 10000 });
});

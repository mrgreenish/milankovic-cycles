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
    await expect(page.locator(".scene-guide")).toHaveAttribute(
      "data-focus",
      focus,
    );
    await page.locator(`#${id}`).press("End");
    await expect(viewport).toHaveAttribute("data-ready", "true");
    await page.locator(`#${id}`).press("Home");
    await expect(viewport).toHaveAttribute("data-ready", "true");
  }
  await page.getByRole("button", { name: "Actual Scale", exact: true }).click();
  await expect(page).toHaveURL(/scale=actual/);
  await page.getByRole("button", { name: "Reset All", exact: true }).click();
  await expect(page.locator(".scene-guide")).toHaveAttribute(
    "data-focus",
    "combined",
  );
  await page
    .getByRole("button", { name: "Exaggerated 5×", exact: true })
    .click();
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
  await page.getByLabel("Axis Tilt · Obliquity").press("ArrowUp");
  await expect(page.getByLabel("Axis Tilt · Obliquity")).toHaveValue("23.45");
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

import { expect, test, type Page } from "@playwright/test";
import {
  calculateSummerInsolation,
  PRESENT_PARAMETERS,
} from "../src/lib/orbital/insolation";
import { ORBITAL_CONTROLS, PARAMETER_KEYS } from "../src/lib/orbital/controls";
import { ORBITAL_MILESTONES } from "../src/lib/orbital/milestones";
import { labPath } from "../src/lib/orbital/query";

async function clearOfPinnedUI(page: Page, selector: string, tour: boolean) {
  await expect
    .poll(() =>
      page.locator(selector).evaluate((element, isTour) => {
        const rect = element.getBoundingClientRect();
        const narrow = innerWidth <= 980;
        const selectors = isTour
          ? [".site-header", ...(narrow ? [".story-stage"] : [])]
          : [
              ".site-header",
              ".lab-result",
              ...(narrow ? [".lab-stage"] : []),
            ];
        const bottom = Math.max(
          0,
          ...selectors.map((selector) => {
            const item = document.querySelector(selector)!;
            return getComputedStyle(item).position === "sticky"
              ? item.getBoundingClientRect().bottom
              : 0;
          }),
        );
        return rect.top >= bottom - 1 && rect.bottom <= innerHeight;
      }, tour),
    )
    .toBe(true);
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 844, height: 390 },
]) {
  test(`chapter links and keyboard controls stay clear at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#axis-tilt");
    await expect(page.locator("#axis-tilt h2")).toBeFocused();
    await clearOfPinnedUI(page, "#axis-tilt h2", true);
    for (const chapter of [
      "orbit-shape",
      "axis-direction",
      "together",
      "recap",
      "big-idea",
    ]) {
      if (viewport.width <= 980)
        await page.getByLabel("Jump to chapter").selectOption(chapter);
      else
        await page
          .locator(`.tour-progress__desktop a[href='#${chapter}']`)
          .click();
      await expect(page).toHaveURL(new RegExp(`#${chapter}$`));
      await clearOfPinnedUI(page, `#${chapter} h2`, true);
    }
    await page.goto("/lab");
    for (const id of ["lab-eccentricity", "lab-obliquity", "lab-precession"]) {
      await page.locator(`#${id}`).focus();
      await page.locator(`#${id}`).press("ArrowRight");
      await clearOfPinnedUI(page, `#${id}`, false);
    }
  });
}

test("the first Lab slider is visible without scrolling on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lab");
  await clearOfPinnedUI(page, "#lab-eccentricity", false);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `artifacts/polish/lab-mobile-${test.info().project.name}.png`,
  });
});

test("quick experiments update the scene, sunlight, and shared values together", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  for (const parameter of PARAMETER_KEYS) {
    for (const experiment of ORBITAL_CONTROLS[parameter].experiments) {
      await page
        .getByRole("button", { name: "Reset all", exact: true })
        .click();
      await page
        .getByRole("button", { name: experiment.label, exact: true })
        .click();
      await expect(page.locator(".stage")).toHaveAttribute(
        "data-focus",
        ORBITAL_CONTROLS[parameter].focus,
      );
      const parameters = {
        ...PRESENT_PARAMETERS,
        [parameter]: experiment.value,
      };
      const reading = calculateSummerInsolation(parameters);
      await expect(page.locator(".lab-result__reading strong")).toHaveText(
        String(Math.round(reading.dailyMeanTopOfAtmosphereWm2)),
      );
      await expect(page).toHaveURL(labPath(parameters, "5x"));
      await expect(
        page.getByRole("button", { name: experiment.label, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
    }
  }
  await page.getByRole("button", { name: "True shape", exact: true }).click();
  await expect(page).toHaveURL(/scale=actual/);
  await expect(page.locator(".lab-result__reading strong")).toHaveText(
    String(
      Math.round(
        calculateSummerInsolation({
          ...PRESENT_PARAMETERS,
          earthPerihelionLongitudeDeg: 90,
        }).dailyMeanTopOfAtmosphereWm2,
      ),
    ),
  );
});

test("presets survive reload and browser navigation restores the current Lab state", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  const preset = ORBITAL_MILESTONES[1];
  await page.getByRole("button", { name: new RegExp(preset.label) }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: new RegExp(preset.label) }),
  ).toHaveAttribute("aria-pressed", "true");
  const next = labPath({ ...PRESENT_PARAMETERS, obliquityDeg: 22.1 }, "actual");
  // Same-document navigation exercises Next's native history integration.
  await page.evaluate((url) => history.pushState({}, "", url), next);
  await expect(page.getByRole("slider", { name: "Axis tilt" })).toHaveValue(
    "22.1",
  );
  await page.goBack();
  await expect(
    page.getByRole("button", { name: new RegExp(preset.label) }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goForward();
  await expect(page.getByRole("slider", { name: "Axis tilt" })).toHaveValue(
    "22.1",
  );
  await expect(
    page.getByRole("button", { name: "True shape", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("explicit chapter navigation has history entries and carries settings to the Lab", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: "Start the tour", exact: true }).click();
  await page.locator("#big-idea .chapter-nav a[href='#orbit-shape']").click();
  await expect(page).toHaveURL(/#orbit-shape$/);
  await page.goBack();
  await expect(page).toHaveURL(/#big-idea$/);
  await expect(page.locator("#big-idea h2")).toBeFocused();
  await page.goForward();
  await expect(page).toHaveURL(/#orbit-shape$/);
  expect(await page.evaluate(() => Boolean(history.state.__NA))).toBe(true);
  await page
    .getByRole("button", { name: "Most stretched", exact: true })
    .click();
  for (const selector of [".site-nav--desktop", ".site-menu", ".site-footer"]) {
    await expect(page.locator(`${selector} a[href^='/lab']`)).toHaveAttribute(
      "href",
      /e=0.058000/,
    );
  }
  await page
    .getByRole("link", { name: "Continue in the lab", exact: true })
    .click();
  await expect(page).toHaveURL(/\/lab\?e=0.058000/);
  await expect(page.getByRole("slider", { name: "Orbit shape" })).toHaveValue(
    "0.058",
  );
});

test("mobile navigation dismisses on Escape, outside click, and route selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lab");
  const menu = page.locator(".site-menu");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open");
  await expect(menu.locator("summary")).toBeFocused();
  await menu.locator("summary").click();
  await page.getByRole("heading", { name: "Orbital lab", exact: true }).click();
  await expect(menu).not.toHaveAttribute("open");
  await menu.locator("summary").click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Learn", exact: true })
    .click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(menu).not.toHaveAttribute("open");
  await menu.locator("summary").click();
  await expect(
    page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Learn", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("scrolling updates the current chapter without adding history entries", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#orbit-shape");
  await expect(page.locator("#orbit-shape h2")).toBeFocused();
  const length = await page.evaluate(() => history.length);
  await page
    .locator("#axis-tilt")
    .evaluate((section) => section.scrollIntoView());
  await expect(page).toHaveURL(/#axis-tilt$/);
  expect(await page.evaluate(() => history.length)).toBe(length);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => history.length)).toBe(length);
});

test("copying a setup offers a usable link when clipboard access is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard unavailable");
        },
      },
    }),
  );
  await page.goto("/lab");
  await page
    .getByRole("button", { name: "Most stretched", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Copy link to this setup", exact: true })
    .click();
  const field = page.getByRole("textbox", { name: "Link to your settings" });
  await expect(field).toHaveValue(
    /https:\/\/milankovitchcycles.com\/lab\?e=0.058000/,
  );
  await field.focus();
  expect(
    await field.evaluate(
      (element: HTMLInputElement) =>
        element.selectionEnd! - element.selectionStart!,
    ),
  ).toBe((await field.inputValue()).length);
});

test("modified chapter clicks keep native new-tab behavior", async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop modified-click behavior");
  await page.goto("/");
  const opened = context.waitForEvent("page");
  await page
    .getByRole("link", { name: "Start the tour", exact: true })
    .click({ modifiers: [process.platform === "darwin" ? "Meta" : "Control"] });
  const second = await opened;
  await expect(second).toHaveURL(/#big-idea$/);
  await expect(page).toHaveURL(/\/$/);
  await second.close();
});

test("keyboard edits announce the result and disclosures open with Enter", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  const tilt = page.getByRole("slider", { name: "Axis tilt", exact: true });
  await tilt.press("End");
  await expect(tilt).toHaveAttribute("aria-valuetext", "24.60°");
  const result = Math.round(
    calculateSummerInsolation({ ...PRESENT_PARAMETERS, obliquityDeg: 24.6 })
      .dailyMeanTopOfAtmosphereWm2,
  );
  await expect(
    page
      .locator(".parameter-control")
      .filter({ has: tilt })
      .locator(".sr-only[role='status']"),
  ).toContainText(`${result} watts per square metre`);
  const summary = page.locator(".lab-method summary");
  await summary.press("Enter");
  await expect(page.locator(".lab-method")).toHaveAttribute("open", "");
  await expect(
    page.getByText("The result is the daily average of sunlight", {
      exact: false,
    }),
  ).toBeVisible();
  await summary.press("Enter");
  await expect(page.locator(".lab-method")).not.toHaveAttribute("open");
});

test("the Sources table exposes headers and scrolls with the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sources");
  const region = page.getByRole("region", { name: /Orbital reference values/ });
  await region.focus();
  await expect(region).toBeFocused();
  await expect(
    page.getByRole("columnheader", { name: "Obliquity", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("rowheader", { name: "Today’s reference", exact: true }),
  ).toHaveCount(1);
  await region.press("ArrowRight");
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  const bounds = await region.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(60);
});

test("the clock moves the lab to a date and keeps it in the URL", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  await page
    .getByRole("button", { name: "Peak of the last ice age", exact: true })
    .click();
  await expect(page).toHaveURL(/\/lab\?t=-21/);
  await expect(page.locator(".lab-result__reading strong")).toHaveText("470");
  await expect(
    page.getByRole("button", { name: /Last glacial maximum/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const clock = page.getByRole("slider", { name: /^Time/ });
  await clock.press("ArrowRight");
  await expect(clock).toHaveValue("-20");
  await expect(page).toHaveURL(/t=-20/);
  // Moving a slider hands control back from the date to the sliders.
  await page.getByRole("slider", { name: "Axis tilt", exact: true }).press("End");
  await expect(page).toHaveURL(/o=24\.6/);
  await expect(page).not.toHaveURL(/t=/);
});

test("the tour clock plays and stops with the chapter", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#together");
  const play = page.getByRole("button", { name: "Play the clock" });
  await play.click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.getByRole("slider", { name: /^Time/ }).inputValue(),
    )
    .not.toBe("0");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(play).toBeVisible();
});

test("dragging across the stage changes the active slider", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Pointer drag on desktop");
  await page.goto("/lab");
  const slider = page.getByRole("slider", { name: "Axis tilt", exact: true });
  await slider.focus();
  const before = Number(await slider.inputValue());
  const drag = page.locator(".stage__drag");
  const box = (await drag.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, {
    steps: 8,
  });
  await page.mouse.up();
  expect(Number(await slider.inputValue())).toBeGreaterThan(before + 0.2);
});

test("temperature and ice follow the orbit, and a date shows the measured record", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab");
  const temperature = page.locator(".lab-result__temperature strong");
  const tilt = page.getByRole("slider", { name: "Axis tilt", exact: true });
  await expect(temperature).toHaveText("0.0 °C");
  // Less tilt, weaker summers: colder, with ice that would grow.
  await tilt.press("Home");
  await expect(temperature).toHaveText(/^−\d\.\d °C$/);
  await expect(page.locator(".lab-climate__estimate")).toContainText(
    "If this orbit lasted about 15,000 years: ice sheets would grow",
  );
  // More tilt, stronger summers: a little warmer, a little ice lost.
  await tilt.press("End");
  await expect(temperature).toHaveText(/^\+0\.\d °C$/);
  await expect(page.locator(".lab-climate__estimate")).toContainText("some of today’s ice would melt");
  // A past date reports the sea-floor record instead.
  await page.getByRole("button", { name: "Peak of the last ice age", exact: true }).click();
  await expect(temperature).toHaveText("−5.7 °C");
  await expect(page.locator(".lab-climate__estimate")).toContainText("Measured in sea-floor sediment");
});

test("the climate globe shows ice and temperature beside the orbit", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop-sized stage");
  await page.goto("/lab?t=-21");
  await expect(page.locator(".scene-viewport")).toHaveAttribute("data-ready", "true", {
    timeout: 20000,
  });
  const globe = page.locator(".climate-globe");
  await expect(globe).toBeVisible();
  await expect(globe).toContainText("−5.7 °C");
  await expect(globe).toContainText("ice at 94% of its peak");
});

test("dragging the clock stays smooth, settles quickly and spins within a limit", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Pointer drag on desktop");
  await page.addInitScript(() => {
    const samples: { t: number; time: number; spin: number }[] = [];
    (window as unknown as { __clock: typeof samples }).__clock = samples;
    window.__ORBITAL_SCENE_TEST__ = {
      quality: "high",
      probe: (frame) => {
        const f = frame as { time: number; spin: number };
        samples.push({ t: performance.now(), time: f.time, spin: f.spin });
      },
    };
  });
  await page.goto("/lab");
  await expect(page.locator(".scene-viewport")).toHaveAttribute("data-ready", "true", {
    timeout: 20000,
  });
  const plot = page.locator(".timeline__plot");
  await plot.scrollIntoViewIfNeeded();
  const box = (await plot.boundingBox())!;
  await page.evaluate(() => ((window as unknown as { __clock: unknown[] }).__clock.length = 0));
  await page.mouse.move(box.x + box.width * 0.9, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + 40, { steps: 30 });
  const released = await page.evaluate(() => performance.now());
  await page.mouse.up();
  await page.waitForTimeout(2600);
  const recorded = await page.evaluate(
    () => (window as unknown as { __clock: { t: number; time: number; spin: number }[] }).__clock.slice(),
  );
  // The clock snaps to the first dragged date when it takes over; judge from there.
  const samples = recorded.slice(Math.max(0, recorded.findIndex((s) => s.time !== recorded[0].time)));
  // The clock only ever moves backward through time here, and apart from the
  // one skip that follows a long scrub, no frame jumps far.
  let skips = 0;
  let turn = 0;
  for (let i = 1; i < samples.length; i++) {
    const step = samples[i - 1].time - samples[i].time;
    expect(step).toBeGreaterThanOrEqual(-1e-6);
    if (step > 6) skips++;
    const spun = Math.abs(
      Math.atan2(
        Math.sin(samples[i].spin - samples[i - 1].spin),
        Math.cos(samples[i].spin - samples[i - 1].spin),
      ),
    );
    turn = Math.max(turn, spun);
  }
  expect(skips).toBeLessThanOrEqual(1);
  // It reaches the dragged date (about −530 kyr) within two seconds of release.
  // A scene step covers at most 0.05 s, in which Earth may turn 13.5° at its
  // 270° a second limit.
  const landed = samples.find((s) => s.t > released && s.time < -520);
  expect(landed, "the clock reached the dragged date").toBeTruthy();
  expect(landed!.t - released).toBeLessThan(2200);
  expect(samples.at(-1)!.time).toBeLessThan(-520);
  expect(turn).toBeLessThan((14.2 * Math.PI) / 180);
});

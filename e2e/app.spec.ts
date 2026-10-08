import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`tour fits ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      nestedScrollers: [...document.querySelectorAll("main *")].filter(
        (element) => {
          const style = getComputedStyle(element);
          return (
            element.scrollHeight > element.clientHeight + 4 &&
            (style.overflowY === "auto" || style.overflowY === "scroll")
          );
        },
      ).length,
    }));

    expect(layout.scrollWidth).toBe(layout.clientWidth);
    expect(layout.nestedScrollers).toBe(0);
    if (viewport.width === 1440 && testInfo.project.name === "desktop") {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: "artifacts/polish/hero-desktop.png" });
    }
    await expect(
      page.getByRole("heading", { name: "Why do ice ages come and go?" }),
    ).toBeVisible();
  });
}

test("tour navigation updates hash and focuses the destination", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start the tour" }).click();
  await expect(page).toHaveURL(/#big-idea$/);
  await expect(
    page.getByRole("heading", { name: "Summer decides whether ice grows" }),
  ).toBeFocused();
});

test("malformed Lab state resets safely and remains shareable", async ({
  page,
}) => {
  await page.goto("/lab?e=bad&o=99&p=-1&scale=bad");
  await expect(
    page.getByRole("status").filter({ hasText: "reset to today’s reference" }),
  ).toBeVisible();
  const tilt = page.getByRole("slider", { name: "Axis tilt", exact: true });
  await expect(tilt).toHaveValue("23.44");
  // Invalid values reset to the present-day default, whose canonical URL is bare /lab.
  await expect(page).toHaveURL(/\/lab$/);
  // Once the state differs from the default, it is captured in the URL again.
  await tilt.press("ArrowUp");
  await expect(page).toHaveURL(/o=23\.45/);
});

for (const route of ["/", "/lab", "/about", "/faq", "/sources"]) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(serious).toEqual([]);
  });
}

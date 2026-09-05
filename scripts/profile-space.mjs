// Run against a production server: SPACE_BASE_URL=http://127.0.0.1:3000 npm run graphics:profile
// Screenshots freeze decorative time; performance samples use real animation.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus, platform, release } from "node:os";

const baseURL = process.env.SPACE_BASE_URL ?? "http://127.0.0.1:3000";
const out = "artifacts/graphics";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: process.platform === "darwin" ? "chrome" : undefined,
  args:
    process.platform === "darwin"
      ? ["--use-angle=metal", "--enable-webgl", "--ignore-gpu-blocklist"]
      : ["--enable-unsafe-swiftshader"],
});
const report = {
  host: { cpu: cpus()[0].model, os: `${platform()} ${release()}` },
  browser: browser.version(),
  baseURL,
  samples: [],
  errors: [],
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
});
// Avoid unrelated analytics requests while checking the local rendering path.
await context.route("**/_vercel/insights/**", (route) =>
  route.fulfill({ status: 200, body: "" }),
);
const page = await context.newPage();
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
await page.goto(`${baseURL}/lab`);
await page
  .locator('.scene-viewport[data-ready="true"]')
  .waitFor({ timeout: 30000 });
report.renderer = await page.locator("canvas").evaluate((canvas) => {
  const gl = canvas.getContext("webgl2");
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return ext
    ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);
});

async function focus(name) {
  if (name === "combined") {
    await page
      .getByRole("button", { name: "Reset All", exact: true })
      .evaluate((button) => button.click());
  } else {
    const id = {
      shape: "lab-eccentricity",
      tilt: "lab-obliquity",
      direction: "lab-precession",
    }[name];
    await page
      .locator(`#${id}`)
      .evaluate((element) => element.focus({ preventScroll: true }));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  await page.setViewportSize(viewport);
  for (const view of ["combined", "shape", "tilt", "direction"]) {
    await page.evaluate(() => {
      window.__ORBITAL_SCENE_TEST__ = { time: 12, quality: "high" };
    });
    await focus(view);
    await page.waitForTimeout(1800);
    if (view === "tilt")
      await page
        .locator('canvas[data-texture-tier="day-4096"]')
        .waitFor({ timeout: 20000 });
    await page.screenshot({ path: `${out}/${viewport.width}-${view}.png` });
  }
}

for (const setup of [
  { name: "desktop-overview", width: 1440, height: 1000, view: "combined" },
  { name: "desktop-earth", width: 1440, height: 1000, view: "tilt" },
  { name: "mobile-viewport-earth", width: 390, height: 844, view: "tilt" },
  {
    name: "low-quality-earth",
    width: 390,
    height: 844,
    view: "tilt",
    quality: "low",
  },
]) {
  await page.setViewportSize({ width: setup.width, height: setup.height });
  await page.evaluate((quality) => {
    window.__ORBITAL_SCENE_TEST__ = quality ? { quality } : {};
  }, setup.quality);
  await focus(setup.view);
  await page.waitForTimeout(16000); // warm-up and allow adaptive quality to settle
  const sample = await page.evaluate(async () => {
    const canvas = document.querySelector("canvas");
    const samples = [];
    const start = performance.now();
    for (let i = 0; i < 15; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      samples.push({
        atMs: Math.round(performance.now() - start),
        ...canvas.dataset,
        width: canvas.width,
        height: canvas.height,
      });
    }
    return samples;
  });
  report.samples.push({ ...setup, samples: sample });
  console.log(`${setup.name}: ${sample.map((s) => s.fps).join(", ")} fps`);
}

report.assets = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .filter((entry) =>
      /\/textures\/space\/|\/decoders\/basis\//.test(entry.name),
    )
    .map((entry) => ({
      name: new URL(entry.name).pathname,
      bytes: entry.encodedBodySize,
      durationMs: Math.round(entry.duration),
    })),
);
await writeFile(
  `${out}/performance.json`,
  JSON.stringify(report, null, 2) + "\n",
);
await browser.close();
console.log(`Report and screenshots: ${out}`);
if (report.errors.length) {
  console.error(report.errors);
  process.exitCode = 1;
}

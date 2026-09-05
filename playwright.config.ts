import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        // WebGL needs an explicit backend in automated Chromium. On macOS use
        // installed Chrome + Metal; CI uses software WebGL for correctness only.
        channel: process.platform === "darwin" ? "chrome" : undefined,
        launchOptions: {
          args:
            process.platform === "darwin"
              ? [
                  "--use-angle=metal",
                  "--enable-webgl",
                  "--ignore-gpu-blocklist",
                ]
              : ["--enable-unsafe-swiftshader"],
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

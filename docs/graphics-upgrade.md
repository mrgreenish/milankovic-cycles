# Cinematic orbital graphics

The shared Tour/Lab scene now renders a textured Earth and animated Sun. The UI, keyboard controls, shared URLs, orbital calculations, parameter ranges, and instructional guides are unchanged. Camera angles remain familiar; overview distance now adapts to the panel aspect ratio so the orbit fits narrow desktop columns.

## Rendering

- Earth: satellite color, packed terrain normals/ocean mask, sun-relative day/night shading, ocean highlights, modern city lights, cloud shadows, and a thin twilight atmosphere.
- Weather: a separate cloud shell with slow differential drift and bounded noise distortion. This is illustrative weather, not a live feed or a climate simulation.
- Sun: animated granulation, darker active regions, limb darkening, a local corona, and lightweight prominence ribbons. Sparse deterministic stars add depth.
- Local mipmapped KTX2 textures with WebP fallbacks. A per-renderer reference-counted cache shares maps, retains the current bundle during upgrades, and disposes replaced GPU resources. No third-party imagery requests occur in the browser.
- No full-screen postprocessing, shadow maps, volumetric raymarching, or new runtime dependencies. Animation updates shader uniforms and object transforms outside React rendering.

Source credits, geographic limitations, and the reproducible texture pipeline are documented in [the texture README](../public/textures/space/README.md).

## Adaptive quality and resilience

| Tier | Maximum DPR | Render cap | Surface maps | Decorative detail |
| --- | ---: | ---: | --- | --- |
| Low | 1 | 30 fps | 1K | Fewer sphere segments; no prominences, cloud shadow, or terrain perturbation |
| Medium | 1.25 | 60 fps | 2K | Terrain detail, cloud shadow, one prominence |
| High | 1.5 | 60 fps | 2K; 4K day map only in close-up | More sphere segments, cirrus detail, three prominences |

The scene starts at medium. Two-second sampling windows downgrade after sustained pressure and upgrade only after sustained headroom, with warm-up periods and limited upward probes. Resolution remains consistent when controls or views change. Rendering pauses when the canvas is offscreen or the document is hidden; animation deltas are clamped on resume.

The existing poster stays visible until a textured frame has rendered. Reduced motion uses the poster. Unsupported WebGL, shader/context failure, or failure of both texture formats also leaves the poster and controls usable. Failure of an optional higher-resolution bundle retains the working textures.

## Production measurements

Captured September 5, 2026 against `next start`, Chrome 152.0.7977.76, ANGLE Metal, Apple M1 Pro, Darwin 25.6.0. Each view warmed up for 16 seconds and then ran for 30 seconds, sampled in fifteen two-second windows. Other graphics test sessions were closed during profiling.

| View / CSS viewport | Tier | Canvas pixels | Average fps | Observed fps range | Draw calls | Triangles |
| --- | --- | --- | ---: | --- | ---: | ---: |
| Overview / 1440×1000 | High | 907×1305 | 60.0 | 60.0–60.0 | 13 | 32,078 |
| Earth close-up / 1440×1000 | High | 907×1305 | 60.0 | 60.0–60.0 | 11 | 28,988 |
| Earth close-up / 390×844 | High | 558×503 | 60.0 | 60.0–60.0 | 11 | 28,988 |
| Earth close-up / 390×844 | Forced low | 372×335 | 30.03 | 29.8–30.3 | 11 | 6,476 |

All views settled at five live GPU textures. Average CPU render-submission time was 0.69–1.02 ms; this is **not** a GPU timer measurement. No shader, page, or console errors were captured.

Initial compressed scene imagery, noise, and decoder transferred 1,839,289 bytes (1.84 MB of encoded response bodies). The optional 4K day map adds 671,499 bytes. These figures exclude application JavaScript, fonts, HTML, and HTTP headers. All shipped texture variants, fallbacks, and decoder files occupy about 6 MB on disk; a browser does not request every tier at startup.

Mobile-sized measurements above use the same M1 Pro GPU, not physical phone hardware. WebKit iPhone emulation verifies rendering and behavior, but a real low-end phone thermal/battery benchmark remains unmeasured. FPS figures are capped frame-submission cadence over this short run, not a claim about every device or worst-case GPU latency.

## Verification and reproduction

```sh
npm run check
# In another terminal after the production build:
npm run start -- --hostname 127.0.0.1 --port 3000
npx playwright test e2e/graphics.spec.ts --workers=1
npm run graphics:profile
```

`npm run check` passes lint, TypeScript, all 17 unit tests, and the production build. All 16 graphics tests pass across desktop Chrome and mobile WebKit. They cover all focuses and parameter extremes, both scale modes, reset, format fallback, total/slow asset failure, context loss, reduced-motion changes, offscreen pause/resume, GPU texture replacement, and DPR retention after control changes. All four Tour focuses were also checked at 1440px and 390px widths: each rendered successfully with no page errors.

The existing application suite passes 23 of 26 checks against the production build. Three checks fail outside the changed graphics path:

- Mobile `/sources` accessibility: the horizontally scrollable `.source-table-wrap` is not keyboard-focusable (`scrollable-region-focusable`).
- Malformed Lab URLs fail to normalize to `/lab` in both browsers. Parameter values reset correctly, but the address remains malformed. This reproduces with reduced motion and no WebGL renderer, with no page or network errors.

The Lab URL logic, sources page, and their CSS were not changed by this graphics work. These failures are recorded rather than treating the broader suite as passing.

`graphics:profile` writes screenshots for all four Lab views at desktop/mobile widths and raw measurements to the git-ignored `artifacts/graphics/` directory. Decorative animation is frozen for screenshots only; performance measurements use real animation. The local `comparison.md` includes an untouched baseline capture from `358c831` and the upgraded view. On non-macOS CI, software WebGL is used for correctness checks only; its performance is not representative of hardware rendering.

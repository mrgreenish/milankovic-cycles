# Milanković Cycles

A 3D tour of the orbital cycles behind the ice ages, with a lab for changing them yourself. Live at [milankovitchcycles.com](https://milankovitchcycles.com).

The tour introduces three slow changes in Earth's orbit — its shape (eccentricity), the lean of its axis (obliquity) and the direction the axis points (precession) — then runs them together over 800,000 years next to the measured ice record. The lab calculates midsummer sunlight at 65°N for any combination, or for any date in the La2004 orbit solution.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Node 20.9 or newer.

| Command | What it does |
| --- | --- |
| `npm run check` | Lint, typecheck, unit tests and a production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright; needs a running dev server or builds one) |
| `npm run series:build -- <past> <future> <ice>` | Rebuild the orbit and ice series (see below) |
| `npm run poster:build [url]` | Re-render the loading globe (`public/images/globe-poster-*.webp`) from a running server. Rerun it whenever the title camera or Earth look changes |
| `npm run textures:build -- <dir>` | Rebuild the Earth textures (see `public/textures/space/README.md`) |
| `npm run graphics:profile` | Frame-rate and asset report against a production server |

## How it is built

- **Next.js (App Router), React, TypeScript.** The tour is `src/app/page.tsx`; the lab is `src/components/lab/LabExperience.tsx`.
- **One 3D stage.** `src/components/experience/Stage.tsx` hosts a React Three Fiber scene (`SceneClient.tsx`, `space/`). Orbit parameters are eased in a shared frame (`space/SceneState.tsx`), so moving a slider or playing the clock does not re-render the scene. The look stays at full quality; only frame rate adapts (30 fps when nothing moves, 60 when it does), and the tier steps down only after six seconds of real slowness. While the scene loads, a pre-rendered frame of the title globe holds its place. A still SVG diagram replaces the scene for reduced motion or if WebGL fails.
- **Orbit maths** lives in `src/lib/orbital/`: daily insolation (`insolation.ts`), orbit geometry (`geometry.ts`), the shared reducer (`state.ts`) and the time series (`timeline.ts`). The tour and the lab share the same reducer and URL format (`/lab?e=…&o=…&p=…` or `/lab?t=-21`).
- **Data.** `series.generated.ts` holds the La2004 nominal solution at 1,000-year steps from 800,000 years ago to 100,000 years ahead. `iceRecord.generated.ts` holds the LR04 benthic δ¹⁸O stack. Both are generated, not edited:

  ```bash
  # past:   https://ssp.imcce.fr/insola/earth/online/earth/La2004/INSOLN.LA2004.BTL.ASC
  # future: https://ssp.imcce.fr/insola/earth/online/earth/La2004/INSOLP.LA2004.BTL.ASC
  # ice:    https://lorraine-lisiecki.com/LR04stack.txt
  npm run series:build -- INSOLN.LA2004.BTL.ASC INSOLP.LA2004.BTL.ASC LR04stack.txt
  ```

  Only the first ~110 KB of the past file and ~27 KB of the future file are needed.

## Sources

Laskar et al. (2004), La2004 orbital solution. Lisiecki and Raymo (2005), LR04 stack. Hays, Imbrie and Shackleton (1976). Earth imagery from NASA Earth Observatory. The full list, with equations and limits, is on the site's [Sources page](https://milankovitchcycles.com/sources).

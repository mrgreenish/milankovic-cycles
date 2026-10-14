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

## Languages

The site is available in English (the default, served at the root), Dutch (`/nl`) and Serbian in Latin script (`/sr`). A quiet language code in the header and a row of links in the footer switch language and keep the page, the lab's settings and the hash.

- **Routing.** Every page lives in `src/app/[locale]/`. English has no prefix: `next.config.ts` rewrites root addresses to the `/en` tree and redirects `/en/...` back to the root, so there is one address per page and language.
- **Text.** `src/i18n/ui/` holds interface text (controls, readouts, scene labels) and is shared with client components through `LocaleProvider`. `src/i18n/content/` holds page copy (`en.ts`, `nl.ts`, `sr.ts`) and the learn guides (`topics-*.ts`). The English files are the template: other languages must match their shape, which TypeScript and `src/i18n/i18n.test.ts` check, including that `{placeholders}` stay the same.
- **Numbers.** Helpers in `src/lib/orbital` take an optional `ui` argument (English by default) so the decimal mark, years and sentences follow the language.
- **Adding a language.** Add the code to `LOCALES` and its names in `src/i18n/config.ts`, then add `ui/<code>.ts`, `content/<code>.ts` and `content/topics-<code>.ts` and register them in the two `index.ts` files.

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

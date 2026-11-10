# Milanković Cycles

A 3D tour of the orbital cycles behind the ice ages, with a lab for changing them yourself. Live at [milankovitchcycles.com](https://milankovitchcycles.com).

The tour introduces three slow changes in Earth's orbit — its shape (eccentricity), the lean of its axis (obliquity) and the direction the axis points (precession) — then runs them together over 800,000 years next to the measured ice record. The lab calculates midsummer sunlight at 65°N for any combination, or for any date in the La2004 orbit solution.

## Run it

```bash
nvm install
nvm use
npm install
npm run dev        # http://localhost:3000
```

Use Node 24.22.1 or newer in the 24.x line (`.nvmrc` selects 24.22.1). Node 22.23.4 or newer in the 22.x line is also supported. These minimum versions include the October 2026 Node.js security fixes.

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

## Link previews

Every page has a 1200×630 preview card for chat apps, school platforms and social sites, in its own language: the page title beside the title globe, and the portrait on About only.

- **What a card shows** is decided in `src/lib/social/cards.ts`; `pageMetadata()` in `src/i18n/page.ts` writes the `og:` and `twitter:` tags that point at it. A page added to the sitemap needs a card there, which `src/lib/social/cards.test.ts` checks.
- **Drawing.** `src/app/[locale]/card/[card]/route.tsx` draws the cards with `next/og` (`src/lib/social/cardArt.tsx`) at `/card/home.jpg`, `/nl/card/learn-precession.jpg` and so on. The page cards are drawn during the build and served as static files. They use the globe from `npm run poster:build`, so they follow it when it is re-rendered.
- **Shared lab links.** `/lab?t=-21` and `/lab?e=…&o=…&p=…` preview with the date or “a hand-set orbit”, the midsummer sunlight and, for a date, the measured ice (`src/lib/social/labShare.ts`). `/lab` itself is one static page, so rewrites in `next.config.ts` serve a full page load of such a link from `src/app/[locale]/lab/setup/`, a copy of the page with that preview. Each setup's page and card are made on the first request and then kept until the next deployment: one function run each, and static after that. A date has its own card; hand-set orbits share one card per W/m² reading.

## Sources

Laskar et al. (2004), La2004 orbital solution. Lisiecki and Raymo (2005), LR04 stack. Hays, Imbrie and Shackleton (1976). Earth imagery from NASA Earth Observatory. The full list, with equations and limits, is on the site's [Sources page](https://milankovitchcycles.com/sources).

# Tour and Lab polish

Implemented September 28, 2026.

The opening now pairs its explanation with an SVG orbital diagram and three chapter previews. Each cycle puts an experiment and its sunlight result ahead of optional supporting detail. The Lab starts with its scene, result, and controls; historical presets and calculation details follow.

Tour and Lab use the same slider ranges, quick experiments, and result formatting. The tour's header, opening, recap, and footer Lab links carry the current parameters. Explicit chapter navigation adds history entries; ordinary scrolling updates the current entry. Shared Lab URLs recover malformed fields, normalize their URL, identify matching presets, and synchronize with browser navigation.

The scene retains one WebGL canvas and adaptive quality. Separate diagram captions, stronger reference outlines, season labels, a highlighted summer position, and a larger tilt close-up improve comparisons. Pausing ambient motion leaves controls and camera transitions usable. Reduced motion and graphics failures use the interactive SVG diagram.

The copy pass covers the Tour, Lab, About, Learn, Educators, FAQ, Sources, metadata, loading, and error states. Scientific calculations, La2004 fixture values, routes, and canonical URLs are preserved. Obliquity is defined from the perpendicular to the orbital plane, consistent with [NASA's explanation](https://apod.nasa.gov/apod/ap170705.html). J2000 comparisons and the distinction between sunlight and climate predictions remain explicit.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 28 tests passed, including the existing scientific fixtures.
- `npm run build`: passed, generating all 17 static pages. The existing multiple-lockfile workspace-root warning remains.
- Production browser verification: 73 distinct checks passed across Chrome and mobile WebKit. One desktop-only modified-click check is intentionally skipped in the mobile project. The full initial run passed 69 checks; the final four keyboard checks passed after adding explicit horizontal scrolling for Safari. The Sources accessibility audit was rerun after that fix.
- Responsive checks cover 320×568, 390×844, 412×915, 768×1024, 844×390, and 1440×900. Chapter headings and focused controls clear the complete sticky stack. At 390×844 the first Lab slider occupies approximately y=584–628 without scrolling.
- Browser flows cover all quick experiments, resets, scale switching, presets, reloaded links, malformed URLs, Back/Forward, chapter history, modified clicks, menu dismissal, clipboard fallback, and Tour-to-Lab transfer.
- Graphics checks cover slow textures, compressed-image fallback, total asset failure, context loss, adaptive quality, reduced motion, offscreen suspension, and ambient pause.
- Accessibility checks cover keyboard navigation and sliders, live result announcements, disclosure controls, table headers, and horizontal keyboard scrolling. Axe reported no serious or critical violations on the audited Tour, Lab, About, FAQ, and Sources routes. Accessibility-tree semantics were inspected; this is not a manual VoiceOver or NVDA certification.
- Reviewed against the [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Sentence case and About's first-person voice follow this project's explicit direction.

## Preview captures

Generated browser artifacts are in the ignored `artifacts/polish/` directory:

- `hero-desktop.png`: desktop opening.
- `lab-mobile-mobile.png`: 390×844 mobile WebKit Lab, including the usable SVG while graphics load.
- `lab-mobile-desktop.png`: the same viewport in Chrome.

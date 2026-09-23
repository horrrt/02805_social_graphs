---
name: Site code
description: Rules for the HTML, CSS and JavaScript of the course website, and its tests.
applyTo: "docs/**,tests/**"
---

# Site code

- The site is static HTML, CSS and ES modules with no build step. Keep it that way.
- Draw charts with the vendored ECharts build (`docs/assets/vendor/echarts-5.5.1.min.js`), which the week 4 page
  loads once before its modules.
- Take colours from CSS custom properties with `getComputedStyle`, as `docs/assets/js/week04-staffing.js`
  does. A hex colour in a new JavaScript file fails `tests/theme.test.mjs`.
- Load data with `fetch(new URL("…", import.meta.url))` so paths work both locally and on GitHub Pages.
- Build for desktop. Do not add phone layouts.
- Every chart needs a hover tooltip, a caption that says how to read it, and a table or text alternative.
- Label a few marks, not all of them. Let ECharts hide overlapping labels (`labelLayout: { hideOverlap: true }`).
- Keep existing element IDs, anchors and routes: other sections and tests link to them.
- When you add a page or change the lobby, update `docs/assets/js/weeks.js` and run
  `node --test 'tests/*.test.mjs'`.

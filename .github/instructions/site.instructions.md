---
name: Site code
description: Rules for the HTML, CSS and JavaScript of the course website, and its tests.
applyTo: "docs/**,tests/**"
---

# Site code

- The site is static HTML, CSS and ES modules with no build step. Keep it that way.
- Add any library or component the page needs, or draw plain SVG from the page's data: charting (ECharts, D3,
  Vega-Lite, Observable Plot, deck.gl), maps, tables, UI widgets, web components or anything else. No approval
  needed. Vendor a library first: save the unmodified minified build to `docs/assets/vendor/` with the version in
  the filename and add a row to `docs/assets/vendor/README.md`. ECharts 5.5.1, D3 7.9.0, globe.gl 2.32.0 and
  deck.gl 9.0.30 are already there.
- Take colours from CSS custom properties with `getComputedStyle`, as `docs/assets/js/week04-staffing.js`
  does. A hex colour in a new JavaScript file fails `tests/theme.test.mjs`.
- Load data with `fetch(new URL("…", import.meta.url))` so paths work both locally and on GitHub Pages.
- Build for desktop. Do not add phone layouts.
- Every chart needs a hover tooltip, a caption that says how to read it, and a table or text alternative.
- Label a few marks, not all of them. Hide overlapping labels (in ECharts, `labelLayout: { hideOverlap: true }`).
- Draw every real-against-random result on a page with the same chart, so a reader learns it once. Week 4
  uses `docs/assets/js/week04-strip.js`: the real value against the random baseline's mean and spread.
- Give each colour one meaning across the page. If orange means a placed worker, it means nothing else.
- Leave headings bare: no pill, chip or badge beside a section or question title. Put scope in a caption.
- Make every disclosure, popover and control work from the keyboard. Escape closes a popover.
- Version page scripts, stylesheets and fetched data, so one deploy's code never meets another's numbers.
  Week 3 stamps a content hash with `scripts/stamp_week03.py`; Week 4 appends `?v=` by hand.
- Ship no draft or placeholder text ("Draft", "The finding goes here", "TODO") on a live page.
- Keep existing element IDs, anchors and routes: other sections and tests link to them.
- When you add a page or change the lobby, update `docs/assets/js/weeks.js` and run
  `node --test 'tests/*.test.mjs'`.

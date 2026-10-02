---
name: Site code
description: Rules for the HTML, CSS and JavaScript of the course website, and its tests.
applyTo: "src/**,public/**,tests/**"
---

# Site code

- The site is a Next.js static export (`output: "export"`). Pages are JSX in `src/app/(<page>)/`, one route
  group per page; chart code is plain ES modules in `src/scripts/`; stylesheets are in `src/styles/`. Data,
  vendored libraries and images stay in `public/`. README.md, "How the site is built", has the details.
- Chart scripts draw into server-rendered markup after hydration: add a page's scripts to its entry module in
  `src/scripts/entries/`, never as a `<script>` tag in JSX. Keep links as plain `<a href>`, not `next/link`,
  so each page loads fresh and its scripts run once.
- Add any library or component the page needs, or draw plain SVG from the page's data: charting (ECharts, D3,
  Vega-Lite, Observable Plot, deck.gl), maps, tables, UI widgets, web components or anything else. No approval
  needed. Vendor a library first: save the unmodified minified build to `public/assets/vendor/` with the version in
  the filename and add a row to `public/assets/vendor/README.md`. ECharts 5.5.1, D3 7.9.0, globe.gl 2.32.0 and
  deck.gl 9.0.30 are already there.
- Take colours from CSS custom properties with `getComputedStyle`, as `src/scripts/week04-staffing.js`
  does. A hex colour in a new JavaScript file fails `tests/theme.test.mjs`.
- Load files under `public/` with `asset("weeks/week05/data/x.json")` from `src/scripts/site.js`, so the path carries
  the base path on GitHub Pages and the deploy's commit.
- Build for desktop. Do not add phone layouts.
- Every chart needs a hover tooltip, a caption that says how to read it, and a table or text alternative.
- Label a few marks, not all of them. Hide overlapping labels (in ECharts, `labelLayout: { hideOverlap: true }`).
- Draw every real-against-random result on a page with the same chart, so a reader learns it once. Week 4
  uses `src/scripts/week04-strip.js`: the real value against the random baseline's mean and spread.
- Give each colour one meaning across the page. If orange means a placed worker, it means nothing else.
- Leave headings bare: no pill, chip or badge beside a section or question title. Put scope in a caption.
- Build every post's cards in Week 4's form: question and answer, one paragraph beside "What to notice", the
  figure, then drawers (Method with the limitation, More numbers, What we read in the pages). No slot labels or
  open limitation blocks. `tests/text-budget.test.mjs` fails a card over 350 words before a click
  (POST_GUIDE.md, "Keep the card short").
- Keep pages readable without JavaScript: put the prose, numbers and captions in the JSX, and give every
  `<canvas>` an `aria-label` (with `role="img"`). Browser agents read the accessibility tree, and crawlers and
  the Markdown copies from `scripts/agent-files.mjs` see only the server-rendered HTML. A new live page's
  layout takes its metadata from `pageMeta()` and `<JsonLd>` in `src/components/agentMeta.tsx`.
- Make every disclosure, popover and control work from the keyboard. Escape closes a popover.
- Do not add `?v=` cache busters. Next hashes the code and styles it bundles, and `asset()` stamps every
  file under `public/` with the deploy's commit.
- Ship no draft or placeholder text ("Draft", "The finding goes here", "TODO") on a live page.
- Credit each data source on the page that uses it, in the form its licence asks for (CC BY names the
  source and any change you made; ODbL and CC BY-SA also cover what you derive). `tests/credits.test.mjs`
  checks the footers; add a line there when a page gains a source.
- Keep existing element IDs, anchors and routes: other sections and tests link to them.
- When you add a page or change the lobby, update `src/scripts/weeks.js` and run `npm test`, which builds
  the site and runs `node --test 'tests/*.test.mjs'` against it.

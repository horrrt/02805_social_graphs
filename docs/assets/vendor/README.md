# Vendored libraries

The site promises no external JavaScript: nothing is fetched from a third-party
domain at runtime, and the whole thing works offline. The render variants of the
week 3 post need real charting libraries, so those libraries live here, pinned by
version in the filename, rather than being pulled from a CDN.

| File | Version | Licence | Used by |
| --- | --- | --- | --- |
| `d3-7.9.0.min.js` | 7.9.0 | ISC | `?variant=d3` |
| `echarts-5.5.1.min.js` | 5.5.1 | Apache-2.0 | `?variant=echarts` |
| `globe.gl-2.32.0.min.js` | 2.32.0 | MIT (bundles three.js) | `?variant=globe` |
| `deck.gl-9.0.30.min.js` | 9.0.30 | MIT | `?variant=deck` |

Each is the unmodified minified distribution from jsDelivr. Only the variant that
needs a file loads it, so the default post still ships no library at all.

To update one: download the new version to a new filename, change the `src` in
`docs/assets/js/variants/<name>.js`, and delete the old file.

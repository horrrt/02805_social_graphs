// Turn a converter build (ds-bundle/) into the Design System type's file layout,
// as the kit has held it since the 15 Oct clean-up:
//
//   _ds_bundle.js                       -> components/bundle.js (as built)
//   fonts/fonts.css + _ds_bundle.css    -> components/bundle.css (see below)
//   _vendor/react.js, react-dom.js      -> components/lib/ (React 19.3.0; react.js sets ReactDOM too)
//   components/<g>/<N>/<N>.prompt.md    -> components/<N>/README.md
//   components/<g>/<N>/<N>.d.ts         -> components/<N>/<N>.d.ts, all of them in components/index.d.ts
//   components/<g>/<N>/<N>.html + _preview/<N>.js -> components/<N>/preview.html
//
// The kit's own tokens.json, tokens.css, README.md and Cover are edited in the kit,
// never written from here.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// The kit's tokens.json declares these three families; tokens.css (loaded before
// bundle.css) must be their only source, or an edit on the kit page would not show.
const FONT_VARS = /^ {2}--font-(sans|display|mono): [^;]+;\n/gm;
// Cold Read's :root repeats colours tokens.json declares. Nothing wraps Cold Read in
// .corridor, so these would override tokens.css there. Same values, so dropping them
// changes no render.
const COLD_READ_DUPES = ["ink", "ink-soft", "ink-mute", "ink-mute-text", "ground", "card", "line", "line-soft",
  "people", "people-soft", "access", "access-soft", "deep", "gain", "loss", "radius", "shadow"];
// tokens.css declares the Condensed face from tokens.json.
const CONDENSED_FACE = /@font-face\{\n {2}font-family: Condensed;[^}]*\}\n?/;

const CARD = { grid: 240, column: 560 };

function bundleCss(out, config) {
  const fonts = readFileSync(join(out, "fonts/fonts.css"), "utf8").replace(CONDENSED_FACE, "");
  let css = readFileSync(join(out, "_ds_bundle.css"), "utf8").replace(FONT_VARS, "");
  // The Cold Read :root is the one that also declares --t0 (its topic colours).
  css = css.replace(/:root \{\n([^}]*--t0:[^}]*)\}/, (block, body) =>
    block.replace(body, body.split("\n").filter((l) => {
      const m = l.match(/^\s*--([\w-]+):/);
      return !(m && COLD_READ_DUPES.includes(m[1]));
    }).join("\n")));
  return `${fonts}\n${css}`;
}

function preview(out, group, name, config) {
  const card = readFileSync(join(out, `components/${group}/${name}/${name}.html`), "utf8");
  const code = readFileSync(join(out, `_preview/${name}.js`), "utf8");
  const style = card.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/^\s*body\{[^}]*\}\n/m, "");
  const mount = card.match(/<script>\n([\s\S]*?)<\/script>\s*<\/body>/)[1];
  const mode = card.match(/var MODE="(\w+)"/)[1];
  const view = config.overrides?.[name]?.viewport?.split("x").map(Number);
  const size = mode === "single" && view ? `height=${view[1]} width=${view[0]}` : `height=${CARD[mode] ?? 240}`;
  for (const [what, text] of [["preview code", code], ["card script", mount]])
    if (/<\/script|<!--/i.test(text)) throw new Error(`${name}: ${what} holds </script or <!--`);
  return `<!-- @dsCard group="${group}" ${size} -->
<!doctype html>
<html>
<head><meta charset="utf-8"><title>${name} — preview</title></head>
<body>
<div class="ds-grid" id="g"></div>
<script>
document.head.appendChild(Object.assign(document.createElement("style"), { textContent: ${JSON.stringify(style)} }));
${code}
${mount}</script>
</body>
</html>
`;
}

/** Map of kit path (under project/) to file contents. */
export function kitFiles(out, config) {
  const files = new Map();
  files.set("components/bundle.js", readFileSync(join(out, "_ds_bundle.js")));
  files.set("components/bundle.css", bundleCss(out, config));
  files.set("components/lib/react.js", readFileSync(join(out, "_vendor/react.js")));
  files.set("components/lib/react-dom.js", readFileSync(join(out, "_vendor/react-dom.js")));
  const types = [];
  for (const group of readdirSync(join(out, "components")).sort()) {
    for (const name of readdirSync(join(out, "components", group)).sort()) {
      const base = join(out, "components", group, name, name);
      if (!existsSync(`${base}.html`)) continue;
      files.set(`components/${name}/preview.html`, preview(out, group, name, config));
      if (existsSync(`${base}.prompt.md`)) files.set(`components/${name}/README.md`, readFileSync(`${base}.prompt.md`));
      if (existsSync(`${base}.d.ts`)) {
        const dts = readFileSync(`${base}.d.ts`, "utf8");
        files.set(`components/${name}/${name}.d.ts`, dts);
        types.push(dts.replace(/^import \* as React from 'react';\n\n?/, ""));
      }
    }
  }
  files.set("components/index.d.ts", `import * as React from 'react';\n\n${types.join("\n")}`);
  return files;
}

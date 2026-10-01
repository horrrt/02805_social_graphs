// The built pages under out/, the way the tests read them. Run `npm run build`
// first (`npm test` does). Next's HTML carries the React Server Components
// payload in <script> tags, which repeats every string on the page; React
// escapes ' and " in text and puts an empty <!-- --> between adjacent text
// nodes. The tests assert on the markup a reader gets, so this drops Next's
// own scripts and those markers and undoes the two escapes in text.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const cache = new Map();

/** Built HTML with Next's scripts, preload links and text markers dropped. */
export function normalise(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (tag) =>
      /src="[^"]*\/_next\//.test(tag) || /__next|\$RC|\$RS/.test(tag) ? "" : tag,
    )
    .replace(/<link rel="(?:preload|preconnect)"[^>]*\/>/g, "")
    .replace(/<!-- -->/g, "")
    .replace(/>([^<]*)</g, (_, text) => `>${text.replace(/&#x27;/g, "'").replace(/&quot;/g, '"')}<`);
}

/** The HTML of a built page, e.g. builtPage("out/weeks/week05/index.html"). */
export function builtPage(path) {
  if (cache.has(path)) return cache.get(path);
  const file = join(ROOT, path);
  if (!existsSync(file)) throw new Error(`${path} is missing: run \`npm run build\` before the tests`);
  const html = normalise(readFileSync(file, "utf8"));
  cache.set(path, html);
  return html;
}

/**
 * The scripts a page runs, as file names under src/scripts, in order. Each
 * page's entry module (src/scripts/entries/<page>.js) imports them.
 */
export function pageScripts(page) {
  const names = [];
  const walk = (file) => {
    const src = readFileSync(join(ROOT, "src/scripts/entries", file), "utf8");
    for (const [, spec] of src.matchAll(/import(?:\s*\(\s*|\s+)"([^"]+)"/g)) {
      if (spec.startsWith("./")) walk(spec.slice(2));
      else if (spec.startsWith("../") && spec !== "../site.js") names.push(spec.slice(3));
    }
  };
  walk(`${page}.js`);
  return names;
}

/** The stylesheets a page's layout imports, as file names under src/styles, in order. */
export function pageStyles(page) {
  const src = readFileSync(join(ROOT, "src/app", `(${page})`, "layout.tsx"), "utf8");
  return [...src.matchAll(/^import "@\/styles\/([^"]+)";$/gm)].map((m) => m[1]);
}

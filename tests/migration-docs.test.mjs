// Pins the two migration documents to the source list they are generated from.
// Both are written by scripts/migration/render_catalogue.py; these tests fail
// when someone edits the Markdown by hand or forgets to re-render after
// changing scripts/migration/sources.py.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { builtPage, codeFiles, pageStyles } from "./built-page.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => (name.startsWith("out/") ? builtPage(name) : readFileSync(join(ROOT, name), "utf8"));

const tsv = read("data/migration_sources.tsv")
  .split("\n")
  .filter((line) => line && !line.startsWith("#"));
const header = tsv[0].split("\t");
const rows = tsv.slice(1).map((line) => {
  const cells = line.split("\t");
  return Object.fromEntries(header.map((key, i) => [key, cells[i]]));
});

const catalogue = read("project/MIGRATION_DATA_CATALOGUE.md");
const questions = read("project/MIGRATION_QUESTIONS.md");

const anchor = (text) =>
  [...text.toLowerCase()]
    .filter((c) => /[a-z0-9 \-_]/.test(c))
    .join("")
    .trim()
    .replace(/ /g, "-");

test("every source in the index has a section in the catalogue", () => {
  assert.ok(rows.length >= 80, `expected at least 80 sources, got ${rows.length}`);
  for (const row of rows) {
    assert.ok(
      catalogue.includes(`### ${row.name}\n`),
      `no catalogue section for ${row.id} (${row.name})`,
    );
  }
});

test("every source states a unit, a network shape and at least one limitation", () => {
  for (const row of rows) {
    for (const field of ["unit", "coverage", "network", "metrics", "limits", "url"]) {
      assert.ok(row[field] && row[field].length > 3, `${row.id} is missing ${field}`);
    }
    assert.ok(row.url.startsWith("http"), `${row.id} has no usable url`);
  }
});

test("the catalogue reports the same source count as the index", () => {
  const sections = catalogue.match(/^### /gm) ?? [];
  assert.equal(sections.length, rows.length);
  assert.ok(
    catalogue.includes(`${rows.length} sources across`),
    "the catalogue intro does not state the current source count",
  );
});

test("no internal link in either document points at a missing heading", () => {
  const headings = new Set(
    [...catalogue.matchAll(/^#+ (.+)$/gm)].map((m) => anchor(m[1])),
  );
  for (const [, target] of catalogue.matchAll(/\]\(#([^)]+)\)/g)) {
    assert.ok(headings.has(target), `broken catalogue anchor #${target}`);
  }
  for (const [, target] of questions.matchAll(
    /\]\(MIGRATION_DATA_CATALOGUE\.md#([^)]+)\)/g,
  )) {
    assert.ok(headings.has(target), `broken cross-document anchor #${target}`);
  }
});

test("the questions page covers all four project questions", () => {
  for (const measure of [
    "Closeness centrality",
    "Betweenness centrality",
    "Cliques and communities",
    "Shocks and event studies",
  ]) {
    assert.ok(questions.includes(`## ${measure}\n`), `missing section ${measure}`);
  }
  const traps = questions.match(/\*\*The trap\.\*\*/g) ?? [];
  assert.equal(traps.length, 4, "each question needs its trap written down");
});

test("every question idea states a stake, a null and a source that exists", () => {
  const names = new Set(rows.map((r) => r.name));
  const blocks = questions.split(/^\*\*/m).filter((b) => b.includes("*What is at stake:*"));
  assert.ok(blocks.length >= 20, `expected 20 question ideas, found ${blocks.length}`);
  for (const block of blocks) {
    assert.ok(block.includes("*Null:*"), "an idea has no null");
    assert.ok(block.includes("*Data:*"), "an idea names no data");
    assert.ok(block.includes("*Verdict:*"), "an idea has no verdict");
    const cited = [...block.matchAll(/\[([^\]]+)\]\(MIGRATION_DATA_CATALOGUE\.md#/g)];
    assert.ok(cited.length > 0, "an idea cites no catalogued source");
    for (const [, name] of cited) {
      assert.ok(names.has(name), `idea cites an uncatalogued source: ${name}`);
    }
  }
});

test("the numbers quoted on the questions page come from the committed facts file", () => {
  const facts = JSON.parse(read("analysis/week03_country_facts.json"));
  assert.equal(facts.destination_overlap.overlap_count, 4);
  assert.ok(
    questions.includes("4 of\ntheir top 15 destinations") ||
      questions.includes("4 of their top 15 destinations"),
    "the overlap claim on the page does not match the facts file",
  );
  // The page rounds to two decimals; the facts file keeps three.
  assert.ok(
    questions.includes(facts.stock.mean_path.toFixed(2)),
    "the raw mean path length on the page does not match the facts file",
  );
  const swept = facts.stock_threshold_sweep.at(-1);
  assert.equal(swept.threshold, 100000);
  assert.ok(
    questions.includes(swept.mean_path.toFixed(2)),
    "the thresholded mean path length on the page does not match the facts file",
  );
});

// The week 3 code that looks elements up by id, wherever it lives: the
// scripts, the audit, and the components the page is moving into.
const nested = (dir) => codeFiles(join(ROOT, dir), /\.(js|mjs|ts|tsx)$/).map((path) => relative(ROOT, path));
const WEEK03_CODE = () => [
  "src/scripts/corridor.js",
  "src/scripts/week03-boot.js",
  "src/scripts/questions.js",
  "src/scripts/echarts-views.js",
  ...nested("src/scripts/variants"),
  "scripts/audit_week03.js",
  ...nested("src/features/week03"),
  ...nested("src/components/week03"),
  ...nested("src/app/(week03)"),
];
const isClient = (src) => /^\s*(?:(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*)*["']use client["']/.test(src);

// Ids looked up as $("x"), api.$("x"), byId(…, "x"), getElementById("x"),
// host("x"), querySelector(All)("#x…") or linked as href="#x" / href: "#x".
// A string that goes on into ${…} is a template id and is left out.
const ID = `([A-Za-z][\\w-]*)`;
const LOOKUP_PATTERNS = [
  `(?<![\\w$])\\$\\(\\s*["']${ID}["']\\s*\\)`,
  `\\bbyId\\([^()]*?,\\s*["']${ID}["']\\s*\\)`,
  `\\bgetElementById\\(\\s*["']${ID}["']\\s*\\)`,
  `(?<![\\w$.])host\\(\\s*["']${ID}["']\\s*\\)`,
  `\\bquerySelector(?:All)?\\(\\s*["'\`]#${ID}(?![\\w-]|\\$\\{)`,
  `\\bhref="#${ID}"`,
  `\\bhref:\\s*"#${ID}"`,
].map((source) => new RegExp(source, "g"));

const lookups = (src) => LOOKUP_PATTERNS.flatMap((re) => [...src.matchAll(re)].map((m) => m[1]));

// The values of exported CLIENT_IDS objects: ids rendered only after hydration.
const clientIds = (src) => {
  const out = [];
  for (const [, body] of src.matchAll(/export const CLIENT_IDS\s*=\s*\{([^}]*)\}/g))
    for (const [, key, value] of body.matchAll(/([\w$]+)\s*:\s*["']([^"']+)["']/g)) out.push([key, value]);
  return out;
};

// Ids main's scripts create in the browser, so the server page has none of
// them; each stays absent from the built page. They move to CLIENT_IDS or to
// island markup when their week 3 batch converts the code that creates them.
const RUNTIME_IDS = {
  "globe-canvas-d3": "src/scripts/variants/d3.js (host.id = \"globe-canvas-d3\")",
  "globe-gl": "src/scripts/variants/globe.js (host.id = \"globe-gl\")",
  "globe-atlas": "src/scripts/variants/atlas.js (host.id = \"globe-atlas\")",
  "globe-canvas-deck": "src/scripts/variants/deck.js (host.id = `${canvasId}-deck`)",
  "style-earth": "src/scripts/week03-boot.js (<select id=\"style-${dimension.key}\">)",
};

test("every element the week 3 script writes into exists in the post", () => {
  const html = read("out/weeks/week03/index.html");
  const files = WEEK03_CODE().map((file) => [file, read(file)]);
  const found = new Set(files.flatMap(([, src]) => lookups(src)));
  // Ids the islands render themselves.
  const islands = files
    .filter(([file, src]) => file.startsWith("src/features/week03/") && /\.tsx$/.test(file) && isClient(src))
    .flatMap(([, src]) => [...src.matchAll(/\bid=(?:"([\w-]+)"|\{\s*"([\w-]+)"\s*\})/g)].map((m) => m[1] ?? m[2]));
  const client = files.filter(([file]) => file.startsWith("src/features/week03/")).flatMap(([, src]) => clientIds(src));
  const skip = new Set([...client.map(([, value]) => value), ...Object.keys(RUNTIME_IDS)]);
  const wanted = [...new Set([...found, ...islands])].filter((id) => !skip.has(id));
  assert.ok(wanted.length > 20, `expected the script to address many elements, found ${wanted.length}`);
  const missing = wanted.filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, [], "out/weeks/week03/index.html is missing ids the script writes into");
  for (const id of Object.keys(RUNTIME_IDS))
    assert.ok(!html.includes(`id="${id}"`), `#${id} is on the server page, so it needs no runtime exemption`);
  // Client-only ids go through CLIENT_IDS and never reach the server page.
  const clientFiles = files.filter(([file, src]) => file.startsWith("src/features/week03/") && isClient(src));
  for (const [key, value] of client) {
    assert.ok(
      clientFiles.some(([, src]) => new RegExp(`\\bid=\\{\\s*CLIENT_IDS\\.${key}\\s*\\}`).test(src)),
      `CLIENT_IDS.${key} is rendered as id={CLIENT_IDS.${key}} in a 'use client' file`,
    );
    assert.ok(!html.includes(`id="${value}"`), `client-only #${value} is not in the server page`);
  }
});

test("the week 3 id harvest reads every lookup form and skips template ids", () => {
  const src = [
    '$("a-one"); api.$("a-two"); byId(root, "a-three"); document.getElementById("a-four");',
    'host("a-five"); el.querySelector("#a-six .x"); el.querySelectorAll(`#a-seven > b`);',
    '`<a href="#a-eight">`; ({ href: "#a-nine" });',
    'el.querySelector(`#sel-${id}`); `<a href="#n-${k}">`; ghost("no-one");',
  ].join("\n");
  assert.deepEqual(lookups(src).sort(), ["a-eight", "a-five", "a-four", "a-nine", "a-one", "a-seven", "a-six", "a-three", "a-two"]);
});

test("every render variant names a vendored library that exists", () => {
  const boot = read("src/scripts/week03-boot.js");
  const renderers = boot.slice(
    boot.indexOf("export const RENDERERS"),
    boot.indexOf("export const PALETTES"),
  );
  const names = [...renderers.matchAll(/^\s{2}(\w+): \{$/gm)].map((m) => m[1]);
  assert.deepEqual(names, ["canvas", "d3", "echarts", "globe", "atlas", "deck"]);
  for (const [, file] of renderers.matchAll(/script: "([^"]+)"/g)) {
    const path = join(ROOT, "public/assets/vendor", file);
    assert.ok(existsSync(path), `missing vendored library: ${file}`);
    // The switcher advertises a download size; it has to be the real one.
    const bytes = statSync(path).size;
    assert.ok(
      boot.includes(`bytes: ${bytes},`),
      `${file} is ${bytes} bytes and the registry says otherwise`,
    );
  }
  const modules = [...renderers.matchAll(/module: \(\) => import\("\.\/([^"]+)"\)/g)].map((m) => m[1]);
  assert.equal(modules.length, 5, "every library renderer names its variant module");
  for (const module of modules) {
    assert.ok(existsSync(join(ROOT, "src/scripts", module)), `missing variant module: ${module}`);
  }
});

test("each variant module exports install and touches no data", () => {
  for (const name of ["d3", "echarts", "globe", "atlas", "deck"]) {
    const src = read(`src/scripts/variants/${name}.js`);
    assert.match(src, /export function install\(/, `${name} exports install`);
    assert.doesNotMatch(src, /\bfetch\(/, `${name} must not load its own data`);
    // The SVG namespace is a URI, not a fetch; anything else is a CDN.
    const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]);
    assert.deepEqual(
      urls.filter((u) => !u.startsWith("http://www.w3.org/")),
      [],
      `${name} must not reference a CDN`,
    );
  }
});

test("every style dimension offers choices the page can actually apply", () => {
  const boot = read("src/scripts/week03-boot.js");
  const css = read("src/styles/corridor.css");
  const corridor = read("src/scripts/corridor.js");

  const group = (name) =>
    boot.slice(boot.indexOf(`export const ${name}`), boot.indexOf("};", boot.indexOf(`export const ${name}`)));
  const keys = (name) => [...group(name).matchAll(/^\s{2}(\w+): \{/gm)].map((m) => m[1]);

  // Every palette but the default needs its own block of custom properties.
  for (const palette of keys("PALETTES").filter((p) => p !== "signal")) {
    assert.ok(
      css.includes(`[data-palette="${palette}"]`),
      `no CSS for palette ${palette}`,
    );
  }
  // Every table style but the default needs rules to key off.
  for (const table of keys("TABLES").filter((t) => t !== "rules")) {
    assert.ok(css.includes(`[data-tables="${table}"]`), `no CSS for tables ${table}`);
  }
  // Every corridor line style needs a spec the renderers can read.
  const specs = corridor.slice(
    corridor.indexOf("export const ARC_STYLES"),
    corridor.indexOf("export function arcSpec"),
  );
  for (const arc of keys("ARCS")) {
    assert.ok(specs.includes(`${arc}: {`), `no arc spec for ${arc}`);
  }
  assert.deepEqual(keys("ARCS"), ["curve", "straight", "flow", "taper"]);

  // Every earth size needs a number the renderers can read.
  const sizes = corridor.slice(
    corridor.indexOf("export const EARTH_SIZES"),
    corridor.indexOf("export function earthScale"),
  );
  for (const size of keys("EARTH")) {
    assert.match(sizes, new RegExp(`${size}: [0-9.]+`), `no scale for earth size ${size}`);
  }
  assert.deepEqual(keys("EARTH"), ["small", "medium", "large", "huge"]);
});

test("the methods section counts the renderers and dimensions it actually has", () => {
  // The copy names both numbers, and both are easy to change and forget.
  const boot = read("src/scripts/week03-boot.js");
  const html = builtPage("out/weeks/week03/index.html");
  const renderers = boot.slice(
    boot.indexOf("export const RENDERERS"),
    boot.indexOf("export const PALETTES"),
  );
  const count = [...renderers.matchAll(/^\s{2}(\w+): \{$/gm)].length;
  const dimensions = [...boot.matchAll(/^\s{2}\{ key: "/gm)].length;
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve"];
  // The copy is wrapped and capitalised; compare on flattened lower case.
  const prose = html.replace(/\s+/g, " ").toLowerCase();
  for (const claim of [`${words[count]} renderers`, `${words[dimensions]} style dimensions`]) {
    assert.ok(prose.includes(claim), `the methods section does not say "${claim}"`);
  }
});

test("the two long sections open on demand rather than on load", () => {
  for (const page of ["out/weeks/week03/index.html"]) {
    const html = read(page);
    for (const id of ["questions", "methods-drawer"]) {
      const tag = html.slice(html.indexOf(`id="${id}"`) - 120, html.indexOf(`id="${id}"`) + 20);
      assert.match(tag, /<details/, `${id} in ${page} is not a details element`);
      assert.doesNotMatch(tag, /\bopen\b/, `${id} in ${page} ships open`);
    }
  }
});

test("the style guide draws every class the post uses, under every skin, palette and table style", () => {
  const guide = builtPage("out/styleguide/index.html");
  assert.ok(pageStyles("styleguide").includes("corridor.css"), "the guide loads the post's stylesheet");
  assert.ok(guide.includes('<body class="corridor">'), "the guide is scoped like the post");

  // Every class the post's markup carries, and every class its scripts write
  // into the page, has to be on the guide as a real element.
  const classesIn = (text) =>
    [...text.matchAll(/class="([^"]+)"/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .filter((c) => c && !c.includes("$"));
  const wanted = new Set(classesIn(builtPage("out/weeks/week03/index.html")));
  for (const file of ["corridor.js", "questions.js", "week03-boot.js"]) {
    const src = read(`src/scripts/${file}`);
    for (const c of classesIn(src)) wanted.add(c);
    for (const [, c] of src.matchAll(/className = "([^"]+)"/g)) wanted.add(c);
  }
  // JSX: className="…" and every string literal inside className={…}.
  for (const file of [...nested("src/features/week03"), ...nested("src/components/week03")]) {
    const src = read(file);
    const add = (list) => list.split(/\s+/).filter((c) => c && !c.includes("$")).forEach((c) => wanted.add(c));
    for (const [, c] of src.matchAll(/className="([^"]+)"/g)) add(c);
    for (let at = src.indexOf("className={"); at >= 0; at = src.indexOf("className={", at + 1)) {
      let depth = 0;
      let end = at + "className=".length;
      for (; end < src.length; end++) {
        if (src[end] === "{") depth++;
        else if (src[end] === "}" && --depth === 0) break;
      }
      const expr = src.slice(at + "className={".length, end);
      for (const [, a, b, c] of expr.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)) add(a ?? b ?? c);
    }
  }
  const have = new Set(classesIn(guide));
  assert.deepEqual([...wanted].filter((c) => !have.has(c)).sort(), [], "classes missing from the guide");

  // Every choice in the three dropdown registries gets its own scoped block.
  const boot = read("src/scripts/week03-boot.js");
  const keys = (name) => {
    const block = boot.slice(boot.indexOf(`export const ${name}`), boot.indexOf("};", boot.indexOf(`export const ${name}`)));
    return [...block.matchAll(/^\s{2}(\w+): \{/gm)].map((m) => m[1]);
  };
  for (const [name, attr] of [["SKINS", "skin"], ["PALETTES", "palette"], ["TABLES", "tables"]]) {
    for (const key of keys(name)) {
      assert.ok(guide.includes(`data-${attr}="${key}"`), `no ${attr} specimen for ${key}`);
      assert.ok(guide.includes(`<option value="${key}">`), `no ${attr} dropdown option for ${key}`);
    }
  }
});

test("section 8 is built for any country, not just the one the build ships", () => {
  const corridor = read("src/scripts/corridor.js");
  const payload = JSON.parse(read("public/assets/data/week03_corridors.json"));

  // The old payload carried Denmark's series and a hand-written Nordic peer
  // group. Both are derived in the browser now, so neither may come back:
  // a shipped series would silently pin the section to one country again.
  assert.deepEqual(Object.keys(payload.focus).sort(), ["iso3", "name"]);
  for (const page of ["src/scripts/corridor.js", "src/scripts/variants/d3.js",
                      "src/scripts/variants/echarts.js"]) {
    assert.doesNotMatch(read(page), /focus\.nordics/, `${page} still reads a shipped peer list`);
  }
  assert.match(corridor, /function spotlight\(\)/);
  assert.match(corridor, /function peersOf\(/);

  // Every country in the payload has what the section needs.
  const years = payload.years.map(String);
  const wanted = ["in_strength", "out_strength", "in_degree", "betweenness_rank"];
  let complete = 0;
  for (const iso3 of payload.countries) {
    const node = payload.nodes[iso3];
    if (!node.coord) continue;
    const points = years.filter((y) => node.years[y]);
    if (points.length && wanted.every((k) => node.years[points.at(-1)][k] !== undefined)) complete += 1;
  }
  assert.ok(complete > 200, `only ${complete} countries can be analysed`);
});

test("the palette is read from CSS rather than hard-coded twice", () => {
  const corridor = read("src/scripts/corridor.js");
  assert.match(corridor, /getPropertyValue/, "canvas must read the palette from CSS");
  for (const token of ["--people", "--access", "--ink"]) {
    assert.ok(corridor.includes(`"${token}"`), `corridor.js never reads ${token}`);
  }
});

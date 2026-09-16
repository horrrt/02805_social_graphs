// Pins the two migration documents to the source list they are generated from.
// Both are written by scripts/migration/render_catalogue.py; these tests fail
// when someone edits the Markdown by hand or forgets to re-render after
// changing scripts/migration/sources.py.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => readFileSync(join(ROOT, name), "utf8");

const tsv = read("data/migration_sources.tsv")
  .split("\n")
  .filter((line) => line && !line.startsWith("#"));
const header = tsv[0].split("\t");
const rows = tsv.slice(1).map((line) => {
  const cells = line.split("\t");
  return Object.fromEntries(header.map((key, i) => [key, cells[i]]));
});

const catalogue = read("MIGRATION_DATA_CATALOGUE.md");
const questions = read("MIGRATION_QUESTIONS.md");

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

test("the Apple edition of the week 3 post is in sync with the arcade edition", () => {
  // Generated by scripts/sync_week03_v2.py; the two editions share markup and
  // differ only in asset depth and the chrome tags the site tests look for.
  const source = read("docs/weeks/week03/index.html");
  const twin = read("docs/v2/weeks/week03/index.html");
  const wanted = source
    .replaceAll('href="../../assets/', 'href="../../../assets/')
    .replaceAll('src="../../assets/', 'src="../../../assets/')
    .replace(
      '<link href="../../../assets/favicon.svg" rel="icon" type="image/svg+xml" />',
      '<meta content="../../" name="site-root" />\n' +
        '    <link href="../../../assets/favicon.svg" rel="icon" type="image/svg+xml" />',
    )
    .replace('<body class="corridor">', '<body class="corridor theme-apple">')
    .replace(
      "<title>Corridor Control · Log–Log Arcade</title>",
      "<title>Corridor Control · Log–Log Arcade · Apple edition</title>",
    );
  assert.equal(twin, wanted, "run: python scripts/sync_week03_v2.py");
});

test("every element the week 3 script writes into exists in both editions", () => {
  const script = read("docs/assets/js/corridor.js");
  const wanted = [...script.matchAll(/\$\("([a-z0-9-]+)"\)/g)].map((m) => m[1]);
  assert.ok(wanted.length > 20, "expected the script to address many elements");
  for (const page of ["docs/weeks/week03/index.html", "docs/v2/weeks/week03/index.html"]) {
    const html = read(page);
    const missing = [...new Set(wanted)].filter((id) => !html.includes(`id="${id}"`));
    assert.deepEqual(missing, [], `${page} is missing ids the script writes into`);
  }
});

test("every render variant names a vendored library that exists", () => {
  const boot = read("docs/assets/js/week03-boot.js");
  const renderers = boot.slice(
    boot.indexOf("export const RENDERERS"),
    boot.indexOf("export const PALETTES"),
  );
  const names = [...renderers.matchAll(/^\s{2}(\w+): \{$/gm)].map((m) => m[1]);
  assert.deepEqual(names, ["canvas", "d3", "echarts", "globe", "atlas", "deck"]);
  for (const [, file] of renderers.matchAll(/script: "([^"]+)"/g)) {
    const path = join(ROOT, "docs/assets/vendor", file);
    assert.ok(existsSync(path), `missing vendored library: ${file}`);
    // The switcher advertises a download size; it has to be the real one.
    const bytes = statSync(path).size;
    assert.ok(
      boot.includes(`bytes: ${bytes},`),
      `${file} is ${bytes} bytes and the registry says otherwise`,
    );
  }
  for (const [, module] of renderers.matchAll(/module: "\.\/([^"]+)"/g)) {
    assert.ok(
      existsSync(join(ROOT, "docs/assets/js", module)),
      `missing variant module: ${module}`,
    );
  }
});

test("each variant module exports install and touches no data", () => {
  for (const name of ["d3", "echarts", "globe", "atlas", "deck"]) {
    const src = read(`docs/assets/js/variants/${name}.js`);
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
  const boot = read("docs/assets/js/week03-boot.js");
  const css = read("docs/assets/css/corridor.css");
  const corridor = read("docs/assets/js/corridor.js");

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
  const boot = read("docs/assets/js/week03-boot.js");
  const html = read("docs/weeks/week03/index.html");
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
  for (const page of ["docs/weeks/week03/index.html", "docs/v2/weeks/week03/index.html"]) {
    const html = read(page);
    for (const id of ["questions", "methods-drawer"]) {
      const tag = html.slice(html.indexOf(`id="${id}"`) - 120, html.indexOf(`id="${id}"`) + 20);
      assert.match(tag, /<details/, `${id} in ${page} is not a details element`);
      assert.doesNotMatch(tag, /\bopen\b/, `${id} in ${page} ships open`);
    }
  }
});

test("the style guide draws every class the post uses, under every skin, palette and table style", () => {
  const guide = read("docs/styleguide/index.html");
  assert.ok(guide.includes('href="../assets/css/corridor.css'), "the guide loads the post's stylesheet");
  assert.ok(guide.includes('<body class="corridor">'), "the guide is scoped like the post");

  // Every class the post's markup carries, and every class its scripts write
  // into the page, has to be on the guide as a real element.
  const classesIn = (text) =>
    [...text.matchAll(/class="([^"]+)"/g)]
      .flatMap((m) => m[1].split(/\s+/))
      .filter((c) => c && !c.includes("$"));
  const wanted = new Set(classesIn(read("docs/weeks/week03/index.html")));
  for (const file of ["corridor.js", "questions.js", "week03-boot.js"]) {
    const src = read(`docs/assets/js/${file}`);
    for (const c of classesIn(src)) wanted.add(c);
    for (const [, c] of src.matchAll(/className = "([^"]+)"/g)) wanted.add(c);
  }
  const have = new Set(classesIn(guide));
  assert.deepEqual([...wanted].filter((c) => !have.has(c)).sort(), [], "classes missing from the guide");

  // Every choice in the three dropdown registries gets its own scoped block.
  const boot = read("docs/assets/js/week03-boot.js");
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
  const corridor = read("docs/assets/js/corridor.js");
  const payload = JSON.parse(read("docs/assets/data/week03_corridors.json"));

  // The old payload carried Denmark's series and a hand-written Nordic peer
  // group. Both are derived in the browser now, so neither may come back:
  // a shipped series would silently pin the section to one country again.
  assert.deepEqual(Object.keys(payload.focus).sort(), ["iso3", "name"]);
  for (const page of ["docs/assets/js/corridor.js", "docs/assets/js/variants/d3.js",
                      "docs/assets/js/variants/echarts.js"]) {
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
  const corridor = read("docs/assets/js/corridor.js");
  assert.match(corridor, /getPropertyValue/, "canvas must read the palette from CSS");
  for (const token of ["--people", "--access", "--ink"]) {
    assert.ok(corridor.includes(`"${token}"`), `corridor.js never reads ${token}`);
  }
});

test("the build stamp on the week 3 assets matches their contents", () => {
  // GitHub Pages caches for minutes; a stale stamp means a reader can run the
  // previous deploy's code against this one's markup.
  const watched = [
    "docs/assets/js/week03-boot.js",
    "docs/assets/js/corridor.js",
    "docs/assets/js/questions.js",
    "docs/assets/js/variants/d3.js",
    "docs/assets/js/variants/echarts.js",
    "docs/assets/js/variants/globe.js",
    "docs/assets/js/variants/atlas.js",
    "docs/assets/js/variants/deck.js",
    "docs/assets/css/corridor.css",
  ];
  const hash = createHash("sha256");
  for (const name of watched) hash.update(readFileSync(join(ROOT, name)));
  const stamp = hash.digest("hex").slice(0, 10);

  for (const page of ["docs/weeks/week03/index.html", "docs/v2/weeks/week03/index.html", "docs/styleguide/index.html"]) {
    const html = read(page);
    // The guide loads only the stylesheet; the two editions load both.
    const assets = page.includes("styleguide") ? ["corridor.css"] : ["week03-boot.js", "corridor.css"];
    for (const asset of assets) {
      assert.ok(
        html.includes(`${asset}?v=${stamp}`),
        `${page} has a stale stamp on ${asset}; run: python scripts/stamp_week03.py`,
      );
    }
  }
});

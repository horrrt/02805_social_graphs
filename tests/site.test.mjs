// Pins the published site to the course schedule. The schedule itself lives in
// src/scripts/weeks.js; these tests fail when any page drifts from it.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GROUP,
  WEEKS,
  FREE_PLAY_PREDICTIONS,
  liveWeeks,
  currentWeek,
  weekLabel,
  shortDate,
} from "../src/scripts/weeks.js";
import { summarise, migrate } from "../src/scripts/cabinet.js";
import { builtPage } from "./built-page.mjs";

// The published site is Next's static export in out/ (npm run build); its
// pages are checked there, and the scripts in src/scripts before bundling.
const DOCS = fileURLToPath(new URL("../out/", import.meta.url));
const SCRIPTS = fileURLToPath(new URL("../src/scripts/", import.meta.url));
const BASE = "/02805_social_graphs/";
const read = (rel) => (rel.endsWith(".html") ? builtPage(join("out", rel)) : readFileSync(join(DOCS, rel), "utf8"));
const readAny = (path) =>
  path.startsWith(DOCS) && path.endsWith(".html") ? read(path.slice(DOCS.length)) : readFileSync(path, "utf8");
// A link on a built page, as a file under out/: absolute ones carry the base path.
const resolve = (page, target) =>
  target.startsWith(BASE) ? join(DOCS, target.slice(BASE.length)) : join(dirname(join(DOCS, page)), target);
const decode = (s) => s.replaceAll("&amp;", "&");
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
};
// The 49-concept design archive is a frozen record of earlier alternatives,
// and assets/vendor holds third-party minified bundles we do not author.
// Page code moving out of src/scripts goes to these folders, .ts and .tsx included.
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CODE_DIRS = ["src/lib", "src/kit", "src/features", "src/components"].map((dir) => join(ROOT, dir));
const sitePages = () =>
  [
    ...[...walk(DOCS), ...walk(SCRIPTS)].filter((p) => /\.(html|js|mjs)$/.test(p)),
    ...CODE_DIRS.filter((dir) => existsSync(dir)).flatMap((dir) => walk(dir)).filter((p) => /\.(js|mjs|ts|tsx)$/.test(p)),
  ].filter(
    (p) =>
      !p.includes("/_next/") &&
      !p.includes("/mockups/") &&
      !p.includes("/vendor/") &&
      !p.endsWith("mockups.js"),
  );
const label = (path) => (path.startsWith(DOCS) ? path.slice(DOCS.length) : path.slice(ROOT.length));

// https://sunelehmann.com/socialgraphs2026-web/index.html, autumn 2026.
const COURSE = [
  [1, "Networks", "2026-09-02"],
  [2, "Models & null models", "2026-09-09"],
  [3, "Who matters, and why", "2026-09-16"],
  [4, "Communities & backbones", "2026-09-23"],
  [5, "The language half · NLP I", "2026-09-30"],
  [6, "NLP II", "2026-10-07"],
  [7, "NLP III", "2026-10-21"],
  [8, "Networks × language", "2026-10-28"],
];

test("the manifest mirrors the course index week for week", () => {
  assert.deepEqual(
    WEEKS.map((w) => [w.n, w.courseTitle, w.date]),
    COURSE,
  );
  for (const w of WEEKS) {
    assert.equal(
      new Date(w.date + "T12:00:00Z").getUTCDay(),
      3,
      `${w.date} is not a Wednesday`,
    );
    assert(w.short.length <= 14, `${w.short} will not fit the marquee`);
    assert(["live", "coming"].includes(w.status), w.status);
  }
  for (let i = 1; i < WEEKS.length; i++)
    assert(WEEKS[i].date > WEEKS[i - 1].date, "dates increase");
  assert.equal(shortDate("2026-09-16"), "16 SEP");
  assert.equal(shortDate("2026-10-07"), "7 OCT");
});

test("exactly weeks 1 to 5 are live, each with a cabinet on disk", () => {
  // Update this line deliberately each time a weekly post ships.
  assert.deepEqual(
    liveWeeks().map((w) => w.n),
    [1, 2, 3, 4, 5],
  );
  assert.equal(currentWeek().n, 5);
  for (const w of WEEKS) {
    if (w.status === "live") {
      assert(w.cabinet?.name && w.cabinet?.href, `week ${w.n} cabinet`);
      assert(
        existsSync(join(DOCS, w.cabinet.href, "index.html")),
        w.cabinet.href,
      );
    } else assert.equal(w.cabinet, undefined, `week ${w.n} has no cabinet`);
  }
  assert.equal(weekLabel(3), "W03");
  assert.equal(weekLabel(null), "FREE PLAY");
  assert.equal(weekLabel(undefined), "FREE PLAY");
});

// The lobby is pinned to the manifest.
test("every lobby card agrees with the manifest and links a live week", () => {
  const html = read("index.html");
  // Cards must put data-week first; coming cards must not nest a <div>.
  const cards = [
    ...html.matchAll(/<(a|div)\s+data-week="(\d)"([^>]*)>([\s\S]*?)<\/\1\s*>/g),
  ];
  // Since #94 the lobby shows a card for each live week only; the hero lists the rest.
  const shown = liveWeeks();
  assert.equal(cards.length, shown.length, `index.html: one card per live week`);
  cards.forEach((m, i) => {
    const [, tag, n, attrs, body] = m,
      w = shown[i];
    assert.equal(Number(n), w.n, "cards run in course order");
    assert(
      decode(body).includes(w.courseTitle),
      `card ${w.n} names "${w.courseTitle}"`,
    );
    // The cards show the week and its topic only; dates live in the manifest.
    if (w.status === "live") {
      assert.equal(tag, "a", `week ${w.n} is a link`);
      assert(attrs.includes(`href="${w.cabinet.href}"`), attrs);
      assert(body.includes(w.cabinet.name), `card ${w.n} names its cabinet`);
    } else {
      assert.equal(tag, "div", `week ${w.n} is not a link`);
      assert(attrs.includes('aria-disabled="true"'), attrs);
      assert(!attrs.includes("href="), `week ${w.n} has no href`);
      assert.match(body, /coming/i);
    }
  });
  assert(
    html.includes(`href="${currentWeek().cabinet.href}"`),
    `index.html links the current week`,
  );
  assert(!html.includes("Six doors"), "no stale door count");
  for (const gone of ["os/", "trumps/", "sound/", "creature/"]) {
    assert(!html.includes(`href="${gone}`), `the retired ${gone} tool is unlinked`);
    assert(!existsSync(join(DOCS, gone, "index.html")), `${gone} is deleted`);
  }
  for (const w of liveWeeks())
    assert(
      decode(read(join(w.cabinet.href, "index.html")))
        .toLowerCase()
        .includes(w.courseTitle.toLowerCase()),
      `week ${w.n} page names its course title`,
    );
});

test("no page or script claims a future week or a preview", () => {
  const forbidden = [
    /\bW0[6-8]\b/,
    /CABINET 0[6-8]\b/,
    /\bweek-[6-8]\b/i,
    /\bpreviews?\b/i,
    /future[- ]week/i,
  ];
  const offenders = [];
  for (const path of sitePages()) {
    const text = readAny(path);
    for (const re of forbidden) {
      const hit = text.match(re);
      if (hit) offenders.push(`${label(path)}: ${hit[0]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

// Week 4 went out once with a visible draft banner and once with "The finding goes here"
// (#46, #56). A banner may stay in the markup as long as it is hidden and no data file
// still marks itself a placeholder, which is what would unhide it.
test("no live page ships draft text, a visible draft banner or placeholder data", () => {
  const forbidden = [/The finding goes here/i, /\bLorem ipsum\b/i, /\bTODO\b/];
  const offenders = [];
  for (const path of sitePages()) {
    const text = readAny(path);
    for (const re of forbidden) {
      const hit = text.match(re);
      if (hit) offenders.push(`${label(path)}: ${hit[0]}`);
    }
    for (const tag of text.match(/<[a-z]+\b[^>]*class="[^"]*\bdraft-banner\b[^"]*"[^>]*>/g) ?? []) {
      if (!/\shidden[\s>=]/.test(tag)) offenders.push(`${label(path)}: visible ${tag.replace(/\s+/g, " ")}`);
    }
  }
  for (const path of walk(DOCS).filter((p) => p.endsWith(".json") && !p.includes("/mockups/") && !p.includes("/_next/"))) {
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (data?.meta?.status === "placeholder") offenders.push(`${path.slice(DOCS.length)}: meta.status placeholder`);
  }
  assert.deepEqual(offenders, []);
});

test("the lobby names the group and its members", () => {
  const html = read("index.html");
  assert.match(html, /<title>Log–Log Legends · DTU 02805 Social Graphs<\/title>/);
  assert(html.includes(GROUP.name), GROUP.name);
  for (const member of GROUP.members) assert(html.includes(member), member);
});

test("the logbook counts live weeks only and files the rest under free play", () => {
  const p = summarise(
    [
      { id: "w1-packs", week: 1, score: 80 },
      { id: "w3-coverage", week: null, score: 50 },
      { id: "broken", week: 1, score: NaN },
    ],
    [1, 2],
  );
  assert.equal(p.weeks, 1);
  assert.equal(p.total, 2);
  assert.equal(p.free.length, 1);
  assert.equal(p.score, 65);
  assert.deepEqual(
    p.rows.map((r) => [r.week, r.attempts.length]),
    [
      [1, 1],
      [2, 0],
    ],
  );
  assert.equal(summarise([], [1, 2]).score, 0);
});

test("guesses saved under invented weeks move to free play without losing ids", () => {
  const attempts = {
    "w3-coverage": { id: "w3-coverage", week: 3, score: 50 },
    "w1-packs": { id: "w1-packs", week: 1, score: 80 },
  };
  migrate(attempts);
  assert.equal(attempts["w3-coverage"].week, null);
  assert.equal(attempts["w1-packs"].week, 1);
  assert(FREE_PLAY_PREDICTIONS.has("w3-coverage"));
  migrate(attempts);
  assert.equal(attempts["w3-coverage"].week, null, "idempotent");
});

test("every fragment link points at an id that exists", () => {
  const broken = [];
  for (const path of walk(DOCS).filter((p) => p.endsWith(".html") && !p.includes("/_next/"))) {
    const page = path.slice(DOCS.length);
    const html = read(page);
    for (const [, target, frag] of html.matchAll(/href="([^"#]*)#([^"]+)"/g)) {
      const clean = target.split("?")[0];
      if (/^https?:/.test(clean)) continue;
      const file = clean ? resolve(page, clean.endsWith("/") ? clean + "index.html" : clean) : path;
      const label = `${page} → ${target}#${frag}`;
      if (!existsSync(file)) broken.push(`${label} (no such page)`);
      else if (!readAny(file).includes(`id="${frag}"`)) broken.push(label);
    }
  }
  assert.deepEqual(broken, []);
});

// Pages painted by the shared arcade chrome, which is what the checks below
// apply to. Week 3 (Corridor Control) is deliberately absent: it ships its own
// stylesheet and palette in corridor.css rather than repainting arcade.css.
const ARCADE_PAGES = [
  "index.html",
  "weeks/week01/index.html",
  "weeks/week02/index.html",
];

test("every arcade page declares the favicon and loads its stylesheets statically", () => {
  assert.deepEqual(
    ARCADE_PAGES.filter(
      (p) => !existsSync(join(DOCS, p)) || !read(p).includes('rel="icon"'),
    ),
    [],
    "pages without a favicon",
  );
});

test("the development guide serves the site on the same port as the launch config", () => {
  const launch = JSON.parse(
    readFileSync(new URL("../.claude/launch.json", import.meta.url), "utf8"),
  );
  const port = launch.configurations.find((c) => c.name === "site").port;
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const guide = readFileSync(new URL("../project/DEVELOPMENT.md", import.meta.url), "utf8");
  assert(pkg.scripts.dev.includes(`-p ${port}`), `npm run dev uses port ${port}`);
  assert(guide.includes("npm run dev"), "development guide starts the dev server");
  assert(guide.includes(`127.0.0.1:${port}/`), `development guide opens port ${port}`);
  assert(guide.includes("npm test"));
});

test("every local asset an arcade page references exists", () => {
  const problems = [];
  for (const page of ARCADE_PAGES) {
    if (!existsSync(join(DOCS, page))) {
      problems.push(`${page} missing`);
      continue;
    }
    for (const [, target] of read(page).matchAll(
      /(?:src|href)="([^"#?]+\.(?:js|css|svg|png|json|csv))(?:[?#][^"]*)?"/g,
    )) {
      if (/^https?:/.test(target)) continue;
      if (!existsSync(resolve(page, target))) problems.push(`${page} → ${target}`);
    }
  }
  assert.deepEqual(problems, []);
});


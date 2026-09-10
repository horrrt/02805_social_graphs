// Pins the published site to the course schedule. The schedule itself lives in
// docs/assets/js/weeks.js; these tests fail when any page drifts from it.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GROUP,
  WEEKS,
  FREE_PLAY,
  FREE_PLAY_PREDICTIONS,
  liveWeeks,
  currentWeek,
  weekLabel,
  shortDate,
} from "../docs/assets/js/weeks.js";
import { summarise, migrate } from "../docs/assets/js/cabinet.js";

const DOCS = fileURLToPath(new URL("../docs/", import.meta.url));
const read = (rel) => readFileSync(join(DOCS, rel), "utf8");
const decode = (s) => s.replaceAll("&amp;", "&");
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
};
// The 49-concept design archive is a frozen record of earlier alternatives.
const sitePages = () =>
  walk(DOCS).filter(
    (p) =>
      /\.(html|js|mjs)$/.test(p) &&
      !p.includes("/mockups/") &&
      !p.endsWith("mockups.js"),
  );

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

test("exactly weeks 1 and 2 are live, each with a cabinet on disk", () => {
  // Update this line deliberately each time a weekly post ships.
  assert.deepEqual(
    liveWeeks().map((w) => w.n),
    [1, 2],
  );
  assert.equal(currentWeek().n, 2);
  for (const w of WEEKS) {
    if (w.status === "live") {
      assert(w.cabinet?.name && w.cabinet?.href, `week ${w.n} cabinet`);
      assert(
        existsSync(join(DOCS, w.cabinet.href, "index.html")),
        w.cabinet.href,
      );
    } else assert.equal(w.cabinet, undefined, `week ${w.n} has no cabinet`);
  }
  assert.equal(weekLabel(2), "W02");
  assert.equal(weekLabel(null), "FREE PLAY");
  assert.equal(weekLabel(undefined), "FREE PLAY");
});

test("every lobby card agrees with the manifest and only live weeks are links", () => {
  const html = read("index.html");
  // Cards must put data-week first; coming cards must not nest a <div>.
  const cards = [
    ...html.matchAll(/<(a|div) data-week="(\d)"([^>]*)>([\s\S]*?)<\/\1>/g),
  ];
  assert.equal(cards.length, WEEKS.length, "one card per course week");
  cards.forEach((m, i) => {
    const [, tag, n, attrs, body] = m,
      w = WEEKS[i];
    assert.equal(Number(n), w.n, "cards run in course order");
    assert(
      decode(body).includes(w.courseTitle),
      `card ${w.n} names "${w.courseTitle}"`,
    );
    assert(
      body.toLowerCase().includes(shortDate(w.date).toLowerCase()),
      `card ${w.n} shows its date`,
    );
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
    "the current week is linked from the lobby",
  );
  assert(!html.includes("Six doors"), "no stale door count");
  const shelf = html.match(/<section[^>]*id="free-play"[\s\S]*?<\/section>/)?.[0];
  assert(shelf, "a free-play shelf exists");
  for (const f of FREE_PLAY) {
    assert(shelf.includes(`href="${f.href}"`), `${f.name} is on the shelf`);
    assert(
      existsSync(join(DOCS, f.href.split("?")[0], "index.html")),
      f.href,
    );
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
    /\bW0[3-8]\b/,
    /CABINET 0[3-8]\b/,
    /\bweek-[3-8]\b/i,
    /\bpreviews?\b/i,
    /future[- ]week/i,
  ];
  const offenders = [];
  for (const path of sitePages()) {
    const text = readFileSync(path, "utf8");
    for (const re of forbidden) {
      const hit = text.match(re);
      if (hit) offenders.push(`${path.slice(DOCS.length)}: ${hit[0]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("the lobby names the group and its members", () => {
  const html = read("index.html");
  assert.match(html, /<title>The Log–Log Arcade · Log–Log Legends<\/title>/);
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

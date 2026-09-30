// Week 5 prose pins: numbers on #search and #autocomplete must match JSON.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "docs/weeks/week05/index.html"), "utf8");
const search = JSON.parse(
  fs.readFileSync(path.join(ROOT, "docs/weeks/week05/data/search.json"), "utf8"),
);
const auto = JSON.parse(
  fs.readFileSync(path.join(ROOT, "docs/weeks/week05/data/autocomplete.json"), "utf8"),
);

test("week05 search and autocomplete sections are owned and wired", () => {
  assert.match(html, /id="search"/);
  assert.match(html, /id="autocomplete"/);
  assert.match(html, /data-owner="Àngela"/);
  assert.match(html, /week05-search\.js\?v=2/);
  assert.match(html, /week05-autocomplete\.js\?v=2/);
  assert.match(html, /week05\.css\?v=1/);
});

test("search summary numbers exist in the JSON the page boots from", () => {
  assert.equal(search.summary.n_queries, search.queries.length);
  assert.equal(
    search.summary.hits_at_1,
    search.queries.filter((q) => q.hit_at_1).length,
  );
  assert.equal(
    search.summary.n_failures,
    search.queries.filter((q) => !q.hit_at_1).length,
  );
  assert.ok(search.summary.hit_rate_at_5_nostop >= search.summary.hit_rate_at_5);
});

test("autocomplete keeps guessing empty until real group answers arrive", () => {
  assert.equal(auto.guessing.status, "awaiting_other_groups");
  assert.equal(auto.guessing.hit_rate, null);
  assert.equal(auto.n_fakes, auto.fakes.length);
  assert.equal(auto.options.length, auto.communities_used.length);
  for (const fake of auto.fakes) {
    assert.ok(auto.options.some((o) => o.community_index === fake.community_index));
    assert.ok(fake.text.includes(fake.character));
  }
});

test("search HTML still states the BoW question and the TF-IDF limitation", () => {
  const slice = html.slice(html.indexOf('id="search"'), html.indexOf('id="autocomplete"'));
  assert.match(slice, /Bag-of-Words|bag-of-words|Bag of Words/i);
  assert.match(slice, /cosine/i);
  assert.match(slice, /TF-IDF/i);
  assert.match(slice, /stopwords/i);
});

test("autocomplete HTML still hosts the community quiz controls", () => {
  const slice = html.slice(html.indexOf('id="autocomplete"'), html.indexOf('id="heaps"'));
  assert.match(slice, /id="ac-select"/);
  assert.match(slice, /id="ac-submit"/);
  assert.match(slice, /trigram/i);
  assert.match(slice, /awaiting|other groups|visitor quiz/i);
});

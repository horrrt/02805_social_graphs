// Cold Read's rules against its real decks: on every playable page the three
// sharp cards and all eight cards rank the hidden page first and the three
// loud cards do not, with names and without, as analysis/week06_cold_read.py
// promised.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { type ClueShopData, pagesWithAll, points, rarity, shortlist } from "@/features/cold-read/rules";

const data: ClueShopData = JSON.parse(readFileSync(new URL("../../public/play/cold-read/data/clue_shop.json", import.meta.url), "utf8"));
const words = (cards: { w: string; kind: string }[], kind: string) => cards.filter((c) => c.kind === kind).map((c) => c.w);

test("rare cards name the page and common cards do not", () => {
  assert.ok(data.rounds.length >= 60);
  for (const r of data.rounds)
    for (const deck of [r.on, r.off]) {
      assert.equal(deck.length, 8);
      assert.equal(shortlist(data, words(deck, "sharp"), [])[0]?.page, r.page, data.pages[r.page].name);
      assert.notEqual(shortlist(data, words(deck, "loud"), [])[0]?.page, r.page, data.pages[r.page].name);
      assert.equal(shortlist(data, deck.map((c) => c.w), [])[0]?.page, r.page, `${data.pages[r.page].name}, all eight cards`);
    }
});

test("every word not on every page keeps one posting per page it is on", () => {
  for (const [w, word] of Object.entries(data.words)) assert.equal(word.post.length, word.df < data.N ? word.df : 0, w);
});

test("a word on every page leaves every page a suspect and scores nothing", () => {
  const everywhere = Object.keys(data.words).find((w) => data.words[w].df === data.N)!;
  assert.equal(pagesWithAll(data, [everywhere]), data.N);
  assert.deepEqual(shortlist(data, [everywhere], []), []);
});

test("struck pages leave the shortlist", () => {
  const r = data.rounds[0];
  const sharp = words(r.on, "sharp");
  assert.ok(!shortlist(data, sharp, [r.page]).some((s) => s.page === r.page));
});

test("unflipped cards and hidden names raise the points", () => {
  assert.equal(points(6, false), 700);
  assert.equal(points(6, true), 1400);
  assert.equal(points(0, false), 100);
  assert.equal(points(6, true, 3), 4200);
  assert.equal(points(6, false, 9), 3500, "the streak caps at ×5");
});

test("rarity rises as fewer pages carry the word", () => {
  assert.deepEqual([303, 150, 149, 30, 29, 5, 4, 1].map(rarity), ["common", "common", "uncommon", "uncommon", "rare", "rare", "legendary", "legendary"]);
});

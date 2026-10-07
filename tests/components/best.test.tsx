// The best-score store: kept in localStorage and a cookie, never lowered,
// and nothing kept for a round played as a campaign level.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readBest, saveBest } from "@/features/cold-read/best";
import "./coldReadData";

const clearCookies = () => {
  for (const c of document.cookie.split("; ").filter(Boolean)) document.cookie = `${c.split("=")[0]}=; max-age=0; path=/`;
};

beforeEach(() => {
  localStorage.clear();
  clearCookies();
});

test("a saved best is kept in localStorage and in a cookie", () => {
  saveBest("cold-read:best", 1200);
  assert.equal(localStorage.getItem("cold-read:best"), "1200");
  assert.match(document.cookie, /cold-read%3Abest=1200/);
  assert.equal(readBest("cold-read:best"), 1200);
});

test("clearing one store still leaves the best in the other", () => {
  saveBest("cold-read:best", 900);
  localStorage.clear();
  assert.equal(readBest("cold-read:best"), 900);
  saveBest("cold-read:best2", 400);
  clearCookies();
  assert.equal(readBest("cold-read:best2"), 400);
});

test("a lower score never replaces the best", () => {
  saveBest("cold-read:best", 900);
  saveBest("cold-read:best", 300);
  assert.equal(readBest("cold-read:best"), 900);
});

test("practice keys stay apart, and a campaign level keeps nothing", () => {
  saveBest("cold-read:best", 500);
  saveBest("cold-read:best:hard", 700);
  saveBest(null, 9999);
  assert.equal(readBest("cold-read:best"), 500);
  assert.equal(readBest("cold-read:best:hard"), 700);
  assert.equal(readBest(null), 0);
});

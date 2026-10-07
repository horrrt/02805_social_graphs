// Round 1 (Clue Shop) played through its component: deal, flip, read the
// board, name the page, lose lives, and keep the best score.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClueShopGame } from "@/features/cold-read/ClueShopGame";
import { boldness, SPEED_MAX, timed } from "@/features/cold-read/pace";
import { type ClueShopData, pagesWithAll, points, shownName, shuffled } from "@/features/cold-read/rules";
import { json, noExamples, still, zero } from "./coldReadData";

const data = json<ClueShopData>("clue_shop.json");
const round = data.rounds[shuffled(data.rounds.map((_, i) => i), zero)[0]];
const deck = shuffled(round.normal, zero);
const answer = shownName(data, round.page);

beforeEach(() => {
  localStorage.clear();
  noExamples();
});

async function dealt() {
  const user = userEvent.setup();
  render(<ClueShopGame data={data} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  return user;
}

const card = (i: number) => screen.getByRole("button", { name: new RegExp(`^Card ${i + 1}:`) });
const count = () => Number(document.querySelector(".cr-count b")?.textContent);
const leads = () => within(screen.getByRole("complementary", { name: "Leads" })).queryAllByRole("listitem");

test("the deal shows eight face-down cards with only their two numbers", async () => {
  await dealt();
  deck.forEach((c, i) => {
    // The whole label is the two numbers: no room for the word.
    assert.match(card(i).getAttribute("aria-label")!, new RegExp(`^Card ${i + 1}: ${c.n} times here, on ${data.words[c.w].df} of 303 pages$`));
  });
  assert.equal(count(), 303);
  assert.equal(leads().length, 0);
});

test("the most common card leaves most suspects standing; the rarest clears the board", async () => {
  const user = await dealt();
  const byPages = deck.map((c, i) => ({ i, df: data.words[c.w].df })).sort((x, y) => y.df - x.df);
  const common = byPages[0];
  await user.click(card(common.i));
  assert.equal(count(), common.df, "every page that uses the word stays");
  assert.ok(common.df > 100, "a common card is on more than a third of the pages");
  const rare = byPages.at(-1)!;
  await user.click(card(rare.i));
  assert.ok(count() <= rare.df && count() < common.df / 10);
  assert.ok(leads().length > 0);
});

test("naming the page after every flip closes the case and scores it", async () => {
  const user = await dealt();
  for (let i = 0; i < deck.length; i++) await user.click(card(i));
  const top = leads()[0];
  assert.equal(top.querySelector(".cr-name")!.textContent, answer);
  await user.click(within(top).getByRole("button", { name: "Name it" }));
  assert.ok(screen.getByText("Case closed"));
  // All eight flipped and the top lead named: no bold read beyond the suspects still standing, and an instant answer pays ×1.5.
  const earned = timed(points(0, false, 1) + boldness(pagesWithAll(data, deck.map((c) => c.w)), false), SPEED_MAX);
  assert.equal(document.querySelector(".cr-score b")?.textContent, earned.toLocaleString("en"));
  assert.equal(screen.getAllByRole("row").length, 1 + deck.length, "the debrief lists every card");
  assert.equal(localStorage.getItem("cold-read:best"), String(earned));
});

test("three wrong names end the run", async () => {
  const user = await dealt();
  for (let i = 0; i < deck.length; i++) await user.click(card(i));
  for (let miss = 0; miss < 3; miss++) {
    const wrong = leads().find((li) => li.querySelector(".cr-name")!.textContent !== answer)!;
    await user.click(within(wrong).getByRole("button", { name: "Name it" }));
  }
  assert.ok(screen.getByText("Case lost"));
  assert.match(screen.getByText(/Run over/).textContent!, /0 pages named, 0 points/);
  assert.ok(screen.getByRole("button", { name: "Play again" }));
});

test("hard mode, picked in the practice menu, deals the hard deck and offers no switch", async () => {
  const user = userEvent.setup();
  render(<ClueShopGame data={data} random={zero} clock={still} hard />);
  assert.equal(screen.queryByRole("checkbox", { name: /Hard mode/ }), null, "the round itself has no switch");
  await user.click(screen.getByRole("button", { name: "Start" }));
  const off = shuffled(round.hard, zero);
  off.forEach((c, i) => assert.match(card(i).getAttribute("aria-label")!, new RegExp(`${c.n} times here, on ${data.words[c.w].df} of`)));
  assert.ok(off.filter((c) => c.kind === "sharp").every((c) => data.words[c.w].df >= 6), "hard cards are on 6 pages or more");
  assert.ok(screen.getByText("Hard mode · ×2"));
});

test("keys 1 to 8 flip the matching card", async () => {
  const user = await dealt();
  await user.keyboard("3");
  assert.equal(screen.getByRole("button", { name: new RegExp(`^${deck[2].w}:`) }).getAttribute("data-open"), "true");
});

test("a lost heart breaks and the screen's edges flash red; a fresh deal shows no flash", async () => {
  const user = await dealt();
  assert.equal(document.querySelector(".cr-hit"), null, "no flash before a hit");
  for (let i = 0; i < deck.length; i++) await user.click(card(i));
  const wrong = leads().find((li) => li.querySelector(".cr-name")!.textContent !== answer)!;
  await user.click(within(wrong).getByRole("button", { name: "Name it" }));
  assert.ok(document.querySelector(".cr-hit"), "the red flash plays");
  const lost = document.querySelector('.cr-lives [data-lost="true"]')!;
  assert.equal(lost.getAttribute("data-on"), "false", "the broken heart is the one just lost");
  assert.equal([...document.querySelectorAll(".cr-lives span")].indexOf(lost), 2, "the rightmost full heart breaks");
});

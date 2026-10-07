// Round 1 (Clue Shop) played through its component: deal, flip, read the
// board, name the page, lose lives, and keep the best score.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClueShopGame } from "@/features/cold-read/ClueShopGame";
import { type ClueShopData, points, shuffled } from "@/features/cold-read/rules";
import { json, zero } from "./coldReadData";

const data = json<ClueShopData>("clue_shop.json");
const round = data.rounds[shuffled(data.rounds.map((_, i) => i), zero)[0]];
const deck = shuffled(round.on, zero);
const answer = data.pages[round.page].name;

beforeEach(() => localStorage.clear());

async function dealt() {
  const user = userEvent.setup();
  render(<ClueShopGame data={data} random={zero} />);
  await user.click(screen.getByRole("button", { name: "Deal the first page" }));
  return user;
}

const card = (i: number) => screen.getByRole("button", { name: new RegExp(`^Card ${i + 1},`) });
const count = () => Number(document.querySelector(".cr-count b")?.textContent);
const leads = () => within(screen.getByRole("complementary", { name: "Leads" })).queryAllByRole("listitem");

test("the deal shows eight face-down cards with only their two numbers", async () => {
  await dealt();
  deck.forEach((c, i) => {
    // The whole label is the two numbers: no room for the word.
    assert.match(card(i).getAttribute("aria-label")!, new RegExp(`^Card ${i + 1}, \\w+: ${c.n} times here, on ${data.words[c.w].df} of 303 pages$`));
  });
  assert.equal(count(), 303);
  assert.equal(leads().length, 0);
});

test("a word on every page clears nobody; a rare word clears the board", async () => {
  const user = await dealt();
  const everywhere = deck.findIndex((c) => data.words[c.w].df === 303);
  await user.click(card(everywhere));
  assert.match(screen.getByText(/Nobody left the board/).textContent!, new RegExp(deck[everywhere].w));
  assert.equal(count(), 303);
  const rare = deck.findIndex((c) => c.kind === "sharp");
  await user.click(card(rare));
  assert.ok(count() < 303 && count() >= 1);
  assert.ok(leads().length > 0);
});

test("naming the page after every flip closes the case and scores it", async () => {
  const user = await dealt();
  for (let i = 0; i < deck.length; i++) await user.click(card(i));
  const top = leads()[0];
  assert.match(top.textContent!, new RegExp(answer.replace(/[()]/g, "\\$&")));
  await user.click(within(top).getByRole("button", { name: "Name it" }));
  assert.ok(screen.getByText("Case closed"));
  assert.equal(document.querySelector(".cr-score b")?.textContent, points(0, false, 1).toLocaleString("en"));
  assert.equal(screen.getAllByRole("row").length, 1 + deck.length, "the debrief lists every card");
  assert.equal(localStorage.getItem("cold-read:best"), String(points(0, false, 1)));
});

test("three wrong names end the run", async () => {
  const user = await dealt();
  for (let i = 0; i < deck.length; i++) await user.click(card(i));
  for (let miss = 0; miss < 3; miss++) {
    const wrong = leads().find((li) => !li.textContent!.includes(answer))!;
    await user.click(within(wrong).getByRole("button", { name: "Name it" }));
  }
  assert.ok(screen.getByText("Case lost"));
  assert.match(screen.getByText(/Run over/).textContent!, /0 pages named, 0 points/);
  assert.ok(screen.getByRole("button", { name: "Play again" }));
});

test("hard mode is picked before the deal, deals the names-off deck, and is gone during play", async () => {
  const user = userEvent.setup();
  render(<ClueShopGame data={data} random={zero} />);
  await user.click(screen.getByRole("checkbox", { name: /Hard mode/ }));
  await user.click(screen.getByRole("button", { name: "Deal the first page" }));
  const off = shuffled(round.off, zero);
  off.forEach((c, i) => assert.match(card(i).getAttribute("aria-label")!, new RegExp(`${c.n} times here, on ${data.words[c.w].df} of`)));
  assert.ok(off.every((c) => data.words[c.w].name === 0));
  assert.equal(screen.queryByRole("checkbox", { name: /Hard mode/ }), null, "no switching mid-run");
  assert.ok(screen.getByText("Hard mode · ×2"));
});

test("keys 1 to 8 flip the matching card", async () => {
  const user = await dealt();
  await user.keyboard("3");
  assert.equal(screen.getByRole("button", { name: new RegExp(`^${deck[2].w}:`) }).getAttribute("data-open"), "true");
});

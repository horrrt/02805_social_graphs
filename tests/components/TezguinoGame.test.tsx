// Round 4 (Tezgüino) played through its component: read the row, buy the
// tools, pick the word, and run out of lives.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COST, options, points, type TezguinoData } from "@/features/cold-read/contexts";
import { shuffled } from "@/features/cold-read/rules";
import { TezguinoGame } from "@/features/cold-read/TezguinoGame";
import { json, noExamples, zero } from "./coldReadData";

const data = json<TezguinoData>("tezguino.json");
const order = shuffled(data.words.map((_, i) => i), zero);
const hidden = data.words[order[0]];
const four = options(data.words.length, order[0], zero);
const wrong = four.filter((i) => i !== order[0]);

beforeEach(() => {
  localStorage.clear();
  noExamples();
});

async function started() {
  const user = userEvent.setup();
  render(<TezguinoGame data={data} random={zero} />);
  await user.click(screen.getByRole("button", { name: "Hide the first word" }));
  return user;
}

const shown = () => [...document.querySelectorAll(".cr-board .cr-ctx-word")].map((e) => e.textContent);
const worth = () => document.querySelector(".cr-worth b")!.textContent;

test("the word starts as its ±1 row by raw count, its length hidden, and the picks hold it", async () => {
  await started();
  assert.equal(document.querySelector(".cr-tiles"), null, "no letter tiles until the answer");
  assert.deepEqual(shown(), hidden.rows.counts["1"].map(([c]) => c));
  const picks = within(screen.getByRole("complementary", { name: "Pick the word" })).getAllByRole("button", { name: /^\d/ });
  assert.deepEqual(picks.map((b) => b.textContent!.slice(1)), four.map((i) => data.words[i].w));
  assert.equal(worth(), "1,000");
});

test("a wider window, PPMI and a peek each cost what they say", async () => {
  const user = await started();
  await user.click(screen.getByRole("button", { name: /^Window ±3/ }));
  assert.deepEqual(shown(), hidden.rows.counts["3"].map(([c]) => c));
  await user.click(screen.getByRole("button", { name: /^PPMI/ }));
  assert.deepEqual(shown(), hidden.rows.ppmi["3"].map(([c]) => c));
  await user.click(screen.getByRole("button", { name: /^Window ±1/ }));
  await user.click(screen.getByRole("button", { name: /Peek at a sentence/ }));
  assert.equal(document.querySelectorAll(".cr-sentence").length, 1);
  assert.ok(document.querySelector(".cr-blackout"), "the peeked sentence hides the word");
  assert.equal(worth(), (1000 - 2 * COST.window - COST.ppmi - COST.peek).toLocaleString("en"), "narrowing again refunds nothing");
});

test("the right pick scores, reveals the word in its sentences and compares the weights", async () => {
  const user = await started();
  await user.click(screen.getByRole("button", { name: /^PPMI/ }));
  await user.keyboard(String(four.indexOf(order[0]) + 1));
  assert.match(screen.getByText(/^Right/).textContent!, new RegExp(`\\+${points(COST.ppmi, 1)}`));
  assert.equal(document.querySelectorAll(".cr-sentence mark").length >= 3, true);
  assert.ok(screen.getByText("Same word, two weightings"));
  assert.equal(document.activeElement?.textContent, "Next word");
  assert.equal(localStorage.getItem("cold-read:best4"), String(points(COST.ppmi, 1)));
});

test("three wrong picks end the run", async () => {
  const user = await started();
  for (let i = 0; i < 3; i++) {
    const options_ = within(screen.getByRole("complementary", { name: "Pick the word" })).getAllByRole("button", { name: /^\d/ });
    const answer = data.words[order[i]].w;
    await user.click(options_.find((b) => !b.textContent!.endsWith(answer))!);
    if (i < 2) await user.click(screen.getByRole("button", { name: "Next word" }));
  }
  assert.ok(screen.getByText(/Run over: 0 words named/));
  assert.equal(document.querySelectorAll(".cr-lives [data-on='true']").length, 0);
  void wrong;
});

test("two right picks in a row pay the ×2 streak", async () => {
  const user = await started();
  const pickAnswer = async (i: number) => {
    const answer = data.words[order[i]].w;
    const options_ = within(screen.getByRole("complementary", { name: "Pick the word" })).getAllByRole("button", { name: /^\d/ });
    await user.click(options_.find((b) => b.textContent!.slice(1) === answer)!);
  };
  await pickAnswer(0);
  await user.click(screen.getByRole("button", { name: "Next word" }));
  assert.equal(worth(), points(0, 2).toLocaleString("en"), "the next word shows what the streak will pay");
  await pickAnswer(1);
  assert.equal(document.querySelector(".cr-score b")?.textContent, (points(0, 1) + points(0, 2)).toLocaleString("en"));
});

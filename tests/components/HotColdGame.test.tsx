// Round 5 (Hot & Cold) played through its component: guess, get told off for
// unknown words, take a hint, find the word, and give up on the next.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HotColdGame } from "@/features/cold-read/HotColdGame";
import { shuffled } from "@/features/cold-read/rules";
import { SPEED_MAX, timed } from "@/features/cold-read/pace";
import { atRank, cosinesTo, type HotColdMeta, points, prepare, ranks } from "@/features/cold-read/vectors";
import { binary, json, noExamples, still, zero } from "./coldReadData";

const data = prepare(json<HotColdMeta>("hot_cold.json"), binary("hot_cold.bin"));
const order = shuffled(data.targets.map((_, i) => i), zero);
const target = data.targets[order[0]];
const word = data.vocab[target];
const rank = ranks(cosinesTo(data, target), target);
const nearest = data.vocab[atRank(rank, 1)];

beforeEach(() => {
  localStorage.clear();
  noExamples();
});

async function started() {
  const user = userEvent.setup();
  render(<HotColdGame data={data} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  return user;
}

const news = () => document.querySelector(".cr-news")!.textContent!;
const input = () => screen.getByRole("textbox", { name: "Your guess" });

test("the hidden word shows only its length and its page count", async () => {
  await started();
  assert.ok(screen.getByLabelText(`${word.length} letters`));
  assert.equal(document.querySelector(".cr-tiles")!.textContent, "");
  assert.equal(input(), document.activeElement, "the input takes focus");
});

test("unknown words and stopwords are turned away without costing a guess", async () => {
  const user = await started();
  await user.type(input(), "zzzz{Enter}");
  assert.match(news(), /not among the game’s 9,000 Marvel words/);
  await user.type(input(), "the{Enter}");
  assert.match(news(), /Stopwords/);
  assert.equal(document.querySelectorAll(".cr-glist li").length, 0);
});

test("a hint, a near guess and the word itself: found, scored, neighbours listed", async () => {
  const user = await started();
  await user.type(input(), `${nearest}{Enter}`);
  assert.match(news(), new RegExp(`“${nearest}”: cosine [0-9.]+, ranked #1\\. Burning\\.`));
  await user.click(screen.getByRole("button", { name: /^Hint/ }));
  assert.match(news(), /#100 neighbour/);
  assert.equal(input(), document.activeElement, "a hint hands focus back to the input");
  await user.type(input(), `${word}{Enter}`);
  assert.ok(screen.getByText("Found it"));
  assert.equal(document.querySelector(".cr-score b")?.textContent, timed(points(2, 1, 1), SPEED_MAX).toLocaleString("en"));
  assert.equal(document.querySelector(".cr-tiles")!.textContent, word);
  assert.equal(document.querySelectorAll(".cr-neigh li").length, 10);
  assert.equal(document.activeElement?.textContent, "Next word");
});

test("giving up reveals the word and resets the streak", async () => {
  const user = await started();
  await user.click(screen.getByRole("button", { name: "Give up" }));
  assert.ok(screen.getByText("Gave up"));
  assert.equal(document.querySelector(".cr-tiles")!.textContent, word);
  assert.equal(document.querySelector(".cr-score b")?.textContent, "0");
});

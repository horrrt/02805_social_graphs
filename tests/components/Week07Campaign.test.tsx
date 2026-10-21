// The Week 7 campaign played through its component: four levels in the
// brief's order, skips that never push the total below 0, and each game's
// level mode: the campaign's total on its scoreboard, Finish handing over the
// level's points, no retry inside a level, and no practice best written.
import "./dom";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FINISH, type Level } from "@/features/cold-read/levels";
import { SameWordGame } from "@/features/same-word/SameWordGame";
import { compareAnswer, methodAnswer, ROUNDS as WORD_ROUNDS, scoreRound } from "@/features/same-word/rounds";
import { SemanticMinefieldGame } from "@/features/semantic-minefield/SemanticMinefieldGame";
import { boardFor, ROUNDS as MINE_ROUNDS } from "@/features/semantic-minefield/rounds";
import { CHALLENGES, POINTS } from "@/features/sentiment-trap/challenges";
import type { SentimentTrapData } from "@/features/sentiment-trap/data";
import { SentimentTrapGame } from "@/features/sentiment-trap/SentimentTrapGame";
import type { TwoStripesData } from "@/features/two-stripes/rules";
import { CampaignGame } from "@/features/week07-campaign/CampaignGame";
import { LEVELS } from "@/features/week07-campaign/levels";
import { noExamples, still, zero } from "./coldReadData";

const read = <T,>(name: string) => JSON.parse(readFileSync(new URL(`../../public/play/week07/data/${name}`, import.meta.url), "utf8")) as T;
const stripes = read<TwoStripesData>("two_stripes.json");
const sentiment = read<SentimentTrapData>("sentiment_trap.json");

beforeEach(() => {
  localStorage.clear();
  for (const key of ["same-word:best", "sentiment-trap:best", "semantic-minefield:best", "week07:best-campaign"]) {
    document.cookie = `${encodeURIComponent(key)}=; max-age=0; path=/`;
  }
  noExamples();
  localStorage.setItem("cold-read:example:two-stripes", "0");
});

const score = () => Number(document.querySelector(".cr-hud .cr-score b")!.textContent!.replace(/,/g, ""));
const track = () => within(screen.getByRole("list", { name: "Levels" })).getAllByRole("listitem");

/** A level that records what the game handed over. */
function spy(items: number, total = 1000) {
  const calls: { done: number[]; skipped: number[] } = { done: [], skipped: [] };
  const level: Level = { items, total, onDone: (p) => calls.done.push(p), onSkip: (p) => calls.skipped.push(p) };
  return { level, calls };
}

test("the levels follow the brief: sections 1, 2, 4 and 6", () => {
  assert.deepEqual(LEVELS.map((l) => l.id), ["same-word", "two-stripes", "sentiment-trap", "semantic-minefield"]);
  assert.ok(LEVELS[0].items <= WORD_ROUNDS.length && LEVELS[2].items === CHALLENGES.length && LEVELS[3].items <= MINE_ROUNDS.length);
});

test("the campaign opens on level 1, and four skips at 0 end it at 0", async () => {
  const user = userEvent.setup();
  render(<CampaignGame data={{ stripes, sentiment }} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start the campaign" }));
  assert.deepEqual(track().map((li) => li.getAttribute("data-state")), ["current", "locked", "locked", "locked"]);
  for (let i = 0; i < LEVELS.length; i++) {
    await user.click(screen.getByRole("button", { name: /Skip level/ }));
    if (i + 1 < LEVELS.length) {
      assert.ok(screen.getByText(`Level ${i + 1} skipped · −0`));
      await user.click(screen.getByRole("button", { name: `Start level ${i + 2}` }));
    }
  }
  assert.ok(screen.getByText("Campaign complete"));
  assert.equal(document.querySelector(".cr-camp-total b")!.textContent, "0");
  assert.deepEqual(track().map((li) => li.getAttribute("data-state")), ["skipped", "skipped", "skipped", "skipped"]);
});

test("a level whose data has not arrived says so and can be skipped", async () => {
  const user = userEvent.setup();
  render(<CampaignGame data={{}} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start the campaign" }));
  await user.click(screen.getByRole("button", { name: /Skip level/ }));
  await user.click(screen.getByRole("button", { name: "Start level 2" }));
  assert.ok(screen.getByText(/Loading this level/));
});

test("Same Word as a level plays its first rounds and hands over their points", async () => {
  const user = userEvent.setup();
  const { level, calls } = spy(2);
  render(<SameWordGame level={level} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  assert.equal(score(), level.total, "the scoreboard starts at the campaign's total");
  let earned = 0;
  for (const [i, r] of WORD_ROUNDS.slice(0, 2).entries()) {
    const compare = { same: /^Same representation/, different: /^Different representations/, unknown: /^Not enough information/ }[compareAnswer(r)];
    await user.click(screen.getByRole("radio", { name: compare }));
    await user.click(screen.getByRole("radio", { name: methodAnswer(r) === "static" ? /^Static embedding/ : /^Contextual embedding/ }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));
    if (r.clues) await user.click(screen.getByRole("button", { name: "Check" }));
    earned += scoreRound(r, compareAnswer(r), methodAnswer(r)).points;
    await user.click(screen.getByRole("button", { name: i === 1 ? "See the results" : "Next round →" }));
  }
  assert.equal(score(), level.total + earned);
  await user.click(screen.getByRole("button", { name: FINISH }));
  assert.deepEqual(calls.done, [earned]);
  assert.equal(localStorage.getItem("same-word:best"), null, "a level writes no practice best");
});

test("Sentiment Trap as a level ends on its takeaway, then Finish hands over the points", async () => {
  const user = userEvent.setup();
  const { level, calls } = spy(CHALLENGES.length);
  render(<SentimentTrapGame data={sentiment} level={level} />);
  await user.click(screen.getByRole("button", { name: "Start challenge →" }));
  for (const [i, c] of CHALLENGES.entries()) {
    await user.click(screen.getByRole("radio", { name: c.options(sentiment).find((o) => o.id === c.answer)!.text }));
    await user.click(screen.getByRole("button", { name: "Submit answer →" }));
    await user.click(screen.getByRole("button", { name: i + 1 < CHALLENGES.length ? "Next challenge →" : "See the takeaway →" }));
  }
  assert.ok(screen.getByRole("heading", { name: "A score is not a measurement" }));
  assert.equal(screen.queryByRole("link", { name: "More games" }), null);
  const earned = CHALLENGES.length * POINTS.correct + POINTS.bonus;
  assert.equal(score(), level.total + earned);
  await user.click(screen.getByRole("button", { name: FINISH }));
  assert.deepEqual(calls.done, [earned]);
  assert.equal(localStorage.getItem("sentiment-trap:best"), null);
});

test("Semantic Minefield as a level has no retry: out of lives goes to the results and Finish", async () => {
  const user = userEvent.setup();
  const { level, calls } = spy(1, 0);
  render(<SemanticMinefieldGame level={level} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  const board = boardFor(MINE_ROUNDS[0]);
  const tiles = () => screen.getAllByRole("button").filter((b) => b.classList.contains("sm-tile"));
  for (const i of board.bomb.flatMap((b, i) => (b ? [i] : [])).slice(0, 3)) await user.click(tiles()[i]);
  assert.ok(screen.getByText("Out of lives", { selector: "h3" }));
  assert.equal(screen.queryByRole("button", { name: "Play again" }), null);
  const total = score();
  assert.ok(total < 0, "three bombs cost more than nothing");
  await user.click(screen.getByRole("button", { name: "See the results" }));
  await user.click(screen.getByRole("button", { name: FINISH }));
  assert.deepEqual(calls.done, [total], "the game hands over what it scored; the campaign floors it");
  assert.equal(localStorage.getItem("semantic-minefield:best"), null);
});

test("a skip inside a level hands over the points so far", async () => {
  const user = userEvent.setup();
  const { level, calls } = spy(3);
  render(<SemanticMinefieldGame level={level} />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  await user.click(screen.getByRole("button", { name: /Skip level/ }));
  assert.deepEqual(calls.skipped, [0]);
});

test("a level that ends below 0 adds nothing to the campaign", async () => {
  const user = userEvent.setup();
  render(<CampaignGame data={{ stripes, sentiment }} random={zero} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start the campaign" }));
  for (let i = 0; i < 3; i++) {
    await user.click(screen.getByRole("button", { name: /Skip level/ }));
    await user.click(screen.getByRole("button", { name: `Start level ${i + 2}` }));
  }
  await user.click(screen.getByRole("button", { name: "Start" }));
  const board = boardFor(MINE_ROUNDS[0]);
  const tiles = () => screen.getAllByRole("button").filter((b) => b.classList.contains("sm-tile"));
  for (const i of board.bomb.flatMap((b, i) => (b ? [i] : [])).slice(0, 3)) await user.click(tiles()[i]);
  await user.click(screen.getByRole("button", { name: "See the results" }));
  await user.click(screen.getByRole("button", { name: FINISH }));
  assert.ok(screen.getByText("Campaign complete"));
  assert.equal(document.querySelector(".cr-camp-total b")!.textContent, "0");
  assert.equal(track()[3].querySelector(".cr-track-score")!.textContent, "");
});

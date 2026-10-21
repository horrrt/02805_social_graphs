// Topic Tetris played through its component: start, steer and drop pages,
// get one wrong, let one fall, and finish all three rounds, the maps, the
// check and the end. The data is the real JSON, so the tests also pin that
// every page's on-screen evidence points to its group, and that pages really
// move between rounds.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicTetrisGame } from "@/features/topic-tetris/TopicTetrisGame";
import {
  answer, evidence, FALL_S, feedback, letter, movers, POINTS, QUIZ, ROUND, ROUND_KEYS, short, type TopicTetrisData,
} from "@/features/topic-tetris/rules";

const data = JSON.parse(
  readFileSync(new URL("../../public/play/topic-tetris/data/topic_tetris.json", import.meta.url), "utf8"),
) as TopicTetrisData;

/** A stopped clock: every drop is instant, so every right call is also fast. */
const still = () => 0;
const RIGHT_FAST = POINTS.right + POINTS.fast;

const groupLabel = (round: number, group: number) => `${ROUND[ROUND_KEYS[round]].group} ${letter(data, round, group)}`;
const falling = () => document.querySelector(".tt-block header b")?.textContent;

async function started(clock = still) {
  const user = userEvent.setup();
  render(<TopicTetrisGame data={data} clock={clock} />);
  await user.click(screen.getByRole("button", { name: "Start game →" }));
  return user;
}

/** Drops every page of a round into its right group, then opens the round's summary. */
async function playRound(user: ReturnType<typeof userEvent.setup>, round: number) {
  for (const page of data.pages) {
    assert.equal(falling(), short(page.name));
    await user.click(screen.getByRole("button", { name: `Drop into ${groupLabel(round, answer(page, round))}` }));
  }
  await user.click(screen.getByRole("button", { name: "See the round →" }));
}

test("every page's evidence on the board points to its own group", () => {
  for (const page of data.pages) {
    const words = [0, 0, 0];
    for (const [, n, g] of page.words.chips) words[g] += n;
    assert.equal(words.indexOf(Math.max(...words)), page.words.group, `${page.name}: words`);
    const votes = [0, 0, 0];
    for (const [, , g] of page.meaning.near) votes[g] += 1;
    assert.ok(votes[page.meaning.group] >= 2, `${page.name}: nearest pages`);
    const { links, group } = page.connections;
    assert.ok(links.every((n, g) => g === group || n < links[group]), `${page.name}: links`);
  }
});

test("each round has three groups, and pages move between rounds", () => {
  for (const round of data.rounds) assert.deepEqual(round.groups.map((g) => g.letter), ["A", "B", "C"]);
  for (const page of data.pages) for (const r of [0, 1, 2]) assert.ok(answer(page, r) >= 0 && answer(page, r) < 3);
  assert.ok(movers(data, 1).length >= 3, "words to meaning");
  assert.ok(movers(data, 2).length >= 3, "meaning to connections");
});

test("the feedback quotes the page's own numbers from the data", () => {
  const storm = data.pages[0];
  const [word, count] = storm.words.chips[0];
  assert.match(evidence(data, storm, 0), new RegExp(`${word} ×${count}`));
  const [near, cos] = storm.meaning.near[0];
  assert.match(evidence(data, storm, 1), new RegExp(`${short(near)} \\(${cos.toFixed(2)}\\)`));
  assert.match(evidence(data, storm, 2), new RegExp(`has ${storm.connections.links[storm.connections.group]} links into`));
});

test("the first page falls with its words, and a right drop scores and moves on", async () => {
  const user = await started();
  const first = data.pages[0];
  assert.equal(falling(), short(first.name));
  const chips = [...document.querySelectorAll(".tt-block .tt-chips li")].map((li) => li.textContent);
  assert.deepEqual(chips, first.words.chips.map(([w, n]) => `${w} ×${n}`));
  await user.click(screen.getByRole("button", { name: `Drop into ${groupLabel(0, answer(first, 0))}` }));
  assert.ok(screen.getByText("Right"));
  assert.equal(document.querySelector(".cr-score b")!.textContent, String(RIGHT_FAST));
  assert.equal(falling(), short(data.pages[1].name));
});

test("a wrong drop says where the page belongs and waits for the player", async () => {
  const user = await started();
  const first = data.pages[0];
  const wrong = (answer(first, 0) + 1) % 3;
  await user.click(screen.getByRole("button", { name: `Drop into ${groupLabel(0, wrong)}` }));
  assert.ok(screen.getByText(`Not quite: it belongs in ${groupLabel(0, answer(first, 0))}`));
  assert.equal(document.querySelector(".cr-score b")!.textContent, "0", "the score never goes below zero");
  assert.equal(falling(), undefined, "no block falls until the player has read why");
  const tile = document.querySelector(`.tt-bin[data-group="${answer(first, 0)}"] [data-flip="${first.id}"]`);
  assert.equal(tile?.getAttribute("data-missed"), `you: ${letter(data, 0, wrong)}`);
  await user.click(screen.getByRole("button", { name: "Got it" }));
  assert.equal(falling(), short(data.pages[1].name));
});

test("the arrow keys steer and drop the block", async () => {
  const user = await started();
  await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowDown}");
  const first = data.pages[0];
  assert.ok(document.querySelector(`.tt-bin[data-group="${answer(first, 0)}"] [data-flip="${first.id}"]`));
  const right = answer(first, 0) === 0;
  assert.ok(screen.getByText(right ? "Right" : `Not quite: it belongs in ${groupLabel(0, answer(first, 0))}`));
});

test("a block left alone lands in the column it is over", async () => {
  let now = 0;
  await started(() => now);
  now = FALL_S.words * 1000 + 1;
  await act(() => new Promise((r) => setTimeout(r, 150)));
  const first = data.pages[0];
  assert.ok(document.querySelector(`[data-flip="${first.id}"]`), "the page landed");
  const right = answer(first, 0) === 1;
  assert.ok(screen.getByText(right ? "Right" : `Not quite: it belongs in ${groupLabel(0, answer(first, 0))}`));
});

test("in round two a wrong drop recalls the page's group under words", () => {
  const mover = movers(data, 1)[0];
  const wrong = (answer(mover, 1) + 1) % 3;
  const { lines } = feedback(data, mover, 1, wrong);
  assert.ok(lines.some((l) => l.includes(`Under ${ROUND.words.representation} it was in Topic ${letter(data, 0, answer(mover, 0))}`)));
});

test("three rounds, the maps, the check and the end", async () => {
  const user = await started();
  for (const round of [0, 1, 2]) {
    await playRound(user, round);
    assert.ok(screen.getByText(`Round ${round + 1} complete`, { exact: false }));
    assert.ok(screen.getByText(`Right (${data.pages.length} of ${data.pages.length})`));
    if (round < 2) {
      await user.click(screen.getByRole("button", { name: "Next round →" }));
      assert.ok(screen.getByText("Different representation."));
      await user.click(screen.getByRole("button", { name: `Start round ${round + 2}: ${ROUND[ROUND_KEYS[round + 1]].title} →` }));
    }
  }
  await user.click(screen.getByRole("button", { name: "See the three maps →" }));
  assert.ok(screen.getByText("Three different maps."));
  const rows = [...document.querySelectorAll(".tt-where tbody tr")];
  data.pages.forEach((page, i) => {
    const cells = [...rows[i].querySelectorAll("td")].map((td) => td.textContent);
    assert.deepEqual(cells, [0, 1, 2].map((r) => letter(data, r, answer(page, r))), page.name);
  });
  await user.click(screen.getByRole("button", { name: "Meaning" }));
  for (const page of data.pages) {
    const group = document.querySelector(`.tt-map-board .tt-group[data-group="${answer(page, 1)}"]`);
    assert.ok(group?.querySelector(`[data-flip="${page.id}"]`), `${page.name} sits in its meaning group`);
  }
  await user.click(screen.getByRole("button", { name: "One quick check →" }));
  await user.click(screen.getByLabelText(QUIZ.options[QUIZ.answer], { exact: false }));
  await user.click(screen.getByRole("button", { name: "Check answer" }));
  assert.ok(screen.getByText("Yes: the representation."));
  await user.click(screen.getByRole("button", { name: "See your result →" }));
  const total = 3 * (data.pages.length * RIGHT_FAST + POINTS.round);
  assert.equal(document.querySelector(".tt-card-score b")!.textContent, total.toLocaleString("en"));
  assert.equal(screen.getAllByText(`${data.pages.length} of ${data.pages.length} right`).length, 3);
  await user.click(screen.getByRole("button", { name: "Play again" }));
  assert.equal(falling(), short(data.pages[0].name));
  assert.equal(document.querySelector(".cr-score b")!.textContent, "0");
});

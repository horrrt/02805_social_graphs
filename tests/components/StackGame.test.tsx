// Topic Tetris's stack edition played through its component: steer a tile
// across the well's thirds, drop it, miss one, and finish all three rounds,
// the maps, the check and the result. Rules and data are the first
// edition's; these tests pin the board.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COLS, StackGame } from "@/features/topic-tetris/StackGame";
import { answer, letter, POINTS, QUIZ, ROUND, ROUND_KEYS, short, type TopicTetrisData } from "@/features/topic-tetris/rules";

const data = JSON.parse(
  readFileSync(new URL("../../public/play/topic-tetris/data/topic_tetris.json", import.meta.url), "utf8"),
) as TopicTetrisData;
const still = () => 0;
const n = data.pages.length;
const groupLabel = (round: number, group: number) => `${ROUND[ROUND_KEYS[round]].group} ${letter(data, round, group)}`;
const falling = () => document.querySelector(".ts-now-name b")?.textContent;
const tile = (id: string) => document.querySelector(`.ts-well [data-flip="${id}"]`);

async function started() {
  const user = userEvent.setup();
  render(<StackGame data={data} clock={still} />);
  await user.click(screen.getByRole("button", { name: "Start game" }));
  return user;
}

test("the tile starts in the middle third and the arrows move it one cell at a time", async () => {
  const user = await started();
  const slot = () => (document.querySelector(".ts-falling") as HTMLElement).style.getPropertyValue("--x");
  assert.equal(slot(), String(Math.floor(COLS / 2)));
  await user.keyboard("{ArrowLeft}{ArrowLeft}");
  assert.equal(slot(), String(Math.floor(COLS / 2) - 2));
  await user.keyboard("{ArrowDown}");
  const first = data.pages[0];
  assert.ok(tile(first.id), "the page stacks in the well");
  assert.equal(tile(first.id)!.getAttribute("data-group"), String(answer(first, 0)), "coloured by its group");
});

test("a tile stacks in its group's third, and a miss is marked and explained", async () => {
  const user = await started();
  const first = data.pages[0];
  const wrong = (answer(first, 0) + 1) % 3;
  await user.click(screen.getByRole("button", { name: `Drop into ${groupLabel(0, wrong)}` }));
  assert.ok(screen.getByText(`Not quite: it belongs in ${groupLabel(0, answer(first, 0))}`));
  const slot = tile(first.id)!.parentElement as HTMLElement;
  assert.equal(Math.floor(Number(slot.style.getPropertyValue("--x")) / 3), answer(first, 0));
  assert.equal(tile(first.id)!.getAttribute("data-missed"), `you: ${letter(data, 0, wrong)}`);
  await user.click(screen.getByRole("button", { name: "Got it" }));
  assert.equal(falling(), short(data.pages[1].name));
});

test("moves and a drop sent in one burst land where the moves left the tile", async () => {
  await started();
  const first = data.pages[0];
  const target = answer(first, 0);
  const steps = (target - 1) * 3;
  const key = steps < 0 ? "ArrowLeft" : "ArrowRight";
  // Every key in one task, so React renders nothing between the moves and the drop.
  act(() => {
    for (let i = 0; i < Math.abs(steps); i++) window.dispatchEvent(new KeyboardEvent("keydown", { key }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
  });
  assert.ok(screen.getByText("Right"));
  assert.equal(tile(first.id)!.getAttribute("data-missed"), null);
});

test("a miss on an empty score takes nothing off, and the breakdown says so", async () => {
  const user = await started();
  const [first, ...rest] = data.pages;
  await user.click(screen.getByRole("button", { name: `Drop into ${groupLabel(0, (answer(first, 0) + 1) % 3)}` }));
  await user.click(screen.getByRole("button", { name: "Got it" }));
  for (const page of rest) await user.click(screen.getByRole("button", { name: `Drop into ${groupLabel(0, answer(page, 0))}` }));
  await user.click(screen.getByRole("button", { name: "See the round" }));
  const round = rest.length * (POINTS.right + POINTS.fast) + POINTS.round;
  assert.ok(screen.getByText(`This round ${round.toLocaleString("en")}`));
  assert.ok(screen.getByText(`Score: ${round.toLocaleString("en")}`, { exact: false }));
});

test("three rounds, the maps, the check and the result", async () => {
  const user = await started();
  for (const round of [0, 1, 2]) {
    for (const page of data.pages) {
      assert.equal(falling(), short(page.name));
      await user.click(screen.getByRole("button", { name: `Drop into ${groupLabel(round, answer(page, round))}` }));
    }
    await user.click(screen.getByRole("button", { name: "See the round" }));
    assert.ok(screen.getByText(`Round ${round + 1} complete!`, { exact: false }));
    assert.ok(screen.getByText(`+${n * POINTS.right}`));
    if (round < 2) {
      await user.click(screen.getByRole("button", { name: "Next round" }));
      assert.ok(screen.getByText("Different representation.", { exact: false }));
      await user.click(screen.getByRole("button", { name: `Continue to round ${round + 2}` }));
    }
  }
  await user.click(screen.getByRole("button", { name: "See the three maps" }));
  const maps = [...document.querySelectorAll(".ts-map")];
  assert.equal(maps.length, 3);
  maps.forEach((map, r) => {
    for (const page of data.pages) {
      const group = map.querySelector(`.ts-map-group[data-group="${answer(page, r)}"]`);
      assert.ok(group?.querySelector(`[data-flip="${page.id}"]`), `${page.name} in ${ROUND_KEYS[r]}`);
    }
  });
  await user.click(screen.getByRole("button", { name: "Next" }));
  assert.equal(screen.queryByText("Different maps.", { exact: false }), null, "the ending waits for the check");
  await user.click(screen.getByLabelText(QUIZ.options[QUIZ.answer], { exact: false }));
  await user.click(screen.getByRole("button", { name: "Check answer" }));
  assert.ok(screen.getByText("Yes: B, the representation."));
  const total = 3 * (n * (POINTS.right + POINTS.fast) + POINTS.round);
  assert.ok(screen.getByText(`Score: ${total.toLocaleString("en")}`));
  assert.equal(screen.getAllByText(`${n} of ${n}`).length, 3);
  await user.click(screen.getByRole("button", { name: "Play again" }));
  assert.equal(falling(), short(data.pages[0].name));
});

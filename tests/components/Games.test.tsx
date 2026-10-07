// The kit games from the keyboard: GameShell's settings are aria-pressed
// buttons and Start moves the run into play; in a ClueReveal round Space shows
// the next clue (even with focus on a suspect) and a number key answers, and
// fewer clues score more; a QuizRun plays a round through to its reveal.
import "./dom";
import test from "node:test";
import assert from "node:assert/strict";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizRun, { ClueReveal, type ClueRound, type RoundResult } from "@/kit/QuizRun";

// jsdom has no matchMedia; the rounds read prefers-reduced-motion through it.
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;

const ROUND: ClueRound = {
  type: "clue",
  id: "k",
  answer: "keeper",
  suspects: [
    { key: "baker", label: "The baker" },
    { key: "keeper", label: "The keeper" },
  ],
  clues: ["night", "lamp", "tower"],
  bags: { keeper: { lamp: 2, tower: 2, night: 1 }, baker: { bread: 3, night: 1 } },
};

test("Space shows the next clue, a number key answers, and fewer clues score more", async () => {
  const user = userEvent.setup();
  const got: RoundResult[] = [];
  render(<ClueReveal round={ROUND} onAnswer={(r) => got.push(r)} />);
  const box = screen.getByRole("group", { name: /Who is it/ });
  box.focus();
  assert.equal(screen.getAllByRole("listitem").filter((li) => li.closest(".kit-quiz-clues")).length, 1);
  await user.keyboard(" ");
  assert.match(box.textContent ?? "", /Clue 2 of 3/);
  screen.getByRole("button", { name: /The baker/ }).focus();
  await user.keyboard(" ");
  assert.match(box.textContent ?? "", /Clue 3 of 3/, "Space on a suspect shows a clue and does not answer");
  assert.equal(got.length, 0);
  await user.keyboard("2");
  assert.deepEqual(got.map((r) => [r.correct, r.points]), [[true, 1]]);
  assert.match(box.textContent ?? "", /machine committed at clue 2/);
});

test("a quiz run: pick settings, start, answer, and reach the reveal", async () => {
  const user = userEvent.setup();
  render(<QuizRun rounds={[ROUND]} lengths={[1, 2]} dailyToggle={false} />);
  const one = screen.getByRole("button", { name: /^1 rounds/ });
  assert.equal(one.getAttribute("aria-pressed"), "true");
  await user.click(screen.getByRole("button", { name: /^2 rounds/ }));
  assert.equal(screen.getByRole("button", { name: /^2 rounds/ }).getAttribute("aria-pressed"), "true");
  await user.click(screen.getByRole("button", { name: /^1 rounds/ }));
  await user.click(screen.getByRole("button", { name: "Open the case file" }));
  await act(async () => screen.getByRole("group", { name: /Who is it/ }).focus());
  await user.keyboard("2");
  await user.click(screen.getByRole("button", { name: "Close the case" }));
  assert.ok(screen.getByRole("button", { name: "Play again" }));
  assert.match(document.body.textContent ?? "", /3 points, 1 of 1 right/);
});

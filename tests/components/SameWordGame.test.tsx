// Same Word, Different Worlds: every round's answers follow from its stated
// procedure, its clue words are in its sentences, and the game plays through
// predict, clues and feedback to the results and back again.
import "./dom";
import "./coldReadData";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { contextualShades, SameWordGame, shades } from "@/features/same-word/SameWordGame";
import {
  clueCount,
  compareAnswer,
  maxScore,
  methodAnswer,
  type Pick,
  POINTS,
  ROUNDS,
  type Round,
  scoreClues,
  scoreRound,
  targetIndex,
  tokens,
} from "@/features/same-word/rounds";

const round = (id: string) => ROUNDS.find((r) => r.id === id)!;

beforeEach(() => localStorage.clear());

test("every round puts its word once in each sentence and its clue words in their sentence", () => {
  assert.ok(ROUNDS.length >= 5 && ROUNDS.length <= 7);
  assert.equal(new Set(ROUNDS.map((r) => r.id)).size, ROUNDS.length);
  for (const r of ROUNDS) {
    for (const [s, sentence] of r.sentences.entries()) {
      assert.equal(tokens(sentence).filter((t) => t.word === r.word).length, 1, `${r.id}: “${r.word}” once in sentence ${s + 1}`);
      for (const clue of r.clues?.[s] ?? []) {
        assert.ok(tokens(sentence).some((t) => t.word === clue), `${r.id}: clue “${clue}” is in sentence ${s + 1}`);
        assert.notEqual(clue, r.word, `${r.id}: the word itself is no clue`);
      }
    }
  }
});

test("the answers follow from how each round's model makes its vectors", () => {
  for (const r of ROUNDS) {
    if (r.method === "static") assert.equal(compareAnswer(r), "same", r.id);
    if (r.method === "contextual") assert.equal(compareAnswer(r), "different", r.id);
    if (r.method === null) assert.equal(compareAnswer(r), "unknown", r.id);
    assert.equal(methodAnswer(r), r.method ?? "contextual", r.id);
  }
  // The rounds must not reward one fixed answer: each option of the first question is right somewhere,
  // and static is right somewhere even though the meanings differ there.
  for (const k of ["same", "different", "unknown"]) assert.ok(ROUNDS.some((r) => compareAnswer(r) === k), `some round answers ${k}`);
  assert.ok(ROUNDS.some((r) => r.method === "static" && r.sense === "different"), "a static round with two meanings");
  assert.ok(ROUNDS.some((r) => r.method === "contextual" && r.sense === "same"), "a contextual round with one meaning");
  assert.ok(ROUNDS.some((r) => r.sense === "unclear"), "a round whose context is vague");
  assert.ok(ROUNDS.filter((r) => r.clues).length >= 2, "a few clue rounds");
  // The first round is the brief's bank example; the procedure, not the brand, names the model.
  assert.equal(ROUNDS[0].word, "bank");
  for (const r of ROUNDS) assert.doesNotMatch(r.how, /BERT|GloVe|Word2Vec|static|contextual/i, `${r.id}: the procedure names no model`);
});

test("clue taps score +10 each, −5 for any other word, never below zero", () => {
  const bank = round("bank");
  const at = (s: 0 | 1, w: string): Pick => `${s}:${tokens(bank.sentences[s]).findIndex((t) => t.word === w)}`;
  assert.deepEqual(scoreClues(bank, [at(0, "salary"), at(1, "river")]), { right: 2, wrong: 0, points: 20 });
  assert.deepEqual(scoreClues(bank, [at(0, "salary"), at(0, "the")]), { right: 1, wrong: 1, points: 5 });
  assert.deepEqual(scoreClues(bank, [at(0, "my"), at(1, "we")]), { right: 0, wrong: 2, points: 0 });
  assert.deepEqual(scoreClues(round("apple"), []), { right: 0, wrong: 0, points: 0 });
  assert.equal(scoreRound(bank, "different", "contextual").points, POINTS.compare + POINTS.model);
  assert.equal(scoreRound(bank, "same", "static").points, 0, "a consistent pair is still wrong for this model");
  assert.equal(maxScore(ROUNDS), ROUNDS.length * (POINTS.compare + POINTS.model) + ROUNDS.reduce((n, r) => n + clueCount(r), 0) * POINTS.clue);
});

test("the pictures are fixed: a static word draws one strip twice, and one meaning draws two close strips", () => {
  assert.deepEqual(shades("bank"), shades("bank"));
  const [a, b] = contextualShades(round("loan"));
  assert.equal(a.filter((v, i) => v !== b[i]).length, 2, "same sense: two dots differ");
  const [c, d] = contextualShades(round("bank"));
  assert.ok(c.filter((v, i) => v !== d[i]).length > 4, "different senses: most dots differ");
});

/** Answer a round right, tap every clue, and move on. */
async function solve(user: ReturnType<typeof userEvent.setup>, r: Round, last: boolean) {
  const compare = { same: /^Same representation/, different: /^Different representations/, unknown: /^Not enough information/ }[compareAnswer(r)];
  await user.click(screen.getByRole("radio", { name: compare }));
  await user.click(screen.getByRole("radio", { name: methodAnswer(r) === "static" ? /^Static embedding/ : /^Contextual embedding/ }));
  await user.click(screen.getByRole("button", { name: "Submit answer" }));
  if (r.clues) {
    for (const s of [0, 1] as const) {
      const group = screen.getByRole("group", { name: `Sentence ${s + 1}` });
      for (const clue of r.clues[s]) {
        const t = tokens(r.sentences[s]).find((x) => x.word === clue)!;
        await user.click(within(group).getByRole("button", { name: t.text }));
      }
    }
    await user.click(screen.getByRole("button", { name: "Check" }));
  }
  await user.click(screen.getByRole("button", { name: last ? "See the results" : "Next round →" }));
}

test("a round plays through predict, clues and feedback", async () => {
  const user = userEvent.setup();
  render(<SameWordGame />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  const bank = ROUNDS[0];
  assert.equal(document.querySelectorAll(".sw-word").length, 2, "the word is lit in both sentences");
  assert.equal(document.querySelector(".sw-chip")!.textContent, "bank", "one word type");
  const submit = screen.getByRole("button", { name: "Submit answer" }) as HTMLButtonElement;
  assert.equal(submit.disabled, true);
  await user.keyboard("2");
  assert.equal(submit.disabled, true, "both questions need an answer");
  await user.click(screen.getByRole("radio", { name: /^Contextual embedding/ }));
  await user.click(submit);

  // The clue step: the word itself cannot be tapped.
  const first = screen.getByRole("group", { name: "Sentence 1" });
  assert.equal(within(first).queryByRole("button", { name: "bank." }), null);
  await user.click(within(first).getByRole("button", { name: "salary" }));
  await user.click(within(first).getByRole("button", { name: "the" }));
  assert.equal(within(first).getByRole("button", { name: "the" }).getAttribute("aria-pressed"), "true");
  await user.click(screen.getByRole("button", { name: "Check" }));

  const stamps = [...document.querySelectorAll(".cr-stamp")].map((s) => s.textContent);
  assert.deepEqual(stamps, ["✓ Different representations", "✓ Contextual embedding"]);
  const points = POINTS.compare + POINTS.model + POINTS.clue - POINTS.wrongClue;
  assert.equal(document.querySelector(".cr-score b")!.textContent, String(points));
  assert.match(document.querySelector(".sw-clue-score")!.textContent!, /1 of 4 found, 1 other word tapped/);
  assert.deepEqual([...document.querySelectorAll(".sw-feedback .sw-clue")].map((m) => m.textContent), ["deposited", "salary", "sat", "river"]);
  const marked = document.querySelector('.sw-model[data-this="true"] h4')!.textContent;
  assert.equal(marked, "Contextual embedding", "this round's model is marked");
  assert.ok(screen.getByText(/not real numbers/));
  assert.equal(targetIndex(bank, bank.sentences[0]), tokens(bank.sentences[0]).length - 1);
});

test("a wrong pair is marked wrong and says what the player chose", async () => {
  const user = userEvent.setup();
  render(<SameWordGame />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  await solve(user, ROUNDS[0], false);
  // Round 2 is the lookup table: two meanings, still one vector.
  await user.click(screen.getByRole("radio", { name: /^Different representations/ }));
  await user.click(screen.getByRole("radio", { name: /^Contextual embedding/ }));
  await user.click(screen.getByRole("button", { name: "Submit answer" }));
  assert.equal(screen.queryByRole("button", { name: "Check" }), null, "no clue step on this round");
  assert.deepEqual([...document.querySelectorAll(".cr-stamp")].map((s) => s.getAttribute("data-grade")), ["bad", "bad"]);
  assert.match(document.querySelector(".sw-yours")!.textContent!, /different representations, contextual embedding/);
  assert.equal(document.querySelector('.sw-model[data-this="true"] h4')!.textContent, "Static embedding");
  assert.equal(document.querySelector(".sd-cases li:nth-child(2)")!.getAttribute("data-state"), "miss");
});

test("a perfect run reaches the maximum, records the best, and plays again from zero", async () => {
  const user = userEvent.setup();
  render(<SameWordGame />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  for (const [i, r] of ROUNDS.entries()) await solve(user, r, i === ROUNDS.length - 1);
  const max = maxScore(ROUNDS);
  assert.match(document.querySelector(".sd-final .cr-verdict")!.textContent!, new RegExp(`^${max} of ${max} points`));
  assert.ok(screen.getByText(new RegExp(`Both answers right in ${ROUNDS.length} of ${ROUNDS.length} rounds · a new best`)));
  assert.ok(screen.getByText("What to take away"));
  assert.ok(screen.getByText(/it does not guarantee understanding/));
  assert.equal(localStorage.getItem("same-word:best"), String(max));

  await user.click(screen.getByRole("button", { name: "Play again" }));
  assert.equal(document.querySelector(".cr-score b")!.textContent, "0");
  assert.equal((screen.getByRole("button", { name: "Submit answer" }) as HTMLButtonElement).disabled, true);
  assert.equal((screen.getByRole("radio", { name: /^Same representation/ }) as HTMLInputElement).checked, false);
});

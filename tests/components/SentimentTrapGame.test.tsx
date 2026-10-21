// Sentiment Trap played through its component: the data holds the brief's
// results, every challenge has one right answer and a reason for each wrong
// one, every number the explanations quote is read from the data file
// analysis/week07_sentiment_trap.py writes, and a full game scores, ends on
// the takeaway, and plays again.
import "./dom";
import "./coldReadData";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CHALLENGES, POINTS, reflection } from "@/features/sentiment-trap/challenges";
import { type SentimentTrapData, score3, signed } from "@/features/sentiment-trap/data";
import { SentimentTrapGame } from "@/features/sentiment-trap/SentimentTrapGame";

const data = JSON.parse(readFileSync(new URL("../../public/play/week07/data/sentiment_trap.json", import.meta.url), "utf8")) as SentimentTrapData;

beforeEach(() => {
  localStorage.clear();
  document.cookie = `${encodeURIComponent("sentiment-trap:best")}=; max-age=0; path=/`;
});

test("the data reproduces the brief's contextual-model results", () => {
  const s = data.sentences;
  assert.deepEqual([s.good.contextual.label, score3(s.good.contextual.score)], ["POSITIVE", "1.000"]);
  assert.deepEqual([s.negation.contextual.label, score3(s.negation.contextual.score)], ["NEGATIVE", "1.000"]);
  assert.deepEqual([s.sarcasm.contextual.label, score3(s.sarcasm.contextual.score)], ["POSITIVE", "0.998"]);
  assert.deepEqual([s.confidence.contextual.label, score3(s.confidence.contextual.score)], ["POSITIVE", "0.999"]);
  assert.equal(data.pages.total, 303);
  assert.equal(data.pages.negative.contextual, 179);
  assert.deepEqual(
    data.pages.named.map((n) => `${n.name} ${n.label} ${score3(n.score)}`),
    ["Jubilee NEGATIVE 0.987", "Doctor Strange NEGATIVE 0.931", "Storm POSITIVE 1.000"],
  );
});

test("each challenge's trap is real in the data", () => {
  const s = data.sentences;
  // Negation: the plain sum misses "not", the other two catch it.
  assert.equal(s.negation.lexicon.label, "POSITIVE");
  assert.equal(s.negation.classifier.label, "NEGATIVE");
  assert.equal(s.negation.words.find((w) => w.w === "not")?.valence, null, "“not” has no score in the word list");
  // Sarcasm and the hero: every instrument says positive.
  for (const k of ["sarcasm", "confidence"] as const) for (const i of ["lexicon", "classifier", "contextual"] as const) assert.equal(s[k][i].label, "POSITIVE", `${k} ${i}`);
  // Domain: the instruments disagree on the shown page.
  const p = data.pages.shown;
  assert.equal(p.contextual.label, "NEGATIVE");
  assert.equal(p.lexicon.label, "POSITIVE");
  assert.ok(data.pages.allAgree < data.pages.total);
});

test("every challenge has four answers, one right, and a reason for each wrong one", () => {
  assert.deepEqual(
    CHALLENGES.map((c) => c.id),
    ["negation", "sarcasm", "confidence", "domain"],
  );
  for (const c of CHALLENGES) {
    const options = c.options(data);
    assert.equal(options.length, 4, c.id);
    assert.equal(new Set(options.map((o) => o.id)).size, 4, c.id);
    assert.equal(options.filter((o) => o.id === c.answer).length, 1, c.id);
    for (const o of options) assert.equal(Boolean(o.why), o.id !== c.answer, `${c.id}/${o.id}`);
  }
  assert.notDeepEqual(
    CHALLENGES.map((c) => c.options(data).findIndex((o) => o.id === c.answer)),
    [0, 0, 0, 0],
    "the right answer moves",
  );
});

test("the explanations quote the data", () => {
  const [negation, sarcasm, confidence, domain] = CHALLENGES.map((c) => c.explain(data));
  const s = data.sentences;
  assert.match(negation, new RegExp(`the sum stays \\${signed(s.negation.lexicon.sum)}`));
  assert.ok(negation.includes(`P(positive) ${s.negation.classifier.p.toFixed(2)}`));
  assert.ok(sarcasm.includes(`POSITIVE at ${score3(s.sarcasm.contextual.score)}`));
  assert.ok(confidence.includes(`the sum is ${signed(s.confidence.lexicon.sum)}`));
  const n = data.pages.negative;
  assert.ok(domain.includes(`calls ${n.contextual} NEGATIVE, the classifier ${n.classifier} and the word sum ${n.lexicon}`));
  assert.ok(domain.includes(`agree on only ${data.pages.allAgree}`));
  const r = reflection(data);
  assert.equal(r.question, `The contextual model labels ${n.contextual} of the ${data.pages.total} Marvel Wikipedia pages NEGATIVE. Does that mean the Marvel corpus is negative in sentiment?`);
  assert.ok(r.explain.includes("Jubilee comes back NEGATIVE at 0.987, Doctor Strange comes back NEGATIVE at 0.931 and Storm comes back POSITIVE at 1.000."));
});

test("a full game: inspect, answer, feedback, takeaway, reflection, play again", async () => {
  const user = userEvent.setup();
  render(<SentimentTrapGame data={data} />);
  await user.click(screen.getByRole("button", { name: "Start challenge →" }));

  // Inspecting is optional and lights the scored words.
  const words = screen.getByRole("button", { name: "Word scores" });
  assert.equal(words.getAttribute("aria-pressed"), "false");
  await user.click(words);
  assert.equal(words.getAttribute("aria-pressed"), "true");
  assert.ok(screen.getByText("no score", { selector: "small" }));

  for (const [i, c] of CHALLENGES.entries()) {
    assert.ok(screen.getByRole("heading", { name: new RegExp(`Challenge ${i + 1} — ${c.title}`) }));
    const submit = screen.getByRole("button", { name: "Submit answer →" });
    assert.equal((submit as HTMLButtonElement).disabled, true, "nothing chosen yet");
    const options = c.options(data);
    // The first challenge is answered wrong, the rest right.
    const pick = i === 0 ? options.find((o) => o.id !== c.answer)! : options.find((o) => o.id === c.answer)!;
    await user.click(screen.getByRole("radio", { name: pick.text }));
    await user.click(submit);
    if (i === 0) {
      assert.ok(screen.getByText("Look closer"));
      assert.ok(screen.getByText(pick.why!));
    } else assert.ok(screen.getByText("Good catch"));
    assert.ok(screen.getByText(c.lesson));
    await user.click(screen.getByRole("button", { name: i + 1 < CHALLENGES.length ? "Next challenge →" : "See the takeaway →" }));
  }

  assert.ok(screen.getByRole("heading", { name: "A score is not a measurement" }));
  const afterFour = 3 * POINTS.correct + POINTS.bonus;
  assert.ok(screen.getByText(String(afterFour), { selector: ".cr-verdict" , exact: false }));
  await user.click(screen.getByRole("radio", { name: "No." }));
  await user.click(screen.getByRole("button", { name: "Check" }));
  assert.ok(screen.getByText(new RegExp(`Right, \\+${POINTS.reflection}`)));
  assert.ok(screen.getByText(String(afterFour + POINTS.reflection), { selector: ".cr-verdict", exact: false }));

  await user.click(screen.getByRole("button", { name: "Play again" }));
  assert.ok(screen.getByRole("heading", { name: /Challenge 1 — Negation/ }));
});

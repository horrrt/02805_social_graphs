// Semantic Search Detective: the cases' hand-set scores agree with their
// answers and with what each case's text claims, and the game plays through
// predict, inspect and explore to the results and back again.
import "./dom";
import "./coldReadData";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { bonusReason, keywordLine, SearchDetectiveGame } from "@/features/search-detective/SearchDetectiveGame";
import { byMapDistance, bySimilarity, keywordMisses, keywordTop, maxScore, POINTS, ROUNDS, scorePick, shared } from "@/features/search-detective/rounds";

const round = (id: string) => ROUNDS.find((r) => r.id === id)!;

beforeEach(() => localStorage.clear());

test("every case has four cards with distinct illustrative scores, and its answer scores highest", () => {
  assert.ok(ROUNDS.length >= 5 && ROUNDS.length <= 7);
  for (const r of ROUNDS) {
    assert.equal(r.docs.length, 4, r.id);
    assert.equal(new Set(r.docs.map((d) => d.key)).size, 4, r.id);
    const cos = r.docs.map((d) => d.cos);
    assert.equal(new Set(cos).size, 4, `${r.id}: no tied scores`);
    for (const c of cos) assert.ok(c > 0 && c < 1, `${r.id}: ${c} is a cosine between 0 and 1`);
    const ranked = bySimilarity(r);
    assert.equal(r.accept[0], ranked[0].key, `${r.id}: the first accepted pick is the top score`);
    // An accepted runner-up must sit right behind the top, within 0.05.
    r.accept.forEach((k, i) => assert.equal(ranked[i].key, k, `${r.id}: accepted picks are the top ranks`));
    if (r.accept.length > 1) assert.ok(ranked[0].cos - ranked[1].cos <= 0.05, `${r.id}: an ambiguous case is a near-tie`);
    assert.notEqual(r.docs[0].key, ranked[0].key, `${r.id}: the answer is not dealt first`);
  }
});

test("the cases cover the kinds the game promises", () => {
  assert.ok(ROUNDS.some((r) => r.accept.length > 1), "an ambiguous case");
  assert.ok(ROUNDS.filter(keywordMisses).length >= 3, "cases where keyword search misses");
  assert.ok(ROUNDS.some((r) => !keywordMisses(r)), "a case where keywords and meaning agree");
  assert.ok(ROUNDS.some((r) => byMapDistance(r)[0].key !== bySimilarity(r)[0].key), "a case where the map misleads");
  assert.ok(ROUNDS.some((r) => bySimilarity(r)[0] && shared(r.query, bySimilarity(r)[0]).length === 0), "a top result sharing no word");
});

test("each case's map sentence names the nearest point and says whether it is the top result", () => {
  for (const r of ROUNDS) {
    const nearest = byMapDistance(r)[0];
    const top = bySimilarity(r)[0];
    assert.ok(r.map.includes(nearest.title), `${r.id}: names ${nearest.title}`);
    if (nearest.key !== top.key) assert.match(r.map, /yet/, `${r.id}: says the map and the cosine disagree`);
    else assert.doesNotMatch(r.map, /yet/, `${r.id}: does not claim a disagreement`);
  }
});

test("keyword search is computed from the exact words", () => {
  assert.deepEqual(keywordTop(round("fly")).map((d) => d.key), ["fishing"]);
  assert.deepEqual(shared("A character who can fly", round("fly").docs.find((d) => d.key === "falcon")!), []);
  assert.deepEqual(keywordTop(round("weather")).map((d) => d.key).sort(), ["forecast", "storm", "thor"]);
  assert.equal(keywordTop(round("wakanda")).length, 4, "every card shares one word");
  assert.deepEqual(keywordTop(round("widow")).map((d) => d.key), ["spider"]);
  assert.equal(keywordMisses(round("widow")), false);
  assert.equal(keywordLine(round("fly")), "Keyword search would put Fly fishing first, because it shares “fly” with the query.");
  assert.equal(keywordLine(round("weather")), "Keyword search cannot separate Thor, Storm and Weather forecasting: each shares 1 word with the query.");
  assert.equal(bonusReason(round("fly")), "keyword search ranks Fly fishing first");
  assert.equal(bonusReason(round("weather")), "keyword search cannot single this one out");
});

test("picks score the hit, the bonus, the runner-up and a miss", () => {
  assert.deepEqual(scorePick(round("fly"), "falcon"), { grade: "hit", points: POINTS.hit + POINTS.bonus, bonus: POINTS.bonus });
  assert.deepEqual(scorePick(round("fly"), "hawkeye"), { grade: "near", points: POINTS.near, bonus: 0 });
  assert.deepEqual(scorePick(round("fly"), "fishing"), { grade: "miss", points: 0, bonus: 0 });
  // Either meaning of an ambiguous query is a hit; only the top earns a bonus, and here keywords find it too.
  assert.deepEqual(scorePick(round("widow"), "natasha"), { grade: "hit", points: POINTS.hit, bonus: 0 });
  assert.equal(maxScore(ROUNDS), ROUNDS.length * POINTS.hit + ROUNDS.filter(keywordMisses).length * POINTS.bonus);
});

const top = (i: number) => bySimilarity(ROUNDS[i])[0];

async function solve(user: ReturnType<typeof userEvent.setup>, i: number, key = top(i).key) {
  const doc = ROUNDS[i].docs.find((d) => d.key === key)!;
  await user.click(screen.getByRole("radio", { name: new RegExp(`^${doc.title}`) }));
  await user.click(screen.getByRole("button", { name: "Submit answer" }));
  await user.click(screen.getByRole("button", { name: "Explore the map →" }));
  await user.click(screen.getByRole("button", { name: i + 1 < ROUNDS.length ? "Next case →" : "See the results" }));
}

test("a case plays through predict, inspect and explore", async () => {
  const user = userEvent.setup();
  render(<SearchDetectiveGame />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  assert.ok(screen.getByText(ROUNDS[0].query));
  const submit = screen.getByRole("button", { name: "Submit answer" }) as HTMLButtonElement;
  assert.equal(submit.disabled, true, "nothing to submit before a pick");

  await user.click(screen.getByRole("radio", { name: /^Storm/ }));
  await user.click(submit);
  const stamp = document.querySelector(".cr-stamp")!.textContent;
  assert.equal(stamp, `Case solved · +${POINTS.hit + POINTS.bonus}`);
  const rows = [...document.querySelectorAll(".sd-bars li .sd-bar-title")].map((el) => el.firstChild!.textContent);
  assert.deepEqual(rows, bySimilarity(ROUNDS[0]).map((d) => d.title), "ranked by the cosine");
  assert.ok(screen.getByText(/illustrative, set by hand/), "the scores say they are illustrative");
  assert.ok(screen.getByText(/your pick/));
  assert.equal(document.querySelector(".cr-score b")!.textContent, String(POINTS.hit + POINTS.bonus));

  await user.click(screen.getByRole("button", { name: "Explore the map →" }));
  const detail = () => document.querySelector(".sd-detail")!;
  assert.ok(within(detail() as HTMLElement).getByRole("heading", { name: "Storm" }), "opens on the top result");
  await user.click(screen.getByRole("button", { name: "Thor" }));
  assert.ok(within(detail() as HTMLElement).getByRole("heading", { name: "Thor" }));
  assert.match(detail().textContent!, /0\.72 \(rank 2 of 4\)/);
  assert.match(detail().textContent!, /rank 1 of 4/, "Thor is nearest on the map");
  assert.equal(document.querySelector(".sd-compare")!.getAttribute("data-agree"), "false");
  await user.click(screen.getByRole("button", { name: "Your query" }));
  assert.ok(within(detail() as HTMLElement).getByText(/embedded the same way/));
});

test("the map's points answer the keyboard", async () => {
  const user = userEvent.setup();
  render(<SearchDetectiveGame />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  await user.keyboard("1");
  assert.equal((screen.getByRole("radio", { name: /^Thor/ }) as HTMLInputElement).checked, true, "key 1 picks the first card");
  await user.click(screen.getByRole("button", { name: "Submit answer" }));
  assert.equal(document.querySelector(".cr-stamp")!.textContent, `Close · +${POINTS.near}`);
  await user.click(screen.getByRole("button", { name: "Explore the map →" }));
  screen.getByRole("button", { name: "Human Torch" }).focus();
  await user.keyboard("{Enter}");
  assert.equal(screen.getByRole("button", { name: "Human Torch" }).getAttribute("aria-pressed"), "true");
});

test("a perfect run reaches the maximum, records the best, and plays again from zero", async () => {
  const user = userEvent.setup();
  render(<SearchDetectiveGame />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  for (let i = 0; i < ROUNDS.length; i++) await solve(user, i);
  const max = maxScore(ROUNDS);
  assert.match(document.querySelector(".sd-final .cr-verdict")!.textContent!, new RegExp(`^${max} of ${max} points`));
  assert.ok(screen.getByText(new RegExp(`${ROUNDS.length} of ${ROUNDS.length} cases solved · a new best`)));
  assert.ok(screen.getByText("What semantic search can and cannot promise"));
  assert.equal(localStorage.getItem("search-detective:best"), String(max));

  await user.click(screen.getByRole("button", { name: "Play again" }));
  assert.ok(screen.getByText(ROUNDS[0].query));
  assert.equal(document.querySelector(".cr-score b")!.textContent, "0");
  assert.equal((screen.getByRole("button", { name: "Submit answer" }) as HTMLButtonElement).disabled, true);
});

test("misses show the best answer in the results", async () => {
  const user = userEvent.setup();
  render(<SearchDetectiveGame />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  for (let i = 0; i < ROUNDS.length; i++) await solve(user, i, bySimilarity(ROUNDS[i])[3].key);
  assert.match(document.querySelector(".sd-final .cr-verdict")!.textContent!, /^0 of/);
  const first = document.querySelector(".sd-final-list li")!;
  assert.equal(first.getAttribute("data-grade"), "miss");
  assert.match(first.textContent!, new RegExp(`best: ${top(0).title}`));
});
